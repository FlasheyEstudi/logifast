/**
 * FACTURA DE UNA COMPRA DEL MARKETPLACE.
 *
 * El cliente compraba en la tienda desde la app y **no había factura**: solo el POS
 * generaba `VentaPOS`. Aquí se reutiliza exactamente esa infraestructura (misma
 * tabla, mismo endpoint de PDF térmico, mismo PIN de 4 dígitos) para que la compra
 * online tenga el mismo comprobante y sirva para devoluciones en el local.
 *
 * Se llama al ENTREGAR (o al confirmar el retiro), que es cuando la venta queda
 * cerrada. Nunca duplica: si la compra ya tiene factura registrada, se devuelve esa.
 */
import { db } from '@/lib/db';

/** Serie del comprobante según el canal de venta. */
const SERIE = { pos: 'POS', online: 'WEB' } as const;

function numeroComprobante(canal: keyof typeof SERIE): string {
  return `${SERIE[canal]}-${Date.now().toString().slice(-6)}`;
}

export interface FacturaCompra {
  id: string;
  numeroComprobante: string;
  codigoPin: string | null;
  facturaUrlPdf: string;
  yaExistia: boolean;
}

/**
 * Genera (o recupera) la factura de una OrdenCompra entregada.
 * El vínculo se resuelve por `clienteId` + `notas` con el id de la orden, porque
 * `VentaPOS` no tiene columna propia para la orden de origen y no se agrega una
 * migración solo para esto.
 */
export async function facturarCompra(ordenId: string): Promise<FacturaCompra | null> {
  const orden = await db.ordenCompra.findUnique({
    where: { id: ordenId },
    include: { items: true, tienda: { select: { id: true, categoria: true, zonaCobertura: true, direccion: true } } },
  });
  if (!orden) return null;

  const marca = `Orden ${orden.id}`;
  const existente = await db.ventaPOS.findFirst({
    where: { clienteId: orden.clienteId, notas: { contains: ordenId } },
    orderBy: { createdAt: 'desc' },
  });
  if (existente) {
    return {
      id: existente.id,
      numeroComprobante: existente.numeroComprobante,
      codigoPin: existente.codigoPin,
      facturaUrlPdf: existente.facturaUrlPdf || `/api/tienda/facturas/${existente.id}/pdf`,
      yaExistia: true,
    };
  }

  const cliente = await db.user
    .findUnique({ where: { id: orden.clienteId }, select: { name: true, telefono: true } })
    .catch(() => null);

  // PIN propio de la factura (4 dígitos): es el que la tienda pide para una
  // devolución, igual que en una venta de mostrador.
  let codigoPin = String(Math.floor(1000 + Math.random() * 9000));
  const colision = await db.ventaPOS.findFirst({ where: { tiendaId: orden.tiendaId, codigoPin } });
  if (colision) codigoPin = String(Math.floor(1000 + Math.random() * 9000));

  const zona = (() => {
    try {
      const z = JSON.parse(orden.tienda.zonaCobertura || '[]');
      return z[0] || orden.tienda.direccion;
    } catch {
      return orden.tienda.direccion;
    }
  })();

  const venta = await db.ventaPOS.create({
    data: {
      tiendaId: orden.tiendaId,
      numeroComprobante: numeroComprobante('online'),
      codigoPin,
      clienteNombre: cliente?.name || 'Cliente',
      clienteTelefono: cliente?.telefono ?? null,
      metodoPago: orden.metodoPago,
      subtotal: orden.subtotal,
      descuento: orden.descuento,
      total: orden.total,
      montoRecibido: orden.total,
      cambioDado: 0,
      notas: `${marca} — pedido online (${orden.modoEntrega})`,
      clienteId: orden.clienteId,
      tiendaZona: zona,
      tiendaCategoria: orden.tienda.categoria,
      facturaUrlPdf: '',
      items: {
        create: orden.items.map((it) => ({
          productoId: it.productoId,
          nombreProducto: it.nombreProducto,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          subtotal: it.precioUnitario * it.cantidad,
        })),
      },
    },
  });

  const url = `/api/tienda/facturas/${venta.id}/pdf`;
  await db.ventaPOS.update({ where: { id: venta.id }, data: { facturaUrlPdf: url } }).catch(() => null);

  return {
    id: venta.id,
    numeroComprobante: venta.numeroComprobante,
    codigoPin,
    facturaUrlPdf: url,
    yaExistia: false,
  };
}
