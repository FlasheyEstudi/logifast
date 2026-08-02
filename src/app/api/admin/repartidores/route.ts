import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/repartidores
 * Returns all driver profiles with user details.
 */
export async function GET() {
  try {
    await requireRole('admin');
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
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { profiles: [], error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error' },
      { status }
    );
  }
}

/**
 * PATCH /api/admin/repartidores
 * Updates driver profile settings, status, or balance.
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin', 'ingeniero');

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
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al actualizar repartidor' },
      { status }
    );
  }
}
