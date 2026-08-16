/**
 * LOGIFAST — Emitter de eventos realtime desde Next.js Serverless API routes hacia el microservicio en Railway.
 */

export async function emitirEventoRealtime(payload: { room?: string; event: string; data: any }) {
  try {
    const baseUrl =
      process.env.REALTIME_SERVICE_URL ||
      process.env.NEXT_PUBLIC_REALTIME_URL ||
      'https://logifast-production.up.railway.app';

    if (!baseUrl) return;

    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/emit`;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn('[REALTIME_HTTP_EMIT_WARN]', err?.message || err);
    });
  } catch (e) {
    console.warn('[REALTIME_EMIT_ERR]', e);
  }
}

export function emitOrdenCreada(orden: any) {
  emitirEventoRealtime({ room: 'admin', event: 'admin:orden:nueva', data: orden });
  emitirEventoRealtime({ room: 'repartidores', event: 'repartidor:orden:nueva', data: orden });
  emitirEventoRealtime({ room: 'repartidores', event: 'repartidor:orden:disponible', data: orden });
  emitirEventoRealtime({ event: 'repartidor:orden:nueva', data: orden });
}

export function emitOrdenAsignada(repartidorId: string, orden: any) {
  emitirEventoRealtime({ room: `repartidor:${repartidorId}`, event: 'repartidor:orden:nueva', data: orden });
  emitirEventoRealtime({ room: 'admin', event: 'admin:orden:asignada', data: { repartidorId, ordenId: orden?.id } });
}

export function emitOrdenActualizada(orden: any) {
  emitirEventoRealtime({ room: 'admin', event: 'admin:orden:actualizada', data: orden });
  if (orden?.id) {
    emitirEventoRealtime({ room: `orden:${orden.id}`, event: 'orden:estado:update', data: orden });
  }
}

export function emitOrdenEliminada(ordenId: string) {
  emitirEventoRealtime({ room: 'admin', event: 'admin:orden:eliminada', data: { id: ordenId } });
}

export function emitChatMensaje(ordenId: string, mensaje: any, repartidorId?: string | null, clienteId?: string | null) {
  emitirEventoRealtime({ room: `orden:${ordenId}`, event: 'chat:mensaje:nuevo', data: mensaje });
  emitirEventoRealtime({ room: 'repartidores', event: 'chat:mensaje:nuevo', data: mensaje });
  if (repartidorId) {
    emitirEventoRealtime({ room: `repartidor:${repartidorId}`, event: 'chat:mensaje:nuevo', data: mensaje });
  }
  if (clienteId) {
    emitirEventoRealtime({ room: `cliente:${clienteId}`, event: 'chat:mensaje:nuevo', data: mensaje });
  }
}
