import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runtimeState, calcularEstado, REPARTIDOR_ID } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/conexion
 * Body: { conectado: boolean }
 * Conecta/desconecta al repartidor del sistema de despacho.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { conectado } = body as { conectado?: boolean };

    if (typeof conectado !== 'boolean') {
      return NextResponse.json(
        { error: 'Se requiere "conectado" (boolean)' },
        { status: 400 }
      );
    }

    runtimeState.conectado = conectado;

    if (conectado) {
      runtimeState.pausado = false;
      runtimeState.pausaHasta = null;
      runtimeState.rechazosHora = 0;
      runtimeState.rechazosResetEn = Date.now() + 3600_000;
      if (!runtimeState.ordenActiva) {
        runtimeState.moto.estado = 'DISPONIBLE';
      }
    } else {
      runtimeState.ordenActiva = null;
      runtimeState.enServicio = false;
      runtimeState.moto.estado = 'DISPONIBLE';
    }

    const estado = calcularEstado();

    // Best-effort persistencia
    try {
      await db.repartidorProfile.update({
        where: { id: REPARTIDOR_ID },
        data: {
          conectado,
          enServicio: runtimeState.enServicio,
          pausado: runtimeState.pausado,
          pausaHasta: runtimeState.pausaHasta ? new Date(runtimeState.pausaHasta) : null,
          rechazosHora: runtimeState.rechazosHora,
        },
      });
    } catch (dbError) {
      console.warn('[REPARTIDOR_CONEXION_PATCH] DB skip:', dbError);
    }

    return NextResponse.json({
      ok: true,
      conectado,
      estado,
      enServicio: runtimeState.enServicio,
      pausado: runtimeState.pausado,
      pausaHasta: runtimeState.pausaHasta,
      rechazosHora: runtimeState.rechazosHora,
    });
  } catch (error) {
    console.error('[REPARTIDOR_CONEXION_PATCH]', error);
    return NextResponse.json(
      { error: 'Error al cambiar el estado de conexión' },
      { status: 500 }
    );
  }
}
