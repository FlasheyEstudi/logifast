import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole('ingeniero', 'admin');
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
    return handleError(error, 'INGENIERO_MANTENIMIENTO_COMPLETAR');
  }
}
