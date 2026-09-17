import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

const postSchema = z.object({
  tipo: z.enum(['anuncio', 'promocion', 'novedad', 'encuesta', 'recordatorio']),
  titulo: z.string().min(1, 'titulo requerido').max(200),
  descripcion: z.string().min(1, 'descripcion requerida').max(2000),
  icono: z.string().max(50).optional().nullable(),
  botonTexto: z.string().max(50).optional().nullable(),
  botonLink: z.string().max(500).optional().nullable(),
  codigoPromo: z.string().max(50).optional().nullable(),
  segmento: z.string().max(50).optional(),
  posicion: z.number().int().min(0).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
  creadoPor: z.string().min(1, 'creadoPor requerido'),
});

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

    let data = await db.feedItem.findMany({
      where,
      orderBy: { posicion: 'asc' },
    });

    // Auto-seed default feed items if database is empty
    if (data.length === 0 && (!estado || estado === 'activo')) {
      const countTotal = await db.feedItem.count();
      if (countTotal === 0) {
        await db.feedItem.createMany({
          data: [
            {
              tipo: 'promocion',
              titulo: 'Cupón de Bienvenida: C$50 de Descuento',
              descripcion: 'Usa el código LOGIFAST50 en tu próximo encargo o compra en restaurantes.',
              codigoPromo: 'LOGIFAST50',
              botonTexto: 'Copiar Cupón',
              icono: 'tag',
              segmento: 'todos',
              posicion: 1,
              estado: 'activo',
              creadoPor: 'admin',
            },
            {
              tipo: 'novedad',
              titulo: 'Cobertura Extendida a Masaya y Tipitapa',
              descripcion: 'Ahora puedes solicitar encomiendas intermunicipales con seguimiento GPS en vivo.',
              botonTexto: 'Cotizar Envío',
              botonLink: '/solicitar',
              icono: 'zap',
              segmento: 'todos',
              posicion: 2,
              estado: 'activo',
              creadoPor: 'admin',
            },
            {
              tipo: 'anuncio',
              titulo: 'Pagos con Billetera Digital y Tarjeta',
              descripcion: 'Aceptamos transferencias LAFISE/BAC y efectivo al recibir tu paquete.',
              icono: 'credit-card',
              segmento: 'todos',
              posicion: 3,
              estado: 'activo',
              creadoPor: 'admin',
            },
          ],
        });
        data = await db.feedItem.findMany({ where, orderBy: { posicion: 'asc' } });
      }
    }

    return NextResponse.json({ data });
} catch (error) {
    return handleError(error, 'FEED_GET');
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

const patchSchema = z.object({
  id: z.string().min(1, 'id requerido'),
  tipo: z.enum(['anuncio', 'promocion', 'novedad', 'encuesta', 'recordatorio']).optional(),
  titulo: z.string().max(200).optional(),
  descripcion: z.string().max(2000).optional(),
  icono: z.string().max(50).optional().nullable(),
  botonTexto: z.string().max(50).optional().nullable(),
  botonLink: z.string().max(500).optional().nullable(),
  codigoPromo: z.string().max(50).optional().nullable(),
  segmento: z.string().max(50).optional(),
  posicion: z.number().int().min(0).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
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
    const existing = await db.feedItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item de feed no encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.icono !== undefined) updateData.icono = data.icono;
    if (data.botonTexto !== undefined) updateData.botonTexto = data.botonTexto;
    if (data.botonLink !== undefined) updateData.botonLink = data.botonLink;
    if (data.codigoPromo !== undefined) updateData.codigoPromo = data.codigoPromo;
    if (data.segmento !== undefined) updateData.segmento = data.segmento;
    if (data.posicion !== undefined) updateData.posicion = data.posicion;
    if (data.estado !== undefined) updateData.estado = data.estado;

    const updated = await db.feedItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error, 'FEED_PATCH');
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
      return NextResponse.json({ error: 'ID de feed requerido' }, { status: 400 });
    }

    const existing = await db.feedItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item de feed no encontrado' }, { status: 404 });
    }

    await db.feedItem.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return handleError(error, 'FEED_DELETE');
  }
}
