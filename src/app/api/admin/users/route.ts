import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users?role=&limit=&offset=
 * Lista usuarios (solo admin).
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole('admin');

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          telefono: true,
          initials: true,
          color: true,
          fotoUrl: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error('[ADMIN_USERS_GET]', error);
    return NextResponse.json({ users: [], total: 0 });
  }
}

/**
 * POST /api/admin/users
 * Crea un usuario desde el panel de administración.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole('admin');
    const body = await req.json();
    const { name, email, role, telefono, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'name, email y role son obligatorios' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'Logifast2026!', 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as 'cliente' | 'repartidor' | 'admin' | 'ingeniero',
        telefono: telefono || null,
        initials: name.slice(0, 2).toUpperCase(),
        color: '#FF5722',
      },
    });

    // Si el nuevo usuario es repartidor, crear su perfil automáticamente
    if (role === 'repartidor') {
      await db.repartidorProfile.create({
        data: {
          userId: user.id,
          nombre: user.name,
          email: user.email,
          telefono: user.telefono,
          conectado: false,
          enServicio: false,
          contratoAceptado: true,
        },
      }).catch((err) => console.error('[CREATE_REPARTIDOR_PROFILE_ERROR]', err));
    }

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return handleError(error, 'ADMIN_USERS_POST');
  }
}

/**
 * PATCH /api/admin/users
 * Actualiza un usuario (rol, teléfono, nombre, etc.).
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin');
    const body = await req.json();
    const { id, role, name, email, telefono } = body;

    if (!id) {
      return NextResponse.json({ error: 'id de usuario requerido' }, { status: 400 });
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (role) dataToUpdate.role = role;
    if (name) {
      dataToUpdate.name = name;
      dataToUpdate.initials = name.slice(0, 2).toUpperCase();
    }
    if (email) dataToUpdate.email = email;
    if (telefono !== undefined) dataToUpdate.telefono = telefono;

    const user = await db.user.update({
      where: { id },
      data: dataToUpdate,
    });

    if (role === 'repartidor') {
      const existingProfile = await db.repartidorProfile.findUnique({ where: { userId: id } });
      if (!existingProfile) {
        await db.repartidorProfile.create({
          data: {
            userId: user.id,
            nombre: user.name,
            email: user.email,
            telefono: user.telefono,
            conectado: false,
            enServicio: false,
            contratoAceptado: true,
          },
        }).catch((err) => console.error('[PATCH_CREATE_REPARTIDOR_PROFILE_ERROR]', err));
      }
    }

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return handleError(error, 'ADMIN_USERS_PATCH');
  }
}
