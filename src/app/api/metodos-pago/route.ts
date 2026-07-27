import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metodos-pago
 * Lista los métodos de pago del cliente.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const metodos = await db.metodoPago.findMany({
      where: { clienteId: user.id },
      orderBy: [{ predeterminado: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ metodos });
  } catch (error) {
    console.error('[METODOS_PAGO_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/metodos-pago
 * Body: { tipo, titular, ultimos4, marca, vencimiento, predeterminado? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const { tipo, titular, ultimos4, marca, vencimiento, predeterminado } = body;

    if (!tipo) return NextResponse.json({ error: 'tipo requerido' }, { status: 400 });

    if (predeterminado) {
      await db.metodoPago.updateMany({
        where: { clienteId: user.id },
        data: { predeterminado: false },
      });
    }

    const metodo = await db.metodoPago.create({
      data: {
        clienteId: user.id,
        tipo,
        titular: titular ?? null,
        ultimos4: ultimos4 ?? null,
        marca: marca ?? null,
        vencimiento: vencimiento ?? null,
        predeterminado: Boolean(predeterminado),
      },
    });

    return NextResponse.json({ ok: true, metodo });
  } catch (error) {
    console.error('[METODOS_PAGO_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/metodos-pago?id=
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const existing = await db.metodoPago.findUnique({ where: { id } });
    if (!existing || existing.clienteId !== user.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await db.metodoPago.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[METODOS_PAGO_DELETE]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
