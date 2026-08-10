import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('ingeniero', 'admin');
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [motos, mantenimientosMes, alertasCount, repuestos] = await Promise.all([
      prisma.moto.groupBy({
        by: ['estado'],
        _count: true
      }),
      prisma.mantenimiento.findMany({
        where: { createdAt: { gte: inicioMes } }
      }),
      prisma.alertaMantenimiento.count({ where: { activa: true } }),
      prisma.repuesto.findMany()
    ]);

    const motosPorEstado = motos.reduce((acc, m) => {
      acc[m.estado] = m._count;
      return acc;
    }, {} as Record<string, number>);

    const repuestosBajoStock = repuestos.filter(r => r.stock <= r.stockMinimo).length;

    const completados = mantenimientosMes.filter(m => m.estado === 'COMPLETADO');
    const totalCompletados = completados.length;
    const preventivos = mantenimientosMes.filter(m => m.tipo === 'PREVENTIVO').length;
    const correctivos = mantenimientosMes.filter(m => m.tipo === 'CORRECTIVO' || m.tipo === 'EMERGENCIA').length;
    const totalMants = mantenimientosMes.length || 1;

    const preventivoPct = Math.round((preventivos / totalMants) * 100);
    const correctivoPct = 100 - preventivoPct;

    // Calcular MTTR (Mean Time to Repair en minutos)
    const duracionesMinutos = completados
      .map(m => {
        const inicio = m.iniciadoEn || m.createdAt;
        const fin = m.completadoEn;
        if (!inicio || !fin) return null;
        const diffMs = new Date(fin).getTime() - new Date(inicio).getTime();
        return Math.max(5, Math.round(diffMs / (1000 * 60)));
      })
      .filter((d): d is number => d !== null);

    const mttrMinutos = duracionesMinutos.length > 0
      ? Math.round(duracionesMinutos.reduce((a, b) => a + b, 0) / duracionesMinutos.length)
      : 45; // Default de la industria: 45 min

    const stats = {
      totalMotos: Object.values(motosPorEstado).reduce((a: number, b: number) => a + b, 0),
      disponibles: motosPorEstado['DISPONIBLE'] || 0,
      enServicio: motosPorEstado['EN_SERVICIO'] || 0,
      enMantenimiento: motosPorEstado['EN_MANTENIMIENTO'] || 0,
      fueraServicio: motosPorEstado['FUERA_SERVICIO'] || 0,
      mantenimientosCompletados: totalCompletados,
      mantenimientosPendientes: mantenimientosMes.filter(m => m.estado === 'PROGRAMADO' || m.estado === 'EN_PROCESO').length,
      costoMantenimientoMes: mantenimientosMes
        .filter(m => m.estado === 'COMPLETADO')
        .reduce((sum, m) => sum + m.costoTotal, 0),
      alertasActivas: alertasCount,
      repuestosBajoStock,
      preventivoPct,
      correctivoPct,
      mttrMinutos,
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
} catch (error) {
    return handleError(error, 'INGENIERO_STATS_GET');
  }
}
