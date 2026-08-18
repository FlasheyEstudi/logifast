import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

const postSchema = z.object({
  titulo: z.string().min(1, 'titulo requerido').max(200),
  subtitulo: z.string().max(300).optional().nullable(),
  tipo: z.enum(['promo_grande', 'tarjeta_compacta', 'slider', 'notificacion']),
  colorFondo: z.string().max(20).optional(),
  gradiente: z.string().max(200).optional().nullable(),
  colorTexto: z.string().max(20).optional(),
  imagenUrl: z.string().max(500).optional().nullable(),
  botonTexto: z.string().max(50).optional().nullable(),
  botonAccion: z.string().max(100).optional().nullable(),
  botonLink: z.string().max(500).optional().nullable(),
  accionTipo: z.enum(['ninguna', 'abrir_tienda', 'aplicar_codigo', 'abrir_categoria', 'abrir_modulo', 'link_externo']).optional(),
  accionValor: z.string().max(200).optional().nullable(),
  icono: z.string().max(50).optional().nullable(),
  segmento: z.string().max(50).optional(),
  mostrarEn: z.enum(['app', 'dashboard', 'ambos']).optional(),
  posicion: z.number().int().min(0).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
  programadoDesde: z.string().min(1).optional().nullable(),
  programadoHasta: z.string().min(1).optional().nullable(),
  creadoPor: z.string().min(1, 'creadoPor requerido'),
});

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
    return handleError(error, 'BANNERS_GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
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
      accionTipo = 'ninguna',
      accionValor,
      icono,
      segmento,
      mostrarEn,
      posicion,
      estado,
      programadoDesde,
      programadoHasta,
      creadoPor,
    } = body;

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
        accionTipo: accionTipo || 'ninguna',
        accionValor: accionValor || null,
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
    return handleError(error, 'BANNERS_POST');
  }
}
