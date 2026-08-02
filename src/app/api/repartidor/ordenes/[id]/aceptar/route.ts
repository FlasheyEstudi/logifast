import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { emitOrdenActualizada } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/aceptar
 * Repartidor acepta la orden asignada (atómico contra race conditions).
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repData = await getRepartidorProfile();
    if (!repData || !repData.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = repData;

    // Actualización atómica para prevenir race condition entre 2 repartidores
    const updateRes = await db.ordenServicio.updateMany({
      where: {
        id,
        OR: [
          { repartidorId: null, estado: 'pendiente' },
          { repartidorId: profile.id, estado: { in: ['pendiente', 'asignado'] } },
        ],
      },
      data: {
        repartidorId: profile.id,
        estado: 'aceptado',
        aceptadoEn: new Date(),
      },
    });

    if (updateRes.count === 0) {
      return NextResponse.json(
        { error: 'La orden ya fue aceptada o asignada a otro repartidor' },
        { status: 409 }
      );
    }

    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: { enServicio: true },
    });

    // Actualizar moto a EN_SERVICIO si está asignada
    if (profile.motoId) {
      await db.moto.update({
        where: { id: profile.motoId },
        data: { estado: 'EN_SERVICIO' },
      }).catch(() => null);
    }

    emitOrdenActualizada({ id, estado: 'aceptado', repartidorId: profile.id });

    return NextResponse.json({
      ok: true,
      estado: 'aceptado',
      ordenId: id,
      repartidorId: profile.id,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_ACEPTAR]', error);
    return NextResponse.json(
      { error: 'Error al aceptar la orden' },
      { status: 500 }
    );
  }
}
