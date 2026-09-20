/**
 * ESTADOS DE PEDIDO — fuente única de verdad para backend y frontend.
 *
 * ORDEN DE COMPRA (marketplace) — ciclo de vida real:
 *   recibido → preparando → listo → en_camino → entregado
 *                                       ↘ cancelado
 *   `en_camino` se usa cuando el pedido sale del local con el repartidor (o el
 *   cliente lo retira). NUNCA debe quedar una compra `en_camino` sin repartidor
 *   asignado: eso convertía el estado en un pozo sin salida.
 *
 * ORDEN DE SERVICIO (envío de paquete) — ciclo de vida real:
 *   pendiente → asignado → aceptado → recogido → entregado
 *                 ↘ cancelado
 *   `asignado` = el admin la puso en manos de un repartidor; `aceptado` = el
 *   repartidor la tomó. El frontend del repartidor usa estados de UI propios
 *   (EN_CAMINO_RECOGER, RECOGIDO…) que NO se guardan nunca en la base.
 */

export const ESTADOS_COMPRA = ['recibido', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado'] as const;
export type EstadoCompra = (typeof ESTADOS_COMPRA)[number];

export const ESTADOS_SERVICIO = ['pendiente', 'asignado', 'aceptado', 'recogido', 'entregado', 'incidencia', 'cancelado'] as const;
export type EstadoServicio = (typeof ESTADOS_SERVICIO)[number];

/** Estados de compra que siguen "vivos" (cuentan como pedido activo del repartidor). */
export const COMPRA_ACTIVA: EstadoCompra[] = ['recibido', 'preparando', 'listo', 'en_camino'];

/** Estados de servicio que siguen "vivos". */
export const SERVICIO_ACTIVO: EstadoServicio[] = ['pendiente', 'asignado', 'aceptado', 'recogido', 'incidencia'];

/** Estados de compra donde ya no se puede cancelar (el trabajo está hecho). */
export const COMPRA_NO_CANCELABLE: EstadoCompra[] = ['entregado', 'cancelado'];

/** Estados de servicio donde ya no se puede cancelar. */
export const SERVICIO_NO_CANCELABLE: EstadoServicio[] = ['entregado', 'cancelado'];

/** Estados terminales de compra. */
export const COMPRA_TERMINAL: EstadoCompra[] = ['entregado', 'cancelado'];

export const esEstadoCompra = (v: unknown): v is EstadoCompra =>
  typeof v === 'string' && (ESTADOS_COMPRA as readonly string[]).includes(v);

export const esEstadoServicio = (v: unknown): v is EstadoServicio =>
  typeof v === 'string' && (ESTADOS_SERVICIO as readonly string[]).includes(v);

/** Transiciones válidas de la COMPRA. Cualquier otro salto es un error del cliente. */
export const TRANSICIONES_COMPRA: Record<EstadoCompra, EstadoCompra[]> = {
  recibido: ['preparando', 'en_camino', 'cancelado'],
  preparando: ['listo', 'en_camino', 'cancelado'],
  listo: ['en_camino', 'entregado', 'cancelado'],
  en_camino: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

/** ¿Es legal este salto de estado en una compra? */
export function transicionCompraValida(desde: string, hacia: string): boolean {
  if (!esEstadoCompra(desde) || !esEstadoCompra(hacia)) return false;
  return TRANSICIONES_COMPRA[desde].includes(hacia);
}

/**
 * Traduce el estado de una COMPRA al estado equivalente de la OrdenServicio que
 * la entrega. Con esto las dos entidades avanzan juntas y ninguna queda abierta:
 *   compra recibido/preparando/listo → servicio pendiente (aún no sale)
 *   compra en_camino                → servicio aceptado (el repartidor la tiene)
 *   compra entregado/cancelado      → servicio entregado/cancelado
 */
export function estadoServicioDesdeCompra(estadoCompra: string): EstadoServicio {
  switch (estadoCompra) {
    case 'preparando':
    case 'listo':
    case 'recibido':
      return 'pendiente';
    case 'en_camino':
      return 'aceptado';
    case 'entregado':
      return 'entregado';
    case 'cancelado':
      return 'cancelado';
    default:
      return 'pendiente';
  }
}

/** Etiqueta humana para pintar en cualquier rol. */
export const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  aceptado: 'Aceptado',
  recibido: 'Recibido',
  preparando: 'Preparando',
  listo: 'Listo',
  en_camino: 'En camino',
  recogido: 'Recogido',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  incidencia: 'Incidencia',
};
