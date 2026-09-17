/**
 * LOGIFAST — Envío de campañas de marketing (segmentación real + entrega por lotes).
 *
 * Antes:
 *  - Cualquier segmento que no fuera "todos" o "Clientes nuevos" caía en un `else`
 *    que enviaba solo a 50 clientes, así que "frecuentes", "inactivos" y "VIP"
 *    eran etiquetas decorativas sin efecto.
 *  - El envío hacía 1 petición HTTP por usuario al microservicio realtime.
 *  - Ninguna campaña "programada" se enviaba jamás: no existía planificador.
 */

import { db } from '@/lib/db';
import { emitirEventoRealtimeAsync } from '@/lib/realtime-emitter';

const LOTE = 500;

export interface ResultadoEnvio {
  ok: true;
  campanaId: string;
  segmento: string;
  destinatarios: number;
  guardadas: number;
  entregadosEnVivo: number;
  sinConexion: number;
}

interface MetricasCliente {
  totalOrdenes: number;
  montoTotal: number;
  ultimaOrden: Date | null;
}

/**
 * Resuelve los destinatarios reales de un segmento.
 * Segmentos soportados (los mismos que ofrece la UI):
 *   todos, Clientes nuevos, Clientes frecuentes, Clientes inactivos, VIP,
 *   y por rol: cliente / repartidor / admin / ingeniero
 */
export async function resolverDestinatarios(segmento: string): Promise<Array<{ id: string }>> {
  const seg = (segmento || 'todos').trim();
  const segLower = seg.toLowerCase();

  if (segLower === 'todos') {
    return db.user.findMany({ select: { id: true } });
  }

  const rolesValidos = ['cliente', 'repartidor', 'admin', 'ingeniero'];
  if (rolesValidos.includes(segLower)) {
    return db.user.findMany({ where: { role: segLower }, select: { id: true } });
  }

  // ─── Segmentos que requieren métricas reales de compra ───
  const clientes = await db.user.findMany({ where: { role: 'cliente' }, select: { id: true, createdAt: true } });
  const ids = clientes.map((c) => c.id);
  if (ids.length === 0) return [];

  const [aggServicio, aggCompra] = await Promise.all([
    db.ordenServicio.groupBy({
      by: ['clienteId'],
      where: { clienteId: { in: ids } },
      _count: { _all: true },
      _sum: { monto: true },
      _max: { createdAt: true },
    }),
    db.ordenCompra.groupBy({
      by: ['clienteId'],
      where: { clienteId: { in: ids } },
      _count: { _all: true },
      _sum: { total: true },
      _max: { createdAt: true },
    }),
  ]);

  const metricas = new Map<string, MetricasCliente>();
  for (const id of ids) metricas.set(id, { totalOrdenes: 0, montoTotal: 0, ultimaOrden: null });

  const acumular = (
    filas: Array<{ clienteId: string; _count: { _all: number }; _sum: any; _max: { createdAt: Date | null } }>,
    campoMonto: 'monto' | 'total'
  ) => {
    for (const f of filas) {
      const m = metricas.get(f.clienteId);
      if (!m) continue;
      m.totalOrdenes += f._count?._all ?? 0;
      m.montoTotal += f._sum?.[campoMonto] ?? 0;
      const ultima = f._max?.createdAt ?? null;
      if (ultima && (!m.ultimaOrden || ultima > m.ultimaOrden)) m.ultimaOrden = ultima;
    }
  };

  acumular(aggServicio as any, 'monto');
  acumular(aggCompra as any, 'total');

  const ahora = Date.now();
  const DIAS_30 = 30 * 86400000;
  const DIAS_60 = 60 * 86400000;

  const seleccionados = clientes.filter((c) => {
    const m = metricas.get(c.id)!;

    if (seg === 'Clientes nuevos') {
      return ahora - c.createdAt.getTime() <= 14 * 86400000;
    }
    if (seg === 'Clientes frecuentes') {
      return m.totalOrdenes >= 3 && !!m.ultimaOrden && ahora - m.ultimaOrden.getTime() <= DIAS_60;
    }
    if (seg === 'Clientes inactivos') {
      // Registrados hace más de 30 días y sin actividad en los últimos 30 días
      const antiguedad = ahora - c.createdAt.getTime();
      const sinActividadReciente = !m.ultimaOrden || ahora - m.ultimaOrden.getTime() > DIAS_30;
      return antiguedad > DIAS_30 && sinActividadReciente;
    }
    if (seg === 'VIP') {
      // Alto valor: 10+ pedidos o C$2,000+ acumulados
      return m.totalOrdenes >= 10 || m.montoTotal >= 2000;
    }
    // Segmento desconocido: no inventamos audiencia
    return false;
  });

  return seleccionados.map((c) => ({ id: c.id }));
}

/**
 * Envía una campaña: persiste la notificación por usuario, emite por lotes de 500
 * y actualiza la campaña con métricas reales.
 */
export async function enviarCampana(campanaId: string): Promise<ResultadoEnvio> {
  const campana = await db.campana.findUnique({ where: { id: campanaId } });
  if (!campana) {
    throw Object.assign(new Error('Campaña no encontrada'), { status: 404 });
  }

  const segmento = campana.segmento || 'todos';
  const destinatarios = await resolverDestinatarios(segmento);

  let guardadas = 0;
  let entregadosEnVivo = 0;

  if (destinatarios.length > 0) {
    const filas = destinatarios.map((u) => ({
      userId: u.id,
      titulo: campana.titulo,
      contenido: campana.contenido,
      tipo: 'promocion',
      entidadId: campana.id,
      leida: false,
    }));

    for (let i = 0; i < filas.length; i += LOTE) {
      const res = await db.notificacionPush.createMany({ data: filas.slice(i, i + LOTE) });
      guardadas += res.count;
    }

    const salas = destinatarios.map((u) => `usuario:${u.id}`);
    for (let i = 0; i < salas.length; i += LOTE) {
      const r = await emitirEventoRealtimeAsync({
        rooms: salas.slice(i, i + LOTE),
        event: 'notificacion:push',
        data: {
          titulo: campana.titulo,
          contenido: campana.contenido,
          tipo: 'promocion',
          entidadId: campana.id,
        },
      });
      entregadosEnVivo += r?.entregados ?? 0;
    }
  }

  await db.campana.update({
    where: { id: campana.id },
    data: {
      estado: 'enviada',
      enviadaEn: new Date(),
      destinatarios: destinatarios.length,
    },
  });

  return {
    ok: true,
    campanaId: campana.id,
    segmento,
    destinatarios: destinatarios.length,
    guardadas,
    entregadosEnVivo,
    sinConexion: destinatarios.length - entregadosEnVivo,
  };
}
