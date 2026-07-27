import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/repartidor/posicion
 * Body: { lat, lng, velocidad?, heading? }
 * Guarda la posición actual del repartidor (para tracking).
 */
export async function POST(req: NextRequest) {
  try {
    const { profile } = await getRepartidorProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'lat y lng son obligatorios' }, { status: 400 });
    }

    const velocidad = Number(body.velocidad) || 0;
    const heading = Number(body.heading) || 0;

    await db.posicionRepartidor.create({
      data: {
        repartidorId: profile.id,
        lat,
        lng,
        velocidad,
        heading,
      },
    });

    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: { lat, lng },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[REPARTIDOR_POSICION_POST]', error);
    return NextResponse.json(
      { error: 'Error al guardar posición' },
      { status: 500 }
    );
  }
}
