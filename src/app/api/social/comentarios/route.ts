import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social/comentarios?entidad=producto&entidadId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entidad = searchParams.get('entidad');
    const entidadId = searchParams.get('entidadId');
    if (!entidad || !entidadId) {
      return NextResponse.json({ error: 'entidad y entidadId requeridos' }, { status: 400 });
    }

    const comentarios = await db.comentario.findMany({
      where: { entidad, entidadId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ comentarios, total: comentarios.length });
  } catch (error) {
    console.error('[COMENTARIOS_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/social/comentarios
 * Body: { entidad, entidadId, contenido, padreId? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const entidad = String(body.entidad ?? '');
    const entidadId = String(body.entidadId ?? '');
    const contenido = String(body.contenido ?? '').trim();
    const padreId = body.padreId ? String(body.padreId) : null;

    if (!entidad || !entidadId || !contenido) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }
    if (contenido.length > 500) {
      return NextResponse.json({ error: 'Máximo 500 caracteres' }, { status: 400 });
    }

    const initials = (user.initials || user.name.slice(0, 2)).toUpperCase();
    const color = user.color || '#FF5722';

    const comentario = await db.comentario.create({
      data: {
        entidad,
        entidadId,
        autorId: user.id,
        autorNombre: user.name,
        autorInitials: initials,
        autorColor: color,
        contenido,
        padreId,
      },
    });

    await db.actividadUsuario.create({
      data: {
        userId: user.id,
        tipo: 'comentario',
        descripcion: `Comentó en ${entidad}`,
        entidadTipo: entidad,
        entidadId,
      },
    });

    return NextResponse.json({ ok: true, comentario });
  } catch (error) {
    console.error('[COMENTARIOS_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/social/comentarios?id=
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const comentario = await db.comentario.findUnique({ where: { id } });
    if (!comentario) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (comentario.autorId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await db.comentario.deleteMany({ where: { padreId: id } });
    await db.comentario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[COMENTARIOS_DELETE]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
