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
    const hasValidPoints = origen && destino && origen.lat !== 0 && origen.lng !== 0 && destino.lat !== 0 && destino.lng !== 0;
    return {
      coordenadas: hasValidPoints ? [[origen.lat, origen.lng], [destino.lat, destino.lng]] : [],
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
 * Calculates accurate road-adjusted distance in kilometers between two GPS coordinates in Nicaragua.
 * Uses the Haversine formula multiplied by an urban winding factor (1.35x for Managua street grids/rotondas).
 * Always returns at least 1.2 km to prevent 0km delivery orders.
 */
export function calcularDistanciaHaversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  factorUrbano: number = 1.35
): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 2.8;
  if (lat1 === 0 && lng1 === 0) return 2.8;
  if (lat2 === 0 && lng2 === 0) return 2.8;
  if (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lng1 - lng2) < 0.0001) return 1.2;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const linealKm = R * c;

  // Apply urban traffic / routing winding factor
  const distCalculada = Math.round(linealKm * factorUrbano * 10) / 10;
  return Math.max(1.2, distCalculada);
}

/**
 * Calculates estimated motorcycle delivery time in minutes given distance in km.
 */
export function calcularTiempoEstimado(km: number): number {
  const kmSeguro = km > 0 ? km : 2.5;
  // ~26 km/h city average + 5 min traffic/pickup buffer
  return Math.max(8, Math.round((kmSeguro / 26) * 60 + 5));
}

/**
 * Master Reference Points of Nicaragua (POIs Nicas Nativos).
 * Exhaustive real-world database of iconic traffic lights, roundabouts, overpasses,
 * commercial centers, supermarkets, hospitals, universities, neighborhoods, and cities.
 */
export interface NicaraguaPuntoReferencia {
  nombre: string;
  alias: string[];
  categoria: string;
  direccion: string;
  lat: number;
  lng: number;
}

