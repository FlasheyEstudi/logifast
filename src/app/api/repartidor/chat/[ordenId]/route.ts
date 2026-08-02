import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/chat/[ordenId]
 * Devuelve los mensajes de chat para una orden.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ordenId: string }> }
) {
  try {
    const { ordenId } = await params;
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const mensajes = await db.chatRepartidor.findMany({
      where: { ordenId },
      orderBy: { enviadoEn: 'asc' },
      take: 200,
    });

    const result = mensajes.map((m) => ({
      id: m.id,
      ordenId: m.ordenId,
      emisor: m.emisor as 'repartidor' | 'cliente',
      contenido: m.contenido,
      enviadoEn: m.enviadoEn.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }));

    return NextResponse.json({ mensajes: result });
  } catch (error) {
    console.error('[REPARTIDOR_CHAT_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener el chat' },
      { status: 500 }
    );
  }
}
