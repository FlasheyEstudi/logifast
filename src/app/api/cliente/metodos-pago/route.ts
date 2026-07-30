import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/metodos-pago
 * Returns all saved payment methods for the logged-in client.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const metodos = await db.metodoPago.findMany({
      where: { clienteId: user.id },
      orderBy: { predeterminado: 'desc' },
    });

    return NextResponse.json({ metodos });
  } catch (error) {
    console.error('[CLIENTE_METODOS_PAGO_GET]', error);
    return NextResponse.json({ error: 'Error al obtener métodos de pago' }, { status: 500 });
  }
}

/**
 * POST /api/cliente/metodos-pago
 * Adds a new payment method for the client.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { tipo = 'tarjeta', titular, ultimos4, marca, vencimiento, predeterminado = false } = body;

    if (predeterminado) {
      await db.metodoPago.updateMany({
        where: { clienteId: user.id },
        data: { predeterminado: false },
      });
    }

    const nuevoMetodo = await db.metodoPago.create({
      data: {
        clienteId: user.id,
        tipo: String(tipo),
        titular: titular ? String(titular) : user.name,
        ultimos4: ultimos4 ? String(ultimos4) : '4242',
        marca: marca ? String(marca) : 'Visa',
        vencimiento: vencimiento ? String(vencimiento) : '12/28',
        predeterminado: Boolean(predeterminado),
      },
    });

    return NextResponse.json({ metodo: nuevoMetodo });
  } catch (error) {
    console.error('[CLIENTE_METODOS_PAGO_POST]', error);
    return NextResponse.json({ error: 'Error al agregar método de pago' }, { status: 500 });
  }
}

/**
 * DELETE /api/cliente/metodos-pago
 * Deletes a saved payment method.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    await db.metodoPago.deleteMany({
      where: { id, clienteId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CLIENTE_METODOS_PAGO_DELETE]', error);
    return NextResponse.json({ error: 'Error al eliminar método de pago' }, { status: 500 });
  }
}
