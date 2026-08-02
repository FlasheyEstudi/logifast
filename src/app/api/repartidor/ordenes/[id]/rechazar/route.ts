import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/rechazar
 * Repartidor rechaza la orden asignada. Cuenta como rechazo (3 → pausa).
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    // Liberar la orden
    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (orden && orden.repartidorId === profile.id) {
      await db.ordenServicio.update({
        where: { id },
        data: {
          repartidorId: null,
          estado: orden.estado === 'asignado' ? 'pendiente' : orden.estado,
        },
      });
    }

    // Incrementar rechazos
    const nuevosRechazos = (profile.rechazosHora || 0) + 1;
    const pausado = nuevosRechazos >= 3;
    const pausaHasta = pausado ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: {
        rechazosHora: nuevosRechazos,
        pausado,
        pausaHasta,
      },
    });

    if (pausado) {
      await db.notificacionRepartidor.create({
        data: {
          repartidorId: profile.id,
          tipo: 'cancelacion',
          titulo: 'Pausa automática',
          contenido: 'Has rechazado 3 órdenes. Pausa de 15 min.',
          leido: false,
          ordenId: id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      estado: 'rechazado',
      ordenId: id,
      rechazosHora: nuevosRechazos,
      pausado,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_RECHAZAR]', error);
    return NextResponse.json(
      { error: 'Error al rechazar la orden' },
      { status: 500 }
    );
  }
}
