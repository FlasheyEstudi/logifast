import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { MS_VENTANA_RECHAZOS } from '@/lib/repartidor/candados';

export const dynamic = 'force-dynamic';

/**
 * POST /api/repartidor/ofertas/rechazar
 * Body: { ordenId }
 *
 * Registra en el servidor que este repartidor descartó una OFERTA de la bolsa (no
 * una orden ya asignada). Antes esto solo tocaba la memoria del navegador: al
 * reconectar, la oferta rechazada volvía a aparecer como si nunca se hubiera visto.
 *
 * El rechazo es por repartidor y caduca solo (ventana de 1 h): que uno la descarte
 * no se la esconde a los demás.
 */
export async function POST(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const body = await req.json().catch(() => ({}));
    const ordenId = String(body?.ordenId ?? '').trim();
    if (!ordenId) {
      return NextResponse.json({ error: 'Falta ordenId' }, { status: 400 });
    }

    await db.ofertaRechazada.upsert({
      where: { repartidorId_ordenId: { repartidorId: profile.id, ordenId } },
      create: { repartidorId: profile.id, ordenId },
      update: { createdAt: new Date() },
    });

    return NextResponse.json({ ok: true, ordenId, ocultaHasta: new Date(Date.now() + MS_VENTANA_RECHAZOS) });
  } catch (error) {
    console.error('[REPARTIDOR_OFERTA_RECHAZAR]', error);
    return NextResponse.json({ error: 'No se pudo registrar el rechazo' }, { status: 500 });
  }
}
