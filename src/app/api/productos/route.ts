import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTOS, MOCK_TIENDAS } from '@/lib/marketplace-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const categoria = searchParams.get('categoria');
    const tiendaId = searchParams.get('tiendaId');
    const minPrecio = searchParams.get('minPrecio');
    const maxPrecio = searchParams.get('maxPrecio');
    const populares = searchParams.get('populares');
    const nuevos = searchParams.get('nuevos');
    const disponibles = searchParams.get('disponibles');
    const enOferta = searchParams.get('enOferta');

    let productos = [...MOCK_PRODUCTOS];

    if (tiendaId) {
      productos = productos.filter((p) => p.tiendaId === tiendaId);
    }

    if (search) {
      const q = search.toLowerCase();
      productos = productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q)
      );
    }

    if (categoria) {
      productos = productos.filter((p) => p.categoriaNombre === categoria);
    }

    if (minPrecio) {
      const min = parseFloat(minPrecio);
      if (!isNaN(min)) {
        productos = productos.filter((p) => p.precio >= min);
      }
    }

    if (maxPrecio) {
      const max = parseFloat(maxPrecio);
      if (!isNaN(max)) {
        productos = productos.filter((p) => p.precio <= max);
      }
    }

    if (populares === 'true') {
      productos = productos.filter((p) => p.esPopular);
    }

    if (nuevos === 'true') {
      productos = productos.filter((p) => p.esNuevo);
    }

    if (disponibles === 'true') {
      productos = productos.filter((p) => p.disponible);
    }

    if (enOferta === 'true') {
      productos = productos.filter((p) => p.precioOriginal !== undefined);
    }

    // Enrich with tienda info
    const productosEnriquecidos = productos.map((p) => {
      const tienda = MOCK_TIENDAS.find((t) => t.id === p.tiendaId);
      return {
        ...p,
        tiendaNombre: tienda?.nombre ?? 'Tienda',
        tiendaLogo: tienda?.logoIniciales ?? 'T',
        tiendaColor: tienda?.logoColor ?? '#FF5722',
        tiendaCategoria: tienda?.categoria ?? 'tienda',
      };
    });

    return NextResponse.json({
      total: productosEnriquecidos.length,
      productos: productosEnriquecidos,
    });
  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los productos' },
      { status: 500 }
    );
  }
}
