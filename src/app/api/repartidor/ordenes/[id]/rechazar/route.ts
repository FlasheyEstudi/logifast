import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { MAX_RECHAZOS_HORA, PAUSA_RECHAZOS_MIN, registrarRechazo } from '@/lib/repartidor/candados';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/rechazar
 * Repartidor rechaza una orden asignada. Cuenta como rechazo (3 → pausa de 15 min).
 *
 * El conteo se lleva por una ventana móvil de 1 hora leída de las notificaciones
 * `oferta_rechazada`: antes el contador vivía solo en el frontend y se reiniciaba
 * al recargar la app.
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

    // Liberar la orden (envío)
    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (orden && orden.repartidorId === profile.id) {
      await db.$transaction(async (tx) => {
        const res = await tx.ordenServicio.updateMany({
          where: { id, repartidorId: profile.id, estado: { notIn: ['entregado', 'cancelado'] } },
          data: {
            repartidorId: null,
            estado: orden.estado === 'asignado' || orden.estado === 'aceptado' ? 'pendiente' : orden.estado,
          },
        });
        if (res.count > 0) {
          await tx.solicitudEnvio.updateMany({
            where: { id },
            data: { repartidorId: null, estado: 'pendiente' },
          }).catch(() => null);
        }
      });
    }

    // Liberar el pedido de tienda (y su servicio vinculado) para que vuelva a la bolsa
    // sin quedar asignado a quien lo rechazó.
    const ordenCompra = await db.ordenCompra.findUnique({ where: { id } });
    if (ordenCompra && ordenCompra.repartidorId === profile.id) {
      await db.$transaction(async (tx) => {
        await tx.ordenCompra.updateMany({
          where: { id, repartidorId: profile.id, estado: { notIn: ['entregado', 'cancelado'] } },
          data: { repartidorId: null, estado: 'listo' },
        });
        // El PIN forma parte de la clave de vínculo: sin él, este update soltaba a
        // TODOS los pedidos del cliente en la tienda, no solo al rechazado.
        if (ordenCompra.codigoPin) {
          await tx.ordenServicio.updateMany({
            where: {
              tipo: 'compra',
              tiendaId: ordenCompra.tiendaId,
              clienteId: ordenCompra.clienteId,
              codigoPin: ordenCompra.codigoPin,
              estado: { notIn: ['entregado', 'cancelado'] },
            },
            data: { repartidorId: null, estado: 'pendiente' },
          });
        }
      });
    }

    try {
      const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      emitirEventoRealtime({
        room: 'admin',
        event: 'admin:orden:rechazada',
        data: { id, repartidorId: profile.id },
      });
      emitirEventoRealtime({
        room: 'repartidores',
        event: 'repartidor:orden:disponible',
        data: { id },
      });
    } catch {}

    // El rechazo se registra en BD: sobrevive a la reconexión y alimenta la pausa.
    await db.notificacionRepartidor.create({
      data: {
        repartidorId: profile.id,
        tipo: 'oferta_rechazada',
        titulo: 'Oferta rechazada',
        contenido: `Rechazaste la orden ${id}`,
        leido: true,
        ordenId: id,
      },
    }).catch(() => null);

    const estado = await registrarRechazo(profile.id);

    if (estado.pausado) {
      await db.notificacionRepartidor.create({
        data: {
          repartidorId: profile.id,
          tipo: 'cancelacion',
          titulo: 'Pausa automática',
          contenido: `Has rechazado ${MAX_RECHAZOS_HORA} órdenes. Pausa de ${PAUSA_RECHAZOS_MIN} min.`,
          leido: false,
          ordenId: id,
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      estado: 'rechazado',
      ordenId: id,
      rechazosHora: estado.rechazosHora,
      pausado: estado.pausado,
      pausaHasta: estado.pausaHasta,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_RECHAZAR]', error);
    return NextResponse.json({ error: 'Error al rechazar la orden' }, { status: 500 });
  }
}
