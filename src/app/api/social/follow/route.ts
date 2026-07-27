import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social/follow?tiendaId=
 * ¿El cliente actual sigue esta tienda? + total de seguidores.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tiendaId = searchParams.get('tiendaId');
    if (!tiendaId) return NextResponse.json({ error: 'tiendaId requerido' }, { status: 400 });

    const user = await getSessionUser();
    const [total, mine] = await Promise.all([
      db.tiendaFollow.count({ where: { tiendaId } }),
      user
        ? db.tiendaFollow.findUnique({
            where: { clienteId_tiendaId: { clienteId: user.id, tiendaId } },
          })
        : null,
    ]);

    return NextResponse.json({ total, following: !!mine });
  } catch (error) {
    console.error('[FOLLOW_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/social/follow
 * Body: { tiendaId }
 * Toggle follow.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const tiendaId = String(body.tiendaId ?? '');
    if (!tiendaId) return NextResponse.json({ error: 'tiendaId requerido' }, { status: 400 });

    const existing = await db.tiendaFollow.findUnique({
      where: { clienteId_tiendaId: { clienteId: user.id, tiendaId } },
    });

    if (existing) {
      await db.tiendaFollow.delete({ where: { id: existing.id } });
      const total = await db.tiendaFollow.count({ where: { tiendaId } });
      return NextResponse.json({ following: false, total });
    } else {
      await db.tiendaFollow.create({ data: { clienteId: user.id, tiendaId } });
      await db.actividadUsuario.create({
        data: {
          userId: user.id,
          tipo: 'follow',
          descripcion: 'Empezó a seguir una tienda',
          entidadTipo: 'tienda',
          entidadId: tiendaId,
        },
      });
      const total = await db.tiendaFollow.count({ where: { tiendaId } });
      return NextResponse.json({ following: true, total });
    }
  } catch (error) {
    console.error('[FOLLOW_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
