import { NextRequest, NextResponse } from 'next/server';
import {
  MOCK_ORDEN_ACTIVA,
  MOCK_SERVICIOS_HOY,
  runtimeState,
  REPARTIDOR_ID,
} from '@/lib/repartidor-mock';
import type { OrdenActiva, ServicioHistorial } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/ordenes?estado=activa|historial
 *  - activa    → devuelve la orden activa actual (o null)
 *  - historial → devuelve lista de servicios del día
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? 'activa';

    if (estado === 'historial') {
      const historial: ServicioHistorial[] = runtimeState.serviciosHoy.length
        ? runtimeState.serviciosHoy
        : MOCK_SERVICIOS_HOY;
      return NextResponse.json({
        repartidorId: REPARTIDOR_ID,
        total: historial.length,
        servicios: historial,
      });
    }

    // estado === 'activa'
    const orden: OrdenActiva | null = runtimeState.ordenActiva ?? MOCK_ORDEN_ACTIVA;
    if (!orden) {
      return NextResponse.json({ orden: null });
    }
    return NextResponse.json({
      orden,
      estadoServicio: runtimeState.ordenActivaEstado,
      kmRecorridos: runtimeState.kmRecorridos,
      conectado: runtimeState.conectado,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDENES_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes del repartidor' },
      { status: 500 }
    );
  }
}
