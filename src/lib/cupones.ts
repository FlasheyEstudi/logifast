import { db } from '@/lib/db';

/**
 * Motor ÚNICO de validación de códigos promocionales.
 *
 * Lo usan tanto `POST /api/codigos/validar` (vista previa que ve el cliente)
 * como `POST /api/ordenes-compra` (el cobro real), para que las reglas
 * comerciales se apliquen exactamente igual en los dos caminos:
 * - Tipo de servicio (envio vs marketplace)
 * - Tienda dueña del cupón: un cupón creado por una tienda solo aplica en ESA tienda
 * - Monto mínimo de compra
 * - Límite de usos globales
 * - Uso único por cliente
 * - Exclusivo de primer pedido
 * - Tope de descuento (descuentoMaximo)
 *
 * El descuento se calcula SIEMPRE sobre el subtotal de productos, nunca sobre el envío.
 */

export type TipoOrdenPromocional = 'envio' | 'marketplace' | 'ambos';

export interface CodigoPromocionalConReglas {
  id: string;
  codigo: string;
  tipoDescuento: string;
  valor: number;
  aplicableA: string;
  montoMinimo: number | null;
  descuentoMaximo: number | null;
  primerPedidoSolo: boolean;
  tipoServicio: string;
  maxUsos: number;
  usosActuales: number;
  estado: string;
}

export type ResultadoValidacionPromo =
  | { ok: true; promo: CodigoPromocionalConReglas; descuento: number }
  | { ok: false; status: number; error: string };

/**
 * Valida un código promocional contra la base de datos y devuelve el descuento
 * ya calculado. Nunca confía en el descuento que envíe el cliente.
 */
export async function validarCodigoPromocional({
  codigo,
  montoSubtotal = 0,
  tipoOrden = 'envio',
  clienteId,
  tiendaId,
}: {
  codigo: string;
  montoSubtotal?: number;
  tipoOrden?: TipoOrdenPromocional;
  clienteId: string;
  /** Tienda de la compra: obliga a que un cupón con `tiendaId` sea de esa misma tienda. */
  tiendaId?: string | null;
}): Promise<ResultadoValidacionPromo> {
  const codigoStr = String(codigo ?? '').trim().toUpperCase();
  if (!codigoStr) {
    return { ok: false, status: 400, error: 'Código promocional requerido' };
  }

  const subtotal = Number.isFinite(Number(montoSubtotal)) ? Math.max(0, Number(montoSubtotal)) : 0;

  const promo = await db.codigoPromocional.findUnique({
    where: { codigo: codigoStr },
  });

  if (!promo || promo.estado !== 'activo') {
    return { ok: false, status: 400, error: 'Código promocional inválido o inactivo' };
  }

  const promoReglas = promo as any;

  const now = new Date();
  if (now < promo.vigenciaInicio || now > promo.vigenciaFin) {
    return { ok: false, status: 400, error: 'El código promocional ha expirado' };
  }

  // 0. Cupón de tienda: solo vale en la tienda que lo creó. Los cupones globales
  //    (tiendaId null) siguen funcionando en cualquier tienda, como antes.
  const tiendaDelCupon = (promo as { tiendaId?: string | null }).tiendaId ?? null;
  if (tiendaDelCupon && tiendaDelCupon !== (tiendaId ?? null)) {
    return { ok: false, status: 400, error: 'Este cupón es exclusivo de otra tienda' };
  }

  const tipoServicio = promoReglas.tipoServicio || 'ambos';
  const descuentoMaximo = promoReglas.descuentoMaximo ?? null;
  const primerPedidoSolo = promoReglas.primerPedidoSolo || false;

  // 1. Tipo de servicio (envio vs marketplace)
  if (tipoServicio !== 'ambos' && tipoServicio !== tipoOrden) {
    const tipoLabel = tipoServicio === 'envio' ? 'envíos directos' : 'compras en tiendas';
    return { ok: false, status: 400, error: `Este código solo es aplicable para ${tipoLabel}` };
  }

  // 2. Monto mínimo
  if (promo.montoMinimo && subtotal < promo.montoMinimo) {
    return {
      ok: false,
      status: 400,
      error: `El pedido mínimo para aplicar este código es C$${promo.montoMinimo}`,
    };
  }

  // 3. Límite de usos globales
  if (promo.maxUsos > 0 && promo.usosActuales >= promo.maxUsos) {
    return { ok: false, status: 400, error: 'El código ha alcanzado su límite de usos' };
  }

  // 4. Uso único por cliente
  const yaUsado = await db.usoCodigo.findFirst({
    where: { codigoId: promo.id, clienteId },
  });
  if (yaUsado) {
    return { ok: false, status: 400, error: 'Ya has usado este código promocional anteriormente' };
  }

  // 5. Exclusivo de primer pedido
  if (primerPedidoSolo || promo.aplicableA === 'primer_envio' || promo.aplicableA === 'first_order') {
    const [ordenesServicioPrevias, ordenesCompraPrevias] = await Promise.all([
      db.ordenServicio.count({ where: { clienteId } }),
      db.ordenCompra.count({ where: { clienteId } }),
    ]);
    if (ordenesServicioPrevias + ordenesCompraPrevias > 0) {
      return {
        ok: false,
        status: 400,
        error: 'Este código es exclusivo para nuevos clientes en su primer pedido',
      };
    }
  }

  // 6. Descuento sobre el subtotal de productos, con tope comercial.
  //    El tope (descuentoMaximo) acota tanto cupones de porcentaje como de monto fijo.
  let descuento = 0;
  if (promo.tipoDescuento === 'porcentaje') {
    descuento = Math.round((subtotal * promo.valor) / 100);
  } else {
    descuento = Math.min(subtotal, promo.valor);
  }
  if (descuentoMaximo && descuentoMaximo > 0 && descuento > descuentoMaximo) {
    descuento = descuentoMaximo;
  }

  return {
    ok: true,
    promo: {
      id: promo.id,
      codigo: promo.codigo,
      tipoDescuento: promo.tipoDescuento,
      valor: promo.valor,
      aplicableA: promo.aplicableA,
      montoMinimo: promo.montoMinimo ?? null,
      descuentoMaximo,
      primerPedidoSolo,
      tipoServicio,
      maxUsos: promo.maxUsos,
      usosActuales: promo.usosActuales,
      estado: promo.estado,
    },
    descuento,
  };
}
