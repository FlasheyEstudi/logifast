import { db } from '@/lib/db';

/**
 * Datos de los reportes de tienda, en una sola forma normalizada.
 *
 * XLSX y PDF consumen de aquí: así los dos archivos muestran siempre las mismas
 * cifras y no hay dos consultas que puedan divergir con el tiempo.
 */

export type TipoReporte = 'ventas' | 'kardex' | 'inventario';
export type TipoColumna = 'texto' | 'entero' | 'moneda';

export interface ColumnaReporte {
  titulo: string;
  tipo: TipoColumna;
  /** Ancho relativo: se usa para repartir el ancho de la tabla en PDF y las columnas en Excel. */
  peso: number;
}

export interface ReporteArmado {
  tipo: TipoReporte;
  titulo: string;
  periodo: string;
  descripcion: string;
  columnas: ColumnaReporte[];
  filas: (string | number)[][];
  /** Fila de totales alineada con `columnas` (null donde no aplica). */
  totales: (string | number | null)[];
  /** Cifras destacadas que van arriba, en el encabezado. */
  resumen: { etiqueta: string; valor: string }[];
  /** Notas al pie del reporte (advertencias honestas sobre el alcance de las cifras). */
  notas: string[];
}

const dinero = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function rangoPeriodo(dias: number) {
  const hasta = new Date();
  const desde = new Date(0);
  if (dias > 0) {
    desde.setTime(hasta.getTime());
    desde.setDate(desde.getDate() - (dias - 1));
    desde.setHours(0, 0, 0, 0);
  }
  const etiqueta =
    dias <= 0
      ? 'Todo el historial'
      : `Del ${desde.toLocaleDateString('es-NI')} al ${hasta.toLocaleDateString('es-NI')}`;
  return { desde, hasta, etiqueta, dias };
}

