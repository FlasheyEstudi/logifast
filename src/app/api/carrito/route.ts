import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  productoId: z.string().min(1, 'productoId requerido'),
  tiendaId: z.string().min(1, 'tiendaId requerido'),
  cantidad: z.number().int().positive().max(999, 'Máximo 999 unidades').optional().default(1),
  notas: z.string().max(500, 'Notas demasiado largas').optional().nullable(),
});

const patchSchema = z.object({
  productoId: z.string().min(1, 'productoId requerido'),
  cantidad: z.number().int().positive().max(999).optional(),
  notas: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/carrito
 * Devuelve el carrito persistente del cliente.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ items: [] }, { status: 200 });

    const items = await db.carritoItem.findMany({
      where: { clienteId: user.id },
      include: {
        producto: { include: { tienda: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      items: items.map((i) => ({
        id: i.id,
        productoId: i.productoId,
        tiendaId: i.tiendaId,
        cantidad: i.cantidad,
        notas: i.notas,
        nombreProducto: i.producto?.nombre ?? '',
        precioUnitario: i.producto?.precio ?? 0,
        imagenColor: i.producto?.imagenColor ?? '#E8E4DE',
        tiendaNombre: i.producto?.tienda?.nombre ?? '',
      })),
    });
  } catch (error) {
    console.error('[CARRITO_GET]', error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

/**
 * POST /api/carrito
 * Body: { productoId, tiendaId, cantidad?, notas? }
 * Agrega o actualiza un item del carrito persistente.
 * Valida stock disponible antes de agregar (P1).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { productoId, tiendaId, cantidad, notas } = parsed.data;

    // Validar que el producto existe, está disponible y pertenece a la tienda
    const producto = await db.producto.findUnique({
      where: { id: productoId },
      include: { tienda: true },
    });
    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    if (!producto.disponible) {
      return NextResponse.json({ error: 'Producto no disponible' }, { status: 400 });
    }
    if (producto.tiendaId !== tiendaId) {
      return NextResponse.json({ error: 'El producto no pertenece a la tienda indicada' }, { status: 400 });
    }

    // Validar stock disponible
    if (producto.stock !== null) {
      const enCarrito = await db.carritoItem.aggregate({
        where: { clienteId: user.id, productoId },
        _sum: { cantidad: true },
      });
      const yaEnCarrito = enCarrito._sum.cantidad ?? 0;
      if (yaEnCarrito + cantidad > producto.stock) {
        return NextResponse.json(
          { error: `Stock insuficiente. Disponible: ${producto.stock - yaEnCarrito}` },
          { status: 400 }
        );
      }
    }

    const item = await db.carritoItem.upsert({
      where: { clienteId_productoId: { clienteId: user.id, productoId } },
      update: { cantidad: { increment: cantidad }, notas },
      create: { clienteId: user.id, productoId, tiendaId, cantidad, notas },
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error('[CARRITO_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/carrito
 * Body: { productoId, cantidad } o { productoId, notas }
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { productoId, cantidad, notas } = parsed.data;

    const existing = await db.carritoItem.findUnique({
      where: { clienteId_productoId: { clienteId: user.id, productoId } },
    });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    if (cantidad !== undefined) {
      if (cantidad <= 0) {
        await db.carritoItem.delete({ where: { id: existing.id } });
        return NextResponse.json({ ok: true, deleted: true });
      }
      // Validar stock si se especifica cantidad
      const producto = await db.producto.findUnique({
        where: { id: productoId },
        select: { stock: true, disponible: true },
      });
      if (producto?.stock !== null && producto && cantidad > producto.stock) {
        return NextResponse.json(
          { error: `Stock insuficiente. Disponible: ${producto.stock}` },
          { status: 400 }
        );
      }
      await db.carritoItem.update({ where: { id: existing.id }, data: { cantidad } });
    }
    if (notas !== undefined) {
      await db.carritoItem.update({ where: { id: existing.id }, data: { notas } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[CARRITO_PATCH]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/carrito?productoId=  o  /api/carrito (limpiar todo)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get('productoId');

    if (productoId) {
      await db.carritoItem.deleteMany({
        where: { clienteId: user.id, productoId },
      });
    } else {
      await db.carritoItem.deleteMany({ where: { clienteId: user.id } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[CARRITO_DELETE]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
