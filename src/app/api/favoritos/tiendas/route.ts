import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TIENDAS, type FavoritoTienda } from '@/lib/marketplace-store';

// In-memory store for favorites (mock persistence per session)
let favoritosTiendas: FavoritoTienda[] = [
  { tiendaId: 't1' },
  { tiendaId: 't2' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('clienteId');

    // Return enriched favorites with tienda details
    const favoritosEnriquecidos = favoritosTiendas
      .map((fav) => {
        const tienda = MOCK_TIENDAS.find((t) => t.id === fav.tiendaId);
        if (!tienda) return null;
        return {
          ...fav,
          tienda,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      total: favoritosEnriquecidos.length,
      favoritos: favoritosEnriquecidos,
      clienteId: clienteId ?? 'cliente-1',
    });
  } catch (error) {
    console.error('Error fetching favoritos de tiendas:', error);
    return NextResponse.json(
      { error: 'Error al obtener los favoritos de tiendas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tiendaId, action } = body;

    if (!tiendaId) {
      return NextResponse.json(
        { error: 'tiendaId es obligatorio' },
        { status: 400 }
      );
    }

    // Validate tienda exists
    const tienda = MOCK_TIENDAS.find((t) => t.id === tiendaId);
    if (!tienda) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    const isFavorite = favoritosTiendas.some((f) => f.tiendaId === tiendaId);

    if (action === 'remove' || (action !== 'add' && isFavorite)) {
      // Remove from favorites
      favoritosTiendas = favoritosTiendas.filter((f) => f.tiendaId !== tiendaId);
      return NextResponse.json({
        message: 'Tienda removida de favoritos',
        tiendaId,
        esFavorito: false,
      });
    } else {
      // Add to favorites
      if (!isFavorite) {
        favoritosTiendas.push({ tiendaId });
      }
      return NextResponse.json({
        message: 'Tienda agregada a favoritos',
        tiendaId,
        esFavorito: true,
      });
    }
  } catch (error) {
    console.error('Error actualizando favorito de tienda:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el favorito de tienda' },
      { status: 500 }
    );
  }
}
