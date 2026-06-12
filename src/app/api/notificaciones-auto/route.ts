import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    console.error('[NOTIFICACIONES_AUTO_GET]', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones automáticas' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
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
    console.error('[NOTIFICACIONES_AUTO_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar notificación automática' }, { status: 500 });
  }
}
