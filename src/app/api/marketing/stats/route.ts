import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketing/stats
 * Estadísticas reales de marketing calculadas desde la BD.
 */
export async function GET() {
  try {
    await requireRole('admin');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Clientes activos este mes (con al menos 1 orden)
    const [
      clientesActivosMes,
      clientesActivosMesPrev,
      ordenesMes,
      ordenesMesPrev,
      usuariosTotal,
      ordenesCompraMes,
      codigosUso,
      campanas,
    ] = await Promise.all([
      db.ordenServicio.findMany({
        where: { createdAt: { gte: startOfMonth } },
        distinct: ['clienteId'],
        select: { clienteId: true },
      }),
      db.ordenServicio.findMany({
        where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
        distinct: ['clienteId'],
        select: { clienteId: true },
      }),
      db.ordenServicio.findMany({
        where: { createdAt: { gte: startOfMonth }, estado: 'entregado' },
        select: { monto: true, clienteId: true, createdAt: true },
      }),
      db.ordenServicio.findMany({
        where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth }, estado: 'entregado' },
        select: { monto: true, clienteId: true, createdAt: true },
      }),
      db.user.count({ where: { role: 'cliente' } }),
      db.ordenCompra.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { total: true },
      }),
      db.usoCodigo.findMany({
        where: { usadoEn: { gte: new Date(now.getTime() - 30 * 86400_000) } },
        select: { usadoEn: true, descuento: true },
      }),
      db.campana.findMany({
        where: { estado: 'enviada' },
        select: { titulo: true, enviadaEn: true, destinatarios: true, abiertos: true, clicks: true },
        orderBy: { enviadaEn: 'desc' },
        take: 10,
      }),
    ]);

    const clientesActivos = clientesActivosMes.length;
    const clientesActivosPrev = clientesActivosMesPrev.length;
    const tendenciaActivos = clientesActivosPrev === 0
      ? (clientesActivos > 0 ? 100 : 0)
      : Math.round(((clientesActivos - clientesActivosPrev) / clientesActivosPrev) * 100);

    const totalOrdenesMes = ordenesMes.length;
    const totalOrdenesMesPrev = ordenesMesPrev.length;
    const tasaRetencion = clientesActivosPrev > 0
      ? Math.round(
          (ordenesMes.filter((o) => clientesActivosMesPrev.some((p) => p.clienteId === o.clienteId)).length /
            clientesActivosPrev) * 100
        )
      : 0;

    const valorPromedioEnvio = ordenesMes.length > 0
      ? Math.round(ordenesMes.reduce((s, o) => s + o.monto, 0) / ordenesMes.length)
      : 0;

    const revenueMes = ordenesCompraMes.reduce((s, o) => s + o.total, 0);

    // Frecuencia por cliente (este mes)
    const freqMap = new Map<string, number>();
    for (const o of ordenesMes) {
      freqMap.set(o.clienteId, (freqMap.get(o.clienteId) ?? 0) + 1);
    }
    const frecuencias = Array.from(freqMap.values());
    const frecuenciaData = [
      { rango: '1 envío', clientes: frecuencias.filter((f) => f === 1).length },
      { rango: '2-3 envíos', clientes: frecuencias.filter((f) => f >= 2 && f <= 3).length },
      { rango: '4-5 envíos', clientes: frecuencias.filter((f) => f >= 4 && f <= 5).length },
      { rango: '6+ envíos', clientes: frecuencias.filter((f) => f >= 6).length },
    ];
    const frecuenciaPromedio = frecuencias.length > 0
      ? Math.round((frecuencias.reduce((s, f) => s + f, 0) / frecuencias.length) * 10) / 10
      : 0;

    // Adquisición últimas 12 semanas
    const adquisicionData: { semana: string; nuevos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7 - 7);
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const nuevos = await db.user.count({
        where: {
          role: 'cliente',
          createdAt: { gte: start, lt: end },
        },
      });
      adquisicionData.push({ semana: `Sem ${12 - i}`, nuevos });
    }

    // Retención últimos 6 meses
    const retencionData: { mes: string; retencion: number }[] = [];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const prevEnd = start;

      const [prev, curr] = await Promise.all([
        db.ordenServicio.findMany({
          where: { createdAt: { gte: prevStart, lt: prevEnd } },
          distinct: ['clienteId'],
          select: { clienteId: true },
        }),
        db.ordenServicio.findMany({
          where: { createdAt: { gte: start, lt: end } },
          distinct: ['clienteId'],
          select: { clienteId: true },
        }),
      ]);
      const retenidos = curr.filter((c) => prev.some((p) => p.clienteId === c.clienteId)).length;
      const pct = prev.length > 0 ? Math.round((retenidos / prev.length) * 100) : 0;
      retencionData.push({ mes: meses[ref.getMonth()], retencion: pct });
    }

    // Revenue por segmento (basado en frecuencia de compra)
    const vipIds = new Set(Array.from(freqMap.entries()).filter(([, f]) => f >= 5).map(([id]) => id));
    const frecIds = new Set(Array.from(freqMap.entries()).filter(([, f]) => f >= 2 && f < 5).map(([id]) => id));
    const nuevosIds = new Set(Array.from(freqMap.entries()).filter(([, f]) => f === 1).map(([id]) => id));
    const revenueSegmento = [
      { segmento: 'VIP', revenue: ordenesMes.filter((o) => vipIds.has(o.clienteId)).reduce((s, o) => s + o.monto, 0) },
      { segmento: 'Frecuentes', revenue: ordenesMes.filter((o) => frecIds.has(o.clienteId)).reduce((s, o) => s + o.monto, 0) },
      { segmento: 'Nuevos', revenue: ordenesMes.filter((o) => nuevosIds.has(o.clienteId)).reduce((s, o) => s + o.monto, 0) },
      { segmento: 'Inactivos', revenue: 0 },
    ];

    // Campañas efectividad
    const campanaEfectividad = campanas.map((c) => ({
      nombre: c.titulo,
      abiertos: c.abiertos,
      clicks: c.clicks,
      enviados: c.destinatarios,
    }));

    // Uso de códigos por día (últimos 30 días)
    const codigosPorDia: { dia: string; usos: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dia = d.toISOString().split('T')[0];
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      const count = codigosUso.filter((u) => u.usadoEn >= start && u.usadoEn <= end).length;
      codigosPorDia.push({ dia, usos: count });
    }

    const stats = {
      clientesActivosMes: clientesActivos,
      tendenciaActivos,
      tasaRetencion,
      frecuenciaPromedio,
      valorPromedioEnvio,
      costoAdquisicion: 35, // Aproximado - se podría calcular con gastos de marketing
      totalOrdenesMes,
      totalOrdenesMesPrev,
      revenueMes,
      usuariosTotal,

      adquisicionData,
      retencionData,
      frecuenciaData,
      revenueSegmento,
      campanaEfectividad,
      codigosUso: codigosPorDia,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('[MARKETING_STATS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas de marketing' }, { status: 500 });
  }
}
