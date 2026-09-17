import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import type { ServicioHistorial } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

function horaString(date: Date): string {
  return date.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fechaString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * GET /api/repartidor/ordenes/[id]
 * Devuelve el detalle de un servicio/orden del repartidor.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    let orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      const compra = await db.ordenCompra.findUnique({
        where: { id },
        include: { tienda: true, cliente: true },
      });
      if (!compra) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }
      if (compra.repartidorId && compra.repartidorId !== profile.id) {
        return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
      }

      const calificacionCompra = await db.calificacionRepartidor.findFirst({
        where: { ordenId: id },
      });

      const detalleCompra: ServicioHistorial & {
        fecha: string;
        metodoPago: 'efectivo' | 'transferencia';
        monto: number;
        clienteTelefono: string;
        calificacionComentario?: string | null;
      } = {
        id: compra.id,
        ordenId: compra.id,
        tipo: 'compra',
        cliente: compra.cliente?.name || 'Cliente Marketplace',
        tiendaNombre: compra.tienda?.nombre || 'Tienda Partner',
        origen: compra.tienda?.nombre || 'Tienda Partner',
        destino: compra.direccionEntrega || 'Managua',
        origenLat: compra.tienda?.lat != null ? Number(compra.tienda.lat) : undefined,
        origenLng: compra.tienda?.lng != null ? Number(compra.tienda.lng) : undefined,
        destinoLat: compra.lat != null ? Number(compra.lat) : undefined,
        destinoLng: compra.lng != null ? Number(compra.lng) : undefined,
        hora: horaString(compra.createdAt),
        kmRecorridos: Number((compra as any).kmEstimados || 0),
        ganancia: Math.round(Number(compra.costoEnvio || 0) > 0 ? Number(compra.costoEnvio) : Number(compra.total || 0) * 0.2),
        tiempoTotal: Number((compra as any).tiempoEstimado || 0),
        estado: 'entregado',
        calificacion: calificacionCompra?.estrellas ?? 5,
        fecha: fechaString(compra.createdAt),
        metodoPago: (compra.metodoPago === 'efectivo' ? 'efectivo' : 'transferencia') as 'efectivo' | 'transferencia',
        monto: Number(compra.total || 0),
        clienteTelefono: compra.cliente?.telefono ?? '',
        calificacionComentario: calificacionCompra?.comentario ?? null,
      };

      return NextResponse.json(detalleCompra);
    }

    if (orden.repartidorId && orden.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }

    const calificacion = await db.calificacionRepartidor.findFirst({
      where: { ordenId: id },
    });

    const detalle: ServicioHistorial & {
      fecha: string;
      metodoPago: 'efectivo' | 'transferencia';
      monto: number;
      clienteTelefono: string;
      calificacionComentario?: string | null;
    } = {
      id: orden.id,
      ordenId: orden.id,
      tipo: orden.tipo as 'envio' | 'compra',
      cliente: orden.clienteNombre,
      tiendaNombre: orden.tiendaNombre ?? undefined,
      origen: orden.origen,
      destino: orden.destino,
      origenLat: orden.origenLat ?? undefined,
      origenLng: orden.origenLng ?? undefined,
      destinoLat: orden.destinoLat ?? undefined,
      destinoLng: orden.destinoLng ?? undefined,
      hora: horaString(orden.createdAt),
      kmRecorridos: orden.kmRecorridos,
      ganancia: orden.ganancia,
      tiempoTotal: orden.tiempoTotal,
      estado: orden.estado === 'incidencia' ? 'incidencia' : 'entregado',
      incidenciaTipo: orden.incidenciaTipo ?? undefined,
      calificacion: calificacion?.estrellas,
      fecha: fechaString(orden.createdAt),
      metodoPago: orden.metodoPago as 'efectivo' | 'transferencia',
      monto: orden.monto,
      clienteTelefono: orden.clienteTelefono ?? '',
      calificacionComentario: calificacion?.comentario ?? null,
    };

    return NextResponse.json(detalle);
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_DETALLE_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener detalle de la orden' },
      { status: 500 }
    );
  }
}
