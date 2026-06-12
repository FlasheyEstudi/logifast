import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TIENDAS, MOCK_RESENAS } from '@/lib/marketplace-store';

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

    const resenas = MOCK_RESENAS.filter((r) => r.tiendaId === id);

    return NextResponse.json({
      ...tienda,
      resenas,
    });
  } catch (error) {
    console.error('Error fetching tienda:', error);
    return NextResponse.json(
      { error: 'Error al obtener la tienda' },
      { status: 500 }
    );
  }
}
