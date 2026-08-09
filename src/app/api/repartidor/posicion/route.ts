import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { emitirEventoRealtime } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/**
 * POST /api/repartidor/posicion
 * Body: { lat, lng, velocidad?, heading? }
 * Guarda la posición actual del repartidor (para tracking).
 */
export async function POST(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

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

    // Emitir posición GPS en tiempo real al panel de administración y mapa de flota
    emitirEventoRealtime({
      room: 'admin',
      event: 'repartidor:posicion',
      data: { repartidorId: profile.id, lat, lng, velocidad, heading, nombre: profile.nombre },
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
