import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { buscarTiendaCompleta } from '@/lib/auth/tienda-acceso';

export const dynamic = 'force-dynamic';

const MAX_DIAS = 3650;

export interface ResumenEstadisticas {
  totalVendido: number;
  totalDescuentos: number;
  numVentas: number;
  ticketPromedio: number;
  devoluciones: number;
  montoDevuelto: number;
  totalItems: number;
  productosConStockBajo: number;
  mejorDia: { fecha: string; total: number } | null;
  horaPico: { hora: number; total: number } | null;
}

export interface ComparacionEstadisticas {
  hayDatos: boolean;
  etiqueta: string;
  totalVendidoAnterior: number;
  numVentasAnterior: number;
  ticketPromedioAnterior: number;
  variacionVendido: number | null;
  variacionVentas: number | null;
  variacionTicket: number | null;
}

export interface DatosEstadisticas {
  tienda: { id: string; nombre: string };
  rango: { dias: number; desde: string; hasta: string };
  resumen: ResumenEstadisticas;
  comparacion: ComparacionEstadisticas;
  porDia: { fecha: string; total: number; ventas: number }[];
  porHora: { hora: number; total: number; ventas: number }[];
  porMetodo: { metodo: string; total: number; ventas: number }[];
  topProductos: { productoId: string | null; nombre: string; cantidad: number; monto: number }[];
  alertasStockBajo: { productoId: string; nombre: string; stock: number; stockMinimo: number }[];
}

/**
 * GET /api/tienda/estadisticas?dias=30
 *
 * Panel de la tienda: ventas, horas pico, formas de pago y top de productos, más la
 * comparación contra el período anterior de la misma duración.
 *
 * Sale del mismo libro que los reportes XLSX/PDF y la exportación CSV (`VentaPOS` +
 * `ItemVentaPOS`), y agrupa por día y hora con las mismas reglas de formato (`es-NI`)
 * para que las cifras cuadren entre pantalla y archivo. Las devoluciones entran como
 * ventas negativas, así que el total es el dinero real.
 *
 * `dias=0` = todo el historial (sin comparación).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const tienda = await buscarTiendaCompleta(user);
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

    // Período anterior de la misma duración (para el % de variación).
    const desdeAnterior = new Date(0);
    if (dias > 0) {
      desdeAnterior.setTime(desde.getTime());
      desdeAnterior.setDate(desdeAnterior.getDate() - dias);
    }

    const [ventas, ventasAnteriores] = await Promise.all([
      db.ventaPOS.findMany({
        where: { tiendaId: tienda.id, ...(dias > 0 ? { createdAt: { gte: desde } } : {}) },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      }),
      dias > 0
        ? db.ventaPOS.findMany({
            where: { tiendaId: tienda.id, createdAt: { gte: desdeAnterior, lt: desde } },
            select: { total: true },
          })
        : Promise.resolve([] as { total: number }[]),
    ]);

    const porDia = new Map<string, { fecha: string; total: number; ventas: number }>();
    const porHora = Array.from({ length: 24 }, (_, hora) => ({ hora, total: 0, ventas: 0 }));
    const porMetodo = new Map<string, { metodo: string; total: number; ventas: number }>();
    const productos = new Map<string, { productoId: string | null; nombre: string; cantidad: number; monto: number }>();

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

      const metodo = (v.metodoPago || 'efectivo').toLowerCase();
      const acumuladoMetodo = porMetodo.get(metodo) ?? { metodo, total: 0, ventas: 0 };
      acumuladoMetodo.total += v.total;
      acumuladoMetodo.ventas++;
      porMetodo.set(metodo, acumuladoMetodo);

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

    const conStock = await db.producto.findMany({
      where: { tiendaId: tienda.id, stock: { not: null } },
      select: { id: true, nombre: true, stock: true, stockMinimo: true },
      orderBy: { stock: 'asc' },
    });
    const alertasStockBajo = conStock
      .filter((p) => p.stock !== null && p.stockMinimo !== null && p.stock <= p.stockMinimo)
      .slice(0, 10)
      .map((p) => ({ productoId: p.id, nombre: p.nombre, stock: p.stock as number, stockMinimo: p.stockMinimo as number }));

    // ─── Comparación con el período anterior ───
    const totalVendidoAnterior = ventasAnteriores.reduce((s, v) => s + v.total, 0);
    const numVentasAnterior = ventasAnteriores.length;
    const ticketPromedioAnterior = numVentasAnterior > 0 ? totalVendidoAnterior / numVentasAnterior : 0;
    const ticketActual = ventas.length > 0 ? totalVendido / ventas.length : 0;

    const variacion = (actual: number, anterior: number): number | null => {
      if (numVentasAnterior === 0 && ventas.length === 0) return null;
      if (anterior === 0) return actual === 0 ? null : 100;
      return ((actual - anterior) / Math.abs(anterior)) * 100;
    };

    const comparacion: ComparacionEstadisticas = {
      hayDatos: numVentasAnterior > 0,
      etiqueta: dias > 0 ? `frente a los ${dias} días anteriores` : 'sin comparación (todo el historial)',
      totalVendidoAnterior,
      numVentasAnterior,
      ticketPromedioAnterior,
      variacionVendido: dias > 0 ? variacion(totalVendido, totalVendidoAnterior) : null,
      variacionVentas: dias > 0 ? variacion(ventas.length, numVentasAnterior) : null,
      variacionTicket: dias > 0 ? variacion(ticketActual, ticketPromedioAnterior) : null,
    };

    const diasOrdenados = Array.from(porDia.values());
    const mejorDia = diasOrdenados.length
      ? diasOrdenados.reduce((mejor, d) => (d.total > mejor.total ? d : mejor), diasOrdenados[0])
      : null;
    const horasConVenta = porHora.filter((h) => h.ventas > 0);
    const horaPico = horasConVenta.length
      ? horasConVenta.reduce((mejor, h) => (h.total > mejor.total ? h : mejor), horasConVenta[0])
      : null;

    const resumen: ResumenEstadisticas = {
      totalVendido,
      totalDescuentos,
      numVentas: ventas.length,
      ticketPromedio: ticketActual,
      devoluciones,
      montoDevuelto,
      totalItems,
      productosConStockBajo: alertasStockBajo.length,
      mejorDia,
      horaPico: horaPico ? { hora: horaPico.hora, total: horaPico.total } : null,
    };

    const datos: DatosEstadisticas = {
      tienda: { id: tienda.id, nombre: tienda.nombre },
      rango: { dias, desde: desde.toISOString(), hasta: hasta.toISOString() },
      resumen,
      comparacion,
      porDia: diasOrdenados,
      porHora,
      porMetodo: Array.from(porMetodo.values()).sort((a, b) => b.total - a.total),
      topProductos: Array.from(productos.values())
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 10),
      alertasStockBajo,
    };

    return NextResponse.json({ ok: true, ...datos });
  } catch (err) {
    console.error('[tienda/estadisticas]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron calcular las estadísticas' }, { status: 500 });
  }
}
