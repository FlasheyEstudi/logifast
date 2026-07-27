import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/tienda/productos
 * Crea un producto en la tienda del cliente.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) return NextResponse.json({ error: 'No tienes tienda' }, { status: 404 });

    const body = await req.json();
    const {
      nombre,
      descripcion,
      categoriaNombre = 'General',
      precio,
      precioOriginal,
      imagenColor = '#E8E4DE',
      imagenUrl,
      disponible = true,
      esNuevo = false,
      esPopular = false,
      stock = null,
    } = body;

    if (!nombre || precio === undefined) {
      return NextResponse.json({ error: 'nombre y precio son obligatorios' }, { status: 400 });
    }

    const producto = await db.producto.create({
      data: {
        tiendaId: tienda.id,
        nombre,
        descripcion: descripcion ?? null,
        categoriaNombre,
        precio: Number(precio),
        precioOriginal: precioOriginal ? Number(precioOriginal) : null,
        imagenColor,
        imagenUrl: imagenUrl ?? null,
        disponible,
        esNuevo,
        esPopular,
        stock: stock !== null ? Number(stock) : null,
      },
    });

    return NextResponse.json({ ok: true, producto });
  } catch (error) {
    console.error('[CLIENTE_PRODUCTO_POST]', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}

/**
 * PATCH /api/cliente/tienda/productos
 * Body: { id, ...campos }
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) return NextResponse.json({ error: 'No tienes tienda' }, { status: 404 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    // Verificar que el producto pertenece a la tienda del cliente
    const producto = await db.producto.findUnique({ where: { id } });
    if (!producto || producto.tiendaId !== tienda.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    const allowed = ['nombre', 'descripcion', 'categoriaNombre', 'imagenColor', 'imagenUrl', 'disponible', 'esNuevo', 'esPopular'];
    for (const k of allowed) {
      if (k in updates) data[k] = updates[k];
    }
    if ('precio' in updates) data.precio = Number(updates.precio);
    if ('precioOriginal' in updates) data.precioOriginal = updates.precioOriginal ? Number(updates.precioOriginal) : null;
    if ('stock' in updates) data.stock = updates.stock !== null ? Number(updates.stock) : null;

    const updated = await db.producto.update({ where: { id }, data });
    return NextResponse.json({ ok: true, producto: updated });
  } catch (error) {
    console.error('[CLIENTE_PRODUCTO_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

/**
 * DELETE /api/cliente/tienda/productos?id=
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) return NextResponse.json({ error: 'No tienes tienda' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const producto = await db.producto.findUnique({ where: { id } });
    if (!producto || producto.tiendaId !== tienda.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await db.producto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[CLIENTE_PRODUCTO_DELETE]', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
