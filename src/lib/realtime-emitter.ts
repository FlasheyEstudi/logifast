import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocket(): Socket | null {
  if (!socket) {
    const url = process.env.REALTIME_SERVICE_URL || process.env.NEXT_PUBLIC_WS_URL;
    if (url) {
      socket = io(url, { transports: ['websocket'] });
    }
  }
  return socket;
}

export function emitOrdenCreada(orden: any) {
  try {
    getSocket()?.emit('backend:orden:creada', orden);
  } catch (e) {
    console.warn('[REALTIME_EMIT_ERR]', e);
  }
}

export function emitOrdenActualizada(orden: any) {
  try {
    getSocket()?.emit('backend:orden:actualizada', orden);
  } catch (e) {
    console.warn('[REALTIME_EMIT_ERR]', e);
  }
}

export function emitOrdenEliminada(ordenId: string) {
  try {
    getSocket()?.emit('backend:orden:eliminada', { id: ordenId });
  } catch (e) {
    console.warn('[REALTIME_EMIT_ERR]', e);
  }
}
