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
    setState((s) => ({ ...s, error: getErrorMessage(err), loading: false }));
  }, []);

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

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (isSupported && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isSupported]);

  return { ...state, start, stop };
}
