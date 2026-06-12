import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TIENDAS } from '@/lib/marketplace-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const zona = searchParams.get('zona');
    const search = searchParams.get('search');
    const popular = searchParams.get('popular');
    const verificado = searchParams.get('verificado');

    let tiendas = MOCK_TIENDAS.filter((t) => t.estado === 'activo');

    if (categoria && categoria !== 'todos') {
      tiendas = tiendas.filter((t) => t.categoria === categoria);
    }

    if (zona) {
      tiendas = tiendas.filter((t) => t.zonaCobertura.includes(zona));
    }

    if (search) {
      const q = search.toLowerCase();
      tiendas = tiendas.filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q)
      );
    }

    if (popular === 'true') {
      tiendas = tiendas.filter((t) => t.popular);
    }

    if (verificado === 'true') {
      tiendas = tiendas.filter((t) => t.verificado);
    }

    return NextResponse.json(tiendas);
  } catch (error) {
    console.error('Error fetching tiendas:', error);
    return NextResponse.json(
      { error: 'Error al obtener las tiendas' },
      { status: 500 }
    );
  }
}
