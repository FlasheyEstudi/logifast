import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const motoId = searchParams.get('motoId');

    const where: any = {};
    if (estado) where.estado = estado;
    if (motoId) where.motoId = motoId;

    const mantenimientos = await prisma.mantenimiento.findMany({
      where,
      include: {
        moto: { select: { nombre: true, modelo: true } },
        repuestosUsados: {
          include: { repuesto: { select: { nombre: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(mantenimientos);
  } catch (error) {
    console.error('[INGENIERO_MANTENIMIENTOS_GET]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        motoId: data.motoId,
        tipo: data.tipo,
        categoria: data.categoria,
        descripcion: data.descripcion,
        observaciones: data.observaciones,
        kmAlMomento: parseFloat(data.kmAlMomento) || 0,
        costoManoObra: parseFloat(data.costoManoObra) || 0,
        prioridad: data.prioridad || 'NORMAL',
        programadoPara: data.programadoPara ? new Date(data.programadoPara) : null
      }
    });

    // Si es emergencia, poner moto en mantenimiento
    if (data.tipo === 'EMERGENCIA') {
      await prisma.moto.update({
        where: { id: data.motoId },
        data: { estado: 'EN_MANTENIMIENTO' }
      });
    }

    return NextResponse.json(mantenimiento, { status: 201 });
  } catch (error) {
    console.error('[INGENIERO_MANTENIMIENTOS_POST]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
