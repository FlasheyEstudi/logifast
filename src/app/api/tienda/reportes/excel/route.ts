import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tienda/reportes/excel?tipo=inventario|ventas|kardex
 * Genera un reporte formateado descargable compatible con Microsoft Excel (CSV con UTF-8 BOM y delimitación limpia).
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo') || 'inventario';

    let csvContent = '';
    let filename = `Reporte_${tipo}_${Date.now()}.csv`;

    if (tipo === 'inventario') {
      const productos = await db.producto.findMany({
        where: { tiendaId: tienda.id },
        orderBy: { nombre: 'asc' },
      });

      csvContent = 'REPORTE DE INVENTARIO Y PRODUCTOS - LOGIFAST PARTNER\n';
      csvContent += `Comercio: ${tienda.nombre} | RUC: ${tienda.ruc || 'N/A'} | Fecha: ${new Date().toLocaleDateString('es-NI')}\n\n`;
      csvContent += 'ID,Nombre,Categoria,Codigo Barras,Costo (C$),Precio Venta (C$),Stock Actual,Stock Minimo,Unidad,Estado Marketplace\n';

      productos.forEach((p) => {
        const costo = p.costo || 0;
        const precio = p.precio || 0;
        const stock = p.stock ?? 0;
        const stockMin = p.stockMinimo ?? 5;
        const estadoMkt = p.disponible ? 'PUBLICADO' : 'OCULTO';

        csvContent += `"${p.id}","${p.nombre.replace(/"/g, '""')}","${p.categoriaNombre || 'General'}","${p.codigoBarras || ''}",${costo.toFixed(2)},${precio.toFixed(2)},${stock},${stockMin},"${p.unidadMedida || 'unidad'}","${estadoMkt}"\n`;
      });
    } else if (tipo === 'ventas') {
      const ventasPos = await db.ventaPOS.findMany({
        where: { tiendaId: tienda.id },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });

      csvContent = 'REPORTE DE VENTAS PUNTO DE VENTA (POS) - LOGIFAST PARTNER\n';
      csvContent += `Comercio: ${tienda.nombre} | RUC: ${tienda.ruc || 'N/A'} | Fecha: ${new Date().toLocaleDateString('es-NI')}\n\n`;
      csvContent += 'Comprobante,Fecha,Hora,Cliente,RUC Cliente,Metodo Pago,Subtotal (C$),Descuento (C$),Total (C$),Cant Items\n';

      ventasPos.forEach((v) => {
        const fecha = new Date(v.createdAt).toLocaleDateString('es-NI');
        const hora = new Date(v.createdAt).toLocaleTimeString('es-NI');
        const cantItems = v.items.reduce((acc, it) => acc + it.cantidad, 0);

        csvContent += `"${v.numeroComprobante}","${fecha}","${hora}","${(v.clienteNombre || 'Cliente General').replace(/"/g, '""')}","${v.clienteRuc || ''}","${v.metodoPago.toUpperCase()}",${v.subtotal.toFixed(2)},${v.descuento.toFixed(2)},${v.total.toFixed(2)},${cantItems}\n`;
      });
    } else if (tipo === 'kardex') {
      const kardex = await db.kardexMovimiento.findMany({
        where: { tiendaId: tienda.id },
        orderBy: { createdAt: 'desc' },
        include: { producto: true },
      });

      csvContent = 'REPORTE DE MOVIMIENTOS KARDEX INVENTARIO - LOGIFAST PARTNER\n';
      csvContent += `Comercio: ${tienda.nombre} | RUC: ${tienda.ruc || 'N/A'} | Fecha: ${new Date().toLocaleDateString('es-NI')}\n\n`;
      csvContent += 'Fecha,Hora,Producto,Codigo Barras,Tipo Movimiento,Cantidad,Stock Anterior,Stock Nuevo,Costo Unit,Motivo\n';

      kardex.forEach((k) => {
        const fecha = new Date(k.createdAt).toLocaleDateString('es-NI');
        const hora = new Date(k.createdAt).toLocaleTimeString('es-NI');
        const prodNombre = k.producto?.nombre || 'Producto';
        const cb = k.producto?.codigoBarras || '';

        csvContent += `"${fecha}","${hora}","${prodNombre.replace(/"/g, '""')}","${cb}","${k.tipo}",${k.cantidad},${k.stockAnterior},${k.stockNuevo},${(k.costoUnitario || 0).toFixed(2)},"${(k.motivo || '').replace(/"/g, '""')}"\n`;
      });
    }

    // Agregar UTF-8 BOM para que Microsoft Excel abra caracteres especiales (acentos, ñ) perfectamente
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const responseBuffer = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);

    return new NextResponse(responseBuffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[TIENDA_REPORTES_EXCEL_ERROR]', error);
    return NextResponse.json({ ok: false, error: 'Error al generar reporte Excel' }, { status: 500 });
  }
}
