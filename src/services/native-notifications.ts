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
export function reproducirAlertaSonora(
  tipo: 'orden' | 'exito' | 'mensaje' | 'alerta' | 'timbre_puerta' = 'orden'
): void {
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
    } else if (tipo === 'timbre_puerta') {
      // Clásico timbre de puerta de dos notas (Ding-Dong: Mi5 659.25Hz -> Do5 523.25Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // Ding (E5)
      osc.frequency.setValueAtTime(523.25, now + 0.26); // Dong (C5)
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.start(now);
      osc.stop(now + 0.85);
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
  tipoAlerta?: 'orden' | 'exito' | 'mensaje' | 'alerta' | 'timbre_puerta';
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
  } else if (tipoAlerta === 'timbre_puerta') {
    HAPTIC_PATTERNS.llegadaPuerta();
  } else {
    HAPTIC_PATTERNS.mensaje();
  }

  // 2. Banner flotante enriquecido in-app si el usuario está con la app abierta
  if (mostrarBannerInApp) {
    try {
      if (tipoAlerta === 'exito') {
        sileo.success({ title: titulo, description: cuerpo });
      } else if (tipoAlerta === 'timbre_puerta') {
        sileo.warning({ title: titulo, description: cuerpo });
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

/**
 * 1. "Repartidor en la Puerta / Ha llegado"
 * Alerta sonora tipo timbre y vibración háptica de alta prioridad cuando el repartidor esté a <50 metros
 */
export interface RepartidorEnPuertaOpciones {
  ordenId: string;
  pin?: string;
  repartidorNombre?: string;
  direccion?: string;
}

export async function notificarRepartidorEnPuerta({
  ordenId,
  pin,
  repartidorNombre,
  direccion,
}: RepartidorEnPuertaOpciones): Promise<void> {
  const nombre = repartidorNombre || 'Tu repartidor';
  const pinMsg = pin ? `\n🔑 PIN de Entrega: ${pin}` : '';
  const titulo = '🚪 ¡Tu repartidor está en la puerta!';
  const cuerpo = `${nombre} ha llegado a tu destino.${pin ? ` Ten listo tu PIN: #${pin}` : ' Por favor sal a recibirlo.'}`;
  const detalleLargo = `${nombre} está afuera en ${direccion || 'tu ubicación'}.${pinMsg}\nMuestra o dicta el PIN al repartidor para recibir tu paquete.`;

  await dispararNotificacionNativa({
    id: 990000 + (Math.abs(ordenId.split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)) % 9999),
    titulo,
    cuerpo,
    subtexto: 'LOGIFAST • Repartidor en la Puerta (<50m)',
    detalleLargo,
    canalId: 'logifast_urgente',
    colorIcono: '#FF9500',
    iconoPequeno: 'ic_stat_logifast',
    categoriaAcciones: 'ORDEN_ESTADO',
    tipoAlerta: 'timbre_puerta',
    extra: { ordenId, evento: 'REPARTIDOR_EN_PUERTA', pin },
    mostrarBannerInApp: true,
  });
}

/**
 * 3. "Alerta de Clima / Demora Inusual"
 * Aviso predictivo si hay lluvia o congestión vehicular que aumente el tiempo estimado
 */
export interface DemoraClimaOTraficoOpciones {
  ordenId: string;
  minutosDemora?: number;
  motivo?: 'lluvia' | 'trafico' | 'lluvia_trafico';
}

export async function notificarDemoraClimaOTrafico({
  ordenId,
  minutosDemora = 12,
  motivo = 'lluvia_trafico',
}: DemoraClimaOTraficoOpciones): Promise<void> {
  const motivoTexto =
    motivo === 'lluvia'
      ? 'fuertes lluvias en el trayecto'
      : motivo === 'trafico'
      ? 'congestión vehicular en la ruta'
      : 'lluvia y alto tráfico en la zona';

  const titulo = '🌧️ Alerta de Clima y Tráfico • Demora estimada';
  const cuerpo = `Debido a ${motivoTexto}, tu orden #${ordenId.slice(-8)} podría demorar unos ~${minutosDemora} min adicionales. Priorizamos la seguridad de tu repartidor.`;

  await dispararNotificacionNativa({
    id: 980000 + (Math.abs(ordenId.split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)) % 9999),
    titulo,
    cuerpo,
    subtexto: 'LOGIFAST • Alerta Predictiva de Ruta',
    detalleLargo: cuerpo,
    canalId: 'logifast_estado',
    colorIcono: '#007AFF',
    iconoPequeno: 'ic_stat_logifast',
    categoriaAcciones: 'ORDEN_ESTADO',
    tipoAlerta: 'alerta',
    extra: { ordenId, evento: 'DEMORA_CLIMA', minutosDemora },
    mostrarBannerInApp: true,
  });
}

/**
 * 4. "Pedido Listo para Retiro"
 * Para comercios y restaurantes en recolección cuando finalizan la preparación
 */
export interface PedidoListoRetiroOpciones {
  ordenId: string;
  tiendaNombre?: string;
  esPickUpCliente?: boolean;
}

export async function notificarPedidoListoParaRetiro({
  ordenId,
  tiendaNombre = 'El comercio',
  esPickUpCliente = false,
}: PedidoListoRetiroOpciones): Promise<void> {
  const titulo = esPickUpCliente
    ? '🛍️ ¡Tu pedido está listo para retirar!'
    : '🛍️ Pedido preparado y listo para retiro';

  const cuerpo = esPickUpCliente
    ? `${tiendaNombre} ha finalizado tu orden #${ordenId.slice(-8)}. ¡Ya puedes pasar a recogerla!`
    : `${tiendaNombre} terminó de empaquetar tu orden #${ordenId.slice(-8)}. El repartidor está recolectándola para llevártela.`;

  await dispararNotificacionNativa({
    id: 970000 + (Math.abs(ordenId.split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)) % 9999),
    titulo,
    cuerpo,
    subtexto: `LOGIFAST • ${esPickUpCliente ? 'Retiro en Tienda' : 'En Preparación'}`,
    detalleLargo: cuerpo,
    canalId: 'logifast_urgente',
    colorIcono: '#00C853',
    iconoPequeno: 'ic_stat_logifast',
    categoriaAcciones: 'ORDEN_ESTADO',
    tipoAlerta: 'orden',
    extra: { ordenId, evento: 'PEDIDO_LISTO', tiendaNombre },
    mostrarBannerInApp: true,
  });
}

