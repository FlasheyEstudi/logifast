import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/aceptar
 * Repartidor acepta la orden asignada o disponible.
 * Usa updateMany atómico para evitar race conditions (P0-19):
 * solo asigna si la orden sigue pendiente y sin repartidor.
 */
export async function PATCH(
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

    // Pilar 3, Regla 4: Límite máximo de 3 servicios activos simultáneos por repartidor
    const activeCount = await db.ordenServicio.count({
      where: {
        repartidorId: profile.id,
        estado: { in: ['asignado', 'aceptado', 'recogido'] },
      },
    });

    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (orden.repartidorId !== profile.id && activeCount >= 3) {
      return NextResponse.json(
        { error: 'Límite alcanzado: Ya tienes 3 servicios activos asignados al mismo tiempo.' },
        { status: 400 }
      );
    }

    // Caso 1: la orden ya está asignada a este repartidor — solo cambiar estado a aceptado
    if (orden.repartidorId === profile.id) {
      if (orden.estado !== 'asignado' && orden.estado !== 'pendiente') {
        return NextResponse.json(
          { error: `La orden no se puede aceptar en estado ${orden.estado}` },
          { status: 400 }
        );
      }
      await db.ordenServicio.update({
        where: { id },
        data: { estado: 'aceptado', aceptadoEn: new Date() },
      });
    } else if (orden.repartidorId && orden.repartidorId !== profile.id) {
      // Ya asignada a otro repartidor
      return NextResponse.json(
        { error: 'La orden ya está asignada a otro repartidor' },
        { status: 403 }
      );
    } else {
      // Caso 2: orden sin repartidor — asignación atómica con updateMany (P0-19)
      const result = await db.ordenServicio.updateMany({
        where: { id, repartidorId: null, estado: 'pendiente' },
        data: { repartidorId: profile.id, estado: 'aceptado', aceptadoEn: new Date() },
      });
      if (result.count === 0) {
        return NextResponse.json(
          { error: 'La orden ya fue aceptada por otro repartidor o no está disponible' },
          { status: 409 }
        );
      }
    }

    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: { enServicio: true },
    });

    // Actualizar moto a EN_SERVICIO si está asignada
    if (profile.motoId) {
      await db.moto.update({
        where: { id: profile.motoId },
        data: { estado: 'EN_SERVICIO' },
      }).catch(() => null);
    }

    const updatedOrder = await db.ordenServicio.findUnique({ where: { id } });
    if (updatedOrder) {
      try {
        const { emitOrdenActualizada } = await import('@/lib/realtime-emitter');
        emitOrdenActualizada(updatedOrder);
      } catch (e) {
        console.warn('[REALTIME_EMIT_WARN]', e);
      }
    }

    return NextResponse.json({
      ok: true,
      estado: 'aceptado',
      ordenId: id,
      repartidorId: profile.id,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_ACEPTAR]', error);
    return NextResponse.json(
      { error: 'Error al aceptar la orden' },
      { status: 500 }
    );
  }
}
