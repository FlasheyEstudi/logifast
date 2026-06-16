import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTOS_CHECKLIST } from '@/lib/repartidor-mock';
import { MOCK_ORDENES_COMPRA } from '@/lib/marketplace-store';

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
    const { id } = await params;

    const ordenCompra = MOCK_ORDENES_COMPRA.find((o) => o.id === id);
    if (!ordenCompra) {
      return NextResponse.json(
        { error: `Orden de compra no encontrada: ${id}` },
        { status: 404 }
      );
    }

    // Si ya tenemos checklist pre-armado, usarlo
    const checklist = MOCK_PRODUCTOS_CHECKLIST[id];
    if (checklist) {
      return NextResponse.json({
        ordenId: id,
        tiendaId: ordenCompra.tiendaId,
        tiendaNombre: ordenCompra.tiendaNombre,
        total: checklist.length,
        verificados: checklist.filter((p) => p.verificado).length,
        productos: checklist,
      });
    }

    // Generar checklist desde los items de la orden de compra
    const productosGenerados = ordenCompra.items.map((item, idx) => ({
      id: `p-${id}-${idx + 1}`,
      nombre: item.nombreProducto,
      cantidad: item.cantidad,
      verificado: false,
    }));

    return NextResponse.json({
      ordenId: id,
      tiendaId: ordenCompra.tiendaId,
      tiendaNombre: ordenCompra.tiendaNombre,
      total: productosGenerados.length,
      verificados: 0,
      productos: productosGenerados,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDENES_COMPRA_PRODUCTOS_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener el checklist de productos' },
      { status: 500 }
    );
  }
}
