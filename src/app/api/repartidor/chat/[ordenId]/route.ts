import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/chat/[ordenId]
 * Devuelve los mensajes de chat y datos para una orden (tanto cliente como repartidor).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ordenId: string }> }
) {
  try {
    const { ordenId } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [ordenServicio, ordenCompra] = await Promise.all([
      db.ordenServicio.findUnique({
        where: { id: ordenId },
        include: {
          cliente: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true, color: true } },
          repartidor: {
            include: {
              user: { select: { id: true, name: true, telefono: true, fotoUrl: true, initials: true, color: true } },
            },
          },
        },
      }),
      db.ordenCompra.findUnique({
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
      }),
    ]);

    const orden = ordenServicio || ordenCompra;
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const estado = orden.estado || 'pendiente';
    const esActiva = !['entregado', 'cancelado', 'completado'].includes(estado.toLowerCase());

    let clienteInfo = {
      id: (orden as any)?.cliente?.id || (orden as any)?.clienteId || '',
      nombre: (orden as any)?.cliente?.name || (ordenServicio as any)?.clienteNombre || 'Cliente',
      telefono: (orden as any)?.cliente?.telefono || (ordenServicio as any)?.clienteTelefono || '',
      fotoUrl: (orden as any)?.cliente?.fotoUrl || null,
      initials: (orden as any)?.cliente?.initials || 'CL',
    };

    let repartidorInfo: any = null;
    const repProfile = (orden as any)?.repartidor;
    if (repProfile) {
      const repUser = repProfile.user;
      repartidorInfo = {
        id: repProfile.id,
        nombre: repProfile.nombre || repUser?.name || 'Repartidor',
        telefono: repProfile.telefono || repUser?.telefono || '',
        fotoUrl: repUser?.fotoUrl || repProfile.fotoUrl || null,
        initials: repUser?.initials || (repProfile.nombre ? repProfile.nombre.slice(0, 2).toUpperCase() : 'RP'),
        color: repUser?.color || '#007AFF',
        calificacion: repProfile.calificacion || 5.0,
      };
    }

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
      activa: esActiva,
      estado,
      cliente: clienteInfo,
      repartidor: repartidorInfo,
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
