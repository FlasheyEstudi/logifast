import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * Dashboard general para admin con métricas reales.
 */
export async function GET() {
  try {
    await requireRole('admin');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [
      totalUsers,
      totalClientes,
      totalRepartidores,
      totalTiendas,
      totalProductos,
      totalMotos,
      ordenesMes,
      ordenesMesPrev,
      ordenesSemana,
      revenueMes,
      revenueMesPrev,
      repartidoresConectados,
      ordenesPorEstado,
      topTiendas,
      topRepartidores,
      loginAttempts,
      failedLogins,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'cliente' } }),
      db.user.count({ where: { role: 'repartidor' } }),
      db.tienda.count(),
      db.producto.count(),
      db.moto.count(),
      db.ordenServicio.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.ordenServicio.count({ where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } } }),
      db.ordenServicio.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.ordenCompra.aggregate({
        where: { createdAt: { gte: startOfMonth }, estado: 'entregado' },
        _sum: { total: true },
      }),
      db.ordenCompra.aggregate({
        where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth }, estado: 'entregado' },
        _sum: { total: true },
      }),
      db.repartidorProfile.count({ where: { conectado: true } }),
      db.ordenServicio.groupBy({
        by: ['estado'],
        _count: { estado: true },
      }),
      db.tienda.findMany({
        orderBy: { totalPedidos: 'desc' },
        take: 5,
        select: { id: true, nombre: true, totalPedidos: true, calificacion: true },
      }),
      db.repartidorProfile.findMany({
        orderBy: { totalEntregas: 'desc' },
        take: 5,
        select: { id: true, nombre: true, totalEntregas: true, calificacion: true, totalGanancias: true },
      }),
      db.loginAudit.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.loginAudit.count({ where: { createdAt: { gte: startOfWeek }, success: false } }),
    ]);

    // Convertir array de groupBy a objeto
    const ordenesPorEstadoObj: Record<string, number> = {};
    ordenesPorEstado.forEach((o) => {
      ordenesPorEstadoObj[o.estado] = o._count.estado;
    });

    // Calcular tendencias
    const ordenesTrend = ordenesMesPrev > 0 ? Math.round(((ordenesMes - ordenesMesPrev) / ordenesMesPrev) * 100) : 100;
    const revenueTrend = (revenueMesPrev._sum.total ?? 0) > 0
      ? Math.round((((revenueMes._sum.total ?? 0) - (revenueMesPrev._sum.total ?? 0)) / (revenueMesPrev._sum.total ?? 1)) * 100)
      : 100;

    return NextResponse.json({
      users: {
        total: totalUsers,
        clientes: totalClientes,
        repartidores: totalRepartidores,
        repartidoresConectados,
      },
      tiendas: {
        total: totalTiendas,
        totalProductos,
      },
      ordenes: {
        mes: ordenesMes,
        mesPrev: ordenesMesPrev,
        semana: ordenesSemana,
        tendencia: ordenesTrend,
        porEstado: ordenesPorEstadoObj,
      },
      revenue: {
        mes: revenueMes._sum.total ?? 0,
        mesPrev: revenueMesPrev._sum.total ?? 0,
        tendencia: revenueTrend,
      },
      flota: {
        totalMotos,
      },
      topTiendas,
      topRepartidores,
      security: {
        loginAttempts: loginAttempts,
        failedLogins,
        failureRate: loginAttempts > 0 ? Math.round((failedLogins / loginAttempts) * 100) : 0,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    return handleError(error, 'ADMIN_STATS');
  }
}
