import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  motoId: z.string().min(1, 'motoId requerido'),
  tipo: z.enum(['PREVENTIVO', 'CORRECTIVO', 'EMERGENCIA']),
  categoria: z.enum([
    'CAMBIO_ACEITE', 'FRENO', 'LLANTA', 'CADENA', 'ELECTRICO', 'MOTOR', 'SUSPENSION', 'GENERAL',
  ]),
  descripcion: z.string().min(1, 'descripcion requerida'),
  observaciones: z.string().max(1000).optional().nullable(),
  kmAlMomento: z.union([z.number().min(0), z.string()]).optional(),
  costoManoObra: z.union([z.number().min(0), z.string()]).optional(),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  programadoPara: z.string().min(1).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const motoId = searchParams.get('motoId');

    const where: any = {};
    if (estado) where.estado = estado;
    if (motoId) where.motoId = motoId;

    const mantenimientos = await prisma.mantenimiento.findMany({
      where,
      include: {
        moto: { select: { nombre: true, modelo: true } },
        repuestosUsados: {
          include: { repuesto: { select: { nombre: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(mantenimientos);
} catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTOS_GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ingeniero', 'admin');
    const data = await req.json();
    const parsed = postSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        motoId: data.motoId,
        tipo: data.tipo,
        categoria: data.categoria,
        descripcion: data.descripcion,
        observaciones: data.observaciones,
        kmAlMomento: parseFloat(data.kmAlMomento) || 0,
        costoManoObra: parseFloat(data.costoManoObra) || 0,
        prioridad: data.prioridad || 'NORMAL',
        programadoPara: data.programadoPara ? new Date(data.programadoPara) : null
      }
    });

    // Si es emergencia, poner moto en mantenimiento
    if (data.tipo === 'EMERGENCIA') {
      await prisma.moto.update({
        where: { id: data.motoId },
        data: { estado: 'EN_MANTENIMIENTO' }
      });
    }

    return NextResponse.json(mantenimiento, { status: 201 });
} catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTOS_POST');
  }
}
