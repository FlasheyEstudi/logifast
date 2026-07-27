import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/aceptar
 * Repartidor acepta la orden asignada.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile } = await getRepartidorProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Si la orden no tiene repartidor, asignarla
    const repartidorId = orden.repartidorId ?? profile.id;
    if (!orden.repartidorId) {
      await db.ordenServicio.update({
        where: { id },
        data: { repartidorId: profile.id, estado: 'aceptado', aceptadoEn: new Date() },
      });
    } else if (orden.repartidorId !== profile.id) {
      return NextResponse.json(
        { error: 'La orden ya está asignada a otro repartidor' },
        { status: 403 }
      );
    } else {
      await db.ordenServicio.update({
        where: { id },
        data: { estado: 'aceptado', aceptadoEn: new Date() },
      });
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

    return NextResponse.json({
      ok: true,
      estado: 'aceptado',
      ordenId: id,
      repartidorId,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_ACEPTAR]', error);
    return NextResponse.json(
      { error: 'Error al aceptar la orden' },
      { status: 500 }
    );
  }
}
