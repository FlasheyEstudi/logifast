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
 * Master Reference Points of Nicaragua (POIs Nicas Nativos).
 * Exhaustive database of landmarks, malls, roundabouts, hospitals, universities, markets and cities.
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
  // ─── Centros Comerciales y Plazas ───
  { nombre: 'Metrocentro Managua', alias: ['metrocentro', 'metro', 'plaza metrocentro'], categoria: 'Centro Comercial', direccion: 'Pista Juan Pablo II, Rotonda Rubén Darío', lat: 12.1264, lng: -86.2652 },
  { nombre: 'Galerías Santo Domingo', alias: ['galerias', 'galerias santo domingo', 'zona viva'], categoria: 'Centro Comercial', direccion: 'Km 6.5 Carretera a Masaya', lat: 12.0970, lng: -86.2420 },
  { nombre: 'Multicentro Las Américas', alias: ['multicentro americas', 'multicentro', 'las americas'], categoria: 'Centro Comercial', direccion: 'Pista de la Resistencia, Bello Horizonte', lat: 12.1384, lng: -86.2189 },
  { nombre: 'Plaza Inter', alias: ['plaza inter', 'intercontinental', 'crowne plaza'], categoria: 'Centro Comercial', direccion: 'Barrio Bolonia, frente al Monumento a Sandino', lat: 12.1432, lng: -86.2758 },
  { nombre: 'Plaza España', alias: ['plaza españa', 'banpro plaza españa', 'edificio pellas'], categoria: 'Plaza Comercial', direccion: 'Rotonda El Güegüense, Bolonia', lat: 12.1322, lng: -86.2810 },
  { nombre: 'Plaza Once', alias: ['plaza once', 'km 11 masaya'], categoria: 'Plaza Comercial', direccion: 'Km 11.5 Carretera a Masaya', lat: 12.0720, lng: -86.2130 },
  { nombre: 'Plaza Familiar', alias: ['plaza familiar', 'km 7.5 masaya'], categoria: 'Plaza Comercial', direccion: 'Km 7.5 Carretera a Masaya', lat: 12.1030, lng: -86.2390 },
  { nombre: 'Plaza Natura', alias: ['plaza natura', 'suburbana'], categoria: 'Plaza Comercial', direccion: 'Pista Suburbana, frente a UNAN-Managua', lat: 12.1090, lng: -86.2730 },
  { nombre: 'Multicentro Las Brisas', alias: ['las brisas', 'multicentro brisas'], categoria: 'Centro Comercial', direccion: 'Pista Portezuelo, Linda Vista', lat: 12.1520, lng: -86.3050 },
  { nombre: 'Puerto Salvador Allende', alias: ['puerto salvador allende', 'malecon de managua', 'salvador allende'], categoria: 'Turismo y Restaurantes', direccion: 'Paseo Xolotlán, Malecón de Managua', lat: 12.1610, lng: -86.2780 },
  { nombre: 'Plaza La Fe', alias: ['plaza de la fe', 'plaza juan pablo ii'], categoria: 'Plaza Pública', direccion: 'Paseo de los Estudiantes, Malecón', lat: 12.1585, lng: -86.2735 },

  // ─── Rotondas y Pasos a Desnivel ───
  { nombre: 'Rotonda Rubén Darío (Metrocentro)', alias: ['rotonda metrocentro', 'rotonda ruben dario'], categoria: 'Rotonda', direccion: 'Pista Juan Pablo II / Paseo Unión Europea', lat: 12.1265, lng: -86.2655 },
  { nombre: 'Rotonda El Güegüense', alias: ['rotonda gueguense', 'el gueguense', 'plaza españa rotonda'], categoria: 'Rotonda', direccion: 'Plaza España, Bolonia', lat: 12.1320, lng: -86.2815 },
  { nombre: 'Rotonda El Periodista', alias: ['rotonda el periodista', 'periodista'], categoria: 'Rotonda', direccion: 'Pista Juan Pablo II, cerca de ENEL Central', lat: 12.1220, lng: -86.2865 },
  { nombre: 'Rotonda Jean Paul Genie', alias: ['rotonda jean paul genie', 'jean paul genie', 'club terraza'], categoria: 'Rotonda', direccion: 'Pista Jean Paul Genie / Carretera a Masaya', lat: 12.1010, lng: -86.2440 },
  { nombre: 'Rotonda Cristo Rey', alias: ['rotonda cristo rey', 'cristo rey'], categoria: 'Rotonda', direccion: 'Pista de la Resistencia / Santo Domingo', lat: 12.1330, lng: -86.2570 },
  { nombre: 'Rotonda La Virgen', alias: ['rotonda la virgen', 'la virgen'], categoria: 'Rotonda', direccion: 'Pista Portezuelo / Villa Progreso', lat: 12.1465, lng: -86.2195 },
  { nombre: 'Rotonda Bello Horizonte', alias: ['rotonda bello horizonte'], categoria: 'Rotonda', direccion: 'Colonia Bello Horizonte', lat: 12.1415, lng: -86.2301 },
  { nombre: 'Rotonda Centroamérica', alias: ['rotonda centroamerica', 'centroamerica'], categoria: 'Rotonda', direccion: 'Pista Solidaridad / Carretera a Masaya', lat: 12.1140, lng: -86.2490 },
  { nombre: 'Rotonda Hugo Chávez', alias: ['rotonda hugo chavez', 'bolivar'], categoria: 'Rotonda', direccion: 'Avenida Bolívar, Managua', lat: 12.1520, lng: -86.2730 },
  { nombre: 'Paso a Desnivel Nejapa (7 Sur)', alias: ['7 sur', 'paso a desnivel nejapa', 'siete sur'], categoria: 'Paso a Desnivel', direccion: 'Carretera Sur / Pista Juan Pablo II', lat: 12.1120, lng: -86.3110 },
  { nombre: 'Paso a Desnivel Rubenia', alias: ['rubenia', 'paso a desnivel rubenia'], categoria: 'Paso a Desnivel', direccion: 'Pista Solidaridad, Rubenia', lat: 12.1270, lng: -86.2310 },
  { nombre: 'Paso a Desnivel Las Piedrecitas', alias: ['las piedrecitas', 'piedrecitas'], categoria: 'Paso a Desnivel', direccion: 'Carretera Nueva a León / Carretera Sur', lat: 12.1410, lng: -86.3240 },

  // ─── Mercados Populares ───
  { nombre: 'Mercado Oriental', alias: ['mercado oriental', 'el oriental', 'gancho de caminos', 'ciudad jardin mercado'], categoria: 'Mercado', direccion: 'Calle 15 de Septiembre, Managua', lat: 12.1410, lng: -86.2520 },
  { nombre: 'Mercado Roberto Huembes', alias: ['mercado huembes', 'huembes', 'terminal huembes'], categoria: 'Mercado', direccion: 'Pista Solidaridad, Managua', lat: 12.1225, lng: -86.2365 },
  { nombre: 'Mercado Iván Montenegro', alias: ['mercado ivan montenegro', 'ivan montenegro', 'el ivan'], categoria: 'Mercado', direccion: 'Pista Larreynaga, Managua', lat: 12.1310, lng: -86.2080 },
  { nombre: 'Mercado Israel Lewites', alias: ['mercado israel lewites', 'israel lewites', 'el boer'], categoria: 'Mercado', direccion: 'Pista Juan Pablo II, San Judas', lat: 12.1290, lng: -86.3010 },
  { nombre: 'Mercado Mayoreo', alias: ['mercado mayoreo', 'mayoreo', 'terminal mayoreo'], categoria: 'Mercado', direccion: 'Carretera Norte hacia adentro, Managua', lat: 12.1440, lng: -86.1960 },

  // ─── Hospitales y Clínicas ───
  { nombre: 'Hospital Militar Dr. Alejandro Dávila Bolaños', alias: ['hospital militar', 'militar'], categoria: 'Hospital', direccion: 'Pistas Unidas, Bolonia', lat: 12.1380, lng: -86.2720 },
  { nombre: 'Hospital Metropolitano Vivian Pellas', alias: ['hospital vivian pellas', 'vivian pellas', 'pellas'], categoria: 'Hospital', direccion: 'Km 9.8 Carretera a Masaya', lat: 12.0835, lng: -86.2235 },
  { nombre: 'Hospital Bautista', alias: ['hospital bautista', 'bautista'], categoria: 'Hospital', direccion: 'Barrio Largaespada, Managua', lat: 12.1390, lng: -86.2630 },
  { nombre: 'Hospital Monte España', alias: ['hospital monte españa', 'monte españa'], categoria: 'Hospital', direccion: 'Villa Fontana, Managua', lat: 12.1160, lng: -86.2620 },
  { nombre: 'Hospital Salud Integral', alias: ['hospital salud integral', 'salud integral'], categoria: 'Hospital', direccion: 'Barrio Santa Ana, Managua', lat: 12.1470, lng: -86.2880 },
  { nombre: 'Hospital Fernando Vélez Paiz', alias: ['hospital velez paiz', 'velez paiz'], categoria: 'Hospital', direccion: 'Paso a Desnivel 7 Sur', lat: 12.1180, lng: -86.3120 },
  { nombre: 'Hospital Manolo Morales Peralta', alias: ['hospital manolo morales', 'manolo morales'], categoria: 'Hospital', direccion: 'Pista Solidaridad, frente a Roberto Huembes', lat: 12.1205, lng: -86.2370 },
  { nombre: 'Hospital Bertha Calderón', alias: ['hospital bertha calderon', 'bertha calderon'], categoria: 'Hospital', direccion: 'Pista Juan Pablo II, cerca de El Zumen', lat: 12.1240, lng: -86.2970 },

  // ─── Universidades ───
  { nombre: 'UNAN-Managua (RURD)', alias: ['unan', 'unan managua', 'recinto ruben dario'], categoria: 'Universidad', direccion: 'Pista Suburbana, Villa Fontana', lat: 12.1090, lng: -86.2690 },
  { nombre: 'UNI - Universidad Nacional de Ingeniería', alias: ['uni', 'uni central', 'simon bolivar'], categoria: 'Universidad', direccion: 'Avenida Universitaria, Managua', lat: 12.1315, lng: -86.2710 },
  { nombre: 'UAM - Universidad Americana', alias: ['uam', 'universidad americana'], categoria: 'Universidad', direccion: 'Costado sur de Villa Fontana', lat: 12.1120, lng: -86.2590 },
  { nombre: 'Universidad Casimiro Sotelo (Ex UCA)', alias: ['uca', 'casimiro sotelo', 'universidad centroamericana'], categoria: 'Universidad', direccion: 'Avenida Universitaria, Managua', lat: 12.1280, lng: -86.2710 },
  { nombre: 'UPOLI - Universidad Politécnica', alias: ['upoli', 'universidad politecnica'], categoria: 'Universidad', direccion: 'Colonia Rafaela Herrera, Managua', lat: 12.1460, lng: -86.2150 },
  { nombre: 'UNICIT', alias: ['unicit', 'universidad iberoamericana'], categoria: 'Universidad', direccion: 'Pista Jean Paul Genie', lat: 12.1140, lng: -86.2520 },

  // ─── Colonias y Zonas Residenciales ───
  { nombre: 'Colonia Los Robles', alias: ['los robles', 'robles'], categoria: 'Zona Residencial', direccion: 'Plaza Cuba hacia adentro, Managua', lat: 12.1240, lng: -86.2620 },
  { nombre: 'Altamira D\'Este', alias: ['altamira', 'altamira deste'], categoria: 'Zona Residencial y Comercial', direccion: 'Pista Jean Paul Genie hacia el norte', lat: 12.1180, lng: -86.2560 },
  { nombre: 'Villa Fontana', alias: ['villa fontana', 'fontana'], categoria: 'Zona Residencial', direccion: 'Club Terraza hacia el oeste', lat: 12.1100, lng: -86.2610 },
  { nombre: 'Las Colinas', alias: ['las colinas', 'colinas'], categoria: 'Zona Residencial', direccion: 'Km 8 Carretera a Masaya', lat: 12.0850, lng: -86.2250 },
  { nombre: 'Santo Domingo', alias: ['santo domingo residencial', 'santo domingo'], categoria: 'Zona Residencial', direccion: 'Camino a Santo Domingo, Managua', lat: 12.0940, lng: -86.2390 },
  { nombre: 'Colonia Bello Horizonte', alias: ['bello horizonte', 'bello horisonte'], categoria: 'Zona Residencial', direccion: 'Rotonda Bello Horizonte', lat: 12.1415, lng: -86.2301 },
  { nombre: 'Barrio Bolonia', alias: ['bolonia', 'barrio bolonia'], categoria: 'Barrio', direccion: 'Plaza España hacia Plaza Inter', lat: 12.1370, lng: -86.2800 },
  { nombre: 'Linda Vista', alias: ['linda vista', 'lindavista'], categoria: 'Zona Residencial', direccion: 'Carretera Norte a Carretera Sur', lat: 12.1489, lng: -86.3021 },
  { nombre: 'Barrio Altagracia', alias: ['altagracia'], categoria: 'Barrio', direccion: 'Pista Benjamín Zeledón', lat: 12.1340, lng: -86.2920 },
  { nombre: 'Monseñor Lezcano', alias: ['monseñor lezcano', 'lezcano'], categoria: 'Barrio', direccion: 'Estatua de Monseñor Lezcano', lat: 12.1460, lng: -86.2920 },
  { nombre: 'Barrio San Judas', alias: ['san judas'], categoria: 'Barrio', direccion: 'Pista Suburbana hacia el sur', lat: 12.1120, lng: -86.2980 },
  { nombre: 'Ciudad Sandino', alias: ['ciudad sandino', 'sandino'], categoria: 'Municipio', direccion: 'Plaza Padre Miguel, Ciudad Sandino', lat: 12.1580, lng: -86.3450 },
  { nombre: 'Tipitapa', alias: ['tipitapa', 'parque tipitapa'], categoria: 'Municipio', direccion: 'Parque Central de Tipitapa', lat: 12.1970, lng: -86.0960 },
  { nombre: 'Ticuantepe', alias: ['ticuantepe'], categoria: 'Municipio', direccion: 'Parque Central de Ticuantepe', lat: 12.0220, lng: -86.2050 },
  { nombre: 'Aeropuerto Internacional Augusto C. Sandino (MGA)', alias: ['aeropuerto', 'aeropuerto managua', 'aeropuerto sandino'], categoria: 'Aeropuerto', direccion: 'Km 11 Carretera Norte, Managua', lat: 12.1420, lng: -86.1680 },

  // ─── Departamentos y Ciudades Principales ───
  { nombre: 'Masaya (Parque Central)', alias: ['masaya', 'mercado de artesanias masaya'], categoria: 'Departamento', direccion: 'Centro Histórico, Masaya', lat: 11.9740, lng: -86.0940 },
  { nombre: 'Granada (Parque Central / Calle La Calzada)', alias: ['granada', 'calle la calzada'], categoria: 'Departamento', direccion: 'Parque Central Colón, Granada', lat: 11.9298, lng: -85.9560 },
  { nombre: 'León (Catedral de León)', alias: ['leon', 'catedral de leon'], categoria: 'Departamento', direccion: 'Plaza Central de León', lat: 12.4350, lng: -86.8790 },
  { nombre: 'Rivas (Parque Central)', alias: ['rivas'], categoria: 'Departamento', direccion: 'Parque Central de Rivas', lat: 11.4370, lng: -85.8260 },
  { nombre: 'San Juan del Sur', alias: ['san juan del sur', 'bahia san juan del sur'], categoria: 'Turismo', direccion: 'Bahía de San Juan del Sur, Rivas', lat: 11.2530, lng: -85.8700 },
  { nombre: 'Matagalpa (Parque Morazán)', alias: ['matagalpa'], categoria: 'Departamento', direccion: 'Centro de Matagalpa', lat: 12.9250, lng: -85.9170 },
  { nombre: 'Estelí (Parque Central)', alias: ['esteli'], categoria: 'Departamento', direccion: 'Parque Central de Estelí', lat: 13.0920, lng: -85.3580 },
  { nombre: 'Chinandega (Parque Central)', alias: ['chinandega'], categoria: 'Departamento', direccion: 'Centro de Chinandega', lat: 12.6290, lng: -87.1310 },
  { nombre: 'Jinotepe, Carazo', alias: ['jinotepe', 'carazo'], categoria: 'Departamento', direccion: 'Parque Central de Jinotepe', lat: 11.8500, lng: -86.1990 },
];

