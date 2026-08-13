import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';
import { seedIngeniero } from '@/lib/seedIngeniero';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    await seedIngeniero();
    const alertas = await prisma.alertaMantenimiento.findMany({
      where: { activa: true },
      include: { moto: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = alertas.map(a => ({
      ...a,
      motoNombre: a.moto?.nombre || 'Moto'
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return handleError(error, 'INGENIERO_ALERTAS_GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    const body = await req.json();
    const { motoId, tipo, descripcion, kmTrigger, fechaTrigger } = body;

    const alerta = await prisma.alertaMantenimiento.create({
      data: {
        motoId,
        tipo: tipo || 'KM',
        descripcion,
        kmTrigger: kmTrigger ? parseFloat(kmTrigger) : null,
        fechaTrigger: fechaTrigger ? new Date(fechaTrigger) : null,
        activa: true,
      },
      include: { moto: { select: { nombre: true } } }
    });

    return NextResponse.json({
      ...alerta,
      motoNombre: alerta.moto?.nombre || 'Moto'
    }, { status: 201 });
  } catch (error) {
    return handleError(error, 'INGENIERO_ALERTAS_POST');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
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
