import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const segmento = searchParams.get('segmento');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (segmento) where.segmento = segmento;

    const data = await db.campana.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[CAMPANAS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener campañas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      tipo,
      segmento,
      contenido,
      estado,
      programadaPara,
      creadoPor,
    } = body;

    if (!titulo || !tipo || !segmento || !contenido || !creadoPor) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, tipo, segmento, contenido, creadoPor' },
        { status: 400 }
      );
    }

    const campana = await db.campana.create({
      data: {
        titulo,
        tipo,
        segmento,
        contenido,
        estado: estado || 'borrador',
        programadaPara: programadaPara ? new Date(programadaPara) : null,
        creadoPor,
      },
    });

    return NextResponse.json({ data: campana }, { status: 201 });
  } catch (error) {
    console.error('[CAMPANAS_POST]', error);
    return NextResponse.json({ error: 'Error al crear campaña' }, { status: 500 });
  }
}
