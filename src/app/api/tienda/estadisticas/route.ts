import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const MAX_DIAS = 365;

/**
 * GET /api/tienda/estadisticas?dias=30
 *
 * Ventas, horas pico y top de productos de la tienda.
 *
 * Sale exactamente del mismo libro que la exportación CSV (`VentaPOS` + `ItemVentaPOS`)
 * y agrupa por día y hora con las mismas reglas de formato (`es-NI`), para que las
 * cifras del portal cuadren con el archivo que descarga la tienda. Las devoluciones
 * entran como ventas negativas, así que el total neto es el dinero real.
 *
 * `dias=0` = todo el historial (así se puede cuadrar contra el CSV completo).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) {
      return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const diasParam = parseInt(req.nextUrl.searchParams.get('dias') || '30', 10);
    const dias = Number.isFinite(diasParam) ? Math.min(MAX_DIAS, Math.max(0, diasParam)) : 30;

    const hasta = new Date();
    const desde = new Date(0);
    if (dias > 0) {
      desde.setTime(hasta.getTime());
      desde.setDate(desde.getDate() - (dias - 1));
      desde.setHours(0, 0, 0, 0);
    }

    const ventas = await db.ventaPOS.findMany({
      where: { tiendaId: tienda.id, ...(dias > 0 ? { createdAt: { gte: desde } } : {}) },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const porDia = new Map<string, { fecha: string; total: number; ventas: number }>();
    const porHora = Array.from({ length: 24 }, (_, hora) => ({ hora, total: 0, ventas: 0 }));
    const productos = new Map<
      string,
      { productoId: string | null; nombre: string; cantidad: number; monto: number }
    >();

    let totalVendido = 0;
    let totalDescuentos = 0;
    let devoluciones = 0;
    let montoDevuelto = 0;
    let totalItems = 0;

    for (const v of ventas) {
      const esDevolucion = v.metodoPago === 'devolucion';
      if (esDevolucion) {
        devoluciones++;
        montoDevuelto += Math.abs(v.total);
      }
      totalVendido += v.total;
      totalDescuentos += v.descuento;

      const fecha = new Date(v.createdAt).toLocaleDateString('es-NI');
      const hora = new Date(v.createdAt).getHours();

      const dia = porDia.get(fecha) ?? { fecha, total: 0, ventas: 0 };
      dia.total += v.total;
      dia.ventas++;
      porDia.set(fecha, dia);

      porHora[hora].total += v.total;
      porHora[hora].ventas++;

      for (const it of v.items) {
        totalItems += it.cantidad;
        const key = it.productoId || it.nombreProducto;
        const p = productos.get(key) ?? {
          productoId: it.productoId ?? null,
          nombre: it.nombreProducto,
          cantidad: 0,
          monto: 0,
        };
        p.cantidad += it.cantidad;
        p.monto += it.subtotal;
        productos.set(key, p);
      }
    }

    // Alertas de inventario: mismo criterio que el resto del sistema (stock <= mínimo).
    const conStock = await db.producto.findMany({
      where: { tiendaId: tienda.id, stock: { not: null } },
      select: { id: true, nombre: true, stock: true, stockMinimo: true },
      orderBy: { stock: 'asc' },
    });
    const alertasStockBajo = conStock
      .filter((p) => p.stock !== null && p.stockMinimo !== null && p.stock <= p.stockMinimo)
      .slice(0, 10)
      .map((p) => ({ productoId: p.id, nombre: p.nombre, stock: p.stock as number, stockMinimo: p.stockMinimo as number }));

    return NextResponse.json({
      ok: true,
      tienda: { id: tienda.id, nombre: tienda.nombre },
      rango: { dias, desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen: {
        totalVendido,
        totalDescuentos,
        numVentas: ventas.length,
        ticketPromedio: ventas.length > 0 ? totalVendido / ventas.length : 0,
        devoluciones,
        montoDevuelto,
        totalItems,
        productosConStockBajo: alertasStockBajo.length,
      },
      porDia: Array.from(porDia.values()),
      porHora,
      topProductos: Array.from(productos.values())
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 10),
      alertasStockBajo,
    });
  } catch (err) {
    console.error('[tienda/estadisticas]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron calcular las estadísticas' }, { status: 500 });
  }
}
