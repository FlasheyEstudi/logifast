import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { emitOrdenAsignada } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/* ─── Helpers de formato ───
 * La cola de despacho alimenta directamente el store `Order` del dashboard.
 * Los campos fecha/hora deben viajar en el formato que consumen la espera y la
 * línea de tiempo del panel ('YYYY-MM-DD' y 'HH:MM' de 24 h), no localizados.
 */

/** 'YYYY-MM-DD' en hora local (toISOString daría el día UTC y desfase de un día). */
function fechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

/** 'HH:MM' de 24 horas. */
function horaLocal(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Iniciales del repartidor para el avatar de la cola. */
function iniciales(nombre?: string | null): string {
  const limpio = String(nombre || '').trim();
  if (!limpio) return 'RP';
  return (
    limpio
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || 'RP'
  );
}

/**
 * GET /api/admin/despacho
 * Returns active dispatch queue (pending/assigned orders) and nearby online drivers.
 *
 * La cola se normaliza al contrato `Order` del dashboard: `cliente` es un string
 * y `repartidor` el nombre del repartidor. Antes se devolvían las filas crudas de
 * Prisma, donde `cliente` viajaba como objeto {id, name, telefono}: al pintarlo el
 * panel lanzaba el error #31 de React ("objects are not valid as a React child").
 */
export async function GET() {
  try {
    await requireRole('admin');
    const [ordenesServicio, ordenesCompra, repartidoresOnline] = await Promise.all([
      db.ordenServicio.findMany({
        where: {
          estado: { in: ['pendiente', 'asignado', 'aceptado', 'recogido', 'incidencia'] },
        },
        include: {
          cliente: { select: { id: true, name: true, telefono: true } },
          repartidor: { select: { id: true, nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.ordenCompra.findMany({
        where: {
          estado: { in: ['recibido', 'preparando', 'listo', 'en_camino', 'incidencia'] },
        },
        include: {
          cliente: { select: { id: true, name: true, telefono: true } },
          tienda: { select: { id: true, nombre: true, direccion: true, lat: true, lng: true } },
          items: true,
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

    // ─── Envíos express → contrato `Order` ───
    const colaServicios = ordenesServicio.map((o) => {
      const creada = new Date(o.createdAt);
      return {
        id: o.id,
        tipo: 'envio' as const,
        cliente: o.clienteNombre || o.cliente?.name || 'Cliente',
        clienteTelefono: o.clienteTelefono || o.cliente?.telefono || '',
        clienteId: o.clienteId,
        origen: o.origen,
        destino: o.destino,
        origenLat: o.origenLat || 0,
        origenLng: o.origenLng || 0,
        destinoLat: o.destinoLat || 0,
        destinoLng: o.destinoLng || 0,
        repartidor: o.repartidor?.nombre || null,
        repartidorId: o.repartidorId || null,
        repartidorInitials: iniciales(o.repartidor?.nombre),
        descripcion: o.paquete || 'Envío de paquete',
        monto: o.monto || 0,
        estado: o.estado,
        metodoPago: o.metodoPago || 'efectivo',
        estadoPago: 'pagado' as const,
        codigoPin: o.codigoPin || undefined,
        fecha: fechaLocal(creada),
        hora: horaLocal(creada),
        timeline: [{ step: 'Creada', hora: horaLocal(creada), completado: true }],
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
    });

    // ─── Compras de tienda → mismo contrato ───
    const colaCompras = ordenesCompra.map((c) => {
      const creada = new Date(c.createdAt);
      return {
        id: c.id,
        tipo: 'compra' as const,
        cliente: c.cliente?.name || 'Cliente Marketplace',
        clienteTelefono: c.cliente?.telefono || '',
        clienteId: c.clienteId,
        origen: c.tienda?.nombre || 'Tienda',
        destino: c.direccionEntrega,
        origenLat: c.tienda?.lat || 12.1364,
        origenLng: c.tienda?.lng || -86.2581,
        destinoLat: c.lat || 12.14,
        destinoLng: c.lng || -86.25,
        repartidor: c.repartidor?.nombre || null,
        repartidorId: c.repartidorId || null,
        repartidorInitials: iniciales(c.repartidor?.nombre),
        descripcion: `Compra Tienda (${c.items?.length || 1} productos)`,
        monto: c.total || 0,
        estado: c.repartidorId ? (c.estado === 'recibido' ? 'asignado' : c.estado) : (c.estado === 'recibido' || c.estado === 'listo' ? 'pendiente' : c.estado),
        metodoPago: c.metodoPago || 'efectivo',
        estadoPago: 'pagado' as const,
        codigoPin: c.codigoPin || undefined,
        fecha: fechaLocal(creada),
        hora: horaLocal(creada),
        timeline: [{ step: 'Creada', hora: horaLocal(creada), completado: true }],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    // Combinar órdenes de paquetería y compras
    const queue = [...colaServicios, ...colaCompras].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      {
        queue,
        driversOnline: repartidoresOnline,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
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
 * Asigna órdenes manualmente o ejecuta auto-despacho inteligente.
 * Soporta reasignación por incidencia tanto en ordenServicio como ordenCompra.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole('admin');

    const body = await req.json();
    const { action = 'auto-dispatch', orderId, driverId } = body;

    if (action === 'manual' && orderId && driverId) {
      const driver = await db.repartidorProfile.findUnique({ where: { id: driverId } });
      if (!driver) return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });

      // 1. Intentar asignar como ordenServicio
      const servicio = await db.ordenServicio.findUnique({ where: { id: orderId } });
      if (servicio) {
        const updateData: Record<string, any> = {
          repartidorId: driver.id,
          estado: 'asignado',
        };
        if (servicio.estado === 'incidencia') {
          updateData.incidenciaDesc = `Reasignado a ${driver.nombre} tras incidencia`;
        }

        const updatedOrder = await db.ordenServicio.update({
          where: { id: orderId },
          data: updateData,
          include: { cliente: true, repartidor: true },
        });

        await db.repartidorProfile.update({
          where: { id: driver.id },
          data: { enServicio: true },
        }).catch(() => null);

        await db.notificacionRepartidor.create({
          data: {
            repartidorId: driver.id,
            tipo: 'orden_asignada',
            titulo: 'Orden asignada desde Despacho',
            contenido: `Se te ha asignado la orden ${orderId} (${updatedOrder.origen || 'Origen'} → ${updatedOrder.destino || 'Destino'})`,
            leido: false,
            ordenId: orderId,
          },
        }).catch(() => null);

        emitOrdenAsignada(driver.id, updatedOrder);
        return NextResponse.json({ success: true, orden: updatedOrder });
      }

      // 2. Intentar asignar como ordenCompra
      const compra = await db.ordenCompra.findUnique({ where: { id: orderId } });
      if (compra) {
        const updatedCompra = await db.ordenCompra.update({
          where: { id: orderId },
          data: {
            repartidorId: driver.id,
            estado: 'en_camino',
          },
          include: { cliente: true, tienda: true, items: true },
        });

        await db.repartidorProfile.update({
          where: { id: driver.id },
          data: { enServicio: true },
        }).catch(() => null);

        await db.notificacionRepartidor.create({
          data: {
            repartidorId: driver.id,
            tipo: 'orden_asignada',
            titulo: 'Pedido de tienda asignado',
            contenido: `Se te ha asignado el pedido ${orderId} de ${updatedCompra.tienda?.nombre || 'tienda'}`,
            leido: false,
            ordenId: orderId,
          },
        }).catch(() => null);

        emitOrdenAsignada(driver.id, updatedCompra);
        return NextResponse.json({ success: true, orden: updatedCompra });
      }

      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Auto-dispatch: órdenes pendientes sin repartidor (o en incidencia)
    const [pendingServicios, pendingCompras] = await Promise.all([
      db.ordenServicio.findMany({
        where: {
          OR: [
            { estado: 'pendiente', repartidorId: null },
            { estado: 'incidencia' },
          ],
        },
        take: 20,
        orderBy: { createdAt: 'asc' },
      }),
      db.ordenCompra.findMany({
        where: {
          repartidorId: null,
          estado: { in: ['recibido', 'listo', 'incidencia'] },
        },
        take: 20,
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const allPending = [
      ...pendingServicios.map((s) => ({ ...s, tipoEntidad: 'servicio' as const })),
      ...pendingCompras.map((c) => ({ ...c, tipoEntidad: 'compra' as const })),
    ];

    if (allPending.length === 0) {
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

    for (const order of allPending) {
      if (usedDriverIds.size >= availableDrivers.length) break;

      const candidates = availableDrivers.filter((d) => !usedDriverIds.has(d.id));

      const origenText = (order as any).origen || (order as any).direccionEntrega || '';
      let driver = candidates.find((d) => {
        if (!d.zonaPreferida || !origenText) return false;
        return origenText.toLowerCase().includes(d.zonaPreferida.toLowerCase());
      });

      const oLat = (order as any).origenLat || (order as any).lat;
      const oLng = (order as any).origenLng || (order as any).lng;

      if (!driver && oLat && oLng) {
        const withCoords = candidates.filter((d) => d.lat != null && d.lng != null);
        if (withCoords.length > 0) {
          withCoords.sort((a, b) => {
            const distA = haversine(oLat, oLng, a.lat!, a.lng!);
            const distB = haversine(oLat, oLng, b.lat!, b.lng!);
            return distA - distB;
          });
          driver = withCoords[0];
        }
      }

      if (!driver) driver = candidates[0];
      if (!driver) continue;

      if (order.tipoEntidad === 'servicio') {
        await db.ordenServicio.update({
          where: { id: order.id },
          data: { repartidorId: driver.id, estado: 'asignado' },
        });
      } else {
        await db.ordenCompra.update({
          where: { id: order.id },
          data: { repartidorId: driver.id, estado: 'en_camino' },
        });
      }

      await db.repartidorProfile.update({
        where: { id: driver.id },
        data: { enServicio: true },
      }).catch(() => null);

      await db.notificacionRepartidor.create({
        data: {
          repartidorId: driver.id,
          tipo: 'orden_asignada',
          titulo: 'Nueva orden auto-asignada',
          contenido: `Se te ha asignado la orden ${order.id}`,
          leido: false,
          ordenId: order.id,
        },
      }).catch(() => null);

      usedDriverIds.add(driver.id);
      assignedCount++;
      emitOrdenAsignada(driver.id, { ...order, repartidorId: driver.id, estado: 'asignado' });
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
