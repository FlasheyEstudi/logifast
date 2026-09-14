// services/native-notifications.ts
'use client';

import { HAPTIC_PATTERNS } from './haptics';
import { sileo } from 'sileo';

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
export function reproducirAlertaSonora(tipo: 'orden' | 'exito' | 'mensaje' | 'alerta' = 'orden'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tipo === 'orden') {
      // Tono bitonal ascendente llamativo de asignación de delivery (Re5 -> La5)
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
    } else if (tipo === 'mensaje') {
      // Ping ligero para chat de soporte y cliente
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      // Alerta de atención
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440.0, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Silencioso si el navegador aún no tiene interacción
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
let actionsConfigured = false;
let permissionRequested = false;

/**
 * Inicializa permisos, canales prioritarios (Heads-Up) y botones de acción en Android y Web
 */
export async function inicializarNotificacionesNativas(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const plugin = getCapacitorLocalNotifications();

  if (plugin) {
    let hasDisplayPermission = false;

    // 1. SOLICITAR PERMISOS NATIVOS PRIMERO (Crucial para Android 13+ / POST_NOTIFICATIONS)
    try {
      const status = await plugin.checkPermissions();
      if (status?.display === 'granted') {
        hasDisplayPermission = true;
      } else {
        const req = await plugin.requestPermissions();
        hasDisplayPermission = req?.display === 'granted';
      }
      permissionRequested = true;
    } catch (permErr) {
      console.warn('[NativeNotifications] Error al verificar permisos en Android:', permErr);
    }

    // 2. CREAR CANALES NATIVOS ANDROID (Importancia máxima permitida en canales: 4 = IMPORTANCE_HIGH)
    if (!channelsConfigured && plugin.createChannel) {
      const canales = [
        {
          id: 'logifast_urgente',
          name: 'Pedidos y Alertas Urgentes',
          description: 'Notificaciones flotantes prioritarias para nuevas órdenes y estados de entrega',
          importance: 4, // IMPORTANCE_HIGH: Notificación flotante emergente (Heads-up)
          visibility: 1, // VISIBILITY_PUBLIC: Visible con pantalla bloqueada
          vibration: true,
          lights: true,
          lightColor: '#007AFF',
        },
        {
          id: 'logifast_estado',
          name: 'Estado de Envíos y Progreso',
          description: 'Actualizaciones de progreso y despacho de pedidos en tiempo real',
          importance: 4,
          vibration: true,
          visibility: 1,
          lights: true,
          lightColor: '#FF5722',
        },
        {
          id: 'logifast_chat',
          name: 'Mensajes de Entrega',
          description: 'Chat en tiempo real entre repartidor y cliente',
          importance: 4,
          vibration: true,
          visibility: 1,
          lights: true,
          lightColor: '#00C853',
        },
      ];

      for (const canal of canales) {
        try {
          await plugin.createChannel(canal);
        } catch (chanErr) {
          console.warn(`[NativeNotifications] Advertencia registrando canal ${canal.id}:`, chanErr);
        }
      }
      channelsConfigured = true;
    }

    // 3. REGISTRAR BOTONES DE ACCIÓN RÁPIDA (Interactivos desde la barra)
    if (!actionsConfigured && plugin.registerActionTypes) {
      try {
        await plugin.registerActionTypes({
          types: [
            {
              id: 'ORDEN_NUEVA',
              actions: [
                { id: 'ver_orden', title: 'Ver Orden' },
                { id: 'abrir_app', title: 'Abrir App' },
              ],
            },
            {
              id: 'ORDEN_ESTADO',
              actions: [
                { id: 'ver_tracking', title: 'Rastrear Ruta' },
                { id: 'abrir_chat', title: 'Chat' },
              ],
            },
          ],
        });

        if (plugin.addListener) {
          plugin.addListener('localNotificationActionPerformed', (notificationAction: any) => {
            const extra = notificationAction.notification?.extra || {};
            const actionId = notificationAction.actionId;
            if (extra.ordenId) {
              if (actionId === 'ver_tracking') {
                window.location.hash = `#/cliente/tracking?id=${extra.ordenId}`;
              } else if (actionId === 'abrir_chat') {
                window.location.hash = `#/cliente/chat?id=${extra.ordenId}`;
              } else if (actionId === 'ver_orden') {
                window.location.hash = `#/repartidor/servicio?id=${extra.ordenId}`;
              }
            }
          });
        }
        actionsConfigured = true;
      } catch (actErr) {
        console.warn('[NativeNotifications] Advertencia configurando acciones interactivas:', actErr);
      }
    }

    return hasDisplayPermission;
  }

  // ENTORNO WEB / PWA (Navegadores móviles y de escritorio)
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        const res = await Notification.requestPermission();
        permissionRequested = true;
        return res === 'granted';
      } catch (webErr) {
        console.warn('[NativeNotifications] Error pidiendo permiso web:', webErr);
        return false;
      }
    }
    return Notification.permission === 'granted';
  }

  return false;
}

/**
 * Permite solicitar el permiso manualmente desde un botón o banner con interacción directa del usuario
 */
export async function solicitarPermisoNotificacionesManual(): Promise<boolean> {
  return inicializarNotificacionesNativas();
}

