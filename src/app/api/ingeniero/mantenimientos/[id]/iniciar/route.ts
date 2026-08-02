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

    if (existing.estado !== 'PROGRAMADO' && existing.estado !== 'PENDIENTE' && existing.estado !== 'pendiente') {
      return NextResponse.json(
        { error: `No se puede iniciar un mantenimiento en estado: ${existing.estado}` },
        { status: 400 }
      );
    }

    const mantenimiento = await prisma.mantenimiento.update({
      where: { id },
      data: { estado: 'EN_PROCESO', iniciadoEn: new Date() },
    });

    // Poner moto en mantenimiento
    await prisma.moto.update({
      where: { id: mantenimiento.motoId },
      data: { estado: 'EN_MANTENIMIENTO' },
    });

    return NextResponse.json(mantenimiento);
  } catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTO_INICIAR');
  }
}
