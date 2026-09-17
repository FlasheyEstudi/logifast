import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { resolverAccesoTienda } from '@/lib/auth/tienda-acceso';

export const dynamic = 'force-dynamic';

/**
 * #8 — Pauta: la tienda contrata un banner en el inicio de la app.
 *
 * GET  /api/tienda/banners — los banners contratados, con impresiones y clics
 * POST /api/tienda/banners — contrata uno nuevo (queda con tiendaId, tarifa y vigencia)
 *
 * Se muestra por el sistema de banners que ya existe, que respeta `programadoDesde` /
 * `programadoHasta` y cuenta impresiones y clics.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const acceso = await resolverAccesoTienda(user);
    if (!acceso) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });

    const banners = await db.banner.findMany({
      where: { tiendaId: acceso.tiendaId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        titulo: true,
        subtitulo: true,
        colorFondo: true,
        botonTexto: true,
        botonLink: true,
        estado: true,
        impresiones: true,
        clicks: true,
        precioMensual: true,
        pagado: true,
        programadoDesde: true,
        programadoHasta: true,
        contratadoHasta: true,
      },
    });

    return NextResponse.json({ ok: true, banners });
  } catch (err) {
    console.error('[tienda/banners GET]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar tus anuncios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const acceso = await resolverAccesoTienda(user);
    if (!acceso) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const {
      titulo,
      subtitulo,
      colorFondo = '#0066FF',
      botonTexto,
      botonLink,
      dias = 15,
      precioMensual = 0,
    } = body as Record<string, unknown>;

    const tituloLimpio = String(titulo ?? '').trim().slice(0, 60);
    if (tituloLimpio.length < 3) {
      return NextResponse.json({ ok: false, error: 'El título del anuncio es obligatorio' }, { status: 400 });
    }

    const color = /^#[0-9a-fA-F]{6}$/.test(String(colorFondo)) ? String(colorFondo).toUpperCase() : '#0066FF';
    const vigenciaDias = Math.min(180, Math.max(1, parseInt(String(dias), 10) || 15));
    const ahora = new Date();
    const hasta = new Date(ahora.getTime() + vigenciaDias * 86400000);

    const banner = await db.banner.create({
      data: {
        titulo: tituloLimpio,
        subtitulo: subtitulo ? String(subtitulo).slice(0, 120) : null,
        tipo: 'pauta',
        colorFondo: color,
        botonTexto: botonTexto ? String(botonTexto).slice(0, 30) : null,
        botonLink: botonLink ? String(botonLink).slice(0, 200) : null,
        accionTipo: botonLink ? 'link' : 'ninguna',
        accionValor: botonLink ? String(botonLink).slice(0, 200) : null,
        segmento: 'todos',
        mostrarEn: 'app',
        posicion: 0,
        estado: 'activo',
        programadoDesde: ahora,
        programadoHasta: hasta,
        contratadoHasta: hasta,
        precioMensual: Number(precioMensual) > 0 ? Number(precioMensual) : null,
        pagado: false,
        creadoPor: user.id,
        tiendaId: acceso.tiendaId,
      },
      select: { id: true, titulo: true, programadoHasta: true, estado: true },
    });

    return NextResponse.json({ ok: true, banner });
  } catch (err) {
    console.error('[tienda/banners POST]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo contratar el anuncio' }, { status: 500 });
  }
}
