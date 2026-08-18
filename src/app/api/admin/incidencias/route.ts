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

    const ordenesIncidencias = await db.ordenServicio.findMany({
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
    });

    return NextResponse.json({ incidencias: ordenesIncidencias });
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

    const updated = await db.ordenServicio.update({
      where: { id: orderId },
      data: {
        estado,
        incidenciaDesc: resolucion ? `RESUELTO (${sessionUser.name || 'Admin'}): ${resolucion}` : undefined,
      },
    });

    // Registrar en auditoría
    await db.auditLog.create({
      data: {
        userId: sessionUser.id,
        accion: 'RESOLVER_INCIDENCIA',
        recurso: `Orden ${orderId}`,
        detalles: `Estado: ${estado} | Resolución: ${resolucion || 'Sin notas'}`,
      },
    }).catch(() => null);

    return NextResponse.json({ orden: updated });
  } catch (error) {
    console.error('[ADMIN_INCIDENCIAS_PATCH]', error);
    return NextResponse.json({ error: 'Error al resolver incidencia' }, { status: 500 });
  }
}
