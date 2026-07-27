import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=...&type=tiendas|productos|todos&limit=20
 * Búsqueda global con paginación.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    const type = searchParams.get('type') ?? 'todos';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

    if (!q) {
      return NextResponse.json({ tiendas: [], productos: [], total: 0 });
    }

    const [tiendas, productos] = await Promise.all([
      (type === 'todos' || type === 'tiendas')
        ? db.tienda.findMany({
            where: {
              estado: 'activo',
              OR: [
                { nombre: { contains: q } },
                { descripcion: { contains: q } },
              ],
            },
            take: limit,
            orderBy: { calificacion: 'desc' },
          })
        : Promise.resolve([]),
      (type === 'todos' || type === 'productos')
        ? db.producto.findMany({
            where: {
              disponible: true,
              OR: [
                { nombre: { contains: q } },
                { descripcion: { contains: q } },
              ],
            },
            include: { tienda: { select: { nombre: true, logoColor: true, logoIniciales: true } } },
            take: limit,
            orderBy: { esPopular: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      tiendas,
      productos,
      total: tiendas.length + productos.length,
      query: q,
    });
  } catch (error) {
    return handleError(error, 'SEARCH_GET');
  }
}
