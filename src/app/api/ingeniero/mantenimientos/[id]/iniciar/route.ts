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

    // Validar estado previo (state machine)
    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id },
      include: { moto: true },
    });
    if (!mantenimiento) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }
    if (mantenimiento.estado !== 'PENDIENTE' && mantenimiento.estado !== 'PROGRAMADO') {
      return NextResponse.json(
        { error: `Solo se pueden iniciar mantenimientos programados o pendientes. Estado actual: ${mantenimiento.estado}` },
        { status: 400 }
      );
    }

    const updated = await prisma.mantenimiento.update({
      where: { id },
      data: { estado: 'EN_PROCESO', iniciadoEn: new Date() }
    });

    // Poner moto en mantenimiento
    await prisma.moto.update({
      where: { id: mantenimiento.motoId },
      data: { estado: 'EN_MANTENIMIENTO' }
    }).catch(() => null);

    // Notificar al repartidor asignado
    if (mantenimiento.moto?.asignadaA) {
      await prisma.notificacionRepartidor.create({
        data: {
          repartidorId: mantenimiento.moto.asignadaA,
          tipo: 'mantenimiento',
          titulo: 'Mantenimiento en curso',
          contenido: `Tu moto (${mantenimiento.moto.nombre || 'Asignada'} - ${mantenimiento.moto.placa || ''}) ha ingresado al taller y se encuentra en revisión técnica.`,
          leido: false,
        },
      }).catch(() => null);
    }

    try {
      const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      emitirEventoRealtime({
        room: 'admin',
        event: 'mantenimiento:iniciado',
        data: { mantenimientoId: id, motoId: mantenimiento.motoId, estado: 'EN_PROCESO' },
      });
      emitirEventoRealtime({
        room: 'ingeniero',
        event: 'mantenimiento:iniciado',
        data: { mantenimientoId: id, motoId: mantenimiento.motoId, estado: 'EN_PROCESO' },
      });
      if (mantenimiento.moto?.asignadaA) {
        emitirEventoRealtime({
          room: `repartidor:${mantenimiento.moto.asignadaA}`,
          event: 'repartidor:moto:mantenimiento_iniciado',
          data: {
            motoId: mantenimiento.motoId,
            estado: 'EN_MANTENIMIENTO',
            mensaje: 'Mantenimiento en proceso por el equipo técnico.',
          },
        });
      }
    } catch {}

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTO_INICIAR');
  }
}
