import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destinatario = searchParams.get('destinatario');
    const canal = searchParams.get('canal');

    const where: Record<string, unknown> = {};
    if (destinatario) where.destinatario = destinatario;
    if (canal) where.canal = canal;

    const data = await db.notificacionAutomatica.findMany({
      where,
      orderBy: { etiqueta: 'asc' },
    });

    return NextResponse.json({ data });
} catch (error) {
    return handleError(error, 'NOTIFICACIONES_AUTO_GET');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const body = await request.json();
    const { id, activa, etiqueta, canal, plantilla, destinatario } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el id de la notificación' },
        { status: 400 }
      );
    }

    const existing = await db.notificacionAutomatica.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (activa !== undefined) data.activa = activa;
    if (etiqueta !== undefined) data.etiqueta = etiqueta;
    if (canal !== undefined) data.canal = canal;
    if (plantilla !== undefined) data.plantilla = plantilla;
    if (destinatario !== undefined) data.destinatario = destinatario;

    const updated = await db.notificacionAutomatica.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: updated });
} catch (error) {
    return handleError(error, 'NOTIFICACIONES_AUTO_PATCH');
  }
}
