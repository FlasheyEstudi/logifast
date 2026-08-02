import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

const postSchema = z.object({
  codigo: z.string().min(1, 'codigo requerido').max(50),
  tipoDescuento: z.enum(['porcentaje', 'monto']),
  valor: z.number().min(0, 'valor debe ser >= 0'),
  aplicableA: z.enum(['todos', 'primer_envio', 'envio_minimo']),
  montoMinimo: z.number().min(0).optional().nullable(),
  maxUsos: z.number().int().min(0).optional(),
  segmento: z.string().max(50).optional(),
  vigenciaInicio: z.string().min(1, 'vigenciaInicio requerido'),
  vigenciaFin: z.string().min(1, 'vigenciaFin requerido'),
  estado: z.enum(['activo', 'inactivo']).optional(),
  creadoPor: z.string().min(1, 'creadoPor requerido'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipoDescuento = searchParams.get('tipoDescuento');
    const aplicableA = searchParams.get('aplicableA');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (tipoDescuento) where.tipoDescuento = tipoDescuento;
    if (aplicableA) where.aplicableA = aplicableA;

    const data = await db.codigoPromocional.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data });
} catch (error) {
    return handleError(error, 'CODIGOS_GET');
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
      codigo,
      tipoDescuento,
      valor,
      aplicableA,
      montoMinimo,
      maxUsos,
      segmento,
      vigenciaInicio,
      vigenciaFin,
      estado,
      creadoPor,
    } = body;

    if (!codigo || !tipoDescuento || valor === undefined || !aplicableA || !vigenciaInicio || !vigenciaFin || !creadoPor) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: codigo, tipoDescuento, valor, aplicableA, vigenciaInicio, vigenciaFin, creadoPor' },
        { status: 400 }
      );
    }

    const codigoPromo = await db.codigoPromocional.create({
      data: {
        codigo,
        tipoDescuento,
        valor,
        aplicableA,
        montoMinimo: montoMinimo ?? null,
        maxUsos: maxUsos ?? 0,
        segmento: segmento || 'todos',
        vigenciaInicio: new Date(vigenciaInicio),
        vigenciaFin: new Date(vigenciaFin),
        estado: estado || 'activo',
        creadoPor,
      },
    });

    return NextResponse.json({ data: codigoPromo }, { status: 201 });
} catch (error) {
    return handleError(error, 'CODIGOS_POST');
  }
}
