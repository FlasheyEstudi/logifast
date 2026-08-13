/* ═══════════════════════════════════════════════
   OSRM routing helper (client-side)
   Uses the public OSRM demo server (no API key).
   NOTE: OSRM URL coordinate order is lng,lat (NOT lat,lng).
   ═══════════════════════════════════════════════ */

export type PuntoRuta = { lat: number; lng: number };

export type PasoRuta = {
  instruccion: string;
  distanciaMetros: number;
  duracionSegundos: number;
  tipo: string;
  modificador?: string;
};

export type ResultadoRuta = {
  /** Array of [lat, lng] pairs ready for MapLibre / Leaflet */
  coordenadas: [number, number][];
  distanciaKm: number;
  duracionMin: number;
  pasos?: PasoRuta[];
  exito: boolean;
  error?: string;
};

interface OSRMManeuver {
  type: string;
  modifier?: string;
  instruction?: string;
}

interface OSRMStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: OSRMManeuver;
}

interface OSRMLeg {
  steps?: OSRMStep[];
}

interface OSRMRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    type: string;
    /** GeoJSON coordinates are [lng, lat] pairs */
    coordinates: [number, number][];
  };
  legs?: OSRMLeg[];
}

interface OSRMResponse {
  code: string;
  message?: string;
  routes?: OSRMRoute[];
}

const OSRM_TIMEOUT_MS = 6000;
const rutaCache = new Map<string, { res: ResultadoRuta; exp: number }>();

/**
 * Fetch a driving route between two points from the public OSRM API.
 * Returns coordenadas as [lat, lng] pairs (converted from OSRM's [lng, lat]).
 */
