import { NextRequest, NextResponse } from 'next/server';
import { runtimeState } from '@/lib/repartidor-mock';
import type { ChatMensaje } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

/**
 * POST /api/repartidor/chat
 * Body: { ordenId: string, contenido: string }
 * Envía un mensaje del repartidor al cliente.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ordenId, contenido } = body as { ordenId?: string; contenido?: string };

    if (!ordenId || typeof ordenId !== 'string') {
      return NextResponse.json(
        { error: 'ordenId es requerido' },
        { status: 400 }
      );
    }
    if (!contenido || typeof contenido !== 'string' || !contenido.trim()) {
      return NextResponse.json(
        { error: 'contenido es requerido y no puede estar vacío' },
        { status: 400 }
      );
    }

    const nuevoMensaje: ChatMensaje = {
      id: `msg-${Date.now()}`,
      ordenId,
      emisor: 'repartidor',
      contenido: contenido.trim(),
      enviadoEn: new Date().toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    runtimeState.chat = [...runtimeState.chat, nuevoMensaje];

    return NextResponse.json(
      {
        ok: true,
        id: nuevoMensaje.id,
        mensaje: nuevoMensaje,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REPARTIDOR_CHAT_POST]', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}
