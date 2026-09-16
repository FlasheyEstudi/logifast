import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

import { hashPassword } from '@/lib/auth/password';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/repartidores
 * Returns all driver profiles with user details.
 */
export async function GET() {
  try {
    await requireRole('admin');
    const profiles = await db.repartidorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            telefono: true,
            cedula: true,
            municipio: true,
            fotoUrl: true,
            initials: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('[ADMIN_REPARTIDORES_GET]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { profiles: [], error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error' },
      { status }
    );
  }
}

/**
 * POST /api/admin/repartidores
 * Creates a new driver user and associated profile in DB.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole('admin');
    const body = await req.json();
    const { nombre, email, telefono, motoId, password } = body;

    if (!nombre || !email) {
      return NextResponse.json({ error: 'Nombre y correo son requeridos' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
    }

    const defaultPass = password || 'Logifast2026!';
    const hashedPassword = await hashPassword(defaultPass);

    const user = await db.user.create({
      data: {
        name: nombre,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'repartidor',
        telefono: telefono || '',
        initials: nombre.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        color: '#FF6600',
      },
    });

    const profile = await db.repartidorProfile.create({
      data: {
        userId: user.id,
        nombre: user.name,
        email: user.email,
        telefono: user.telefono || '',
        motoId: motoId || null,
        conectado: true,
        enServicio: false,
        pausado: false,
        contratoAceptado: true,
        saldo: 0,
        totalEntregas: 0,
        totalKm: 0,
        calificacion: 5.0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            telefono: true,
            initials: true,
            color: true,
          },
        },
      },
    });

    if (motoId) {
      await db.moto.update({
        where: { id: motoId },
        data: { asignadaA: profile.id },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_REPARTIDORES_POST]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al crear repartidor' },
      { status }
    );
  }
}

/**
 * PATCH /api/admin/repartidores
 * Updates driver profile settings, status, or balance.
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin', 'ingeniero');

    const body = await req.json();
    const { id, nombre, email, telefono, motoId, conectado, enServicio, pausado, contratoAceptado, saldo, zonaPreferida } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de repartidor requerido' }, { status: 400 });
    }

    const current = await db.repartidorProfile.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) {
      updateData.nombre = String(nombre);
      await db.user.update({ where: { id: current.userId }, data: { name: String(nombre) } }).catch(() => null);
    }
    if (email !== undefined) {
      updateData.email = String(email);
      await db.user.update({ where: { id: current.userId }, data: { email: String(email).toLowerCase().trim() } }).catch(() => null);
    }
    if (telefono !== undefined) {
      updateData.telefono = String(telefono);
      await db.user.update({ where: { id: current.userId }, data: { telefono: String(telefono) } }).catch(() => null);
    }
    if (motoId !== undefined) {
      updateData.motoId = motoId || null;
      if (motoId) {
        await db.moto.update({ where: { id: motoId }, data: { asignadaA: id } }).catch(() => null);
      }
    }
    if (conectado !== undefined) updateData.conectado = Boolean(conectado);
    if (enServicio !== undefined) updateData.enServicio = Boolean(enServicio);
    if (pausado !== undefined) updateData.pausado = Boolean(pausado);
    if (contratoAceptado !== undefined) updateData.contratoAceptado = Boolean(contratoAceptado);
    if (saldo !== undefined) updateData.saldo = Number(saldo);
    if (zonaPreferida !== undefined) updateData.zonaPreferida = String(zonaPreferida);

    const updatedProfile = await db.repartidorProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            telefono: true,
            initials: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('[ADMIN_REPARTIDORES_PATCH]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al actualizar repartidor' },
      { status }
    );
  }
}

/**
 * DELETE /api/admin/repartidores
 * Deletes driver profile and associated user.
 */
export async function DELETE(req: NextRequest) {
  try {
    await requireRole('admin');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const profile = await db.repartidorProfile.findUnique({ where: { id } });
    if (!profile) {
      return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });
    }

    await db.repartidorProfile.delete({ where: { id } });
    await db.user.delete({ where: { id: profile.userId } }).catch(() => null);

    return NextResponse.json({ success: true, message: 'Repartidor eliminado exitosamente' });
  } catch (error) {
    console.error('[ADMIN_REPARTIDORES_DELETE]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al eliminar repartidor' },
      { status }
    );
  }
}
