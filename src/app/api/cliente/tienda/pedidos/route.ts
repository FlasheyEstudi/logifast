import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { ok } from '@/lib/auth/helpers';
import { buscarTiendaCompleta } from '@/lib/auth/tienda-acceso';
import { transicionCompraValida } from '@/lib/estados-pedido';
import { sincronizarServicioConCompra } from '@/lib/tienda/sincronizar-pedido';
import { facturarCompra } from '@/lib/tienda/facturacion';
import { revertirCompra } from '@/lib/tienda/reversion-compra';
import { enviarPushPedido, MENSAJE_ESTADO } from '@/lib/push/notificar-pedido';
import { emitOrdenActualizada, emitirEventoRealtime } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/tienda/pedidos
 * Devuelve los pedidos recibidos por la tienda del usuario autenticado.
 *
 * La tienda puede ser propia o por invitación (`TiendaUsuario`): antes esta ruta
 * solo miraba `propietarioId`, así que un cajero invitado veía la lista vacía.
 */
export async function GET(_req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return ok({ ok: true, pedidos: [] });
    }

    try {
      const tienda = await buscarTiendaCompleta(user);
      if (!tienda) {
        return ok({ ok: true, pedidos: [] });
      }

      const ordenes = await db.ordenCompra.findMany({
        where: { tiendaId: tienda.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          items: true,
          cliente: { select: { id: true, name: true, telefono: true } },
          repartidor: { select: { id: true, nombre: true, telefono: true } },
        },
      });

      // La forma que ya consumía el KDS se mantiene; solo se agregan los campos que
      // le faltaban para distinguir pedidos de reparto y de retiro, y para mostrar
      // al repartidor asignado sin otra petición.
      const pedidos = ordenes.map((o) => ({
        ...o,
        clienteNombre: o.cliente?.name ?? 'Cliente',
        clienteTelefono: o.cliente?.telefono ?? '',
        repartidorNombre: o.repartidor?.nombre ?? null,
        fecha: o.createdAt.toISOString().slice(0, 10),
        hora: o.createdAt.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false }),
      }));

      return ok({ ok: true, pedidos });
    } catch (dbErr) {
      console.warn('[CLIENTE_TIENDA_PEDIDOS_DB]', dbErr);
    }

    return ok({ ok: true, pedidos: [] });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_PEDIDOS]', error);
    return ok({ ok: true, pedidos: [] });
  }
}

