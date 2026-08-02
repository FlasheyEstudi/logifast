import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import type { NotificacionRepartidor } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

function tiempoRelativo(fecha: Date): string {
  const diff = Date.now() - fecha.getTime();
  if (diff < 60_000) return 'ahora';
  if (diff < 3600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86400_000) return `hace ${Math.floor(diff / 3600_000)} h`;
  const dias = Math.floor(diff / 86400_000);
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

/**
 * GET /api/repartidor/notificaciones
 * Devuelve las notificaciones del repartidor + contador de no leídas.
 */
export async function GET() {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const notifs = await db.notificacionRepartidor.findMany({
      where: { repartidorId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const result: NotificacionRepartidor[] = notifs.map((n) => ({
      id: n.id,
      tipo: n.tipo as NotificacionRepartidor['tipo'],
      titulo: n.titulo,
      contenido: n.contenido,
      leido: n.leido,
      ordenId: n.ordenId ?? undefined,
      tiempo: tiempoRelativo(n.createdAt),
    }));

    const noLeidas = notifs.filter((n) => !n.leido).length;

    return NextResponse.json({
      notificaciones: result,
      noLeidas,
    });
  } catch (error) {
    console.error('[REPARTIDOR_NOTIFICACIONES_GET]', error);
    return NextResponse.json({
      notificaciones: [],
      noLeidas: 0,
    });
  }
}

/**
 * PATCH /api/repartidor/notificaciones
 * Marca todas como leídas (o una en específico con { id }).
 */
export async function PATCH(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const body = await req.json().catch(() => ({}));
    if (body?.id) {
      await db.notificacionRepartidor.updateMany({
        where: { id: String(body.id), repartidorId: profile.id },
        data: { leido: true },
      });
    } else {
      await db.notificacionRepartidor.updateMany({
        where: { repartidorId: profile.id, leido: false },
        data: { leido: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[REPARTIDOR_NOTIFICACIONES_PATCH]', error);
    return NextResponse.json(
      { error: 'Error al marcar notificaciones' },
      { status: 500 }
    );
  }
}
