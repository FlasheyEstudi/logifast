/**
 * CIERRE DE UNA COMPRA EN EL LADO DE LA TIENDA.
 *
 * Cuando la tienda rechaza un pedido (o el sistema lo cancela antes de que salga),
 * hay que devolver el stock que el checkout ya descontó y liberar el cupón que se
 * marcó como usado. El checkout del cliente lo hacía el suyo por su cuenta; esto
 * concentra la reversión para que la tienda use exactamente la misma regla.
 */
import { COMPRA_ACTIVA } from '@/lib/estados-pedido';

export interface CompraParaReversion {
  id: string;
  estado: string;
  tiendaId: string;
  items: { productoId: string; cantidad: number }[];
  codigoUsado?: string | null;
}

/** ¿El pedido todavía no salió del local? Entonces su stock es reembolsable. */
export function stockEsReembolsable(estado: string): boolean {
  return estado === 'recibido' || estado === 'preparando' || estado === 'listo';
}

type Tx = {
  producto: { updateMany: (a: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }> };
  codigoPromocional: {
    findUnique: (a: { where: { codigo: string } }) => Promise<{ id: string } | null>;
    update: (a: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  };
  usoCodigo: {
    findFirst: (a: { where: Record<string, unknown> }) => Promise<{ id: string } | null>;
    delete: (a: { where: { id: string } }) => Promise<unknown>;
  };
};

/**
 * Devuelve stock y cupón de una compra que se cancela.
 * Solo toca productos que gestionan stock (`stock != null`).
 */
export async function revertirCompra(tx: Tx, compra: CompraParaReversion): Promise<{ stockDevuelto: boolean; cuponRevertido: boolean }> {
  let stockDevuelto = false;
  if (stockEsReembolsable(compra.estado)) {
    for (const item of compra.items) {
      const res = await tx.producto.updateMany({
        where: { id: item.productoId, stock: { not: null } },
        data: { stock: { increment: item.cantidad } },
      });
      if (res.count > 0) stockDevuelto = true;
    }
  }

  let cuponRevertido = false;
  if (compra.codigoUsado) {
    const promo = await tx.codigoPromocional.findUnique({ where: { codigo: compra.codigoUsado } }).catch(() => null);
    if (promo) {
      const uso = await tx.usoCodigo
        .findFirst({ where: { ordenId: compra.id, codigoId: promo.id } })
        .catch(() => null);
      if (uso) await tx.usoCodigo.delete({ where: { id: uso.id } }).catch(() => null);
      await tx.codigoPromocional
        .update({ where: { id: promo.id }, data: { usosActuales: { decrement: 1 } } })
        .catch(() => null);
      cuponRevertido = true;
    }
  }

  return { stockDevuelto, cuponRevertido };
}

/** Estados de compra que cuentan como "el repartidor puede tomarla". */
export const COMPRA_OFERTABLE = COMPRA_ACTIVA.filter((e) => e !== 'en_camino');
