import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { costoTotal } = body;

    const mantenimiento = await prisma.mantenimiento.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        costoTotal: parseFloat(costoTotal) || 0,
        completadoEn: new Date()
      }
    });

    // Liberar moto
    await prisma.moto.update({
      where: { id: mantenimiento.motoId },
      data: { estado: 'DISPONIBLE' }
    });

    return NextResponse.json(mantenimiento);
  } catch (error) {
    console.error('[INGENIERO_MANTENIMIENTO_COMPLETAR]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
