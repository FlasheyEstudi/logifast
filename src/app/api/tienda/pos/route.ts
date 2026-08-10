import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

interface ItemVentaInput {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
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

    const tienda = await db.tienda.findFirst({
      where: { propietarioId: user.id },
    });

    if (!tienda) {
      return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const body = await req.json();
    const {
      clienteNombre = 'Cliente General',
      clienteRuc = '',
      clienteTelefono = '',
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

    let subtotal = 0;
    const itemsFormatted = itemsInput.map((it) => {
      const cant = Math.max(1, Number(it.cantidad) || 1);
      const precio = Number(it.precioUnitario) || 0;
      const sub = cant * precio;
      subtotal += sub;
      return {
        productoId: it.productoId,
        nombreProducto: it.nombreProducto,
        cantidad: cant,
        precioUnitario: precio,
        subtotal: sub,
      };
    });

    const descNum = Math.max(0, Number(descuento) || 0);
    const total = Math.max(0, subtotal - descNum);
    const montoRecibidoNum = Number(montoRecibido) || total;
    const cambioDado = Math.max(0, montoRecibidoNum - total);

    const comprobanteNum = `POS-${Date.now().toString().slice(-6)}`;

    // 1. Crear la venta POS
    const venta = await db.ventaPOS.create({
      data: {
        tiendaId: tienda.id,
        numeroComprobante: comprobanteNum,
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

    // 2. Descontar stock y registrar salidas en Kardex
    for (const item of itemsFormatted) {
      if (item.productoId) {
        const prod = await db.producto.findUnique({ where: { id: item.productoId } });
        if (prod) {
          const stockActual = prod.stock ?? 0;
          const nuevoStock = Math.max(0, stockActual - item.cantidad);

          await db.producto.update({
            where: { id: item.productoId },
            data: { stock: nuevoStock },
          });

          await db.kardexMovimiento.create({
            data: {
              tiendaId: tienda.id,
              productoId: item.productoId,
              tipo: 'VENTA_POS',
              cantidad: item.cantidad,
              stockAnterior: stockActual,
              stockNuevo: nuevoStock,
              costoUnitario: prod.costo || 0,
              precioVenta: item.precioUnitario,
              motivo: `Venta POS #${comprobanteNum}`,
              usuarioId: user.id,
            },
          }).catch((e) => console.warn('[KARDEX_POS_LOG_ERROR]', e));
        }
      }
    }

    // 3. Devolver datos estructurados de la factura/comprobante
    return NextResponse.json({
      ok: true,
      venta,
      factura: {
        numeroComprobante: comprobanteNum,
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
    console.error('[TIENDA_POS_POST_ERROR]', error);
    return NextResponse.json({ ok: false, error: 'Error al procesar venta POS' }, { status: 500 });
  }
}
