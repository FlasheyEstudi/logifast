import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/tienda/pedidos?estado=
 * Lista los pedidos de la tienda del cliente.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) return NextResponse.json({ error: 'No tienes tienda' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');

    const where: Record<string, unknown> = { tiendaId: tienda.id };
    if (estado) where.estado = estado;

    const pedidos = await db.ordenCompra.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: true,
        cliente: { select: { id: true, name: true, telefono: true, initials: true, color: true } },
      },
    });

    const result = pedidos.map((p) => ({
      id: p.id,
      clienteNombre: p.cliente?.name ?? 'Cliente',
      clienteTelefono: p.cliente?.telefono ?? '',
      clienteInitials: p.cliente?.initials ?? 'C',
      clienteColor: p.cliente?.color ?? '#FF5722',
      estado: p.estado,
      direccionEntrega: p.direccionEntrega,
      metodoPago: p.metodoPago,
      total: p.total,
      subtotal: p.subtotal,
      costoEnvio: p.costoEnvio,
      descuento: p.descuento,
      items: p.items.map((it) => ({
        nombreProducto: it.nombreProducto,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
      })),
      fecha: p.createdAt.toISOString().slice(0, 10),
      hora: p.createdAt.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false }),
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ pedidos: result, total: result.length });
  } catch (error) {
    console.error('[CLIENTE_PEDIDOS_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/cliente/tienda/pedidos
 * Body: { id, estado }
 * Actualiza el estado de un pedido (recibido → preparando → listo → en_camino → entregado).
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) return NextResponse.json({ error: 'No tienes tienda' }, { status: 404 });

    const body = await req.json();
    const { id, estado } = body;
    if (!id || !estado) return NextResponse.json({ error: 'id y estado requeridos' }, { status: 400 });

    const pedido = await db.ordenCompra.findUnique({ where: { id } });
    if (!pedido || pedido.tiendaId !== tienda.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const estadosValidos = ['recibido', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const updated = await db.ordenCompra.update({ where: { id }, data: { estado } });
    return NextResponse.json({ ok: true, pedido: updated });
  } catch (error) {
    console.error('[CLIENTE_PEDIDOS_PATCH]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
