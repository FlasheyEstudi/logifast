/* ═══════════════════════════════════════════════
   OSRM routing helper (client-side)
   Uses the public OSRM demo server (no API key).
   NOTE: OSRM URL coordinate order is lng,lat (NOT lat,lng).
   ═══════════════════════════════════════════════ */

export type PuntoRuta = { lat: number; lng: number };

export type ResultadoRuta = {
  /** Array of [lat, lng] pairs ready for react-leaflet Polyline */
  coordenadas: [number, number][];
  distanciaKm: number;
  duracionMin: number;
  exito: boolean;
  error?: string;
};

interface OSRMRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    type: string;
    /** GeoJSON coordinates are [lng, lat] pairs */
    coordinates: [number, number][];
  };
}

interface OSRMResponse {
  code: string;
  message?: string;
  routes?: OSRMRoute[];
}

const OSRM_TIMEOUT_MS = 6000;

/**
 * Fetch a driving route between two points from the public OSRM API.
 * Returns coordenadas as [lat, lng] pairs (converted from OSRM's [lng, lat]).
 */
export async function obtenerRuta(
  origen: PuntoRuta,
  destino: PuntoRuta
): Promise<ResultadoRuta> {
  // OSRM expects lng,lat order
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        coordenadas: [],
        distanciaKm: 0,
        duracionMin: 0,
        exito: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = (await res.json()) as OSRMResponse;

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return {
        coordenadas: [],
        distanciaKm: 0,
        duracionMin: 0,
        exito: false,
        error: data.message || data.code || 'Ruta no encontrada',
      };
    }

    const route = data.routes[0];
    const rawCoords = route.geometry?.coordinates ?? [];

    // Convert [lng, lat] → [lat, lng] for Leaflet
    const coordenadas: [number, number][] = rawCoords.map(
      (c) => [c[1], c[0]] as [number, number]
    );

    return {
      coordenadas,
      distanciaKm: route.distance / 1000,
      duracionMin: route.duration / 60,
      exito: true,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        coordenadas: [],
        distanciaKm: 0,
        duracionMin: 0,
        exito: false,
        error: 'Tiempo de espera agotado',
      };
    }

    const msg = err instanceof Error ? err.message : 'Error de red';
    return {
      coordenadas: [],
      distanciaKm: 0,
      duracionMin: 0,
      exito: false,
      error: msg,
    };
  }
}

/**
 * Fallback straight-line route (no road following).
 * Used when OSRM is unreachable or returns an error.
 */
export function rutaLineaRecta(
  origen: PuntoRuta,
  destino: PuntoRuta
): [number, number][] {
  return [
    [origen.lat, origen.lng],
    [destino.lat, destino.lng],
  ];
}
