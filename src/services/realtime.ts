'use client';

import { io, Socket } from 'socket.io-client';

const PORT = 3003;

// Singleton socket — created lazily on first call
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      // NOTE: We intentionally do NOT set `path: '/'`.
      // The mini-service `mini-services/realtime-service/index.ts` also omits
      // `path`, so both ends use socket.io's default `/socket.io/` endpoint.
      // With `path: '/'` engine.io would hijack every URL (including the
      // service's /health route). Caddy routes by the XTransformPort query
      // param below, NOT by URL path.
      transports: ['websocket', 'polling'],
      query: { XTransformPort: String(PORT) }, // CRITICAL: Caddy gateway requires this
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[realtime] conectado al servidor (id=' + socket?.id + ')');
    });
    socket.on('disconnect', (reason) => {
      console.log('[realtime] desconectado:', reason);
    });
    socket.on('connect_error', (err) => {
      console.warn('[realtime] error de conexión:', err.message);
    });
  }
  return socket;
}

// ─── Event types ───
export type RealtimeEvent =
  | 'repartidor:orden:nueva'           // nueva orden asignada (repartidor recibe)
  | 'repartidor:posicion:update'       // posición del repartidor actualizada (cliente/admin reciben)
  | 'repartidor:estado:update'         // estado del repartidor cambió (cliente recibe)
  | 'chat:mensaje:nuevo'               // nuevo mensaje de chat
  | 'admin:flota:snapshot'             // snapshot inicial de flota (admin recibe)
  | 'admin:repartidor:offline'         // repartidor se desconectó (admin recibe)
  | 'admin:asignacion:confirmada';     // confirmación de asignación (admin recibe)

// ─── Helper para suscribirse a eventos con cleanup ───
export function onRealtimeEvent(event: RealtimeEvent, handler: (data: any) => void): () => void {
  const s = getSocket();
  s.on(event, handler);
  return () => { s.off(event, handler); };
}

// ─── Emisores (client → server) ───
export const realtime = {
  repartidorConectar: (repartidorId: string) => getSocket().emit('repartidor:conectar', { repartidorId }),
  repartidorPosicion: (lat: number, lng: number, heading: number, estado: string) =>
    getSocket().emit('repartidor:posicion', { lat, lng, heading, estado }),
  repartidorEstadoCambio: (ordenId: string, estado: string) =>
    getSocket().emit('repartidor:estado:cambio', { ordenId, estado }),
  adminConectar: () => getSocket().emit('admin:conectar'),
  adminAsignarOrden: (repartidorId: string, orden: any) =>
    getSocket().emit('admin:asignar:orden', { repartidorId, orden }),
  clienteTrackingUnirse: (ordenId: string) => getSocket().emit('cliente:tracking:unirse', { ordenId }),
  chatMensaje: (ordenId: string, emisor: 'repartidor' | 'cliente', contenido: string) =>
    getSocket().emit('chat:mensaje', {
      ordenId, emisor, contenido,
      enviadoEn: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })
    }),
  disconnect: () => { if (socket) { socket.disconnect(); socket = null; } },
  isConnected: () => socket?.connected ?? false,
};
