import { NextRequest, NextResponse } from 'next/server';
import { runtimeState } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/notificaciones
 * Devuelve la lista de notificaciones del repartidor + contador de no leídas.
 */
export async function GET() {
  try {
    const notificaciones = runtimeState.notificaciones;
    const noLeidas = notificaciones.filter((n) => !n.leido).length;
    return NextResponse.json({
      total: notificaciones.length,
      noLeidas,
      notificaciones,
    });
  } catch (error) {
    console.error('[REPARTIDOR_NOTIFICACIONES_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener las notificaciones' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/repartidor/notificaciones
 * Marca todas (o una específica vía body.id) como leídas.
 * Body opcional: { id?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id } = (body ?? {}) as { id?: string };

    if (id) {
      runtimeState.notificaciones = runtimeState.notificaciones.map((n) =>
        n.id === id ? { ...n, leido: true } : n
      );
    } else {
      runtimeState.notificaciones = runtimeState.notificaciones.map((n) => ({
        ...n,
        leido: true,
      }));
    }

    const noLeidas = runtimeState.notificaciones.filter((n) => !n.leido).length;
    return NextResponse.json({
      ok: true,
      marcado: id ? 'uno' : 'todos',
      noLeidas,
    });
  } catch (error) {
    console.error('[REPARTIDOR_NOTIFICACIONES_PATCH]', error);
    return NextResponse.json(
      { error: 'Error al marcar las notificaciones' },
      { status: 500 }
    );
  }
}
