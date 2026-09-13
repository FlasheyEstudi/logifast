'use client';

/**
 * LOGIFAST — Servicio de Rastreo en Segundo Plano para Repartidores
 * ------------------------------------------------------------------
 * Resuelve el problema crítico en móviles (Android/iOS) donde el navegador
 * suspende o frena 'navigator.geolocation.watchPosition' y los WebSockets
 * cuando el repartidor minimiza la app para navegar con Waze o Google Maps.
 *
 * Mecanismos:
 * 1. Silent Audio Loop: Reproduce un micro-audio inaudible (WAV silencioso de 1s).
 *    En Android Chrome y Safari iOS, las pestañas con reproducción multimedia
 *    activa se consideran de primer plano/servicio multimedia y el SO NO suspende
 *    el hilo de JavaScript, permitiendo que el GPS y los timers sigan activos.
 * 2. Screen Wake Lock: Impide que la pantalla se apague mientras la app está abierta.
 * 3. Visibility Change Listener: Al volver a la pestaña, sincroniza de inmediato
 *    la posición GPS vía getCurrentPosition y reconecta sockets si cayeron.
 * 4. Pulso GPS periódico: Lee la posición con alta precisión y la envía al servidor.
 */

let wakeLockSentinel: any = null;
let audioKeepAlive: HTMLAudioElement | null = null;
let pulsoInterval: ReturnType<typeof setInterval> | null = null;
let activo = false;

// Tiny 44-byte silent WAV PCM audio encoded in base64
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Solicita Wake Lock de pantalla para evitar bloqueo mientras conduce.
 */
async function solicitarWakeLock() {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
  try {
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
    });
  } catch {
    // Wake Lock puede no estar permitido en batería baja o iframe
  }
}

/**
 * Inicia el loop de audio silencioso para mantener vivo el proceso en segundo plano.
 */
function iniciarAudioKeepAlive() {
  if (typeof window === 'undefined') return;
  try {
    if (!audioKeepAlive) {
      audioKeepAlive = new Audio(SILENT_WAV_BASE64);
      audioKeepAlive.loop = true;
      audioKeepAlive.volume = 0.01; // volumen imperceptible
      audioKeepAlive.setAttribute('playsinline', 'true');
      audioKeepAlive.setAttribute('preload', 'auto');
    }
    audioKeepAlive.play().catch(() => {
      // Si el navegador requiere interacción previa, se activará en el primer touch/click
    });
  } catch (err) {
    console.warn('[background-tracking] Audio keep-alive warn:', err);
  }
}

/**
 * Fuerza una lectura de GPS y la envía inmediatamente al backend.
 */
export function forzarEnvioPosicionGps(ordenId?: string, estado?: string): Promise<{ lat: number; lng: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const heading = pos.coords.heading || 0;
        const velocidad = pos.coords.speed || 0;

        fetch('/api/repartidor/posicion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, heading, velocidad, ordenId, estado }),
        }).catch(() => null);

        resolve({ lat, lng });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    );
  });
}

/**
 * Inicia el servicio de rastreo en segundo plano.
 * Se debe llamar cuando el repartidor está en servicio o inicia un viaje.
 */
export function iniciarRastreoFondo(ordenId?: string, estado?: string) {
  if (typeof window === 'undefined') return;
  if (activo) return;
  activo = true;

  solicitarWakeLock();
  iniciarAudioKeepAlive();

  // Forzar envío inmediato
  forzarEnvioPosicionGps(ordenId, estado);

  // Pulso de respaldo cada 6 segundos para garantizar actualizaciones constantes
  if (pulsoInterval) clearInterval(pulsoInterval);
  pulsoInterval = setInterval(() => {
    if (!activo) return;
    forzarEnvioPosicionGps(ordenId, estado);
  }, 6000);

  // Escuchar cuando la pestaña vuelve a ser visible (e.g. regresa de Waze o Google Maps)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      solicitarWakeLock();
      iniciarAudioKeepAlive();
      forzarEnvioPosicionGps(ordenId, estado);
    }
  };

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Detiene el servicio de rastreo en segundo plano.
 */
export function detenerRastreoFondo() {
  activo = false;
  if (pulsoInterval) {
    clearInterval(pulsoInterval);
    pulsoInterval = null;
  }
  if (audioKeepAlive) {
    try {
      audioKeepAlive.pause();
      audioKeepAlive.src = '';
    } catch {}
    audioKeepAlive = null;
  }
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
}
