import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import type { StatsRepartidor } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

type Periodo = 'hoy' | 'semana' | 'mes';

function getStartOfPeriod(periodo: Periodo): Date {
  const now = new Date();
  if (periodo === 'hoy') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (periodo === 'semana') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  // mes
  const d = new Date(now);
  d.setMonth(d.getMonth() - 1);
  return d;
}

function getStartOfPreviousPeriod(periodo: Periodo): Date {
  const now = new Date();
  if (periodo === 'hoy') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (periodo === 'semana') {
    const d = new Date(now);
    d.setDate(d.getDate() - 14);
    return d;
  }
  const d = new Date(now);
  d.setMonth(d.getMonth() - 2);
  return d;
}

function getEndOfPreviousPeriod(periodo: Periodo): Date {
  if (periodo === 'hoy') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (periodo === 'semana') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d;
}

async function computeStats(
  repartidorId: string,
  periodo: Periodo
): Promise<StatsRepartidor> {
  const start = getStartOfPeriod(periodo);

  const servicios = await db.ordenServicio.findMany({
    where: {
      repartidorId,
      estado: 'entregado',
      entregadoEn: { gte: start },
    },
    select: { kmRecorridos: true, ganancia: true, tiempoTotal: true },
  });

  const entregas = servicios.length;
  const km = servicios.reduce((s, x) => s + (x.kmRecorridos || 0), 0);
  const ganancias = servicios.reduce((s, x) => s + (x.ganancia || 0), 0);
  const tiempoActivo = servicios.reduce((s, x) => s + (x.tiempoTotal || 0), 0);

  return {
    entregas,
    km: Math.round(km * 10) / 10,
    ganancias: Math.round(ganancias),
    tiempoActivo,
  };
}

async function computeTrends(
  repartidorId: string,
  periodo: Periodo
): Promise<{ entregas: number; km: number; ganancias: number; tiempoActivo: number }> {
  const [prev, current] = await Promise.all([
    (async () => {
      const start = getStartOfPreviousPeriod(periodo);
      const end = getEndOfPreviousPeriod(periodo);
      const servicios = await db.ordenServicio.findMany({
        where: {
          repartidorId,
          estado: 'entregado',
          entregadoEn: { gte: start, lt: end },
        },
        select: { kmRecorridos: true, ganancia: true, tiempoTotal: true },
      });
      return {
        entregas: servicios.length,
        km: servicios.reduce((s, x) => s + (x.kmRecorridos || 0), 0),
        ganancias: servicios.reduce((s, x) => s + (x.ganancia || 0), 0),
        tiempoActivo: servicios.reduce((s, x) => s + (x.tiempoTotal || 0), 0),
      };
    })(),
    computeStats(repartidorId, periodo),
  ]);

  const pct = (curr: number, prevN: number) => {
    if (prevN === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prevN) / prevN) * 100);
  };

  return {
    entregas: pct(current.entregas, prev.entregas),
    km: pct(current.km, prev.km),
    ganancias: pct(current.ganancias, prev.ganancias),
    tiempoActivo: pct(current.tiempoActivo, prev.tiempoActivo),
  };
}

/**
 * GET /api/repartidor/stats?periodo=hoy|semana|mes
 */
export async function GET(req: NextRequest) {
  try {
    const { profile } = await getRepartidorProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodo = (searchParams.get('periodo') ?? 'hoy') as Periodo;
    const validPeriodo: Periodo = ['hoy', 'semana', 'mes'].includes(periodo)
      ? periodo
      : 'hoy';

    const [stats, trends] = await Promise.all([
      computeStats(profile.id, validPeriodo),
      computeTrends(profile.id, validPeriodo),
    ]);

    return NextResponse.json({ stats, trends });
  } catch (error) {
    console.error('[REPARTIDOR_STATS_GET]', error);
    return NextResponse.json({
      stats: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
      trends: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
    });
  }
}
