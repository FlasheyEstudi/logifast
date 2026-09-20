import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { COMPRA_NO_CANCELABLE, SERVICIO_NO_CANCELABLE } from '@/lib/estados-pedido';
import { sincronizarServicioConCompra } from '@/lib/tienda/sincronizar-pedido';
import { stockEsReembolsable } from '@/lib/tienda/reversion-compra';
import { emitOrdenActualizada, emitirEventoRealtime } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/ordenes/[id]
 * Actualiza el estado o reasigna el repartidor de una orden en la BD.
 * - Solo el cliente dueño, el repartidor asignado o un admin pueden modificar.
 *
 * Los estados de COMPRA se validan contra la máquina de estados compartida y, al
 * cambiar, se alinea la OrdenServicio vinculada. Antes cualquier cliente podía
 * escribir cualquier estado y la compra quedaba desincronizada del servicio.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Ownership check: cargar la orden (ordenServicio u ordenCompra)
    let isCompra = false;
    let orden = await db.ordenServicio.findUnique({
      where: { id },
      select: { clienteId: true, repartidorId: true },
    });

    let compraRef: { tiendaId: string; clienteId: string; codigoPin: string | null; estado: string } | null = null;

    if (!orden) {
      const ordenCompra = await db.ordenCompra.findUnique({
        where: { id },
        select: { clienteId: true, repartidorId: true, tiendaId: true, codigoPin: true, estado: true },
      });
      if (!ordenCompra) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }
      isCompra = true;
      compraRef = {
        tiendaId: ordenCompra.tiendaId,
        clienteId: ordenCompra.clienteId,
        codigoPin: ordenCompra.codigoPin,
        estado: ordenCompra.estado,
      };
      orden = { clienteId: ordenCompra.clienteId, repartidorId: ordenCompra.repartidorId };
    }

    // Si es repartidor, validar que sea el asignado a esta orden
    if (user.role === 'repartidor') {
      const myProfile = await db.repartidorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!myProfile || orden.repartidorId !== myProfile.id) {
        return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
      }
    } else if (user.role === 'cliente') {
      if (orden.clienteId !== user.id) {
        return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
      }
    } else if (user.role !== 'admin' && user.role !== 'ingeniero') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { estado, repartidorId, incidenciaTipo, incidenciaDesc } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (estado !== undefined) dataToUpdate.estado = estado;
    if (incidenciaTipo !== undefined) dataToUpdate.incidenciaTipo = incidenciaTipo;
    if (incidenciaDesc !== undefined) dataToUpdate.incidenciaDesc = incidenciaDesc;

    // Reasignación de repartidor — solo admin puede reasignar
    if (repartidorId !== undefined) {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Solo un admin puede reasignar órdenes' }, { status: 403 });
      }
      const profile = await db.repartidorProfile.findFirst({
        where: {
          OR: [
            { id: repartidorId },
            { userId: repartidorId },
            { user: { name: { contains: repartidorId } } },
          ],
        },
        include: { user: true },
      });
      dataToUpdate.repartidorId = profile ? profile.id : repartidorId;
      if (estado === undefined) {
        dataToUpdate.estado = 'asignado';
      }

      if (profile) {
        await db.notificacionRepartidor.create({
          data: {
            repartidorId: profile.id,
            tipo: 'reasignacion',
            titulo: 'Orden reasignada',
            contenido: `La orden ${id} te ha sido asignada por el Administrador.`,
            leido: false,
            ordenId: id,
          },
        }).catch(() => null);
      }
    }

    let ordenActualizada;
    if (isCompra && compraRef) {
      // En una COMPRA solo se aceptan los estados de su máquina; cualquier otro se
      // ignora en vez de traducirse a un estado arbitrario como antes.
      const compraData: Record<string, unknown> = {};
      if (dataToUpdate.repartidorId !== undefined) compraData.repartidorId = dataToUpdate.repartidorId;
      if (dataToUpdate.estado !== undefined) {
        const est = String(dataToUpdate.estado);
        const destino =
          est === 'asignado' || est === 'aceptado' || est === 'encamino' || est === 'en_camino'
            ? 'en_camino'
            : est === 'entregado'
            ? 'entregado'
            : est === 'cancelado'
            ? 'cancelado'
            : null;
        if (destino) compraData.estado = destino;
      } else if (dataToUpdate.repartidorId !== undefined) {
        compraData.estado = 'en_camino';
      }

      ordenActualizada = await db.$transaction(async (tx) => {
        const res = await tx.ordenCompra.updateMany({
          where: { id, estado: compraRef!.estado },
          data: compraData,
        });
        if (res.count === 0) return null;

        if (typeof compraData.estado === 'string') {
          await sincronizarServicioConCompra({
            tx,
            estadoCompra: compraData.estado,
            tiendaId: compraRef!.tiendaId,
            clienteId: compraRef!.clienteId,
            codigoPin: compraRef!.codigoPin,
            extra:
              compraData.repartidorId !== undefined
                ? { repartidorId: compraData.repartidorId ?? null }
                : {},
          });
        }

        return tx.ordenCompra.findUnique({ where: { id } });
      });

      if (!ordenActualizada) {
        return NextResponse.json(
          { error: 'La orden cambió de estado mientras la actualizabas. Recarga y reintenta.' },
          { status: 409 }
        );
      }
    } else {
      ordenActualizada = await db.ordenServicio.update({
        where: { id },
        data: dataToUpdate,
      });
    }

    try {
      const { emitOrdenActualizada: emitir, emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      emitir(ordenActualizada);
      emitirEventoRealtime({
        room: `orden:${id}`,
        event: 'orden:estado:update',
        data: ordenActualizada,
      });
      if ((dataToUpdate as any).estado === 'incidencia') {
        emitirEventoRealtime({
          room: `orden:${id}`,
          event: 'orden:incidencia',
          data: {
            ordenId: id,
            tipo: dataToUpdate.incidenciaTipo || 'Incidencia',
            descripcion: dataToUpdate.incidenciaDesc || '',
            estado: 'incidencia',
          },
        });
      }
    } catch {}

    return NextResponse.json({ ok: true, orden: ordenActualizada });
  } catch (error) {
    console.error('[ORDEN_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 });
  }
}

