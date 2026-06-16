import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ORDEN_ACTIVA, runtimeState } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/aceptar
 * Acepta una orden asignada.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Asignar la orden activa si aún no existe
    if (!runtimeState.ordenActiva) {
      runtimeState.ordenActiva = { ...MOCK_ORDEN_ACTIVA, id };
    } else if (runtimeState.ordenActiva.id !== id) {
      // Si el ID no coincide, forzar la orden activa al ID solicitado
      runtimeState.ordenActiva = { ...MOCK_ORDEN_ACTIVA, id };
    }

    runtimeState.ordenActivaEstado = 'aceptado';
    runtimeState.enServicio = true;
    runtimeState.kmRecorridos = 0;
    runtimeState.moto.estado = 'EN_SERVICIO';

    return NextResponse.json({
      ok: true,
      estado: 'aceptado',
      ordenId: id,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_ACEPTAR]', error);
    return NextResponse.json(
      { error: 'Error al aceptar la orden' },
      { status: 500 }
    );
  }
}
