import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/posicion/[repartidorId]
 * Devuelve la última posición conocida del repartidor.
 * - Admin: puede ver cualquier repartidor.
 * - Repartidor: solo puede ver su propia posición.
 * - Cliente: solo puede ver la posición del repartidor que tiene una orden activa con él.
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

    const profile = await db.repartidorProfile.findUnique({
      where: { id: repartidorId },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });
    }

    // Authorization
    if (user.role === 'repartidor') {
      const myProfile = await db.repartidorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!myProfile || myProfile.id !== repartidorId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    } else if (user.role === 'cliente') {
      // Solo puede ver la posición si tiene una orden activa con este repartidor
      const ordenActiva = await db.ordenServicio.findFirst({
        where: {
          clienteId: user.id,
          repartidorId,
          estado: { in: ['asignado', 'aceptado', 'recogido', 'en_camino'] },
        },
        select: { id: true },
      });
      if (!ordenActiva) {
        return NextResponse.json(
          { error: 'No tienes una orden activa con este repartidor' },
          { status: 403 }
        );
      }
    } else if (user.role !== 'admin' && user.role !== 'ingeniero') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
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
