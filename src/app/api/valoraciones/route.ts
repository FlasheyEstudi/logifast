import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  productoId: z.string().min(1, 'productoId requerido'),
  estrellas: z.number().int().min(1, 'Mínimo 1 estrella').max(5, 'Máximo 5 estrellas'),
  comentario: z.string().max(1000, 'Comentario demasiado largo').optional().nullable(),
  ordenId: z.string().optional().nullable(),
});

/**
 * GET /api/valoraciones?productoId=
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get('productoId');

    if (productoId) {
      const [valoraciones, total, suma] = await Promise.all([
        db.valoracionProducto.findMany({
          where: { productoId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        db.valoracionProducto.count({ where: { productoId } }),
        db.valoracionProducto.aggregate({ where: { productoId }, _sum: { estrellas: true } }),
      ]);

      const promedio = total > 0 ? (suma._sum.estrellas ?? 0) / total : 0;
      const distribucion = [5, 4, 3, 2, 1].map((e) => ({
        estrellas: e,
        total: valoraciones.filter((v) => v.estrellas === e).length,
      }));

      const user = await getSessionUser();
      const mia = user
        ? await db.valoracionProducto.findUnique({
            where: { productoId_clienteId: { productoId, clienteId: user.id } },
          })
        : null;

      return NextResponse.json({
        valoraciones,
        total,
        promedio: Math.round(promedio * 10) / 10,
        distribucion,
        mia: mia ? { estrellas: mia.estrellas, comentario: mia.comentario } : null,
      });
    }

    return NextResponse.json({ error: 'productoId requerido' }, { status: 400 });
  } catch (error) {
    console.error('[VALORACIONES_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/valoraciones
 * Body: { productoId, estrellas, comentario?, ordenId? }
 * P1: Valida que el cliente haya comprado el producto antes de permitir calificar.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (user.role !== 'cliente' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los clientes pueden calificar' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { productoId, estrellas, comentario, ordenId } = parsed.data;

    // Validar que el producto existe
    const producto = await db.producto.findUnique({
      where: { id: productoId },
      select: { id: true, nombre: true },
    });
    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // P1: Validar que el cliente haya comprado el producto (al menos una orden entregada)
    if (user.role === 'cliente') {
      const compra = await db.itemOrdenCompra.findFirst({
        where: {
          productoId,
          orden: {
            clienteId: user.id,
            estado: { in: ['entregado', 'en_camino'] },
          },
        },
      });
      if (!compra) {
        return NextResponse.json(
          { error: 'Solo puedes calificar productos que hayas comprado' },
          { status: 403 }
        );
      }
    }

    const valoracion = await db.valoracionProducto.upsert({
      where: { productoId_clienteId: { productoId, clienteId: user.id } },
      update: { estrellas, comentario, ordenId: ordenId ?? null },
      create: { productoId, clienteId: user.id, estrellas, comentario, ordenId: ordenId ?? null },
    });

    return NextResponse.json({ ok: true, valoracion });
  } catch (error) {
    console.error('[VALORACIONES_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
