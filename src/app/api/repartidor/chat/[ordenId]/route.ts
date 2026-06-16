import { NextRequest, NextResponse } from 'next/server';
import { runtimeState } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/chat/[ordenId]
 * Devuelve los mensajes de chat entre repartidor y cliente para una orden.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ordenId: string }> }
) {
  try {
    const { ordenId } = await params;
    const mensajes = runtimeState.chat.filter((m) => m.ordenId === ordenId);

    return NextResponse.json({
      ordenId,
      total: mensajes.length,
      mensajes,
    });
  } catch (error) {
    console.error('[REPARTIDOR_CHAT_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener el chat' },
      { status: 500 }
    );
  }
}
