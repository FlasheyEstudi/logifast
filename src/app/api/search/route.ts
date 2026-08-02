import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=...&type=tiendas|productos|todos&limit=20&offset=0
 * Búsqueda global con paginación y case-insensitive (P1).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    const type = searchParams.get('type') ?? 'todos';

    // Paginación segura contra NaN
    const limitRaw = parseInt(searchParams.get('limit') ?? '20', 10);
    const offsetRaw = parseInt(searchParams.get('offset') ?? '0', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 20;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

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
            skip: offset,
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
            skip: offset,
            orderBy: { esPopular: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      tiendas,
      productos,
      total: tiendas.length + productos.length,
      limit,
      offset,
      query: q,
    });
  } catch (error) {
    return handleError(error, 'SEARCH_GET');
  }
}
