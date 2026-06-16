import { NextResponse } from 'next/server';
import { MOCK_CALIFICACIONES } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/calificaciones
 * Devuelve el historial de calificaciones + distribución por estrellas.
 */
export async function GET() {
  try {
    const calificaciones = MOCK_CALIFICACIONES;

    const distribucion: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumaEstrellas = 0;
    for (const c of calificaciones) {
      distribucion[c.estrellas] = (distribucion[c.estrellas] ?? 0) + 1;
      sumaEstrellas += c.estrellas;
    }

    const promedio = calificaciones.length
      ? Math.round((sumaEstrellas / calificaciones.length) * 100) / 100
      : 0;

    return NextResponse.json({
      total: calificaciones.length,
      promedio,
      distribucion: {
        '5': distribucion[5],
        '4': distribucion[4],
        '3': distribucion[3],
        '2': distribucion[2],
        '1': distribucion[1],
      },
      calificaciones,
    });
  } catch (error) {
    console.error('[REPARTIDOR_CALIFICACIONES_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener las calificaciones' },
      { status: 500 }
    );
  }
}
