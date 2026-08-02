import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import type { OrdenActiva, ServicioHistorial } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

function horaString(date: Date): string {
  return date.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function mapOrdenToActiva(o: Awaited<ReturnType<typeof db.ordenServicio.findFirst>>): OrdenActiva | null {
  if (!o) return null;
  return {
    id: o.id,
    tipo: o.tipo as 'envio' | 'compra',
    cliente: o.clienteNombre,
    clienteTelefono: o.clienteTelefono ?? '',
    tiendaNombre: o.tiendaNombre ?? undefined,
    origen: o.origen,
    destino: o.destino,
    origenLat: o.origenLat,
    origenLng: o.origenLng,
    destinoLat: o.destinoLat,
    destinoLng: o.destinoLng,
    paquete: o.paquete ?? undefined,
    tamano: o.tamano ?? undefined,
    fragil: o.fragil,
    metodoPago: o.metodoPago as 'efectivo' | 'transferencia',
    monto: o.monto,
    ganancia: o.ganancia,
    kmEstimados: o.kmEstimados,
    tiempoEstimado: o.tiempoEstimado,
  };
}

/**
 * GET /api/repartidor/ordenes?estado=activa|historial
 */
export async function GET(req: NextRequest) {
  try {
    const repData = await getRepartidorProfile();
    if (!repData || !repData.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = repData;

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? 'activa';

    if (estado === 'historial') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const servicios = await db.ordenServicio.findMany({
        where: {
          repartidorId: profile.id,
          createdAt: { gte: startOfDay },
          estado: { in: ['entregado', 'incidencia', 'cancelado'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const ordenIds = servicios.map((s) => s.id);
      const cals = await db.calificacionRepartidor.findMany({
        where: { ordenId: { in: ordenIds } },
      });
      const calMap = new Map(cals.map((c) => [c.ordenId, c.estrellas]));

      const historial: ServicioHistorial[] = servicios.map((s) => ({
        id: s.id,
        ordenId: s.id,
        tipo: s.tipo as 'envio' | 'compra',
        cliente: s.clienteNombre,
        tiendaNombre: s.tiendaNombre ?? undefined,
        origen: s.origen,
        destino: s.destino,
        hora: horaString(s.createdAt),
        kmRecorridos: s.kmRecorridos,
        ganancia: s.ganancia,
        tiempoTotal: s.tiempoTotal,
        estado: (s.estado === 'incidencia' ? 'incidencia' : 'entregado') as 'entregado' | 'incidencia',
        incidenciaTipo: s.incidenciaTipo ?? undefined,
        calificacion: calMap.get(s.id) ?? undefined,
      }));

      return NextResponse.json({
        repartidorId: profile.id,
        total: historial.length,
        servicios: historial,
      });
    }

    // estado === 'activa'
    const ordenesPropiasDB = await db.ordenServicio.findMany({
      where: {
        repartidorId: profile.id,
        estado: { in: ['asignado', 'aceptado', 'recogido'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const ordenesDisponiblesDB = await db.ordenServicio.findMany({
      where: { estado: 'pendiente', repartidorId: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const ordenesActivas = ordenesPropiasDB.map((o) => mapOrdenToActiva(o)).filter(Boolean) as OrdenActiva[];
    const ordenesDisponibles = ordenesDisponiblesDB.map((o) => mapOrdenToActiva(o)).filter(Boolean) as OrdenActiva[];
    const ordenActual = ordenesActivas.length > 0 ? ordenesActivas[0] : null;

    return NextResponse.json({
      orden: ordenActual,
      ordenes: ordenesActivas,
      ordenesActivas,
      ordenesDisponibles,
      estadoServicio: ordenesPropiasDB[0]?.estado ?? 'libre',
      kmRecorridos: ordenesPropiasDB[0]?.kmRecorridos ?? 0,
      conectado: profile.conectado,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDENES_GET]', error);
    return NextResponse.json({
      orden: null,
      ordenes: [],
      ordenesActivas: [],
      ordenesDisponibles: [],
      conectado: true,
    });
  }
}