/**
 * 5. "Resumen de Ahorro y Fidelización"
 * Notificación post-entrega acreditando puntos o cashback a la Billetera LogiFast
 */
export interface ResumenFidelizacionOpciones {
  ordenId: string;
  montoTotal?: number;
  puntosGanados?: number;
  cashbackCordobas?: number;
}

export async function notificarResumenFidelizacion({
  ordenId,
  montoTotal = 150,
  puntosGanados = 20,
  cashbackCordobas,
}: ResumenFidelizacionOpciones): Promise<void> {
  const resolvedCashback = cashbackCordobas ?? Math.max(1, Math.round(puntosGanados / 5));
  const titulo = `🎁 ¡Has ganado +${puntosGanados} LogiPuntos!`;
  const cuerpo = `Por completar tu orden #${ordenId.slice(-8)} (C$ ${montoTotal.toFixed(2)}), acreditamos ${puntosGanados} puntos (~C$ ${resolvedCashback}) a tu Billetera LogiFast.`;

  await dispararNotificacionNativa({
    id: 960000 + (Math.abs(ordenId.split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0)) % 9999),
    titulo,
    cuerpo,
    subtexto: 'LOGIFAST • Billetera y Fidelización',
    detalleLargo: `${cuerpo}\nCanjea tus puntos por cupones de descuento y envíos gratis en la app.`,
    canalId: 'logifast_estado',
    colorIcono: '#10B981',
    iconoPequeno: 'ic_stat_logifast',
    categoriaAcciones: 'ORDEN_ESTADO',
    tipoAlerta: 'exito',
    extra: { ordenId, evento: 'PUNTOS_FIDELIZACION', puntosGanados, resolvedCashback },
    mostrarBannerInApp: true,
  });
}

