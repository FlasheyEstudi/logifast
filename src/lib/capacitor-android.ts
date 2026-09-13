'use client';

/**
 * capacitor-android.ts
 * Integración nativa con Capacitor para Android.
 * Compatible tanto en Web como dentro de la WebView de Capacitor en Android.
 */

import { installCapacitorFetchBridge } from './api-config';
import { obtenerUbicacionActual } from './native-geolocation';

let lastBackPress = 0;
let backButtonListenerRegistered = false;

export interface AndroidBackHandlers {
  hasOpenModal?: () => boolean;
  closeActiveModal?: () => void;
  canGoBackNavigation?: () => boolean;
  goBackNavigation?: () => void;
}

export async function initCapacitorAndroid(handlers?: AndroidBackHandlers) {
  if (typeof window === 'undefined') return;

  // 0. Instalar interceptor de peticiones API para evitar errores 404 en Capacitor
  installCapacitorFetchBridge();

  const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;

  // 1. Ocultar SplashScreen nativo inmediatamente para dar paso al loader animado oficial
  try {
    const splash = (window as any).Capacitor?.Plugins?.SplashScreen;
    if (splash) {
      splash.hide({ fadeOutDuration: 150 }).catch(() => {});
    }
  } catch {}

  if (!isNative) return;

  // 2. Personalizar Status Bar (barra superior) y Navigation Bar (barra de gestos)
  try {
    const statusBar = (window as any).Capacitor?.Plugins?.StatusBar;
    if (statusBar) {
      await statusBar.setBackgroundColor({ color: '#0B0E14' });
      await statusBar.setStyle({ style: 'DARK' }); // iconos claros sobre fondo oscuro
    }
  } catch {}

  // 3. Crear Canales de Notificación Personalizados para Android 8+
  try {
    const push = (window as any).Capacitor?.Plugins?.PushNotifications;
    if (push?.createChannel) {
      // Canal para Tracking de Repartidor (Máxima prioridad, vibración de pulso, sonido)
      await push.createChannel({
        id: 'logifast_driver_tracking',
        name: 'LogiFast — Servicio en Ruta',
        description: 'Notificaciones en vivo del estado del viaje y navegación GPS activa',
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1, // VISIBILITY_PUBLIC
        sound: 'res_custom_notification',
        vibration: true,
        lights: true,
        lightColor: '#FF5722',
      }).catch(() => null);

      // Canal para Entregas de Clientes (Alerta sonora de entrega y código PIN)
      await push.createChannel({
        id: 'logifast_orders_live',
        name: 'LogiFast — Estado de tu Pedido',
        description: 'Alertas inmediatas cuando tu repartidor esté cerca y confirmación de PIN',
        importance: 5,
        visibility: 1,
        sound: 'res_bell',
        vibration: true,
        lights: true,
        lightColor: '#007AFF',
      }).catch(() => null);

      // Canal de Promociones y Billetera
      await push.createChannel({
        id: 'logifast_promociones',
        name: 'Promociones y Cupones',
        description: 'Descuentos exclusivos y beneficios en tu billetera LogiFast',
        importance: 3, // IMPORTANCE_DEFAULT
        visibility: 0,
        sound: undefined,
        vibration: false,
      }).catch(() => null);
    }
  } catch {}

  // 4. Gesto Atrás de Android (Hardware Back Button)
  if (!backButtonListenerRegistered) {
    try {
      const appPlugin = (window as any).Capacitor?.Plugins?.App;
      if (appPlugin?.addListener) {
        backButtonListenerRegistered = true;
        appPlugin.addListener('backButton', async (event: any) => {
          // A. Si hay un modal o sub-vista activa (carrito, tracking, foto, chat), cerrarlo primero
          if (handlers?.hasOpenModal?.()) {
            handlers.closeActiveModal?.();
            return;
          }

          // B. Si hay historial de navegación interna en la app, retroceder suavemente
          if (handlers?.canGoBackNavigation?.()) {
            handlers.goBackNavigation?.();
            return;
          }

          // C. Si el historial del navegador permite retroceder dentro de la app
          if (window.history.length > 1 && window.location.hash && window.location.hash !== '#/' && window.location.hash !== '') {
            window.history.back();
            return;
          }

          // D. Si está en la pantalla raíz: Doble toque para salir con Toast nativo
          const now = Date.now();
          if (now - lastBackPress < 2000) {
            await appPlugin.exitApp();
          } else {
            lastBackPress = now;
            try {
              const toastPlugin = (window as any).Capacitor?.Plugins?.Toast;
              if (toastPlugin?.show) {
                await toastPlugin.show({
                  text: 'Presiona atrás nuevamente para salir de LogiFast',
                  duration: 'short',
                  position: 'bottom',
                });
              } else {
                console.log('Presiona atrás nuevamente para salir de LogiFast');
              }
            } catch {
              console.log('Presiona atrás nuevamente para salir de LogiFast');
            }
          }
        });
      }
    } catch {}
  }

  // 5. Soporte y Polyfill de GPS Nativo Capacitor para Android
  try {
    const geoPlugin = (window as any).Capacitor?.Plugins?.Geolocation;
    if (typeof navigator !== 'undefined') {
      const originalGetCurrent = navigator.geolocation?.getCurrentPosition?.bind(navigator.geolocation);
      (navigator.geolocation as any).getCurrentPosition = async (
        successCallback: PositionCallback,
        errorCallback?: PositionErrorCallback | null,
        options?: PositionOptions
      ) => {
        try {
          const res = await obtenerUbicacionActual({
            enableHighAccuracy: options?.enableHighAccuracy ?? true,
            timeout: options?.timeout ?? 10000,
            maximumAge: options?.maximumAge ?? 300000,
          });

          if (res.ok && typeof res.lat === 'number' && typeof res.lng === 'number') {
            const syntheticPos: GeolocationPosition = {
              coords: {
                latitude: res.lat,
                longitude: res.lng,
                accuracy: res.accuracy ?? 15,
                altitude: null,
                altitudeAccuracy: null,
                heading: res.heading ?? null,
                speed: res.speed ?? null,
                toJSON: () => ({}),
              },
              timestamp: Date.now(),
              toJSON: () => ({}),
            };
            successCallback(syntheticPos);
            return;
          }

          throw new Error(res.error || 'No se pudo obtener la posición GPS.');
        } catch (err: any) {
          console.warn('[Capacitor GPS] Error obteniendo GPS:', err);
          if (originalGetCurrent && !isNative) {
            originalGetCurrent(successCallback, errorCallback, options);
          } else if (errorCallback) {
            errorCallback({
              code: 1,
              message: err?.message || 'Error obteniendo posición GPS',
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            });
          }
        }
      };

      // Polyfill de watchPosition nativo si está disponible
      if (geoPlugin?.watchPosition) {
        let watchCounter = 1;
        const activeWatches = new Map<number, string>();

        (navigator.geolocation as any).watchPosition = (
          successCallback: PositionCallback,
          errorCallback?: PositionErrorCallback | null,
          options?: PositionOptions
        ) => {
          const localId = watchCounter++;
          geoPlugin.watchPosition(
            {
              enableHighAccuracy: options?.enableHighAccuracy ?? true,
              timeout: options?.timeout ?? 10000,
              maximumAge: options?.maximumAge ?? 5000,
            },
            (pos: any, err: any) => {
              if (err) {
                if (errorCallback) {
                  errorCallback({
                    code: 2,
                    message: err?.message || 'Error en seguimiento GPS',
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3,
                  });
                }
              } else if (pos?.coords) {
                const syntheticPos: GeolocationPosition = {
                  coords: {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy ?? 15,
                    altitude: pos.coords.altitude ?? null,
                    altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
                    heading: pos.coords.heading ?? null,
                    speed: pos.coords.speed ?? null,
                    toJSON: () => ({}),
                  },
                  timestamp: pos.timestamp || Date.now(),
                  toJSON: () => ({}),
                };
                successCallback(syntheticPos);
              }
            }
          ).then((pluginWatchId: string) => {
            activeWatches.set(localId, pluginWatchId);
          }).catch(() => {});

          return localId;
        };

        (navigator.geolocation as any).clearWatch = (watchId: number) => {
          const pluginWatchId = activeWatches.get(watchId);
          if (pluginWatchId && geoPlugin.clearWatch) {
            geoPlugin.clearWatch({ id: pluginWatchId }).catch(() => {});
            activeWatches.delete(watchId);
          }
        };
      }
    }
  } catch (err) {
    console.warn('[Capacitor GPS] Error configurando bridge:', err);
  }
}
