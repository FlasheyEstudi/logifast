import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

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
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { repartidorId } = await params;

    let authorized = user.role === 'admin' || user.role === 'ingeniero';

    if (!authorized && user.role === 'repartidor') {
      const ownProfile = await db.repartidorProfile.findUnique({ where: { userId: user.id } });
      if (ownProfile && ownProfile.id === repartidorId) {
        authorized = true;
      }
    }

    if (!authorized && user.role === 'cliente') {
      const activeOrder = await db.ordenServicio.findFirst({
        where: {
          clienteId: user.id,
          repartidorId: repartidorId,
          estado: { in: ['asignado', 'aceptado', 'recogido', 'en_camino'] },
        },
      });
      if (activeOrder) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

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