/**
 * Resolves Managua and Nicaragua addresses to latitude & longitude coordinates.
 */
export function geocodeAddress(
  address: string,
  fallback: [number, number] = [12.1365, -86.2514]
): [number, number] {
  if (!address || typeof address !== 'string') return fallback;
  const q = address.toLowerCase().trim();

  // 1. Search in Master Nicaragua POIs
  for (const poi of NICARAGUA_MASTER_POIS) {
    if (poi.nombre.toLowerCase().includes(q) || poi.alias.some((a) => q.includes(a) || a.includes(q))) {
      return [poi.lat, poi.lng];
    }
  }

  // 2. Hash-based fallback with deterministic regional jitter
  let hash = 0;
  for (let i = 0; i < address.length; i++) hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  const latOffset = ((hash % 100) - 50) * 0.0006;
  const lngOffset = (((hash >> 3) % 100) - 50) * 0.0006;

  return [fallback[0] + latOffset, fallback[1] + lngOffset];
}

/**
 * Dynamic Hybrid Geocoding API for Nicaragua.
 * 1. Checks Instant Local POI Database (0ms latency, high precision).
 * 2. Cascades to OpenStreetMap / Nominatim Nicaragua for unlisted addresses.
 */
export async function buscarUbicacionDinamica(query: string): Promise<Array<{ display_name: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results: Array<{ display_name: string; lat: number; lng: number }> = [];

  // Step 1: Match local Nicaraguan Master POIs
  const matchedPois = NICARAGUA_MASTER_POIS.filter((poi) => {
    return (
      poi.nombre.toLowerCase().includes(q) ||
      poi.alias.some((a) => a.includes(q) || q.includes(a)) ||
      poi.direccion.toLowerCase().includes(q) ||
      poi.categoria.toLowerCase().includes(q)
    );
  });

  matchedPois.slice(0, 4).forEach((poi) => {
    results.push({
      display_name: `${poi.nombre} — ${poi.direccion} (${poi.categoria})`,
      lat: poi.lat,
      lng: poi.lng,
    });
  });

  // Step 2: If few results, query OpenStreetMap Nominatim Nicaragua
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
