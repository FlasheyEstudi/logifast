import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runtimeState, REPARTIDOR_ID } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/posicion/[repartidorId]
 * Devuelve la última posición conocida del repartidor (para admin/cliente).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ repartidorId: string }> }
) {
  try {
    const { repartidorId } = await params;

    // Intentar la base de datos primero (mejor dato en producción)
    try {
      const ultima = await db.posicionRepartidor.findFirst({
        where: { repartidorId },
        orderBy: { timestamp: 'desc' },
      });
      if (ultima) {
        return NextResponse.json({
          repartidorId,
          lat: ultima.lat,
          lng: ultima.lng,
          timestamp: ultima.timestamp.toISOString(),
        });
      }
    } catch (dbError) {
      console.warn('[REPARTIDOR_POSICION_GET] DB skip:', dbError);
    }

    // Fallback al runtime state en memoria (mock)
    if (repartidorId === REPARTIDOR_ID) {
      const pos = runtimeState.ultimaPosicion;
      return NextResponse.json({
        repartidorId,
        lat: pos.lat,
        lng: pos.lng,
        timestamp: new Date(pos.timestamp).toISOString(),
      });
    }

    return NextResponse.json(
      { error: `Repartidor no encontrado: ${repartidorId}` },
      { status: 404 }
    );
  } catch (error) {
    console.error('[REPARTIDOR_POSICION_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener la posición' },
      { status: 500 }
    );
  }
}
