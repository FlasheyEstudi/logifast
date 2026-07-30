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
