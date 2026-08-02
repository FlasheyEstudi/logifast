import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('ingeniero', 'admin');
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { repuestosUsados = [] } = body;

    const existing = await prisma.mantenimiento.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }

    if (existing.estado !== 'EN_PROCESO' && existing.estado !== 'en_progreso') {
      return NextResponse.json(
        { error: `Solo se puede completar un mantenimiento que esté EN_PROCESO. Estado actual: ${existing.estado}` },
        { status: 400 }
      );
    }

    const mantenimientoCompletado = await prisma.$transaction(async (tx) => {
      let costoRepuestosSum = 0;

      if (Array.isArray(repuestosUsados) && repuestosUsados.length > 0) {
        for (const item of repuestosUsados) {
          const repuestoId = item.repuestoId || item.id;
          const cantidad = Number(item.cantidad || 1);

          const repuesto = await tx.repuesto.findUnique({ where: { id: repuestoId } });
          if (!repuesto) {
            throw new Error(`REPUESTO_NOT_FOUND:${repuestoId}`);
          }
          if (repuesto.stock < cantidad) {
            throw new Error(`INSUFFICIENT_STOCK:${repuesto.nombre}`);
          }

          await tx.repuesto.update({
            where: { id: repuestoId },
            data: { stock: { decrement: cantidad } },
          });

          const precio = item.precioUnitario !== undefined ? Number(item.precioUnitario) : repuesto.precioUnitario;
          costoRepuestosSum += precio * cantidad;

          await tx.repuestoUsado.create({
            data: {
              mantenimientoId: id,
              repuestoId,
              cantidad,
              precioUnitario: precio,
              subtotal: precio * cantidad,
            },
          });
        }
      }

      const costoTotalFinal = existing.costoManoObra + costoRepuestosSum;

      const updated = await tx.mantenimiento.update({
        where: { id },
        data: {
          estado: 'COMPLETADO',
          costoRepuestos: costoRepuestosSum,
          costoTotal: costoTotalFinal,
          completadoEn: new Date(),
        },
      });

      // P0-23: Verificar si hay otros mantenimientos activos antes de liberar moto
      const otrosActivos = await tx.mantenimiento.count({
        where: {
          motoId: existing.motoId,
          estado: { in: ['PROGRAMADO', 'PENDIENTE', 'EN_PROCESO', 'pendiente', 'en_progreso'] },
          id: { not: id },
        },
      });

      if (otrosActivos === 0) {
        await tx.moto.update({
          where: { id: existing.motoId },
          data: { estado: 'DISPONIBLE' },
        });
      }

      return updated;
    });

    return NextResponse.json(mantenimientoCompletado);
  } catch (error: any) {
    if (error.message?.startsWith('INSUFFICIENT_STOCK:')) {
      const name = error.message.split('INSUFFICIENT_STOCK:')[1];
      return NextResponse.json({ error: `Stock insuficiente para repuesto: ${name}` }, { status: 400 });
    }
    if (error.message?.startsWith('REPUESTO_NOT_FOUND:')) {
      const repId = error.message.split('REPUESTO_NOT_FOUND:')[1];
      return NextResponse.json({ error: `Repuesto no encontrado: ${repId}` }, { status: 404 });
    }
    return handleError(error, 'INGENIERO_MANTENIMIENTO_COMPLETAR');
  }
}
