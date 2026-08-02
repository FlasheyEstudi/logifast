import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tiendas/[id]
 * Devuelve una tienda con sus reseñas.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const t = await db.tienda.findUnique({
      where: { id },
      include: { resenas: true },
    });

    if (!t) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    let horario: Record<string, { abre: string; cierra: string }> = {};
    try { horario = JSON.parse(t.horario); } catch {}
    let zonaCobertura: string[] = [];
    try { zonaCobertura = JSON.parse(t.zonaCobertura); } catch {}

    const badges: string[] = [];
    if (t.popular) badges.push('Popular');
    if (t.verificado) badges.push('Verificado');

    const resenas = t.resenas.map((r) => ({
      id: r.id,
      tiendaId: r.tiendaId,
      clienteNombre: `Cliente ${r.clienteId.slice(-4)}`,
      estrellas: r.estrellas,
      comentario: r.comentario ?? '',
      fecha: r.createdAt.toISOString().slice(0, 10),
    }));

    return NextResponse.json({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion ?? '',
      categoria: t.categoria,
      logoColor: t.logoColor,
      logoIniciales: t.logoIniciales,
      portadaColor: t.portadaColor,
      direccion: t.direccion,
      lat: t.lat,
      lng: t.lng,
      telefono: t.telefono ?? '',
      email: t.email ?? '',
      calificacion: t.calificacion,
      totalPedidos: t.totalPedidos,
      tiempoEstimado: t.tiempoEstimado,
      costoEnvio: t.costoEnvio,
      pedidoMinimo: t.pedidoMinimo,
      horario,
      zonaCobertura,
      verificado: t.verificado,
      popular: t.popular,
      estado: t.estado,
      badges,
      resenas,
    });
  } catch (error) {
    console.error('Error fetching tienda:', error);
    return NextResponse.json(
      { error: 'Error al obtener la tienda' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tiendas/[id]
 * Actualiza una tienda con validación estricta de ownership y campos admin-only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const existing = await db.tienda.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin';
    const isOwner = existing.duenoId === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado para editar esta tienda' }, { status: 403 });
    }

    const body = await req.json();

    const data: Record<string, unknown> = {};
    const allowedStandard = ['nombre', 'descripcion', 'categoria', 'logoColor', 'logoIniciales', 'portadaColor', 'direccion', 'telefono', 'email', 'tiempoEstimado'];
    const allowedAdminOnly = ['verificado', 'popular', 'estado'];

    for (const key of allowedStandard) {
      if (key in body) data[key] = body[key];
    }

    if (isAdmin) {
      for (const key of allowedAdminOnly) {
        if (key in body) data[key] = body[key];
      }
    }

    if ('lat' in body) data.lat = Number(body.lat);
    if ('lng' in body) data.lng = Number(body.lng);
    if ('costoEnvio' in body) data.costoEnvio = Number(body.costoEnvio);
    if ('pedidoMinimo' in body) data.pedidoMinimo = Number(body.pedidoMinimo);
    if ('horario' in body) data.horario = JSON.stringify(body.horario);
    if ('zonaCobertura' in body) data.zonaCobertura = JSON.stringify(body.zonaCobertura);

    const tienda = await db.tienda.update({ where: { id }, data });
    return NextResponse.json({ tienda });
  } catch (error) {
    return handleError(error, 'TIENDA_PATCH');
  }
}

/**
 * DELETE /api/tiendas/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const existing = await db.tienda.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    if (existing.duenoId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado para eliminar esta tienda' }, { status: 403 });
    }

    await db.tienda.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error, 'TIENDA_DELETE');
  }
}
