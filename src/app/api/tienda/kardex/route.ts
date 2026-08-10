import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tienda/kardex
 * Devuelve el historial de movimientos de inventario Kardex de la tienda.
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
      return NextResponse.json({ ok: false, movimientos: [] });
    }

    const movimientos = await db.kardexMovimiento.findMany({
      where: { tiendaId: tienda.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            codigoBarras: true,
            unidadMedida: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, movimientos });
  } catch (error) {
    console.error('[TIENDA_KARDEX_GET]', error);
    return NextResponse.json({ ok: false, error: 'Error al consultar Kardex' }, { status: 500 });
  }
}

/**
 * POST /api/tienda/kardex
 * Registra un movimiento de entrada, salida o ajuste en el Kardex y actualiza el stock del producto.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { productoId, tipo, cantidad, motivo, costoUnitario } = body;

    if (!productoId || !tipo || !cantidad) {
      return NextResponse.json(
        { ok: false, error: 'Faltan parámetros obligatorios (productoId, tipo, cantidad)' },
        { status: 400 }
      );
    }

    const cantNum = Math.abs(Number(cantidad)) || 0;
    if (cantNum === 0) {
      return NextResponse.json({ ok: false, error: 'La cantidad debe ser mayor a cero' }, { status: 400 });
    }

    const producto = await db.producto.findUnique({
      where: { id: productoId },
      include: { tienda: true },
    });

    if (!producto || producto.tienda.propietarioId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    const stockActual = producto.stock ?? 0;
    let nuevoStock = stockActual;

    if (tipo === 'ENTRADA') {
      nuevoStock = stockActual + cantNum;
    } else if (tipo === 'SALIDA') {
      nuevoStock = Math.max(0, stockActual - cantNum);
    } else if (tipo === 'AJUSTE') {
      nuevoStock = cantNum;
    }

    // Actualizar stock del producto
    await db.producto.update({
      where: { id: productoId },
      data: { stock: nuevoStock },
    });

    // Crear registro Kardex
    const movimiento = await db.kardexMovimiento.create({
      data: {
        tiendaId: producto.tiendaId,
        productoId,
        tipo,
        cantidad: cantNum,
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
        costoUnitario: Number(costoUnitario) || producto.costo || 0,
        precioVenta: producto.precio,
        motivo: typeof motivo === 'string' ? motivo.trim() : 'Movimiento de Kardex',
        usuarioId: user.id,
      },
    });

    return NextResponse.json({ ok: true, movimiento, nuevoStock });
  } catch (error) {
    console.error('[TIENDA_KARDEX_POST]', error);
    return NextResponse.json({ ok: false, error: 'Error al registrar movimiento Kardex' }, { status: 500 });
  }
}
