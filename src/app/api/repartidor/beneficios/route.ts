import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * #9 — Beneficios para el repartidor.
 *
 * GET  /api/repartidor/beneficios — alianzas activas de los comercios + cuáles ya canjeó
 * POST /api/repartidor/beneficios — registra el canje (queda el rastro en BeneficioRedimido)
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const perfil = await db.repartidorProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!perfil) return NextResponse.json({ ok: false, error: 'Perfil de repartidor no encontrado' }, { status: 404 });

    const ahora = new Date();
    const beneficios = await db.alianzaBeneficio.findMany({
      where: {
        activo: true,
        tienda: { estado: 'activo' },
        OR: [{ vigenciaFin: null }, { vigenciaFin: { gte: ahora } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        tienda: { select: { nombre: true, logoIniciales: true, logoColor: true, direccion: true } },
        canjes: { where: { repartidorId: perfil.id }, select: { id: true, usadoEn: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      beneficios: beneficios.map((b) => ({
        id: b.id,
        titulo: b.titulo,
        descripcion: b.descripcion,
        tipo: b.tipo,
        valor: b.valor,
        condiciones: b.condiciones,
        vigenciaFin: b.vigenciaFin,
        tienda: b.tienda,
        canjeado: b.canjes.length > 0,
        canjeadoEn: b.canjes[0]?.usadoEn ?? null,
      })),
    });
  } catch (err) {
    console.error('[repartidor/beneficios GET]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los beneficios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const perfil = await db.repartidorProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!perfil) return NextResponse.json({ ok: false, error: 'Perfil de repartidor no encontrado' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const { beneficioId, notas } = body as { beneficioId?: string; notas?: string };
    if (!beneficioId) return NextResponse.json({ ok: false, error: 'Falta el beneficio' }, { status: 400 });

    const beneficio = await db.alianzaBeneficio.findUnique({ where: { id: beneficioId } });
    if (!beneficio || !beneficio.activo) {
      return NextResponse.json({ ok: false, error: 'Ese beneficio ya no está disponible' }, { status: 404 });
    }
    if (beneficio.vigenciaFin && beneficio.vigenciaFin < new Date()) {
      return NextResponse.json({ ok: false, error: 'Ese beneficio está vencido' }, { status: 400 });
    }

    const yaCanjeado = await db.beneficioRedimido.findFirst({
      where: { beneficioId: beneficio.id, repartidorId: perfil.id },
      select: { id: true, usadoEn: true },
    });
    if (yaCanjeado) {
      return NextResponse.json(
        { ok: false, error: `Ya canjeaste este beneficio el ${yaCanjeado.usadoEn.toLocaleDateString('es-NI')}` },
        { status: 409 }
      );
    }

    const canje = await db.beneficioRedimido.create({
      data: {
        beneficioId: beneficio.id,
        tiendaId: beneficio.tiendaId,
        repartidorId: perfil.id,
        notas: notas ? String(notas).slice(0, 200) : null,
      },
      select: { id: true, usadoEn: true },
    });

    return NextResponse.json({ ok: true, canje, beneficio: { titulo: beneficio.titulo, valor: beneficio.valor } });
  } catch (err) {
    console.error('[repartidor/beneficios POST]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo registrar el canje' }, { status: 500 });
  }
}