export const NICARAGUA_MASTER_POIS: NicaraguaPuntoReferencia[] = [
  // ─── Semáforos Emblemáticos de Managua ───
  { nombre: 'Semáforos de Villa Fontana', alias: ['semaforos villa fontana', 'semaforo villa fontana', 'villa fontana semaforos'], categoria: 'Semáforos', direccion: 'Intersección Club Terraza / UNAN / Villa Fontana', lat: 12.1158, lng: -86.2655 },
  { nombre: 'Semáforos de Plaza El Sol', alias: ['semaforos plaza el sol', 'plaza el sol semaforos', 'semaforo plaza el sol'], categoria: 'Semáforos', direccion: 'Frente a Plaza El Sol / Complejo Faustino Ruiz', lat: 12.1285, lng: -86.2608 },
  { nombre: 'Semáforos de Lozelsa', alias: ['semaforos lozelsa', 'lozelsa', 'semaforo lozelsa', 'lozelsa altamira'], categoria: 'Semáforos', direccion: 'Pista de la Resistencia / Entrada a Altamira D\'Este', lat: 12.1228, lng: -86.2575 },
  { nombre: 'Semáforos de La Robelo', alias: ['semaforos la robelo', 'la robelo', 'semaforo la robelo', 'robelo'], categoria: 'Semáforos', direccion: 'Carretera Norte Km 5 / Entrada a Domitila Lugo', lat: 12.1512, lng: -86.2205 },
  { nombre: 'Semáforos de El Zumen', alias: ['semaforos el zumen', 'el zumen', 'zumen', 'semaforo zumen'], categoria: 'Semáforos', direccion: 'Pista Juan Pablo II / Distrito III de la Alcaldía', lat: 12.1245, lng: -86.2942 },
  { nombre: 'Semáforos Jonathan González', alias: ['semaforos jonathan gonzalez', 'jonathan gonzalez', 'semaforos hospital militar'], categoria: 'Semáforos', direccion: 'Pista Benjamín Zeledón / Estadio Soberanía', lat: 12.1338, lng: -86.2745 },
  { nombre: 'Semáforos de La Racachaca', alias: ['semaforos la racachaca', 'la racachaca', 'racachaca', 'semaforo racachaca'], categoria: 'Semáforos', direccion: 'Barrio Altagracia, Managua', lat: 12.1378, lng: -86.2892 },
  { nombre: 'Semáforos de El Colonial', alias: ['semaforos el colonial', 'el colonial', 'semaforo colonial'], categoria: 'Semáforos', direccion: 'Carretera Norte / Colonia 14 de Septiembre', lat: 12.1519, lng: -86.2302 },
  { nombre: 'Semáforos ENEL Central', alias: ['semaforos enel central', 'enel central', 'enel', 'semaforo enel central'], categoria: 'Semáforos', direccion: 'Pista Juan Pablo II, Managua', lat: 12.1235, lng: -86.2845 },
  { nombre: 'Semáforos de La Vicky (Distribuidora Vicky)', alias: ['semaforos la vicky', 'la vicky', 'distribuidora vicky', 'semaforo la vicky'], categoria: 'Semáforos', direccion: 'Colonia Los Robles / Calle de los Hoteles', lat: 12.1220, lng: -86.2638 },
  { nombre: 'Semáforos Autolote El Chele', alias: ['semaforos autolote el chele', 'autolote el chele', 'el chele semaforos'], categoria: 'Semáforos', direccion: 'Pista Solidaridad / Reparto San Juan', lat: 12.1278, lng: -86.2555 },
  { nombre: 'Semáforos de Linda Vista', alias: ['semaforos linda vista', 'semaforo linda vista', 'linda vista semaforos'], categoria: 'Semáforos', direccion: 'Intersección Linda Vista / Las Brisas / Carretera Sur', lat: 12.1488, lng: -86.3022 },
  { nombre: 'Semáforos del Dancing', alias: ['semaforos del dancing', 'el dancing', 'dancing carretera norte'], categoria: 'Semáforos', direccion: 'Carretera Norte / Entrada a Las Mercedes', lat: 12.1495, lng: -86.2135 },
  { nombre: 'Semáforos de Portezuelo', alias: ['semaforos de portezuelo', 'semaforo portezuelo', 'portezuelo semaforos'], categoria: 'Semáforos', direccion: 'Carretera Norte / Cruce Portezuelo', lat: 12.1498, lng: -86.2085 },
  { nombre: 'Semáforos de La Subasta', alias: ['semaforos la subasta', 'la subasta', 'subasta carretera norte'], categoria: 'Semáforos', direccion: 'Km 7.5 Carretera Norte', lat: 12.1480, lng: -86.1950 },
  { nombre: 'Semáforos del Hospital Bautista', alias: ['semaforos hospital bautista', 'semaforos bautista', 'bautista semaforos'], categoria: 'Semáforos', direccion: 'Calle 27 de Mayo / Barrio Largaespada', lat: 12.1392, lng: -86.2635 },
  { nombre: 'Semáforos del Guanacaste', alias: ['semaforos el guanacaste', 'el guanacaste', 'guanacaste altagracia'], categoria: 'Semáforos', direccion: 'Pista Benjamín Zeledón / Barrio Altagracia', lat: 12.1355, lng: -86.2865 },
  { nombre: 'Semáforos de Rubenia', alias: ['semaforos de rubenia', 'semaforos rubenia', 'semaforo rubenia'], categoria: 'Semáforos', direccion: 'Pista Solidaridad, Rubenia', lat: 12.1275, lng: -86.2312 },
  { nombre: 'Semáforos de El Edén', alias: ['semaforos el eden', 'el eden', 'semaforo el eden'], categoria: 'Semáforos', direccion: 'Pista Larreynaga / Barrio El Edén', lat: 12.1455, lng: -86.2415 },
  { nombre: 'Semáforos del Memorial Sandino', alias: ['semaforos memorial sandino', 'memorial sandino semaforos'], categoria: 'Semáforos', direccion: 'Pista Suburbana / Memorial Sandino', lat: 12.1120, lng: -86.2790 },
  { nombre: 'Semáforos de Las Colinas', alias: ['semaforos las colinas', 'semaforo las colinas', 'las colinas semaforos'], categoria: 'Semáforos', direccion: 'Km 8 Carretera a Masaya / Entrada Las Colinas', lat: 12.0855, lng: -86.2285 },
  { nombre: 'Semáforos de Las Mercedes', alias: ['semaforos las mercedes', 'las mercedes carretera norte'], categoria: 'Semáforos', direccion: 'Km 13 Carretera Norte / Zona Franca', lat: 12.1462, lng: -86.1485 },
  { nombre: 'Semáforos de Reparto Schick', alias: ['semaforos reparto schick', 'reparto schick semaforos', 'schick semaforos'], categoria: 'Semáforos', direccion: 'Pista Solidaridad / Entrada Schick', lat: 12.1105, lng: -86.2305 },
  { nombre: 'Semáforos de Ciudad Jardín', alias: ['semaforos ciudad jardin', 'ciudad jardin semaforos'], categoria: 'Semáforos', direccion: 'Ciudad Jardín / Lafise Bancentro', lat: 12.1405, lng: -86.2485 },
  { nombre: 'Semáforos de San Judas', alias: ['semaforos san judas', 'san judas semaforos', 'semaforo san judas'], categoria: 'Semáforos', direccion: 'Pista Suburbana / Cruce San Judas', lat: 12.1125, lng: -86.2975 },
  { nombre: 'Semáforos de la Reynaga', alias: ['semaforos de la reynaga', 'la reynaga', 'reynaga'], categoria: 'Semáforos', direccion: 'Pista Larreynaga / Bello Horizonte', lat: 12.1345, lng: -86.2185 },
  { nombre: 'Semáforos Rigoberto López Pérez', alias: ['semaforos rigoberto lopez perez', 'semaforos unan universitaria'], categoria: 'Semáforos', direccion: 'Avenida Universitaria / Pista Benjamín Zeledón', lat: 12.1285, lng: -86.2715 },
  { nombre: 'Semáforos de El Dorado', alias: ['semaforos el dorado', 'el dorado semaforos'], categoria: 'Semáforos', direccion: 'Pista Solidaridad / Entrada El Dorado', lat: 12.1325, lng: -86.2415 },
  { nombre: 'Semáforos del Bóer', alias: ['semaforos del boer', 'el boer semaforos'], categoria: 'Semáforos', direccion: 'Avenida Bolívar / Antiguo Estadio Denis Martínez', lat: 12.1475, lng: -86.2730 },
  { nombre: 'Semáforos de San Sebastián', alias: ['semaforos san sebastian', 'san sebastian semaforos'], categoria: 'Semáforos', direccion: 'Calle Real Xolotlán / San Sebastián', lat: 12.1555, lng: -86.2785 },
  { nombre: 'Semáforos de La Waspan', alias: ['semaforos la waspan', 'la waspan semaforos', 'waspan'], categoria: 'Semáforos', direccion: 'Km 9 Carretera Norte / Entrada Waspan', lat: 12.1450, lng: -86.1830 },
  { nombre: 'Semáforos del Club Terraza', alias: ['semaforos club terraza', 'club terraza semaforos'], categoria: 'Semáforos', direccion: 'Pista Jean Paul Genie / Villa Fontana', lat: 12.1008, lng: -86.2536 },
  { nombre: 'Semáforos de Enabas Central', alias: ['semaforos enabas', 'enabas central'], categoria: 'Semáforos', direccion: 'Carretera Norte antigua / Enabas', lat: 12.1460, lng: -86.2690 },
  { nombre: 'Semáforos de Montoya', alias: ['semaforos montoya', 'montoya semaforos', 'estatua montoya semaforos'], categoria: 'Semáforos', direccion: 'Estatua de Montoya / Calle Colón', lat: 12.1448, lng: -86.2842 },
  { nombre: 'Semáforos Delicias del Volga', alias: ['semaforos delicias del volga', 'delicias del volga'], categoria: 'Semáforos', direccion: 'Bolonia norte / El Carmen', lat: 12.1480, lng: -86.2820 },
  { nombre: 'Semáforos de La Morita', alias: ['semaforos la morita', 'la morita', 'morita masaya'], categoria: 'Semáforos', direccion: 'Carretera a Masaya / Camino de Oriente', lat: 12.1050, lng: -86.2490 },

  // ─── Rotondas y Pasos a Desnivel ───
  { nombre: 'Rotonda Rubén Darío (Metrocentro)', alias: ['rotonda metrocentro', 'rotonda ruben dario', 'ruben dario'], categoria: 'Rotonda', direccion: 'Pista Juan Pablo II / Paseo Unión Europea', lat: 12.1265, lng: -86.2655 },
  { nombre: 'Rotonda El Güegüense', alias: ['rotonda gueguense', 'el gueguense', 'plaza españa rotonda', 'güegüense'], categoria: 'Rotonda', direccion: 'Plaza España, Bolonia', lat: 12.1320, lng: -86.2815 },
  { nombre: 'Rotonda El Periodista', alias: ['rotonda el periodista', 'periodista', 'el periodista'], categoria: 'Rotonda', direccion: 'Pista Juan Pablo II, cerca de ENEL Central', lat: 12.1220, lng: -86.2865 },
  { nombre: 'Rotonda Jean Paul Genie', alias: ['rotonda jean paul genie', 'jean paul genie', 'club terraza rotonda'], categoria: 'Rotonda', direccion: 'Pista Jean Paul Genie / Carretera a Masaya', lat: 12.1010, lng: -86.2440 },
  { nombre: 'Rotonda Cristo Rey', alias: ['rotonda cristo rey', 'cristo rey'], categoria: 'Rotonda', direccion: 'Pista de la Resistencia / Santo Domingo', lat: 12.1330, lng: -86.2570 },
  { nombre: 'Rotonda La Virgen', alias: ['rotonda la virgen', 'la virgen', 'virgen'], categoria: 'Rotonda', direccion: 'Pista Portezuelo / Villa Progreso', lat: 12.1465, lng: -86.2195 },
  { nombre: 'Rotonda Bello Horizonte', alias: ['rotonda bello horizonte', 'bello horizonte rotonda'], categoria: 'Rotonda', direccion: 'Colonia Bello Horizonte', lat: 12.1415, lng: -86.2301 },
  { nombre: 'Rotonda Centroamérica', alias: ['rotonda centroamerica', 'centroamerica', 'rotonda centro america'], categoria: 'Rotonda', direccion: 'Pista Solidaridad / Carretera a Masaya', lat: 12.1140, lng: -86.2490 },
  { nombre: 'Rotonda Hugo Chávez', alias: ['rotonda hugo chavez', 'bolivar', 'hugo chavez'], categoria: 'Rotonda', direccion: 'Avenida Bolívar, Plaza Inter', lat: 12.1520, lng: -86.2730 },
  { nombre: 'Rotonda Santo Domingo', alias: ['rotonda santo domingo', 'santo domingo rotonda'], categoria: 'Rotonda', direccion: 'Galerías Santo Domingo / Camino de Oriente', lat: 12.0970, lng: -86.2420 },
  { nombre: 'Rotonda Universitaria (UNAN)', alias: ['rotonda universitaria', 'rotonda unan', 'unan rotonda'], categoria: 'Rotonda', direccion: 'Pista Suburbana / UNAN Managua', lat: 12.1125, lng: -86.2735 },
  { nombre: 'Rotonda de Ticuantepe', alias: ['rotonda ticuantepe', 'ticuantepe rotonda', 'km 14 masaya'], categoria: 'Rotonda', direccion: 'Km 14 Carretera a Masaya / Entrada a Ticuantepe', lat: 12.0420, lng: -86.1950 },
  { nombre: 'Rotonda Las Garitas (Tipitapa)', alias: ['rotonda las garitas', 'la garita tipitapa'], categoria: 'Rotonda', direccion: 'Km 18 Carretera Norte / Tipitapa', lat: 12.1645, lng: -86.1095 },
  { nombre: 'Rotonda San Jerónimo (Masaya)', alias: ['rotonda san jeronimo', 'san jeronimo masaya'], categoria: 'Rotonda', direccion: 'Entrada a Masaya por Carretera Masaya', lat: 11.9750, lng: -86.0950 },
  { nombre: 'Rotonda Las Flores (Masaya)', alias: ['rotonda las flores', 'las flores masaya', 'cruce catarina'], categoria: 'Rotonda', direccion: 'Empalme Masaya - Catarina - Granada', lat: 11.9720, lng: -86.0680 },
  { nombre: 'Paso a Desnivel Nejapa (7 Sur)', alias: ['7 sur', 'paso a desnivel nejapa', 'siete sur', 'nejapa'], categoria: 'Paso a Desnivel', direccion: 'Carretera Sur / Pista Juan Pablo II', lat: 12.1120, lng: -86.3110 },
  { nombre: 'Paso a Desnivel Rubenia', alias: ['rubenia', 'paso a desnivel rubenia'], categoria: 'Paso a Desnivel', direccion: 'Pista Solidaridad, Rubenia', lat: 12.1270, lng: -86.2310 },
  { nombre: 'Paso a Desnivel Las Piedrecitas', alias: ['las piedrecitas', 'piedrecitas', 'paso a desnivel piedrecitas'], categoria: 'Paso a Desnivel', direccion: 'Carretera Nueva a León / Carretera Sur', lat: 12.1410, lng: -86.3240 },
  { nombre: 'Paso a Desnivel Portezuelo', alias: ['paso a desnivel portezuelo', 'portezuelo desnivel'], categoria: 'Paso a Desnivel', direccion: 'Carretera Norte / Portezuelo', lat: 12.1495, lng: -86.2085 },
  { nombre: 'Paso a Desnivel Tiscapa / Barricada', alias: ['paso a desnivel tiscapa', 'tiscapa paso a desnivel'], categoria: 'Paso a Desnivel', direccion: 'Costado sur Laguna de Tiscapa', lat: 12.1385, lng: -86.2740 },

  // ─── Centros Comerciales, Malls y Plazas ───
  { nombre: 'Metrocentro Managua', alias: ['metrocentro', 'metro', 'plaza metrocentro', 'mall metrocentro'], categoria: 'Centro Comercial', direccion: 'Pista Juan Pablo II, Rotonda Rubén Darío', lat: 12.1264, lng: -86.2652 },
  { nombre: 'Galerías Santo Domingo', alias: ['galerias', 'galerias santo domingo', 'zona viva galerias', 'mall galerias'], categoria: 'Centro Comercial', direccion: 'Km 6.5 Carretera a Masaya', lat: 12.0970, lng: -86.2420 },
  { nombre: 'Multicentro Las Américas', alias: ['multicentro americas', 'multicentro', 'las americas', 'multicentro las americas'], categoria: 'Centro Comercial', direccion: 'Pista de la Resistencia, Bello Horizonte', lat: 12.1384, lng: -86.2189 },
  { nombre: 'Plaza Inter', alias: ['plaza inter', 'intercontinental', 'crowne plaza', 'mall plaza inter'], categoria: 'Centro Comercial', direccion: 'Barrio Bolonia, frente al Monumento a Sandino', lat: 12.1432, lng: -86.2758 },
  { nombre: 'Plaza España', alias: ['plaza españa', 'banpro plaza españa', 'edificio pellas'], categoria: 'Plaza Comercial', direccion: 'Rotonda El Güegüense, Bolonia', lat: 12.1322, lng: -86.2810 },
  { nombre: 'Multicentro Las Brisas', alias: ['las brisas', 'multicentro brisas', 'plaza las brisas'], categoria: 'Centro Comercial', direccion: 'Pista Portezuelo, Linda Vista', lat: 12.1520, lng: -86.3050 },
  { nombre: 'Plaza Once', alias: ['plaza once', 'km 11 masaya', 'plaza once masaya'], categoria: 'Plaza Comercial', direccion: 'Km 11.5 Carretera a Masaya', lat: 12.0720, lng: -86.2130 },
  { nombre: 'Plaza Familiar', alias: ['plaza familiar', 'km 7.5 masaya'], categoria: 'Plaza Comercial', direccion: 'Km 7.5 Carretera a Masaya', lat: 12.1030, lng: -86.2390 },
  { nombre: 'Plaza Natura', alias: ['plaza natura', 'suburbana natura'], categoria: 'Plaza Comercial', direccion: 'Pista Suburbana, frente a UNAN-Managua', lat: 12.1090, lng: -86.2730 },
  { nombre: 'Camino de Oriente', alias: ['camino de oriente', 'oriente plaza', 'chamorro'], categoria: 'Plaza Comercial', direccion: 'Km 6 Carretera a Masaya', lat: 12.1130, lng: -86.2520 },
  { nombre: 'Plaza Santo Domingo', alias: ['plaza santo domingo', 'santo domingo plaza'], categoria: 'Plaza Comercial', direccion: 'Costado de Galerías Santo Domingo', lat: 12.0985, lng: -86.2435 },
  { nombre: 'Plaza Eclipse', alias: ['plaza eclipse', 'eclipse los robles'], categoria: 'Plaza Comercial', direccion: 'Calle Principal Los Robles', lat: 12.1280, lng: -86.2630 },
  { nombre: 'Centro Comercial Managua (CCM)', alias: ['centro comercial managua', 'ccm', 'cc managua'], categoria: 'Centro Comercial', direccion: 'Pista de la Resistencia / Colonia Centroamérica', lat: 12.1235, lng: -86.2520 },
  { nombre: 'Plaza Cuba', alias: ['plaza cuba', 'parque plaza cuba'], categoria: 'Plaza Pública', direccion: 'Los Robles, Managua', lat: 12.1268, lng: -86.2612 },
  { nombre: 'Plaza Caracol', alias: ['plaza caracol', 'caracol pista benjamin zeledon'], categoria: 'Plaza Comercial', direccion: 'Pista Benjamín Zeledón, Managua', lat: 12.1315, lng: -86.2840 },
  { nombre: 'Puerto Salvador Allende', alias: ['puerto salvador allende', 'malecon de managua', 'salvador allende'], categoria: 'Turismo y Restaurantes', direccion: 'Paseo Xolotlán, Malecón de Managua', lat: 12.1610, lng: -86.2780 },
  { nombre: 'Plaza La Fe', alias: ['plaza de la fe', 'plaza juan pablo ii', 'plaza la fe juan pablo ii'], categoria: 'Plaza Pública', direccion: 'Paseo de los Estudiantes, Malecón', lat: 12.1585, lng: -86.2735 },
  { nombre: 'Plaza de la Revolución', alias: ['plaza de la revolucion', 'parque central managua revolucion'], categoria: 'Plaza Pública', direccion: 'Centro Histórico de Managua', lat: 12.1565, lng: -86.2715 },

  // ─── Supermercados y Clubes de Compras ───
  { nombre: 'PriceSmart Plaza España', alias: ['pricesmart plaza españa', 'pricesmart españa', 'pricesmart bolonia'], categoria: 'Supermercado', direccion: 'Costado oeste de Plaza España, Bolonia', lat: 12.1310, lng: -86.2835 },
  { nombre: 'PriceSmart Carretera a Masaya', alias: ['pricesmart masaya', 'pricesmart km 12', 'pricesmart carretera masaya'], categoria: 'Supermercado', direccion: 'Km 12.5 Carretera a Masaya', lat: 12.0635, lng: -86.2065 },
  { nombre: 'Walmart Guanacaste', alias: ['walmart guanacaste', 'walmart managua', 'walmart sur'], categoria: 'Supermercado', direccion: 'Pista Benjamín Zeledón, Guanacaste', lat: 12.1360, lng: -86.2875 },
  { nombre: 'Supermercado La Colonia Plaza España', alias: ['la colonia plaza españa', 'colonia plaza españa'], categoria: 'Supermercado', direccion: 'Plaza España, Managua', lat: 12.1320, lng: -86.2815 },
  { nombre: 'Supermercado La Colonia Los Robles (Plaza Cuba)', alias: ['la colonia los robles', 'la colonia plaza cuba', 'colonia plaza cuba'], categoria: 'Supermercado', direccion: 'Plaza Cuba, Los Robles', lat: 12.1235, lng: -86.2630 },
  { nombre: 'Supermercado La Colonia Las Brisas', alias: ['la colonia las brisas', 'colonia las brisas'], categoria: 'Supermercado', direccion: 'Pista Linda Vista, Las Brisas', lat: 12.1525, lng: -86.3055 },
  { nombre: 'Supermercado La Colonia Rubenia', alias: ['la colonia rubenia', 'colonia rubenia'], categoria: 'Supermercado', direccion: 'Pista Solidaridad, Rubenia', lat: 12.1275, lng: -86.2315 },
  { nombre: 'Supermercado La Colonia 10 de Junio', alias: ['la colonia 10 de junio', 'colonia 10 de junio'], categoria: 'Supermercado', direccion: 'Colonia 10 de Junio, Managua', lat: 12.1240, lng: -86.2395 },
  { nombre: 'Supermercado La Colonia Carretera a Masaya (Km 8.5)', alias: ['la colonia masaya', 'la colonia km 8', 'colonia carretera masaya'], categoria: 'Supermercado', direccion: 'Km 8.5 Carretera a Masaya', lat: 12.0830, lng: -86.2240 },
  { nombre: 'Supermercado La Colonia Galerías Santo Domingo', alias: ['la colonia galerias', 'colonia galerias santo domingo'], categoria: 'Supermercado', direccion: 'Galerías Santo Domingo', lat: 12.0975, lng: -86.2415 },
  { nombre: 'Supermercado La Colonia Bello Horizonte', alias: ['la colonia bello horizonte', 'colonia bello horizonte'], categoria: 'Supermercado', direccion: 'Rotonda Bello Horizonte', lat: 12.1425, lng: -86.2295 },
  { nombre: 'Supermercado La Colonia Bolonia', alias: ['la colonia bolonia', 'colonia bolonia'], categoria: 'Supermercado', direccion: 'Barrio Bolonia, Managua', lat: 12.1365, lng: -86.2795 },
  { nombre: 'Maxi Palí Santa Ana', alias: ['maxi pali santa ana', 'maxipali santa ana'], categoria: 'Supermercado', direccion: 'Barrio Santa Ana, Managua', lat: 12.1485, lng: -86.2865 },
  { nombre: 'Maxi Palí Wampan (Carretera Norte)', alias: ['maxi pali wampan', 'maxi pali carretera norte', 'maxipali waspan'], categoria: 'Supermercado', direccion: 'Km 9 Carretera Norte, Waspan', lat: 12.1450, lng: -86.1850 },
  { nombre: 'Maxi Palí El Dorado', alias: ['maxi pali el dorado', 'maxipali el dorado'], categoria: 'Supermercado', direccion: 'Colonia El Dorado, Managua', lat: 12.1310, lng: -86.2420 },
  { nombre: 'Maxi Palí Oriental', alias: ['maxi pali oriental', 'maxipali oriental'], categoria: 'Supermercado', direccion: 'Cerca del Mercado Oriental, Managua', lat: 12.1415, lng: -86.2490 },
  { nombre: 'Maxi Palí Nejapa (7 Sur)', alias: ['maxi pali nejapa', 'maxi pali 7 sur', 'maxipali nejapa'], categoria: 'Supermercado', direccion: 'Paso a Desnivel 7 Sur', lat: 12.1110, lng: -86.3130 },
  { nombre: 'Maxi Palí Ciudad Sandino', alias: ['maxi pali ciudad sandino', 'maxipali sandino'], categoria: 'Supermercado', direccion: 'Entrada principal Ciudad Sandino', lat: 12.1575, lng: -86.3520 },
  { nombre: 'Palí Altagracia', alias: ['pali altagracia'], categoria: 'Supermercado', direccion: 'Barrio Altagracia, Managua', lat: 12.1330, lng: -86.2910 },
  { nombre: 'Palí San Judas', alias: ['pali san judas'], categoria: 'Supermercado', direccion: 'Barrio San Judas, Managua', lat: 12.1130, lng: -86.2970 },
  { nombre: 'Palí Bello Horizonte', alias: ['pali bello horizonte'], categoria: 'Supermercado', direccion: 'Colonia Bello Horizonte, Managua', lat: 12.1420, lng: -86.2290 },
  { nombre: 'Palí Ciudad Jardín', alias: ['pali ciudad jardin'], categoria: 'Supermercado', direccion: 'Ciudad Jardín, Managua', lat: 12.1395, lng: -86.2495 },
  { nombre: 'Palí Monseñor Lezcano', alias: ['pali monseñor lezcano', 'pali lezcano'], categoria: 'Supermercado', direccion: 'Barrio Monseñor Lezcano, Managua', lat: 12.1450, lng: -86.2940 },
  { nombre: 'Palí Las Mercedes', alias: ['pali las mercedes', 'pali aeropuerto'], categoria: 'Supermercado', direccion: 'Km 13 Carretera Norte', lat: 12.1455, lng: -86.1520 },

  // ─── Mercados Populares y Terminales ───
  { nombre: 'Mercado Oriental', alias: ['mercado oriental', 'el oriental', 'gancho de caminos', 'ciudad jardin mercado'], categoria: 'Mercado', direccion: 'Calle 15 de Septiembre, Managua', lat: 12.1410, lng: -86.2520 },
  { nombre: 'Mercado Roberto Huembes', alias: ['mercado huembes', 'huembes', 'terminal huembes', 'mercado roberto huembes'], categoria: 'Mercado', direccion: 'Pista Solidaridad, Managua', lat: 12.1225, lng: -86.2365 },
  { nombre: 'Mercado Iván Montenegro', alias: ['mercado ivan montenegro', 'ivan montenegro', 'el ivan'], categoria: 'Mercado', direccion: 'Pista Larreynaga, Managua', lat: 12.1310, lng: -86.2080 },
  { nombre: 'Mercado Israel Lewites', alias: ['mercado israel lewites', 'israel lewites', 'el boer'], categoria: 'Mercado', direccion: 'Pista Juan Pablo II, San Judas', lat: 12.1290, lng: -86.3010 },
  { nombre: 'Mercado Mayoreo', alias: ['mercado mayoreo', 'mayoreo', 'terminal mayoreo'], categoria: 'Mercado', direccion: 'Carretera Norte hacia adentro, Managua', lat: 12.1440, lng: -86.1960 },
  { nombre: 'Gancho de Caminos', alias: ['gancho de caminos', 'el gancho'], categoria: 'Mercado', direccion: 'Mercado Oriental, Managua', lat: 12.1425, lng: -86.2540 },
  { nombre: 'Mercado Periférico', alias: ['mercado periferico', 'mercado san judas periferico'], categoria: 'Mercado', direccion: 'Barrio San Judas / 10 de Junio', lat: 12.1315, lng: -86.2490 },
  { nombre: 'Mercado de Artesanías de Masaya', alias: ['mercado de artesanias masaya', 'mercado viejo masaya'], categoria: 'Mercado', direccion: 'Centro Histórico de Masaya', lat: 11.9740, lng: -86.0940 },
  { nombre: 'Mercado Central de León', alias: ['mercado central de leon', 'mercado leon'], categoria: 'Mercado', direccion: 'Costado sur de la Catedral de León', lat: 12.4345, lng: -86.8795 },
  { nombre: 'Mercado Municipal de Granada', alias: ['mercado municipal de granada', 'mercado granada'], categoria: 'Mercado', direccion: 'Calle Atravesada, Granada', lat: 11.9280, lng: -85.9540 },

  // ─── Hospitales y Centros Médicos ───
  { nombre: 'Hospital Militar Dr. Alejandro Dávila Bolaños', alias: ['hospital militar', 'militar', 'alejandro davila bolaños'], categoria: 'Hospital', direccion: 'Pistas Unidas, Bolonia', lat: 12.1380, lng: -86.2720 },
  { nombre: 'Hospital Metropolitano Vivian Pellas', alias: ['hospital vivian pellas', 'vivian pellas', 'pellas hospital'], categoria: 'Hospital', direccion: 'Km 9.8 Carretera a Masaya', lat: 12.0835, lng: -86.2235 },
  { nombre: 'Hospital Bautista', alias: ['hospital bautista', 'bautista'], categoria: 'Hospital', direccion: 'Barrio Largaespada, Managua', lat: 12.1390, lng: -86.2630 },
  { nombre: 'Hospital Monte España', alias: ['hospital monte españa', 'monte españa'], categoria: 'Hospital', direccion: 'Villa Fontana, Managua', lat: 12.1160, lng: -86.2620 },
  { nombre: 'Hospital Salud Integral', alias: ['hospital salud integral', 'salud integral'], categoria: 'Hospital', direccion: 'Barrio Santa Ana, Managua', lat: 12.1470, lng: -86.2880 },
  { nombre: 'Hospital Fernando Vélez Paiz', alias: ['hospital velez paiz', 'velez paiz', 'fernando velez paiz'], categoria: 'Hospital', direccion: 'Paso a Desnivel 7 Sur', lat: 12.1180, lng: -86.3120 },
  { nombre: 'Hospital Manolo Morales Peralta', alias: ['hospital manolo morales', 'manolo morales'], categoria: 'Hospital', direccion: 'Pista Solidaridad, frente a Roberto Huembes', lat: 12.1205, lng: -86.2370 },
  { nombre: 'Hospital Bertha Calderón', alias: ['hospital bertha calderon', 'bertha calderon'], categoria: 'Hospital', direccion: 'Pista Juan Pablo II, cerca de El Zumen', lat: 12.1240, lng: -86.2970 },
  { nombre: 'Hospital Antonio Lenín Fonseca', alias: ['hospital lenin fonseca', 'lenin fonseca', 'antonio lenin fonseca'], categoria: 'Hospital', direccion: 'Las Brisas, Managua', lat: 12.1510, lng: -86.3070 },
  { nombre: 'Hospital Alemán Nicaragüense', alias: ['hospital aleman nicaraguense', 'hospital aleman', 'aleman'], categoria: 'Hospital', direccion: 'Barrio Xva de Mayo / Waspan', lat: 12.1445, lng: -86.2075 },
  { nombre: 'Hospital Infantil Manuel de Jesús Rivera (La Mascota)', alias: ['la mascota', 'hospital la mascota', 'manuel de jesus rivera'], categoria: 'Hospital', direccion: 'Colonia Primero de Mayo, Managua', lat: 12.1230, lng: -86.2440 },
  { nombre: 'Policlínica Cruz Azul Bolonia', alias: ['cruz azul bolonia', 'clinica cruz azul', 'policlinica cruz azul'], categoria: 'Hospital', direccion: 'Barrio Bolonia, Managua', lat: 12.1350, lng: -86.2790 },
  { nombre: 'Cruz Roja Nicaragüense Sede Central', alias: ['cruz roja central', 'cruz roja belmonte', 'cruz roja'], categoria: 'Salud y Emergencias', direccion: 'Reparto Belmonte, Managua', lat: 12.1210, lng: -86.3070 },

  // ─── Universidades e Institutos ───
  { nombre: 'UNAN-Managua (RURD)', alias: ['unan', 'unan managua', 'recinto ruben dario', 'universidad nacional autonoma'], categoria: 'Universidad', direccion: 'Pista Suburbana, Villa Fontana', lat: 12.1090, lng: -86.2690 },
  { nombre: 'UNI - Universidad Nacional de Ingeniería', alias: ['uni', 'uni central', 'simon bolivar', 'recinto simon bolivar'], categoria: 'Universidad', direccion: 'Avenida Universitaria, Managua', lat: 12.1315, lng: -86.2710 },
  { nombre: 'UNI RUPAP', alias: ['uni rupap', 'rupap', 'pedro arauz palacios'], categoria: 'Universidad', direccion: 'Villa Progreso, Managua', lat: 12.1375, lng: -86.2090 },
  { nombre: 'UAM - Universidad Americana', alias: ['uam', 'universidad americana'], categoria: 'Universidad', direccion: 'Costado sur de Villa Fontana', lat: 12.1120, lng: -86.2590 },
  { nombre: 'Universidad Casimiro Sotelo (Ex UCA)', alias: ['uca', 'casimiro sotelo', 'universidad centroamericana', 'ex uca'], categoria: 'Universidad', direccion: 'Avenida Universitaria, Managua', lat: 12.1280, lng: -86.2710 },
  { nombre: 'UPOLI - Universidad Politécnica', alias: ['upoli', 'universidad politecnica'], categoria: 'Universidad', direccion: 'Colonia Rafaela Herrera, Managua', lat: 12.1460, lng: -86.2150 },
  { nombre: 'UNICIT', alias: ['unicit', 'universidad iberoamericana'], categoria: 'Universidad', direccion: 'Pista Jean Paul Genie', lat: 12.1140, lng: -86.2520 },
  { nombre: 'Thomas More Universitas', alias: ['thomas more', 'universidad thomas more'], categoria: 'Universidad', direccion: 'Villa Fontana, Managua', lat: 12.1040, lng: -86.2580 },
  { nombre: 'Universidad Nacional Agraria (UNA)', alias: ['una', 'universidad agraria', 'la agraria'], categoria: 'Universidad', direccion: 'Km 12.5 Carretera Norte', lat: 12.1440, lng: -86.1630 },
  { nombre: 'UNIVALLE', alias: ['univalle', 'universidad del valle'], categoria: 'Universidad', direccion: 'Rotonda El Periodista', lat: 12.1225, lng: -86.2850 },
  { nombre: 'Universidad Central de Nicaragua (UCN El Zumen)', alias: ['ucn zumen', 'ucn', 'universidad central de nicaragua'], categoria: 'Universidad', direccion: 'Frente a Semáforos El Zumen', lat: 12.1240, lng: -86.2930 },
  { nombre: 'UNICA - Universidad Católica', alias: ['unica', 'universidad catolica', 'redemptoris mater'], categoria: 'Universidad', direccion: 'Pistas Las Colinas / Santo Domingo', lat: 12.0880, lng: -86.2440 },
  { nombre: 'UNAN-León', alias: ['unan leon', 'universidad de leon'], categoria: 'Universidad', direccion: 'Costado oeste Parque Central, León', lat: 12.4360, lng: -86.8770 },

  // ─── Puntos Emblemáticos, Monumentos y Edificios ───
  { nombre: 'Distribuidora Vicky (La Vicky)', alias: ['la vicky', 'distribuidora vicky'], categoria: 'Comercio Emblemático', direccion: 'Colonia Los Robles, Managua', lat: 12.1220, lng: -86.2638 },
  { nombre: 'Estatua de Montoya', alias: ['estatua montoya', 'montoya estatua'], categoria: 'Monumento', direccion: 'Calle Colón / Bolonia oeste', lat: 12.1448, lng: -86.2842 },
  { nombre: 'Estatua de Monseñor Lezcano', alias: ['estatua monseñor lezcano', 'lezcano estatua'], categoria: 'Monumento', direccion: 'Barrio Monseñor Lezcano', lat: 12.1462, lng: -86.2925 },
  { nombre: 'Edificio Pellas', alias: ['edificio pellas', 'centro pellas', 'pellas corporativo'], categoria: 'Edificio Corporativo', direccion: 'Km 4.5 Carretera a Masaya', lat: 12.1180, lng: -86.2650 },
  { nombre: 'Edificio Discover', alias: ['edificio discover', 'discover villa fontana'], categoria: 'Edificio Corporativo', direccion: 'Villa Fontana, Managua', lat: 12.1135, lng: -86.2660 },
  { nombre: 'Edificio Escala', alias: ['edificio escala', 'escala jean paul genie'], categoria: 'Edificio Corporativo', direccion: 'Pista Jean Paul Genie', lat: 12.1020, lng: -86.2430 },
  { nombre: 'Invercasa', alias: ['invercasa', 'centro financiero invercasa'], categoria: 'Edificio Corporativo', direccion: 'Villa Fontana, Managua', lat: 12.1165, lng: -86.2660 },
  { nombre: 'Club Terraza', alias: ['club terraza', 'terraza'], categoria: 'Club Social', direccion: 'Pista Jean Paul Genie / Villa Fontana', lat: 12.1008, lng: -86.2536 },
  { nombre: 'Parque Las Madres', alias: ['parque las madres', 'las madres parque'], categoria: 'Parque', direccion: 'Pista Benjamín Zeledón / El Carmen', lat: 12.1335, lng: -86.2782 },
  { nombre: 'Parque Los Marañones', alias: ['parque los marañones', 'marañones centroamerica'], categoria: 'Parque', direccion: 'Colonia Centroamérica, Managua', lat: 12.1115, lng: -86.2460 },
  { nombre: 'Parque Luis Alfonso Velásquez Flores', alias: ['luis alfonso velasquez', 'parque luis alfonso', 'parque de la paz'], categoria: 'Parque', direccion: 'Avenida Bolívar, Centro Histórico', lat: 12.1545, lng: -86.2720 },
  { nombre: 'Teatro Nacional Rubén Darío', alias: ['teatro ruben dario', 'teatro nacional', 'tnrd'], categoria: 'Cultura', direccion: 'Costado norte de la Plaza de la Revolución', lat: 12.1580, lng: -86.2715 },
  { nombre: 'Palacio Nacional de la Cultura', alias: ['palacio nacional', 'palacio de la cultura'], categoria: 'Cultura', direccion: 'Plaza de la Revolución, Managua', lat: 12.1565, lng: -86.2715 },
  { nombre: 'Antigua Catedral de Managua', alias: ['antigua catedral', 'catedral vieja managua'], categoria: 'Monumento Histórico', direccion: 'Plaza de la Revolución, Managua', lat: 12.1568, lng: -86.2710 },
  { nombre: 'Laguna de Tiscapa (Loma de Tiscapa)', alias: ['tiscapa', 'loma de tiscapa', 'monumento sandino'], categoria: 'Sitio Histórico', direccion: 'Parque Histórico Loma de Tiscapa', lat: 12.1370, lng: -86.2725 },
  { nombre: 'Estadio Nacional Soberanía (Dennis Martínez)', alias: ['estadio nacional', 'estadio soberania', 'estadio denis martinez'], categoria: 'Estadio Deportivo', direccion: 'Paseo de los Universitarios, Managua', lat: 12.1360, lng: -86.2790 },
  { nombre: 'Polideportivo Alexis Argüello', alias: ['polideportivo alexis arguello', 'alexis arguello'], categoria: 'Estadio Deportivo', direccion: 'Avenida Bolívar, Managua', lat: 12.1510, lng: -86.2710 },
  { nombre: 'Aeropuerto Internacional Augusto C. Sandino (MGA)', alias: ['aeropuerto', 'aeropuerto managua', 'aeropuerto sandino', 'mga'], categoria: 'Aeropuerto', direccion: 'Km 11 Carretera Norte, Managua', lat: 12.1420, lng: -86.1680 },

  // ─── Colonias, Barrios y Residenciales de Managua ───
  { nombre: 'Colonia Los Robles', alias: ['los robles', 'robles', 'colonia robles'], categoria: 'Zona Residencial', direccion: 'Plaza Cuba hacia adentro, Managua', lat: 12.1240, lng: -86.2620 },
  { nombre: 'Altamira D\'Este', alias: ['altamira', 'altamira deste', 'colonia altamira'], categoria: 'Zona Residencial y Comercial', direccion: 'Pista Jean Paul Genie hacia el norte', lat: 12.1180, lng: -86.2560 },
  { nombre: 'Villa Fontana', alias: ['villa fontana', 'fontana'], categoria: 'Zona Residencial', direccion: 'Club Terraza hacia el oeste', lat: 12.1100, lng: -86.2610 },
  { nombre: 'Las Colinas', alias: ['las colinas', 'colinas'], categoria: 'Zona Residencial', direccion: 'Km 8 Carretera a Masaya', lat: 12.0850, lng: -86.2250 },
  { nombre: 'Santo Domingo Residencial', alias: ['santo domingo residencial', 'santo domingo'], categoria: 'Zona Residencial', direccion: 'Camino a Santo Domingo, Managua', lat: 12.0940, lng: -86.2390 },
  { nombre: 'Colonia Bello Horizonte', alias: ['bello horizonte', 'bello horisonte'], categoria: 'Zona Residencial', direccion: 'Rotonda Bello Horizonte', lat: 12.1415, lng: -86.2301 },
  { nombre: 'Barrio Bolonia', alias: ['bolonia', 'barrio bolonia'], categoria: 'Barrio', direccion: 'Plaza España hacia Plaza Inter', lat: 12.1370, lng: -86.2800 },
  { nombre: 'Linda Vista', alias: ['linda vista', 'lindavista'], categoria: 'Zona Residencial', direccion: 'Carretera Norte a Carretera Sur', lat: 12.1489, lng: -86.3021 },
  { nombre: 'Barrio Altagracia', alias: ['altagracia', 'barrio altagracia'], categoria: 'Barrio', direccion: 'Pista Benjamín Zeledón', lat: 12.1340, lng: -86.2890 },
  { nombre: 'Monseñor Lezcano', alias: ['monseñor lezcano', 'lezcano', 'barrio lezcano'], categoria: 'Barrio', direccion: 'Estatua de Monseñor Lezcano', lat: 12.1460, lng: -86.2920 },
  { nombre: 'Barrio San Judas', alias: ['san judas', 'barrio san judas'], categoria: 'Barrio', direccion: 'Pista Suburbana hacia el sur', lat: 12.1120, lng: -86.2980 },
  { nombre: 'Reparto San Juan', alias: ['reparto san juan', 'san juan managua'], categoria: 'Zona Residencial', direccion: 'Cerca de UCA y Metrocentro', lat: 12.1210, lng: -86.2690 },
  { nombre: 'Ciudad Jardín', alias: ['ciudad jardin', 'ciudad jardín'], categoria: 'Zona Comercial y Residencial', direccion: 'Cerca del Mercado Oriental', lat: 12.1390, lng: -86.2550 },
  { nombre: 'Reparto Schick', alias: ['reparto schick', 'schick'], categoria: 'Barrio', direccion: 'Pista Solidaridad hacia el sur', lat: 12.1080, lng: -86.2320 },
  { nombre: 'Batahola Norte', alias: ['batahola norte'], categoria: 'Barrio', direccion: 'Cerca del Hospital Lenín Fonseca', lat: 12.1420, lng: -86.3010 },
  { nombre: 'Batahola Sur', alias: ['batahola sur'], categoria: 'Barrio', direccion: 'Cerca de El Zumen', lat: 12.1360, lng: -86.3020 },
  { nombre: 'Colonia 10 de Junio', alias: ['10 de junio', 'colonia diez de junio'], categoria: 'Barrio', direccion: 'Pista Solidaridad, Managua', lat: 12.1245, lng: -86.2405 },
  { nombre: 'Colonia Nicarao', alias: ['nicarao', 'colonia nicarao'], categoria: 'Barrio', direccion: 'Pista Solidaridad, Managua', lat: 12.1255, lng: -86.2355 },
  { nombre: 'Colonia Centroamérica', alias: ['colonia centroamerica', 'centroamerica barrio'], categoria: 'Zona Residencial', direccion: 'Rotonda Centroamérica, Managua', lat: 12.1110, lng: -86.2470 },
  { nombre: 'Villa Progreso', alias: ['villa progreso'], categoria: 'Barrio', direccion: 'Rotonda La Virgen / RUPAP', lat: 12.1440, lng: -86.2230 },
  { nombre: 'Reparto Las Palmas', alias: ['las palmas', 'reparto las palmas'], categoria: 'Barrio', direccion: 'Oeste del Parque Las Madres', lat: 12.1410, lng: -86.2870 },
  { nombre: 'Santa Ana', alias: ['santa ana', 'barrio santa ana'], categoria: 'Barrio', direccion: 'Cerca del Hospital Salud Integral', lat: 12.1490, lng: -86.2870 },
  { nombre: 'Acahualinca', alias: ['acahualinca', 'huellas de acahualinca'], categoria: 'Barrio', direccion: 'Costado del Lago Xolotlán', lat: 12.1550, lng: -86.2950 },
  { nombre: 'Reparto Las Brisas', alias: ['reparto las brisas', 'las brisas managua'], categoria: 'Zona Residencial', direccion: 'Pista Portezuelo / Linda Vista', lat: 12.1530, lng: -86.3060 },
  { nombre: 'San Patricio', alias: ['san patricio', 'barrio san patricio'], categoria: 'Barrio', direccion: 'Carretera Sur Km 8', lat: 12.1060, lng: -86.3140 },
  { nombre: 'Memorial Sandino', alias: ['memorial sandino'], categoria: 'Barrio', direccion: 'Pista Suburbana, Managua', lat: 12.1130, lng: -86.2800 },
  { nombre: 'Sierras de Santo Domingo', alias: ['sierras de santo domingo', 'santo domingo sierras'], categoria: 'Zona Residencial', direccion: 'Sur de Galerías Santo Domingo', lat: 12.0830, lng: -86.2380 },
  { nombre: 'Esquipulas', alias: ['esquipulas', 'comarca esquipulas'], categoria: 'Comarca', direccion: 'Km 11 Carretera a Masaya adentro', lat: 12.0620, lng: -86.2180 },
  { nombre: 'Sabana Grande', alias: ['sabana grande', 'comarca sabana grande'], categoria: 'Comarca', direccion: 'Este de Mayoreo, Managua', lat: 12.1280, lng: -86.1680 },

  // ─── Municipios del Departamento de Managua ───
  { nombre: 'Ciudad Sandino', alias: ['ciudad sandino', 'sandino'], categoria: 'Municipio', direccion: 'Plaza Padre Miguel, Ciudad Sandino', lat: 12.1580, lng: -86.3450 },
  { nombre: 'Tipitapa', alias: ['tipitapa', 'parque tipitapa'], categoria: 'Municipio', direccion: 'Parque Central de Tipitapa', lat: 12.1970, lng: -86.0960 },
  { nombre: 'Ticuantepe', alias: ['ticuantepe', 'parque ticuantepe'], categoria: 'Municipio', direccion: 'Parque Central de Ticuantepe', lat: 12.0220, lng: -86.2050 },
  { nombre: 'El Crucero', alias: ['el crucero', 'crucero'], categoria: 'Municipio', direccion: 'Km 20 Carretera Sur', lat: 12.0150, lng: -86.3190 },
  { nombre: 'Villa El Carmen', alias: ['villa el carmen'], categoria: 'Municipio', direccion: 'Carretera Vieja a León Km 32', lat: 11.9790, lng: -86.5050 },
  { nombre: 'San Rafael del Sur', alias: ['san rafael del sur'], categoria: 'Municipio', direccion: 'Centro de San Rafael del Sur', lat: 11.8470, lng: -86.4380 },
  { nombre: 'Mateare', alias: ['mateare', 'municipio mateare'], categoria: 'Municipio', direccion: 'Km 25 Carretera Nueva a León', lat: 12.2380, lng: -86.4290 },

  // ─── Departamentos y Ciudades Principales de Nicaragua ───
  { nombre: 'Masaya (Parque Central)', alias: ['masaya', 'parque central masaya'], categoria: 'Departamento', direccion: 'Centro Histórico, Masaya', lat: 11.9740, lng: -86.0940 },
  { nombre: 'Nindirí', alias: ['nindiri', 'parque saurio nindiri'], categoria: 'Municipio', direccion: 'Carretera a Masaya Km 17', lat: 12.0030, lng: -86.1220 },
  { nombre: 'Catarina (Mirador de Catarina)', alias: ['catarina', 'mirador de catarina'], categoria: 'Turismo', direccion: 'Laguna de Apoyo, Catarina', lat: 11.9120, lng: -86.0740 },
  { nombre: 'San Juan de Oriente', alias: ['san juan de oriente'], categoria: 'Municipio', direccion: 'Cuna de las Cerámicas, Masaya', lat: 11.9050, lng: -86.0780 },
  { nombre: 'Niquinohomo', alias: ['niquinohomo'], categoria: 'Municipio', direccion: 'Cuna del General Sandino, Masaya', lat: 11.9030, lng: -86.0940 },
  { nombre: 'Granada (Parque Central / Calle La Calzada)', alias: ['granada', 'calle la calzada', 'parque colon granada'], categoria: 'Departamento', direccion: 'Parque Central Colón, Granada', lat: 11.9298, lng: -85.9560 },
  { nombre: 'León (Catedral de León)', alias: ['leon', 'catedral de leon', 'catedral leon'], categoria: 'Departamento', direccion: 'Plaza Central de León', lat: 12.4350, lng: -86.8790 },
  { nombre: 'Chinandega (Parque Central)', alias: ['chinandega', 'parque chinandega'], categoria: 'Departamento', direccion: 'Centro de Chinandega', lat: 12.6290, lng: -87.1310 },
  { nombre: 'Corinto', alias: ['corinto', 'puerto corinto'], categoria: 'Puerto', direccion: 'Puerto de Corinto, Chinandega', lat: 12.4820, lng: -87.1730 },
  { nombre: 'Chichigalpa', alias: ['chichigalpa', 'ingenio san antonio'], categoria: 'Municipio', direccion: 'Chinandega', lat: 12.5730, lng: -87.0270 },
  { nombre: 'Estelí (Parque Central)', alias: ['esteli', 'estelí', 'parque esteli'], categoria: 'Departamento', direccion: 'Parque Central de Estelí', lat: 13.0920, lng: -86.3580 },
  { nombre: 'Matagalpa (Parque Morazán)', alias: ['matagalpa', 'parque morazan matagalpa'], categoria: 'Departamento', direccion: 'Centro de Matagalpa', lat: 12.9250, lng: -85.9170 },
  { nombre: 'Jinotega (Catedral San Juan Bautista)', alias: ['jinotega', 'catedral jinotega'], categoria: 'Departamento', direccion: 'Centro de Jinotega', lat: 13.1000, lng: -86.0020 },
  { nombre: 'Somoto (Cañón de Somoto)', alias: ['somoto', 'cañon de somoto', 'madriz'], categoria: 'Departamento', direccion: 'Parque Central Somoto, Madriz', lat: 13.4830, lng: -86.5820 },
  { nombre: 'Ocotal', alias: ['ocotal', 'nueva segovia'], categoria: 'Departamento', direccion: 'Parque Central de Ocotal', lat: 13.6320, lng: -86.4750 },
  { nombre: 'Juigalpa, Chontales', alias: ['juigalpa', 'chontales', 'parque juigalpa'], categoria: 'Departamento', direccion: 'Parque Central de Juigalpa', lat: 12.1060, lng: -85.3640 },
  { nombre: 'Boaco (Ciudad de Dos Pisos)', alias: ['boaco'], categoria: 'Departamento', direccion: 'Parque Central de Boaco', lat: 12.4720, lng: -85.6580 },
  { nombre: 'Rivas (Parque Central)', alias: ['rivas', 'parque rivas'], categoria: 'Departamento', direccion: 'Parque Central de Rivas', lat: 11.4370, lng: -85.8260 },
  { nombre: 'San Juan del Sur', alias: ['san juan del sur', 'bahia san juan del sur'], categoria: 'Turismo', direccion: 'Bahía de San Juan del Sur, Rivas', lat: 11.2530, lng: -85.8700 },
  { nombre: 'Jinotepe, Carazo', alias: ['jinotepe', 'carazo'], categoria: 'Departamento', direccion: 'Parque Central de Jinotepe', lat: 11.8500, lng: -86.1990 },
  { nombre: 'Diriamba (Reloj de Diriamba)', alias: ['diriamba', 'reloj de diriamba'], categoria: 'Municipio', direccion: 'Basílica San Sebastián, Diriamba', lat: 11.8580, lng: -86.2390 },
  { nombre: 'San Marcos, Carazo', alias: ['san marcos carazo', 'san marcos'], categoria: 'Municipio', direccion: 'Parque Central de San Marcos', lat: 11.9080, lng: -86.2040 },
  { nombre: 'Bluefields (RACCS)', alias: ['bluefields', 'raccs'], categoria: 'Región Autónoma', direccion: 'Parque Reyes, Bluefields', lat: 12.0137, lng: -83.7635 },
  { nombre: 'Puerto Cabezas / Bilwi (RACCN)', alias: ['bilwi', 'puerto cabezas', 'raccn'], categoria: 'Región Autónoma', direccion: 'Parque Central Bilwi', lat: 14.0350, lng: -83.3888 },
  { nombre: 'Nueva Guinea', alias: ['nueva guinea'], categoria: 'Municipio', direccion: 'RACCS', lat: 11.6870, lng: -84.4560 },
  { nombre: 'San Carlos (Río San Juan)', alias: ['san carlos', 'rio san juan'], categoria: 'Departamento', direccion: 'Malecón San Carlos, Río San Juan', lat: 11.1240, lng: -84.7780 },
  { nombre: 'Corn Island (Big Corn Island)', alias: ['corn island', 'islas del maiz'], categoria: 'Turismo', direccion: 'Caribe Sur de Nicaragua', lat: 12.1730, lng: -81.4320 },
];

