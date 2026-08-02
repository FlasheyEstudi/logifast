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

    // P0-21: Validar estado previo (state machine)
    const mantenimiento = await prisma.mantenimiento.findUnique({ where: { id } });
    if (!mantenimiento) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }
    if (mantenimiento.estado !== 'PENDIENTE') {
      return NextResponse.json(
        { error: `Solo se pueden iniciar mantenimientos pendientes. Estado actual: ${mantenimiento.estado}` },
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

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTO_INICIAR');
  }
}
