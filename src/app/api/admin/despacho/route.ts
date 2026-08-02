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
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al obtener cola de despacho' },
      { status }
    );
  }
}

/**
 * POST /api/admin/despacho
 * Auto-dispatches or batch assigns pending orders to nearest available drivers.
 * Respeta: conectado, !enServicio, !pausado, contratoAceptado, zonaPreferida.
 * Usa updateMany atómico para evitar race conditions (dos órdenes al mismo driver).
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole('admin');

    const body = await req.json();
    const { action = 'auto-dispatch', orderId, driverId } = body;

    if (action === 'manual' && orderId && driverId) {
      const driver = await db.repartidorProfile.findUnique({ where: { id: driverId } });
      if (!driver) return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });

      // Asignación atómica: solo si la orden sigue pendiente y sin repartidor
      const result = await db.ordenServicio.updateMany({
        where: { id: orderId, repartidorId: null, estado: 'pendiente' },
        data: { repartidorId: driver.id, estado: 'asignado' },
      });
      if (result.count === 0) {
        return NextResponse.json({ error: 'La orden ya fue asignada o no está pendiente' }, { status: 409 });
      }

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

      const updatedOrder = await db.ordenServicio.findUnique({ where: { id: orderId } });
      return NextResponse.json({ success: true, orden: updatedOrder });
    }

    // Auto-dispatch: órdenes pendientes sin repartidor
    const pendingOrders = await db.ordenServicio.findMany({
      where: { estado: 'pendiente', repartidorId: null },
      take: 20,
      orderBy: { createdAt: 'asc' }, // FIFO: las más antiguas primero
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({ success: true, assignedCount: 0, message: 'No hay órdenes pendientes' });
    }

    // Repartidores disponibles (con contrato aceptado y aceptando órdenes)
    const availableDrivers = await db.repartidorProfile.findMany({
      where: {
        conectado: true,
        enServicio: false,
        pausado: false,
        contratoAceptado: true,
      },
    });

    if (availableDrivers.length === 0) {
      return NextResponse.json({ success: true, assignedCount: 0, message: 'No hay repartidores disponibles' });
    }

    let assignedCount = 0;
    const usedDriverIds = new Set<string>();

    for (const order of pendingOrders) {
      if (usedDriverIds.size >= availableDrivers.length) break;

      // Filtrar por zona preferida si la orden tiene zona de origen
      const candidates = availableDrivers.filter((d) => !usedDriverIds.has(d.id));

      // Preferir repartidores cuya zonaPreferida coincida con el origen de la orden
      let driver = candidates.find((d) => {
        if (!d.zonaPreferida || !order.origen) return false;
        return order.origen.toLowerCase().includes(d.zonaPreferida.toLowerCase());
      });

      // Si no hay match por zona, usar el más cercano por Haversine (si hay coords)
      if (!driver && order.origenLat && order.origenLng) {
        const withCoords = candidates.filter((d) => d.lat != null && d.lng != null);
        if (withCoords.length > 0) {
          withCoords.sort((a, b) => {
            const distA = haversine(order.origenLat!, order.origenLng!, a.lat!, a.lng!);
            const distB = haversine(order.origenLat!, order.origenLng!, b.lat!, b.lng!);
            return distA - distB;
          });
          driver = withCoords[0];
        }
      }

      // Fallback: primer candidato disponible
      if (!driver) driver = candidates[0];
      if (!driver) continue;

      // Asignación atómica con updateMany
      const result = await db.ordenServicio.updateMany({
        where: { id: order.id, repartidorId: null, estado: 'pendiente' },
        data: { repartidorId: driver.id, estado: 'asignado' },
      });
      if (result.count === 0) continue; // ya fue asignada por otro proceso

      await db.repartidorProfile.update({
        where: { id: driver.id },
        data: { enServicio: true },
      }).catch(() => null);

      await db.notificacionRepartidor.create({
        data: {
          repartidorId: driver.id,
          tipo: 'orden_asignada',
          titulo: 'Nueva orden asignada',
          contenido: `Se te ha asignado la orden ${order.id}. Origen: ${order.origen ?? 'N/A'}`,
          leido: false,
          ordenId: order.id,
        },
      }).catch(() => null);

      usedDriverIds.add(driver.id);
      assignedCount++;
    }

    return NextResponse.json({ success: true, assignedCount });
  } catch (error) {
    console.error('[ADMIN_DESPACHO_POST]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error en auto-despacho' },
      { status }
    );
  }
}

/** Distancia Haversine en km entre dos puntos. */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
