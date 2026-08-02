import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { ok } from '@/lib/auth/helpers';
import { emitOrdenActualizada } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/tienda/pedidos
 * Devuelve los pedidos recibidos por la tienda del cliente autenticado.
 */
export async function GET(_req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return ok({ ok: true, pedidos: [] });
    }

    const tienda = await db.tienda.findFirst({
      where: { OR: [{ duenoId: user.id }, { propietarioId: user.id }] },
    });
    if (!tienda) {
      return ok({ ok: true, pedidos: [] });
    }

    const ordenes = await db.ordenCompra.findMany({
      where: { tiendaId: tienda.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true, cliente: true },
    });

    return ok({ ok: true, pedidos: ordenes });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_PEDIDOS_GET]', error);
    return ok({ ok: true, pedidos: [] });
  }
}

/**
 * PATCH /api/cliente/tienda/pedidos
 * Actualiza el estado de un pedido de la tienda con validación de transiciones de estado.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return NextResponse.json({ error: 'ID y estado son requeridos' }, { status: 400 });
    }

    const VALID_STATES = ['preparando', 'listo', 'en_camino', 'entregado'];
    if (!VALID_STATES.includes(estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Debe ser uno de: ${VALID_STATES.join(', ')}` },
        { status: 400 }
      );
    }

    const orden = await db.ordenCompra.findUnique({
      where: { id },
      include: { tienda: true },
    });

    if (!orden) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const isOwner = orden.tienda.duenoId === user.id || orden.tienda.propietarioId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado para actualizar este pedido' }, { status: 403 });
    }

    const stateTransitions: Record<string, string[]> = {
      recibido: ['preparando'],
      preparando: ['listo'],
      listo: ['en_camino'],
      en_camino: ['entregado'],
    };

    const allowedNext = stateTransitions[orden.estado] || [];
    if (!isAdmin && !allowedNext.includes(estado)) {
      return NextResponse.json(
        { error: `Transición de estado no válida de '${orden.estado}' a '${estado}'` },
        { status: 400 }
      );
    }

    const updatedOrder = await db.ordenCompra.update({
      where: { id },
      data: { estado },
    });

    emitOrdenActualizada({ id, estado, tipo: 'compra' });

    return NextResponse.json({ ok: true, pedido: updatedOrder });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_PEDIDOS_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 });
  }
}