export interface NotificacionOpciones {
  id?: number;
  titulo: string;
  cuerpo: string;
  subtexto?: string;
  detalleLargo?: string;
  canalId?: 'logifast_urgente' | 'logifast_chat' | 'logifast_estado';
  colorIcono?: string;
  iconoPequeno?: string;
  iconoGrande?: string;
  imagenBanner?: string;
  categoriaAcciones?: 'ORDEN_NUEVA' | 'ORDEN_ESTADO' | string;
  extra?: Record<string, any>;
  tipoAlerta?: 'orden' | 'exito' | 'mensaje' | 'alerta';
  mostrarBannerInApp?: boolean;
}

/**
 * Dispara una notificación nativa inmediata y confiable en Android o Web
 */
export async function dispararNotificacionNativa({
  id = Math.floor(Math.random() * 1000000) + 1,
  titulo,
  cuerpo,
  subtexto = 'LOGIFAST • Envíos Express',
  detalleLargo,
  canalId = 'logifast_urgente',
  colorIcono,
  iconoPequeno = 'ic_stat_logifast',
  imagenBanner,
  categoriaAcciones,
  extra = {},
  tipoAlerta = 'orden',
  mostrarBannerInApp = true,
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

  // 2. Banner flotante enriquecido in-app si el usuario está con la app abierta
  if (mostrarBannerInApp) {
    try {
      if (tipoAlerta === 'exito') {
        sileo.success({ title: titulo, description: cuerpo });
      } else {
        sileo.info({ title: titulo, description: cuerpo });
      }
    } catch {}
  }

  const plugin = getCapacitorLocalNotifications();

  // 3. Vía nativa Android con Capacitor Local Notifications
  if (plugin) {
    try {
      const resolvedColor = colorIcono || (canalId === 'logifast_urgente' ? '#007AFF' : canalId === 'logifast_chat' ? '#00C853' : '#FF5722');
      const resolvedActionType = categoriaAcciones || (canalId === 'logifast_urgente' ? 'ORDEN_NUEVA' : 'ORDEN_ESTADO');

      // DISPARO INMEDIATO:
      // Omitir schedule. Al no tener schedule, Capacitor ejecuta directamente notificationManager.notify(...)
      // evitando la trampa de AlarmManager y garantizando entrega al 100% en tiempo real.
      const payload: any = {
        id,
        title: titulo,
        body: cuerpo,
        largeBody: detalleLargo || cuerpo,
        summaryText: subtexto,
        channelId: canalId,
        iconColor: resolvedColor,
        actionTypeId: resolvedActionType,
        extra,
      };

      if (iconoPequeno) {
        payload.smallIcon = iconoPequeno;
      }

      await plugin.schedule({
        notifications: [payload],
      });
      return;
    } catch (err) {
      console.warn('[NativeNotifications] Falló con payload enriquecido, reintentando básico:', err);
      // Fallback a prueba de fallos con canal por defecto
      try {
        await plugin.schedule({
          notifications: [
            {
              id,
              title: titulo,
              body: cuerpo,
              channelId: 'default',
              extra,
            },
          ],
        });
        return;
      } catch (fallbackErr) {
        console.warn('[NativeNotifications] Falló reintento básico en Android:', fallbackErr);
      }
    }
  }

  // 4. Vía Web Notifications API / Service Worker (PWA / Chrome Móvil / Safari)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const webOptions: NotificationOptions = {
      body: cuerpo,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      image: imagenBanner || undefined,
      data: extra,
      tag: `order-${extra?.ordenId || id}`,
      vibrate: [200, 100, 200, 100, 250],
      requireInteraction: canalId === 'logifast_urgente',
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(titulo, webOptions);
        })
        .catch(() => {
          try {
            new Notification(titulo, webOptions);
          } catch {}
        });
    } else {
      try {
        new Notification(titulo, webOptions);
      } catch {}
    }
  }
}

/**
 * Actualiza la notificación de progreso en tiempo real para un envío o pedido activo
 */
export interface ProgresoEnvioNotifOpciones {
  ordenId: string;
  porcentaje: number; // 0 - 100
  etapaTexto: string;
  subtitulo: string;
  origen?: string;
  destino?: string;
  tiempoEstimadoMin?: number;
}

export async function notificarProgresoEnvio({
  ordenId,
  porcentaje,
  etapaTexto,
  subtitulo,
  origen,
  destino,
  tiempoEstimadoMin,
}: ProgresoEnvioNotifOpciones): Promise<void> {
  const hashId = Math.abs(
    ordenId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  ) % 100000;

  const etaStr = tiempoEstimadoMin ? ` • ~${tiempoEstimadoMin} min` : '';
  const titulo = `🛵 ${etapaTexto} (${porcentaje}%)${etaStr}`;
  const cuerpo = `${subtitulo}${origen && destino ? `\n📍 ${origen} ➔ ${destino}` : ''}`;

  await dispararNotificacionNativa({
    id: hashId,
    titulo,
    cuerpo,
    subtexto: `LOGIFAST Live Tracker • ${porcentaje}%`,
    detalleLargo: cuerpo,
    canalId: 'logifast_estado',
    colorIcono: '#FF5722',
    iconoPequeno: 'ic_stat_logifast',
    categoriaAcciones: 'ORDEN_ESTADO',
    tipoAlerta: porcentaje >= 100 ? 'exito' : 'mensaje',
    extra: { ordenId, porcentaje },
    mostrarBannerInApp: false, // El widget in-app ya se muestra en pantalla
  });
}
