import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

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
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const productoId = String(body.productoId);
    const estrellas = Number(body.estrellas);
    const comentario = body.comentario ? String(body.comentario) : null;
    const ordenId = body.ordenId ? String(body.ordenId) : null;

    if (!productoId || !estrellas || estrellas < 1 || estrellas > 5) {
      return NextResponse.json({ error: 'productoId y estrellas (1-5) requeridos' }, { status: 400 });
    }

    const valoracion = await db.valoracionProducto.upsert({
      where: { productoId_clienteId: { productoId, clienteId: user.id } },
      update: { estrellas, comentario },
      create: { productoId, clienteId: user.id, estrellas, comentario, ordenId },
    });

    return NextResponse.json({ ok: true, valoracion });
  } catch (error) {
    console.error('[VALORACIONES_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
