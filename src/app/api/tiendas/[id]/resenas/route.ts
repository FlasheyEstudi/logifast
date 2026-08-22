import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tiendas/[id]/resenas
 * Obtiene todas las reseñas de una tienda con datos del cliente.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resenasRaw = await db.resenaTienda.findMany({
      where: { tiendaId: id },
      include: {
        cliente: {
          select: {
            id: true,
            name: true,
            fotoUrl: true,
            initials: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const resenas = resenasRaw.map((r) => ({
      id: r.id,
      tiendaId: r.tiendaId,
      clienteId: r.clienteId,
      clienteNombre: r.cliente?.name || `Cliente ${r.clienteId.slice(-4)}`,
      clienteFoto: r.cliente?.fotoUrl || null,
      clienteInitials: r.cliente?.initials || (r.cliente?.name ? r.cliente.name.slice(0, 2).toUpperCase() : 'CL'),
      clienteColor: r.cliente?.color || '#0066FF',
      estrellas: r.estrellas,
      comentario: r.comentario ?? '',
      fecha: r.createdAt.toISOString().slice(0, 10),
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, resenas });
  } catch (error) {
    return handleError(error, 'TIENDA_RESENAS_GET');
  }
}

/**
 * POST /api/tiendas/[id]/resenas
 * Agrega una nueva reseña a la tienda y recalcula la calificación promedio.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const body = await req.json();
    const { estrellas, comentario, ordenId } = body;

    const ratingNum = Math.min(5, Math.max(1, Math.round(Number(estrellas) || 5)));
    const clienteId = user?.id || body.clienteId || 'usr-demo-cliente';

    // Crear la reseña
    const nuevaResena = await db.resenaTienda.create({
      data: {
        tiendaId: id,
        clienteId,
        ordenId: ordenId || null,
        estrellas: ratingNum,
        comentario: comentario?.trim() || null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            name: true,
            fotoUrl: true,
            initials: true,
            color: true,
          },
        },
      },
    });

    // Recalcular promedio de estrellas de la tienda
    const agregadas = await db.resenaTienda.aggregate({
      where: { tiendaId: id },
      _avg: { estrellas: true },
      _count: { id: true },
    });

    const promedio = agregadas._avg.estrellas ? Number(agregadas._avg.estrellas.toFixed(1)) : ratingNum;

    await db.tienda.update({
      where: { id },
      data: {
        calificacion: promedio,
      },
    });

    return NextResponse.json({
      ok: true,
      resena: {
        id: nuevaResena.id,
        tiendaId: nuevaResena.tiendaId,
        clienteId: nuevaResena.clienteId,
        clienteNombre: nuevaResena.cliente?.name || user?.name || 'Cliente',
        clienteFoto: nuevaResena.cliente?.fotoUrl || null,
        clienteInitials: nuevaResena.cliente?.initials || 'CL',
        clienteColor: nuevaResena.cliente?.color || '#0066FF',
        estrellas: nuevaResena.estrellas,
        comentario: nuevaResena.comentario || '',
        fecha: nuevaResena.createdAt.toISOString().slice(0, 10),
        createdAt: nuevaResena.createdAt.toISOString(),
      },
      nuevaCalificacion: promedio,
    });
  } catch (error) {
    return handleError(error, 'TIENDA_RESENAS_POST');
  }
}
