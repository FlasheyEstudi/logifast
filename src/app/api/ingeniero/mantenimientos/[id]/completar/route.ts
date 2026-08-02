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
    const body = await req.json();
    const { costoTotal, repuestosUsados } = body;

    // P0-21: Validar estado previo (state machine)
    const mantenimiento = await prisma.mantenimiento.findUnique({ where: { id } });
    if (!mantenimiento) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }
    if (mantenimiento.estado !== 'EN_PROCESO') {
      return NextResponse.json(
        { error: `Solo se pueden completar mantenimientos en proceso. Estado actual: ${mantenimiento.estado}` },
        { status: 400 }
      );
    }

    // P0-22: Decrementar stock de repuestos transaccionalmente
    let costoRepuestos = 0;
    if (Array.isArray(repuestosUsados) && repuestosUsados.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const ru of repuestosUsados) {
          const cantidad = Math.max(1, Math.floor(Number(ru.cantidad ?? 1)));
          const repuesto = await tx.repuesto.update({
            where: { id: ru.repuestoId },
            data: { stock: { decrement: cantidad } },
          });
          if (repuesto.stock < 0) {
            throw new Error(`Stock insuficiente para ${repuesto.nombre}`);
          }
          const precioUnitario = repuesto.precioUnitario;
          const subtotalRep = precioUnitario * cantidad;
          costoRepuestos += subtotalRep;
          await tx.repuestoUsado.create({
            data: {
              mantenimientoId: id,
              repuestoId: ru.repuestoId,
              cantidad,
              precioUnitario,
              subtotal: subtotalRep,
            },
          }).catch(() => null);
        }
      });
    }

    const costoManoObra = parseFloat(costoTotal) || 0;
    const costoTotalFinal = costoManoObra + costoRepuestos;

    const updated = await prisma.mantenimiento.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        costoTotal: costoTotalFinal,
        completadoEn: new Date()
      }
    });

    // P0-23: Solo liberar la moto si no hay otros mantenimientos activos para esa moto
    const otrosActivos = await prisma.mantenimiento.count({
      where: {
        motoId: mantenimiento.motoId,
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
        id: { not: id },
      },
    });
    if (otrosActivos === 0) {
      await prisma.moto.update({
        where: { id: mantenimiento.motoId },
        data: { estado: 'DISPONIBLE' }
      }).catch(() => null);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTO_COMPLETAR');
  }
}
