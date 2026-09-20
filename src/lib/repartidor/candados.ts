/**
 * CANDADOS DEL REPARTIDOR — reglas que el backend no puede delegar al frontend.
 *
 * El límite de 3 pedidos simultáneos vivía solo en el store del repartidor: abrir
 * otra pestaña, reintentar o llamar la API a mano lo saltaba. Igual pasaba con la
 * pausa por rechazos y con el timeout de aceptación (contaba únicamente mientras
 * la app estaba abierta).
 */
import { db } from '@/lib/db';
import { COMPRA_ACTIVA, SERVICIO_ACTIVO } from '@/lib/estados-pedido';

export const MAX_PEDIDOS_SIMULTANEOS = 3;
export const MAX_RECHAZOS_HORA = 3;
export const PAUSA_RECHAZOS_MIN = 15;
export const MS_VENTANA_RECHAZOS = 60 * 60 * 1000; // la ventana de conteo es una hora

/** Rechazos que el repartidor lleva AHORA (ventana móvil de 1 h), leídos de sus propias notificaciones. */
export async function rechazosEnVentana(repartidorId: string): Promise<number> {
  const desde = new Date(Date.now() - MS_VENTANA_RECHAZOS);
  return db.notificacionRepartidor
    .count({ where: { repartidorId, tipo: 'oferta_rechazada', createdAt: { gte: desde } } })
    .catch(() => 0);
}

/**
 * Actividad REAL de un repartidor, contada por PEDIDO y no por fila.
 *
 * Un pedido de tienda vive en DOS entidades (`OrdenCompra` + su `OrdenServicio`
 * vinculado por `codigoPin`), así que sumarlas contaba el mismo pedido dos veces y el
 * cupo de 3 se agotaba con dos pedidos. Aquí se cuentan las compras activas y solo
 * los servicios que NO representan una compra (envíos sueltos y filas viejas sin
 * compra vinculada), que es lo que el repartidor puede atender a la vez.
 */
export async function contarPedidosActivos(repartidorId: string): Promise<number> {
  const [compras, servicios] = await Promise.all([
    db.ordenCompra.findMany({
      where: { repartidorId, estado: { in: COMPRA_ACTIVA } },
      select: { codigoPin: true },
    }),
    db.ordenServicio.findMany({
      where: { repartidorId, estado: { in: SERVICIO_ACTIVO } },
      select: { id: true, codigoPin: true, tipo: true },
    }),
  ]);

  const pinsDeCompras = new Set(compras.map((c) => c.codigoPin).filter((p): p is string => !!p));
  const serviciosPropios = servicios.filter((s) => !(s.tipo === 'compra' && s.codigoPin && pinsDeCompras.has(s.codigoPin)));

  return compras.length + serviciosPropios.length;
}

/** ¿El repartidor puede tomar un pedido más? Devuelve el motivo cuando no puede. */
export async function puedeTomarPedido(
  repartidorId: string
): Promise<{ ok: boolean; motivo?: string; activos: number; pausado: boolean; pausaHasta: Date | null }> {
  const perfil = await db.repartidorProfile.findUnique({
    where: { id: repartidorId },
    select: { pausado: true, pausaHasta: true },
  });

  const activos = await contarPedidosActivos(repartidorId);

  // La pausa por rechazos caduca sola: si ya pasó la hora, el candado se abre.
  const pausaVigente = !!perfil?.pausado && (!perfil.pausaHasta || perfil.pausaHasta.getTime() > Date.now());
  if (pausaVigente) {
    return {
      ok: false,
      motivo: `Estás en pausa por rechazos hasta las ${perfil!.pausaHasta?.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false }) ?? '—'}`,
      activos,
      pausado: true,
      pausaHasta: perfil?.pausaHasta ?? null,
    };
  }

  if (activos >= MAX_PEDIDOS_SIMULTANEOS) {
    return {
      ok: false,
      motivo: `Ya llevas ${activos} pedidos activos (máximo ${MAX_PEDIDOS_SIMULTANEOS})`,
      activos,
      pausado: false,
      pausaHasta: null,
    };
  }

  return { ok: true, activos, pausado: false, pausaHasta: null };
}

/**
 * Verifica una y otra vez DENTRO de la transacción, con las filas ya bloqueadas por
 * la actualización. Devuelve true si el repartidor se pasó del límite en la carrera.
 * Se llama después del updateMany condicional que le asigna la orden, así que el
 * conteo incluye al pedido recién tomado — contado UNA vez, no una por entidad.
 */
export async function excedeLimiteEnTx(tx: {
  ordenServicio: {
    count: (a: { where: Record<string, unknown> }) => Promise<number>;
    findMany: (a: { where: Record<string, unknown>; select?: Record<string, unknown> }) => Promise<{ codigoPin: string | null; tipo: string }[]>;
  };
  ordenCompra: {
    count: (a: { where: Record<string, unknown> }) => Promise<number>;
    findMany: (a: { where: Record<string, unknown>; select?: Record<string, unknown> }) => Promise<{ codigoPin: string | null }[]>;
  };
}, repartidorId: string): Promise<boolean> {
  const [compras, servicios] = await Promise.all([
    tx.ordenCompra.findMany({ where: { repartidorId, estado: { in: COMPRA_ACTIVA } }, select: { codigoPin: true } }),
    tx.ordenServicio.findMany({
      where: { repartidorId, estado: { in: SERVICIO_ACTIVO } },
      select: { codigoPin: true, tipo: true },
    }),
  ]);

  // Un pedido de tienda son dos filas: la compra y su servicio. Se cuenta una vez.
  const pins = new Set(compras.map((c) => c.codigoPin).filter((p): p is string => !!p));
  const serviciosPropios = servicios.filter((s) => !(s.tipo === 'compra' && s.codigoPin && pins.has(s.codigoPin)));

  return compras.length + serviciosPropios.length > MAX_PEDIDOS_SIMULTANEOS;
}

/** Registra el rechazo y devuelve el estado de pausa ya recalculado. */
export async function registrarRechazo(repartidorId: string): Promise<{
  rechazosHora: number;
  pausado: boolean;
  pausaHasta: Date | null;
}> {
  const rechazos = await rechazosEnVentana(repartidorId);
  const pausado = rechazos >= MAX_RECHAZOS_HORA;
  const pausaHasta = pausado ? new Date(Date.now() + PAUSA_RECHAZOS_MIN * 60 * 1000) : null;

  await db.repartidorProfile.update({
    where: { id: repartidorId },
    data: { rechazosHora: rechazos, pausado, pausaHasta },
  }).catch(() => null);

  return { rechazosHora: rechazos, pausado, pausaHasta };
}

/**
 * Cierra la pausa por rechazos si ya venció. Se llama antes de aceptar: el candado
 * no debe sobrevivir a su propia hora solo porque nadie lo limpió.
 */
export async function limpiarPausaVencida(repartidorId: string): Promise<void> {
  const perfil = await db.repartidorProfile.findUnique({
    where: { id: repartidorId },
    select: { pausado: true, pausaHasta: true },
  });
  if (!perfil?.pausado) return;
  if (perfil.pausaHasta && perfil.pausaHasta.getTime() > Date.now()) return;
  await db.repartidorProfile.update({
    where: { id: repartidorId },
    data: { pausado: false, pausaHasta: null, rechazosHora: 0 },
  }).catch(() => null);
}
