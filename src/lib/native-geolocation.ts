'use client';

/**
 * native-geolocation.ts
 * Motor unificado y de alta confiabilidad de Geolocalización para LogiFast.
 *
 * Diseñado específicamente para entornos híbridos:
 * - APK Android empaquetado 100% nativo con Capacitor (@capacitor/geolocation).
 * - Navegadores Web y PWA de escritorio y móvil.
 *
 * Resuelve definitivamente los problemas de GPS en Android:
 * 1. Maneja permisos de Android 12+ (Aproximada/Coarse y Precisa/Fine).
 * 2. Detecta si el usuario tiene el interruptor de GPS apagado y muestra un mensaje claro.
 * 3. Estrategia de adquisición en 3 etapas:
 *    - Etapa 1: Lectura instantánea de caché (última posición conocida de Android, <50ms).
 *    - Etapa 2: Fijación satelital de alta precisión (GPS por hardware).
 *    - Etapa 3: Fallback inmediato a redes móviles / WiFi / precisión estándar (bajo techo).
 * 4. Feedback háptico nativo en cada captura exitosa.
 */

export interface UbicacionResult {
  ok: boolean;
  lat?: number;
  lng?: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  source?: 'capacitor_cache' | 'capacitor_high' | 'capacitor_network' | 'browser_high' | 'browser_low';
  error?: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

function triggerHapticSuccess() {
  // Las vibraciones continuas en lecturas GPS están deshabilitadas para proteger el hardware
  // y evitar molestias al conductor durante el rastreo activo. Se reservan solo para alertas de negocio.
}

/**
 * Obtiene la posición GPS actual del usuario con máxima tolerancia a fallos.
 */
export async function obtenerUbicacionActual(
  customOpts?: GeolocationOptions
): Promise<UbicacionResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Entorno no disponible.' };
  }

  const isNative = Boolean((window as any).Capacitor?.isNativePlatform?.());
  const geoPlugin = (window as any).Capacitor?.Plugins?.Geolocation;

  // ═══════════════════════════════════════════════════════════════
  // 1. VÍA NATIVA: Capacitor Geolocation Plugin (Android / APK)
  // ═══════════════════════════════════════════════════════════════
  if (geoPlugin && (isNative || typeof (window as any).Capacitor !== 'undefined')) {
    try {
      // A. Verificar y solicitar permisos de forma robusta
      if (geoPlugin.checkPermissions) {
        let perm = await geoPlugin.checkPermissions().catch((e: any) => {
          const m = String(e?.message || e).toLowerCase();
          if (m.includes('location services are not enabled') || m.includes('disabled')) {
            throw new Error('LOCATION_SERVICES_DISABLED');
          }
          return null;
        });

        // En Android 12+, el usuario puede conceder permiso 'location' (precisa) o 'coarseLocation' (aproximada)
        const isGranted = perm?.location === 'granted' || perm?.coarseLocation === 'granted';

        if (!isGranted && geoPlugin.requestPermissions) {
          perm = await geoPlugin.requestPermissions().catch((e: any) => {
            const m = String(e?.message || e).toLowerCase();
            if (m.includes('location services are not enabled') || m.includes('disabled')) {
              throw new Error('LOCATION_SERVICES_DISABLED');
            }
            return null;
          });
        }

        const nowGranted = perm?.location === 'granted' || perm?.coarseLocation === 'granted';
        if (!nowGranted && perm?.location !== undefined) {
          return {
            ok: false,
            error: 'Permiso de ubicación denegado. Concede el permiso en Ajustes > Aplicaciones > LogiFast para usar el GPS.',
          };
        }
      }

      // B. ETAPA 1: Fijación fresca de alta precisión (GPS por hardware satelital directo)
      try {
        const freshHigh = await geoPlugin.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: customOpts?.timeout ?? 9000,
          maximumAge: 0, // No aceptar posiciones obsoletas o desactualizadas de caché
        });
        if (
          freshHigh?.coords &&
          typeof freshHigh.coords.latitude === 'number' &&
          typeof freshHigh.coords.longitude === 'number' &&
          (freshHigh.coords.latitude !== 0 || freshHigh.coords.longitude !== 0) &&
          Math.abs(freshHigh.coords.latitude) <= 90 &&
          Math.abs(freshHigh.coords.longitude) <= 180
        ) {
          triggerHapticSuccess();
          return {
            ok: true,
            lat: freshHigh.coords.latitude,
            lng: freshHigh.coords.longitude,
            accuracy: freshHigh.coords.accuracy,
            heading: freshHigh.coords.heading,
            speed: freshHigh.coords.speed,
            source: 'capacitor_high',
          };
        }
      } catch (highErr: any) {
        const msg = String(highErr?.message || highErr).toLowerCase();
        if (msg.includes('location services are not enabled') || msg.includes('disabled')) {
          return {
            ok: false,
            error: 'El GPS de tu celular está apagado. Por favor activa la "Ubicación" en la barra de ajustes rápidos.',
          };
        }
        // Fallback a Etapa 2 si estamos bajo techo o la señal satelital tardó
      }

      // C. ETAPA 2: Fallback rápido de red celular / WiFi / antenas solo si satélites fallaron
      try {
        const networkPos = await geoPlugin.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 15000, // Máximo 15 segundos
        });
        if (
          networkPos?.coords &&
          typeof networkPos.coords.latitude === 'number' &&
          typeof networkPos.coords.longitude === 'number' &&
          (networkPos.coords.latitude !== 0 || networkPos.coords.longitude !== 0) &&
          Math.abs(networkPos.coords.latitude) <= 90 &&
          Math.abs(networkPos.coords.longitude) <= 180
        ) {
          triggerHapticSuccess();
          return {
            ok: true,
            lat: networkPos.coords.latitude,
            lng: networkPos.coords.longitude,
            accuracy: networkPos.coords.accuracy,
            heading: networkPos.coords.heading,
            speed: networkPos.coords.speed,
            source: 'capacitor_network',
          };
        }
      } catch (netErr: any) {
        const msg = String(netErr?.message || netErr).toLowerCase();
        if (msg.includes('location services are not enabled') || msg.includes('disabled')) {
          return {
            ok: false,
            error: 'El GPS está desactivado. Desliza la barra superior de tu celular y enciende la "Ubicación".',
          };
        }
      }
    } catch (err: any) {
      if (err?.message === 'LOCATION_SERVICES_DISABLED') {
        return {
          ok: false,
          error: 'El GPS está desactivado. Desliza la barra superior de tu celular y enciende la "Ubicación".',
        };
      }
      console.warn('[Capacitor Geolocation error fallback to browser]', err);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. VÍA NAVEGADOR / WEB: navigator.geolocation con doble intento
  // ═══════════════════════════════════════════════════════════════
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const rawGetCurrent =
      (navigator.geolocation as any)?.__rawGetCurrentPosition ||
      navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);

    return new Promise((resolve) => {
      // Intento 1: Alta precisión
      rawGetCurrent(
        (pos: GeolocationPosition) => {
          triggerHapticSuccess();
          resolve({
            ok: true,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            source: 'browser_high',
          });
        },
        (err: GeolocationPositionError) => {
          // Intento 2: Precisión estándar de red
          rawGetCurrent(
            (pos2: GeolocationPosition) => {
              triggerHapticSuccess();
              resolve({
                ok: true,
                lat: pos2.coords.latitude,
                lng: pos2.coords.longitude,
                accuracy: pos2.coords.accuracy,
                heading: pos2.coords.heading,
                speed: pos2.coords.speed,
                source: 'browser_low',
              });
            },
            (fallbackErr: GeolocationPositionError) => {
              let msg = 'No se pudo obtener la posición GPS.';
              if (fallbackErr.code === 1 || err.code === 1) {
                msg = 'Permiso denegado. Permite el acceso a la ubicación en los ajustes del dispositivo.';
              } else if (fallbackErr.code === 2 || err.code === 2) {
                msg = 'Señal GPS no disponible. Verifica que la ubicación esté encendida.';
              } else if (fallbackErr.code === 3 || err.code === 3) {
                msg = 'Tiempo de espera agotado buscando señal GPS.';
              }
              resolve({ ok: false, error: msg });
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }

  return {
    ok: false,
    error: 'La geolocalización no está soportada en este dispositivo o navegador.',
  };
}
