import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { resolverAccesoTienda, tienePermiso, PERMISOS_POR_ROL, ROLES_TIENDA } from '@/lib/auth/tienda-acceso';

export const dynamic = 'force-dynamic';

/**
 * #7 / #10 — Equipo de la tienda.
 *
 * GET    /api/tienda/usuarios           — quiénes operan la tienda (dueño + invitados)
 * POST   /api/tienda/usuarios           — invita a un usuario ya registrado, con rol y permisos
 * PATCH  /api/tienda/usuarios           — cambia rol, permisos o acceso de un miembro
 * DELETE /api/tienda/usuarios?id=…      — quita a un miembro del equipo
 *
 * Solo el dueño (o quien tenga el permiso `equipo`) administra esto. El invitado entra
 * con su propia cuenta y **solo ve la tienda a la que pertenece**.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const acceso = await resolverAccesoTienda(user);
    if (!acceso) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });

    const miembros = await db.tiendaUsuario.findMany({
      where: { tiendaId: acceso.tiendaId },
      orderBy: { createdAt: 'asc' },
      include: { usuario: { select: { id: true, name: true, email: true, role: true } } },
    });

    return NextResponse.json({
      ok: true,
      esPropietario: acceso.esPropietario,
      miPropioRol: acceso.rol,
      misPermisos: acceso.permisos,
      roles: ROLES_TIENDA,
      permisosPorRol: PERMISOS_POR_ROL,
      equipo: miembros.map((m) => {
        let permisos: string[] = [];
        try {
          const parsed = JSON.parse(m.permisos || '[]');
          permisos = Array.isArray(parsed) ? parsed : [];
        } catch {
          permisos = [];
        }
        return {
          id: m.id,
          userId: m.usuario.id,
          nombre: m.usuario.name,
          email: m.usuario.email,
          rolGlobal: m.usuario.role,
          rol: m.rol,
          permisos,
          permisosEfectivos: permisos.length > 0 ? permisos : PERMISOS_POR_ROL[m.rol] ?? [],
          activo: m.activo,
          createdAt: m.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error('[tienda/usuarios GET]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo cargar el equipo' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const acceso = await resolverAccesoTienda(user);
    if (!acceso) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    if (!tienePermiso(acceso, 'equipo')) {
      return NextResponse.json({ ok: false, error: 'Tu rol no puede invitar usuarios' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { email, rol = 'cajero', permisos } = body as Record<string, unknown>;

    const emailLimpio = String(email ?? '').trim().toLowerCase();
    if (!emailLimpio.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Correo inválido' }, { status: 400 });
    }

    const rolLimpio = ROLES_TIENDA.includes(String(rol)) ? String(rol) : 'cajero';
    const permisosLimpios = Array.isArray(permisos) ? permisos.map((p) => String(p)) : [];

    const invitado = await db.user.findUnique({ where: { email: emailLimpio }, select: { id: true, name: true } });
    if (!invitado) {
      return NextResponse.json(
        { ok: false, error: 'Ese correo no tiene cuenta en LogiFast: la persona debe registrarse primero' },
        { status: 404 }
      );
    }
    if (invitado.id === user.id) {
      return NextResponse.json({ ok: false, error: 'Ya eres parte de esta tienda como dueño' }, { status: 400 });
    }

    const yaEsta = await db.tiendaUsuario.findFirst({
      where: { tiendaId: acceso.tiendaId, userId: invitado.id },
      select: { id: true },
    });
    if (yaEsta) {
      return NextResponse.json({ ok: false, error: `${invitado.name} ya está en el equipo` }, { status: 409 });
    }

    const miembro = await db.tiendaUsuario.create({
      data: {
        tiendaId: acceso.tiendaId,
        userId: invitado.id,
        rol: rolLimpio,
        permisos: JSON.stringify(permisosLimpios),
        activo: true,
        invitadoPor: user.id,
      },
      select: { id: true, rol: true, permisos: true },
    });

    return NextResponse.json({
      ok: true,
      miembro: { ...miembro, nombre: invitado.name, email: emailLimpio },
      mensaje: `${invitado.name} ya puede entrar a la tienda como ${rolLimpio}`,
    });
  } catch (err) {
    console.error('[tienda/usuarios POST]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo invitar al usuario' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const acceso = await resolverAccesoTienda(user);
    if (!acceso) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    if (!tienePermiso(acceso, 'equipo')) {
      return NextResponse.json({ ok: false, error: 'Tu rol no puede administrar el equipo' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, rol, permisos, activo } = body as Record<string, unknown>;
    if (!id) return NextResponse.json({ ok: false, error: 'Falta el id del miembro' }, { status: 400 });

    const miembro = await db.tiendaUsuario.findFirst({
      where: { id: String(id), tiendaId: acceso.tiendaId },
      select: { id: true },
    });
    if (!miembro) return NextResponse.json({ ok: false, error: 'Miembro no encontrado' }, { status: 404 });

    const datos: Record<string, unknown> = {};
    if (rol !== undefined) datos.rol = ROLES_TIENDA.includes(String(rol)) ? String(rol) : 'cajero';
    if (permisos !== undefined && Array.isArray(permisos)) datos.permisos = JSON.stringify(permisos.map((p) => String(p)));
    if (typeof activo === 'boolean') datos.activo = activo;

    const actualizado = await db.tiendaUsuario.update({ where: { id: String(id) }, data: datos, select: { id: true, rol: true, activo: true } });
    return NextResponse.json({ ok: true, miembro: actualizado });
  } catch (err) {
    console.error('[tienda/usuarios PATCH]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo actualizar el miembro' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const acceso = await resolverAccesoTienda(user);
    if (!acceso) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    if (!tienePermiso(acceso, 'equipo')) {
      return NextResponse.json({ ok: false, error: 'Tu rol no puede administrar el equipo' }, { status: 403 });
    }

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'Falta el id del miembro' }, { status: 400 });

    const borrado = await db.tiendaUsuario.deleteMany({ where: { id, tiendaId: acceso.tiendaId } });
    if (borrado.count === 0) return NextResponse.json({ ok: false, error: 'Miembro no encontrado' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[tienda/usuarios DELETE]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo quitar al miembro' }, { status: 500 });
  }
}
