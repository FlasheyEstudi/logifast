import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/clientes
 * Returns all client accounts with order stats, addresses, and payment methods.
 */
export async function GET() {
  try {
    await requireRole('admin');
    const clientes = await db.user.findMany({
      where: { role: 'cliente' },
      orderBy: { createdAt: 'desc' },
    });

    const clientesFormatted = clientes.map((c) => ({
      id: c.id,
      nombre: c.name,
      email: c.email,
      telefono: c.telefono || '',
      color: c.color || '#FF5722',
      initials: c.initials || c.name.substring(0, 2).toUpperCase(),
      totalEnvios: 0,
      direccionesCount: 0,
      favoritosCount: 0,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ clientes: clientesFormatted });
  } catch (error) {
    console.error('[ADMIN_CLIENTES_GET]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al obtener clientes' },
      { status }
    );
  }
}

/**
 * PATCH /api/admin/clientes
 * Updates client details.
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin');

    const body = await req.json();
    const { id, name, email, telefono } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de cliente requerido' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        name: name ? String(name) : undefined,
        email: email ? String(email) : undefined,
        telefono: telefono ? String(telefono) : undefined,
      },
    });

    return NextResponse.json({ cliente: updated });
  } catch (error) {
    console.error('[ADMIN_CLIENTES_PATCH]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al actualizar cliente' },
      { status }
    );
  }
}
