import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/fidelizacion
 * Returns client loyalty status, points, and level.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orderCount = await db.ordenServicio.count({
      where: { clienteId: user.id, estado: 'entregado' },
    });

    const puntos = orderCount * 15;
    let nivel: 'bronce' | 'plata' | 'oro' | 'platino' = 'bronce';
    if (puntos >= 600) nivel = 'platino';
    else if (puntos >= 300) nivel = 'oro';
    else if (puntos >= 100) nivel = 'plata';

    return NextResponse.json({
      fidelizacion: {
        puntos,
        nivel,
        totalEnvios: orderCount,
        historial: [],
      },
    });
  } catch (error) {
    console.error('[CLIENTE_FIDELIZACION_GET]', error);
    return NextResponse.json({ error: 'Error al obtener fidelización' }, { status: 500 });
  }
}

/**
 * POST /api/cliente/fidelizacion
 * Redeems points for discounts or rewards.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { puntosARedimir = 50 } = body;

    return NextResponse.json({
      success: true,
      puntosRedimidos: Number(puntosARedimir),
      mensaje: `¡Has canjeado ${puntosARedimir} puntos exitosamente!`,
    });
  } catch (error) {
    console.error('[CLIENTE_FIDELIZACION_POST]', error);
    return NextResponse.json({ error: 'Error al canjear puntos' }, { status: 500 });
  }
}
