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
    const { costoTotal, costoManoObra: manoObraInput, observaciones, repuestosUsados } = body;

    // Validar estado previo
    const mantenimiento = await prisma.mantenimiento.findUnique({ where: { id } });
    if (!mantenimiento) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }
    if (mantenimiento.estado === 'COMPLETADO' || mantenimiento.estado === 'CANCELADO') {
      return NextResponse.json(
        { error: `El mantenimiento ya se encuentra ${mantenimiento.estado}` },
        { status: 400 }
      );
    }

    // Decrementar stock de repuestos transaccionalmente y validar existencias (BUG-F03 & BUG-F04)
    let costoRepuestos = 0;
    if (Array.isArray(repuestosUsados) && repuestosUsados.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const ru of repuestosUsados) {
          const cantidad = Math.max(1, Math.floor(Number(ru.cantidad ?? 1)));
          const repuesto = await tx.repuesto.findUnique({
            where: { id: ru.repuestoId },
          });

          if (!repuesto) {
            throw new Error(`Repuesto no encontrado: ${ru.repuestoId}`);
          }

          if (repuesto.stock < cantidad) {
            throw new Error(`Stock insuficiente para "${repuesto.nombre}". Disponible: ${repuesto.stock}, Requerido: ${cantidad}`);
          }

          await tx.repuesto.update({
            where: { id: ru.repuestoId },
            data: { stock: { decrement: cantidad } },
          });

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
          });
        }
      });
    }

    const costoManoObra = parseFloat(manoObraInput) || parseFloat(costoTotal) || mantenimiento.costoManoObra || 0;
    const costoTotalFinal = costoManoObra + costoRepuestos;

    const updated = await prisma.mantenimiento.update({
      where: { id },
      data: {
        estado: 'COMPLETADO',
        costoManoObra,
        costoRepuestos,
        costoTotal: costoTotalFinal,
        completadoEn: new Date(),
        ...(observaciones ? { observaciones } : {}),
      }
    });

    // Liberar la moto si no hay otros mantenimientos pendientes o en proceso
    const otrosActivos = await prisma.mantenimiento.count({
      where: {
        motoId: mantenimiento.motoId,
        estado: { in: ['PENDIENTE', 'PROGRAMADO', 'EN_PROCESO'] },
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
