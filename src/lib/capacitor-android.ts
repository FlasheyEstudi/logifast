'use client';

/**
 * capacitor-android.ts
 * Integración nativa con Capacitor para Android.
 * Compatible tanto en Web como dentro de la WebView de Capacitor en Android.
 */

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

  const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;

  // 1. Ocultar SplashScreen suavemente cuando el DOM y la UI están listos (elimina destello blanco)
  try {
    const splash = (window as any).Capacitor?.Plugins?.SplashScreen;
    if (splash) {
      setTimeout(async () => {
        try {
          await splash.hide({ fadeOutDuration: 400 });
        } catch {}
      }, 250);
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
}
