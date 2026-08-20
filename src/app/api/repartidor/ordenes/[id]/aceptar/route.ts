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

      if (ordenCompra.repartidorId && ordenCompra.repartidorId !== profile.id) {
        return NextResponse.json(
          { error: 'La orden ya está asignada a otro repartidor' },
          { status: 409 }
        );
      }

      // Asignación atómica en ordenCompra (P0-19)
      const result = await db.ordenCompra.updateMany({
        where: {
          id,
          OR: [
            { repartidorId: null },
            { repartidorId: profile.id },
          ],
        },
        data: { repartidorId: profile.id, estado: 'en_camino' },
      });

      if (result.count === 0) {
        return NextResponse.json(
          { error: 'La orden ya fue aceptada por otro repartidor o no está disponible' },
          { status: 409 }
        );
      }
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
          { status: 409 }
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

      // Sincronizar OrdenCompra vinculada (si aplica)
      if (orden.tiendaId) {
        await db.ordenCompra.updateMany({
          where: {
            tiendaId: orden.tiendaId,
            clienteId: orden.clienteId,
            estado: { in: ['recibido', 'preparando', 'listo', 'pendiente'] },
          },
          data: { repartidorId: profile.id, estado: 'en_camino' },
        }).catch(() => null);
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

    // Emitir eventos en tiempo real al cliente, admin y otros repartidores
    try {
      const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      // 1. Notificar a todos los repartidores que esta orden ya fue tomada para que desaparezca de sus pantallas
      emitirEventoRealtime({
        room: 'repartidores',
        event: 'repartidor:orden:tomada',
        data: { ordenId: id, repartidorId: profile.id },
      });
      // 2. Notificar al cliente con los datos reales del repartidor
      emitirEventoRealtime({
        room: `orden:${id}`,
        event: 'orden:estado:update',
        data: {
          id,
          estado: 'aceptado',
          repartidorId: profile.id,
          repartidor: {
            nombre: profile.nombre || rp.user.name || 'Repartidor',
            telefono: profile.telefono || rp.user.telefono || '',
            calificacion: profile.calificacion || 5.0,
            totalEntregas: profile.totalEntregas || 0,
            fotoUrl: rp.user.fotoUrl || null,
          },
        },
      });
      // 3. Notificar al admin
      emitirEventoRealtime({
        room: 'admin',
        event: 'admin:orden:actualizada',
        data: { id, estado: 'aceptado', repartidorId: profile.id },
      });
    } catch {}

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
