import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    const where: Record<string, unknown> = {};
    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      where.fecha = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    const data = await db.feriado.findMany({
      where,
      orderBy: { fecha: 'asc' },
    });

    return NextResponse.json({ data });
} catch (error) {
    return handleError(error, 'FERIADOS_GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const body = await request.json();
    const { fecha, nombre, recargo } = body;

    if (!fecha || !nombre) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: fecha, nombre' },
        { status: 400 }
      );
    }

    const feriado = await db.feriado.create({
      data: {
        fecha: new Date(fecha),
        nombre,
        recargo: recargo ?? 0,
      },
    });

    return NextResponse.json({ data: feriado }, { status: 201 });
} catch (error) {
    return handleError(error, 'FERIADOS_POST');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el id del feriado como query param' },
        { status: 400 }
      );
    }

    const existing = await db.feriado.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Feriado no encontrado' },
        { status: 404 }
      );
    }

    await db.feriado.delete({ where: { id } });

    return NextResponse.json({ data: { id }, message: 'Feriado eliminado' });
} catch (error) {
    return handleError(error, 'FERIADOS_DELETE');
  }
}
