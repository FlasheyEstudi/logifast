import { db } from '@/lib/db';
import { emitOrdenCreada } from '@/lib/realtime-emitter';

/**
 * #1 — Pedido recurrente: mismo carrito, hora y lugar, repetido por regla.
 *
 * Un cron pide a la app que ejecute los que ya vencieron. La orden se crea con el
 * **precio del día** (no con el precio guardado) y descuenta stock igual que el
 * checkout; si un producto desapareció, simplemente no entra en el pedido.
 */

export interface ItemSnapshot {
  productoId: string;
  cantidad: number;
}

export function parsearItems(crudo: string): ItemSnapshot[] {
  try {
    const parsed = JSON.parse(crudo);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({ productoId: String(x?.productoId ?? ''), cantidad: Math.max(1, Math.floor(Number(x?.cantidad) || 1)) }))
      .filter((x) => x.productoId);
  } catch {
    return [];
  }
}

export function parsearDias(crudo: string): number[] {
  try {
    const parsed = JSON.parse(crudo);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  } catch {
    return [];
  }
}

/** Próxima fecha en que toca ejecutar, según los días y la hora elegidos. */
export function calcularProximaEjecucion(diasSemana: number[], hora: string, desde = new Date()): Date {
  const [h, m] = String(hora || '10:00').split(':').map((n) => parseInt(n, 10));
  const horas = Number.isFinite(h) ? h : 10;
  const minutos = Number.isFinite(m) ? m : 0;
  const dias = diasSemana.length > 0 ? diasSemana : [desde.getDay()];

  for (let i = 1; i <= 14; i++) {
    const candidato = new Date(desde);
    candidato.setDate(candidato.getDate() + i);
    candidato.setHours(horas, minutos, 0, 0);
    if (dias.includes(candidato.getDay())) return candidato;
  }

  const respaldo = new Date(desde);
  respaldo.setDate(respaldo.getDate() + 7);
  respaldo.setHours(horas, minutos, 0, 0);
  return respaldo;
}

export interface ResultadoRecurrente {
  ok: boolean;
  ordenId?: string;
  error?: string;
  avisos: string[];
}

/** Crea la orden de un recurrente que ya venció y reprograma el siguiente. */
export async function ejecutarRecurrente(recurrenteId: string): Promise<ResultadoRecurrente> {
  const avisos: string[] = [];

  const rec = await db.pedidoRecurrente.findUnique({
    where: { id: recurrenteId },
    include: { tienda: true },
  });
  if (!rec) return { ok: false, error: 'Recurrente inexistente', avisos };
  if (!rec.activo) return { ok: false, error: 'Recurrente pausado', avisos };

  const snapshot = parsearItems(rec.items);
  if (snapshot.length === 0) return { ok: false, error: 'El carrito programado está vacío', avisos };

  const productos = await db.producto.findMany({
    where: { id: { in: snapshot.map((s) => s.productoId) } },
    select: { id: true, nombre: true, precio: true, stock: true, tiendaId: true, disponible: true },
  });

  const itemsData = snapshot
    .map((s) => {
      const p = productos.find((x) => x.id === s.productoId);
      if (!p || p.tiendaId !== rec.tiendaId || !p.disponible) {
        avisos.push(`Producto omitido: ${s.productoId}`);
        return null;
      }
      return {
        productoId: p.id,
        nombreProducto: p.nombre,
        cantidad: s.cantidad,
        precioUnitario: p.precio,
        subtotal: p.precio * s.cantidad,
        controlaStock: p.stock !== null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (itemsData.length === 0) {
    await db.pedidoRecurrente.update({ where: { id: rec.id }, data: { activo: false } });
    return { ok: false, error: 'Ningún producto del carrito sigue disponible; el recurrente se pausó', avisos };
  }

  const esRetiro = rec.direccionEntrega.trim().toLowerCase().startsWith('retiro');
  const subtotal = itemsData.reduce((s, i) => s + i.subtotal, 0);
  const costoEnvio = esRetiro ? 0 : rec.tienda.costoEnvio;
  const total = subtotal + costoEnvio;
  const pin = String(Math.floor(1000 + Math.random() * 9000));

  const orden = await db.$transaction(async (tx) => {
    const creada = await tx.ordenCompra.create({
      data: {
        clienteId: rec.clienteId,
        tiendaId: rec.tiendaId,
        estado: 'recibido',
        modoEntrega: esRetiro ? 'retiro' : 'reparto',
        direccionEntrega: rec.direccionEntrega,
        lat: rec.lat,
        lng: rec.lng,
        instrucciones: 'Pedido recurrente programado por el cliente',
        metodoPago: rec.metodoPago,
        subtotal,
        costoEnvio,
        descuento: 0,
        total,
        codigoPin: pin,
        items: {
          create: itemsData.map((i) => ({
            productoId: i.productoId,
            nombreProducto: i.nombreProducto,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
          })),
        },
      },
      include: { items: true, tienda: true },
    });

    for (const item of itemsData) {
      if (!item.controlaStock) continue;
      const actualizado = await tx.producto.update({
        where: { id: item.productoId },
        data: { stock: { decrement: item.cantidad } },
      });
      if (actualizado.stock !== null && actualizado.stock < 0) {
        throw new Error(`Stock insuficiente para ${item.nombreProducto}`);
      }
    }

    await tx.tienda.update({ where: { id: rec.tiendaId }, data: { totalPedidos: { increment: 1 } } });
    return creada;
  });

  // Si es reparto, se crea la OrdenServicio para que un repartidor pueda tomarlo.
  if (!esRetiro) {
    const ordenServicio = await db.ordenServicio.create({
      data: {
        clienteId: rec.clienteId,
        tipo: 'compra',
        estado: 'pendiente',
        origen: rec.tienda.nombre,
        destino: rec.direccionEntrega,
        origenLat: rec.tienda.lat || 0,
        origenLng: rec.tienda.lng || 0,
        destinoLat: rec.lat || 0,
        destinoLng: rec.lng || 0,
        tiendaId: rec.tiendaId,
        tiendaNombre: rec.tienda.nombre,
        metodoPago: rec.metodoPago,
        monto: total,
        ganancia: Math.round(costoEnvio * 0.7),
        clienteNombre: 'Cliente recurrente',
        codigoPin: pin,
      },
    });
    emitOrdenCreada(ordenServicio);
  }

  await db.pedidoRecurrente.update({
    where: { id: rec.id },
    data: {
      ultimaEjecucion: new Date(),
      proximaEjecucion: calcularProximaEjecucion(parsearDias(rec.diasSemana), rec.hora),
    },
  });

  return { ok: true, ordenId: orden.id, avisos };
}
