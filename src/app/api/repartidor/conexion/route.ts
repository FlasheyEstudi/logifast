import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

type RepartidorEstado =
  | 'DESCONECTADO'
  | 'EN_LINEA'
  | 'ORDEN_ASIGNADA'
  | 'EN_CAMINO_RECOGER'
  | 'EN_PUNTO_RECOGIDA'
  | 'RECOGIDO'
  | 'EN_PUNTO_ENTREGA'
  | 'INCIDENCIA';

function calcularEstado(
  conectado: boolean,
  enServicio: boolean,
  estadoOrden: string | null
): RepartidorEstado {
  if (!conectado) return 'DESCONECTADO';
  if (!estadoOrden) return 'EN_LINEA';
  switch (estadoOrden) {
    case 'asignado': return 'ORDEN_ASIGNADA';
    case 'aceptado': return 'EN_CAMINO_RECOGER';
    case 'recogido': return 'RECOGIDO';
    case 'incidencia': return 'INCIDENCIA';
    default: return 'EN_LINEA';
  }
}

/**
 * GET /api/repartidor/conexion
 * Devuelve el estado de conexión actual del repartidor.
 */
export async function GET() {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const [ordenServicio, ordenCompra] = await Promise.all([
      db.ordenServicio.findFirst({
        where: {
          repartidorId: profile.id,
          estado: { in: ['asignado', 'aceptado', 'en_camino', 'en_camino_recoger', 'en_punto_recogida', 'recogido', 'en_punto_entrega'] },
        },
        select: { id: true, estado: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.ordenCompra.findFirst({
        where: {
          repartidorId: profile.id,
          estado: { in: ['asignado', 'aceptado', 'recibido', 'preparando', 'listo', 'en_camino', 'recogido', 'en_punto_recogida', 'en_punto_entrega'] },
        },
        select: { id: true, estado: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const ordenActiva = ordenServicio || ordenCompra;

    // Si tiene una orden activa o está en servicio, asegurar que figure conectado
    const isConectado = profile.conectado || !!ordenActiva || profile.enServicio;

    const estado = calcularEstado(
      isConectado,
      profile.enServicio,
      ordenActiva?.estado ?? null
    );

    return NextResponse.json(
      {
        conectado: profile.conectado,
        enServicio: profile.enServicio,
        pausado: profile.pausado,
        pausaHasta: profile.pausaHasta,
        estado,
        rechazosHora: profile.rechazosHora,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (error) {
    console.error('[REPARTIDOR_CONEXION_GET]', error);
    return NextResponse.json({
      conectado: false,
      enServicio: false,
      pausado: false,
      pausaHasta: null,
      estado: 'DESCONECTADO',
      rechazosHora: 0,
    });
  }
}

/**
 * PATCH /api/repartidor/conexion
 * Body: { accion: 'conectar' | 'desconectar' }
 */
export async function PATCH(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const body = await req.json();
    const accion = String(body.accion ?? '').toLowerCase();

    let conectado = profile.conectado;
    let enServicio = profile.enServicio;
    let paused = profile.pausado;
    let pausaHasta = profile.pausaHasta;

    if (accion === 'conectar') {
      if (!profile.contratoAceptado) {
        return NextResponse.json(
          { error: 'Debes aceptar el contrato primero' },
          { status: 400 }
        );
      }
      // Resetear rechazos si pasó 1h
      conectado = true;
      paused = false;
      pausaHasta = null;
    } else if (accion === 'desconectar') {
      conectado = false;
      enServicio = false;
    } else {
      return NextResponse.json(
        { error: 'Acción inválida. Usa conectar|desconectar' },
        { status: 400 }
      );
    }

    const updated = await db.repartidorProfile.update({
      where: { id: profile.id },
      data: {
        conectado,
        enServicio,
        pausado: paused,
        pausaHasta,
      },
    });

    const [ordenServicio, ordenCompra] = await Promise.all([
      db.ordenServicio.findFirst({
        where: {
          repartidorId: profile.id,
          estado: { in: ['asignado', 'aceptado', 'en_camino', 'en_camino_recoger', 'en_punto_recogida', 'recogido', 'en_punto_entrega'] },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.ordenCompra.findFirst({
        where: {
          repartidorId: profile.id,
          estado: { in: ['asignado', 'aceptado', 'recibido', 'preparando', 'listo', 'en_camino', 'recogido', 'en_punto_recogida', 'en_punto_entrega'] },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const ordenActiva = ordenServicio || ordenCompra;

    const estado = calcularEstado(
      updated.conectado,
      updated.enServicio,
      ordenActiva?.estado ?? null
    );

    return NextResponse.json({
      ok: true,
      conectado: updated.conectado,
      enServicio: updated.enServicio,
      pausado: updated.pausado,
      pausaHasta: updated.pausaHasta,
      estado,
    });
  } catch (error) {
    console.error('[REPARTIDOR_CONEXION_PATCH]', error);
    return NextResponse.json(
      { error: 'Error al actualizar conexión' },
      { status: 500 }
    );
  }
}
