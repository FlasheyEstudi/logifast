import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/carrito
 * Devuelve el carrito persistente del cliente.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

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
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/carrito
 * Body: { productoId, tiendaId, cantidad?, notas? }
 * Agrega o actualiza un item del carrito persistente.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const productoId = String(body.productoId);
    const tiendaId = String(body.tiendaId);
    const cantidad = Number(body.cantidad) || 1;
    const notas = body.notas ? String(body.notas) : null;

    if (!productoId || !tiendaId) {
      return NextResponse.json({ error: 'productoId y tiendaId requeridos' }, { status: 400 });
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
    const productoId = String(body.productoId);

    const existing = await db.carritoItem.findUnique({
      where: { clienteId_productoId: { clienteId: user.id, productoId } },
    });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    if (body.cantidad !== undefined) {
      const cantidad = Number(body.cantidad);
      if (cantidad <= 0) {
        await db.carritoItem.delete({ where: { id: existing.id } });
        return NextResponse.json({ ok: true, deleted: true });
      }
      await db.carritoItem.update({ where: { id: existing.id }, data: { cantidad } });
    }
    if (body.notas !== undefined) {
      await db.carritoItem.update({ where: { id: existing.id }, data: { notas: body.notas } });
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
