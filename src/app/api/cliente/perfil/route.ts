import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, createSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

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

    const newName = name ? String(name).trim() : undefined;
    const newPhone = telefono ? String(telefono).trim() : undefined;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: newName,
        telefono: newPhone,
        initials: newName ? computeInitials(newName) : undefined,
        bio: bio !== undefined ? String(bio) : undefined,
        fotoUrl: fotoUrl !== undefined ? String(fotoUrl) : undefined,
      },
    });

    // Refrescar sesión activa con los datos actualizados
    await createSession({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role as any,
      telefono: updatedUser.telefono,
      initials: updatedUser.initials,
      color: updatedUser.color,
      fotoUrl: updatedUser.fotoUrl,
      bio: updatedUser.bio,
    }).catch(() => null);

    return NextResponse.json({ ok: true, profile: updatedUser });
  } catch (error) {
    console.error('[CLIENTE_PERFIL_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
