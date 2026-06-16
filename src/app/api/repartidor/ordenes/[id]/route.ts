import { NextRequest, NextResponse } from 'next/server';
import {
  MOCK_SERVICIOS_DETALLE,
  MOCK_ORDEN_ACTIVA,
  runtimeState,
} from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/ordenes/[id]
 * Devuelve el detalle completo de una orden/servicio por ID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Si es la orden activa, devolverla con su estado actual
    const ordenActiva = runtimeState.ordenActiva ?? MOCK_ORDEN_ACTIVA;
    if (ordenActiva.id === id) {
      return NextResponse.json({
        id: ordenActiva.id,
        tipo: ordenActiva.tipo,
        cliente: ordenActiva.cliente,
        clienteTelefono: ordenActiva.clienteTelefono,
        tiendaNombre: ordenActiva.tiendaNombre,
        origen: ordenActiva.origen,
        destino: ordenActiva.destino,
        origenLat: ordenActiva.origenLat,
        origenLng: ordenActiva.origenLng,
        destinoLat: ordenActiva.destinoLat,
        destinoLng: ordenActiva.destinoLng,
        paquete: ordenActiva.paquete,
        tamano: ordenActiva.tamano,
        fragil: ordenActiva.fragil,
        metodoPago: ordenActiva.metodoPago,
        monto: ordenActiva.monto,
        ganancia: ordenActiva.ganancia,
        kmEstimados: ordenActiva.kmEstimados,
        tiempoEstimado: ordenActiva.tiempoEstimado,
        productos: ordenActiva.productos ?? [],
        estadoServicio: runtimeState.ordenActivaEstado,
        kmRecorridos: runtimeState.kmRecorridos,
        fecha: new Date().toISOString().split('T')[0],
      });
    }

    // Buscar en detalle enriquecido
    const detalle = MOCK_SERVICIOS_DETALLE[id];
    if (detalle) {
      return NextResponse.json(detalle);
    }

    return NextResponse.json(
      { error: `Orden no encontrada: ${id}` },
      { status: 404 }
    );
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_DETALLE_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener el detalle de la orden' },
      { status: 500 }
    );
  }
}
