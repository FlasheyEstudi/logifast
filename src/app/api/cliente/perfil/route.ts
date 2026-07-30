import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/perfil
 * Returns client profile data, saved addresses, and payment methods.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [profile, direcciones, metodosPago] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          telefono: true,
          fotoUrl: true,
          initials: true,
          color: true,
          bio: true,
        },
      }),
      db.direccionCliente.findMany({
        where: { clienteId: user.id },
        orderBy: { predeterminada: 'desc' },
      }),
      db.metodoPago.findMany({
        where: { clienteId: user.id },
        orderBy: { predeterminado: 'desc' },
      }),
    ]);

    return NextResponse.json({ profile, direcciones, metodosPago });
  } catch (error) {
    console.error('[CLIENTE_PERFIL_GET]', error);
    return NextResponse.json({ error: 'Error al obtener perfil del cliente' }, { status: 500 });
  }
}

/**
 * PATCH /api/cliente/perfil
 * Updates client profile name, phone, bio, or addresses.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, telefono, bio, fotoUrl } = body;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: name ? String(name) : undefined,
        telefono: telefono ? String(telefono) : undefined,
        bio: bio !== undefined ? String(bio) : undefined,
        fotoUrl: fotoUrl !== undefined ? String(fotoUrl) : undefined,
      },
    });

    return NextResponse.json({ profile: updatedUser });
  } catch (error) {
    console.error('[CLIENTE_PERFIL_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
