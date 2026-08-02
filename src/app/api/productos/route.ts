import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/productos
 * Lista productos con filtros + info de tienda.
 * P1: Paginación real (limit + offset) y búsqueda case-insensitive.
 */
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

    // Paginación segura contra NaN
    const limitRaw = parseInt(searchParams.get('limit') ?? '20', 10);
    const offsetRaw = parseInt(searchParams.get('offset') ?? '0', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 20;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const where: Record<string, unknown> = {};
    if (tiendaId) where.tiendaId = tiendaId;
    if (categoria) where.categoriaNombre = categoria;
    if (populares === 'true') where.esPopular = true;
    if (nuevos === 'true') where.esNuevo = true;
    if (disponibles === 'true') where.disponible = true;
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { descripcion: { contains: search } },
      ];
    }
    if (minPrecio || maxPrecio) {
      const range: Record<string, number> = {};
      if (minPrecio) range.gte = parseFloat(minPrecio);
      if (maxPrecio) range.lte = parseFloat(maxPrecio);
      where.precio = range;
    }
    if (enOferta === 'true') {
      where.precioOriginal = { not: null };
    }

    const [productosRaw, total] = await Promise.all([
      db.producto.findMany({
        where,
        include: { tienda: true },
        orderBy: [{ posicion: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
      }),
      db.producto.count({ where }),
    ]);

    const productos = productosRaw.map((p) => ({
      id: p.id,
      tiendaId: p.tiendaId,
      categoriaNombre: p.categoriaNombre ?? '',
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      precioOriginal: p.precioOriginal ?? undefined,
      imagenColor: p.imagenColor,
      disponible: p.disponible,
      esNuevo: p.esNuevo,
      esPopular: p.esPopular,
      stock: p.stock,
      tiendaNombre: p.tienda?.nombre ?? 'Tienda',
      tiendaLogo: p.tienda?.logoIniciales ?? 'T',
      tiendaColor: p.tienda?.logoColor ?? '#FF5722',
      tiendaCategoria: p.tienda?.categoria ?? 'tienda',
    }));

    return NextResponse.json({
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      productos,
    });
  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los productos' },
      { status: 500 }
    );
  }
}
