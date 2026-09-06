import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { getOrdenPin } from '@/lib/utils';
import type { OrdenActiva, ServicioHistorial } from '@/lib/repartidor-store';
import { calcularDistanciaHaversine, calcularTiempoEstimado } from '@/lib/osrm';

export const dynamic = 'force-dynamic';

function horaString(date: Date): string {
  return date.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function mapOrdenToActiva(o: Awaited<ReturnType<typeof db.ordenServicio.findFirst>>): OrdenActiva | null {
  if (!o) return null;

  const hasCoords = typeof o.origenLat === 'number' && typeof o.origenLng === 'number' &&
                    typeof o.destinoLat === 'number' && typeof o.destinoLng === 'number' &&
                    (o.origenLat !== 0 || o.origenLng !== 0) && (o.destinoLat !== 0 || o.destinoLng !== 0);

  const validKm = (o.kmEstimados && o.kmEstimados > 0)
    ? o.kmEstimados
    : (hasCoords ? calcularDistanciaHaversine(o.origenLat!, o.origenLng!, o.destinoLat!, o.destinoLng!) : 0);

  const validTiempo = (o.tiempoEstimado && o.tiempoEstimado > 0)
    ? o.tiempoEstimado
    : (validKm > 0 ? calcularTiempoEstimado(validKm) : 0);

  return {
    id: o.id,
    tipo: o.tipo as 'envio' | 'compra',
    cliente: o.clienteNombre,
    clienteTelefono: o.clienteTelefono ?? '',
    tiendaNombre: o.tiendaNombre ?? undefined,
    origen: o.origen,
    destino: o.destino,
    origenLat: o.origenLat ?? 0,
    origenLng: o.origenLng ?? 0,
    destinoLat: o.destinoLat ?? 0,
    destinoLng: o.destinoLng ?? 0,
    paquete: o.paquete ?? undefined,
    paqueteFotoUrl: o.incidenciaDesc ?? undefined,
    tamano: o.tamano ?? undefined,
    fragil: o.fragil,
    metodoPago: o.metodoPago as 'efectivo' | 'transferencia',
    monto: o.monto,
    ganancia: o.ganancia,
    kmEstimados: validKm,
    tiempoEstimado: validTiempo,
    codigoPin: getOrdenPin(o.id, (o as any).codigoPin),
  };
}

function mapCompraToActiva(c: any): OrdenActiva | null {
  if (!c) return null;
  const origenNombre = c.tienda?.nombre || 'Tienda Partner';
  const origenLat = c.tienda?.lat != null ? Number(c.tienda.lat) : 0;
  const origenLng = c.tienda?.lng != null ? Number(c.tienda.lng) : 0;
  const totalMonto = Number(c.total || 0);
  const costoEnvio = Number(c.costoEnvio || 0);
  const gananciaCalculada = Math.round(costoEnvio > 0 ? costoEnvio : (totalMonto * 0.2));

  const destinoLat = c.lat != null ? Number(c.lat) : 0;
  const destinoLng = c.lng != null ? Number(c.lng) : 0;

  const hasCoords = origenLat !== 0 && origenLng !== 0 && destinoLat !== 0 && destinoLng !== 0;
  const validKm = (c.kmEstimados && Number(c.kmEstimados) > 0)
    ? Number(c.kmEstimados)
    : (hasCoords ? calcularDistanciaHaversine(origenLat, origenLng, destinoLat, destinoLng) : 0);

  const validTiempo = (c.tiempoEstimado && Number(c.tiempoEstimado) > 0)
    ? Number(c.tiempoEstimado)
    : (validKm > 0 ? calcularTiempoEstimado(validKm) : 0);

  return {
    id: c.id,
    tipo: 'compra',
    cliente: c.cliente?.name || 'Cliente Marketplace',
    clienteTelefono: c.cliente?.telefono || '',
    tiendaNombre: origenNombre,
    origen: origenNombre,
    destino: c.direccionEntrega || 'Managua',
    origenLat,
    origenLng,
    destinoLat,
    destinoLng,
    paquete: `Pedido #${c.id.slice(-5).toUpperCase()}`,
    metodoPago: (c.metodoPago === 'efectivo' ? 'efectivo' : 'transferencia') as 'efectivo' | 'transferencia',
    monto: totalMonto,
    ganancia: gananciaCalculada,
    kmEstimados: validKm,
    tiempoEstimado: validTiempo,
    codigoPin: getOrdenPin(c.id, c.codigoPin),
  };
}

/**
 * GET /api/repartidor/ordenes?estado=activa|historial
 * Soporta tanto Envíos (ordenServicio) como Pedidos de Tienda (ordenCompra).
 */
export async function GET(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? 'activa';

    if (estado === 'historial') {
      const [servicios, compras] = await Promise.all([
        db.ordenServicio.findMany({
          where: {
            repartidorId: profile.id,
            estado: { in: ['entregado', 'incidencia', 'cancelado'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        db.ordenCompra.findMany({
          where: {
            repartidorId: profile.id,
            estado: { in: ['entregado', 'cancelado'] },
          },
          include: { tienda: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

      // Cargar calificaciones
      const ordenIds = servicios.map((s) => s.id);
      const cals = await db.calificacionRepartidor.findMany({
        where: { ordenId: { in: ordenIds } },
      });
      const calMap = new Map(cals.map((c) => [c.ordenId, c.estrellas]));

      const historialServicios: ServicioHistorial[] = servicios.map((s) => ({
        id: s.id,
        ordenId: s.id,
        tipo: s.tipo as 'envio' | 'compra',
        cliente: s.clienteNombre,
        tiendaNombre: s.tiendaNombre ?? undefined,
        origen: s.origen,
        destino: s.destino,
        hora: horaString(s.createdAt),
        kmRecorridos: s.kmRecorridos || s.kmEstimados || 0,
        ganancia: s.ganancia,
        tiempoTotal: s.tiempoTotal,
        estado: (s.estado === 'incidencia' ? 'incidencia' : 'entregado') as 'entregado' | 'incidencia',
        incidenciaTipo: s.incidenciaTipo ?? undefined,
        calificacion: calMap.get(s.id) ?? undefined,
        paqueteFotoUrl: s.incidenciaDesc ?? undefined,
      }));

      const servicioIds = new Set(servicios.map((s) => s.id));
      const servicioTiendaIds = new Set(servicios.map((s) => s.tiendaId).filter(Boolean));
      const comprasUnicas = compras.filter((c: any) => !servicioIds.has(c.id) && !servicioTiendaIds.has(c.tiendaId));

      const historialCompras: ServicioHistorial[] = comprasUnicas.map((c: any) => ({
        id: c.id,
        ordenId: c.id,
        tipo: 'compra' as const,
        cliente: 'Cliente Marketplace',
        tiendaNombre: c.tienda?.nombre || 'Tienda Partner',
        origen: c.tienda?.nombre || 'Tienda Partner',
        destino: c.direccionEntrega || 'Managua',
        hora: horaString(c.createdAt),
        kmRecorridos: Number(c.kmEstimados || 0),
        ganancia: Math.round(c.costoEnvio > 0 ? c.costoEnvio : (c.total * 0.2)),
        tiempoTotal: Number(c.tiempoEstimado || 0),
        estado: 'entregado' as const,
        calificacion: 5,
      }));

      const historial = [...historialServicios, ...historialCompras].sort(
        (a, b) => b.id.localeCompare(a.id)
      );

      return NextResponse.json({
        repartidorId: profile.id,
        total: historial.length,
        servicios: historial,
      });
    }

    // Cargar ofertas disponibles y órdenes activas asignadas (unificando Envíos y Pedidos de Tienda)
    const [ofertasServicio, ofertasCompra, ordenesServicio, ordenesCompra] = await Promise.all([
      db.ordenServicio.findMany({
        where: { estado: 'pendiente', repartidorId: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.ordenCompra.findMany({
        where: { estado: { in: ['recibido', 'preparando', 'pendiente'] }, repartidorId: null },
        include: { tienda: true, cliente: true, items: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.ordenServicio.findMany({
        where: {
          repartidorId: profile.id,
          estado: { in: ['asignado', 'aceptado', 'en_camino', 'en_camino_recoger', 'en_punto_recogida', 'recogido', 'en_punto_entrega', 'pendiente_confirmacion'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.ordenCompra.findMany({
        where: {
          repartidorId: profile.id,
          estado: { in: ['asignado', 'aceptado', 'en_camino', 'recogido', 'en_punto_recogida', 'en_punto_entrega'] },
        },
        include: { tienda: true, cliente: true, items: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const activeServicioIds = new Set(ordenesServicio.map((s) => s.id));
    const activeServicioTiendaIds = new Set(ordenesServicio.map((s) => s.tiendaId).filter(Boolean));
    const ordenesCompraUnicas = ordenesCompra.filter(
      (c) => !activeServicioIds.has(c.id) && !activeServicioTiendaIds.has(c.tiendaId)
    );

    const ofertaServicioIds = new Set(ofertasServicio.map((s) => s.id));
    const ofertaServicioTiendaIds = new Set(ofertasServicio.map((s) => s.tiendaId).filter(Boolean));
    const ofertasCompraUnicas = ofertasCompra.filter(
      (c) => !ofertaServicioIds.has(c.id) && !ofertaServicioTiendaIds.has(c.tiendaId)
    );

    const ofertasDisponibles = [
      ...ofertasServicio.map((o) => mapOrdenToActiva(o)).filter(Boolean),
      ...ofertasCompraUnicas.map((c) => mapCompraToActiva(c)).filter(Boolean),
    ] as OrdenActiva[];

    const ordenesActivas = [
      ...ordenesServicio.map((o) => mapOrdenToActiva(o)).filter(Boolean),
      ...ordenesCompraUnicas.map((c) => mapCompraToActiva(c)).filter(Boolean),
    ] as OrdenActiva[];

    return NextResponse.json({
      orden: ordenesActivas[0] || null,
      ordenes: ordenesActivas,
      ofertas: ofertasDisponibles,
      estadoServicio: ordenesActivas.length > 0 ? 'en_servicio' : 'disponible',
      kmRecorridos: ordenesServicio[0]?.kmRecorridos ?? 0,
      conectado: profile.conectado,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDENES_GET]', error);
    return NextResponse.json({
      orden: null,
      ordenes: [],
      conectado: true,
    });
  }
}
