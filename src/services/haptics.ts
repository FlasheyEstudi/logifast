// services/haptics.ts
import { useConfigStore } from '@/store/configStore';

function safeVibrate(patron: number | number[]): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  try {
    const vibracionActiva = useConfigStore.getState().vibracionActiva;
    if (!vibracionActiva) return;
    navigator.vibrate(patron);
  } catch {
    // Ignore unsupported hardware or browser security restrictions
  }
}

export const HAPTIC_PATTERNS = {
  // Feedback ligero — toques de UI
  light: () => safeVibrate(10),

  // Feedback medio — acciones confirmadas
  medium: () => safeVibrate(25),

  // Feedback fuerte — acciones importantes
  heavy: () => safeVibrate(50),

  // Success — entrega completada, orden aceptada
  success: () => safeVibrate([15, 50, 25]),

  // Error — falla, rechazo
  error: () => safeVibrate([50, 30, 50, 30, 50]),

  // Warning — incidencia, timeout
  warning: () => safeVibrate([30, 50, 30]),

  // Nueva orden — patrón urgente para evento crítico de negocio
  nuevaOrden: () => safeVibrate([100, 50, 100, 50, 200]),

  // Mensaje recibido
  mensaje: () => safeVibrate(15),

  // Snap del bottom sheet
  snap: () => safeVibrate(5),

  // Timer tick — REMOVIDO para eliminar la vibración continua de 1s
  timerTick: () => {
    // No-op intencional: optimización de hardware y batería del repartidor
  },

  // Timer urgente (últimos 5 segundos de una orden crítica pendiente)
  timerUrgente: () => safeVibrate([10, 20, 10]),
};
