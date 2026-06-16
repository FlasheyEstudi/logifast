/**
 * LOGIFAST — Audio service
 * ------------------------------------------------------------------
 * Real, dependency-free sound effects using the Web Audio API.
 * No external sound files; every beep is synthesized on the fly
 * with oscillators + gain envelopes.
 *
 * SSR-safe: every entry point guards `typeof window` and the
 * AudioContext is created lazily on first use, never at module load.
 */

export type SonidoTipo =
  | 'nueva_orden'
  | 'orden_aceptada'
  | 'orden_entregada'
  | 'mensaje'
  | 'error'
  | 'toggle_on'
  | 'toggle_off'
  | 'exito'
  | 'notificacion';

interface Nota {
  /** Frequency in Hz */
  freq: number;
  /** Duration in seconds */
  dur: number;
  /** Oscillator waveform */
  type: OscillatorType;
  /** Peak gain (0-1, pre-volume multiplier) */
  gain: number;
}

/**
 * Note sequences for each sound type. Numbers are tuned to feel
 * pleasant + distinct on a phone speaker.
 */
const SONIDOS: Record<SonidoTipo, Nota[]> = {
  // Urgent alternating 880/1100 — grabs attention
  nueva_orden: [
    { freq: 880, dur: 0.12, type: 'sine', gain: 0.5 },
    { freq: 1100, dur: 0.12, type: 'sine', gain: 0.5 },
    { freq: 880, dur: 0.12, type: 'sine', gain: 0.5 },
    { freq: 1100, dur: 0.18, type: 'sine', gain: 0.5 },
  ],
  // Ascending C-E-G major arpeggio — positive confirmation
  orden_aceptada: [
    { freq: 523, dur: 0.1, type: 'sine', gain: 0.4 },
    { freq: 659, dur: 0.1, type: 'sine', gain: 0.4 },
    { freq: 784, dur: 0.18, type: 'sine', gain: 0.4 },
  ],
  // 4 ascending notes ending on high C — completion fanfare
  orden_entregada: [
    { freq: 523, dur: 0.09, type: 'sine', gain: 0.4 },
    { freq: 659, dur: 0.09, type: 'sine', gain: 0.4 },
    { freq: 784, dur: 0.09, type: 'sine', gain: 0.4 },
    { freq: 1047, dur: 0.22, type: 'sine', gain: 0.45 },
  ],
  // Short two-note rising chirp
  mensaje: [
    { freq: 800, dur: 0.08, type: 'sine', gain: 0.4 },
    { freq: 1000, dur: 0.12, type: 'sine', gain: 0.4 },
  ],
  // Low square-wave — harsh error
  error: [
    { freq: 300, dur: 0.16, type: 'square', gain: 0.22 },
    { freq: 250, dur: 0.22, type: 'square', gain: 0.22 },
  ],
  // Ascending — UI toggle on
  toggle_on: [
    { freq: 600, dur: 0.06, type: 'sine', gain: 0.35 },
    { freq: 900, dur: 0.09, type: 'sine', gain: 0.35 },
  ],
  // Descending — UI toggle off
  toggle_off: [
    { freq: 900, dur: 0.06, type: 'sine', gain: 0.35 },
    { freq: 600, dur: 0.09, type: 'sine', gain: 0.35 },
  ],
  // C-G-highC — success
  exito: [
    { freq: 523, dur: 0.1, type: 'sine', gain: 0.4 },
    { freq: 784, dur: 0.1, type: 'sine', gain: 0.4 },
    { freq: 1047, dur: 0.2, type: 'sine', gain: 0.45 },
  ],
  // Gentle two-note rising — generic notification
  notificacion: [
    { freq: 660, dur: 0.1, type: 'sine', gain: 0.4 },
    { freq: 880, dur: 0.14, type: 'sine', gain: 0.4 },
  ],
};

// Lazily-initialized singleton AudioContext.
let audioContext: AudioContext | null = null;

/**
 * Get (or create) the singleton AudioContext. Returns null on SSR
 * or when Web Audio API isn't available.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;

  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  try {
    audioContext = new Ctor();
  } catch (err) {
    console.warn('audio: failed to create AudioContext', err);
    return null;
  }
  return audioContext;
}

/**
 * Play a synthesized sound. Safe to call from anywhere — no-ops on
 * the server or when Web Audio API is unavailable.
 *
 * @param tipo      which sound to play
 * @param volumen   0-100 (default 80); scaled into a gain multiplier
 */
export function reproducirSonido(tipo: SonidoTipo, volumen = 80): void {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Autoplay policy: context can start suspended until a user gesture.
  if (ctx.state === 'suspended') {
    ctx.resume().catch((err) => {
      console.warn('audio: failed to resume AudioContext', err);
    });
  }

  const notas = SONIDOS[tipo];
  if (!notas || notas.length === 0) return;

  const volumeMultiplier = Math.max(0, Math.min(100, volumen)) / 100;
  const now = ctx.currentTime;
  let offset = 0;

  for (const nota of notas) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = nota.type;
    osc.frequency.setValueAtTime(nota.freq, now + offset);

    const peak = nota.gain * volumeMultiplier;
    // Envelope: 0 -> peak at +0.01s -> 0 at +dur
    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(peak, now + offset + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + offset + nota.dur);

    // Routing: oscillator -> gain -> destination
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Schedule start/stop with a small tail buffer to avoid clicks.
    osc.start(now + offset);
    osc.stop(now + offset + nota.dur + 0.02);

    offset += nota.dur + 0.03;
  }
}

/**
 * Conditional playback helper used by notification / event code.
 * Respects the user's audio config:
 *  - skips entirely if `sonidoActivo === false`
 *  - for notification-class sounds (nueva_orden, notificacion, mensaje)
 *    also requires `notificacionesSonido === true`
 *
 * @param tipo    sound to play
 * @param config  current audio/notification settings from configStore
 */
export function reproducirSiActivo(
  tipo: SonidoTipo,
  config: {
    sonidoActivo: boolean;
    volumenSonido: number;
    notificacionesSonido: boolean;
  }
): void {
  if (!config.sonidoActivo) return;

  const isNotificationClass =
    tipo === 'nueva_orden' ||
    tipo === 'notificacion' ||
    tipo === 'mensaje';
  if (isNotificationClass && !config.notificacionesSonido) return;

  reproducirSonido(tipo, config.volumenSonido);
}

/**
 * Conditional vibration helper. No-ops when vibracionActiva is false
 * or when the Vibration API isn't available (desktop / iOS Safari).
 *
 * @param patron            single duration (ms) or pattern array
 * @param vibracionActiva   whether the user enabled vibration
 */
export function vibrarSiActivo(
  patron: number | number[],
  vibracionActiva: boolean
): void {
  if (!vibracionActiva) return;
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(patron);
  } catch (err) {
    console.warn('audio: vibrate failed', err);
  }
}
