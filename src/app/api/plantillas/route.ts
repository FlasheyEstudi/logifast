import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');

    const where: Record<string, unknown> = {};
    if (categoria) where.categoria = categoria;

    const data = await db.plantillaMensaje.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[PLANTILLAS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener plantillas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, categoria, contenido, variables, esDefault } = body;

    if (!nombre || !categoria || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, categoria, contenido' },
        { status: 400 }
      );
    }

    const plantilla = await db.plantillaMensaje.create({
      data: {
        nombre,
        categoria,
        contenido,
        variables: variables || '[]',
        esDefault: esDefault ?? false,
      },
    });

    return NextResponse.json({ data: plantilla }, { status: 201 });
  } catch (error) {
    console.error('[PLANTILLAS_POST]', error);
    return NextResponse.json({ error: 'Error al crear plantilla' }, { status: 500 });
  }
}
