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

    const existing = await prisma.mantenimiento.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }

    if (existing.estado === 'COMPLETADO' || existing.estado === 'CANCELADO') {
      return NextResponse.json(
        { error: `No se puede cancelar un mantenimiento que ya está ${existing.estado}` },
        { status: 400 }
      );
    }

    const mantenimiento = await prisma.mantenimiento.update({
      where: { id },
      data: { estado: 'CANCELADO' },
    });

    // P0-23: Liberar moto solo si no hay otros mantenimientos activos
    const otrosActivos = await prisma.mantenimiento.count({
      where: {
        motoId: mantenimiento.motoId,
        estado: { in: ['PROGRAMADO', 'PENDIENTE', 'EN_PROCESO', 'pendiente', 'en_progreso'] },
        id: { not: id },
      },
    });

    if (otrosActivos === 0) {
      await prisma.moto.update({
        where: { id: mantenimiento.motoId },
        data: { estado: 'DISPONIBLE' },
      });
    }

    return NextResponse.json(mantenimiento);
  } catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTO_CANCELAR');
  }
}