// ─── Corredores de Carreteras Nacionales (Kilómetros Exactos en Carreteras) ───

export interface HitoCarretera {
  km: number;
  lat: number;
  lng: number;
  descripcion: string;
}

export interface CorredorCarretera {
  nombre: string;
  patron: RegExp;
  hitos: HitoCarretera[];
}

export const CORREDORES_CARRETERAS_NICARAGUA: CorredorCarretera[] = [
  {
    nombre: 'Carretera a Masaya',
    patron: /(?:carretera\s+(?:a\s+)?masaya|c(?:\.|\s+)?a\s+masaya|pista\s+a\s+masaya)/i,
    hitos: [
      { km: 4.5, lat: 12.1265, lng: -86.2652, descripcion: 'Metrocentro / Rotonda Rubén Darío' },
      { km: 5.5, lat: 12.1190, lng: -86.2570, descripcion: 'Hospital Militar / Metrocentro Sur' },
      { km: 6.0, lat: 12.1050, lng: -86.2490, descripcion: 'Rotonda Centroamérica' },
      { km: 6.5, lat: 12.0970, lng: -86.2420, descripcion: 'Galerías Santo Domingo / Rotonda Jean Paul Genie' },
      { km: 8.0, lat: 12.0860, lng: -86.2280, descripcion: 'Entrada a Las Colinas' },
      { km: 9.8, lat: 12.0820, lng: -86.2220, descripcion: 'Hospital Metropolitano Vivian Pellas' },
      { km: 10.5, lat: 12.0760, lng: -86.2160, descripcion: 'Entrada a Esquipulas' },
      { km: 11.0, lat: 12.0720, lng: -86.2120, descripcion: 'Plaza Once / Puerta del Sol' },
      { km: 12.5, lat: 12.0610, lng: -86.2050, descripcion: 'PriceSmart Masaya / Los Hidalgos' },
      { km: 14.0, lat: 12.0420, lng: -86.1950, descripcion: 'Rotonda de Ticuantepe' },
      { km: 17.0, lat: 12.0120, lng: -86.1260, descripcion: 'Nindirí' },
      { km: 20.0, lat: 11.9860, lng: -86.0980, descripcion: 'Entrada a Masaya' },
      { km: 28.0, lat: 11.9720, lng: -86.0680, descripcion: 'Rotonda Las Flores / Masaya' },
    ],
  },
  {
    nombre: 'Carretera Norte',
    patron: /(?:carretera\s+norte|panamericana\s+norte|c(?:\.|\s+)?norte)/i,
    hitos: [
      { km: 3.0, lat: 12.1530, lng: -86.2450, descripcion: 'Quinta Nina / Banpro' },
      { km: 4.0, lat: 12.1520, lng: -86.2300, descripcion: 'Semáforos El Colonial' },
      { km: 5.0, lat: 12.1510, lng: -86.2200, descripcion: 'Semáforos La Robelo' },
      { km: 6.5, lat: 12.1500, lng: -86.2080, descripcion: 'Paso a Desnivel Portezuelo / Pepsi' },
      { km: 7.5, lat: 12.1480, lng: -86.1950, descripcion: 'Semáforos de La Subasta' },
      { km: 9.0, lat: 12.1450, lng: -86.1830, descripcion: 'Semáforos Waspan / Entrada Mayoreo' },
      { km: 11.0, lat: 12.1420, lng: -86.1680, descripcion: 'Aeropuerto Internacional Augusto C. Sandino' },
      { km: 13.0, lat: 12.1460, lng: -86.1480, descripcion: 'Zona Franca Las Mercedes' },
      { km: 15.0, lat: 12.1520, lng: -86.1320, descripcion: 'Monte Fresco / Entrada Sabana Grande' },
      { km: 18.0, lat: 12.1640, lng: -86.1100, descripcion: 'La Garita / Empalme Tipitapa' },
      { km: 22.0, lat: 12.1970, lng: -86.0960, descripcion: 'Tipitapa Centro' },
      { km: 25.0, lat: 12.2150, lng: -86.0820, descripcion: 'Salida Tipitapa / Panamericana' },
    ],
  },
  {
    nombre: 'Carretera Sur',
    patron: /(?:carretera\s+sur|panamericana\s+sur|c(?:\.|\s+)?sur)/i,
    hitos: [
      { km: 7.0, lat: 12.1120, lng: -86.3110, descripcion: 'Paso a Desnivel 7 Sur / Hospital Vélez Paiz' },
      { km: 8.5, lat: 12.1020, lng: -86.3120, descripcion: 'San Patricio' },
      { km: 10.0, lat: 12.0910, lng: -86.3125, descripcion: 'Altos de Ticomo' },
      { km: 11.5, lat: 12.0790, lng: -86.3135, descripcion: 'Valle Gothel / Monte Tabor' },
      { km: 14.0, lat: 12.0580, lng: -86.3160, descripcion: 'Cuatro Esquinas' },
      { km: 16.0, lat: 12.0420, lng: -86.3180, descripcion: 'San Antonio Sur' },
      { km: 20.0, lat: 12.0150, lng: -86.3190, descripcion: 'El Crucero Centro' },
      { km: 22.0, lat: 12.0020, lng: -86.3210, descripcion: 'Empalme El Crucero hacia Jinotepe' },
      { km: 26.0, lat: 11.9680, lng: -86.3050, descripcion: 'Las Esquinas' },
    ],
  },
  {
    nombre: 'Carretera Nueva a León',
    patron: /(?:carretera\s+nueva\s+a\s+le[oó]n|c(?:\.|\s+)?nueva\s+a\s+le[oó]n|pista\s+nueva\s+a\s+le[oó]n)/i,
    hitos: [
      { km: 7.0, lat: 12.1410, lng: -86.3240, descripcion: 'Paso a Desnivel Las Piedrecitas' },
      { km: 8.5, lat: 12.1470, lng: -86.3360, descripcion: 'Cuesta del Plomo empalme' },
      { km: 10.0, lat: 12.1530, lng: -86.3470, descripcion: 'Entrada Zona Franca / Los Brasiles este' },
      { km: 12.5, lat: 12.1580, lng: -86.3570, descripcion: 'Plaza Padre Miguel / Entrada Ciudad Sandino' },
      { km: 14.0, lat: 12.1640, lng: -86.3720, descripcion: 'Los Brasiles Centro' },
      { km: 17.0, lat: 12.1750, lng: -86.3980, descripcion: 'Urbanización San Andrés / Bella Cruz' },
      { km: 20.0, lat: 12.2030, lng: -86.4320, descripcion: 'Mateare Entrada' },
      { km: 25.0, lat: 12.2420, lng: -86.4550, descripcion: 'Mateare Salida hacia Nagarote' },
    ],
  },
  {
    nombre: 'Carretera Vieja a León',
    patron: /(?:carretera\s+vieja\s+a\s+le[oó]n|c(?:\.|\s+)?vieja\s+a\s+le[oó]n)/i,
    hitos: [
      { km: 8.0, lat: 12.1090, lng: -86.3150, descripcion: 'Empalme 7 Sur Carretera Vieja' },
      { km: 9.5, lat: 12.1000, lng: -86.3230, descripcion: 'San Patricio Sur' },
      { km: 12.0, lat: 12.0820, lng: -86.3420, descripcion: 'Chiquilistagua' },
      { km: 15.0, lat: 12.0620, lng: -86.3620, descripcion: 'Entrada a Cuajachillo' },
      { km: 18.0, lat: 12.0450, lng: -86.3850, descripcion: 'Cedro Galán' },
      { km: 20.0, lat: 12.0350, lng: -86.4020, descripcion: 'Empalme Nejapa Viejo' },
    ],
  },
];

