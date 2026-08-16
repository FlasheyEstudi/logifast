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

  const [servicios, compras] = await Promise.all([
    db.ordenServicio.findMany({
      where: {
        repartidorId,
        estado: 'entregado',
        OR: [
          { entregadoEn: { gte: start } },
          { updatedAt: { gte: start } },
        ],
      },
      select: { id: true, tiendaId: true, kmRecorridos: true, kmEstimados: true, ganancia: true, tiempoTotal: true },
    }),
    db.ordenCompra.findMany({
      where: {
        repartidorId,
        estado: 'entregado',
        updatedAt: { gte: start },
      },
      select: { id: true, tiendaId: true, total: true, costoEnvio: true },
    }),
  ]);

  const servicioIds = new Set(servicios.map((s) => s.id));
  const servicioTiendaIds = new Set(servicios.map((s) => s.tiendaId).filter(Boolean));
  const comprasUnicas = compras.filter((c) => !servicioIds.has(c.id) && !servicioTiendaIds.has(c.tiendaId));

  const entregas = servicios.length + comprasUnicas.length;
  const kmServicios = servicios.reduce((s, x) => s + (x.kmRecorridos || x.kmEstimados || 3.5), 0);
  const kmCompras = comprasUnicas.length * 3.5;
  const km = kmServicios + kmCompras;

  const gananciasServicios = servicios.reduce((s, x) => s + (x.ganancia || 0), 0);
  const gananciasCompras = comprasUnicas.reduce(
    (s, c) => s + Math.round(Number(c.costoEnvio || 0) > 0 ? Number(c.costoEnvio) : Number(c.total || 0) * 0.2),
    0
  );
  const ganancias = gananciasServicios + gananciasCompras;

  const tiempoServicios = servicios.reduce((s, x) => s + (x.tiempoTotal || 0), 0);
  const tiempoCompras = comprasUnicas.length * 20;
  const tiempoActivo = tiempoServicios + tiempoCompras;

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
      const [servicios, compras] = await Promise.all([
        db.ordenServicio.findMany({
          where: {
            repartidorId,
            estado: 'entregado',
            OR: [
              { entregadoEn: { gte: start, lt: end } },
              { updatedAt: { gte: start, lt: end } },
            ],
          },
          select: { id: true, tiendaId: true, kmRecorridos: true, kmEstimados: true, ganancia: true, tiempoTotal: true },
        }),
        db.ordenCompra.findMany({
          where: {
            repartidorId,
            estado: 'entregado',
            updatedAt: { gte: start, lt: end },
          },
          select: { id: true, tiendaId: true, total: true, costoEnvio: true },
        }),
      ]);
      const servicioIds = new Set(servicios.map((s) => s.id));
      const servicioTiendaIds = new Set(servicios.map((s) => s.tiendaId).filter(Boolean));
      const comprasUnicas = compras.filter((c) => !servicioIds.has(c.id) && !servicioTiendaIds.has(c.tiendaId));

      const entregas = servicios.length + comprasUnicas.length;
      const km = servicios.reduce((s, x) => s + (x.kmRecorridos || 0), 0) + comprasUnicas.length * 3.5;
      const ganancias =
        servicios.reduce((s, x) => s + (x.ganancia || 0), 0) +
        comprasUnicas.reduce(
          (s, c) => s + Math.round(Number(c.costoEnvio || 0) > 0 ? Number(c.costoEnvio) : Number(c.total || 0) * 0.2),
          0
        );
      const tiempoActivo = servicios.reduce((s, x) => s + (x.tiempoTotal || 0), 0) + comprasUnicas.length * 20;

      return {
        entregas,
        km,
        ganancias,
        tiempoActivo,
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
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const { searchParams } = new URL(req.url);
    const periodo = (searchParams.get('periodo') ?? 'hoy') as Periodo;
    const validPeriodo: Periodo = ['hoy', 'semana', 'mes'].includes(periodo)
      ? periodo
      : 'hoy';

    const [stats, trends] = await Promise.all([
      computeStats(profile.id, validPeriodo),
      computeTrends(profile.id, validPeriodo),
    ]);

    return NextResponse.json(
      { stats, trends },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  } catch (error) {
    console.error('[REPARTIDOR_STATS_GET]', error);
    return NextResponse.json({
      stats: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
      trends: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
    });
  }
}
