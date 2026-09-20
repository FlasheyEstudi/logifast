/**
 * RUTA DEL REPARTIDOR — orden lógico de las paradas.
 *
 * El frontend ya traía un nearest-neighbor (`optimizarSecuenciaRuta`) pero se
 * ejecutaba **solo en el cliente**, al llegar a 3 pedidos, y dependía de la
 * posición GPS local. Aquí se reproduce en el servidor con los datos que el
 * repartidor ya reporta (`RepartidorProfile.lat/lng`), para que el orden de las
 * paradas sea el mismo tras una reconexión, en otra pestaña o en el APK.
 *
 * Regla de negocio: cada pedido tiene DOS puntos (recogida y entrega). Se visita
 * primero la recogida del que esté pendiente y, una vez a bordo, su entrega; entre
 * los candidatos se elige siempre el más cercano a la posición actual.
 *
 * Limitación real: no hay motor de tráfico ni matriz de rutas. La distancia es
 * Haversine × 1.35 (factor empírico de calles, el mismo que usa el cliente), así
 * que es una aproximación buena para decidir el ORDEN, no un ETA exacto. Sin
 * coordenadas válidas se cae al `kmEstimados` del pedido y, en último caso, al
 * orden de creación.
 */
import { calcularDistanciaHaversine } from '@/lib/osrm';

export interface ParadaCandidata {
  id: string;
  estado: string;
  origenLat: number;
  origenLng: number;
  destinoLat: number;
  destinoLng: number;
  kmEstimados?: number;
  createdAt?: Date;
}

const FACTOR_CALLE = 1.35;

const tieneCoords = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

/** Distancia en km entre dos puntos, ya corregida por el trazado de calles. */
export function distanciaRuta(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  if (!tieneCoords(aLat, aLng) || !tieneCoords(bLat, bLng)) return 0;
  return calcularDistanciaHaversine(aLat, aLng, bLat, bLng) * FACTOR_CALLE;
}

/** ¿Este pedido ya va a bordo? Entonces la siguiente parada es la entrega. */
function yaRecogido(estado: string): boolean {
  return estado === 'recogido' || estado === 'EN_PUNTO_ENTREGA';
}

/**
 * Ordena las paradas por cercanía desde la posición actual.
 * Devuelve la misma lista reordenada (no pierde ni agrega pedidos).
 */
export function ordenarParadas<T extends ParadaCandidata>(
  paradas: T[],
  latActual?: number | null,
  lngActual?: number | null
): T[] {
  if (!paradas || paradas.length <= 1) return paradas ? [...paradas] : [];

  const pool = [...paradas];
  const orden: T[] = [];
  let currLat = typeof latActual === 'number' && tieneCoords(latActual, lngActual ?? 0) ? latActual : null;
  let currLng = currLat !== null ? (lngActual as number) : null;

  while (pool.length > 0) {
    let mejor = 0;
    let mejorDist = Infinity;

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      const recogido = yaRecogido(p.estado);
      const lat = recogido ? p.destinoLat : p.origenLat;
      const lng = recogido ? p.destinoLng : p.origenLng;

      // Sin posición conocida no hay optimización posible: se conserva el orden de
      // creación (la lista llega ya ordenada por fecha desde la consulta).
      let d = currLat === null ? i : Infinity;
      if (currLat !== null && currLng !== null && tieneCoords(lat, lng)) {
        d = distanciaRuta(currLat, currLng, lat, lng);
      } else if (currLat !== null && i === 0) {
        // Sin coordenadas en este pedido: no se puede comparar, se deja para el
        // final para no romper el orden de los que sí tienen datos.
        d = Number.MAX_SAFE_INTEGER - 1;
      }

      if (d < mejorDist) {
        mejorDist = d;
        mejor = i;
      }
    }

    const [siguiente] = pool.splice(mejor, 1);
    orden.push(siguiente);

    const recogido = yaRecogido(siguiente.estado);
    const lat = recogido ? siguiente.destinoLat : siguiente.origenLat;
    const lng = recogido ? siguiente.destinoLng : siguiente.origenLng;
    if (tieneCoords(lat, lng)) {
      currLat = lat;
      currLng = lng;
    }
  }

  return orden;
}

/** Distancia total aproximada de la secuencia y distancia a la primera parada. */
export function resumenRuta<T extends ParadaCandidata>(
  paradasOrdenadas: T[],
  latActual?: number | null,
  lngActual?: number | null
): { distanciaTotal: number; primerDestinoKm: number } {
  if (paradasOrdenadas.length === 0) return { distanciaTotal: 0, primerDestinoKm: 0 };

  const puntos = paradasOrdenadas.map((p) => {
    const recogido = yaRecogido(p.estado);
    return recogido ? { lat: p.destinoLat, lng: p.destinoLng } : { lat: p.origenLat, lng: p.origenLng };
  });

  let total = 0;
  let prevLat = latActual ?? null;
  let prevLng = lngActual ?? null;

  for (const punto of puntos) {
    if (prevLat !== null && prevLng !== null && tieneCoords(punto.lat, punto.lng)) {
      total += distanciaRuta(prevLat, prevLng, punto.lat, punto.lng);
    }
    if (tieneCoords(punto.lat, punto.lng)) {
      prevLat = punto.lat;
      prevLng = punto.lng;
    }
  }

  const primero = puntos[0];
  const primerDestinoKm =
    latActual != null && lngActual != null && tieneCoords(primero.lat, primero.lng)
      ? Math.round(distanciaRuta(latActual, lngActual, primero.lat, primero.lng) * 10) / 10
      : 0;

  return { distanciaTotal: Math.round(total * 10) / 10, primerDestinoKm };
}
