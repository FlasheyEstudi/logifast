import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

const postSchema = z.object({
  titulo: z.string().min(1, 'titulo requerido').max(200),
  tipo: z.enum(['push', 'email', 'sms']),
  segmento: z.string().min(1, 'segmento requerido').max(50),
  contenido: z.string().min(1, 'contenido requerido'),
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
    return handleError(error, 'CAMPANAS_POST');
  }
}
