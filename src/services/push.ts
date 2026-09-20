'use client';

/**
 * PUSH REAL — registro del dispositivo y enrutado del toque.
 *
 * Estado real del proyecto cuando se escribió esto:
 *  - `@capacitor/push-notifications` YA está instalado en las apps Android.
 *  - `native-notifications.ts` usa `LocalNotifications`, que solo suena con la app
 *    abierta o en segundo plano: NO crea una notificación con la app cerrada.
 *  - `PushNotifications.register()` nunca se llamaba, así que no existía token y el
 *    backend no tenía a dónde enviar nada.
 *
 * Lo que hace este módulo:
 *  1. Registra el dispositivo y captura el token FCM del sistema.
 *  2. Lo envía a `/api/device-token` para guardarlo ligado al usuario.
 *  3. Escucha los push recibidos y los reenvía al mismo flujo in-app que ya existe
 *     (snackbar + háptica), con deduplicación por `ordenId + estado`.
 *  4. Al tocar la notificación emite `logifast:abrir` para abrir el tracking exacto.
 *
 * IMPORTANTE: para que los puntos 1-4 funcionen en un teléfono real hace falta el
 * `google-services.json` de Firebase y la clave del servidor (FCM). Sin esa
 * credencial el resto del flujo (app abierta) sigue funcionando igual que antes.
 * Ver `docs/PUSH_SETUP.md`.
 */

import { onRealtimeEvent } from '@/services/realtime';

export interface PushDatos {
  ordenId?: string;
  estado?: string;
  tipo?: string;
  titulo?: string;
  cuerpo?: string;
  vista?: 'tracking' | 'chat' | 'servicio' | 'pedidos';
}

/** Deduplicación: mismo pedido + mismo estado no debe notificar dos veces. */
const yaNotificado = new Map<string, number>();
const VENTANA_DEDUPE_MS = 10 * 60 * 1000;

function claveDe(d: PushDatos): string {
  return `${d.ordenId || 'sin-orden'}::${d.estado || d.tipo || 'general'}`;
}

export function yaSeNotifico(d: PushDatos): boolean {
  const clave = claveDe(d);
  const visto = yaNotificado.get(clave);
  const ahora = Date.now();
  if (visto && ahora - visto < VENTANA_DEDUPE_MS) return true;
  yaNotificado.set(clave, ahora);
  if (yaNotificado.size > 300) {
    for (const [k, t] of yaNotificado) if (ahora - t > VENTANA_DEDUPE_MS) yaNotificado.delete(k);
  }
  return false;
}

/** Extrae el payload útil de un push (FCM lo manda en `data` o en `notification`). */
function datosDelPush(push: unknown): PushDatos {
  const n = push as { data?: Record<string, unknown>; notification?: Record<string, unknown>; title?: string; body?: string };
  const data = n?.data || {};
  const notif = n?.notification || {};
  const leer = (k: string) => {
    const v = data[k] ?? notif[k];
    return typeof v === 'string' ? v : undefined;
  };
  return {
    ordenId: leer('ordenId') || leer('entidadId'),
    estado: leer('estado'),
    tipo: leer('tipo'),
    titulo: leer('titulo') || leer('title') || n?.title,
    cuerpo: leer('cuerpo') || leer('contenido') || leer('body') || n?.body,
    vista: leer('vista') as PushDatos['vista'],
  };
}

/** Abre la pantalla correspondiente al tocar la notificación. */
function abrirDesdeNotificacion(datos: PushDatos): void {
  if (typeof window === 'undefined') return;
  const vista = datos.vista || (datos.tipo === 'chat' ? 'chat' : datos.ordenId ? 'tracking' : 'pedidos');
  try {
    window.dispatchEvent(
      new CustomEvent('logifast:abrir', {
        detail: { vista, ordenId: datos.ordenId, estado: datos.estado },
      })
    );
  } catch {
    /* entorno sin CustomEvent */
  }
}

interface PluginPush {
  requestPermissions?: () => Promise<{ receive?: string }>;
  register?: () => Promise<void>;
  addListener?: (evento: string, cb: (data: unknown) => void) => void;
  createChannel?: (canal: Record<string, unknown>) => Promise<void>;
}

function getPushPlugin(): PluginPush | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Capacitor?: { Plugins?: { PushNotifications?: PluginPush } } }).Capacitor?.Plugins
    ?.PushNotifications || null;
}

/**
 * ¿El proyecto tiene Firebase configurado en este build de Android?
 *
 * `PushNotifications.register()` llama a `FirebaseMessaging.getInstance()`, que
 * LANZA `IllegalStateException: Default FirebaseApp is not initialized` si no hay
 * `google-services.json`. Esa excepción cruza el puente nativo y CIERRA la app.
 *
 * Por eso el registro solo se intenta cuando existe una pista real de que Firebase
 * está configurado. Sin ella, el resto del sistema sigue igual: Socket.IO en primer
 * plano y notificaciones locales de Capacitor.
 *
 * Poner el proyecto en `true` es lo único que hace falta cuando llegue
 * `google-services.json` (ver docs/PUSH_SETUP.md). También se puede forzar por
 * entorno con NEXT_PUBLIC_PUSH_HABILITADO=true.
 */
