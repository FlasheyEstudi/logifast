import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const segmento = searchParams.get('segmento');
    const mostrarEn = searchParams.get('mostrarEn');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (segmento) where.segmento = segmento;
    if (mostrarEn) where.mostrarEn = mostrarEn;

    const data = await db.banner.findMany({
      where,
      orderBy: { posicion: 'asc' },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[BANNERS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener banners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      subtitulo,
      tipo,
      colorFondo,
      gradiente,
      colorTexto,
      imagenUrl,
      botonTexto,
      botonAccion,
      botonLink,
      icono,
      segmento,
      mostrarEn,
      posicion,
      estado,
      programadoDesde,
      programadoHasta,
      creadoPor,
    } = body;

    if (!titulo || !tipo || !creadoPor) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, tipo, creadoPor' },
        { status: 400 }
      );
    }

    const banner = await db.banner.create({
      data: {
        titulo,
        subtitulo: subtitulo || null,
        tipo,
        colorFondo: colorFondo || '#FF5722',
        gradiente: gradiente || null,
        colorTexto: colorTexto || '#FFFFFF',
        imagenUrl: imagenUrl || null,
        botonTexto: botonTexto || null,
        botonAccion: botonAccion || null,
        botonLink: botonLink || null,
        icono: icono || null,
        segmento: segmento || 'todos',
        mostrarEn: mostrarEn || 'app',
        posicion: posicion ?? 0,
        estado: estado || 'activo',
        programadoDesde: programadoDesde ? new Date(programadoDesde) : null,
        programadoHasta: programadoHasta ? new Date(programadoHasta) : null,
        creadoPor,
      },
    });

    return NextResponse.json({ data: banner }, { status: 201 });
  } catch (error) {
    console.error('[BANNERS_POST]', error);
    return NextResponse.json({ error: 'Error al crear banner' }, { status: 500 });
  }
}
