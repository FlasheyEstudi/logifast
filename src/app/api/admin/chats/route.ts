import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/** Estados de orden que implican una conversación ya cerrada. */
const ESTADOS_CERRADOS = new Set([
  'entregado', 'entregada', 'cancelado', 'cancelada', 'completado', 'completada',
  'finalizado', 'finalizada', 'delivered', 'cancelled',
]);

/**
 * GET /api/admin/chats
 * Lista de conversaciones cliente ↔ repartidor (solo admin).
 *
 * Query: ?ordenId=&estado=abierto|cerrado&clienteId=&repartidorId=&q=&limit=
 *
 * El admin queda ciego si hay un reclamo: esto expone todas las conversaciones
 * con su último mensaje y los datos de ambas partes.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole('admin');

    const { searchParams } = new URL(req.url);
    const ordenId = searchParams.get('ordenId')?.trim() || '';
    const estadoFiltro = searchParams.get('estado')?.trim().toLowerCase() || '';
    const clienteId = searchParams.get('clienteId')?.trim() || '';
    const repartidorId = searchParams.get('repartidorId')?.trim() || '';
    const q = searchParams.get('q')?.trim() || '';
    const limitRaw = parseInt(searchParams.get('limit') ?? '60', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 60;

    // ─── 1. Conversaciones agrupadas por orden ───
    const grupos = await db.chatRepartidor.groupBy({
      by: ['ordenId'],
      _count: { _all: true },
      _max: { enviadoEn: true },
      orderBy: { _max: { enviadoEn: 'desc' } },
      take: 200,
    });

    let ids = grupos.map((g) => g.ordenId);
    if (ordenId) ids = ids.filter((id) => id.toLowerCase().includes(ordenId.toLowerCase()));
    if (ids.length === 0) {
      return NextResponse.json({ chats: [], total: 0 });
    }

    // ─── 2. Mensajes de esas órdenes (una sola query) ───
    // Búsqueda libre dentro del contenido (para encontrar un reclamo por texto)
    const filtroMensaje: any = { ordenId: { in: ids } };
    if (q) filtroMensaje.contenido = { contains: q, mode: 'insensitive' };

    const mensajes = await db.chatRepartidor.findMany({
      where: filtroMensaje,
      orderBy: { enviadoEn: 'desc' },
      select: {
        id: true, ordenId: true, emisor: true, contenido: true,
        enviadoEn: true, leido: true, clienteId: true, repartidorId: true,
      },
    });

    // Si se buscó por texto, solo conservamos las órdenes que tienen coincidencias
    if (q) {
      const idsConCoincidencia = new Set(mensajes.map((m) => m.ordenId));
      ids = ids.filter((id) => idsConCoincidencia.has(id));
    }

    const ultimoPorOrden = new Map<string, typeof mensajes[number]>();
    const conteo = new Map<string, number>();
    for (const m of mensajes) {
      if (!ids.includes(m.ordenId)) continue;
      if (!ultimoPorOrden.has(m.ordenId)) ultimoPorOrden.set(m.ordenId, m);
      conteo.set(m.ordenId, (conteo.get(m.ordenId) ?? 0) + 1);
    }

    // ─── 3. Datos de las órdenes (envíos y compras) ───
    const [envios, compras] = await Promise.all([
      db.ordenServicio.findMany({
        where: { id: { in: ids } },
        select: {
          id: true, estado: true, origen: true, destino: true, createdAt: true,
          clienteId: true,
          cliente: { select: { id: true, name: true, telefono: true } },
          repartidor: { select: { id: true, user: { select: { id: true, name: true } } } },
        },
      }),
      db.ordenCompra.findMany({
        where: { id: { in: ids } },
        select: {
          id: true, estado: true, createdAt: true, clienteId: true,
          cliente: { select: { id: true, name: true, telefono: true } },
          tienda: { select: { nombre: true } },
          repartidor: { select: { id: true, user: { select: { id: true, name: true } } } },
        },
      }),
    ]);

    const envioPorId = new Map(envios.map((o) => [o.id, o]));
    const compraPorId = new Map(compras.map((o) => [o.id, o]));

    let chats = ids.map((id) => {
      const envio = envioPorId.get(id);
      const compra = compraPorId.get(id);
      const ultimo = ultimoPorOrden.get(id);
      // Los ids 'general' (chat sin orden asociada) no tienen orden: quedan abiertos
      const estadoOrden = (envio?.estado || compra?.estado || '').toLowerCase();
      const estado = estadoOrden && ESTADOS_CERRADOS.has(estadoOrden) ? 'cerrado' : 'abierto';

      const cliente = envio?.cliente || compra?.cliente || null;
      const rep = envio?.repartidor || compra?.repartidor || null;

      return {
        ordenId: id,
        tipo: envio ? 'envio' : compra ? 'tienda' : 'desconocida',
        estado,
        estadoOrden: envio?.estado || compra?.estado || null,
        origen: envio?.origen || compra?.tienda?.nombre || null,
        destino: envio?.destino || null,
        totalMensajes: conteo.get(id) ?? 0,
        noLeidos: mensajes.filter((m) => m.ordenId === id && !m.leido && m.emisor !== 'admin').length,
        ultimoMensaje: ultimo
          ? { contenido: ultimo.contenido, emisor: ultimo.emisor, enviadoEn: ultimo.enviadoEn }
          : null,
        cliente: cliente ? { id: cliente.id, nombre: cliente.name, telefono: cliente.telefono } : null,
        repartidor: rep
          ? { id: rep.id, nombre: rep.user?.name || 'Repartidor', userId: rep.user?.id || null }
          : null,
        clienteId: envio?.clienteId || compra?.clienteId || ultimo?.clienteId || null,
        repartidorId: rep?.id || ultimo?.repartidorId || null,
      };
    });

    // ─── 4. Filtros finales ───
    if (estadoFiltro === 'abierto' || estadoFiltro === 'cerrado') {
      chats = chats.filter((c) => c.estado === estadoFiltro);
    }
    if (clienteId) chats = chats.filter((c) => c.clienteId === clienteId);
    if (repartidorId) chats = chats.filter((c) => c.repartidorId === repartidorId || c.repartidor?.userId === repartidorId);

    const totalSinRecortar = chats.length;
    chats = chats.slice(0, limit);

    return NextResponse.json({
      chats,
      total: totalSinRecortar,
      abiertos: chats.filter((c) => c.estado === 'abierto').length,
      cerrados: chats.filter((c) => c.estado === 'cerrado').length,
    });
  } catch (error) {
    return handleError(error, 'ADMIN_CHATS_GET');
  }
}
