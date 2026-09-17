import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { buscarTiendaCompleta } from '@/lib/auth/tienda-acceso';
import { obtenerMarcaTienda } from '@/lib/tienda/reporte-marca';
import { reunirDatosReporte, nombreArchivo, TIPOS_REPORTE, type TipoReporte } from '@/lib/tienda/reporte-datos';
import { construirPdfReporte } from '@/lib/tienda/reporte-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/tienda/reportes/pdf?tipo=ventas|kardex|inventario&dias=30
 *
 * Mismo contenido que el XLSX, en PDF con la identidad de la tienda y la marca de
 * LogiFast. `dias=0` = todo el historial.
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

    const sp = new URL(req.url).searchParams;
    const solicitado = (sp.get('tipo') || 'ventas') as TipoReporte;
    const tipo: TipoReporte = TIPOS_REPORTE.includes(solicitado) ? solicitado : 'ventas';
    const dias = Math.min(3650, Math.max(0, parseInt(sp.get('dias') || '30', 10) || 0));

    const [marca, reporte] = await Promise.all([
      obtenerMarcaTienda(tienda),
      reunirDatosReporte(tienda.id, tipo, dias),
    ]);

    const pdf = await construirPdfReporte(reporte, marca);
    const nombre = nombreArchivo(tienda.nombre, tipo, 'pdf');

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombre}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[TIENDA_REPORTE_PDF]', error);
    return NextResponse.json({ ok: false, error: 'No se pudo generar el reporte PDF' }, { status: 500 });
  }
}
