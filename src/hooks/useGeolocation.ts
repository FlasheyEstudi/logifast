'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════
   useGeolocation — Real browser geolocation hook
   SSR-safe. Returns nulls on the server.
   ═══════════════════════════════════════════════ */

export type GeoState = {
  lat: number | null;
  lng: number | null;
  heading: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
};

export type UseGeolocationOptions = {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  watch?: boolean;
};

const DEFAULT_OPTIONS: Required<UseGeolocationOptions> = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 15000,
  watch: true,
};

const INITIAL_STATE: GeoState = {
  lat: null,
  lng: null,
  heading: null,
  accuracy: null,
  error: null,
  loading: false,
};

/* ─── Spanish error messages for GeolocationPositionError codes ─── */
function getErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case 1: // PERMISSION_DENIED
      return 'Permiso denegado. Habilita la ubicación en tu navegador.';
    case 2: // POSITION_UNAVAILABLE
      return 'Posición no disponible. Verifica tu señal GPS.';
    case 3: // TIMEOUT
      return 'Tiempo de espera agotado. Intenta nuevamente.';
    default:
      return err.message || 'Error de geolocalización';
  }
}

export { obtenerUbicacionActual, type UbicacionResult } from '@/lib/native-geolocation';
import { obtenerUbicacionActual } from '@/lib/native-geolocation';

export async function obtenerGpsNavegador(): Promise<{ lat: number; lng: number } | null> {
  const res = await obtenerUbicacionActual();
  if (res.ok && typeof res.lat === 'number' && typeof res.lng === 'number') {
    return { lat: res.lat, lng: res.lng };
  }
  return null;
}

export function useGeolocation(
  options: UseGeolocationOptions = {}
): GeoState & { start: () => void; stop: () => void } {
  const {
    enableHighAccuracy = DEFAULT_OPTIONS.enableHighAccuracy,
    maximumAge = DEFAULT_OPTIONS.maximumAge,
    timeout = DEFAULT_OPTIONS.timeout,
    watch = DEFAULT_OPTIONS.watch,
  } = options;

  const [state, setState] = useState<GeoState>(INITIAL_STATE);
  const watchIdRef = useRef<number | null>(null);

  // SSR-safe support detection
  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'geolocation' in navigator;

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      heading: pos.coords.heading,
      accuracy: pos.coords.accuracy,
      error: null,
      loading: false,
    });
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    // Fallback a baja precisión si falla la alta precisión por timeout
    if (enableHighAccuracy && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (fallbackErr) => {
          setState((s) => ({ ...s, error: getErrorMessage(fallbackErr), loading: false }));
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
      return;
    }
    setState((s) => ({ ...s, error: getErrorMessage(err), loading: false }));
  }, [enableHighAccuracy, onSuccess]);

  const start = useCallback(() => {
    if (!isSupported) {
      setState((s) => ({
        ...s,
        error: 'Geolocalización no soportada',
        loading: false,
      }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    const geoOpts: PositionOptions = {
      enableHighAccuracy,
      maximumAge,
      timeout,
    };

    // Immediate single read via unified GPS engine (Capacitor native hardware / browser)
    obtenerUbicacionActual({ enableHighAccuracy, timeout, maximumAge: 0 }).then((res) => {
      if (res.ok && typeof res.lat === 'number' && typeof res.lng === 'number') {
        setState({
          lat: res.lat,
          lng: res.lng,
          heading: res.heading ?? null,
          accuracy: res.accuracy ?? 15,
          error: null,
          loading: false,
        });
      }
    }).catch(() => null);

    // Browser geolocation single read
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOpts);

    // Continuous watch if enabled
    if (watch) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        geoOpts
      );
    }
  }, [
    isSupported,
    enableHighAccuracy,
    maximumAge,
    timeout,
    watch,
    onSuccess,
    onError,
  ]);

  const stop = useCallback(() => {
    if (isSupported && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [isSupported]);

  // Auto-start on mount if watch is enabled
  useEffect(() => {
    if (watch) {
      start();
    }
    return () => {
      if (isSupported && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [watch, start, isSupported]);

  return { ...state, start, stop };
}
