import { NextRequest, NextResponse } from 'next/server';
import { runtimeState } from '@/lib/repartidor-mock';
import type { TipoIncidencia } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

const LABELS: Record<TipoIncidencia, string> = {
  mecanica: 'Falla mecánica',
  cliente: 'Problema con cliente',
  accidente: 'Accidente',
  otro: 'Otro',
};

/**
 * PATCH /api/repartidor/ordenes/[id]/incidencia
 * Body: { tipo: 'mecanica' | 'cliente' | 'accidente' | 'otro', descripcion?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { tipo, descripcion } = body as { tipo: TipoIncidencia; descripcion?: string };

    if (!tipo || !LABELS[tipo]) {
      return NextResponse.json(
        { error: 'Tipo de incidencia inválido. Valores: mecanica, cliente, accidente, otro' },
        { status: 400 }
      );
    }

    const orden = runtimeState.ordenActiva;
    if (!orden || orden.id !== id) {
      return NextResponse.json(
        { error: `No hay orden activa con ID ${id}` },
        { status: 404 }
      );
    }

    runtimeState.ordenActivaEstado = 'incidencia';
    runtimeState.enServicio = false;
    runtimeState.moto.estado = 'DISPONIBLE';

    runtimeState.notificaciones = [
      {
        id: `ntf-${Date.now()}`,
        tipo: 'incidencia',
        titulo: 'Incidencia reportada',
        contenido: `${LABELS[tipo]} — ${orden.id}`,
        leido: false,
        ordenId: orden.id,
        tiempo: 'ahora',
      },
      ...runtimeState.notificaciones,
    ];

    runtimeState.ordenActiva = null;
    runtimeState.kmRecorridos = 0;

    return NextResponse.json({
      ok: true,
      estado: 'incidencia',
      ordenId: id,
      tipo: LABELS[tipo],
      descripcion: descripcion ?? null,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_INCIDENCIA]', error);
    return NextResponse.json(
      { error: 'Error al reportar la incidencia' },
      { status: 500 }
    );
  }
}
