import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mantenimiento = await prisma.mantenimiento.update({
      where: { id },
      data: { estado: 'EN_PROCESO', iniciadoEn: new Date() }
    });

    // Poner moto en mantenimiento
    await prisma.moto.update({
      where: { id: mantenimiento.motoId },
      data: { estado: 'EN_MANTENIMIENTO' }
    });

    return NextResponse.json(mantenimiento);
  } catch (error) {
    console.error('[INGENIERO_MANTENIMIENTO_INICIAR]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
