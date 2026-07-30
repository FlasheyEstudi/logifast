import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/chat?ordenId=
 * Obtiene el historial de chat de una orden.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const ordenId = searchParams.get('ordenId');
    if (!ordenId) return NextResponse.json({ error: 'ordenId requerido' }, { status: 400 });

    const mensajes = await db.chatRepartidor.findMany({
      where: { ordenId },
      orderBy: { enviadoEn: 'asc' },
    });

    return NextResponse.json({ mensajes });
  } catch (error) {
    console.error('[CHAT_GET]', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

/**
 * POST /api/repartidor/chat
 * Body: { ordenId, contenido }
 * Envía un mensaje en el chat (repartidor o cliente).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
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

    const emisor = user.role === 'repartidor' ? 'repartidor' : 'cliente';
    const repartidorId = orden.repartidorId || user.id;

    const mensaje = await db.chatRepartidor.create({
      data: {
        ordenId,
        repartidorId,
        clienteId: orden.clienteId || user.id,
        emisor,
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
