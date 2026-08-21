import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/ordenes-compra/[id]/productos
 * Devuelve el checklist de productos para recoger en la tienda
 * correspondiente a una orden de compra asignada al repartidor.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const ordenCompra = await db.ordenCompra.findUnique({
      where: { id },
      include: {
        items: { include: { producto: true } },
        tienda: true,
      },
    });

    if (!ordenCompra) {
      return NextResponse.json(
        { error: `Orden de compra no encontrada: ${id}` },
        { status: 404 }
      );
    }

    const productos = ordenCompra.items.map((item, idx) => ({
      id: `p-${id}-${idx + 1}`,
      nombre: item.nombreProducto,
      cantidad: item.cantidad,
      verificado: false,
      precioUnitario: item.precioUnitario,
      notas: item.notas ?? null,
    }));

    return NextResponse.json({
      ordenId: id,
      tiendaId: ordenCompra.tiendaId,
      tiendaNombre: ordenCompra.tienda?.nombre ?? '',
      total: productos.length,
      verificados: 0,
      productos,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDENES_COMPRA_PRODUCTOS_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener el checklist de productos' },
      { status: 500 }
    );
  }
}
