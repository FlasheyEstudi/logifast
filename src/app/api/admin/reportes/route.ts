import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reportes
 * Generates bandwidth-optimized analytical reports across orders, riders, revenues, and incidents.
 * Aggregated entirely on the server to keep client payload minimal (< 2 KB).
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalOrdenes,
      entregadas,
      incidenciasCount,
      canceladas,
      motosTotal,
      motosEnServicio,
      repartidoresTotal,
      repartidoresConectados,
      recentOrders,
      topRepartidores,
      motosList,
      ordenesCompraCount,
      ordenesCompraIngresos,
    ] = await Promise.all([
      db.ordenServicio.count(),
      db.ordenServicio.count({ where: { estado: 'entregado' } }),
      db.ordenServicio.count({
        where: {
          OR: [{ estado: 'incidencia' }, { incidenciaTipo: { not: null } }],
        },
      }),
      db.ordenServicio.count({ where: { estado: 'cancelado' } }),
      db.moto.count(),
      db.moto.count({ where: { estado: 'EN_SERVICIO' } }),
      db.repartidorProfile.count(),
      db.repartidorProfile.count({ where: { conectado: true } }),
      db.ordenServicio.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: {
          id: true,
          estado: true,
          monto: true,
          ganancia: true,
          kmEstimados: true,
          kmRecorridos: true,
          tiempoEstimado: true,
          tiempoTotal: true,
          destino: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.repartidorProfile.findMany({
        select: {
          id: true,
          nombre: true,
          totalEntregas: true,
          calificacion: true,
          totalKm: true,
          totalGanancias: true,
        },
        orderBy: { totalEntregas: 'desc' },
        take: 8,
      }),
      db.moto.findMany({
        select: {
          id: true,
          nombre: true,
          modelo: true,
          kmAcumulados: true,
          estado: true,
        },
        take: 20,
      }),
      db.ordenCompra.count(),
      db.ordenCompra.aggregate({
        where: { estado: 'entregado' },
        _sum: { total: true },
      }),
    ]);

    // ─── 1. KPIs Agregados ───
    const tasaExito = totalOrdenes > 0 ? Math.round((entregadas / totalOrdenes) * 100) : 100;
    const utilizacionFlota = motosTotal > 0 ? Math.round((motosEnServicio / motosTotal) * 100) : 0;

    let totalKmCalculados = 0;
    let totalTiempoCalculado = 0;
    let deliveredCountWithMetrics = 0;
    let totalIngresosCalculados = 0;

    recentOrders.forEach((o) => {
      const km = o.kmRecorridos > 0 ? o.kmRecorridos : o.kmEstimados;
      const tiempo = o.tiempoTotal > 0 ? o.tiempoTotal : o.tiempoEstimado;
      totalKmCalculados += km || 0;
      totalIngresosCalculados += o.monto || 0;
      if (o.estado === 'entregado') {
        deliveredCountWithMetrics++;
        totalTiempoCalculado += tiempo || 0;
      }
    });

    const avgDeliveryTime = deliveredCountWithMetrics > 0 ? Math.round(totalTiempoCalculado / deliveredCountWithMetrics) : 28;
    const avgDistance = totalOrdenes > 0 ? Number((totalKmCalculados / totalOrdenes).toFixed(1)) : 4.5;
    const incomePerKm = totalKmCalculados > 0 ? Number((totalIngresosCalculados / totalKmCalculados).toFixed(1)) : 15;

    // ─── 2. Ingresos Diarios (Últimos 7 días) ───
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dailyMap[key] = 0;
    }

    recentOrders.forEach((o) => {
      if (new Date(o.createdAt) >= sevenDaysAgo) {
        const key = new Date(o.createdAt).toISOString().split('T')[0];
        if (dailyMap[key] !== undefined) {
          dailyMap[key] += o.monto || 0;
        }
      }
    });

    const dailyRevenue = Object.entries(dailyMap).map(([isoDate, monto]) => {
      const d = new Date(`${isoDate}T12:00:00`);
      return {
        dia: dayNames[d.getDay()],
        fecha: isoDate,
        monto: Math.round(monto),
      };
    });

    // ─── 3. Ingresos Mensuales (Últimos 6 meses) ───
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap[key] = 0;
    }

    recentOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyMap[key] !== undefined) {
        monthlyMap[key] += o.monto || 0;
      }
    });

    const monthlyRevenue = Object.entries(monthlyMap).map(([key, monto]) => {
      const [, mStr] = key.split('-');
      const mIdx = parseInt(mStr, 10);
      return {
        mes: monthNames[mIdx],
        monto: Math.round(monto),
      };
    });

    // ─── 4. Distribución por Zonas & Pivot Data ───
    const zoneMap: Record<string, { ordenes: number; ingresos: number; kmTotal: number }> = {};
    recentOrders.forEach((o) => {
      let zName = 'Managua Centro';
      const dest = (o.destino || '').toLowerCase();
      if (dest.includes('masaya') || dest.includes('nindirí') || dest.includes('ticuantepe')) zName = 'Carretera a Masaya';
      else if (dest.includes('norte') || dest.includes('aeropuerto') || dest.includes('tipitapa')) zName = 'Carretera Norte';
      else if (dest.includes('linda vista') || dest.includes('ciudad sandino') || dest.includes('lezcano')) zName = 'Zona Occidental';
      else if (dest.includes('suburbana') || dest.includes('villa fontana') || dest.includes('santo domingo')) zName = 'Zona Sur / Galerías';

      if (!zoneMap[zName]) zoneMap[zName] = { ordenes: 0, ingresos: 0, kmTotal: 0 };
      zoneMap[zName].ordenes += 1;
      zoneMap[zName].ingresos += o.monto || 0;
      zoneMap[zName].kmTotal += (o.kmRecorridos || o.kmEstimados || 4);
    });

    const zoneOrders = Object.entries(zoneMap).map(([zona, data]) => ({
      zona,
      cantidad: data.ordenes,
      ingresos: data.ingresos,
      kmPromedio: data.ordenes > 0 ? Number((data.kmTotal / data.ordenes).toFixed(1)) : 4.5,
      costoPromedio: data.ordenes > 0 ? Math.round(data.ingresos / data.ordenes) : 0,
    }));

    // ─── 5. Distribución de Estados ───
    const statusCounts: Record<string, number> = {
      entregados: entregadas,
      pendientes: totalOrdenes - (entregadas + incidenciasCount + canceladas),
      incidencias: incidenciasCount,
      cancelados: canceladas,
    };

    const orderStatusDistribution = [
      { name: 'Entregados', value: statusCounts.entregados, color: '#16A34A' },
      { name: 'En Tránsito / Pendientes', value: Math.max(0, statusCounts.pendientes), color: '#3B82F6' },
      { name: 'Incidencias', value: statusCounts.incidencias, color: '#DC2626' },
      { name: 'Cancelados', value: statusCounts.cancelados, color: '#9CA3AF' },
    ];

    // ─── 6. Rendimiento de Repartidores ───
    const riderPerformance = topRepartidores.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      entregas: r.totalEntregas,
      calificacion: r.calificacion || 5.0,
      totalKm: Math.round(r.totalKm || 0),
      ganancias: Math.round(r.totalGanancias || 0),
    }));

    return NextResponse.json({
      metricas: {
        totalOrdenes,
        entregadas,
        incidenciasCount,
        canceladas,
        tasaExito,
        motosTotal,
        motosEnServicio,
        repartidoresTotal,
        repartidoresConectados,
        avgDeliveryTime,
        avgDistance,
        incomePerKm,
        utilizacionFlota,
        totalMarketplace: ordenesCompraCount,
        ingresosMarketplace: ordenesCompraIngresos._sum.total || 0,
      },
      dailyRevenue,
      monthlyRevenue,
      zoneOrders,
      orderStatusDistribution,
      riderPerformance,
      motos: motosList,
    });
  } catch (error) {
    console.error('[ADMIN_REPORTES_GET]', error);
    return NextResponse.json({ error: 'Error al generar reportes analíticos' }, { status: 500 });
  }
}