/**
 * Resolves precise coordinates along major Nicaraguan highways using real GPS landmark benchmarks.
 * Performs accurate piecewise linear interpolation between verified kilometer anchors.
 */
export function resolverKilometroCarretera(query: string): {
  coordenadas: [number, number];
  descripcion: string;
  corredor: string;
  km: number;
} | null {
  if (!query || typeof query !== 'string') return null;
  const q = query.toLowerCase();

  // Extract kilometer number (e.g. "km 8.5", "km 10", "kilómetro 12", "km9")
  const kmMatch = q.match(/(?:km|kil[oó]metro|k)[\s.:#-]*(\d+(?:\.\d+)?)/i);
  if (!kmMatch) return null;

  const kmVal = parseFloat(kmMatch[1]);
  if (isNaN(kmVal) || kmVal <= 0 || kmVal > 150) return null;

  // Find matching corridor
  for (const corredor of CORREDORES_CARRETERAS_NICARAGUA) {
    if (corredor.patron.test(q)) {
      const hitos = corredor.hitos;
      if (hitos.length === 0) continue;

      // Below first milestone
      if (kmVal <= hitos[0].km) {
        return {
          coordenadas: [hitos[0].lat, hitos[0].lng],
          descripcion: `Km ${kmVal} ${corredor.nombre} (cerca de ${hitos[0].descripcion})`,
          corredor: corredor.nombre,
          km: kmVal,
        };
      }

      // Above last milestone
      if (kmVal >= hitos[hitos.length - 1].km) {
        const last = hitos[hitos.length - 1];
        return {
          coordenadas: [last.lat, last.lng],
          descripcion: `Km ${kmVal} ${corredor.nombre} (cerca de ${last.descripcion})`,
          corredor: corredor.nombre,
          km: kmVal,
        };
      }

      // Piecewise linear interpolation between adjacent anchors
      for (let i = 0; i < hitos.length - 1; i++) {
        const h1 = hitos[i];
        const h2 = hitos[i + 1];
        if (kmVal >= h1.km && kmVal <= h2.km) {
          const t = (kmVal - h1.km) / (h2.km - h1.km);
          const latInterp = Math.round((h1.lat + t * (h2.lat - h1.lat)) * 100000) / 100000;
          const lngInterp = Math.round((h1.lng + t * (h2.lng - h1.lng)) * 100000) / 100000;
          return {
            coordenadas: [latInterp, lngInterp],
            descripcion: `Km ${kmVal} ${corredor.nombre} (entre ${h1.descripcion} y ${h2.descripcion})`,
            corredor: corredor.nombre,
            km: kmVal,
          };
        }
      }
    }
  }

  return null;
}

// ─── Motor de Nomenclatura Local Tradicional Nicaragüense ───

const CUADRA_LAT_GRADOS = 0.00090; // ~100 metros en latitud
const CUADRA_LNG_GRADOS = 0.00092; // ~100 metros en longitud (~12°N)

function parsearDistanciaNica(cantidadStr?: string, unidadStr?: string): number {
  if (!cantidadStr && !unidadStr) return 1.0;

  let cant = 1.0;
  if (cantidadStr) {
    const s = cantidadStr.trim().toLowerCase();
    if (s === 'media' || s === 'medio' || s === '1/2') {
      cant = 0.5;
    } else if (s === 'una y media' || s === '1 1/2') {
      cant = 1.5;
    } else if (s === 'dos y media' || s === '2 1/2') {
      cant = 2.5;
    } else if (s === 'una') {
      cant = 1.0;
    } else if (s === 'dos') {
      cant = 2.0;
    } else if (s === 'tres') {
      cant = 3.0;
    } else if (s === 'cuatro') {
      cant = 4.0;
    } else if (s === 'cinco') {
      cant = 5.0;
    } else {
      const num = parseFloat(s);
      if (!isNaN(num)) cant = num;
    }
  }

  if (unidadStr) {
    const u = unidadStr.trim().toLowerCase();
    if (u.startsWith('vara') || u === 'vrs' || u === 'vrs.' || u === 'v') {
      return cant / 100; // 100 varas equivalen a 1 cuadra en la costumbre popular nica
    }
    if (u.startsWith('metro') || u === 'mts' || u === 'mts.' || u === 'm') {
      return cant / 100; // 100 metros = 1 cuadra
    }
  }

  return cant;
}

/**
 * Interprets traditional Nicaraguan address nomenclature:
 * [De/Del Punto de Referencia] [X cuadras/varas] [al lago/norte, al sur, arriba/este, abajo/oeste]
 */
export function interpretarDireccionNica(
  address: string,
  fallback: [number, number] = [12.1365, -86.2514]
): {
  coordenadas: [number, number];
  referencia?: string;
} {
  if (!address || typeof address !== 'string') {
    return { coordenadas: fallback };
  }

  const rawLower = address.toLowerCase().trim();

  // 1. Match the best, most specific POI in NICARAGUA_MASTER_POIS
  let basePoi: NicaraguaPuntoReferencia | null = null;
  let maxMatchLen = 0;

  for (const poi of NICARAGUA_MASTER_POIS) {
    const poiNameLower = poi.nombre.toLowerCase();
    if (rawLower.includes(poiNameLower) && poiNameLower.length > maxMatchLen) {
      basePoi = poi;
      maxMatchLen = poiNameLower.length;
    }
    for (const alias of poi.alias) {
      if (rawLower.includes(alias) && alias.length > maxMatchLen) {
        basePoi = poi;
        maxMatchLen = alias.length;
      }
    }
  }

  if (!basePoi) {
    return { coordenadas: fallback };
  }

  const baseLat = basePoi.lat;
  const baseLng = basePoi.lng;

  // 2. Parse Cardinal Displacements
  const norm = ' ' + rawLower
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/media\s+cuadra/g, '0.5 cuadras')
    .replace(/1\/2\s+cuadra/g, '0.5 cuadras')
    .replace(/1\/2\s*c\b/g, '0.5 cuadras') + ' ';

  let dy = 0; // +Lat (al lago/norte) o -Lat (al sur)
  let dx = 0; // +Lng (arriba/este) o -Lng (abajo/oeste)

  const reNorte = /(?:(\d+(?:\.\d+)?|\d+\/\d+|media|medio|una y media|dos y media|una|dos|tres|cuatro|cinco)?\s*(cuadras?|c\b|c\.|varas?|vrs\b|vrs\.|metros?|mts\b|m\b)?)?\s*(?:al\s+lago|al\s+norte|hacia\s+el\s+lago|hacia\s+el\s+norte)\b/gi;
  const reSur = /(?:(\d+(?:\.\d+)?|\d+\/\d+|media|medio|una y media|dos y media|una|dos|tres|cuatro|cinco)?\s*(cuadras?|c\b|c\.|varas?|vrs\b|vrs\.|metros?|mts\b|m\b)?)?\s*(?:al\s+sur|hacia\s+el\s+sur|hacia\s+la\s+monta[ñn]a)\b/gi;
  const reOeste = /(?:(\d+(?:\.\d+)?|\d+\/\d+|media|medio|una y media|dos y media|una|dos|tres|cuatro|cinco)?\s*(cuadras?|c\b|c\.|varas?|vrs\b|vrs\.|metros?|mts\b|m\b)?)?\s*(?:abajo|al\s+oeste|hacia\s+abajo|hacia\s+el\s+oeste)\b/gi;
  const reEste = /(?:(\d+(?:\.\d+)?|\d+\/\d+|media|medio|una y media|dos y media|una|dos|tres|cuatro|cinco)?\s*(cuadras?|c\b|c\.|varas?|vrs\b|vrs\.|metros?|mts\b|m\b)?)?\s*(?:arriba|al\s+este|hacia\s+arriba|hacia\s+el\s+este)\b/gi;

  let m: RegExpExecArray | null;
  while ((m = reNorte.exec(norm)) !== null) {
    const val = parsearDistanciaNica(m[1], m[2]);
    dy += val * CUADRA_LAT_GRADOS;
  }
  while ((m = reSur.exec(norm)) !== null) {
    const val = parsearDistanciaNica(m[1], m[2]);
    dy -= val * CUADRA_LAT_GRADOS;
  }
  while ((m = reOeste.exec(norm)) !== null) {
    const val = parsearDistanciaNica(m[1], m[2]);
    dx -= val * CUADRA_LNG_GRADOS;
  }
  while ((m = reEste.exec(norm)) !== null) {
    const val = parsearDistanciaNica(m[1], m[2]);
    dx += val * CUADRA_LNG_GRADOS;
  }

  const calculatedLat = Math.round((baseLat + dy) * 100000) / 100000;
  const calculatedLng = Math.round((baseLng + dx) * 100000) / 100000;

  return {
    coordenadas: [calculatedLat, calculatedLng],
    referencia: basePoi.nombre,
  };
}

/**
 * Resolves Managua and Nicaragua addresses to latitude & longitude coordinates.
 * Covers all major rotondas, shopping centers, neighborhoods, and departments.
 */
export function geocodeAddress(
  address: string,
  fallback: [number, number] = [12.1365, -86.2514]
): [number, number] {
  if (!address || typeof address !== 'string') return fallback;
  const q = address.toLowerCase().trim();

  // 1. Resolver por kilómetro en Carreteras Principales ("Km X Carretera a Masaya / Norte / Sur / León")
  const kmRes = resolverKilometroCarretera(q);
  if (kmRes) {
    return kmRes.coordenadas;
  }

  // 2. Resolver por Nomenclatura Relativa Nica ("De los semáforos de Villa Fontana 2 c al sur")
  const nicaRes = interpretarDireccionNica(address, fallback);
  if (nicaRes.referencia) {
    return nicaRes.coordenadas;
  }

  // 3. Búsqueda directa en Master Nicaragua POIs
  for (const poi of NICARAGUA_MASTER_POIS) {
    if (poi.nombre.toLowerCase().includes(q) || poi.alias.some((a) => q.includes(a) || a.includes(q))) {
      return [poi.lat, poi.lng];
    }
  }

  // 4. Rotondas principales de Managua
  if (q.includes('rotonda metrocentro') || q.includes('rubén darío') || q.includes('ruben dario')) return [12.1264, -86.2652];
  if (q.includes('rotonda cristo rey') || q.includes('cristo rey')) return [12.1332, -86.2512];
  if (q.includes('rotonda el güegüense') || q.includes('rotonda gueguense') || q.includes('plaza españa')) return [12.1348, -86.2825];
  if (q.includes('jean paul genie') || q.includes('galerias') || q.includes('galerías')) return [12.1008, -86.2536];
  if (q.includes('rotonda bello horizonte')) return [12.1465, -86.2305];
  if (q.includes('rotonda la virgen')) return [12.1485, -86.2215];
  if (q.includes('rotonda universitaria') || q.includes('unan')) return [12.1125, -86.2735];
  if (q.includes('rotonda centroamérica') || q.includes('centroamerica')) return [12.1120, -86.2480];
  if (q.includes('santo domingo')) return [12.0970, -86.2420];
  if (q.includes('hugo chávez') || q.includes('plaza inter') || q.includes('bolonia')) return [12.1432, -86.2758];

  // 5. Zonas y Barrios de Managua
  if (q.includes('robles') || q.includes('hippos') || q.includes('zona viva')) return [12.1264, -86.2652];
  if (q.includes('altamira')) return [12.1158, -86.2589];
  if (q.includes('villa fontana')) return [12.1110, -86.2685];
  if (q.includes('bello horizonte')) return [12.1415, -86.2301];
  if (q.includes('linda vista')) return [12.1489, -86.3021];
  if (q.includes('multicentro') || q.includes('americas') || q.includes('américas')) return [12.1384, -86.2189];
  if (q.includes('monseñor') || q.includes('batahola') || q.includes('lezcano')) return [12.1402, -86.2954];
  if (q.includes('colinas') || q.includes('las colinas')) return [12.0850, -86.2250];
  if (q.includes('oriental') || q.includes('mercado oriental')) return [12.1410, -86.2520];
  if (q.includes('huembes') || q.includes('roberto huembes')) return [12.1205, -86.2435];
  if (q.includes('mayoreo')) return [12.1450, -86.2050];
  if (q.includes('ciudad jardín') || q.includes('ciudad jardin')) return [12.1390, -86.2550];
  if (q.includes('reparto san juan')) return [12.1210, -86.2690];
  if (q.includes('san judas')) return [12.1120, -86.2980];
  if (q.includes('altagracia')) return [12.1310, -86.2890];
  if (q.includes('carretera a masaya') || q.includes('km 9') || q.includes('km 10') || q.includes('km 11')) return [12.0750, -86.2150];
  if (q.includes('carretera norte') || q.includes('aeropuerto')) return [12.1480, -86.1750];
  if (q.includes('carretera sur') || q.includes('el crucero')) return [12.0950, -86.3120];
  if (q.includes('ciudad sandino')) return [12.1580, -86.3450];
  if (q.includes('tipitapa')) return [12.1980, -86.0950];
  if (q.includes('ticuantepe')) return [12.0220, -86.2050];

  // 6. Departamentos y Municipios de Nicaragua
  if (q.includes('masaya')) return [11.9744, -86.0942];
  if (q.includes('granada')) return [11.9299, -85.9560];
  if (q.includes('león') || q.includes('leon')) return [12.4379, -86.8780];
  if (q.includes('chinandega')) return [12.6294, -87.1311];
  if (q.includes('matagalpa')) return [12.9256, -85.9175];
  if (q.includes('estelí') || q.includes('esteli')) return [13.0919, -86.3538];
  if (q.includes('jinotega')) return [13.0997, -85.9992];
  if (q.includes('rivas') || q.includes('san juan del sur')) return [11.4372, -85.8263];
  if (q.includes('carazo') || q.includes('jinotepe') || q.includes('diriamba')) return [11.8496, -86.1994];
  if (q.includes('juigalpa') || q.includes('chontales')) return [12.1063, -85.3645];
  if (q.includes('bluefields')) return [12.0137, -83.7635];
  if (q.includes('puerto cabezas') || q.includes('bilwi')) return [14.0350, -83.3888];
  if (q.includes('central') || q.includes('managua')) return [12.1365, -86.2514];

  // 7. Fallback limpio sin distorsiones aleatorias
  return fallback;
}

/**
 * Dynamic Hybrid Geocoding API for Nicaragua.
 * 1. Checks Highway Kilometer resolver (Km X Carretera a Masaya/Norte/Sur/León).
 * 2. Checks Instant Local POI Database (0ms latency, high precision).
 * 3. Cascades to OpenStreetMap / Nominatim Nicaragua for unlisted addresses.
 */
export async function buscarUbicacionDinamica(query: string): Promise<Array<{ display_name: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results: Array<{ display_name: string; lat: number; lng: number }> = [];

  // Step 1: Check Highway Kilometer match
  const kmMatch = resolverKilometroCarretera(q);
  if (kmMatch) {
    results.push({
      display_name: `${kmMatch.descripcion} — Carretera Nacional (Carretera)`,
      lat: kmMatch.coordenadas[0],
      lng: kmMatch.coordenadas[1],
    });
  }

  // Step 2: Match local Nicaraguan Master POIs
  const matchedPois = NICARAGUA_MASTER_POIS.filter((poi) => {
    return (
      poi.nombre.toLowerCase().includes(q) ||
      poi.alias.some((a) => a.includes(q) || q.includes(a)) ||
      poi.direccion.toLowerCase().includes(q) ||
      poi.categoria.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    const aName = a.nombre.toLowerCase();
    const bName = b.nombre.toLowerCase();
    const aExact = aName.startsWith(q) || a.alias.some((al) => al.startsWith(q));
    const bExact = bName.startsWith(q) || b.alias.some((al) => al.startsWith(q));
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });

  matchedPois.slice(0, 6).forEach((poi) => {
    if (!results.some((r) => Math.abs(r.lat - poi.lat) < 0.0005 && Math.abs(r.lng - poi.lng) < 0.0005)) {
      results.push({
        display_name: `${poi.nombre} — ${poi.direccion} (${poi.categoria})`,
        lat: poi.lat,
        lng: poi.lng,
      });
    }
  });

  // Step 3: If few results, query OpenStreetMap Nominatim Nicaragua
  if (results.length < 4) {
    const encodedQuery = encodeURIComponent(`${query.trim()}, Nicaragua`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=4&countrycodes=ni`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'es-NI,es;q=0.9',
          'User-Agent': 'LogifastApp/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        data.forEach((item: any) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          // Avoid duplicate coordinates
          if (!results.some((r) => Math.abs(r.lat - lat) < 0.001 && Math.abs(r.lng - lon) < 0.001)) {
            results.push({
              display_name: item.display_name,
              lat,
              lng: lon,
            });
          }
        });
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }

  return results.slice(0, 6);
}

/**
 * Reverse Geocoding using OpenStreetMap Nominatim for Nicaragua.
 * Converts lat & lng coordinates into a clean human-readable address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!lat || !lng || (lat === 0 && lng === 0)) return 'Ubicación seleccionada';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'es-NI,es;q=0.9',
        'User-Agent': 'LogifastApp/1.0',
      },
    });
    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);
    console.warn('[reverseGeocode error]', err);
  }

  return `Punto GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}
