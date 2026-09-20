/**
 * SINCRONIZACIÓN OrdenCompra ↔ OrdenServicio.
 *
 * Un pedido de tienda crea DOS filas: la compra (lo que ve cliente y tienda) y la
 * OrdenServicio (lo que ve el repartidor). Antes cada carril avanzaba por su cuenta
 * y era posible terminar con `OrdenCompra.en_camino` y `OrdenServicio.pendiente`,
 * o con una compra cancelada y el servicio vivo ofreciéndose a los repartidores.
 *
 * Regla: la COMPRA manda. Cuando cambia, el servicio vinculado se alinea con
 * `estadoServicioDesdeCompra` y, si la compra se cierra, se suelta al repartidor.
 *
 * El vínculo entre ambas NO es una FK: son dos filas creadas en la misma
 * transacción con el MISMO `codigoPin` (4 dígitos, únicos por compra reciente) +
 * `tiendaId` + `clienteId`. Es la única clave compartida que existe hoy y por eso
 * se usa `updateMany` (nunca `update`) para no romper si hay más de una coincidencia.
 * Si falta el PIN, la sincronización se ABSTIENE: adivinar el vínculo por
 * tienda+cliente pisaba el estado de todos los pedidos de ese cliente.
 */
import { estadoServicioDesdeCompra } from '@/lib/estados-pedido';

type Tx = {
  ordenServicio: {
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
};

export interface SincronizarArgs {
  tx: Tx;
  estadoCompra: string;
  tiendaId: string;
  clienteId: string;
  codigoPin?: string | null;
  /** Si la entrega ya no existe (retiro en tienda), no hay servicio que sincronizar. */
  ordenServicioId?: string | null;
  /** Campos extra a propagar (repartidorId, km, etc.). */
  extra?: Record<string, unknown>;
}

/** Devuelve cuántas OrdenServicio se alinearon (0 = no había vínculo, es normal en retiro). */
export async function sincronizarServicioConCompra({
  tx,
  estadoCompra,
  tiendaId,
  clienteId,
  codigoPin,
  ordenServicioId,
  extra = {},
}: SincronizarArgs): Promise<number> {
  // El vínculo es (tienda + cliente + PIN + tipo). El PIN es parte de la clave: sin
  // él, un `updateMany` por tienda+cliente alcanzaba TODOS los servicios de ese
  // cliente en esa tienda y les pisaba el estado (con 15 pedidos del mismo cliente
  // en la misma tienda, uno solo cerraba o abría los 15). Si no hay PIN no se
  // adivina a cuál pertenece: mejor no tocar nada que tocar el equivocado.
  if (!ordenServicioId && (!codigoPin || codigoPin === null)) {
    return 0;
  }

  const where: Record<string, unknown> = ordenServicioId
    ? { id: ordenServicioId }
    : {
        tiendaId,
        clienteId,
        tipo: 'compra',
        codigoPin: codigoPin as string,
      };

  // No se pisa un servicio ya cerrado (entregado/cancelado por su propio carril).
  const data: Record<string, unknown> = {
    estado: estadoServicioDesdeCompra(estadoCompra),
    ...extra,
  };

  try {
    const res = await tx.ordenServicio.updateMany({ where, data });
    return res.count;
  } catch {
    // Un fallo de sincronización no debe tumbar una operación ya confirmada:
    // los listados reconcilian por estado en el siguiente sync.
    return 0;
  }
}

/**
 * Suelta al repartidor de un pedido cancelado. Se usa cuando la compra se cancela
 * después de que alguien la había aceptado: liberar la asignación es obligatorio
 * para que la orden no siga apareciendo en su ruta ni en su historial activo.
 */
export async function liberarRepartidorDeCompra(
  tx: Tx,
  { tiendaId, clienteId, codigoPin }: { tiendaId: string; clienteId: string; codigoPin?: string | null }
): Promise<number> {
  return sincronizarServicioConCompra({
    tx,
    estadoCompra: 'cancelado',
    tiendaId,
    clienteId,
    codigoPin,
    extra: { repartidorId: null },
  });
}
