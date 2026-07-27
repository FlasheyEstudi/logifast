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
    const { profile } = await getRepartidorProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ordenActiva = await db.ordenServicio.findFirst({
      where: {
        repartidorId: profile.id,
        estado: { in: ['asignado', 'aceptado', 'recogido'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const estado = calcularEstado(
      profile.conectado,
      profile.enServicio,
      ordenActiva?.estado ?? null
    );

    return NextResponse.json({
      conectado: profile.conectado,
      enServicio: profile.enServicio,
      pausado: profile.pausado,
      pausaHasta: profile.pausaHasta,
      estado,
      rechazosHora: profile.rechazosHora,
    });
  } catch (error) {
    console.error('[REPARTIDOR_CONEXION_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de conexión' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/repartidor/conexion
 * Body: { accion: 'conectar' | 'desconectar' }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { profile } = await getRepartidorProfile();
    if (!profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      if (profile.saldo <= 0) {
        return NextResponse.json(
          { error: 'Saldo insuficiente. Recarga tu cuenta.' },
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

    const ordenActiva = await db.ordenServicio.findFirst({
      where: {
        repartidorId: profile.id,
        estado: { in: ['asignado', 'aceptado', 'recogido'] },
      },
      orderBy: { createdAt: 'desc' },
    });

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
