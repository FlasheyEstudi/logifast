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
    const serviceKey = process.env.REALTIME_SERVICE_SECRET || process.env.JWT_SECRET || 'logifast-dev-secret';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(() => clearTimeout(timeout))
      .catch((err) => {
        clearTimeout(timeout);
        console.warn('[REALTIME_HTTP_EMIT_WARN]', err?.message || err);
      });
  } catch (e) {
    console.warn('[REALTIME_EMIT_ERR]', e);
  }
}

export function emitOrdenCreada(orden: any) {
  emitirEventoRealtime({ room: 'admin', event: 'admin:orden:nueva', data: orden });
  // Emitir a la bolsa/pool general de repartidores como oferta disponible (no como asignación directa)
  emitirEventoRealtime({ room: 'repartidores', event: 'repartidor:orden:disponible', data: orden });
}

export function emitOrdenAsignada(repartidorId: string, orden: any) {
  // Asignación directa ÚNICAMENTE al repartidor específico
  emitirEventoRealtime({ room: `repartidor:${repartidorId}`, event: 'repartidor:orden:nueva', data: { ...orden, repartidorId } });
  emitirEventoRealtime({ room: 'admin', event: 'admin:orden:asignada', data: { repartidorId, ordenId: orden?.id } });
  // Notificar a todos los demás repartidores que la orden ya fue asignada/tomada
  emitirEventoRealtime({ room: 'repartidores', event: 'repartidor:orden:tomada', data: { ordenId: orden?.id, repartidorId } });
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
