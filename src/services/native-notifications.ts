// services/native-notifications.ts
'use client';

import { HAPTIC_PATTERNS } from './haptics';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => null);
  }
  return audioCtx;
}

/**
 * Genera un timbre de alerta profesional sintetizado mediante Web Audio API
 * Funciona offline, sin archivos de audio externos ni peticiones de red.
 */
export function reproducirAlertaSonora(tipo: 'orden' | 'exito' | 'mensaje' = 'orden'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tipo === 'orden') {
      // Tono bitonal ascendente llamativo para repartidor (Re5 -> La5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.15); // A5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (tipo === 'exito') {
      // Acorde suave de confirmación de entrega (Do5 -> Sol5 -> Do6)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.2); // C6
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      // Ping ligero para mensajes
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Ignorar si el navegador bloquea audio antes de interacción
  }
}

/**
 * Obtiene el plugin nativo de LocalNotifications de Capacitor si está disponible
 */
function getCapacitorLocalNotifications(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).Capacitor?.Plugins?.LocalNotifications || null;
}

let channelsConfigured = false;

/**
 * Inicializa permisos y crea canales prioritarios en Android
 */
export async function inicializarNotificacionesNativas(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const plugin = getCapacitorLocalNotifications();

  if (plugin) {
    try {
      // 1. Crear canal prioritario de Android para alertas de entrega (Heads-Up)
      if (!channelsConfigured && plugin.createChannel) {
        await plugin.createChannel({
          id: 'logifast_urgente',
          name: 'Pedidos y Alertas Urgentes',
          description: 'Notificaciones flotantes en pantalla para nuevas órdenes y estados de entrega',
          importance: 5, // IMPORTANCE_HIGH: Notificación flotante (Heads-up)
          visibility: 1, // VISIBILITY_PUBLIC: Visible con pantalla bloqueada
          vibration: true,
          lights: true,
          lightColor: '#007AFF',
        });

        await plugin.createChannel({
          id: 'logifast_chat',
          name: 'Mensajes de Entrega',
          description: 'Chat entre repartidor y cliente',
          importance: 4,
          vibration: true,
          visibility: 1,
        });

        channelsConfigured = true;
      }

      // 2. Solicitar permiso POST_NOTIFICATIONS (Android 13+)
      const status = await plugin.checkPermissions();
      if (status.display !== 'granted') {
        const req = await plugin.requestPermissions();
        return req.display === 'granted';
      }
      return true;
    } catch (err) {
      console.warn('[NativeNotifications] Error inicializando canales nativos:', err);
    }
  } else if ('Notification' in window) {
    // Entorno Web / PWA
    if (Notification.permission === 'default') {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return Notification.permission === 'granted';
  }

  return false;
}

export interface NotificacionOpciones {
  id?: number;
  titulo: string;
  cuerpo: string;
  canalId?: 'logifast_urgente' | 'logifast_chat';
  extra?: Record<string, any>;
  tipoAlerta?: 'orden' | 'exito' | 'mensaje';
}

/**
 * Dispara una notificación nativa inmediata en Android (sin Firebase) o en Web
 */
export async function dispararNotificacionNativa({
  id = Math.floor(Math.random() * 1000000) + 1,
  titulo,
  cuerpo,
  canalId = 'logifast_urgente',
  extra = {},
  tipoAlerta = 'orden',
}: NotificacionOpciones): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Feedback auditivo y háptico inmediato en el dispositivo
  reproducirAlertaSonora(tipoAlerta);
  if (tipoAlerta === 'orden') {
    HAPTIC_PATTERNS.nuevaOrden();
  } else if (tipoAlerta === 'exito') {
    HAPTIC_PATTERNS.success();
  } else {
    HAPTIC_PATTERNS.mensaje();
  }

  const plugin = getCapacitorLocalNotifications();

  // 2. Vía nativa Android con Capacitor Local Notifications
  if (plugin) {
    try {
      await plugin.schedule({
        notifications: [
          {
            id,
            title: titulo,
            body: cuerpo,
            channelId: canalId,
            schedule: { at: new Date(Date.now() + 50) }, // Inmediato
            extra,
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('[NativeNotifications] Falló al programar notificación nativa:', err);
    }
  }

  // 3. Vía Web Notifications API (para PWA / Browser)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(titulo, {
        body: cuerpo,
        icon: '/logos/logo.png',
        badge: '/logos/logo.png',
        data: extra,
        tag: `order-${extra?.ordenId || id}`,
      });
    } catch {
      // Ignorar restricciones en navegadores
    }
  }
}
