import { db } from '@/lib/db';
import { emitOrdenCreada, emitirEventoRealtime } from '@/lib/realtime-emitter';
import { calcularApertura } from '@/lib/tienda/horarios';
import { calcularDistanciaHaversine } from '@/lib/osrm';

/**
 * #1 — Pedido recurrente: mismo carrito, hora y lugar, repetido por regla.
 *
 * El cron NO crea el pedido por su cuenta: cuando llega la hora avisa al cliente
 * (notificación + sala personal) y deja la ejecución pendiente de su CONFIRMAR o
 * CANCELAR. Solo entonces se crea la orden, con el **precio del día** y descontando
 * stock igual que el checkout; si un producto desapareció, simplemente no entra.
 *
 * Si la tienda está cerrada a esa hora no se avisa ni se crea nada imposible: la
 * ejecución se corre al siguiente hueco válido.
 */

/** Cuánto tiempo tiene el cliente para confirmar antes de que la ejecución caduque. */
export const MS_VENTANA_CONFIRMACION = 45 * 60 * 1000;

/** Margen de aviso previo: se avisa un poco antes de la hora pedida. */
export const MS_AVISO_ANTICIPADO = 10 * 60 * 1000;

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

/**
 * Avisa al cliente que su pedido programado está por ejecutarse. NO crea nada:
 * deja la ejecución pendiente de confirmación y emite la notificación. Devuelve
 * false cuando la tienda está cerrada a esa hora (no se avisa un pedido imposible).
 */
export async function avisarRecurrente(recurrenteId: string): Promise<{
  ok: boolean;
  motivo?: string;
  proximaEjecucion?: Date;
}> {
  const rec = await db.pedidoRecurrente.findUnique({
    where: { id: recurrenteId },
    include: { tienda: { select: { nombre: true, horario: true, estado: true } } },
  });
  if (!rec || !rec.activo) return { ok: false, motivo: 'Recurrente inactivo' };

  // Ya hay un aviso esperando respuesta: no se duplica.
  if (rec.pendienteAvisoEn) return { ok: false, motivo: 'Ya espera confirmación del cliente' };

  const objetivo = rec.proximaEjecucion;

  // Tienda cerrada a la hora pedida: se corre al siguiente hueco con la misma regla.
  const apertura = calcularApertura(rec.tienda.horario, objetivo);
  if (rec.tienda.estado !== 'activo' || !apertura.abierto) {
    const dias = parsearDias(rec.diasSemana);
    const siguiente = calcularProximaEjecucion(dias, rec.hora, objetivo);
    await db.pedidoRecurrente.update({
      where: { id: rec.id },
      data: { proximaEjecucion: siguiente },
    });
    return { ok: false, motivo: `La tienda está cerrada a esa hora (${apertura.texto})`, proximaEjecucion: siguiente };
  }

  const horaTexto = objetivo.toLocaleString('es-NI', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  await db.pedidoRecurrente.update({
    where: { id: rec.id },
    data: { pendienteAvisoEn: new Date(), pendientePara: objetivo },
  });

  await db.notificacionPush.create({
    data: {
      userId: rec.clienteId,
      titulo: 'Tu pedido programado está listo para confirmar',
      contenido: `${rec.tienda.nombre} — ${horaTexto}. Confirma para generarlo o cancélalo para saltar esta vez.`,
      tipo: 'PEDIDO_PROGRAMADO',
      entidadId: rec.id,
      leida: false,
    },
  }).catch(() => null);

  // La campanita del cliente lo ve al instante, sin esperar al sondeo.
  emitirEventoRealtime({
    room: `usuario:${rec.clienteId}`,
    event: 'notificacion:push',
    data: {
      titulo: 'Pedido programado',
      contenido: `Confirma tu pedido en ${rec.tienda.nombre}`,
      tipo: 'pedido_programado',
      entidadId: rec.id,
    },
  });

  return { ok: true, proximaEjecucion: objetivo };
}

/**
 * Cancela UNA ejecución pendiente sin tocar la programación futura: el recurrente
 * sigue activo y se reprograma para su siguiente día.
 */
export async function saltarEjecucion(recurrenteId: string, clienteId: string): Promise<{ ok: boolean; proximaEjecucion?: Date }> {
  const rec = await db.pedidoRecurrente.findUnique({ where: { id: recurrenteId } });
  if (!rec || rec.clienteId !== clienteId) return { ok: false };

  const siguiente = calcularProximaEjecucion(parsearDias(rec.diasSemana), rec.hora, rec.pendientePara ?? new Date());
  await db.pedidoRecurrente.update({
    where: { id: rec.id },
    data: { pendienteAvisoEn: null, pendientePara: null, proximaEjecucion: siguiente },
  });
  return { ok: true, proximaEjecucion: siguiente };
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

  // Km reales entre la tienda y el destino: la orden nace con un estimado útil para
  // el repartidor (antes el recurrente no traía ni km ni tiempo).
  const kmRecurrente =
    rec.tienda.lat !== 0 && rec.tienda.lng !== 0 && (rec.lat !== 0 || rec.lng !== 0)
      ? Math.round(calcularDistanciaHaversine(rec.tienda.lat, rec.tienda.lng, rec.lat, rec.lng) * 10) / 10
      : 0;

  // Nombre y teléfono reales del cliente: la orden nace con el dueño, no con una
  // etiqueta genérica que el repartidor no podía usar para contactarlo.
  const cliente = await db.user
    .findUnique({ where: { id: rec.clienteId }, select: { name: true, telefono: true } })
    .catch(() => null);
  const clienteNombreRec = cliente?.name || 'Cliente';
  const telefonoRec = cliente?.telefono ?? null;

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
        // La ganancia sale del ENVÍO, igual que en el checkout normal.
        ganancia: Math.round(costoEnvio * 0.7),
        kmEstimados: kmRecurrente,
        tiempoEstimado: kmRecurrente > 0 ? Math.round(kmRecurrente * 4) : 0,
        clienteNombre: clienteNombreRec,
        clienteTelefono: telefonoRec,
        codigoPin: pin,
      },
    });
    // Aviso en vivo a la tienda (KDS) y a los repartidores, sin esperar al sondeo.
    emitOrdenCreada(ordenServicio);
    emitirEventoRealtime({ room: `tienda-ordenes:${rec.tiendaId}`, event: 'tienda:orden:nueva', data: orden });
  }

  await db.pedidoRecurrente.update({
    where: { id: rec.id },
    data: {
      ultimaEjecucion: new Date(),
      pendienteAvisoEn: null,
      pendientePara: null,
      proximaEjecucion: calcularProximaEjecucion(parsearDias(rec.diasSemana), rec.hora),
    },
  });

  return { ok: true, ordenId: orden.id, avisos };
}
