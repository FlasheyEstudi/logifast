import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
          zonaPreferida: true,
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
 * Auto-dispatches or batch assigns pending orders to nearest available drivers with area preferences.
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

    // Auto-dispatch inteligente con preferencias de zona y proximidad GPS (<5km)
    const pendingOrders = await db.ordenServicio.findMany({
      where: { estado: 'pendiente', repartidorId: null },
      take: 20,
    });

    const availableDrivers = await db.repartidorProfile.findMany({
      where: { conectado: true, enServicio: false, pausado: false, aceptaOrdenes: true },
    });

    const usedDriverIds = new Set<string>();
    let assignedCount = 0;

    for (const order of pendingOrders) {
      const candidateDrivers = availableDrivers.filter((d) => !usedDriverIds.has(d.id));
      if (candidateDrivers.length === 0) break;

      let bestDriver = candidateDrivers.find(
        (d) => d.zonaPreferida && order.origen && d.zonaPreferida.toLowerCase() === order.origen.toLowerCase()
      );

      if (!bestDriver && order.origenLat && order.origenLng) {
        let minDistance = 5; // radio máximo de 5 km
        for (const driver of candidateDrivers) {
          if (driver.lat && driver.lng) {
            const dist = haversineDistance(order.origenLat, order.origenLng, driver.lat, driver.lng);
            if (dist < minDistance) {
              minDistance = dist;
              bestDriver = driver;
            }
          }
        }
      }

      if (!bestDriver) {
        bestDriver = candidateDrivers[0];
      }

      if (bestDriver) {
        usedDriverIds.add(bestDriver.id);
        await db.ordenServicio.update({
          where: { id: order.id },
          data: { repartidorId: bestDriver.id, estado: 'asignado' },
        });

        await db.repartidorProfile.update({
          where: { id: bestDriver.id },
          data: { enServicio: true },
        });

        assignedCount++;
      }
    }

    return NextResponse.json({ success: true, assignedCount });
  } catch (error) {
    console.error('[ADMIN_DESPACHO_POST]', error);
    return NextResponse.json({ error: 'Error en auto-despacho' }, { status: 500 });
  }
}
