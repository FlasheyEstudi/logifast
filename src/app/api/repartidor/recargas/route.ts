import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/recargas
 * Returns driver balance reload history.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const profile = await db.repartidorProfile.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
    });

    if (!profile) {
      return NextResponse.json({ recargas: [] });
    }

    const recargas = await db.recargaSaldo.findMany({
      where: { repartidorId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ recargas });
  } catch (error) {
    console.error('[REPARTIDOR_RECARGAS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener recargas' }, { status: 500 });
  }
}

/**
 * POST /api/repartidor/recargas
 * Requests a new balance reload for driver.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const profile = await db.repartidorProfile.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Perfil de repartidor no encontrado' }, { status: 404 });
    }

    const body = await req.json();
    const { monto, metodo = 'transferencia', referencia, codigo } = body;

    if (!monto || Number(monto) <= 0) {
      return NextResponse.json({ error: 'Monto debe ser mayor a 0' }, { status: 400 });
    }

    const recarga = await db.recargaSaldo.create({
      data: {
        repartidorId: profile.id,
        monto: Number(monto),
        metodo: String(metodo),
        referencia: referencia ? String(referencia) : undefined,
        codigo: codigo ? String(codigo) : undefined,
        estado: 'completada',
      },
    });

    // Increment driver balance
    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: { saldo: { increment: Number(monto) } },
    });

    return NextResponse.json({ recarga });
  } catch (error) {
    console.error('[REPARTIDOR_RECARGAS_POST]', error);
    return NextResponse.json({ error: 'Error al solicitar recarga' }, { status: 500 });
  }
}