/**
 * PATCH /api/cliente/tienda/pedidos
 * Actualiza el estado de un pedido recibido en la tienda del usuario autenticado.
 * Body: { id, estado }
 *
 * La transición se valida contra la máquina de estados compartida y, al cambiar,
 * se alinea la OrdenServicio vinculada para que el repartidor y el cliente vean lo
 * mismo. Antes cada entidad avanzaba por su cuenta y quedaban desincronizadas.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return NextResponse.json({ error: 'Se requiere id y estado' }, { status: 400 });
    }

    const tienda = await buscarTiendaCompleta(user);
    if (!tienda) {
      return NextResponse.json({ error: 'No tienes una tienda' }, { status: 404 });
    }

    const orden = await db.ordenCompra.findUnique({
      where: { id },
      select: {
        id: true,
        tiendaId: true,
        estado: true,
        clienteId: true,
        codigoPin: true,
        codigoUsado: true,
        repartidorId: true,
        items: { select: { productoId: true, cantidad: true } },
      },
    });
    if (!orden) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    if (orden.tiendaId !== tienda.id) {
      return NextResponse.json({ error: 'No autorizado para este pedido' }, { status: 403 });
    }

    if (!transicionCompraValida(orden.estado, String(estado))) {
      return NextResponse.json(
        { error: `Transición no válida: ${orden.estado} → ${estado}` },
        { status: 400 }
      );
    }

    // Actualización CONDICIONAL: si el cliente canceló entre la lectura y la
    // escritura, `count` es 0 y no se resucita un pedido cancelado.
    let reversion: { stockDevuelto: boolean; cuponRevertido: boolean } = { stockDevuelto: false, cuponRevertido: false };
    const actualizado = await db.$transaction(async (tx) => {
      const res = await tx.ordenCompra.updateMany({
        where: { id, tiendaId: tienda.id, estado: orden.estado },
        data: {
          estado: String(estado),
          ...(estado === 'listo' ? { listoEn: new Date() } : {}),
          // Rechazar libera al repartidor: el pedido muere ahí.
          ...(estado === 'cancelado' ? { repartidorId: null } : {}),
        },
      });
      if (res.count === 0) return null;

      await sincronizarServicioConCompra({
        tx,
        estadoCompra: String(estado),
        tiendaId: tienda.id,
        clienteId: orden.clienteId,
        codigoPin: orden.codigoPin,
        extra: estado === 'cancelado' ? { repartidorId: null } : {},
      });

      // Rechazo de la tienda: el stock descontado en el checkout vuelve a su sitio y
      // el cupón deja de contar como usado (misma regla que la cancelación del
      // cliente; antes el rechazo no devolvía nada).
      if (estado === 'cancelado') {
        reversion = await revertirCompra(tx, {
          id: orden.id,
          estado: orden.estado,
          tiendaId: orden.tiendaId,
          items: orden.items,
          codigoUsado: orden.codigoUsado,
        });
      }

      return tx.ordenCompra.findUnique({ where: { id } });
    });

    if (!actualizado) {
      return NextResponse.json(
        { error: 'El pedido cambió de estado mientras lo actualizabas. Recarga la lista.' },
        { status: 409 }
      );
    }

    // El cliente recibe el cambio al instante (sala de tracking + su sala personal).
    emitOrdenActualizada(actualizado);
    emitirEventoRealtime({
      room: `usuario:${orden.clienteId}`,
      event: 'orden:estado:update',
      data: {
        id,
        estado: String(estado),
        tiendaNombre: tienda.nombre,
        ...(estado === 'cancelado' ? { motivo: 'La tienda rechazó el pedido' } : {}),
      },
    });

    // Push real: es el único canal que despierta el teléfono con la app CERRADA.
    // El socket de arriba solo alcanza a quien tiene la app abierta. La deduplicación
    // por (pedido + estado) vive en `enviarPushPedido`, así que un reintento o una
    // reconexión no producen avisos repetidos.
    const aviso = MENSAJE_ESTADO[String(estado)];
    if (aviso) {
      void enviarPushPedido({
        userId: orden.clienteId,
        ordenId: id,
        estado: String(estado),
        titulo: aviso.titulo,
        cuerpo: aviso.cuerpo,
        vista: 'tracking',
        tipoAlerta: aviso.alerta,
      }).catch((err) => console.warn('[PUSH_ESTADO_PEDIDO]', err));
    }

    // Si la tienda rechazó un pedido ya asignado, el repartidor lo saca de su ruta.
    if (estado === 'cancelado' && orden.repartidorId) {
      emitirEventoRealtime({
        room: `repartidor:${orden.repartidorId}`,
        event: 'repartidor:orden:cancelada',
        data: { ordenId: id, motivo: 'La tienda rechazó el pedido' },
      });
    }

    // Al quedar entregado (o retirado en el local) la venta queda cerrada: se emite
    // su factura con la MISMA infraestructura del POS, para que el cliente la tenga
    // en "Mis Facturas" y la tienda pueda autorizar devoluciones con su PIN.
    let factura: Awaited<ReturnType<typeof facturarCompra>> = null;
    if (estado === 'entregado') {
      factura = await facturarCompra(id).catch((err) => {
        console.error('[CLIENTE_TIENDA_PEDIDOS_FACTURA]', err);
        return null;
      });
    }

    return NextResponse.json({ ok: true, pedido: actualizado, factura, reversion });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_PEDIDOS_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 });
  }
}
