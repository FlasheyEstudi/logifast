import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/despacho
 * Returns active dispatch queue (pending/assigned orders) and nearby online drivers.
 */
export async function GET() {
  try {
    await requireRole('admin');
    const [ordenesPendientes, repartidoresOnline] = await Promise.all([
      db.ordenServicio.findMany({
        where: {
          estado: { in: ['pendiente', 'asignado', 'aceptado', 'recogido'] },
        },
        include: {
          cliente: { select: { id: true, name: true, telefono: true } },
          repartidor: { select: { id: true, nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.repartidorProfile.findMany({
        where: { conectado: true },
        select: {
          id: true,
          nombre: true,
          lat: true,
          lng: true,
          enServicio: true,
          pausado: true,
        },
      }),
    ]);

    return NextResponse.json({
      queue: ordenesPendientes,
      driversOnline: repartidoresOnline,
    });
  } catch (error) {
    console.error('[ADMIN_DESPACHO_GET]', error);
    return NextResponse.json({ error: 'Error al obtener cola de despacho' }, { status: 500 });
  }
}

/**
 * POST /api/admin/despacho
 * Auto-dispatches or batch assigns pending orders to nearest available drivers.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole('admin');

    const body = await req.json();
    const { action = 'auto-dispatch', orderId, driverId } = body;

    if (action === 'manual' && orderId && driverId) {
      const driver = await db.repartidorProfile.findUnique({ where: { id: driverId } });
      if (!driver) return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });

      const updatedOrder = await db.ordenServicio.update({
        where: { id: orderId },
        data: {
          repartidorId: driver.id,
          estado: 'asignado',
        },
      });

      await db.notificacionRepartidor.create({
        data: {
          repartidorId: driver.id,
          tipo: 'orden_asignada',
          titulo: 'Orden asignada desde Despacho',
          contenido: `Se te ha asignado manualmente la orden ${orderId}`,
          leido: false,
          ordenId: orderId,
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, orden: updatedOrder });
    }

    // Auto-dispatch all unassigned pending orders
    const pendingOrders = await db.ordenServicio.findMany({
      where: { estado: 'pendiente', repartidorId: null },
      take: 20,
    });

    const availableDrivers = await db.repartidorProfile.findMany({
      where: { conectado: true, enServicio: false, pausado: false },
    });

    let assignedCount = 0;
    for (let i = 0; i < Math.min(pendingOrders.length, availableDrivers.length); i++) {
      const order = pendingOrders[i];
      const driver = availableDrivers[i];

      await db.ordenServicio.update({
        where: { id: order.id },
        data: { repartidorId: driver.id, estado: 'asignado' },
      });

      await db.repartidorProfile.update({
        where: { id: driver.id },
        data: { enServicio: true },
      });

      assignedCount++;
    }

    return NextResponse.json({ success: true, assignedCount });
  } catch (error) {
    console.error('[ADMIN_DESPACHO_POST]', error);
    return NextResponse.json({ error: 'Error en auto-despacho' }, { status: 500 });
  }
}
