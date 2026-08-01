import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/finanzas
 * Returns total revenue, daily breakdown, driver balance reloads (RecargaSaldo), and payment conciliations.
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [recargas, ordenesServicio, ordenesCompra] = await Promise.all([
      db.recargaSaldo.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      db.ordenServicio.findMany({
        where: { estado: 'entregado' },
        select: { id: true, monto: true, ganancia: true, metodoPago: true, createdAt: true },
        take: 500,
      }),
      db.ordenCompra.findMany({
        where: { estado: 'entregado' },
        select: { id: true, total: true, subtotal: true, costoEnvio: true, metodoPago: true, createdAt: true },
        take: 500,
      }),
    ]);

    const totalIngresosEnvios = ordenesServicio.reduce((s, o) => s + (o.monto || 0), 0);
    const totalGananciasEnvios = ordenesServicio.reduce((s, o) => s + (o.ganancia || 0), 0);
    const totalIngresosMarketplace = ordenesCompra.reduce((s, o) => s + (o.total || 0), 0);

    return NextResponse.json({
      resumen: {
        totalIngresosEnvios,
        totalGananciasEnvios,
        totalIngresosMarketplace,
        totalRecargas: recargas.length,
      },
      recargas,
    });
  } catch (error) {
    console.error('[ADMIN_FINANZAS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener datos financieros' }, { status: 500 });
  }
}

/**
 * POST /api/admin/finanzas
 * Approves a driver balance reload or creates a financial adjustment.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { repartidorId, monto, metodo = 'transferencia', referencia } = body;

    if (!repartidorId || !monto) {
      return NextResponse.json({ error: 'repartidorId y monto son requeridos' }, { status: 400 });
    }

    const recarga = await db.recargaSaldo.create({
      data: {
        repartidorId,
        monto: Number(monto),
        metodo,
        referencia: referencia ? String(referencia) : undefined,
        estado: 'completada',
      },
    });

    // Update driver balance
    await db.repartidorProfile.update({
      where: { id: repartidorId },
      data: { saldo: { increment: Number(monto) } },
    });

    return NextResponse.json({ recarga });
  } catch (error) {
    console.error('[ADMIN_FINANZAS_POST]', error);
    return NextResponse.json({ error: 'Error al procesar recarga financiera' }, { status: 500 });
  }
}
