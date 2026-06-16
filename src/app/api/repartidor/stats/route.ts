import { NextRequest, NextResponse } from 'next/server';
import { MOCK_STATS, MOCK_STATS_TRENDS } from '@/lib/repartidor-mock';
import type { StatsRepartidor } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

type Periodo = 'hoy' | 'semana' | 'mes';

/**
 * GET /api/repartidor/stats?periodo=hoy|semana|mes
 * Devuelve las estadísticas del repartidor + tendencias (% vs período anterior).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodoParam = (searchParams.get('periodo') ?? 'hoy') as Periodo;

    if (!['hoy', 'semana', 'mes'].includes(periodoParam)) {
      return NextResponse.json(
        { error: 'periodo inválido. Valores: hoy, semana, mes' },
        { status: 400 }
      );
    }

    const stats: StatsRepartidor = MOCK_STATS[periodoParam];
    const trends = MOCK_STATS_TRENDS[periodoParam];

    return NextResponse.json({
      periodo: periodoParam,
      ...stats,
      tendencias: {
        entregas: trends.entregas,
        km: trends.km,
        ganancias: trends.ganancias,
        tiempoActivo: trends.tiempoActivo,
      },
    });
  } catch (error) {
    console.error('[REPARTIDOR_STATS_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener las estadísticas' },
      { status: 500 }
    );
  }
}
