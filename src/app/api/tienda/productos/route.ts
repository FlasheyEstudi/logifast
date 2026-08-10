import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tienda/productos
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const tienda = await db.tienda.findFirst({
      where: { propietarioId: user.id },
    });

    if (!tienda) {
      return NextResponse.json({ ok: false, productos: [] });
    }

    const productos = await db.producto.findMany({
      where: { tiendaId: tienda.id },
      orderBy: { posicion: 'asc' },
    });

    return NextResponse.json({ ok: true, productos });
  } catch (error) {
    console.error('[TIENDA_PRODUCTOS_GET]', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener productos' }, { status: 500 });
  }
}

/**
 * POST /api/tienda/productos
 * Crea un producto en el inventario de la tienda.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const tienda = await db.tienda.findFirst({
      where: { propietarioId: user.id },
    });

    if (!tienda) {
      return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const body = await req.json();
    const {
      nombre,
      descripcion,
      categoriaNombre,
      precio,
      costo,
      stock,
      stockMinimo,
      codigoBarras,
      unidadMedida,
      imagenUrl,
      portadaUrl,
      disponible,
    } = body;

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ ok: false, error: 'El nombre del producto es obligatorio' }, { status: 400 });
    }

    const precioNum = Number(precio) || 0;
    const costoNum = Number(costo) || 0;
    const stockNum = Number(stock) >= 0 ? Number(stock) : 10;
    const stockMinNum = Number(stockMinimo) >= 0 ? Number(stockMinimo) : 5;

    const nuevoProducto = await db.producto.create({
      data: {
        tiendaId: tienda.id,
        nombre: nombre.trim(),
        descripcion: typeof descripcion === 'string' ? descripcion.trim() : null,
        categoriaNombre: typeof categoriaNombre === 'string' ? categoriaNombre.trim() : 'General',
        precio: precioNum,
        costo: costoNum,
        stock: stockNum,
        stockMinimo: stockMinNum,
        codigoBarras: typeof codigoBarras === 'string' ? codigoBarras.trim() : null,
        unidadMedida: typeof unidadMedida === 'string' ? unidadMedida.trim() : 'unidad',
        imagenUrl: typeof imagenUrl === 'string' ? imagenUrl.trim() : null,
        portadaUrl: typeof portadaUrl === 'string' ? portadaUrl.trim() : null,
        disponible: disponible !== false,
      },
    });

    // Registrar en el Kardex como Entrada de Stock inicial
    if (stockNum > 0) {
      await db.kardexMovimiento.create({
        data: {
          tiendaId: tienda.id,
          productoId: nuevoProducto.id,
          tipo: 'ENTRADA',
          cantidad: stockNum,
          stockAnterior: 0,
          stockNuevo: stockNum,
          costoUnitario: costoNum,
          precioVenta: precioNum,
          motivo: 'Inventario Inicial al crear producto',
          usuarioId: user.id,
        },
      }).catch((e) => console.warn('[KARDEX_INITIAL_LOG_ERROR]', e));
    }

    return NextResponse.json({ ok: true, producto: nuevoProducto }, { status: 201 });
  } catch (error) {
    console.error('[TIENDA_PRODUCTOS_POST]', error);
    return NextResponse.json({ ok: false, error: 'Error al crear producto' }, { status: 500 });
  }
}

/**
 * PATCH /api/tienda/productos
 * Actualiza un producto existente.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...dataToUpdate } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID de producto no proporcionado' }, { status: 400 });
    }

    const producto = await db.producto.findUnique({
      where: { id },
      include: { tienda: true },
    });

    if (!producto || producto.tienda.propietarioId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Producto no encontrado o sin permisos' }, { status: 404 });
    }

    const updated = await db.producto.update({
      where: { id },
      data: {
        nombre: typeof dataToUpdate.nombre === 'string' ? dataToUpdate.nombre.trim() : undefined,
        descripcion: typeof dataToUpdate.descripcion === 'string' ? dataToUpdate.descripcion.trim() : undefined,
        categoriaNombre: typeof dataToUpdate.categoriaNombre === 'string' ? dataToUpdate.categoriaNombre.trim() : undefined,
        precio: dataToUpdate.precio !== undefined ? Number(dataToUpdate.precio) : undefined,
        costo: dataToUpdate.costo !== undefined ? Number(dataToUpdate.costo) : undefined,
        stock: dataToUpdate.stock !== undefined ? Number(dataToUpdate.stock) : undefined,
        stockMinimo: dataToUpdate.stockMinimo !== undefined ? Number(dataToUpdate.stockMinimo) : undefined,
        codigoBarras: typeof dataToUpdate.codigoBarras === 'string' ? dataToUpdate.codigoBarras.trim() : undefined,
        unidadMedida: typeof dataToUpdate.unidadMedida === 'string' ? dataToUpdate.unidadMedida.trim() : undefined,
        imagenUrl: typeof dataToUpdate.imagenUrl === 'string' ? dataToUpdate.imagenUrl.trim() : undefined,
        portadaUrl: typeof dataToUpdate.portadaUrl === 'string' ? dataToUpdate.portadaUrl.trim() : undefined,
        disponible: dataToUpdate.disponible !== undefined ? Boolean(dataToUpdate.disponible) : undefined,
      },
    });

    return NextResponse.json({ ok: true, producto: updated });
  } catch (error) {
    console.error('[TIENDA_PRODUCTOS_PATCH]', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar producto' }, { status: 500 });
  }
}
