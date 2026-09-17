import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { obtenerMarcaTienda } from '@/lib/tienda/reporte-marca';
import { reunirDatosReporte, nombreArchivo, TIPOS_REPORTE, type TipoReporte } from '@/lib/tienda/reporte-datos';
import { construirXlsxReporte } from '@/lib/tienda/reporte-xlsx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/tienda/reportes/xlsx?tipo=ventas|kardex|inventario&dias=30
 *
 * Descarga el reporte como libro XLSX con la identidad de la tienda (logo, nombre,
 * color de marca) y la marca de LogiFast. `dias=0` = todo el historial.
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

    const sp = new URL(req.url).searchParams;
    const solicitado = (sp.get('tipo') || 'ventas') as TipoReporte;
    const tipo: TipoReporte = TIPOS_REPORTE.includes(solicitado) ? solicitado : 'ventas';
    const dias = Math.min(3650, Math.max(0, parseInt(sp.get('dias') || '30', 10) || 0));

    const [marca, reporte] = await Promise.all([
      obtenerMarcaTienda(tienda),
      reunirDatosReporte(tienda.id, tipo, dias),
    ]);

    const libro = await construirXlsxReporte(reporte, marca);
    const nombre = nombreArchivo(tienda.nombre, tipo, 'xlsx');

    return new NextResponse(new Uint8Array(libro), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombre}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[TIENDA_REPORTE_XLSX]', error);
    return NextResponse.json({ ok: false, error: 'No se pudo generar el reporte XLSX' }, { status: 500 });
  }
}
