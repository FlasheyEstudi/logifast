import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketing
 * Fetches all marketing assets: banners, codigos, and feed items.
 */
export async function GET() {
  try {
    const [banners, codigos, feedItems] = await Promise.all([
      db.banner.findMany({ orderBy: { posicion: 'asc' } }),
      db.codigoPromocional.findMany({ orderBy: { createdAt: 'desc' } }),
      db.feedItem.findMany({ orderBy: { posicion: 'asc' } }),
    ]);

    return NextResponse.json({ banners, codigos, feedItems });
  } catch (error) {
    console.error('[ADMIN_MARKETING_GET]', error);
    return NextResponse.json({ error: 'Error al obtener datos de marketing' }, { status: 500 });
  }
}

/**
 * POST /api/admin/marketing
 * Creates a banner, promo code, or feed item.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { target, payload } = body;

    if (target === 'banner') {
      const { titulo, subtitulo, tipo = 'promo_grande', colorFondo, imagenUrl, botonTexto } = payload;
      const banner = await db.banner.create({
        data: {
          titulo: String(titulo),
          subtitulo: subtitulo ? String(subtitulo) : null,
          tipo: String(tipo),
          colorFondo: colorFondo || '#FF5722',
          imagenUrl: imagenUrl || null,
          botonTexto: botonTexto || null,
          creadoPor: sessionUser?.name || 'admin',
        },
      });
      return NextResponse.json({ banner });
    }

    if (target === 'codigo') {
      const { codigo, tipoDescuento = 'porcentaje', valor, segmento = 'todos', maxUsos = 0 } = payload;
      const promo = await db.codigoPromocional.create({
        data: {
          codigo: String(codigo).toUpperCase(),
          tipoDescuento: String(tipoDescuento),
          valor: Number(valor) || 0,
          aplicableA: 'todos',
          segmento: String(segmento),
          maxUsos: Number(maxUsos) || 0,
          vigenciaInicio: new Date(),
          vigenciaFin: new Date(Date.now() + 30 * 86400000),
          creadoPor: sessionUser?.name || 'admin',
        },
      });
      return NextResponse.json({ codigo: promo });
    }

    if (target === 'feedItem') {
      const { titulo, descripcion, tipo = 'anuncio', icono, botonTexto, codigoPromo } = payload;
      const item = await db.feedItem.create({
        data: {
          titulo: String(titulo),
          descripcion: String(descripcion),
          tipo: String(tipo),
          icono: icono || null,
          botonTexto: botonTexto || null,
          codigoPromo: codigoPromo || null,
          creadoPor: sessionUser?.name || 'admin',
        },
      });
      return NextResponse.json({ feedItem: item });
    }

    return NextResponse.json({ error: 'Target de marketing inválido' }, { status: 400 });
  } catch (error) {
    console.error('[ADMIN_MARKETING_POST]', error);
    return NextResponse.json({ error: 'Error al crear activo de marketing' }, { status: 500 });
  }
}