/**
 * DELETE /api/ordenes/[id]
 * Cancela una orden. Solo el cliente dueño o un admin.
 *
 * La cancelación es CONDICIONAL y transaccional: se exige el estado que se leyó, así
 * que si el repartidor acepta en el mismo instante, gana uno de los dos y el otro
 * recibe 409 en vez de dejar una orden asignada y cancelada a la vez.
 *
 * Al cancelar una compra se libera al repartidor, se devuelve el stock y se revierte
 * el cupón: sin eso quedaba mercadería descontada y un cupón gastado por una venta
 * que nunca ocurrió.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const servicio = await db.ordenServicio.findUnique({
      where: { id },
      select: { id: true, clienteId: true, estado: true },
    });
    const compra = servicio
      ? null
      : await db.ordenCompra.findUnique({
          where: { id },
          select: {
            id: true,
            clienteId: true,
            estado: true,
            tiendaId: true,
            codigoPin: true,
            codigoUsado: true,
            repartidorId: true,
            items: { select: { productoId: true, cantidad: true } },
          },
        });

    if (!servicio && !compra) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const duenoId = servicio?.clienteId ?? compra!.clienteId;
    if (user.role === 'cliente' && duenoId !== user.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }
    if (user.role !== 'cliente' && user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const estadoActual = servicio?.estado ?? compra!.estado;

    // ─── COMPRA ───
    if (compra) {
      if (COMPRA_NO_CANCELABLE.includes(estadoActual as (typeof COMPRA_NO_CANCELABLE)[number])) {
        return NextResponse.json(
          { error: estadoActual === 'entregado' ? 'No se puede cancelar un pedido ya entregado' : 'Este pedido ya está cancelado' },
          { status: 400 }
        );
      }

      const cancelada = await db.$transaction(async (tx) => {
        const res = await tx.ordenCompra.updateMany({
          where: { id, estado: estadoActual },
          data: { estado: 'cancelado', repartidorId: null },
        });
        if (res.count === 0) return null;

        // El servicio vinculado se cierra y suelta al repartidor.
        await sincronizarServicioConCompra({
          tx,
          estadoCompra: 'cancelado',
          tiendaId: compra.tiendaId,
          clienteId: compra.clienteId,
          codigoPin: compra.codigoPin,
          extra: { repartidorId: null },
        });

        // Devolver stock y cupón con la MISMA regla que usa la tienda al rechazar.
        if (stockEsReembolsable(estadoActual)) {
          for (const item of compra.items) {
            await tx.producto.updateMany({
              where: { id: item.productoId, stock: { not: null } },
              data: { stock: { increment: item.cantidad } },
            });
          }
        }

        if (compra.codigoUsado) {
          const promo = await tx.codigoPromocional.findUnique({ where: { codigo: compra.codigoUsado } });
          if (promo) {
            const uso = await tx.usoCodigo
              .findFirst({ where: { ordenId: id, codigoId: promo.id } })
              .catch(() => null);
            if (uso) await tx.usoCodigo.delete({ where: { id: uso.id } }).catch(() => null);
            await tx.codigoPromocional.update({
              where: { id: promo.id },
              data: { usosActuales: { decrement: 1 } },
            }).catch(() => null);
          }
        }

        return tx.ordenCompra.findUnique({ where: { id } });
      });

      if (!cancelada) {
        return NextResponse.json(
          { error: 'El pedido cambió justo ahora (puede que el repartidor lo haya aceptado). Actualiza la lista para ver su estado real.' },
          { status: 409 }
        );
      }

      emitirEventoRealtime({ room: 'admin', event: 'admin:orden:eliminada', data: { id } });
      emitirEventoRealtime({ room: 'admin', event: 'admin:orden:actualizada', data: cancelada });
      emitOrdenActualizada(cancelada);
      emitirEventoRealtime({
        room: `orden:${id}`,
        event: 'orden:cancelada',
        data: { id, canceladaPor: user.role, estado: 'cancelado' },
      });
      // El cliente dueño y la tienda reciben el cierre aunque no tengan la sala abierta.
      emitirEventoRealtime({
        room: `usuario:${compra.clienteId}`,
        event: 'orden:estado:update',
        data: { id, estado: 'cancelado', canceladaPor: user.role },
      });
      emitirEventoRealtime({
        room: `tienda-ordenes:${compra.tiendaId}`,
        event: 'tienda:orden:actualizada',
        data: { id, estado: 'cancelado' },
      });
      if (compra.repartidorId) {
        emitirEventoRealtime({
          room: `repartidor:${compra.repartidorId}`,
          event: 'repartidor:orden:cancelada',
          data: { ordenId: id, motivo: 'El cliente canceló el pedido' },
        });
      }

      return NextResponse.json({ ok: true, orden: cancelada, estado: 'cancelado', stockDevuelto: true });
    }

    // ─── ENVÍO DE PAQUETE (OrdenServicio) ───
    if (SERVICIO_NO_CANCELABLE.includes(estadoActual as (typeof SERVICIO_NO_CANCELABLE)[number])) {
      return NextResponse.json(
        { error: estadoActual === 'entregado' ? 'No se puede cancelar una orden ya entregada' : 'Esta orden ya está cancelada' },
        { status: 400 }
      );
    }

    const cancelada = await db.ordenServicio.updateMany({
      where: { id, estado: estadoActual },
      data: {
        estado: 'cancelado',
        repartidorId: null,
        incidenciaTipo: 'cancelacion',
        incidenciaDesc: `Cancelado por ${user.name || user.email} (${user.role})`,
      },
    });
    if (cancelada.count === 0) {
      return NextResponse.json(
        { error: 'La orden cambió justo ahora (puede que el repartidor la haya aceptado). Actualiza para ver su estado real.' },
        { status: 409 }
      );
    }

    const actualizada = await db.ordenServicio.findUnique({ where: { id } });

    emitirEventoRealtime({ room: 'admin', event: 'admin:orden:eliminada', data: { id } });
    if (actualizada) emitOrdenActualizada(actualizada);
    emitirEventoRealtime({
      room: `orden:${id}`,
      event: 'orden:cancelada',
      data: { id, canceladaPor: user.role, estado: 'cancelado' },
    });

    return NextResponse.json({ ok: true, orden: actualizada, estado: 'cancelado' });
  } catch (error) {
    console.error('[ORDEN_DELETE]', error);
    return NextResponse.json({ error: 'Error al cancelar la orden' }, { status: 500 });
  }
}
