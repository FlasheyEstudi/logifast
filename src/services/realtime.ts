'use client';

import { io, Socket } from 'socket.io-client';

const PORT = 3003;

// Singleton socket — created lazily on first call
let socket: Socket | null = null;

// Identidad de la sesión local: se re-emite en cada (re)conexión para que la sala
// personal `usuario:{userId}` nunca se pierda tras un corte de red o un resume de la app.
let usuarioActual: { userId: string; rol?: string } | null = null;

function reclamarSalaPersonal() {
  if (usuarioActual && socket?.connected) {
    socket.emit('usuario:conectar', { userId: usuarioActual.userId, rol: usuarioActual.rol });
  }
}

// Sesión de escáner activa: el POS abrió una sala o el celular quedó emparejado.
// Se re-emite en cada reconexión — el celular cambia de red (wifi ↔ datos) a cada rato.
let escanerSesion: { pin: string; rol: 'pos' | 'lector' } | null = null;

function reclamarSesionEscaner() {
  if (escanerSesion && socket?.connected) {
    socket.emit(escanerSesion.rol === 'pos' ? 'escaner:abrir' : 'escaner:unir', { pin: escanerSesion.pin });
  }
}

/** URL del microservicio realtime. Exportada para diagnóstico del emparejamiento. */
export function getRealtimeUrl(): string {
  return (
    process.env.NEXT_PUBLIC_REALTIME_URL ||
    process.env.NEXT_PUBLIC_WS_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3003`
      : '/')
  );
}

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = getRealtimeUrl();

    socket = io(socketUrl, {
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
      reclamarSalaPersonal();
      reclamarSesionEscaner();
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
  | 'repartidor:orden:disponible'      // nueva oferta disponible en el pool (todos los repartidores)
  | 'repartidor:orden:tomada'          // orden tomada por otro repartidor (se retira del pool)
  | 'repartidor:posicion:update'       // posición del repartidor actualizada (cliente/admin reciben)
  | 'repartidor:estado:update'         // estado del repartidor cambió (cliente recibe)
  | 'repartidor:moto:mantenimiento_iniciado'   // moto entró al taller
  | 'repartidor:moto:mantenimiento_completado' // moto reparada y disponible
  | 'repartidor:moto:update'          // estado de moto actualizado
  | 'orden:estado:update'              // estado o repartidor de la orden cambió en vivo
  | 'orden:incidencia'                 // incidencia reportada en la orden
  | 'orden:demora_clima'               // demora por clima o tráfico
  | 'orden:cancelada'                  // orden cancelada
  | 'chat:mensaje:nuevo'               // nuevo mensaje de chat
  | 'admin:flota:snapshot'             // snapshot inicial de flota (admin recibe)
  | 'admin:repartidor:offline'         // repartidor se desconectó (admin recibe)
  | 'admin:asignacion:confirmada'      // confirmación de asignación (admin recibe)
  | 'admin:orden:nueva'                // nueva orden en el sistema (admin recibe)
  | 'admin:orden:asignada'             // orden asignada a repartidor (admin recibe)
  | 'admin:orden:actualizada'          // orden cambió de estado (admin recibe)
  | 'admin:orden:eliminada'            // orden cancelada/eliminada (admin recibe)
  | 'admin:incidencia:nueva'           // nueva incidencia reportada en vivo (admin recibe)
  | 'admin:recarga:actualizada'        // recarga de saldo aprobada/rechazada (admin recibe)
  | 'repartidor:recarga:actualizada'   // recarga de saldo aprobada/rechazada (repartidor recibe)
  | 'notificacion:push'                // aviso dirigido de administración (campaña, promoción, difusión)
  | 'ingeniero:alerta:nueva'           // alerta técnica o emergencia creada (ingeniero recibe)
  | 'ingeniero:mantenimiento:nuevo'    // orden de mantenimiento creada (ingeniero recibe)
  | 'mantenimiento:iniciado'             // mantenimiento pasó a EN_PROCESO
  | 'mantenimiento:completado'           // mantenimiento finalizado
  | 'escaner:abierta'                    // el POS abrió una sala de escaneo (POS recibe)
  | 'escaner:unida'                      // el celular quedó emparejado a la sala (celular recibe)
  | 'escaner:codigo:recibido'            // código leído por el celular (POS recibe)
  | 'escaner:codigo:ack'                 // el servidor confirmó el código enviado (celular recibe)
  | 'escaner:resultado'                  // el POS resolvió el código: existe o no (celular recibe)
  | 'escaner:presencia'                  // entró/salió el lector de la sala (ambos reciben)
  | 'escaner:cerrada'                    // la sesión terminó, se cerró o expiró
  | 'escaner:error';                     // el servidor rechazó una operación del escáner

// ─── Helper para suscribirse a eventos con cleanup ───
export function onRealtimeEvent(event: RealtimeEvent, handler: (data: any) => void): () => void {
  const s = getSocket();
  s.on(event, handler);
  return () => { s.off(event, handler); };
}

// ─── Emisores (client → server) ───
export const realtime = {
  /**
   * Une este dispositivo a su sala personal `usuario:{userId}`.
   * Necesario para recibir avisos/notificaciones dirigidos de administración.
   * Persiste tras reconexiones (ver `reclamarSalaPersonal`).
   */
  usuarioConectar: (userId: string, rol?: string) => {
    if (!userId) return;
    usuarioActual = { userId, rol };
    const s = getSocket();
    if (s.connected) s.emit('usuario:conectar', { userId, rol });
  },
  usuarioDesconectar: () => {
    usuarioActual = null;
  },
  repartidorConectar: (repartidorId: string) => getSocket().emit('repartidor:conectar', { repartidorId }),
  repartidorPosicion: (lat: number, lng: number, heading: number, estado: string, ordenId?: string) =>
    getSocket().emit('repartidor:posicion', { lat, lng, heading, estado, ordenId }),
  repartidorEstadoCambio: (ordenId: string, estado: string) =>
    getSocket().emit('repartidor:estado:cambio', { ordenId, estado }),
  adminConectar: () => getSocket().emit('admin:conectar'),
  adminAsignarOrden: (repartidorId: string, orden: any) =>
    getSocket().emit('admin:asignar:orden', { repartidorId, orden }),
  ingenieroConectar: () => getSocket().emit('ingeniero:conectar'),
  clienteTrackingUnirse: (ordenId: string) => getSocket().emit('cliente:tracking:unirse', { ordenId }),
  chatMensaje: (ordenId: string, emisor: 'repartidor' | 'cliente', contenido: string) =>
    getSocket().emit('chat:mensaje', {
      ordenId, emisor, contenido,
      enviadoEn: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })
    }),
  /**
   * ESCÁNER INALÁMBRICO — lado POS (tablet/PC).
   * Abre la sala efímera `escaner:{pin}`; el PIN de 6 dígitos lo genera el POS.
   */
  escanerAbrir: (pin: string) => {
    if (!pin) return;
    escanerSesion = { pin, rol: 'pos' };
    getSocket().emit('escaner:abrir', { pin });
  },
  /** ESCÁNER INALÁMBRICO — lado celular (lector): se une con el PIN del POS. */
  escanerUnir: (pin: string) => {
    if (!pin) return;
    escanerSesion = { pin, rol: 'lector' };
    getSocket().emit('escaner:unir', { pin });
  },
  /** Transmite al POS un código leído por la cámara del celular. */
  escanerEnviarCodigo: (pin: string, codigo: string) => {
    const limpio = String(codigo ?? '').trim();
    if (!pin || limpio.length < 3) return;
    getSocket().emit('escaner:codigo', { pin, codigo: limpio });
  },
  /** El celular se desempareja sin cerrar la sesión que abrió el POS. */
  escanerSalir: (pin?: string) => {
    const p = pin || (escanerSesion?.rol === 'lector' ? escanerSesion.pin : '');
    escanerSesion = null;
    if (p) getSocket().emit('escaner:salir', { pin: p });
  },
  /** El POS cierra la sala: el celular recibe `escaner:cerrada`. */
  escanerCerrar: (pin?: string) => {
    const p = pin || escanerSesion?.pin || '';
    escanerSesion = null;
    if (p) getSocket().emit('escaner:cerrar', { pin: p });
  },
  escanerSesionActiva: () => escanerSesion,
  /** El POS avisa al celular si el código resolvió a un producto del catálogo. */
  escanerResultado: (pin: string, codigo: string, encontrado: boolean, nombre?: string | null) => {
    if (!pin) return;
    getSocket().emit('escaner:resultado', { pin, codigo, encontrado, nombre: nombre ?? null });
  },
  disconnect: () => { if (socket) { socket.disconnect(); socket = null; escanerSesion = null; } },
  isConnected: () => socket?.connected ?? false,
};
