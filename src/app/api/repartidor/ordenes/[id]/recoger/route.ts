import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/recoger
 * Repartidor marca que recogió el paquete.
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
    if (orden.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }

    await db.ordenServicio.update({
      where: { id },
      data: { estado: 'recogido', recogidoEn: new Date() },
    });

    return NextResponse.json({
      ok: true,
      estado: 'recogido',
      ordenId: id,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_RECOGER]', error);
    return NextResponse.json(
      { error: 'Error al marcar como recogido' },
      { status: 500 }
    );
  }
}
