import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { buscarTiendaCompleta } from '@/lib/auth/tienda-acceso';

export const dynamic = 'force-dynamic';

interface ItemDevolucionInput {
  productoId: string;
  cantidad: number;
  motivo?: string;
}

/**
 * Error de negocio: se responde 400 y la transacción completa se revierte,
 * igual que en el POS — un dato mal tecleado por el operador nunca es un 500.
 */
class ErrorDevolucion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDevolucion';
  }
}

const MAX_UNIDADES_POR_ITEM = 9999;
const MAX_LINEAS = 50;

/**
 * POST /api/tienda/devoluciones
 *
 * Reingresa al inventario unidades devueltas por un cliente:
 * - sube el stock del producto y crea el movimiento de Kardex tipo `DEVOLUCION`
 * - registra el reembolso como una venta negativa en VentaPOS, para que la caja
 *   del día y la exportación CSV no sobreestimen los ingresos
 * - devuelve qué productos quedaron en o por debajo de su stock mínimo
 *
 * Body: { items: [{ productoId, cantidad, motivo? }], referencia?, clienteNombre?, notas? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const tienda = await buscarTiendaCompleta(user);
    if (!tienda) {
      return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      items = [],
      referencia = '',
      clienteNombre = 'Cliente General',
      notas = '',
      pinFactura = '',
    } = body as {
      items?: ItemDevolucionInput[];
      referencia?: string;
      clienteNombre?: string;
      notas?: string;
      pinFactura?: string;
    };

    // Autorización con el PIN único de la factura original: sin PIN no hay devolución.
    const pinLimpio = String(pinFactura ?? '').trim();
    if (!pinLimpio) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere el PIN de la factura para autorizar la devolución' },
        { status: 400 }
      );
    }
    const ventaOrigen = await db.ventaPOS.findFirst({
      where: { tiendaId: tienda.id, codigoPin: pinLimpio },
      select: { id: true, numeroComprobante: true },
    });
    if (!ventaOrigen) {
      return NextResponse.json(
        { ok: false, error: 'PIN de factura inválido: no corresponde a una venta de esta tienda' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'La devolución no contiene productos' }, { status: 400 });
    }
    if (items.length > MAX_LINEAS) {
      return NextResponse.json(
        { ok: false, error: `Demasiadas líneas en una sola devolución (máximo ${MAX_LINEAS})` },
        { status: 400 }
      );
    }

    // Un mismo producto puede venir en dos líneas: se suma antes de tocar la base
    // para no calcular dos veces sobre un stock que ya cambió.
    const cantidades = new Map<string, { cantidad: number; motivo: string }>();
    for (const it of items) {
      const productoId = String(it?.productoId ?? '').trim();
      const cantidad = Math.floor(Number(it?.cantidad));
      if (!productoId) throw new ErrorDevolucion('Hay una línea sin producto');
      if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > MAX_UNIDADES_POR_ITEM) {
        throw new ErrorDevolucion(`Cantidad inválida: ${it?.cantidad}`);
      }
      const previo = cantidades.get(productoId);
      cantidades.set(productoId, {
        cantidad: (previo?.cantidad ?? 0) + cantidad,
        motivo: String(it?.motivo ?? '').trim() || previo?.motivo || 'Devolución de cliente',
      });
    }

    const referenciaLimpia = String(referencia).trim().slice(0, 60);
    const numeroComprobante = `DEV-${Date.now().toString().slice(-8)}`;

    const resultado = await db.$transaction(async (tx) => {
      const lineas: {
        productoId: string;
        nombreProducto: string;
        cantidad: number;
        precioUnitario: number;
        stockAnterior: number;
        stockNuevo: number;
      }[] = [];
      const alertas: {
        productoId: string;
        nombreProducto: string;
        stockNuevo: number;
        stockMinimo: number;
      }[] = [];

      for (const [productoId, { cantidad, motivo }] of cantidades) {
        const prod = await tx.producto.findUnique({ where: { id: productoId } });
        if (!prod || prod.tiendaId !== tienda.id) {
          throw new ErrorDevolucion(`Producto no encontrado o no pertenece a la tienda: ${productoId}`);
        }
        if (prod.stock === null) {
          // stock === null => el producto no gestiona existencias: reingresar
          // unidades ahí sería inventar un número en el Kardex.
          throw new ErrorDevolucion(`"${prod.nombre}" no gestiona stock: no se puede reingresar al inventario`);
        }

        const stockAnterior = prod.stock;
        const stockNuevo = stockAnterior + cantidad;

        await tx.producto.update({ where: { id: prod.id }, data: { stock: stockNuevo } });
        await tx.kardexMovimiento.create({
          data: {
            tiendaId: tienda.id,
            productoId: prod.id,
            tipo: 'DEVOLUCION',
            cantidad,
            stockAnterior,
            stockNuevo,
            precioVenta: prod.precio,
            motivo: referenciaLimpia ? `${motivo} (ref. ${referenciaLimpia})` : motivo,
            usuarioId: user.id,
          },
        });

        lineas.push({
          productoId: prod.id,
          nombreProducto: prod.nombre,
          cantidad,
          precioUnitario: prod.precio,
          stockAnterior,
          stockNuevo,
        });

        if (prod.stockMinimo !== null && stockNuevo <= prod.stockMinimo) {
          alertas.push({
            productoId: prod.id,
            nombreProducto: prod.nombre,
            stockNuevo,
            stockMinimo: prod.stockMinimo,
          });
        }
      }

      const totalDevuelto = lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0);

      // Venta negativa: el reembolso queda en el mismo libro que las ventas para que
      // los reportes y la caja del día cuadren con lo que realmente entró.
      const venta = await tx.ventaPOS.create({
        data: {
          tiendaId: tienda.id,
          numeroComprobante,
          clienteNombre: String(clienteNombre).trim().slice(0, 120) || 'Cliente General',
          metodoPago: 'devolucion',
          subtotal: -totalDevuelto,
          descuento: 0,
          total: -totalDevuelto,
          montoRecibido: 0,
          cambioDado: 0,
          notas: notas
            ? `Devolución: ${String(notas).slice(0, 200)}`
            : referenciaLimpia
              ? `Devolución ref. ${referenciaLimpia}`
              : 'Devolución de mercadería',
          vendedorId: user.id,
          items: {
            create: lineas.map((l) => ({
              productoId: l.productoId,
              nombreProducto: l.nombreProducto,
              cantidad: -l.cantidad,
              precioUnitario: l.precioUnitario,
              subtotal: -(l.precioUnitario * l.cantidad),
            })),
          },
        },
        select: { id: true, numeroComprobante: true },
      });

      return { venta, totalDevuelto, lineas, alertas };
    });

    return NextResponse.json({
      ok: true,
      devolucion: {
        id: resultado.venta.id,
        numeroComprobante: resultado.venta.numeroComprobante,
        totalDevuelto: resultado.totalDevuelto,
        items: resultado.lineas,
        alertasStockBajo: resultado.alertas,
      },
    });
  } catch (err) {
    if (err instanceof ErrorDevolucion) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    console.error('[tienda/devoluciones]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo registrar la devolución' }, { status: 500 });
  }
}