export async function reunirDatosReporte(
  tiendaId: string,
  tipo: TipoReporte = 'ventas',
  dias = 30
): Promise<ReporteArmado> {
  const { desde, etiqueta } = rangoPeriodo(dias);
  const filtroFecha = dias > 0 ? { createdAt: { gte: desde } } : {};

  if (tipo === 'inventario') {
    const productos = await db.producto.findMany({
      where: { tiendaId },
      orderBy: { nombre: 'asc' },
    });

    const filas = productos.map((p) => [
      p.nombre,
      p.categoriaNombre || 'General',
      p.codigoBarras || '',
      p.costo ?? 0,
      p.precio,
      p.stock ?? 0,
      p.stockMinimo ?? 0,
      p.unidadMedida || 'unidad',
      p.disponible ? 'Publicado' : 'Oculto',
    ]);

    const valorCosto = productos.reduce((s, p) => s + (p.costo ?? 0) * (p.stock ?? 0), 0);
    const valorVenta = productos.reduce((s, p) => s + p.precio * (p.stock ?? 0), 0);
    const bajoMinimo = productos.filter((p) => p.stock !== null && p.stockMinimo !== null && p.stock <= p.stockMinimo);

    return {
      tipo,
      titulo: 'Reporte de Inventario',
      periodo: `Estado al ${new Date().toLocaleDateString('es-NI')}`,
      descripcion: 'Existencias, costos y precios por producto',
      columnas: [
        { titulo: 'Producto', tipo: 'texto', peso: 2.4 },
        { titulo: 'Categoría', tipo: 'texto', peso: 1.3 },
        { titulo: 'Código de barras', tipo: 'texto', peso: 1.3 },
        { titulo: 'Costo', tipo: 'moneda', peso: 1 },
        { titulo: 'Precio', tipo: 'moneda', peso: 1 },
        { titulo: 'Stock', tipo: 'entero', peso: 0.8 },
        { titulo: 'Mínimo', tipo: 'entero', peso: 0.8 },
        { titulo: 'Unidad', tipo: 'texto', peso: 0.9 },
        { titulo: 'Estado', tipo: 'texto', peso: 0.9 },
      ],
      filas,
      totales: [
        `Total: ${productos.length}`,
        null,
        null,
        valorCosto,
        valorVenta,
        productos.reduce((s, p) => s + (p.stock ?? 0), 0),
        null,
        null,
        null,
      ],
      resumen: [
        { etiqueta: 'Productos', valor: String(productos.length) },
        { etiqueta: 'Valor a costo', valor: dinero(valorCosto) },
        { etiqueta: 'Valor a precio de venta', valor: dinero(valorVenta) },
        { etiqueta: 'En o bajo el mínimo', valor: String(bajoMinimo.length) },
      ],
      notas: [
        'El valor de inventario a costo usa el costo registrado hoy en el catálogo.',
        'Los productos sin control de existencias aparecen con stock 0.',
      ],
    };
  }

  if (tipo === 'kardex') {
    const movimientos = await db.kardexMovimiento.findMany({
      where: { tiendaId, ...filtroFecha },
      include: { producto: { select: { nombre: true, codigoBarras: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const entradas = movimientos.filter((m) => m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION');
    const salidas = movimientos.filter((m) => m.tipo === 'VENTA_POS');

    return {
      tipo,
      titulo: 'Reporte de Movimientos de Kardex',
      periodo: etiqueta,
      descripcion: 'Entradas, salidas y ajustes de existencias',
      columnas: [
        { titulo: 'Fecha', tipo: 'texto', peso: 0.9 },
        { titulo: 'Hora', tipo: 'texto', peso: 0.7 },
        { titulo: 'Producto', tipo: 'texto', peso: 2.2 },
        { titulo: 'Código', tipo: 'texto', peso: 1.1 },
        { titulo: 'Movimiento', tipo: 'texto', peso: 1.1 },
        { titulo: 'Cantidad', tipo: 'entero', peso: 0.9 },
        { titulo: 'Stock anterior', tipo: 'entero', peso: 1 },
        { titulo: 'Stock nuevo', tipo: 'entero', peso: 1 },
        { titulo: 'Motivo', tipo: 'texto', peso: 2 },
      ],
      filas: movimientos.map((m) => [
        new Date(m.createdAt).toLocaleDateString('es-NI'),
        new Date(m.createdAt).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
        m.producto?.nombre || 'Producto eliminado',
        m.producto?.codigoBarras || '',
        m.tipo,
        m.cantidad,
        m.stockAnterior,
        m.stockNuevo,
        m.motivo || '',
      ]),
      totales: [`Total: ${movimientos.length}`, null, null, null, null, null, null, null, null],
      resumen: [
        { etiqueta: 'Movimientos', valor: String(movimientos.length) },
        { etiqueta: 'Entradas y devoluciones', valor: String(entradas.length) },
        { etiqueta: 'Salidas por venta', valor: String(salidas.length) },
        { etiqueta: 'Unidades vendidas', valor: String(salidas.reduce((s, m) => s + m.cantidad, 0)) },
      ],
      notas: [
        'Las devoluciones registradas desde el POS aparecen como movimiento DEVOLUCION.',
        'Este reporte solo incluye movimientos con rastro en el Kardex.',
      ],
    };
  }

  // ─── Ventas (POS + devoluciones) ───
  const ventas = await db.ventaPOS.findMany({
    where: { tiendaId, ...filtroFecha },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  const devoluciones = ventas.filter((v) => v.metodoPago === 'devolucion');
  const totalVendido = ventas.reduce((s, v) => s + v.total, 0);
  const unidades = ventas.reduce((s, v) => s + v.items.reduce((a, i) => a + i.cantidad, 0), 0);

  const porMetodo = new Map<string, number>();
  for (const v of ventas) {
    const k = (v.metodoPago || 'efectivo').toUpperCase();
    porMetodo.set(k, (porMetodo.get(k) || 0) + v.total);
  }

  return {
    tipo,
    titulo: 'Reporte de Ventas del Punto de Venta',
    periodo: etiqueta,
    descripcion: 'Comprobantes emitidos, con devoluciones incluidas como ventas negativas',
    columnas: [
      { titulo: 'Comprobante', tipo: 'texto', peso: 1.3 },
      { titulo: 'Fecha', tipo: 'texto', peso: 0.9 },
      { titulo: 'Hora', tipo: 'texto', peso: 0.7 },
      { titulo: 'Cliente', tipo: 'texto', peso: 1.8 },
      { titulo: 'Método de pago', tipo: 'texto', peso: 1.2 },
      { titulo: 'Artículos', tipo: 'entero', peso: 0.8 },
      { titulo: 'Subtotal', tipo: 'moneda', peso: 1.1 },
      { titulo: 'Descuento', tipo: 'moneda', peso: 1.1 },
      { titulo: 'Total', tipo: 'moneda', peso: 1.2 },
    ],
    filas: ventas.map((v) => [
      v.numeroComprobante,
      new Date(v.createdAt).toLocaleDateString('es-NI'),
      new Date(v.createdAt).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
      v.clienteNombre || 'Cliente General',
      v.metodoPago,
      v.items.reduce((a, i) => a + i.cantidad, 0),
      v.subtotal,
      v.descuento,
      v.total,
    ]),
    totales: [
      `Total: ${ventas.length}`,
      null,
      null,
      null,
      null,
      unidades,
      ventas.reduce((s, v) => s + v.subtotal, 0),
      ventas.reduce((s, v) => s + v.descuento, 0),
      totalVendido,
    ],
    resumen: [
      { etiqueta: 'Vendido neto', valor: dinero(totalVendido) },
      { etiqueta: 'Comprobantes', valor: String(ventas.length) },
      { etiqueta: 'Ticket promedio', valor: dinero(ventas.length ? totalVendido / ventas.length : 0) },
      {
        etiqueta: 'Forma de pago dominante',
        valor:
          [...porMetodo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
      },
    ],
    notas: [
      `Incluye ${devoluciones.length} devolución(es), restadas del total por ser ventas negativas.`,
      'El reporte refleja lo registrado en la Caja POS; no sustituye la declaración fiscal ante la DGI.',
    ],
  };
}

export const TIPOS_REPORTE: TipoReporte[] = ['ventas', 'kardex', 'inventario'];

export function nombreArchivo(marca: string, tipo: TipoReporte, extension: string): string {
  const limpio = marca
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const fecha = new Date().toISOString().slice(0, 10);
  return `Reporte-${tipo}-${limpio}-${fecha}.${extension}`;
}
