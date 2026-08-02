import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  id: z.string().min(1, 'id requerido'),
  accion: z.enum(['aprobar', 'rechazar']),
  motivo: z.string().max(500).optional(),
});

/**
 * GET /api/admin/recargas
 * Lista recargas pendientes (solo admin).
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole('admin');
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') ?? 'pendiente';

    const recargas = await db.recargaSaldo.findMany({
      where: { estado },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        repartidor: {
          select: { id: true, nombre: true, email: true, telefono: true, saldo: true },
        },
      },
    });

    return NextResponse.json({ recargas, total: recargas.length });
  } catch (error) {
    console.error('[ADMIN_RECARGAS_GET]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error' },
      { status }
    );
  }
}

/**
 * PATCH /api/admin/recargas
 * Aprueba o rechaza una recarga pendiente (P0-16 complemento).
 * Body: { id, accion: 'aprobar' | 'rechazar', motivo? }
 * - Al aprobar: cambia estado a 'completada' e incrementa saldo del repartidor (transaccional).
 * - Al rechazar: cambia estado a 'rechazada' sin tocar saldo.
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin');

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { id, accion, motivo } = parsed.data;

    const recarga = await db.recargaSaldo.findUnique({
      where: { id },
      include: { repartidor: { select: { id: true, nombre: true, saldo: true } } },
    });
    if (!recarga) {
      return NextResponse.json({ error: 'Recarga no encontrada' }, { status: 404 });
    }
    if (recarga.estado !== 'pendiente') {
      return NextResponse.json(
        { error: `La recarga ya está ${recarga.estado}` },
        { status: 400 }
      );
    }

    if (accion === 'aprobar') {
      // Transacción: marcar como completada + incrementar saldo
      const [updated] = await db.$transaction([
        db.recargaSaldo.update({
          where: { id },
          data: {
            estado: 'completada',
            referencia: motivo ? `Aprobada: ${motivo}` : 'Aprobada por admin',
          },
        }),
        db.repartidorProfile.update({
          where: { id: recarga.repartidorId },
          data: { saldo: { increment: recarga.monto } },
        }),
      ]);
      return NextResponse.json({
        ok: true,
        recarga: updated,
        nuevoSaldo: (recarga.repartidor?.saldo ?? 0) + recarga.monto,
      });
    } else {
      // Rechazar: solo cambiar estado, no tocar saldo
      const updated = await db.recargaSaldo.update({
        where: { id },
        data: {
          estado: 'rechazada',
          referencia: motivo ? `Rechazada: ${motivo}` : 'Rechazada por admin',
        },
      });
      return NextResponse.json({ ok: true, recarga: updated });
    }
  } catch (error) {
    console.error('[ADMIN_RECARGAS_PATCH]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error' },
      { status }
    );
  }
}
