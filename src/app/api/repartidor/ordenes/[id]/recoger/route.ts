import { NextRequest, NextResponse } from 'next/server';
import { runtimeState } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/recoger
 * Marca el paquete/orden como recogido.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!runtimeState.ordenActiva || runtimeState.ordenActiva.id !== id) {
      return NextResponse.json(
        { error: `No hay orden activa con ID ${id}` },
        { status: 404 }
      );
    }

    runtimeState.ordenActivaEstado = 'recogido';
    runtimeState.kmRecorridos = 0;

    return NextResponse.json({
      ok: true,
      estado: 'recogido',
      ordenId: id,
      kmRecorridos: runtimeState.kmRecorridos,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_RECOGER]', error);
    return NextResponse.json(
      { error: 'Error al marcar como recogido' },
      { status: 500 }
    );
  }
}
