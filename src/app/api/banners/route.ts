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

    let data = await db.banner.findMany({
      where,
      orderBy: { posicion: 'asc' },
    });

    // Auto-seed default banners if database has none
    if (data.length === 0 && (!estado || estado === 'activo')) {
      const countTotal = await db.banner.count();
      if (countTotal === 0) {
        await db.banner.createMany({
          data: [
            {
              titulo: '50% OFF en tu Primer Envío',
              subtitulo: 'Aplica cupón BIENVENIDO50 y ahorra hasta C$80 en tu primera entrega.',
              tipo: 'promo_grande',
              colorFondo: '#FF5722',
              colorTexto: '#FFFFFF',
              botonTexto: 'Usar Cupón',
              botonAccion: 'aplicar_codigo',
              botonLink: 'BIENVENIDO50',
              segmento: 'todos',
              mostrarEn: 'app',
              posicion: 1,
              estado: 'activo',
              creadoPor: 'admin',
            },
            {
              titulo: 'Envíos Express en 30 Minutos',
              subtitulo: 'Flota activa con geolocalización en vivo en Managua y Ciudad Sandino.',
              tipo: 'promo_grande',
              colorFondo: '#1B1B2F',
              colorTexto: '#FFFFFF',
              botonTexto: 'Pedir Envío',
              botonAccion: 'abrir_modulo',
              botonLink: 'solicitar',
              segmento: 'todos',
              mostrarEn: 'app',
              posicion: 2,
              estado: 'activo',
              creadoPor: 'admin',
            },
            {
              titulo: 'Restaurantes y Comida Caliente',
              subtitulo: 'Pide de tus locales favoritos con tarifa plana de entrega.',
              tipo: 'slider',
              colorFondo: '#0F172A',
              colorTexto: '#FFFFFF',
              botonTexto: 'Ver Menús',
              botonAccion: 'abrir_categoria',
              botonLink: 'restaurantes',
              segmento: 'todos',
              mostrarEn: 'app',
              posicion: 3,
              estado: 'activo',
              creadoPor: 'admin',
            },
          ],
        });
        data = await db.banner.findMany({ where, orderBy: { posicion: 'asc' } });
      }
    }

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
        botonAccion: botonAccion || accionTipo || null,
        botonLink: botonLink || accionValor || null,
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

const patchSchema = z.object({
  id: z.string().min(1, 'id requerido'),
  titulo: z.string().max(200).optional(),
  subtitulo: z.string().max(300).optional().nullable(),
  tipo: z.enum(['promo_grande', 'tarjeta_compacta', 'slider', 'notificacion']).optional(),
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
});

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('admin');
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.subtitulo !== undefined) updateData.subtitulo = data.subtitulo;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.colorFondo !== undefined) updateData.colorFondo = data.colorFondo;
    if (data.gradiente !== undefined) updateData.gradiente = data.gradiente;
    if (data.colorTexto !== undefined) updateData.colorTexto = data.colorTexto;
    if (data.imagenUrl !== undefined) updateData.imagenUrl = data.imagenUrl;
    if (data.botonAccion !== undefined || data.accionTipo !== undefined) {
      updateData.botonAccion = data.botonAccion ?? data.accionTipo;
    }
    if (data.botonLink !== undefined || data.accionValor !== undefined) {
      updateData.botonLink = data.botonLink ?? data.accionValor;
    }
    if (data.icono !== undefined) updateData.icono = data.icono;
    if (data.segmento !== undefined) updateData.segmento = data.segmento;
    if (data.mostrarEn !== undefined) updateData.mostrarEn = data.mostrarEn;
    if (data.posicion !== undefined) updateData.posicion = data.posicion;
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.programadoDesde !== undefined) {
      updateData.programadoDesde = data.programadoDesde ? new Date(data.programadoDesde) : null;
    }
    if (data.programadoHasta !== undefined) {
      updateData.programadoHasta = data.programadoHasta ? new Date(data.programadoHasta) : null;
    }

    const updated = await db.banner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error, 'BANNERS_PATCH');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole('admin');
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // no body provided
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'ID de banner requerido' }, { status: 400 });
    }

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner no encontrado' }, { status: 404 });
    }

    await db.banner.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleError(error, 'BANNERS_DELETE');
  }
}
