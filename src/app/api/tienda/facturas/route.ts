import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { buscarTiendaCompleta } from '@/lib/auth/tienda-acceso';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tienda/facturas — historial de facturas POS de la tienda para el arqueo.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  const tienda = await buscarTiendaCompleta(user);
  if (!tienda) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });

  try {
    const ventas = await db.ventaPOS.findMany({
      where: { tiendaId: tienda.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { items: true },
    });

    return NextResponse.json({
      ok: true,
      facturas: ventas.map((v) => ({
        id: v.id,
        numeroComprobante: v.numeroComprobante,
        createdAt: v.createdAt,
        total: v.total,
        subtotal: v.subtotal,
        descuento: v.descuento,
        metodoPago: v.metodoPago,
        clienteNombre: v.clienteNombre,
        clienteId: v.clienteId,
        tiendaZona: v.tiendaZona,
        tiendaCategoria: v.tiendaCategoria,
        facturaUrlPdf: v.facturaUrlPdf,
        items: v.items.map((it) => ({
          nombreProducto: it.nombreProducto,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          subtotal: it.subtotal,
        })),
      })),
    });
  } catch (e) {
    console.error('[TIENDA_FACTURAS]', e);
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 });
  }
}
