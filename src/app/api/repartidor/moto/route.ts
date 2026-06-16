import { NextResponse } from 'next/server';
import { runtimeState } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/moto
 * Devuelve los datos de la moto asignada al repartidor.
 */
export async function GET() {
  try {
    return NextResponse.json(runtimeState.moto);
  } catch (error) {
    console.error('[REPARTIDOR_MOTO_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener la moto asignada' },
      { status: 500 }
    );
  }
}
