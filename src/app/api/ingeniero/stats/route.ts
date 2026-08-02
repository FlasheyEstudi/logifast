import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
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

    const stats = {
      totalMotos: Object.values(motosPorEstado).reduce((a: number, b: number) => a + b, 0),
      disponibles: motosPorEstado['DISPONIBLE'] || 0,
      enServicio: motosPorEstado['EN_SERVICIO'] || 0,
      enMantenimiento: motosPorEstado['EN_MANTENIMIENTO'] || 0,
      fueraServicio: motosPorEstado['FUERA_SERVICIO'] || 0,
      mantenimientosCompletados: mantenimientosMes.filter(m => m.estado === 'COMPLETADO').length,
      mantenimientosPendientes: mantenimientosMes.filter(m => m.estado === 'PROGRAMADO' || m.estado === 'EN_PROCESO').length,
      costoMantenimientoMes: mantenimientosMes
        .filter(m => m.estado === 'COMPLETADO')
        .reduce((sum, m) => sum + m.costoTotal, 0),
      alertasActivas: alertasCount,
      repuestosBajoStock
    };

    return NextResponse.json(stats);
} catch (error) {
    return handleError(error, 'INGENIERO_STATS_GET');
  }
}
