import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

const postSchema = z.object({
  nombre: z.string().min(1, 'nombre requerido').max(100),
  categoria: z.enum(['orden', 'incidencia', 'promocion', 'general']),
  contenido: z.string().min(1, 'contenido requerido').max(5000),
  variables: z.string().max(2000).optional(),
  esDefault: z.boolean().optional(),
});

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
    return handleError(error, 'PLANTILLAS_GET');
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
    return handleError(error, 'PLANTILLAS_POST');
  }
}
