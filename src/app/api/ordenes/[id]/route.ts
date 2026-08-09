import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/ordenes/[id]
 * Actualiza el estado o reasigna el repartidor de una orden en la BD.
 * - Solo el cliente dueño, el repartidor asignado o un admin pueden modificar.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Ownership check: cargar la orden (ordenServicio u ordenCompra)
    let isCompra = false;
    let orden = await db.ordenServicio.findUnique({
      where: { id },
      select: { clienteId: true, repartidorId: true },
    });

    if (!orden) {
      const ordenCompra = await db.ordenCompra.findUnique({
        where: { id },
        select: { clienteId: true, repartidorId: true },
      });
      if (!ordenCompra) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }
      isCompra = true;
      orden = ordenCompra;
    }

    // Si es repartidor, validar que sea el asignado a esta orden
    if (user.role === 'repartidor') {
      const myProfile = await db.repartidorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!myProfile || orden.repartidorId !== myProfile.id) {
        return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
      }
    } else if (user.role === 'cliente') {
      if (orden.clienteId !== user.id) {
        return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
      }
    } else if (user.role !== 'admin' && user.role !== 'ingeniero') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { estado, repartidorId, incidenciaTipo, incidenciaDesc } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (estado !== undefined) dataToUpdate.estado = estado;
    if (incidenciaTipo !== undefined) dataToUpdate.incidenciaTipo = incidenciaTipo;
    if (incidenciaDesc !== undefined) dataToUpdate.incidenciaDesc = incidenciaDesc;

    // Reasignación de repartidor — solo admin puede reasignar
    if (repartidorId !== undefined) {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Solo un admin puede reasignar órdenes' }, { status: 403 });
      }
      const profile = await db.repartidorProfile.findFirst({
        where: {
          OR: [
            { id: repartidorId },
            { userId: repartidorId },
            { user: { name: { contains: repartidorId } } },
          ],
        },
        include: { user: true },
      });
      dataToUpdate.repartidorId = profile ? profile.id : repartidorId;
      if (estado === undefined) {
        dataToUpdate.estado = 'asignado';
      }

      if (profile) {
        await db.notificacionRepartidor.create({
          data: {
            repartidorId: profile.id,
            tipo: 'reasignacion',
            titulo: 'Orden reasignada',
            contenido: `La orden ${id} te ha sido asignada por el Administrador.`,
            leido: false,
            ordenId: id,
          },
        }).catch(() => null);
      }
    }

    let ordenActualizada;
    if (isCompra) {
      ordenActualizada = await db.ordenCompra.update({
        where: { id },
        data: dataToUpdate,
      });
    } else {
      ordenActualizada = await db.ordenServicio.update({
        where: { id },
        data: dataToUpdate,
      });
    }

    return NextResponse.json({ ok: true, orden: ordenActualizada });
  } catch (error) {
    console.error('[ORDEN_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 });
  }
}

/**
 * DELETE /api/ordenes/[id]
 * Cancela una orden de servicio. Solo el cliente dueño o un admin.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Ownership check
    const orden = await db.ordenServicio.findUnique({
      where: { id },
      select: { clienteId: true, estado: true },
    });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (user.role === 'cliente' && orden.clienteId !== user.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }
    if (user.role !== 'cliente' && user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // No permitir cancelar órdenes ya entregadas
    if (orden.estado === 'entregado') {
      return NextResponse.json({ error: 'No se puede cancelar una orden ya entregada' }, { status: 400 });
    }

    const ordenCancelada = await db.ordenServicio.update({
      where: { id },
      data: { estado: 'cancelado' },
    });

    return NextResponse.json({ ok: true, orden: ordenCancelada });
  } catch (error) {
    console.error('[ORDEN_DELETE]', error);
    return NextResponse.json({ error: 'Error al cancelar la orden' }, { status: 500 });
  }
}
