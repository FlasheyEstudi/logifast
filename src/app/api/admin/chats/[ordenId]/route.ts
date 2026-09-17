import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError, fail, ok } from '@/lib/auth/helpers';
import { emitirEventoRealtime } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/chats/[ordenId]
 * Historial completo de una conversación (solo admin, modo lectura).
 *
 * POST /api/admin/chats/[ordenId]
 * Body: { contenido }
 * El administrador interviene en el chat. El mensaje se guarda con emisor
 * 'admin' y se marca visualmente como [ADMIN] para las dos partes.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ordenId: string }> }
) {
  try {
    await requireRole('admin');
    const { ordenId } = await params;

    const mensajes = await db.chatRepartidor.findMany({
      where: { ordenId },
      orderBy: { enviadoEn: 'asc' },
      select: {
        id: true, emisor: true, contenido: true, enviadoEn: true, leido: true,
        clienteId: true, repartidorId: true,
      },
    });

    // Datos de la orden (envío express o compra de tienda)
    const envio = await db.ordenServicio.findUnique({
      where: { id: ordenId },
      select: {
        id: true, estado: true, origen: true, destino: true, monto: true,
        cliente: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true } },
        repartidor: {
          select: {
            id: true,
            user: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true } },
          },
        },
      },
    });

    const compra = envio
      ? null
      : await db.ordenCompra.findUnique({
          where: { id: ordenId },
          select: {
            id: true, estado: true, createdAt: true,
            cliente: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true } },
            tienda: { select: { nombre: true } },
            repartidor: {
              select: {
                id: true,
                user: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true } },
              },
            },
          },
        });

    const clienteId = envio?.cliente?.id || compra?.cliente?.id || mensajes[0]?.clienteId || null;
    const repartidorUserId = envio?.repartidor?.user?.id || compra?.repartidor?.user?.id || null;

    return NextResponse.json({
      ordenId,
      tipo: envio ? 'envio' : compra ? 'tienda' : 'desconocida',
      estadoOrden: envio?.estado || compra?.estado || null,
      origen: envio?.origen || compra?.tienda?.nombre || null,
      destino: envio?.destino || null,
      monto: envio?.monto ?? null,
      cliente: envio?.cliente || compra?.cliente || null,
      repartidor: envio?.repartidor?.user || compra?.repartidor?.user || null,
      repartidorProfileId: envio?.repartidor?.id || compra?.repartidor?.id || null,
      clienteUserId: clienteId,
      repartidorUserId,
      mensajes: mensajes.map((m) => ({
        id: m.id,
        emisor: m.emisor,
        contenido: m.contenido,
        enviadoEn: m.enviadoEn,
        leido: m.leido,
      })),
    });
  } catch (error) {
    return handleError(error, 'ADMIN_CHAT_DETALLE');
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ordenId: string }> }
) {
  try {
    const admin = await requireRole('admin');
    const { ordenId } = await params;

    const body = await req.json().catch(() => ({}));
    const contenido = String(body?.contenido ?? '').trim();
    if (!contenido) return fail('El mensaje no puede estar vacío');
    if (contenido.length > 1000) return fail('El mensaje es demasiado largo (máx. 1000 caracteres)');

    // Necesitamos un clienteId válido (columna obligatoria de ChatRepartidor)
    const envio = await db.ordenServicio.findUnique({
      where: { id: ordenId },
      select: {
        clienteId: true, repartidorId: true,
        cliente: { select: { id: true } },
        repartidor: { select: { id: true, userId: true } },
      },
    });
    const compra = envio
      ? null
      : await db.ordenCompra.findUnique({
          where: { id: ordenId },
          select: {
            clienteId: true, repartidorId: true,
            cliente: { select: { id: true } },
            repartidor: { select: { id: true, userId: true } },
          },
        });

    const clienteId = envio?.cliente?.id || compra?.cliente?.id || null;
    if (!clienteId) {
      return fail('No se encontró la orden o su cliente para este chat', 404);
    }

    const repartidorProfileId = envio?.repartidor?.id || compra?.repartidor?.id || null;
    const repartidorUserId = envio?.repartidor?.userId || compra?.repartidor?.userId || null;

    const mensaje = await db.chatRepartidor.create({
      data: {
        ordenId,
        repartidorId: repartidorProfileId || 'general',
        clienteId,
        emisor: 'admin',
        contenido: `[ADMIN] ${contenido}`,
      },
    });

    // Avisar a ambas partes y al resto de administradores en vivo
    const payload = {
      id: mensaje.id,
      ordenId,
      emisor: 'admin',
      esAdmin: true,
      contenido: mensaje.contenido,
      leido: mensaje.leido,
      enviadoEn: mensaje.enviadoEn.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: mensaje.enviadoEn.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    try {
      emitirEventoRealtime({ room: `orden:${ordenId}`, event: 'chat:mensaje:nuevo', data: payload });
      emitirEventoRealtime({ room: 'admin', event: 'chat:mensaje:nuevo', data: payload });
      if (repartidorUserId) {
        emitirEventoRealtime({ room: `usuario:${repartidorUserId}`, event: 'chat:mensaje:nuevo', data: payload });
      }
      emitirEventoRealtime({ room: `usuario:${clienteId}`, event: 'chat:mensaje:nuevo', data: payload });
    } catch {}

    return ok({ mensaje: payload, por: admin?.name || 'Administrador' });
  } catch (error) {
    return handleError(error, 'ADMIN_CHAT_ENVIAR');
  }
}
