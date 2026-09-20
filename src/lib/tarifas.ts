/**
 * TARIFAS DEL SERVIDOR — el precio lo decide el backend, nunca el navegador.
 *
 * Antes `POST /api/ordenes` aceptaba el `monto` que mandaba el cliente si superaba
 * el 80% de la tarifa calculada, así que un POST a mano pagaba hasta un 20% menos
 * (y bajaba la ganancia del repartidor, que también viajaba en el body).
 *
 * Aquí se centraliza el cálculo para que envíos, compras y pedidos recurrentes
 * usen exactamente la misma fórmula. Los datos que el cliente SÍ puede mandar son
 * los que definen el servicio (origen, destino, tamaño, fragilidad); el precio y
 * la ganancia salen de aquí.
 */
import { db } from '@/lib/db';
import { calcularDistanciaHaversine, calcularTiempoEstimado } from '@/lib/osrm';

export interface Tarifas {
  tarifaBase: number;
  costoEnvioKm: number;
  kmIncluidos: number;
}

const FALLBACK: Tarifas = { tarifaBase: 40, costoEnvioKm: 15, kmIncluidos: 2 };

/** Recargos por características del paquete, en córdobas. */
export const RECARGO_FRAGIL = 20;
export const RECARGO_TAMANO: Record<string, number> = { Mediano: 15, Grande: 30 };

/** Porcentaje de la tarifa que se lleva el repartidor en un envío de paquete. */
export const PARTICIPACION_REPARTIDOR = 0.7;

/** Tarifa global configurable desde admin (`AppConfig`, fila id=1). */
export async function getTarifas(): Promise<Tarifas> {
  const cfg = await db.appConfig.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    tarifaBase: cfg?.tarifaBase ?? FALLBACK.tarifaBase,
    costoEnvioKm: cfg?.costoEnvioKm ?? FALLBACK.costoEnvioKm,
    kmIncluidos: FALLBACK.kmIncluidos,
  };
}

export interface CalculoTarifa {
  km: number;
  tiempoEstimado: number;
  monto: number;
  ganancia: number;
  desglose: { concepto: string; monto: number }[];
}

/**
 * Calcula la tarifa oficial de un envío a partir de datos que el cliente no puede
 * inventar sin que se note: la distancia se recalcula en el servidor y solo se
 * acepta un `kmEstimados` mayor si el geocoding no dio coordenadas.
 */
export async function calcularTarifaEnvio(args: {
  origenLat: number;
  origenLng: number;
  destinoLat: number;
  destinoLng: number;
  fragil?: boolean;
  tamano?: string | null;
}): Promise<CalculoTarifa> {
  const { tarifaBase, costoEnvioKm, kmIncluidos } = await getTarifas();

  const tieneCoords =
    args.origenLat !== 0 && args.origenLng !== 0 && args.destinoLat !== 0 && args.destinoLng !== 0;
  const km = tieneCoords
    ? Math.round(calcularDistanciaHaversine(args.origenLat, args.origenLng, args.destinoLat, args.destinoLng) * 10) / 10
    : 0;

  const desglose: { concepto: string; monto: number }[] = [{ concepto: `Base (${kmIncluidos} km)`, monto: tarifaBase }];
  let monto = tarifaBase;

  if (km > kmIncluidos) {
    const extra = Math.round((km - kmIncluidos) * costoEnvioKm);
    monto += extra;
    desglose.push({ concepto: `${(km - kmIncluidos).toFixed(1)} km adicionales`, monto: extra });
  }
  if (args.fragil) {
    monto += RECARGO_FRAGIL;
    desglose.push({ concepto: 'Paquete frágil', monto: RECARGO_FRAGIL });
  }
  const recargoTamano = args.tamano ? RECARGO_TAMANO[args.tamano] ?? 0 : 0;
  if (recargoTamano > 0) {
    monto += recargoTamano;
    desglose.push({ concepto: `Tamaño ${args.tamano}`, monto: recargoTamano });
  }

  return {
    km,
    tiempoEstimado: km > 0 ? calcularTiempoEstimado(km) : 0,
    monto,
    ganancia: Math.round(monto * PARTICIPACION_REPARTIDOR),
    desglose,
  };
}

/** Ganancia del repartidor en un pedido de tienda: es el envío, no el total de la compra. */
export function gananciaRepartidorCompra(costoEnvio: number): number {
  return Math.round(Math.max(0, costoEnvio) * PARTICIPACION_REPARTIDOR);
}

/** Genera el PIN de 4 dígitos de una orden, evitando colisión con órdenes recientes del mismo cliente. */
export async function generarPinUnico(clienteId: string): Promise<string> {
  const recientes = await db.ordenServicio
    .findMany({
      where: { clienteId, createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
      select: { codigoPin: true },
    })
    .catch(() => [] as { codigoPin: string | null }[]);
  const usados = new Set(recientes.map((o) => o.codigoPin).filter(Boolean));

  for (let i = 0; i < 20; i++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    if (!usados.has(pin)) return pin;
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}
