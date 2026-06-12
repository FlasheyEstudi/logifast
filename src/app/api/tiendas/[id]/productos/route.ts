import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTOS, MOCK_TIENDAS } from '@/lib/marketplace-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tienda = MOCK_TIENDAS.find((t) => t.id === id);

    if (!tienda) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const search = searchParams.get('search');
    const soloDisponibles = searchParams.get('disponibles');
    const populares = searchParams.get('populares');
    const nuevos = searchParams.get('nuevos');

    let productos = MOCK_PRODUCTOS.filter((p) => p.tiendaId === id);

    if (categoria) {
      productos = productos.filter((p) => p.categoriaNombre === categoria);
    }

    if (search) {
      const q = search.toLowerCase();
      productos = productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q)
      );
    }

    if (soloDisponibles === 'true') {
      productos = productos.filter((p) => p.disponible);
    }

    if (populares === 'true') {
      productos = productos.filter((p) => p.esPopular);
    }

    if (nuevos === 'true') {
      productos = productos.filter((p) => p.esNuevo);
    }

    // Group productos by categoriaNombre
    const categorias: Record<string, typeof productos> = {};
    for (const producto of productos) {
      if (!categorias[producto.categoriaNombre]) {
        categorias[producto.categoriaNombre] = [];
      }
      categorias[producto.categoriaNombre].push(producto);
    }

    return NextResponse.json({
      tiendaId: id,
      tiendaNombre: tienda.nombre,
      productos,
      categorias,
    });
  } catch (error) {
    console.error('Error fetching productos de tienda:', error);
    return NextResponse.json(
      { error: 'Error al obtener los productos de la tienda' },
      { status: 500 }
    );
  }
}
