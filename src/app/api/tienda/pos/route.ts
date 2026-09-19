import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { buscarTiendaCompleta } from '@/lib/auth/tienda-acceso';

export const dynamic = 'force-dynamic';

interface ItemVentaInput {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
}

/**
 * Error de negocio del POS: existencias insuficientes detectadas dentro de la
 * transacción (el stock cambió después de la validación previa). Se mapea a 400,
 * nunca a 500, y provoca el rollback completo de la venta.
 */
class ErrorStockPOS extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorStockPOS';
  }
}

/**
 * POST /api/tienda/pos
 * Procesa una venta en el Punto de Venta (POS):
 * - Registra la venta VentaPOS
 * - Descuenta el stock de cada producto y crea los registros de salida en Kardex
 * - Devuelve los datos completos del ticket/factura listos para imprimir o visualizar
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

    const body = await req.json();
    const {
      clienteNombre = 'Cliente General',
      clienteRuc = '',
      clienteTelefono = '',
      clienteId = '',
      metodoPago = 'efectivo',
      descuento = 0,
      montoRecibido = 0,
      items = [],
      notas = '',
    } = body;

    const itemsInput = items as ItemVentaInput[];
    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
      return NextResponse.json({ ok: false, error: 'El carrito POS no contiene productos' }, { status: 400 });
    }

    // Validar productos, consultar precio oficial en BD y armar items (VULN-02)
    let subtotal = 0;
    const itemsFormatted: Array<{
      productoId: string;
      nombreProducto: string;
      cantidad: number;
      precioUnitario: number;
      costoUnitario: number;
      subtotal: number;
    }> = [];

    for (const it of itemsInput) {
      const cant = Math.max(1, Number(it.cantidad) || 1);
      if (!it.productoId) {
        return NextResponse.json({ ok: false, error: 'Cada item debe tener productoId' }, { status: 400 });
      }

      const prod = await db.producto.findUnique({
        where: { id: it.productoId },
      });

      if (!prod || prod.tiendaId !== tienda.id) {
        return NextResponse.json(
          { ok: false, error: `Producto no encontrado o no pertenece a la tienda: ${it.nombreProducto || it.productoId}` },
          { status: 400 }
        );
      }

      // Validar existencias: stock === null => el producto no gestiona stock y la venta se permite
      if (prod.stock !== null && prod.stock < cant) {
        return NextResponse.json(
          { ok: false, error: 'Stock insuficiente para "' + prod.nombre + '". Disponible: ' + prod.stock },
          { status: 400 }
        );
      }

      // PRECIO AUTORITATIVO DEL SERVIDOR (ignora el enviado por el cliente para evitar parameter tampering)
      const precioOficial = prod.precio;
      const sub = cant * precioOficial;
      subtotal += sub;

      itemsFormatted.push({
        productoId: prod.id,
        nombreProducto: prod.nombre,
        cantidad: cant,
        precioUnitario: precioOficial,
        costoUnitario: prod.costo || 0,
        subtotal: sub,
      });
    }

    const descNum = Math.max(0, Number(descuento) || 0);
    const total = Math.max(0, subtotal - descNum);
    const montoRecibidoNum = Number(montoRecibido) || total;
    const cambioDado = Math.max(0, montoRecibidoNum - total);

    const comprobanteNum = `POS-${Date.now().toString().slice(-6)}`;

    // PIN único de la factura (4 dígitos): se confirma para autorizar devoluciones.
    let codigoPin = String(Math.floor(1000 + Math.random() * 9000));
    const pinDuplicado = await db.ventaPOS.findFirst({ where: { tiendaId: tienda.id, codigoPin } });
    if (pinDuplicado) codigoPin = String(Math.floor(1000 + Math.random() * 9000));

    // 1 y 2. Crear venta y decrementar stock en una transacción atómica (ACID)
    const venta = await db.$transaction(async (tx) => {
      const v = await tx.ventaPOS.create({
        data: {
          tiendaId: tienda.id,
          numeroComprobante: comprobanteNum,
          codigoPin,
          clienteNombre,
          clienteRuc,
          clienteTelefono,
          metodoPago,
          subtotal,
          descuento: descNum,
          total,
          montoRecibido: montoRecibidoNum,
          cambioDado,
          notas,
          vendedorId: user.id,
          clienteId: typeof clienteId === 'string' && clienteId ? clienteId : null,
          tiendaZona: (() => {
            try {
              const z = JSON.parse(tienda.zonaCobertura || '[]');
              return z[0] || tienda.direccion;
            } catch {
              return tienda.direccion;
            }
          })(),
          tiendaCategoria: tienda.categoria,
          facturaUrlPdf: '',
          items: {
            create: itemsFormatted.map((it) => ({
              productoId: it.productoId,
              nombreProducto: it.nombreProducto,
              cantidad: it.cantidad,
              precioUnitario: it.precioUnitario,
              subtotal: it.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // URL canónica del PDF de esta factura (se genera bajo demanda en el endpoint)
      await tx.ventaPOS.update({
        where: { id: v.id },
        data: { facturaUrlPdf: `/api/tienda/facturas/${v.id}/pdf` },
      });

      for (const item of itemsFormatted) {
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (prod) {
          // stock === null => el producto no gestiona stock: se vende sin tocar existencias
          const gestionaStock = prod.stock !== null;
          const stockActual = prod.stock ?? 0;
          const nuevoStock = gestionaStock ? stockActual - item.cantidad : stockActual;

          if (nuevoStock < 0) {
            // Corte atómico: se aborta la venta completa (sin stock negativo y sin Kardex divergente)
            throw new ErrorStockPOS(
              `Stock insuficiente para "${item.nombreProducto}". Disponible: ${stockActual}`
            );
          }

          if (gestionaStock) {
            await tx.producto.update({
              where: { id: item.productoId },
              data: { stock: nuevoStock },
            });
          }

          await tx.kardexMovimiento.create({
            data: {
              tiendaId: tienda.id,
              productoId: item.productoId,
              tipo: 'VENTA_POS',
              cantidad: item.cantidad,
              stockAnterior: stockActual,
              stockNuevo: nuevoStock,
              costoUnitario: item.costoUnitario,
              precioVenta: item.precioUnitario,
              motivo: `Venta POS #${comprobanteNum}`,
              usuarioId: user.id,
            },
          });
        }
      }

      return v;
    });

    // 3. Devolver datos estructurados de la factura/comprobante
    return NextResponse.json({
      ok: true,
      venta,
      factura: {
        numeroComprobante: comprobanteNum,
        codigoPin,
        fecha: new Date().toLocaleDateString('es-NI', { dateStyle: 'medium' }),
        hora: new Date().toLocaleTimeString('es-NI', { timeStyle: 'short' }),
        tiendaNombre: tienda.nombre,
        tiendaRuc: tienda.ruc || 'J0310000000000',
        razonSocial: tienda.razonSocial || tienda.nombre,
        regimenDgi: tienda.regimenDgi || 'Cuota Fija',
        direccion: tienda.direccion,
        telefono: tienda.telefono || '',
        clienteNombre,
        clienteRuc,
        metodoPago,
        facturaUrlPdf: `/api/tienda/facturas/${venta.id}/pdf`,
        items: itemsFormatted,
        subtotal,
        descuento: descNum,
        total,
        montoRecibido: montoRecibidoNum,
        cambioDado,
        saludoFactura: tienda.saludoFactura || '¡Gracias por su compra!',
        piePaginaFactura: tienda.piePaginaFactura || 'Conservar este ticket para reclamos.',
        pieMarcaLogifast: tienda.pieMarcaLogifast || 'Generado por LogiFast PWA - Sistema POS & E-Commerce',
      },
    });
  } catch (error) {
    if (error instanceof ErrorStockPOS) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error('[TIENDA_POS_POST_ERROR]', error);
    return NextResponse.json({ ok: false, error: 'Error al procesar venta POS' }, { status: 500 });
  }
}
