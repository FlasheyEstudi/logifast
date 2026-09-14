// lib/location-parser.ts
import { reverseGeocode, buscarUbicacionDinamica } from './osrm';

export interface UbicacionParseada {
  exito: boolean;
  lat: number;
  lng: number;
  direccionTexto: string;
  fuente: 'whatsapp' | 'telegram' | 'google_maps' | 'geo_uri' | 'coordenadas' | 'texto';
  mensajeDetalle?: string;
  rawInput: string;
}

/**
 * Valida si las coordenadas se encuentran en un rango geográfico plausible para Nicaragua / Centroamérica
 */
function sonCoordenadasValidas(lat: number, lng: number): boolean {
  if (isNaN(lat) || isNaN(lng)) return false;
  // Latitud mundial [-90, 90], Longitud [-180, 180]
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Nicaragua / Centroamérica aproximado: lat [10.0, 16.0], lng [-88.0, -82.0]
  return true;
}

/**
 * Parser inteligente de ubicaciones compartidas desde WhatsApp, Telegram, Google Maps o coordenadas directas.
 */
export async function parsearUbicacionCompartida(rawText: string): Promise<UbicacionParseada> {
  if (!rawText || rawText.trim().length === 0) {
    return {
      exito: false,
      lat: 0,
      lng: 0,
      direccionTexto: '',
      fuente: 'texto',
      mensajeDetalle: 'Texto de ubicación vacío',
      rawInput: rawText || '',
    };
  }

  const clean = rawText.trim();

  // 1. Detección de URI 'geo:' (Compartir nativo de Telegram y Android)
  // Ej: geo:12.136389,-86.251389?z=17 o geo:12.136389,-86.251389
  const geoUriMatch = clean.match(/geo:([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/i);
  if (geoUriMatch) {
    const lat = parseFloat(geoUriMatch[1]);
    const lng = parseFloat(geoUriMatch[2]);
    if (sonCoordenadasValidas(lat, lng)) {
      const direccion = await reverseGeocode(lat, lng);
      return {
        exito: true,
        lat,
        lng,
        direccionTexto: direccion,
        fuente: 'telegram',
        mensajeDetalle: 'Ubicación recibida vía Telegram / Geo URI',
        rawInput: clean,
      };
    }
  }

  // 2. Enlaces estándar de Google Maps compartidos por WhatsApp y Telegram
  // Ej: https://maps.google.com/?q=12.136389,-86.251389
  // Ej: https://www.google.com/maps?q=12.136389,-86.251389
  // Ej: https://www.google.com/maps/search/?api=1&query=12.136389,-86.251389
  // Ej: https://maps.google.com/maps?q=loc:12.136389,-86.251389
  const gmapsQueryMatch = clean.match(
    /(?:https?:\/\/)?(?:www\.)?(?:maps\.google\.[a-z.]+|google\.[a-z.]+\/maps)[^\s]*[?&](?:q|query|loc)=([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)/i
  );
  if (gmapsQueryMatch) {
    const lat = parseFloat(gmapsQueryMatch[1]);
    const lng = parseFloat(gmapsQueryMatch[2]);
    if (sonCoordenadasValidas(lat, lng)) {
      const direccion = await reverseGeocode(lat, lng);
      return {
        exito: true,
        lat,
        lng,
        direccionTexto: direccion,
        fuente: clean.toLowerCase().includes('whatsapp') ? 'whatsapp' : 'google_maps',
        mensajeDetalle: 'Ubicación extraída de Google Maps / WhatsApp',
        rawInput: clean,
      };
    }
  }

  // 3. Enlaces de Google Maps con pin de lugar (@lat,lng)
  // Ej: https://www.google.com/maps/place/Managua/@12.136389,-86.251389,17z
  const gmapsPlaceMatch = clean.match(
    /(?:https?:\/\/)?(?:www\.)?(?:maps\.google\.[a-z.]+|google\.[a-z.]+\/maps)[^\s]*@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/i
  );
  if (gmapsPlaceMatch) {
    const lat = parseFloat(gmapsPlaceMatch[1]);
    const lng = parseFloat(gmapsPlaceMatch[2]);
    if (sonCoordenadasValidas(lat, lng)) {
      const direccion = await reverseGeocode(lat, lng);
      return {
        exito: true,
        lat,
        lng,
        direccionTexto: direccion,
        fuente: 'google_maps',
        mensajeDetalle: 'Ubicación identificada desde Google Maps Place',
        rawInput: clean,
      };
    }
  }

  // 4. Enlaces cortos de Google Maps (maps.app.goo.gl o goo.gl/maps)
  // Ej: https://maps.app.goo.gl/abcdefg
  const shortLinkMatch = clean.match(/(https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps)\/[A-Za-z0-9_-]+)/i);
  if (shortLinkMatch) {
    const shortUrl = shortLinkMatch[1];
    try {
      // Intentar resolver enlace corto a través de endpoint de servidor para evitar CORS
      const expandRes = await fetch(`/api/expand-url?url=${encodeURIComponent(shortUrl)}`, { cache: 'no-store' });
      if (expandRes.ok) {
        const expandData = await expandRes.json();
        if (expandData.lat && expandData.lng) {
          const lat = parseFloat(expandData.lat);
          const lng = parseFloat(expandData.lng);
          const direccion = expandData.direccion || (await reverseGeocode(lat, lng));
          return {
            exito: true,
            lat,
            lng,
            direccionTexto: direccion,
            fuente: 'whatsapp',
            mensajeDetalle: 'Ubicación resuelta desde enlace corto de WhatsApp',
            rawInput: clean,
          };
        }
      }
    } catch {
      // Continuar con otros fallbacks
    }
  }

  // 5. Coordenadas directas en texto plano
  // Ej: "12.136389, -86.251389" o "12.136389 -86.251389"
  const rawCoordsMatch = clean.match(/([+-]?\d{1,2}(?:\.\d+)?)[,\s]+([+-]?\d{1,3}(?:\.\d+)?)/);
  if (rawCoordsMatch) {
    const lat = parseFloat(rawCoordsMatch[1]);
    const lng = parseFloat(rawCoordsMatch[2]);
    // Verificar que parezcan coordenadas de Nicaragua o válidas
    if (sonCoordenadasValidas(lat, lng) && ((lat >= 10 && lat <= 16 && lng <= -80 && lng >= -90) || (lat !== 0 && lng !== 0))) {
      const direccion = await reverseGeocode(lat, lng);
      return {
        exito: true,
        lat,
        lng,
        direccionTexto: direccion,
        fuente: 'coordenadas',
        mensajeDetalle: `Punto GPS detectado: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        rawInput: clean,
      };
    }
  }

  // 6. Si es un texto o nombre de lugar, intentar geocodificarlo con el motor de Nicaragua
  const searchResults = await buscarUbicacionDinamica(clean);
  if (searchResults && searchResults.length > 0) {
    const top = searchResults[0];
    return {
      exito: true,
      lat: top.lat,
      lng: top.lng,
      direccionTexto: top.display_name,
      fuente: 'texto',
      mensajeDetalle: 'Dirección localizada con precisión en Managua / Nicaragua',
      rawInput: clean,
    };
  }

  return {
    exito: false,
    lat: 0,
    lng: 0,
    direccionTexto: clean,
    fuente: 'texto',
    mensajeDetalle: 'No se encontraron coordenadas en el texto compartido',
    rawInput: clean,
  };
}
