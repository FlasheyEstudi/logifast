import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/direcciones
 * Returns all saved delivery addresses for the logged-in client.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const direcciones = await db.direccionCliente.findMany({
      where: { clienteId: user.id },
      orderBy: { predeterminada: 'desc' },
    });

    return NextResponse.json({ direcciones });
  } catch (error) {
    console.error('[CLIENTE_DIRECCIONES_GET]', error);
    return NextResponse.json({ error: 'Error al obtener direcciones' }, { status: 500 });
  }
}

/**
 * POST /api/cliente/direcciones
 * Adds a new delivery address for the client.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { etiqueta = 'Casa', direccion, referencia, lat = 0, lng = 0, predeterminada = false } = body;

    if (!direccion) {
      return NextResponse.json({ error: 'La dirección es obligatoria' }, { status: 400 });
    }

    if (predeterminada) {
      await db.direccionCliente.updateMany({
        where: { clienteId: user.id },
        data: { predeterminada: false },
      });
    }

    const nuevaDireccion = await db.direccionCliente.create({
      data: {
        clienteId: user.id,
        etiqueta: String(etiqueta),
        direccion: String(direccion),
        referencia: referencia ? String(referencia) : null,
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        predeterminada: Boolean(predeterminada),
      },
    });

    return NextResponse.json({ direccion: nuevaDireccion });
  } catch (error) {
    console.error('[CLIENTE_DIRECCIONES_POST]', error);
    return NextResponse.json({ error: 'Error al guardar dirección' }, { status: 500 });
  }
}

/**
 * DELETE /api/cliente/direcciones
 * Deletes a saved delivery address.
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

    await db.direccionCliente.deleteMany({
      where: { id, clienteId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CLIENTE_DIRECCIONES_DELETE]', error);
    return NextResponse.json({ error: 'Error al eliminar dirección' }, { status: 500 });
  }
}
