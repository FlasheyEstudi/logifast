import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { seedIngeniero } from '@/lib/seedIngeniero';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('ingeniero', 'admin');
    await seedIngeniero();
    const motos = await prisma.moto.findMany({
      include: {
        mantenimientos: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        alertas: {
          where: { activa: true }
        },
        _count: {
          select: { alertas: { where: { activa: true } } }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    const motosFormatted = motos.map(moto => ({
      ...moto,
      alertas: moto._count.alertas,
      ultimoMantenimiento: moto.mantenimientos[0] || null
    }));

    return NextResponse.json(motosFormatted);
} catch (error) {
    return handleError(error, 'INGENIERO_MOTOS_GET');
  }
}
