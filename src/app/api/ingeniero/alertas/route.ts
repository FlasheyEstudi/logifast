import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
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

    const updatedAlerta = await prisma.alertaMantenimiento.update({
      where: { id },
      data: { activa: false, resuelta: true, resueltaEn: new Date() },
      include: { moto: true },
    });

    try {
      const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      emitirEventoRealtime({
        room: 'ingeniero',
        event: 'ingeniero:alerta:nueva',
        data: { id, resuelta: true },
      });
      if (updatedAlerta.moto?.asignadaA) {
        emitirEventoRealtime({
          room: `repartidor:${updatedAlerta.moto.asignadaA}`,
          event: 'repartidor:moto:update',
          data: { motoId: updatedAlerta.motoId },
        });
      }
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error, 'INGENIERO_ALERTAS_PATCH');
  }
}
