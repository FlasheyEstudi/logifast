import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/posicion/[repartidorId]
 * Devuelve la última posición conocida del repartidor.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ repartidorId: string }> }
) {
  try {
    const { repartidorId } = await params;

    const profile = await db.repartidorProfile.findUnique({
      where: { id: repartidorId },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });
    }

    const ultima = await db.posicionRepartidor.findFirst({
      where: { repartidorId },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      repartidorId,
      lat: profile.lat ?? ultima?.lat ?? 0,
      lng: profile.lng ?? ultima?.lng ?? 0,
      velocidad: ultima?.velocidad ?? 0,
      heading: ultima?.heading ?? 0,
      timestamp: ultima?.timestamp ?? null,
      conectado: profile.conectado,
      enServicio: profile.enServicio,
    });
  } catch (error) {
    console.error('[REPARTIDOR_POSICION_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener posición del repartidor' },
      { status: 500 }
    );
  }
}
