import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { seedIngeniero } from '@/lib/seedIngeniero';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

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

    const motosFormatted = motos.map(moto => ({
      ...moto,
      alertas: moto._count.alertas,
      ultimoMantenimiento: moto.mantenimientos[0] || null
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
