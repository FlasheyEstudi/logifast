import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { emitirEventoRealtime } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  receptorId: z.string().min(1, 'receptorId requerido'),
  contenido: z.string().min(1, 'contenido requerido').max(5000),
  emisorId: z.string().optional(),
});

/**
 * GET /api/mensajes
 * Query params:
 * - conversacionCon: (optional) fetch messages between session user and target user
 * - usuarioId: (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversacionCon = searchParams.get('conversacionCon');
    const myId = sessionUser.id;

    // Fetch messages between two specific users
    if (conversacionCon) {
      const mensajes = await db.mensajeDirecto.findMany({
        where: {
          OR: [
            { emisorId: myId, receptorId: conversacionCon },
            { emisorId: conversacionCon, receptorId: myId },
            // Admin broadcast
            ...(sessionUser.role === 'admin' ? [{ receptorId: conversacionCon }] : []),
          ],
        },
        select: {
          id: true,
          emisorId: true,
          receptorId: true,
          contenido: true,
          leido: true,
          enviadoEn: true,
        },
        orderBy: { enviadoEn: 'asc' },
        take: 100,
      });

      return NextResponse.json({ data: mensajes });
    }

    // List conversations for the session user (VULN-11: No exponer directorio global a usuarios regulares)
    const mensajes = await db.mensajeDirecto.findMany({
      where: sessionUser.role === 'admin'
        ? {}
        : { OR: [{ emisorId: myId }, { receptorId: myId }] },
      select: {
        id: true,
        emisorId: true,
        receptorId: true,
        contenido: true,
        leido: true,
        enviadoEn: true,
      },
      orderBy: { enviadoEn: 'desc' },
      take: 200,
    });

    // Identificar solo usuarios relevantes para este cliente/repartidor
    const relevantUserIds = new Set<string>();
    mensajes.forEach((m) => {
      relevantUserIds.add(m.emisorId);
      relevantUserIds.add(m.receptorId);
    });

    const userWhere = sessionUser.role === 'admin'
      ? undefined
      : {
          OR: [
            { id: { in: Array.from(relevantUserIds) } },
            { role: 'admin' },
          ],
        };

    const allUsers = await db.user.findMany({
      where: userWhere,
      take: sessionUser.role === 'admin' ? 100 : 50,
      select: { id: true, name: true, email: true, role: true },
    });

    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    // Group into conversations map
    const convsMap = new Map<string, {
      id: string;
      participanteId: string;
      participanteNombre: string;
      participanteRol: string;
      ultimoMensaje: string;
      ultimoTimestamp: string;
      noLeidos: number;
      mensajes: Array<{
        id: string;
        emisorId: string;
        emisorNombre: string;
        receptorId: string;
        receptorNombre: string;
        contenido: string;
        leido: boolean;
        enviadoEn: string;
      }>;
    }>();

    // Default seed with relevant contacts (soporte o participantes)
    allUsers.forEach((u) => {
      if (u.id !== myId) {
        convsMap.set(u.id, {
          id: `CONV-${u.id}`,
          participanteId: u.id,
          participanteNombre: u.name || u.email.split('@')[0],
          participanteRol: u.role || 'cliente',
          ultimoMensaje: 'Iniciar conversación...',
          ultimoTimestamp: new Date().toISOString(),
          noLeidos: 0,
          mensajes: [],
        });
      }
    });

    // Populate with real messages
    for (const msg of mensajes) {
      const otherId = msg.emisorId === myId ? msg.receptorId : msg.emisorId;
      const otherUser = userMap.get(otherId);
      const otherName = otherUser?.name || otherUser?.email?.split('@')[0] || (otherId === 'admin' ? 'Soporte' : 'Usuario');

      let conv = convsMap.get(otherId);
      if (!conv) {
        conv = {
          id: `CONV-${otherId}`,
          participanteId: otherId,
          participanteNombre: otherName,
          participanteRol: otherUser?.role || 'cliente',
          ultimoMensaje: msg.contenido,
          ultimoTimestamp: msg.enviadoEn.toISOString(),
          noLeidos: 0,
          mensajes: [],
        };
        convsMap.set(otherId, conv);
      }

      if (!msg.leido && msg.receptorId === myId) {
        conv.noLeidos += 1;
      }

      conv.mensajes.unshift({
        id: msg.id,
        emisorId: msg.emisorId,
        emisorNombre: msg.emisorId === myId ? (sessionUser.name || 'Admin') : otherName,
        receptorId: msg.receptorId,
        receptorNombre: msg.receptorId === myId ? (sessionUser.name || 'Admin') : otherName,
        contenido: msg.contenido,
        leido: msg.leido,
        enviadoEn: msg.enviadoEn.toISOString(),
      });

      if (conv.ultimoTimestamp < msg.enviadoEn.toISOString()) {
        conv.ultimoMensaje = msg.contenido;
        conv.ultimoTimestamp = msg.enviadoEn.toISOString();
      }
    }

    const data = Array.from(convsMap.values()).sort(
      (a, b) => new Date(b.ultimoTimestamp).getTime() - new Date(a.ultimoTimestamp).getTime()
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[MENSAJES_GET]', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

/**
 * POST /api/mensajes
 * Body: { receptorId, contenido }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { receptorId, contenido } = parsed.data;
    const emisorId = sessionUser.id;

    const mensaje = await db.mensajeDirecto.create({
      data: {
        emisorId,
        receptorId,
        contenido: contenido.trim(),
        leido: false,
      },
    });

    // Create Push notification
    await db.notificacionPush.create({
      data: {
        userId: receptorId,
        titulo: `Mensaje de ${sessionUser.name || 'Soporte'}`,
        contenido: contenido.length > 80 ? contenido.slice(0, 80) + '…' : contenido,
        tipo: 'chat',
        leida: false,
      },
    }).catch(() => null);

    // Emit Realtime event to specific user room and broad channels
    emitirEventoRealtime({
      room: `usuario:${receptorId}`,
      event: 'chat:mensaje:nuevo',
      data: {
        ...mensaje,
        emisor: sessionUser.role === 'admin' ? 'admin' : sessionUser.role,
        emisorNombre: sessionUser.name || 'Soporte LOGIFAST',
        esAdmin: sessionUser.role === 'admin',
      },
    });
    emitirEventoRealtime({
      room: `cliente:${receptorId}`,
      event: 'chat:mensaje:nuevo',
      data: {
        ...mensaje,
        emisor: sessionUser.role === 'admin' ? 'admin' : sessionUser.role,
        emisorNombre: sessionUser.name || 'Soporte LOGIFAST',
        esAdmin: sessionUser.role === 'admin',
      },
    });
    emitirEventoRealtime({
      room: `repartidor:${receptorId}`,
      event: 'chat:mensaje:nuevo',
      data: {
        ...mensaje,
        emisor: sessionUser.role === 'admin' ? 'admin' : sessionUser.role,
        emisorNombre: sessionUser.name || 'Soporte LOGIFAST',
        esAdmin: sessionUser.role === 'admin',
      },
    });

    return NextResponse.json({ data: mensaje }, { status: 201 });
  } catch (error) {
    console.error('[MENSAJES_POST]', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
