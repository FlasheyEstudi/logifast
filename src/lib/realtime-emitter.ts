/**
 * LOGIFAST — Emitter de eventos realtime desde Next.js Serverless API routes hacia el microservicio en Railway.
 */

export interface EmitPayload {
  room?: string;
  /** Varias salas en un solo POST (envío masivo por lotes, evita N peticiones HTTP). */
  rooms?: string[];
  event: string;
  data: any;
}

export interface EmitResultado {
  ok: boolean;
  entregados: number; // sockets realmente conectados en esas salas
  salas: number | string;
  salasActivas?: number | null;
}

function construirRequest(payload: EmitPayload) {
  const baseUrl =
    process.env.REALTIME_SERVICE_URL ||
    process.env.NEXT_PUBLIC_REALTIME_URL ||
    'https://logifast-production.up.railway.app';

  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/emit`;
  const serviceKey = process.env.REALTIME_SERVICE_SECRET || process.env.JWT_SECRET || 'logifast-dev-secret';

  return {
    endpoint,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    } as RequestInit,
  };
}

/**
 * Emisión "fire and forget" (comportamiento histórico).
 * Usar `emitirEventoRealtimeAsync` cuando se necesite la métrica de entrega.
 */
export async function emitirEventoRealtime(payload: EmitPayload) {
  try {
    const { endpoint, init } = construirRequest(payload);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    fetch(endpoint, { ...init, signal: controller.signal })
      .then(() => clearTimeout(timeout))
      .catch((err) => {
        clearTimeout(timeout);
        console.warn('[REALTIME_HTTP_EMIT_WARN]', err?.message || err);
      });
  } catch (e) {
    console.warn('[REALTIME_EMIT_ERR]', e);
  }
}

/**
 * Emisión que espera la respuesta del microservicio.
 * Devuelve cuántos dispositivos conectados recibieron realmente el evento:
 * es la única métrica honesta de "entregado" sin un proveedor de push (FCM).
 */
export async function emitirEventoRealtimeAsync(payload: EmitPayload): Promise<EmitResultado | null> {
  try {
    const { endpoint, init } = construirRequest(payload);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint, { ...init, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('[REALTIME_HTTP_EMIT_STATUS]', res.status);
      return null;
    }
    return (await res.json()) as EmitResultado;
  } catch (e: any) {
    console.warn('[REALTIME_EMIT_ERR]', e?.message || e);
    return null;
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
    // `cliente:{id}` nunca fue una sala real (el cliente jamás se unía a ella).
    // La sala personal real es `usuario:{User.id}`.
    emitirEventoRealtime({ room: `usuario:${clienteId}`, event: 'chat:mensaje:nuevo', data: mensaje });
  }
}

export function emitRecargaActualizada(repartidorId: string, data: any) {
  emitirEventoRealtime({ room: `repartidor:${repartidorId}`, event: 'repartidor:recarga:actualizada', data });
  emitirEventoRealtime({ room: 'admin', event: 'admin:recarga:actualizada', data });
}

