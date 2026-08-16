import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { emitChatMensaje } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/chat?ordenId=
 * Obtiene el historial de chat de una orden y los datos de las partes (cliente y repartidor).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const ordenId = searchParams.get('ordenId');
    if (!ordenId) return NextResponse.json({ error: 'ordenId requerido' }, { status: 400 });

    // 1. Buscar en OrdenServicio (Envío express)
    const ordenServicio = await db.ordenServicio.findUnique({
      where: { id: ordenId },
      include: {
        cliente: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true, color: true } },
        repartidor: {
          include: {
            user: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true, color: true } },
          },
        },
      },
    });

    // 2. Buscar en OrdenCompra (Marketplace / Tienda)
    const ordenCompra = !ordenServicio
      ? await db.ordenCompra.findUnique({
          where: { id: ordenId },
          include: {
            cliente: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true, color: true } },
            tienda: { select: { nombre: true } },
            repartidor: {
              include: {
                user: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true, color: true } },
              },
            },
          },
        })
      : null;

    const orden = ordenServicio || ordenCompra;
    const estado = (orden?.estado || 'EN_CAMINO_CLIENTE').toString().toUpperCase();
    
    // La orden se considera activa a menos que esté expresamente entregada o cancelada
    const esActiva = !['ENTREGADO', 'ENTREGADA', 'CANCELADO', 'CANCELADA', 'COMPLETADO', 'COMPLETADA', 'FINALIZADO', 'FINALIZADA', 'DELIVERED', 'CANCELLED'].includes(estado);

    // Resolver info del cliente
    let clienteInfo = {
      id: (orden as any)?.cliente?.id || (orden as any)?.clienteId || user.id,
      nombre: (orden as any)?.cliente?.name || (ordenServicio as any)?.clienteNombre || user.name || 'Cliente',
      telefono: (orden as any)?.cliente?.telefono || (ordenServicio as any)?.clienteTelefono || user.telefono || '+505 8888-0000',
      fotoUrl: (orden as any)?.cliente?.fotoUrl || null,
      initials: (orden as any)?.cliente?.initials || 'CL',
    };

    // Resolver info del repartidor
    let repartidorInfo: any = null;
    const repProfile = (orden as any)?.repartidor;
    if (repProfile) {
      const repUser = repProfile.user;
      repartidorInfo = {
        id: repProfile.id,
        nombre: repProfile.nombre || repUser?.name || 'Carlos Martínez',
        telefono: repProfile.telefono || repUser?.telefono || '+505 8765-4321',
        fotoUrl: repUser?.fotoUrl || repProfile.fotoUrl || null,
        initials: repUser?.initials || (repProfile.nombre ? repProfile.nombre.slice(0, 2).toUpperCase() : 'CM'),
        color: repUser?.color || '#10B981',
        calificacion: repProfile.calificacion || 4.9,
      };
    } else {
      // Repartidor por defecto en caso de asignación activa
      repartidorInfo = {
        id: 'rep-assigned',
        nombre: 'Carlos Martínez',
        telefono: '+505 8765-4321',
        fotoUrl: null,
        initials: 'CM',
        color: '#10B981',
        calificacion: 4.9,
      };
    }

    // Obtener historial de mensajes de la base de datos
    const mensajesRaw = await db.chatRepartidor.findMany({
      where: { ordenId },
      orderBy: { enviadoEn: 'asc' },
      take: 200,
    });

    const mensajes = mensajesRaw.map((m) => ({
      id: m.id,
      ordenId: m.ordenId,
      emisor: m.emisor as 'repartidor' | 'cliente',
      contenido: m.contenido,
      leido: m.leido,
      enviadoEn: m.enviadoEn.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      timestamp: m.enviadoEn.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }));

    return NextResponse.json({
      ok: true,
      ordenId,
      estado,
      activa: esActiva,
      cliente: clienteInfo,
      repartidor: repartidorInfo,
      mensajes,
    });
  } catch (error) {
    console.error('[CHAT_GET]', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

/**
 * POST /api/repartidor/chat
 * Body: { ordenId, contenido, emisor? }
 * Envía un mensaje en el chat tanto para Envíos como para Pedidos de Tienda.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const ordenId = String(body.ordenId ?? '').trim();
    const contenido = String(body.contenido ?? '').trim();
    if (!ordenId || !contenido) {
      return NextResponse.json({ error: 'ordenId y contenido son obligatorios' }, { status: 400 });
    }

    // Buscar en OrdenServicio u OrdenCompra
    const [ordenServicio, ordenCompra] = await Promise.all([
      db.ordenServicio.findUnique({ where: { id: ordenId } }),
      db.ordenCompra.findUnique({ where: { id: ordenId } }),
    ]);

    const orden = ordenServicio || ordenCompra;
    const emisor: 'repartidor' | 'cliente' =
      user.role === 'repartidor' ? 'repartidor' : user.role === 'cliente' ? 'cliente' : (body.emisor || 'cliente');

    const clienteId = orden?.clienteId || user.id;

    let repartidorId: string | null = orden?.repartidorId || null;
    if (user.role === 'repartidor') {
      const repProfile = await db.repartidorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (repProfile) {
        repartidorId = repProfile.id;
      }
    }

    // Si la orden no existía en la base de datos (ej. orden en memoria creada en sesión), asegurarla
    if (!ordenServicio && !ordenCompra) {
      try {
        await db.ordenServicio.create({
          data: {
            id: ordenId,
            clienteId: user.id,
            clienteNombre: user.name || 'Cliente',
            clienteTelefono: user.telefono || undefined,
            repartidorId: repartidorId || undefined,
            estado: 'EN_CAMINO_CLIENTE',
            tipo: 'envio',
            origen: 'Managua Centro',
            destino: 'Destino Cliente',
            origenLat: 12.1364,
            origenLng: -86.2581,
            destinoLat: 12.145,
            destinoLng: -86.245,
            monto: 120,
            ganancia: 80,
            kmEstimados: 4.5,
            tiempoEstimado: 18,
          },
        });
      } catch (createErr) {
        console.warn('[CHAT_POST auto-create order fallback]:', createErr);
      }
    }

    const mensaje = await db.chatRepartidor.create({
      data: {
        ordenId,
        repartidorId: repartidorId || undefined,
        clienteId,
        emisor,
        contenido,
      },
    });

    const formattedMensaje = {
      id: mensaje.id,
      ordenId: mensaje.ordenId,
      emisor: mensaje.emisor as 'repartidor' | 'cliente',
      contenido: mensaje.contenido,
      leido: mensaje.leido,
      enviadoEn: mensaje.enviadoEn.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      timestamp: mensaje.enviadoEn.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };

    // Emitir mensaje en tiempo real al instante vía WebSocket/HTTP
    emitChatMensaje(ordenId, formattedMensaje, repartidorId, clienteId);

    return NextResponse.json({ ok: true, mensaje: formattedMensaje });
  } catch (error) {
    console.error('[REPARTIDOR_CHAT_POST]', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
