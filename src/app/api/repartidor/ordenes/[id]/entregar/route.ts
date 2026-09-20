import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { gananciaRepartidorCompra } from '@/lib/tarifas';
import { sincronizarServicioConCompra } from '@/lib/tienda/sincronizar-pedido';
import { facturarCompra } from '@/lib/tienda/facturacion';
import { enviarPushPedido, MENSAJE_ESTADO } from '@/lib/push/notificar-pedido';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/repartidor/ordenes/[id]/entregar
 * Repartidor confirma la entrega. Suma stats y ganancias.
 */
export async function PATCH(
  req: NextRequest,
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
      const ordenCompra = await db.ordenCompra.findUnique({ where: { id } });
      if (!ordenCompra) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      }

      // El pedido tiene que ser SUYO. Sin esta comprobación, la rama de compras de
      // esta ruta cerraba y pagaba cualquier pedido ajeno (la rama de servicios ya
      // validaba; esta no).
      if (ordenCompra.repartidorId !== profile.id) {
        return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
      }

      // Idempotencia: solo actualizar y sumar si NO estaba ya entregada.
      // La ganancia sale del ENVÍO (`ordenCompra.costoEnvio`), no del total de la
      // compra: pagar `total * 0.2` daba montos distintos por el mismo trabajo y no
      // cuadraba con la ganancia que el repartidor vio al aceptar la oferta.
      const ganancia = gananciaRepartidorCompra(Number(ordenCompra.costoEnvio) || 0);
      try {
        await db.$transaction(async (tx) => {
          const upd = await tx.ordenCompra.updateMany({
            where: { id, repartidorId: profile.id, estado: { notIn: ['entregado', 'cancelado'] } },
            data: { estado: 'entregado' },
          });

          if (upd.count === 0) {
            throw new Error('ALREADY_DELIVERED');
          }

          // Cerrar el servicio vinculado: sin esto el pedido seguía apareciendo como
          // activo del repartidor y como oferta para los demás.
          await sincronizarServicioConCompra({
            tx,
            estadoCompra: 'entregado',
            tiendaId: ordenCompra.tiendaId,
            clienteId: ordenCompra.clienteId,
            codigoPin: ordenCompra.codigoPin,
            extra: { repartidorId: profile.id, entregadoEn: new Date() },
          });

          await tx.repartidorProfile.update({
            where: { id: profile.id },
            data: {
              enServicio: false,
              totalEntregas: { increment: 1 },
              totalGanancias: { increment: ganancia },
            },
          });
        });
      } catch (err: any) {
        if (err?.message === 'ALREADY_DELIVERED') {
          return NextResponse.json({ ok: true, estado: 'entregado', ordenId: id, ganancia: 0, message: 'Orden ya entregada' });
        }
        throw err;
      }

      try {
        const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
        for (const room of [`orden:${id}`, `usuario:${ordenCompra.clienteId}`, `tienda-ordenes:${ordenCompra.tiendaId}`]) {
          emitirEventoRealtime({ room, event: 'orden:estado:update', data: { id, estado: 'entregado' } });
        }
      } catch {}

      // La compra queda cerrada: se emite su factura con la infraestructura del POS
      // para que el cliente la vea en "Mis Facturas" y la tienda pueda autorizar
      // devoluciones con su PIN.
      const factura = await facturarCompra(id).catch((err) => {
        console.error('[REPARTIDOR_ENTREGAR_FACTURA]', err);
        return null;
      });

      // Push de entrega: el aviso que el cliente espera incluso con la app cerrada.
      const avisoEntrega = MENSAJE_ESTADO.entregado;
      if (avisoEntrega) {
        void enviarPushPedido({
          userId: ordenCompra.clienteId,
          ordenId: id,
          estado: 'entregado',
          titulo: avisoEntrega.titulo,
          cuerpo: avisoEntrega.cuerpo,
          vista: 'tracking',
          canal: 'logifast_estado',
          tipoAlerta: avisoEntrega.alerta,
        }).catch(() => null);
      }

      return NextResponse.json({
        ok: true,
        estado: 'entregado',
        ordenId: id,
        ganancia,
        factura,
      });
    }

    if (orden.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }

    let body: { kmRecorridos?: number; tiempoTotal?: number } = {};
    try { body = await req.json(); } catch { /* allow empty */ }
    const rawKm = Number(body.kmRecorridos ?? 0);
    const kmRecorridos = rawKm > 0 ? Math.round(rawKm * 10) / 10 : (orden.kmRecorridos || orden.kmEstimados || 3.5);
    const rawTiempo = Number(body.tiempoTotal ?? 0);
    const tiempoTotal = rawTiempo > 0 ? rawTiempo : (orden.tiempoTotal || orden.tiempoEstimado || 15);
    const comision = Math.round(orden.ganancia * 0.15);

    // Ejecutar actualización de orden + conductor atómicamente con guard de idempotencia (VULN-06)
    try {
      await db.$transaction(async (tx) => {
        const upd = await tx.ordenServicio.updateMany({
          where: {
            id,
            repartidorId: profile.id,
            estado: { notIn: ['entregado', 'cancelado'] },
          },
          data: {
            estado: 'entregado',
            entregadoEn: new Date(),
            kmRecorridos,
            tiempoTotal,
          },
        });

        if (upd.count === 0) {
          throw new Error('ALREADY_DELIVERED');
        }

        // Actualizar stats del repartidor exactamente una vez
        await tx.repartidorProfile.update({
          where: { id: profile.id },
          data: {
            enServicio: false,
            totalEntregas: { increment: 1 },
            totalKm: { increment: kmRecorridos },
            totalGanancias: { increment: orden.ganancia },
            saldo: { decrement: comision },
          },
        });

        // Actualizar moto: sumar km y volver a DISPONIBLE
        if (profile.motoId) {
          await tx.moto.update({
            where: { id: profile.motoId },
            data: {
              estado: 'DISPONIBLE',
              kmAcumulados: { increment: kmRecorridos },
            },
          }).catch(() => null);
        }

        // Actualizar OrdenCompra asociada (si aplica)
        if (orden.tiendaId) {
          await tx.ordenCompra.updateMany({
            where: {
              OR: [
                { id: orden.id },
                {
                  tiendaId: orden.tiendaId,
                  clienteId: orden.clienteId,
                  estado: { notIn: ['entregado', 'cancelado'] },
                },
                {
                  repartidorId: profile.id,
                  tiendaId: orden.tiendaId,
                  estado: { notIn: ['entregado', 'cancelado'] },
                },
              ],
            },
            data: { estado: 'entregado' },
          }).catch(() => null);
        }
      });
    } catch (err: any) {
      if (err?.message === 'ALREADY_DELIVERED') {
        return NextResponse.json({
          ok: true,
          estado: 'entregado',
          ordenId: id,
          ganancia: 0,
          message: 'La orden ya había sido confirmada como entregada',
        });
      }
      throw err;
    }

    // Emitir eventos en tiempo real al cliente, admin y repartidores
    try {
      const { emitirEventoRealtime } = await import('@/lib/realtime-emitter');
      emitirEventoRealtime({
        room: `orden:${id}`,
        event: 'orden:estado:update',
        data: { id, estado: 'entregado' },
      });
      emitirEventoRealtime({
        room: 'admin',
        event: 'admin:orden:actualizada',
        data: { id, estado: 'entregado', repartidorId: profile.id },
      });
      emitirEventoRealtime({
        room: 'repartidores',
        event: 'repartidor:orden:tomada',
        data: { ordenId: id, repartidorId: profile.id },
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      estado: 'entregado',
      ordenId: id,
      ganancia: orden.ganancia,
      comision,
      kmRecorridos,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_ENTREGAR]', error);
    return NextResponse.json(
      { error: 'Error al confirmar entrega' },
      { status: 500 }
    );
  }
}
