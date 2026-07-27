import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notificaciones-push
 * Notificaciones push del usuario autenticado.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const notifs = await db.notificacionPush.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const noLeidas = notifs.filter((n) => !n.leida).length;

    return NextResponse.json({ notificaciones: notifs, noLeidas });
  } catch (error) {
    console.error('[NOTIFS_PUSH_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/notificaciones-push
 * Body: { id? } → marca como leída (todas o una).
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (body.id) {
      await db.notificacionPush.updateMany({
        where: { id: String(body.id), userId: user.id },
        data: { leida: true },
      });
    } else {
      await db.notificacionPush.updateMany({
        where: { userId: user.id, leida: false },
        data: { leida: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[NOTIFS_PUSH_PATCH]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