const FIREBASE_CONFIGURADO = false;

function pushDisponible(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PUSH_HABILITADO === 'true') return true;
  return FIREBASE_CONFIGURADO;
}

let registrado = false;

/**
 * Registra el dispositivo para push. Devuelve el token si el sistema lo entrega,
 * o null cuando no hay plugin nativo (navegador) o falta la configuración de FCM.
 */
export async function registrarPush(motivo: 'arranque' | 'manual' = 'arranque'): Promise<string | null> {
  // Sin Firebase configurado NO se toca el plugin: `register()` abortaría el proceso.
  if (!pushDisponible()) {
    return null;
  }

  const plugin = getPushPlugin();
  if (!plugin?.register) return null;
  if (registrado && motivo === 'arranque') return null;

  try {
    // 1. Permiso del sistema (Android 13+ lo pide explícitamente).
    const perm = await plugin.requestPermissions?.();
    if (perm && perm.receive !== 'granted') return null;

    // 2. Canal dedicado a pedidos: sonido y prioridad alta, como el de las apps de delivery.
    if (plugin.createChannel) {
      await plugin.createChannel({
        id: 'logifast_pedidos',
        name: 'Estado de tus pedidos',
        description: 'Cambios en el estado de tus envíos y compras',
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#007AFF',
      }).catch(() => null);
    }

    let tokenCapturado: string | null = null;

    // 3. El token llega por evento, no como valor de retorno del plugin.
    plugin.addListener?.('registration', async (data: unknown) => {
      const token = (data as { value?: string })?.value;
      if (!token) return;
      tokenCapturado = token;
      await guardarToken(token, 'android');
    });

    plugin.addListener?.('registrationError', (err: unknown) => {
      console.warn('[push] no se pudo registrar el dispositivo:', (err as { error?: string })?.error || err);
    });

    // 4. Push recibido con la app ABIERTA: se muestra dentro de la app.
    plugin.addListener?.('pushNotificationReceived', (push: unknown) => {
      const datos = datosDelPush(push);
      if (yaSeNotifico(datos)) return;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('logifast:push-recibido', { detail: datos }));
      }
    });

    // 5. Toque en la notificación (app abierta, en segundo plano o recién lanzada).
    plugin.addListener?.('pushNotificationActionPerformed', (accion: unknown) => {
      const datos = datosDelPush(accion);
      abrirDesdeNotificacion(datos);
    });

    await plugin.register();
    registrado = true;

    // Devuelve el token si llegó rápido (útil para diagnóstico).
    await new Promise((r) => setTimeout(r, 1200));
    return tokenCapturado;
  } catch (err) {
    console.warn('[push] registro fallido:', err);
    return null;
  }
}

/** Guarda el token en el backend, ligado a la sesión del usuario. */
async function guardarToken(token: string, plataforma: string): Promise<void> {
  try {
    await fetch('/api/device-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, plataforma }),
    });
  } catch {
    // Si falla, se reintenta en el próximo arranque: el token del sistema no cambia.
  }
}

let iniciado = false;

/**
 * Punto de entrada único. Se llama desde el shell del cliente.
 * Une Socket.IO (primer plano) con push (segundo plano): NO se reemplaza uno con otro.
 */
export async function iniciarPush(): Promise<void> {
  if (typeof window === 'undefined' || iniciado) return;
  iniciado = true;

  // Con la app cerrada el socket no existe: el push es la única vía.
  await registrarPush('arranque');

  // Con la app abierta, el socket manda: el backend emite el cambio de estado y aquí
  // se convierte en el mismo aviso in-app que ya existía (sin duplicar con el push).
  onRealtimeEvent('orden:estado:update', (data: { id?: string; ordenId?: string; estado?: string; titulo?: string }) => {
    const ordenId = data?.ordenId || data?.id;
    if (!ordenId || !data?.estado) return;
    // El backend ya emite por socket; si además llegó un push del mismo estado, no
    // se vuelve a avisar. La ventana es compartida a propósito.
    if (yaSeNotifico({ ordenId, estado: data.estado })) return;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('logifast:estado-remoto', { detail: { ...data, ordenId } }));
    }
  });

  // Al volver del segundo plano, se resincroniza con el backend (fuente de verdad):
  // mientras la app estuvo cerrada, los push cuentan la historia, pero el estado
  // autoritativo se vuelve a pedir al servidor al reabrir.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      try {
        window.dispatchEvent(new CustomEvent('logifast:resync'));
      } catch {
        /* entorno sin CustomEvent */
      }
    });
  }
}
