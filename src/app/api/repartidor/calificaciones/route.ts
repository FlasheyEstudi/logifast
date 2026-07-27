import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import type { CalificacionRepartidor } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

function tiempoRelativo(fecha: Date): string {
  const diff = Date.now() - fecha.getTime();
  if (diff < 60_000) return 'ahora';
  if (diff < 3600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86400_000) return `hace ${Math.floor(diff / 3600_000)} h`;
  const dias = Math.floor(diff / 86400_000);
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

/**
 * GET /api/repartidor/calificaciones
 * Devuelve el historial de calificaciones + distribución por estrellas.
 */
export async function GET() {
  try {
    const { profile } = await getRepartidorProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cals = await db.calificacionRepartidor.findMany({
      where: { repartidorId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const ordenIds = [...new Set(cals.map((c) => c.ordenId))];
    const ordenes = await db.ordenServicio.findMany({
      where: { id: { in: ordenIds } },
      select: { id: true, clienteNombre: true },
    });
    const ordenMap = new Map(ordenes.map((o) => [o.id, o.clienteNombre]));

    const result: CalificacionRepartidor[] = cals.map((c) => ({
      id: c.id,
      ordenId: c.ordenId,
      cliente: ordenMap.get(c.ordenId) ?? 'Cliente',
      estrellas: c.estrellas,
      etiquetas: (() => {
        try { return JSON.parse(c.etiquetas) as string[]; } catch { return []; }
      })(),
      comentario: c.comentario,
      fecha: tiempoRelativo(c.createdAt),
    }));

    // Distribución por estrellas
    const distribucion = [5, 4, 3, 2, 1].map((e) => ({
      estrellas: e,
      total: cals.filter((c) => c.estrellas === e).length,
    }));

    const promedio =
      cals.length > 0
        ? cals.reduce((sum, c) => sum + c.estrellas, 0) / cals.length
        : 0;

    return NextResponse.json({
      calificaciones: result,
      total: cals.length,
      promedio: Math.round(promedio * 10) / 10,
      distribucion,
    });
  } catch (error) {
    console.error('[REPARTIDOR_CALIFICACIONES_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener calificaciones' },
      { status: 500 }
    );
  }
}
