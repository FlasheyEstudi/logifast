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
    const body = await req.json();
    const { estado, repartidorId, repartidorNombre, incidenciaTipo, incidenciaDesc } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (estado !== undefined) dataToUpdate.estado = estado;
    if (incidenciaTipo !== undefined) dataToUpdate.incidenciaTipo = incidenciaTipo;
    if (incidenciaDesc !== undefined) dataToUpdate.incidenciaDesc = incidenciaDesc;

    // Si se reasigna a un repartidor
    if (repartidorId !== undefined) {
      // Buscar el perfil del repartidor si se pasó userId, profile id o nombre
      const profile = await db.repartidorProfile.findFirst({
        where: {
          OR: [
            { id: repartidorId },
            { userId: repartidorId },
            { user: { name: { contains: repartidorId, mode: 'insensitive' } } },
          ],
        },
        include: { user: true },
      });
      dataToUpdate.repartidorId = profile ? profile.id : repartidorId;
      if (estado === undefined) {
        dataToUpdate.estado = 'asignado';
      }

      if (profile) {
        // Crear notificación para el nuevo repartidor
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
    const orden = await db.ordenServicio.update({
      where: { id },
      data: { estado: 'cancelado' },
    });

    return NextResponse.json({ ok: true, orden });
  } catch (error) {
    console.error('[ORDEN_DELETE]', error);
    return NextResponse.json({ error: 'Error al cancelar la orden' }, { status: 500 });
  }
}
