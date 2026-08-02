import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/ordenes/[id]
 * Actualiza el estado o reasigna el repartidor de una orden en la BD.
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
    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Validar ownership: el cliente creador, el repartidor asignado o un admin
    const profile = user.role === 'repartidor' ? await db.repartidorProfile.findUnique({ where: { userId: user.id } }) : null;
    const isOwner = orden.clienteId === user.id;
    const isAssignedDriver = profile && orden.repartidorId === profile.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAssignedDriver && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado para modificar esta orden' }, { status: 403 });
    }

    const body = await req.json();
    const { estado, repartidorId, incidenciaTipo, incidenciaDesc } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (estado !== undefined) dataToUpdate.estado = estado;
    if (incidenciaTipo !== undefined) dataToUpdate.incidenciaTipo = incidenciaTipo;
    if (incidenciaDesc !== undefined) dataToUpdate.incidenciaDesc = incidenciaDesc;

    // Solo admin puede reasignar repartidor libremente
    if (repartidorId !== undefined && isAdmin) {
      const repProfile = await db.repartidorProfile.findFirst({
        where: {
          OR: [
            { id: repartidorId },
            { userId: repartidorId },
            { user: { name: { contains: repartidorId, mode: 'insensitive' } } },
          ],
        },
        include: { user: true },
      });
      dataToUpdate.repartidorId = repProfile ? repProfile.id : repartidorId;
      if (estado === undefined) {
        dataToUpdate.estado = 'asignado';
      }

      if (repProfile) {
        await db.notificacionRepartidor.create({
          data: {
            repartidorId: repProfile.id,
            tipo: 'reasignacion',
            titulo: 'Orden reasignada',
            contenido: `La orden ${id} te ha sido asignada por el Administrador.`,
            leido: false,
            ordenId: id,
          },
        }).catch(() => null);
      }
    }

    const ordenActualizada = await db.ordenServicio.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ ok: true, orden: ordenActualizada });
  } catch (error) {
    console.error('[ORDEN_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 });
  }
}

/**
 * DELETE /api/ordenes/[id]
 * Cancela una orden de servicio.
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
    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (orden.clienteId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado para cancelar esta orden' }, { status: 403 });
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
