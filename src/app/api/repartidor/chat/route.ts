import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/repartidor/chat
 * Body: { ordenId, contenido }
 * Envía un mensaje del repartidor al cliente.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'repartidor') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const ordenId = String(body.ordenId ?? '');
    const contenido = String(body.contenido ?? '').trim();
    if (!ordenId || !contenido) {
      return NextResponse.json({ error: 'ordenId y contenido son obligatorios' }, { status: 400 });
    }

    const orden = await db.ordenServicio.findUnique({ where: { id: ordenId } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const profile = await db.repartidorProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile || orden.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }

    const mensaje = await db.chatRepartidor.create({
      data: {
        ordenId,
        repartidorId: profile.id,
        clienteId: orden.clienteId,
        emisor: 'repartidor',
        contenido,
      },
    });

    return NextResponse.json({ ok: true, mensaje });
  } catch (error) {
    console.error('[REPARTIDOR_CHAT_POST]', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
