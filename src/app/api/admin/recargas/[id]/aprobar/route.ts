import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/recargas/[id]/aprobar
 * Aprueba una recarga de saldo pendiente e incrementa el saldo del repartidor.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('admin');
    const { id } = await params;

    const recarga = await db.recargaSaldo.findUnique({ where: { id } });
    if (!recarga) {
      return NextResponse.json({ error: 'Recarga no encontrada' }, { status: 404 });
    }

    if (recarga.estado === 'completada') {
      return NextResponse.json({ error: 'La recarga ya fue aprobada previamente' }, { status: 400 });
    }

    const recargaAprobada = await db.$transaction(async (tx) => {
      const updatedRecarga = await tx.recargaSaldo.update({
        where: { id },
        data: { estado: 'completada' },
      });

      await tx.repartidorProfile.update({
        where: { id: recarga.repartidorId },
        data: { saldo: { increment: recarga.monto } },
      });

      return updatedRecarga;
    });

    return NextResponse.json({ ok: true, recarga: recargaAprobada });
  } catch (error) {
    return handleError(error, 'ADMIN_RECARGA_APROBAR');
  }
}
