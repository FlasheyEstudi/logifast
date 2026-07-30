import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reportes
 * Generates advanced analytical reports across orders, riders, revenues, and incidents.
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (sessionUser && sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [
      totalOrdenes,
      entregadas,
      incidenciasCount,
      canceladas,
      motosTotal,
      motosEnServicio,
      repartidoresTotal,
      repartidoresConectados,
    ] = await Promise.all([
      db.ordenServicio.count(),
      db.ordenServicio.count({ where: { estado: 'entregado' } }),
      db.ordenServicio.count({ where: { estado: 'incidencia' } }),
      db.ordenServicio.count({ where: { estado: 'cancelado' } }),
      db.moto.count(),
      db.moto.count({ where: { estado: 'EN_SERVICIO' } }),
      db.repartidorProfile.count(),
      db.repartidorProfile.count({ where: { conectado: true } }),
    ]);

    const tasaExito = totalOrdenes > 0 ? Math.round((entregadas / totalOrdenes) * 100) : 100;

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
      },
    });
  } catch (error) {
    console.error('[ADMIN_REPORTES_GET]', error);
    return NextResponse.json({ error: 'Error al generar reportes' }, { status: 500 });
  }
}
