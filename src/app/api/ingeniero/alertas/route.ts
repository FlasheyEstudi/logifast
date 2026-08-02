import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const alertas = await prisma.alertaMantenimiento.findMany({
      where: { activa: true },
      include: { moto: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = alertas.map(a => ({
      ...a,
      motoNombre: a.moto.nombre
    }));

    return NextResponse.json(formatted);
} catch (error) {
    return handleError(error, 'INGENIERO_ALERTAS_GET');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole('ingeniero', 'admin');
    const body = await req.json();
    const { id } = body;

    await prisma.alertaMantenimiento.update({
      where: { id },
      data: { activa: false, resuelta: true, resueltaEn: new Date() }
    });

    return NextResponse.json({ ok: true });
} catch (error) {
    return handleError(error, 'INGENIERO_ALERTAS_PATCH');
  }
}
