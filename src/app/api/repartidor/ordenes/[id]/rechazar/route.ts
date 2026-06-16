import { NextRequest, NextResponse } from 'next/server';
import { runtimeState } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/rechazar
 * Rechaza una orden asignada. Si se acumulan 3 rechazos en la hora,
 * el repartidor entra en pausa automática de 15 min.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    runtimeState.ordenActiva = null;
    runtimeState.ordenActivaEstado = 'cancelado';
    runtimeState.enServicio = false;
    runtimeState.rechazosHora += 1;

    const pausado = runtimeState.rechazosHora >= 3;
    if (pausado) {
      runtimeState.pausado = true;
      runtimeState.pausaHasta = Date.now() + 15 * 60 * 1000;
      runtimeState.notificaciones = [
        {
          id: `ntf-${Date.now()}`,
          tipo: 'cancelacion',
          titulo: 'Pausa automática',
          contenido: 'Has rechazado 3 órdenes. Pausa de 15 min.',
          leido: false,
          ordenId: id,
          tiempo: 'ahora',
        },
        ...runtimeState.notificaciones,
      ];
    }

    return NextResponse.json({
      ok: true,
      ordenId: id,
      rechazosHora: runtimeState.rechazosHora,
      pausado,
      pausaHasta: runtimeState.pausaHasta,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_RECHAZAR]', error);
    return NextResponse.json(
      { error: 'Error al rechazar la orden' },
      { status: 500 }
    );
  }
}
