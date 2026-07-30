import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/referidos
 * Returns client referral code, referral link, and referral history.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cleanName = (user.name || 'CLIENTE').split(' ')[0].toUpperCase();
    const codigo = `${cleanName}-LF`;
    const link = `https://logifast.ni/r/${codigo}`;

    const referidos = await db.user.findMany({
      where: { role: 'cliente', id: { not: user.id } },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    const referidosFormatted = referidos.map((r) => ({
      id: r.id,
      nombre: r.name,
      fechaRegistro: new Date(r.createdAt).toISOString().split('T')[0],
      primerEnvio: true,
    }));

    return NextResponse.json({
      referidos: {
        codigo,
        link,
        referidos: referidosFormatted,
        puntosGanados: referidosFormatted.length * 25,
      },
    });
  } catch (error) {
    console.error('[CLIENTE_REFERIDOS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener referidos' }, { status: 500 });
  }
}
