// services/haptics.ts

export const HAPTIC_PATTERNS = {
  // Feedback ligero — toques de UI
  light: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(10); } catch {}
    }
  },
  
  // Feedback medio — acciones confirmadas
  medium: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(25); } catch {}
    }
  },
  
  // Feedback fuerte — acciones importantes
  heavy: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(50); } catch {}
    }
  },
  
  // Success — entrega completada, orden aceptada
  success: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([15, 50, 25]); } catch {}
    }
  },
  
  // Error — falla, rechazo
  error: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([50, 30, 50, 30, 50]); } catch {}
    }
  },
  
  // Warning — incidencia, timeout
  warning: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([30, 50, 30]); } catch {}
    }
  },
  
  // Nueva orden — patron urgente
  nuevaOrden: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([100, 50, 100, 50, 200]); } catch {}
    }
  },
  
  // Mensaje recibido
  mensaje: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch {}
    }
  },
  
  // Snap del bottom sheet
  snap: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(5); } catch {}
    }
  },
  
  // Timer tick (cada segundo del timer de aceptacion)
  timerTick: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(3); } catch {}
    }
  },
  
  // Timer urgente (ultimos 5 segundos)
  timerUrgente: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([10, 20, 10]); } catch {}
    }
  }
};