export async function obtenerRuta(
  origen: PuntoRuta,
  destino: PuntoRuta
): Promise<ResultadoRuta> {
  if (
    !origen ||
    !destino ||
    (origen.lat === 0 && origen.lng === 0) ||
    (destino.lat === 0 && destino.lng === 0) ||
    (origen.lat === destino.lat && origen.lng === destino.lng)
  ) {
    return {
      coordenadas: [
        [origen?.lat || 12.1264, origen?.lng || -86.2652],
        [destino?.lat || 12.1402, destino?.lng || -86.2954],
      ],
      distanciaKm: 0,
      duracionMin: 0,
      exito: false,
    };
  }

  const cacheKey = `${origen.lat.toFixed(4)},${origen.lng.toFixed(4)}->${destino.lat.toFixed(4)},${destino.lng.toFixed(4)}`;
  const now = Date.now();
  const cached = rutaCache.get(cacheKey);
  if (cached && cached.exp > now) {
    return cached.res;
  }

  // OSRM expects lng,lat order with steps enabled
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson&steps=true`;

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
        coordenadas: rutaLineaRecta(origen, destino),
        distanciaKm: 0,
        duracionMin: 0,
        exito: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = (await res.json()) as OSRMResponse;

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return {
        coordenadas: rutaLineaRecta(origen, destino),
        distanciaKm: 0,
        duracionMin: 0,
        exito: false,
        error: data.message || data.code || 'Ruta no encontrada',
      };
    }

    const route = data.routes[0];
    const rawCoords = route.geometry?.coordinates ?? [];

    // Convert [lng, lat] → [lat, lng]
    const coordenadas: [number, number][] = rawCoords.map(
      (c) => [c[1], c[0]] as [number, number]
    );

    // Extract navigation steps
    const rawSteps = route.legs?.[0]?.steps ?? [];
    const pasos: PasoRuta[] = rawSteps.map((s) => ({
      instruccion: s.name ? `Continúa por ${s.name}` : (s.maneuver.type === 'arrive' ? 'Llegada al destino' : 'Sigue la ruta'),
      distanciaMetros: Math.round(s.distance),
      duracionSegundos: Math.round(s.duration),
      tipo: s.maneuver.type || 'turn',
      modificador: s.maneuver.modifier,
    }));

    const resultado: ResultadoRuta = {
      coordenadas,
      distanciaKm: Math.round((route.distance / 1000) * 10) / 10,
      duracionMin: Math.max(1, Math.round(route.duration / 60)),
      pasos: pasos.length > 0 ? pasos : undefined,
      exito: true,
    };

    // Cache valid route for 3 minutes
    rutaCache.set(cacheKey, { res: resultado, exp: now + 180000 });

    return resultado;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        coordenadas: rutaLineaRecta(origen, destino),
        distanciaKm: 0,
        duracionMin: 0,
        exito: false,
        error: 'Tiempo de espera agotado',
      };
    }

    const msg = err instanceof Error ? err.message : 'Error de red';
    return {
      coordenadas: rutaLineaRecta(origen, destino),
      distanciaKm: 0,
      duracionMin: 0,
      exito: false,
      error: msg,
    };
  }
}

/**
 * Fetch a multi-stop driving route for multiple waypoints (repartidor -> parada 1 -> parada 2 -> parada 3)
 */
export async function obtenerRutaMultiples(
  puntos: PuntoRuta[]
): Promise<ResultadoRuta> {
  if (!puntos || puntos.length < 2) {
    return { coordenadas: [], distanciaKm: 0, duracionMin: 0, exito: false };
  }

  const validPuntos = puntos.filter((p) => p && p.lat !== 0 && p.lng !== 0);
  if (validPuntos.length < 2) {
    return { coordenadas: [], distanciaKm: 0, duracionMin: 0, exito: false };
  }

  const coordsStr = validPuntos.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { coordenadas: [], distanciaKm: 0, duracionMin: 0, exito: false };
    }

    const data = (await res.json()) as OSRMResponse;
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return { coordenadas: [], distanciaKm: 0, duracionMin: 0, exito: false };
    }

    const primaryRoute = data.routes[0];
    const rawCoords = primaryRoute.geometry?.coordinates ?? [];
    const coordenadas: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

    return {
      coordenadas,
      distanciaKm: Math.round((primaryRoute.distance / 1000) * 10) / 10,
      duracionMin: Math.round(primaryRoute.duration / 60),
      exito: true,
    };
  } catch {
    clearTimeout(timeoutId);
    return { coordenadas: [], distanciaKm: 0, duracionMin: 0, exito: false };
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

/**
 * Resolves Managua addresses to latitude & longitude coordinates.
 */
export function geocodeAddress(
  address: string,
  fallback: [number, number] = [12.1365, -86.2514]
): [number, number] {
  if (!address || typeof address !== 'string') return fallback;
  const q = address.toLowerCase();

  if (q.includes('robles') || q.includes('metrocentro')) return [12.1264, -86.2652];
  if (q.includes('altamira') || q.includes('fontana')) return [12.1158, -86.2589];
  if (q.includes('bello horizonte')) return [12.1415, -86.2301];
  if (q.includes('bolonia') || q.includes('plaza inter')) return [12.1432, -86.2758];
  if (q.includes('linda vista')) return [12.1489, -86.3021];
  if (q.includes('multicentro') || q.includes('americas')) return [12.1384, -86.2189];
  if (q.includes('monseñor') || q.includes('batahola') || q.includes('lezcano')) return [12.1402, -86.2954];
  if (q.includes('colinas') || q.includes('masaya')) return [12.0850, -86.2250];
  if (q.includes('santo domingo') || q.includes('galerias')) return [12.0970, -86.2420];
  if (q.includes('oriental') || q.includes('mercado')) return [12.1410, -86.2520];
  if (q.includes('central') || q.includes('managua')) return [12.1365, -86.2514];

  let hash = 0;
  for (let i = 0; i < address.length; i++) hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  const latOffset = ((hash % 100) - 50) * 0.0006;
  const lngOffset = (((hash >> 3) % 100) - 50) * 0.0006;

  return [fallback[0] + latOffset, fallback[1] + lngOffset];
}

/**
 * Dynamic OpenStreetMap / Nominatim Geocoding API for Nicaragua.
 * Searches real departments, cities, and neighborhoods dynamically from map service.
 */
export async function buscarUbicacionDinamica(query: string): Promise<Array<{ display_name: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 2) return [];
  const encodedQuery = encodeURIComponent(`${query.trim()}, Nicaragua`);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=6&countrycodes=ni`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'es-NI,es;q=0.9',
        'User-Agent': 'LogifastApp/1.0',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

/**
 * Reverse Geocoding using OpenStreetMap Nominatim for Nicaragua.
 * Converts lat & lng coordinates into a clean human-readable address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!lat || !lng || (lat === 0 && lng === 0)) return 'Ubicación seleccionada';

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'es-NI,es;q=0.9',
        'User-Agent': 'LogifastApp/1.0',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const main = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || addr.building || addr.city_district || addr.city || addr.town || addr.county || 'Nicaragua';
        const sub = addr.suburb || addr.city || addr.state || 'Managua';
        
        if (main && sub && main !== sub) {
          return `${main}, ${sub}`;
        }
        return main;
      }
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const p1 = parts[0]?.trim() || '';
        const p2 = parts[1]?.trim() || '';
        return p1 && p2 ? `${p1}, ${p2}` : p1 || `Punto GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
    }
  } catch (err) {
    console.warn('[reverseGeocode error]', err);
  }

  return `Punto GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}
