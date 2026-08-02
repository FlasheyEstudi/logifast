import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social/likes?productoId=
 * Devuelve los likes de un producto + si el cliente actual le dio like.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get('productoId');
    if (!productoId) {
      return NextResponse.json({ error: 'productoId requerido' }, { status: 400 });
    }

    const user = await getSessionUser();
    const [total, mine] = await Promise.all([
      db.productoLike.count({ where: { productoId } }),
      user
        ? db.productoLike.findUnique({
            where: { clienteId_productoId: { clienteId: user.id, productoId } },
          })
        : null,
    ]);

    return NextResponse.json({ total, liked: !!mine });
  } catch (error) {
    console.error('[LIKES_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/social/likes
 * Body: { productoId }
 * Toggle like (crea o elimina).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const productoId = String(body.productoId ?? '');
    if (!productoId) return NextResponse.json({ error: 'productoId requerido' }, { status: 400 });

    const producto = await db.producto.findUnique({ where: { id: productoId } });
    if (!producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    if (!producto.disponible) return NextResponse.json({ error: 'Producto no disponible' }, { status: 400 });

    const existing = await db.productoLike.findUnique({
      where: { clienteId_productoId: { clienteId: user.id, productoId } },
    });

    if (existing) {
      await db.productoLike.delete({ where: { id: existing.id } });
      const total = await db.productoLike.count({ where: { productoId } });
      return NextResponse.json({ liked: false, total });
    } else {
      await db.productoLike.create({ data: { clienteId: user.id, productoId } });
      await db.actividadUsuario.create({
        data: {
          userId: user.id,
          tipo: 'producto_like',
          descripcion: 'Le dio like a un producto',
          entidadTipo: 'producto',
          entidadId: productoId,
        },
      });
      const total = await db.productoLike.count({ where: { productoId } });
      return NextResponse.json({ liked: true, total });
    }
  } catch (error) {
    console.error('[LIKES_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
