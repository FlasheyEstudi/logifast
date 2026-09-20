import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { sincronizarServicioConCompra } from '@/lib/tienda/sincronizar-pedido';
import { enviarPushPedido, MENSAJE_ESTADO } from '@/lib/push/notificar-pedido';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/recoger
 * Repartidor marca que recogió el paquete o el pedido de tienda.
 *
 * En una compra, la recogida mantiene la compra y su OrdenServicio en el MISMO
 * estado (`en_camino`): el pedido ya salió del local y va camino al cliente. Antes
 * esta rama no comprobaba propiedad ni sincronizaba nada.
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

    const orden = await db.ordenServicio.findUnique({ where: { id } });

    if (!orden) {
      const compra = await db.ordenCompra.findUnique({ where: { id } });
      if (!compra) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }
      if (compra.repartidorId !== profile.id) {
        return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
      }
      if (compra.estado === 'cancelado' || compra.estado === 'entregado') {
        return NextResponse.json({ error: 'Este pedido ya está cerrado' }, { status: 409 });
      }

      const actualizada = await db.$transaction(async (tx) => {
        const res = await tx.ordenCompra.updateMany({
          where: { id, repartidorId: profile.id, estado: { in: ['recibido', 'preparando', 'listo', 'en_camino'] } },
          data: { estado: 'en_camino' },
        });
        if (res.count === 0) return null;

        await sincronizarServicioConCompra({
          tx,
          estadoCompra: 'en_camino',
          tiendaId: compra.tiendaId,
          clienteId: compra.clienteId,
          codigoPin: compra.codigoPin,
          extra: { repartidorId: profile.id, recogidoEn: new Date() },
        });
        return tx.ordenCompra.findUnique({ where: { id } });
      });

      if (!actualizada) {
        return NextResponse.json({ error: 'El pedido cambió de estado. Recarga tu lista.' }, { status: 409 });
      }

      try {
        const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
        for (const room of [`orden:${id}`, `usuario:${compra.clienteId}`, `tienda-ordenes:${compra.tiendaId}`]) {
          emitirEventoRealtime({
            room,
            event: 'orden:estado:update',
            data: { id, estado: 'recogido', repartidorId: profile.id },
          });
        }
        emitirEventoRealtime({
          room: 'admin',
          event: 'admin:orden:actualizada',
          data: { id, estado: 'recogido', repartidorId: profile.id },
        });
      } catch {}

      const avisoRecoger = MENSAJE_ESTADO.recogido;
      if (avisoRecoger) {
        void enviarPushPedido({
          userId: compra.clienteId,
          ordenId: id,
          estado: 'recogido',
          titulo: avisoRecoger.titulo,
          cuerpo: avisoRecoger.cuerpo,
          vista: 'tracking',
          tipoAlerta: avisoRecoger.alerta,
        }).catch(() => null);
      }

      return NextResponse.json({ ok: true, estado: 'recogido', ordenId: id });
    }

    if (orden.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }
    if (orden.estado === 'cancelado' || orden.estado === 'entregado') {
      return NextResponse.json({ error: 'Esta orden ya está cerrada' }, { status: 409 });
    }

    const res = await db.ordenServicio.updateMany({
      where: { id, repartidorId: profile.id, estado: { notIn: ['entregado', 'cancelado'] } },
      data: { estado: 'recogido', recogidoEn: new Date() },
    });
    if (res.count === 0) {
      return NextResponse.json({ error: 'La orden cambió de estado. Recarga tu lista.' }, { status: 409 });
    }

    try {
      const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      for (const room of [`orden:${id}`, `usuario:${orden.clienteId}`]) {
        emitirEventoRealtime({
          room,
          event: 'orden:estado:update',
          data: { id, estado: 'recogido', repartidorId: profile.id },
        });
      }
      emitirEventoRealtime({
        room: 'admin',
        event: 'admin:orden:actualizada',
        data: { id, estado: 'recogido', repartidorId: profile.id },
      });
    } catch {}

    return NextResponse.json({ ok: true, estado: 'recogido', ordenId: id });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_RECOGER]', error);
    return NextResponse.json({ error: 'Error al marcar como recogido' }, { status: 500 });
  }
}
