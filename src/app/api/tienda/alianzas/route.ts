import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { resolverAccesoTienda } from '@/lib/auth/tienda-acceso';

export const dynamic = 'force-dynamic';

/**
 * #9 — Alianzas: beneficios que la tienda ofrece a los repartidores.
 *
 * GET  /api/tienda/alianzas — lista las alianzas de la tienda con sus canjes
 * POST /api/tienda/alianzas — crea una alianza (beneficio) para los repartidores
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const acceso = await resolverAccesoTienda(user);
    if (!acceso) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });

    const alianzas = await db.alianzaBeneficio.findMany({
      where: { tiendaId: acceso.tiendaId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { canjes: true } } },
    });

    return NextResponse.json({
      ok: true,
      alianzas: alianzas.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        descripcion: a.descripcion,
        tipo: a.tipo,
        valor: a.valor,
        condiciones: a.condiciones,
        vigenciaFin: a.vigenciaFin,
        activo: a.activo,
        canjes: a._count.canjes,
      })),
    });
  } catch (err) {
    console.error('[tienda/alianzas GET]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar las alianzas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const acceso = await resolverAccesoTienda(user);
    if (!acceso) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const { titulo, descripcion, tipo = 'descuento', valor, condiciones, vigenciaDias = 0 } = body as Record<string, unknown>;

    const tituloLimpio = String(titulo ?? '').trim().slice(0, 80);
    if (tituloLimpio.length < 3) {
      return NextResponse.json({ ok: false, error: 'El título del beneficio es obligatorio' }, { status: 400 });
    }

    const tiposValidos = ['descuento', 'regalo', 'combo', 'otro'];
    const tipoLimpio = tiposValidos.includes(String(tipo)) ? String(tipo) : 'descuento';
    const dias = Math.min(365, Math.max(0, parseInt(String(vigenciaDias), 10) || 0));

    const alianza = await db.alianzaBeneficio.create({
      data: {
        tiendaId: acceso.tiendaId,
        titulo: tituloLimpio,
        descripcion: descripcion ? String(descripcion).slice(0, 300) : null,
        tipo: tipoLimpio,
        valor: valor ? String(valor).slice(0, 60) : null,
        condiciones: condiciones ? String(condiciones).slice(0, 300) : null,
        vigenciaInicio: new Date(),
        vigenciaFin: dias > 0 ? new Date(Date.now() + dias * 86400000) : null,
        activo: true,
        creadoPor: user.id,
      },
      select: { id: true, titulo: true, tipo: true, valor: true, vigenciaFin: true },
    });

    return NextResponse.json({ ok: true, alianza });
  } catch (err) {
    console.error('[tienda/alianzas POST]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo crear la alianza' }, { status: 500 });
  }
}
