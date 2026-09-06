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
  | 'ruta_optimizada'
  | 'mensaje'
  | 'error'
  | 'toggle_on'
  | 'toggle_off'
  | 'exito'
  | 'notificacion'
  | 'pop';

// Lazily-initialized singleton AudioContext.
let audioContext: AudioContext | null = null;

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

/**
 * Get (or create) the singleton AudioContext. Returns null on SSR
 * or when Web Audio API isn't available.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext && audioContext.state !== 'closed') return audioContext;

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
 * Synthesizes a resonant bell / crystal tone with a fundamental + harmonic overtone
 * and natural exponential decay.
 */
function playBellTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number,
  filterFreq = 4200
) {
  const master = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, startTime);
  filter.Q.setValueAtTime(1.2, startTime);

  master.connect(filter);
  filter.connect(ctx.destination);

  // Envelope: rapid attack (6ms) followed by exponential natural decay
  master.gain.setValueAtTime(0.0001, startTime);
  master.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startTime + 0.006);
  master.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  // Fundamental oscillator
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);
  osc1.connect(master);
  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.05);

  // Soft metallic overtone (2.76x physical bell mode)
  const osc2 = ctx.createOscillator();
  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(0.25, startTime);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.756, startTime);
  osc2.connect(overtoneGain);
  overtoneGain.connect(master);
  osc2.start(startTime);
  osc2.stop(startTime + Math.min(duration, 0.15) + 0.05);
}

/**
 * Play a synthesized sound effect. Safe to call from anywhere — no-ops on
 * the server or when Web Audio API is unavailable.
 *
 * @param tipo      which sound to play
 * @param volumen   0-100 (default 80); scaled into a gain multiplier
 */
export function reproducirSonido(tipo: SonidoTipo, volumen = 80): void {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch((err) => {
      console.warn('audio: failed to resume AudioContext', err);
    });
  }

  const vol = (Math.max(0, Math.min(100, volumen)) / 100) * 0.45;
  const now = ctx.currentTime;

  switch (tipo) {
    case 'nueva_orden': {
      // Urgent, clear, high-fidelity delivery alert: dual melodic chime pulses
      // Pulse 1:
      playBellTone(ctx, 1046.5, now + 0.00, 0.24, vol * 1.0, 5000); // C6
      playBellTone(ctx, 1567.98, now + 0.03, 0.28, vol * 0.85, 5200); // G6
      playBellTone(ctx, 1318.51, now + 0.15, 0.32, vol * 1.1, 5200); // E6
      playBellTone(ctx, 2093.0, now + 0.18, 0.40, vol * 0.95, 5500); // C7

      // Pulse 2 (echo after 0.42s):
      playBellTone(ctx, 1046.5, now + 0.42, 0.22, vol * 0.9, 5000);
      playBellTone(ctx, 1567.98, now + 0.45, 0.26, vol * 0.8, 5200);
      playBellTone(ctx, 1318.51, now + 0.57, 0.35, vol * 1.15, 5200);
      playBellTone(ctx, 2093.0, now + 0.60, 0.45, vol * 1.0, 5500);
      break;
    }

    case 'orden_aceptada': {
      // Ascending crystal major arpeggio (D5 -> F#5 -> A5 -> D6)
      playBellTone(ctx, 587.33, now + 0.00, 0.18, vol * 0.7, 4000);
      playBellTone(ctx, 739.99, now + 0.09, 0.18, vol * 0.8, 4200);
      playBellTone(ctx, 880.00, now + 0.18, 0.22, vol * 0.9, 4400);
      playBellTone(ctx, 1174.66, now + 0.27, 0.38, vol * 1.1, 4800);
      break;
    }

    case 'orden_entregada': {
      // Grand celebratory fanfare with sparkling sustain
      playBellTone(ctx, 523.25, now + 0.00, 0.20, vol * 0.8, 4000); // C5
      playBellTone(ctx, 659.25, now + 0.10, 0.20, vol * 0.85, 4200); // E5
      playBellTone(ctx, 783.99, now + 0.20, 0.25, vol * 0.9, 4400); // G5
      playBellTone(ctx, 1046.5, now + 0.30, 0.55, vol * 1.2, 5000); // C6
      // Shimmer chord
      playBellTone(ctx, 1318.51, now + 0.38, 0.65, vol * 0.7, 5200); // E6
      playBellTone(ctx, 1567.98, now + 0.45, 0.75, vol * 0.6, 5500); // G6
      break;
    }

    case 'ruta_optimizada': {
      // High-tech AI route optimization whoosh + crystal triad
      // Rising FM frequency glide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol * 0.6, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);

      // Chime chord resolution
      playBellTone(ctx, 1046.5, now + 0.11, 0.35, vol * 1.0, 5000); // C6
      playBellTone(ctx, 1318.51, now + 0.15, 0.38, vol * 0.9, 5200); // E6
      playBellTone(ctx, 1567.98, now + 0.19, 0.48, vol * 1.1, 5500); // G6
      break;
    }

    case 'mensaje': {
      // Clean droplet / modern messenger chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3600, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.05);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol * 0.9, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.20);
      break;
    }

    case 'error': {
      // Warm physical double-thud (replaces harsh robotic square wave)
      const playThud = (freq: number, start: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, start);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, start + 0.12);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(vol * 0.8, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.15);
      };

      playThud(150, now);
      playThud(115, now + 0.12);
      break;
    }

    case 'toggle_on': {
      // Modern tactile bubble pop (rising)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.035);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol * 0.7, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }

    case 'toggle_off': {
      // Modern tactile bubble pop (descending)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.035);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol * 0.65, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }

    case 'exito': {
      // Crisp glass bell success chime
      playBellTone(ctx, 659.25, now + 0.00, 0.18, vol * 0.75, 4200); // E5
      playBellTone(ctx, 880.00, now + 0.08, 0.22, vol * 0.85, 4500); // A5
      playBellTone(ctx, 1318.51, now + 0.18, 0.42, vol * 1.15, 5200); // E6
      break;
    }

    case 'notificacion': {
      // Gentle marimba / acoustic chime
      playBellTone(ctx, 783.99, now + 0.00, 0.22, vol * 0.75, 4000); // G5
      playBellTone(ctx, 1174.66, now + 0.09, 0.38, vol * 0.95, 4600); // D6
      break;
    }

    case 'pop': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol * 0.6, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    }
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
