import { NextRequest, NextResponse } from 'next/server';
import { runtimeState } from '@/lib/repartidor-mock';
import type { ServicioHistorial } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/entregar
 * Confirma la entrega. Calcula el kmFinal y guarda en el historial.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const orden = runtimeState.ordenActiva;
    if (!orden || orden.id !== id) {
      return NextResponse.json(
        { error: `No hay orden activa con ID ${id}` },
        { status: 404 }
      );
    }

    const kmFinal = Math.round((orden.kmEstimados + (Math.random() - 0.5) * 0.4) * 10) / 10;

    runtimeState.ordenActivaEstado = 'entregado';
    runtimeState.enServicio = false;
    runtimeState.moto.estado = 'DISPONIBLE';
    runtimeState.moto.kmAcumulados = Math.round((runtimeState.moto.kmAcumulados + kmFinal) * 10) / 10;

    // Agregar al historial
    const nuevoServicio: ServicioHistorial = {
      id: `svc-${Date.now()}`,
      ordenId: orden.id,
      tipo: orden.tipo,
      cliente: orden.cliente,
      tiendaNombre: orden.tiendaNombre,
      origen: orden.origen,
      destino: orden.destino,
      hora: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
      kmRecorridos: kmFinal,
      ganancia: orden.ganancia,
      tiempoTotal: orden.tiempoEstimado,
      estado: 'entregado',
    };
    runtimeState.serviciosHoy = [nuevoServicio, ...runtimeState.serviciosHoy];
    runtimeState.ordenActiva = null;
    runtimeState.kmRecorridos = 0;

    return NextResponse.json({
      ok: true,
      estado: 'entregado',
      ordenId: id,
      kmFinal,
      ganancia: orden.ganancia,
      tiempoTotal: orden.tiempoEstimado,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_ENTREGAR]', error);
    return NextResponse.json(
      { error: 'Error al confirmar la entrega' },
      { status: 500 }
    );
  }
}
