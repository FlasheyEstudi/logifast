import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/incidencias
 * Returns all orders with reported incidents, cancellations or operational anomalies.
 * Bandwidth-optimized with lean select and capped at 100 entries.
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [ordenesIncidencias, comprasIncidencias] = await Promise.all([
      db.ordenServicio.findMany({
        where: {
          OR: [
            { estado: 'incidencia' },
            { estado: 'cancelado' },
            { incidenciaTipo: { not: null } },
          ],
        },
        select: {
          id: true,
          estado: true,
          incidenciaTipo: true,
          incidenciaDesc: true,
          monto: true,
          origen: true,
          destino: true,
          clienteNombre: true,
          clienteTelefono: true,
          createdAt: true,
          updatedAt: true,
          cliente: { select: { id: true, name: true, email: true, telefono: true } },
          repartidor: { select: { id: true, nombre: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      db.ordenCompra.findMany({
        where: {
          OR: [
            { estado: 'incidencia' },
            { estado: 'cancelado' },
            { instrucciones: { contains: 'incidencia', mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          estado: true,
          instrucciones: true,
          total: true,
          direccionEntrega: true,
          createdAt: true,
          updatedAt: true,
          cliente: { select: { id: true, name: true, email: true, telefono: true } },
          tienda: { select: { id: true, nombre: true } },
          repartidorId: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
    ]);

    const comprasMapeadas = comprasIncidencias.map((c) => ({
      id: c.id,
      tipo: 'compra',
      estado: c.estado,
      incidenciaTipo: 'Incidencia Tienda',
      incidenciaDesc: c.instrucciones || 'Reportado en pedido de tienda',
      monto: c.total,
      origen: c.tienda?.nombre || 'Tienda Marketplace',
      destino: c.direccionEntrega,
      clienteNombre: c.cliente?.name || 'Cliente Marketplace',
      clienteTelefono: c.cliente?.telefono || '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      cliente: c.cliente,
      repartidor: null,
    }));

    const todas = [
      ...ordenesIncidencias.map((o) => ({ ...o, tipo: 'envio' })),
      ...comprasMapeadas,
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ incidencias: todas });
  } catch (error) {
    console.error('[ADMIN_INCIDENCIAS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener incidencias' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/incidencias
 * Resolves an incident report with admin notes and state transition.
 */
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, estado = 'entregado', resolucion } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId es requerido' }, { status: 400 });
    }

    const { emitOrdenActualizada } = await import('@/lib/realtime-emitter');

    // 1. Verificar si es ordenServicio
    const servicio = await db.ordenServicio.findUnique({ where: { id: orderId } });
    if (servicio) {
      const updated = await db.ordenServicio.update({
        where: { id: orderId },
        data: {
          estado,
          incidenciaDesc: resolucion ? `RESUELTO (${sessionUser.name || 'Admin'}): ${resolucion}` : undefined,
        },
      });

      await db.auditLog.create({
        data: {
          userId: sessionUser.id,
          accion: 'RESOLVER_INCIDENCIA',
          recurso: `Orden ${orderId}`,
          detalles: `Estado: ${estado} | Resolución: ${resolucion || 'Sin notas'}`,
        },
      }).catch(() => null);

      emitOrdenActualizada(updated);
      return NextResponse.json({ orden: updated });
    }

    // 2. Verificar si es ordenCompra
    const compra = await db.ordenCompra.findUnique({ where: { id: orderId } });
    if (compra) {
      const updated = await db.ordenCompra.update({
        where: { id: orderId },
        data: {
          estado: estado === 'entregado' ? 'entregado' : estado === 'cancelado' ? 'cancelado' : 'recibido',
          instrucciones: resolucion ? `RESUELTO (${sessionUser.name || 'Admin'}): ${resolucion}` : compra.instrucciones,
        },
      });

      await db.auditLog.create({
        data: {
          userId: sessionUser.id,
          accion: 'RESOLVER_INCIDENCIA',
          recurso: `Compra ${orderId}`,
          detalles: `Estado: ${estado} | Resolución: ${resolucion || 'Sin notas'}`,
        },
      }).catch(() => null);

      emitOrdenActualizada(updated);
      return NextResponse.json({ orden: updated });
    }

    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  } catch (error) {
    console.error('[ADMIN_INCIDENCIAS_PATCH]', error);
    return NextResponse.json({ error: 'Error al resolver incidencia' }, { status: 500 });
  }
}
