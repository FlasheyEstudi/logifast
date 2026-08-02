import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { ok } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/tienda/pedidos
 * Devuelve los pedidos recibidos por la tienda del cliente autenticado.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return ok({ ok: true, pedidos: [] });
    }

    try {
      const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
      if (!tienda) {
        return ok({ ok: true, pedidos: [] });
      }

      const ordenes = await db.ordenCompra.findMany({
        where: { tiendaId: tienda.id },
        orderBy: { createdAt: 'desc' },
        include: { items: true, cliente: true },
      });

      return ok({ ok: true, pedidos: ordenes });
    } catch (dbErr) {
      console.warn('[CLIENTE_TIENDA_PEDIDOS_DB]', dbErr);
    }

    return ok({ ok: true, pedidos: [] });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_PEDIDOS]', error);
    return ok({ ok: true, pedidos: [] });
  }
}

/**
 * PATCH /api/cliente/tienda/pedidos (P0-29)
 * Actualiza el estado de un pedido recibido en la tienda del cliente autenticado.
 * Body: { id, estado }
 * estados válidos: 'recibido', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado'
 * Transiciones válidas:
 *   recibido → preparando | cancelado
 *   preparando → listo | cancelado
 *   listo → en_camino | cancelado
 *   en_camino → entregado
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
      return NextResponse.json({ error: 'Se requiere id y estado' }, { status: 400 });
    }

    const estadosValidos = ['recibido', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    // Obtener la tienda del cliente
    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) {
      return NextResponse.json({ error: 'No tienes una tienda' }, { status: 404 });
    }

    // Validar ownership del pedido
    const orden = await db.ordenCompra.findUnique({
      where: { id },
      select: { id: true, tiendaId: true, estado: true },
    });
    if (!orden) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    if (orden.tiendaId !== tienda.id) {
      return NextResponse.json({ error: 'No autorizado para este pedido' }, { status: 403 });
    }

    // Validar transición de estado (state machine)
    const transicionesValidas: Record<string, string[]> = {
      recibido: ['preparando', 'cancelado'],
      preparando: ['listo', 'cancelado'],
      listo: ['en_camino', 'cancelado'],
      en_camino: ['entregado'],
      entregado: [],
      cancelado: [],
    };
    const permitidas = transicionesValidas[orden.estado] ?? [];
    if (!permitidas.includes(estado)) {
      return NextResponse.json(
        { error: `Transición no válida: ${orden.estado} → ${estado}. Permitidas: ${permitidas.join(', ') || 'ninguna'}` },
        { status: 400 }
      );
    }

    const updated = await db.ordenCompra.update({
      where: { id },
      data: { estado },
    });

    return NextResponse.json({ ok: true, pedido: updated });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_PEDIDOS_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 });
  }
}
