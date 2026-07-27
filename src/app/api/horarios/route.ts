import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export async function GET() {
  try {
    const data = await db.configuracionHorario.findMany({
      orderBy: { dia: 'asc' },
    });

    return NextResponse.json({ data });
} catch (error) {
    return handleError(error, 'HORARIOS_GET');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const body = await request.json();
    const { id, dia, horaInicio, horaFin, activo, recargoNocturno } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el id del horario' },
        { status: 400 }
      );
    }

    const existing = await db.configuracionHorario.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (dia !== undefined) data.dia = dia;
    if (horaInicio !== undefined) data.horaInicio = horaInicio;
    if (horaFin !== undefined) data.horaFin = horaFin;
    if (activo !== undefined) data.activo = activo;
    if (recargoNocturno !== undefined) data.recargoNocturno = recargoNocturno;

    const updated = await db.configuracionHorario.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: updated });
} catch (error) {
    return handleError(error, 'HORARIOS_PATCH');
  }
}
