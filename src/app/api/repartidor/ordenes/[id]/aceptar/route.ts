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

    let orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      // Intentar buscar en ordenCompra (Marketplace)
      const ordenCompra = await db.ordenCompra.findUnique({ where: { id } });
      if (!ordenCompra) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }

      await db.ordenCompra.update({
        where: { id },
        data: { repartidorId: profile.id, estado: 'en_camino' },
      });
    } else {
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
    }

    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: { enServicio: true, conectado: true },
    });

    // Actualizar moto a EN_SERVICIO si está asignada
    if (profile.motoId) {
      await db.moto.update({
        where: { id: profile.motoId },
        data: { estado: 'EN_SERVICIO' },
      }).catch(() => null);
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
