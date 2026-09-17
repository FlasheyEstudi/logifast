import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { buscarTiendaCompleta, resolverAccesoTienda, tienePermiso } from '@/lib/auth/tienda-acceso';

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

    const tienda = await buscarTiendaCompleta(user);

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

    const tienda = await buscarTiendaCompleta(user);

    if (!tienda) {
      return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    // #7: crear productos exige permiso de inventario; un cajero no puede hacerlo.
    const acceso = await resolverAccesoTienda(user);
    if (acceso && !tienePermiso(acceso, 'inventario')) {
      return NextResponse.json({ ok: false, error: 'Tu rol no puede agregar productos al inventario' }, { status: 403 });
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

    // Producto + movimiento de inventario inicial en una sola transacción:
    // el stock creado nunca queda sin su registro en el Kardex.
    const nuevoProducto = await db.$transaction(async (tx) => {
      const creado = await tx.producto.create({
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
        await tx.kardexMovimiento.create({
          data: {
            tiendaId: tienda.id,
            productoId: creado.id,
            tipo: 'ENTRADA',
            cantidad: stockNum,
            stockAnterior: 0,
            stockNuevo: stockNum,
            costoUnitario: costoNum,
            precioVenta: precioNum,
            motivo: 'Inventario Inicial al crear producto',
            usuarioId: user.id,
          },
        });
      }

      return creado;
    });

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

    const acceso = await resolverAccesoTienda(user);

    const producto = await db.producto.findUnique({
      where: { id },
      include: { tienda: true },
    });

    if (!acceso || !producto || producto.tiendaId !== acceso.tiendaId) {
      return NextResponse.json({ ok: false, error: 'Producto no encontrado o sin permisos' }, { status: 404 });
    }

    // #7: cambiar precios (o costos) exige el permiso `precios`; un cajero puede vender
    // y ajustar stock, pero no tocar la lista de precios.
    if ((dataToUpdate.precio !== undefined || dataToUpdate.costo !== undefined) && !tienePermiso(acceso, 'precios')) {
      return NextResponse.json({ ok: false, error: 'Tu rol no puede cambiar precios' }, { status: 403 });
    }

    // Regla Kardex: editar un producto nunca reescribe el stock en silencio.
    // Si el stock enviado cambia, la actualización y su movimiento AJUSTE van en la misma
    // transacción; si llega igual al actual, se guarda el producto sin generar movimiento.
    let stockSolicitado: number | undefined;
    if (dataToUpdate.stock !== undefined) {
      const stockNum = Number(dataToUpdate.stock);
      if (!Number.isFinite(stockNum) || stockNum < 0) {
        return NextResponse.json(
          { ok: false, error: 'El stock debe ser un número válido mayor o igual a 0' },
          { status: 400 }
        );
      }
      // La columna stock es Int: se normaliza a entero antes de comparar y guardar.
      stockSolicitado = Math.trunc(stockNum);
    }

    const stockActual = producto.stock ?? 0;

    const datosProducto = {
      nombre: typeof dataToUpdate.nombre === 'string' ? dataToUpdate.nombre.trim() : undefined,
      descripcion: typeof dataToUpdate.descripcion === 'string' ? dataToUpdate.descripcion.trim() : undefined,
      categoriaNombre: typeof dataToUpdate.categoriaNombre === 'string' ? dataToUpdate.categoriaNombre.trim() : undefined,
      precio: dataToUpdate.precio !== undefined ? Number(dataToUpdate.precio) : undefined,
      costo: dataToUpdate.costo !== undefined ? Number(dataToUpdate.costo) : undefined,
      stock: stockSolicitado,
      stockMinimo: dataToUpdate.stockMinimo !== undefined ? Number(dataToUpdate.stockMinimo) : undefined,
      codigoBarras: typeof dataToUpdate.codigoBarras === 'string' ? dataToUpdate.codigoBarras.trim() : undefined,
      unidadMedida: typeof dataToUpdate.unidadMedida === 'string' ? dataToUpdate.unidadMedida.trim() : undefined,
      imagenUrl: typeof dataToUpdate.imagenUrl === 'string' ? dataToUpdate.imagenUrl.trim() : undefined,
      portadaUrl: typeof dataToUpdate.portadaUrl === 'string' ? dataToUpdate.portadaUrl.trim() : undefined,
      disponible: dataToUpdate.disponible !== undefined ? Boolean(dataToUpdate.disponible) : undefined,
    };

    if (stockSolicitado === undefined || stockSolicitado === stockActual) {
      // Sin cambio de stock: el producto se guarda sin tocar el stock y sin generar movimiento.
      const updated = await db.producto.update({
        where: { id },
        data: { ...datosProducto, stock: undefined },
      });

      return NextResponse.json({ ok: true, producto: updated });
    }

    // Sí cambió el stock: producto + movimiento de Kardex en una sola transacción.
    const stockNuevo = stockSolicitado;

    const updated = await db.$transaction(async (tx) => {
      const productoActualizado = await tx.producto.update({
        where: { id },
        data: datosProducto,
      });

      await tx.kardexMovimiento.create({
        data: {
          tiendaId: producto.tiendaId,
          productoId: id,
          tipo: 'AJUSTE',
          // Convención del Kardex: en AJUSTE, cantidad = nuevo stock (igual que el ajuste manual).
          cantidad: stockNuevo,
          stockAnterior: stockActual,
          stockNuevo,
          costoUnitario: producto.costo ?? 0,
          precioVenta: producto.precio,
          motivo: 'Ajuste desde edición de producto',
          usuarioId: user.id,
        },
      });

      return productoActualizado;
    });

    return NextResponse.json({ ok: true, producto: updated });
  } catch (error) {
    console.error('[TIENDA_PRODUCTOS_PATCH]', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar producto' }, { status: 500 });
  }
}
