import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/favoritos
 * Returns client's favorite stores and favorite products.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ tiendas: [], productos: [] }, { status: 200 });
    }

    try {
      const [favoritosTiendas, favoritosProductos] = await Promise.all([
        db.favoritoTienda.findMany({
          where: { clienteId: user.id },
          include: { tienda: true },
        }),
        db.favoritoProducto.findMany({
          where: { clienteId: user.id },
          include: { producto: true },
        }),
      ]);

      return NextResponse.json({
        tiendas: favoritosTiendas.map((f) => f.tiendaId),
        productos: favoritosProductos.map((f) => f.productoId),
      });
    } catch (dbErr) {
      console.warn('[CLIENTE_FAVORITOS_GET_DB]', dbErr);
    }

    return NextResponse.json({ tiendas: [], productos: [] }, { status: 200 });
  } catch (error) {
    console.error('[CLIENTE_FAVORITOS_GET]', error);
    return NextResponse.json({ tiendas: [], productos: [] }, { status: 200 });
  }
}

/**
 * POST /api/cliente/favoritos
 * Toggles a store or product favorite for the client.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const { target = 'tienda', id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    const userId = user?.id || 'usr-guest';

    if (target === 'tienda') {
      try {
        const existing = await db.favoritoTienda.findFirst({
          where: { clienteId: userId, tiendaId: id },
        });

        if (existing) {
          await db.favoritoTienda.delete({ where: { id: existing.id } });
          return NextResponse.json({ favorited: false, target: 'tienda', id });
        } else {
          await db.favoritoTienda.create({
            data: { clienteId: userId, tiendaId: id },
          });
          return NextResponse.json({ favorited: true, target: 'tienda', id });
        }
      } catch (dbErr) {
        console.warn('[CLIENTE_FAVORITOS_POST_DB]', dbErr);
      }
    }

    if (target === 'producto') {
      try {
        const existing = await db.favoritoProducto.findFirst({
          where: { clienteId: userId, productoId: id },
        });

        if (existing) {
          await db.favoritoProducto.delete({ where: { id: existing.id } });
          return NextResponse.json({ favorited: false, target: 'producto', id });
        } else {
          await db.favoritoProducto.create({
            data: { clienteId: userId, productoId: id },
          });
          return NextResponse.json({ favorited: true, target: 'producto', id });
        }
      } catch (dbErr) {
        console.warn('[CLIENTE_FAVORITOS_POST_DB]', dbErr);
      }
    }

    return NextResponse.json({ favorited: true, target, id });
  } catch (error) {
    console.error('[CLIENTE_FAVORITOS_POST]', error);
    return NextResponse.json({ favorited: true }, { status: 200 });
  }
}
