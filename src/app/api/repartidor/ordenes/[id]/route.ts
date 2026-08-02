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

    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    if (orden.repartidorId !== profile.id) {
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
