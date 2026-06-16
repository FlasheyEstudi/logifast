import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runtimeState, REPARTIDOR_ID } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * POST /api/repartidor/posicion
 * Body: { lat: number, lng: number }
 * Guarda la posición GPS del repartidor (DB + runtime state).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng } = body as { lat?: number; lng?: number };

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Se requieren lat y lng numéricos' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    runtimeState.ultimaPosicion = { lat, lng, timestamp };

    // Persistir en la base de datos (best-effort)
    try {
      await db.posicionRepartidor.create({
        data: {
          repartidorId: REPARTIDOR_ID,
          lat,
          lng,
          velocidad: 0,
          heading: 0,
          timestamp: new Date(timestamp),
        },
      });

      await db.repartidorProfile.update({
        where: { id: REPARTIDOR_ID },
        data: { lat, lng },
      });
    } catch (dbError) {
      // La base de datos puede no tener el registro creado — no bloquea el flujo mock
      console.warn('[REPARTIDOR_POSICION_POST] DB skip:', dbError);
    }

    return NextResponse.json({
      ok: true,
      lat,
      lng,
      timestamp,
    });
  } catch (error) {
    console.error('[REPARTIDOR_POSICION_POST]', error);
    return NextResponse.json(
      { error: 'Error al guardar la posición' },
      { status: 500 }
    );
  }
}
