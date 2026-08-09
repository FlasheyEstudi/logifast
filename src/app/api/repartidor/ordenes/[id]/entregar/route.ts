import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

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

      await db.ordenCompra.update({
        where: { id },
        data: { estado: 'entregado' },
      });

      const ganancia = Math.round(ordenCompra.total * 0.2);
      await db.repartidorProfile.update({
        where: { id: profile.id },
        data: {
          enServicio: false,
          totalEntregas: { increment: 1 },
          totalGanancias: { increment: ganancia },
        },
      });

      return NextResponse.json({
        ok: true,
        estado: 'entregado',
        ordenId: id,
        ganancia,
      });
    }

    if (orden.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }

    let body: { kmRecorridos?: number; tiempoTotal?: number } = {};
    try { body = await req.json(); } catch { /* allow empty */ }
    const kmRecorridos = Number(body.kmRecorridos ?? orden.kmRecorridos ?? 0);
    const tiempoTotal = Number(body.tiempoTotal ?? orden.tiempoTotal ?? 0);

    await db.ordenServicio.update({
      where: { id },
      data: {
        estado: 'entregado',
        entregadoEn: new Date(),
        kmRecorridos,
        tiempoTotal,
      },
    });

    // Actualizar stats del repartidor
    const comision = Math.round(orden.ganancia * 0.15);
    await db.repartidorProfile.update({
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
      await db.moto.update({
        where: { id: profile.motoId },
        data: {
          estado: 'DISPONIBLE',
          kmAcumulados: { increment: kmRecorridos },
        },
      }).catch(() => null);
    }

    // Actualizar OrdenCompra asociada (si la orden era tipo compra)
    if (orden.tiendaId) {
      await db.ordenCompra.updateMany({
        where: { tiendaId: orden.tiendaId, clienteId: orden.clienteId, estado: { in: ['recibido', 'preparando', 'listo', 'en_camino'] } },
        data: { estado: 'entregado' },
      }).catch(() => null);
    }

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
