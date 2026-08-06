import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as prisma } from '@/lib/db';
import { seedIngeniero } from '@/lib/seedIngeniero';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  nombre: z.string().max(100).optional(),
  modelo: z.string().max(100).optional(),
  placa: z.string().max(20).optional().nullable(),
  anio: z.number().int().min(1900).max(2100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  status: z.string().max(50).optional(),
  estado: z.enum(['DISPONIBLE', 'EN_SERVICIO', 'EN_MANTENIMIENTO', 'FUERA_SERVICIO']).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
  estado: z.enum(['DISPONIBLE', 'EN_SERVICIO', 'EN_MANTENIMIENTO', 'FUERA_SERVICIO']).optional(),
  status: z.enum(['DISPONIBLE', 'EN_SERVICIO', 'EN_MANTENIMIENTO', 'FUERA_SERVICIO']).optional(),
  asignadaA: z.string().optional().nullable(),
  kmAcumulados: z.number().min(0).optional(),
  modelo: z.string().max(100).optional(),
  placa: z.string().max(20).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('ingeniero', 'admin');
    await seedIngeniero();
    const motos = await prisma.moto.findMany({
      include: {
        mantenimientos: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        alertas: {
          where: { activa: true }
        },
        _count: {
          select: { alertas: { where: { activa: true } } }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    const motosFormatted = motos.map(({ mantenimientos, _count, ...moto }) => ({
      ...moto,
      alertas: _count.alertas,
      ultimoMantenimiento: mantenimientos[0]
        ? mantenimientos[0].createdAt.toISOString()
        : null,
      costoTotalMantenimiento: mantenimientos.reduce((sum: number, m: any) => sum + (m.costoTotal || 0), 0),
    }));

    return NextResponse.json(motosFormatted);
  } catch (error) {
    return handleError(error, 'INGENIERO_MOTOS_GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { nombre, modelo, placa, anio, color, status, estado } = body;

    const moto = await prisma.moto.create({
      data: {
        nombre: nombre || `Moto-${Math.floor(Math.random() * 90) + 10}`,
        modelo: modelo || 'Honda Wave 110',
        placa: placa || `M-${Math.floor(Math.random() * 90000) + 10000}`,
        anio: Number(anio) || 2024,
        color: color || 'Rojo',
        estado: estado || status || 'DISPONIBLE',
      },
    });

    return NextResponse.json(moto);
  } catch (error) {
    return handleError(error, 'INGENIERO_MOTOS_POST');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { id, estado, status, asignadaA, kmAcumulados, modelo, placa } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (estado || status) dataToUpdate.estado = estado || status;
    if (asignadaA !== undefined) dataToUpdate.asignadaA = asignadaA;
    if (kmAcumulados !== undefined) dataToUpdate.kmAcumulados = Number(kmAcumulados);
    if (modelo) dataToUpdate.modelo = modelo;
    if (placa) dataToUpdate.placa = placa;

    const moto = await prisma.moto.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(moto);
  } catch (error) {
    return handleError(error, 'INGENIERO_MOTOS_PATCH');
  }
}
