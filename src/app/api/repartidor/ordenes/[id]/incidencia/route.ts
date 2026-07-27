import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

const TIPO_LABEL: Record<string, string> = {
  mecanica: 'Falla mecánica',
  cliente: 'Problema con cliente',
  accidente: 'Accidente',
  otro: 'Otro',
};

/**
 * PATCH /api/repartidor/ordenes/[id]/incidencia
 * Body: { tipo: 'mecanica' | 'cliente' | 'accidente' | 'otro', desc?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { profile } = await getRepartidorProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const tipoRaw = String(body.tipo ?? 'otro');
    const tipoLabel = TIPO_LABEL[tipoRaw] ?? 'Otro';
    const desc = String(body.desc ?? '');

    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    if (orden.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }

    await db.ordenServicio.update({
      where: { id },
      data: {
        estado: 'incidencia',
        incidenciaTipo: tipoLabel,
        incidenciaDesc: desc,
      },
    });

    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: { enServicio: false },
    });

    await db.notificacionRepartidor.create({
      data: {
        repartidorId: profile.id,
        tipo: 'incidencia',
        titulo: 'Incidencia reportada',
        contenido: `${tipoLabel} — ${id}`,
        leido: false,
        ordenId: id,
      },
    });

    return NextResponse.json({
      ok: true,
      estado: 'incidencia',
      ordenId: id,
      tipo: tipoLabel,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_INCIDENCIA]', error);
    return NextResponse.json(
      { error: 'Error al reportar incidencia' },
      { status: 500 }
    );
  }
}
