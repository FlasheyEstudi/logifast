import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { excedeLimiteEnTx, limpiarPausaVencida, MAX_PEDIDOS_SIMULTANEOS, puedeTomarPedido } from '@/lib/repartidor/candados';
import { estadoServicioDesdeCompra } from '@/lib/estados-pedido';
import { enviarPushPedido, MENSAJE_ESTADO } from '@/lib/push/notificar-pedido';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/aceptar
 * Repartidor acepta la orden asignada o disponible.
 *
 * Garantías que antes no existían:
 *  1. Asignación atómica (`updateMany` condicional): dos repartidores compitiendo,
 *     uno gana y el otro recibe 409.
 *  2. Límite de 3 pedidos simultáneos validado en el BACKEND, también dentro de la
 *     transacción, para que ni otra pestaña ni un reintento lo salten.
 *  3. La OrdenCompra y su OrdenServicio avanzan JUNTAS: antes aceptar por la bolsa
 *     dejaba el servicio en `pendiente` y la compra en `en_camino`.
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

    // Pausa vencida = candado abierto.
    await limpiarPausaVencida(profile.id);

    // Candado previo (rápido). Se vuelve a comprobar dentro de la transacción.
    const permiso = await puedeTomarPedido(profile.id);
    if (!permiso.ok) {
      return NextResponse.json({ error: permiso.motivo, activos: permiso.activos }, { status: 409 });
    }

    const orden = await db.ordenServicio.findUnique({ where: { id } });
    const compra = orden ? null : await db.ordenCompra.findUnique({ where: { id } });

    if (!orden && !compra) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    let linkedCompraIds: string[] = [];
    let resultado: { estado: string } | null = null;

    // ─── PEDIDO DE TIENDA (OrdenCompra + OrdenServicio vinculado) ───
    if (compra) {
      if (compra.repartidorId && compra.repartidorId !== profile.id) {
        return NextResponse.json({ error: 'La orden ya está asignada a otro repartidor' }, { status: 409 });
      }
      if (compra.estado === 'cancelado' || compra.estado === 'entregado') {
        return NextResponse.json(
          { error: compra.estado === 'cancelado' ? 'Ese pedido fue cancelado' : 'Ese pedido ya fue entregado' },
          { status: 409 }
        );
      }

      try {
        resultado = await db.$transaction(async (tx) => {
          const res = await tx.ordenCompra.updateMany({
            where: {
              id,
              estado: { in: ['recibido', 'preparando', 'listo'] },
              OR: [{ repartidorId: null }, { repartidorId: profile.id }],
            },
            data: { repartidorId: profile.id, estado: 'en_camino' },
          });
          if (res.count === 0) throw new Error('NO_DISPONIBLE');

          // El servicio vinculado avanza con la compra. El PIN es parte de la clave:
          // sin él, este update alcanzaba todos los servicios del cliente en la
          // tienda. Si la compra no trae PIN no se adivina el vínculo.
          if (compra.codigoPin) {
            await tx.ordenServicio.updateMany({
              where: {
                tipo: 'compra',
                tiendaId: compra.tiendaId,
                clienteId: compra.clienteId,
                codigoPin: compra.codigoPin,
                estado: { in: ['pendiente', 'asignado'] },
              },
              data: { repartidorId: profile.id, estado: estadoServicioDesdeCompra('en_camino') },
            });
          }

          if (await excedeLimiteEnTx(tx, profile.id)) throw new Error('LIMITE');

          return { estado: 'en_camino' };
        });
      } catch (err) {
        const msg = (err as Error)?.message;
        if (msg === 'LIMITE') {
          return NextResponse.json(
            { error: `Ya llevas ${MAX_PEDIDOS_SIMULTANEOS} pedidos activos. Termina uno antes de tomar otro.` },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'La orden ya fue aceptada por otro repartidor o no está disponible' },
          { status: 409 }
        );
      }

      await db.repartidorProfile.update({
        where: { id: profile.id },
        data: { enServicio: true, conectado: true },
      }).catch(() => null);

      if (profile.motoId) {
        await db.moto.update({ where: { id: profile.motoId }, data: { estado: 'EN_SERVICIO' } }).catch(() => null);
      }

      try {
        const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
        const repNombre = profile.nombre || rp.user.name || 'Repartidor';
        const repData = {
          nombre: repNombre,
          telefono: profile.telefono || rp.user.telefono || '',
          calificacion: profile.calificacion || 5.0,
          totalEntregas: profile.totalEntregas || 0,
          fotoUrl: rp.user.fotoUrl || null,
        };

        emitirEventoRealtime({
          room: 'repartidores',
          event: 'repartidor:orden:tomada',
          data: { ordenId: id, repartidorId: profile.id },
        });
        for (const room of [`orden:${id}`, `usuario:${compra.clienteId}`, `tienda-ordenes:${compra.tiendaId}`]) {
          emitirEventoRealtime({
            room,
            event: 'orden:estado:update',
            data: { id, estado: 'en_camino', repartidorId: profile.id, repartidorNombre: repNombre, repartidor: repData },
          });
        }
        emitirEventoRealtime({ room: `repartidor:${profile.id}`, event: 'orden:estado:update', data: { id, estado: 'en_camino' } });

        // Push real al cliente: con la app cerrada el socket no llega.
        const avisoAceptar = MENSAJE_ESTADO.en_camino;
        if (avisoAceptar) {
          void enviarPushPedido({
            userId: compra.clienteId,
            ordenId: id,
            estado: 'en_camino',
            titulo: avisoAceptar.titulo,
            cuerpo: avisoAceptar.cuerpo,
            vista: 'tracking',
            tipoAlerta: avisoAceptar.alerta,
          }).catch(() => null);
        }
        emitirEventoRealtime({
          room: 'admin',
          event: 'admin:orden:actualizada',
          data: { id, estado: 'en_camino', repartidorId: profile.id },
        });
      } catch {}

      return NextResponse.json({ ok: true, estado: 'en_camino', ordenId: id, repartidorId: profile.id });
    }

    // ─── ENVÍO DE PAQUETE ───
    const ordenActual = orden!;
    if (ordenActual.repartidorId === profile.id) {
      if (ordenActual.estado !== 'asignado' && ordenActual.estado !== 'pendiente') {
        return NextResponse.json(
          { error: `La orden no se puede aceptar en estado ${ordenActual.estado}` },
          { status: 400 }
        );
      }
      try {
        await db.$transaction(async (tx) => {
          await tx.ordenServicio.update({
            where: { id },
            data: { estado: 'aceptado', aceptadoEn: new Date() },
          });
          if (await excedeLimiteEnTx(tx, profile.id)) throw new Error('LIMITE');
        });
      } catch (err) {
        if ((err as Error)?.message === 'LIMITE') {
          await db.ordenServicio.updateMany({
            where: { id, repartidorId: profile.id, estado: 'aceptado' },
            data: { estado: 'asignado' },
          }).catch(() => null);
          return NextResponse.json(
            { error: `Ya llevas ${MAX_PEDIDOS_SIMULTANEOS} pedidos activos.` },
            { status: 409 }
          );
        }
        throw err;
      }
    } else if (ordenActual.repartidorId && ordenActual.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'La orden ya está asignada a otro repartidor' }, { status: 409 });
    } else {
      try {
        await db.$transaction(async (tx) => {
          const res = await tx.ordenServicio.updateMany({
            where: { id, repartidorId: null, estado: 'pendiente' },
            data: { repartidorId: profile.id, estado: 'aceptado', aceptadoEn: new Date() },
          });
          if (res.count === 0) throw new Error('NO_DISPONIBLE');
          if (await excedeLimiteEnTx(tx, profile.id)) throw new Error('LIMITE');
        });
      } catch (err) {
        const msg = (err as Error)?.message;
        if (msg === 'LIMITE') {
          await db.ordenServicio.updateMany({
            where: { id, repartidorId: profile.id, estado: 'aceptado' },
            data: { repartidorId: null, estado: 'pendiente' },
          }).catch(() => null);
          return NextResponse.json(
            { error: `Ya llevas ${MAX_PEDIDOS_SIMULTANEOS} pedidos activos.` },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'La orden ya fue aceptada por otro repartidor o no está disponible' },
          { status: 409 }
        );
      }
    }

    // Sincronizar SolicitudEnvio vinculada (si aplica): mismo id que la OrdenServicio.
    await db.solicitudEnvio.updateMany({
      where: { id },
      data: { repartidorId: profile.id, estado: 'aceptada' },
    }).catch(() => null);

    // Sincronizar los pedidos de tienda creados con ese mismo PIN (compatibilidad con
    // el flujo viejo, donde el vínculo se resolvía por tienda+cliente).
    linkedCompraIds = [];
    if (ordenActual.tiendaId) {
      const linkedCompras = await db.ordenCompra.findMany({
        where: {
          tiendaId: ordenActual.tiendaId,
          clienteId: ordenActual.clienteId,
          estado: { in: ['recibido', 'preparando', 'listo', 'pendiente'] },
        },
        select: { id: true },
      }).catch(() => []);
      linkedCompraIds = (linkedCompras || []).map((c) => c.id);

      if (linkedCompraIds.length > 0) {
        await db.ordenCompra.updateMany({
          where: { id: { in: linkedCompraIds } },
          data: { repartidorId: profile.id, estado: 'en_camino' },
        }).catch(() => null);
      }
    }

    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: { enServicio: true, conectado: true },
    });

    if (profile.motoId) {
      await db.moto.update({
        where: { id: profile.motoId },
        data: { estado: 'EN_SERVICIO' },
      }).catch(() => null);
    }

    try {
      const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      const repNombre = profile.nombre || rp.user.name || 'Repartidor';
      const repData = {
        nombre: repNombre,
        telefono: profile.telefono || rp.user.telefono || '',
        calificacion: profile.calificacion || 5.0,
        totalEntregas: profile.totalEntregas || 0,
        fotoUrl: rp.user.fotoUrl || null,
      };

      emitirEventoRealtime({
        room: 'repartidores',
        event: 'repartidor:orden:tomada',
        data: { ordenId: id, repartidorId: profile.id },
      });

      // El dueño del envío escucha en su sala personal Y en la de la orden.
      for (const room of [`orden:${id}`, `usuario:${ordenActual.clienteId}`]) {
        emitirEventoRealtime({
          room,
          event: 'orden:estado:update',
          data: {
            id,
            estado: 'aceptado',
            repartidorId: profile.id,
            repartidorNombre: repNombre,
            repartidor: repData,
          },
        });
      }

      for (const compraId of linkedCompraIds) {
        emitirEventoRealtime({
          room: `orden:${compraId}`,
          event: 'orden:estado:update',
          data: {
            id: compraId,
            ordenServicioId: id,
            estado: 'en_camino',
            repartidorId: profile.id,
            repartidorNombre: repNombre,
            repartidor: repData,
          },
        });
      }

      emitirEventoRealtime({
        event: 'orden:estado:update',
        data: {
          id,
          linkedCompraIds,
          estado: 'aceptado',
          repartidorId: profile.id,
          repartidorNombre: repNombre,
          repartidor: repData,
        },
      });

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
    return NextResponse.json({ error: 'Error al aceptar la orden' }, { status: 500 });
  }
}
