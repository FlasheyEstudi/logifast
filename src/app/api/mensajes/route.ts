import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuarioId');

    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Se requiere usuarioId como query param' },
        { status: 400 }
      );
    }

    // Get all conversations for this user - group by the other participant
    const mensajes = await db.mensajeDirecto.findMany({
      where: {
        OR: [
          { emisorId: usuarioId },
          { receptorId: usuarioId },
        ],
      },
      orderBy: { enviadoEn: 'desc' },
    });

    // Group into conversations
    const conversacionesMap = new Map<string, {
      otroUsuarioId: string;
      ultimoMensaje: string;
      ultimoMensajeFecha: Date;
      noLeidos: number;
      totalMensajes: number;
    }>();

    for (const msg of mensajes) {
      const otroId = msg.emisorId === usuarioId ? msg.receptorId : msg.emisorId;
      const existing = conversacionesMap.get(otroId);

      if (!existing) {
        conversacionesMap.set(otroId, {
          otroUsuarioId: otroId,
          ultimoMensaje: msg.contenido,
          ultimoMensajeFecha: msg.enviadoEn,
          noLeidos: msg.receptorId === usuarioId && !msg.leido ? 1 : 0,
          totalMensajes: 1,
        });
      } else {
        existing.totalMensajes++;
        if (msg.receptorId === usuarioId && !msg.leido) {
          existing.noLeidos++;
        }
      }
    }

    const data = Array.from(conversacionesMap.values());

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[MENSAJES_GET]', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emisorId, receptorId, contenido } = body;

    if (!emisorId || !receptorId || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: emisorId, receptorId, contenido' },
        { status: 400 }
      );
    }

    const mensaje = await db.mensajeDirecto.create({
      data: {
        emisorId,
        receptorId,
        contenido,
      },
    });

    return NextResponse.json({ data: mensaje }, { status: 201 });
  } catch (error) {
    console.error('[MENSAJES_POST]', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
