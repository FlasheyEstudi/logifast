import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tiendas/[id]/productos
 * Lista los productos de una tienda, con filtros.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tienda = await db.tienda.findUnique({ where: { id } });

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

    const where: Record<string, unknown> = { tiendaId: id };
    if (categoria) where.categoriaNombre = categoria;
    if (soloDisponibles === 'true') where.disponible = true;
    if (populares === 'true') where.esPopular = true;
    if (nuevos === 'true') where.esNuevo = true;
    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { descripcion: { contains: search } },
      ];
    }

    const productosRaw = await db.producto.findMany({
      where,
      orderBy: [{ posicion: 'asc' }, { createdAt: 'asc' }],
    });

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
    }));

    // Agrupar por categoriaNombre
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

/**
 * POST /api/tiendas/[id]/productos
 * Crea un producto en la tienda.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const body = await req.json();
    const {
      nombre,
      descripcion,
      categoriaNombre = 'General',
      precio,
      precioOriginal,
      imagenColor = 'var(--border)',
      disponible = true,
      esNuevo = false,
      esPopular = false,
      stock = null,
      posicion = 0,
    } = body;

    if (!nombre || precio === undefined) {
      return NextResponse.json(
        { error: 'nombre y precio son obligatorios' },
        { status: 400 }
      );
    }

    const producto = await db.producto.create({
      data: {
        tiendaId: id,
        nombre,
        descripcion: descripcion ?? null,
        categoriaNombre,
        precio: Number(precio),
        precioOriginal: precioOriginal ? Number(precioOriginal) : null,
        imagenColor,
        disponible,
        esNuevo,
        esPopular,
        stock: stock !== null ? Number(stock) : null,
        posicion: Number(posicion) || 0,
      },
    });

    return NextResponse.json({ producto });
  } catch (error) {
    return handleError(error, 'PRODUCTO_POST');
  }
}
