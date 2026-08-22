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

export async function obtenerGpsNavegador(): Promise<{ lat: number; lng: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    // 1. Intentar primero con alta precisión (GPS por hardware)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // 2. Fallback inmediato con precisión estándar (WiFi / red móvil / IP)
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  });
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

    // Immediate single read for fast first paint
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
