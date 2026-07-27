import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

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

    const data = await db.feedItem.findMany({
      where,
      orderBy: { posicion: 'asc' },
    });

    return NextResponse.json({ data });
} catch (error) {
    return handleError(error, 'FEED_GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const body = await request.json();
    const {
      tipo,
      titulo,
      descripcion,
      icono,
      botonTexto,
      botonLink,
      codigoPromo,
      segmento,
      posicion,
      estado,
      creadoPor,
    } = body;

    if (!tipo || !titulo || !descripcion || !creadoPor) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: tipo, titulo, descripcion, creadoPor' },
        { status: 400 }
      );
    }

    const feedItem = await db.feedItem.create({
      data: {
        tipo,
        titulo,
        descripcion,
        icono: icono || null,
        botonTexto: botonTexto || null,
        botonLink: botonLink || null,
        codigoPromo: codigoPromo || null,
        segmento: segmento || 'todos',
        posicion: posicion ?? 0,
        estado: estado || 'activo',
        creadoPor,
      },
    });

    return NextResponse.json({ data: feedItem }, { status: 201 });
} catch (error) {
    return handleError(error, 'FEED_POST');
  }
}
