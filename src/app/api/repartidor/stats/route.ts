import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import type { StatsRepartidor } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

type Periodo = 'hoy' | 'semana' | 'mes' | 'all';

const DIAS_LETRAS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/**
 * GET /api/repartidor/stats?periodo=hoy|semana|mes|all
 * Computa de forma atómica y en un solo pase de base de datos las métricas
 * de hoy, esta semana, este mes y los últimos 7 días.
 */
export async function GET(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const { searchParams } = new URL(req.url);
    const requestedPeriodo = (searchParams.get('periodo') ?? 'all') as Periodo;

    const now = new Date();

    // Inicio de hoy: 00:00:00.000
    const startHoy = new Date(now);
    startHoy.setHours(0, 0, 0, 0);

    // Inicio de últimos 7 días (esta semana): 00:00:00.000
    const startSemana = new Date(now);
    startSemana.setDate(startSemana.getDate() - 7);
    startSemana.setHours(0, 0, 0, 0);

    // Inicio de últimos 30 días (este mes): 00:00:00.000
    const startMes = new Date(now);
    startMes.setMonth(startMes.getMonth() - 1);
    startMes.setHours(0, 0, 0, 0);

    // Repartidor IDs para cubrir asignaciones por profile.id o userId
    const repartidorIds = [profile.id];
    if (profile.userId && profile.userId !== profile.id) {
      repartidorIds.push(profile.userId);
    }

    // Consulta única para los últimos 30 días (cubre mes, semana, hoy y gráfico de 7 días)
    const [servicios, compras] = await Promise.all([
      db.ordenServicio.findMany({
        where: {
          repartidorId: { in: repartidorIds },
          estado: 'entregado',
          OR: [
            { entregadoEn: { gte: startMes } },
            { updatedAt: { gte: startMes } },
          ],
        },
        select: {
          id: true,
          tiendaId: true,
          kmRecorridos: true,
          kmEstimados: true,
          ganancia: true,
          tiempoTotal: true,
          entregadoEn: true,
          updatedAt: true,
        },
      }),
      db.ordenCompra.findMany({
        where: {
          repartidorId: { in: repartidorIds },
          estado: 'entregado',
          updatedAt: { gte: startMes },
        },
        select: {
          id: true,
          tiendaId: true,
          total: true,
          costoEnvio: true,
          updatedAt: true,
        },
      }),
    ]);

    // Función pura de agregación en memoria sin consultas adicionales a la BD
    const aggregateForPeriod = (startDate: Date): StatsRepartidor => {
      const sFiltered = servicios.filter((s) => {
        const d = s.entregadoEn || s.updatedAt;
        return d >= startDate;
      });
      const cFiltered = compras.filter((c) => c.updatedAt >= startDate);

      const sIds = new Set(sFiltered.map((s) => s.id));
      const sTiendaIds = new Set(sFiltered.map((s) => s.tiendaId).filter(Boolean));
      const cUnicas = cFiltered.filter((c) => !sIds.has(c.id) && !sTiendaIds.has(c.tiendaId));

      const entregas = sFiltered.length + cUnicas.length;
      const kmServicios = sFiltered.reduce(
        (acc, x) => acc + (typeof x.kmRecorridos === 'number' && x.kmRecorridos > 0 ? x.kmRecorridos : (x.kmEstimados || 3.5)),
        0
      );
      const kmCompras = cUnicas.length * 3.5;
      const km = Math.round((kmServicios + kmCompras) * 10) / 10;

      const gananciasServicios = sFiltered.reduce((acc, x) => acc + (x.ganancia || 0), 0);
      const gananciasCompras = cUnicas.reduce(
        (acc, c) => acc + Math.round(Number(c.costoEnvio || 0) > 0 ? Number(c.costoEnvio) : Number(c.total || 0) * 0.2),
        0
      );
      const ganancias = Math.round(gananciasServicios + gananciasCompras);

      const tiempoServicios = sFiltered.reduce((acc, x) => acc + (x.tiempoTotal || 0), 0);
      const tiempoCompras = cUnicas.length * 20;
      const tiempoActivo = tiempoServicios + tiempoCompras;

      return { entregas, km, ganancias, tiempoActivo };
    };

    const statsHoy = aggregateForPeriod(startHoy);
    const statsSemana = aggregateForPeriod(startSemana);
    const statsMes = aggregateForPeriod(startMes);

    // Gráfico de los últimos 7 días computado a partir de los datos en memoria
    const dias: Array<{ x: string; v: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const countServicios = servicios.filter((s) => {
        const fecha = s.entregadoEn || s.updatedAt;
        return fecha >= dayStart && fecha <= dayEnd;
      }).length;

      const countCompras = compras.filter((c) => {
        return c.updatedAt >= dayStart && c.updatedAt <= dayEnd;
      }).length;

      const letraDia = DIAS_LETRAS[d.getDay()];
      dias.push({ x: letraDia, v: countServicios + countCompras });
    }

    // Compatibilidad hacia atrás con peticiones de periodo único
    let singleStats = statsHoy;
    if (requestedPeriodo === 'semana') singleStats = statsSemana;
    if (requestedPeriodo === 'mes') singleStats = statsMes;

    return NextResponse.json(
      {
        hoy: statsHoy,
        semana: statsSemana,
        mes: statsMes,
        dias,
        // Compatibilidad hacia atrás
        stats: singleStats,
        trends: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
        historico: {
          totalEntregas: profile.totalEntregas,
          totalKm: profile.totalKm,
          totalGanancias: profile.totalGanancias,
          tiempoPromedio: profile.tiempoPromedio,
          calificacion: profile.calificacion,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[REPARTIDOR_STATS_GET]', error);
    // Retornar 500 para que el cliente no sobrescriba el estado con ceros espurios
    return NextResponse.json(
      { error: 'Error al calcular estadísticas' },
      { status: 500 }
    );
  }
}
