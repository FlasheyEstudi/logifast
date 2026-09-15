import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('ingeniero', 'admin');
    const { id } = await params;

    // P0-21: Validar estado previo (no cancelar lo ya finalizado)
    const mantenimiento = await prisma.mantenimiento.findUnique({ where: { id } });
    if (!mantenimiento) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }
    if (mantenimiento.estado === 'COMPLETADO' || mantenimiento.estado === 'CANCELADO') {
      return NextResponse.json(
        { error: `No se puede cancelar un mantenimiento en estado ${mantenimiento.estado}` },
        { status: 400 }
      );
    }

    const updated = await prisma.mantenimiento.update({
      where: { id },
      data: { estado: 'CANCELADO' }
    });

    // P0-23: Solo liberar la moto si no hay otros mantenimientos activos para esa moto
    const otrosActivos = await prisma.mantenimiento.count({
      where: {
        motoId: mantenimiento.motoId,
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
        id: { not: id },
      },
    });
    if (otrosActivos === 0) {
      const moto = await prisma.moto.update({
        where: { id: mantenimiento.motoId },
        data: { estado: 'DISPONIBLE' }
      }).catch(() => null);

      if (moto?.asignadaA) {
        await prisma.notificacionRepartidor.create({
          data: {
            repartidorId: moto.asignadaA,
            tipo: 'mantenimiento',
            titulo: 'Mantenimiento cancelado',
            contenido: `El servicio de taller para tu moto ${moto.nombre} fue cancelado y la unidad ha quedado disponible.`,
            leido: false,
          },
        }).catch(() => null);

        try {
          const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
          emitirEventoRealtime({
            room: `repartidor:${moto.asignadaA}`,
            event: 'repartidor:moto:mantenimiento_completado',
            data: {
              motoId: moto.id,
              estado: 'DISPONIBLE',
              mensaje: 'Mantenimiento cancelado. Moto liberada.',
            },
          });
        } catch {}
      }
    }

    try {
      const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      emitirEventoRealtime({
        room: 'admin',
        event: 'mantenimiento:completado',
        data: { mantenimientoId: id, motoId: mantenimiento.motoId, estado: 'CANCELADO' },
      });
      emitirEventoRealtime({
        room: 'ingeniero',
        event: 'mantenimiento:completado',
        data: { mantenimientoId: id, motoId: mantenimiento.motoId, estado: 'CANCELADO' },
      });
    } catch {}

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTO_CANCELAR');
  }
}
