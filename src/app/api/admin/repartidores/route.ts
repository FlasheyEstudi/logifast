import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/repartidores
 * Returns all driver profiles with user details.
 */
export async function GET() {
  try {
    const profiles = await db.repartidorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            telefono: true,
            fotoUrl: true,
            initials: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('[ADMIN_REPARTIDORES_GET]', error);
    return NextResponse.json({ error: 'Error al obtener repartidores' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/repartidores
 * Updates driver profile settings, status, or balance.
 */
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { id, conectado, enServicio, pausado, contratoAceptado, saldo, zonaPreferida } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de repartidor requerido' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (conectado !== undefined) updateData.conectado = Boolean(conectado);
    if (enServicio !== undefined) updateData.enServicio = Boolean(enServicio);
    if (pausado !== undefined) updateData.pausado = Boolean(pausado);
    if (contratoAceptado !== undefined) updateData.contratoAceptado = Boolean(contratoAceptado);
    if (saldo !== undefined) updateData.saldo = Number(saldo);
    if (zonaPreferida !== undefined) updateData.zonaPreferida = String(zonaPreferida);

    const updatedProfile = await db.repartidorProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('[ADMIN_REPARTIDORES_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar repartidor' }, { status: 500 });
  }
}
