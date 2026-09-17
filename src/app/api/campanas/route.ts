import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';
import { enviarCampana } from '@/lib/campanas-sender';

const postSchema = z.object({
  titulo: z.string().min(1, 'titulo requerido').max(200),
  tipo: z.enum(['push', 'email', 'sms']),
  segmento: z.string().min(1, 'segmento requerido').max(50),
  contenido: z.string().min(1, 'contenido requerido'),
  triggerTipo: z.enum(['manual', 'inactividad_10d', 'bienvenida_nuevo', 'primer_pedido_completado']).optional().default('manual'),
  variables: z.string().optional().default('[]'),
  estado: z.enum(['borrador', 'programada', 'enviada', 'fallida']).optional(),
  programadaPara: z.string().min(1).optional().nullable(),
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

    const data = await db.campana.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error, 'CAMPANAS_GET');
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
      tipo,
      segmento,
      contenido,
      triggerTipo = 'manual',
      variables = '[]',
      estado,
      programadaPara,
      creadoPor,
    } = body;

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
    return handleError(error, 'CAMPANAS_POST');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('admin');
    const body = await request.json();
    const { id, titulo, tipo, segmento, contenido, estado, programadaPara, accion } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const existing = await db.campana.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    // Acción de envío inmediato: segmentación y entrega reales viven en @/lib/campanas-sender
    if (accion === 'enviar' || estado === 'enviada') {
      if (segmento || titulo || contenido) {
        await db.campana.update({
          where: { id },
          data: {
            ...(segmento ? { segmento } : {}),
            ...(titulo ? { titulo } : {}),
            ...(contenido ? { contenido } : {}),
          },
        });
      }
      const resultado = await enviarCampana(id);
      return NextResponse.json(resultado);
    }

    const updateData: Record<string, unknown> = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (segmento !== undefined) updateData.segmento = segmento;
    if (contenido !== undefined) updateData.contenido = contenido;
    if (estado !== undefined) updateData.estado = estado;
    if (programadaPara !== undefined) {
      updateData.programadaPara = programadaPara ? new Date(programadaPara) : null;
    }

    const updated = await db.campana.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return handleError(error, 'CAMPANAS_PATCH');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole('admin');
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const id = idParam || (await request.json().catch(() => ({})))?.id;

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    await db.campana.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: 'Campaña eliminada' });
  } catch (error) {
    return handleError(error, 'CAMPANAS_DELETE');
  }
}

