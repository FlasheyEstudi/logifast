import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enviarCampana } from '@/lib/campanas-sender';

export const dynamic = 'force-dynamic';

/**
 * Despacho automático de campañas programadas.
 *
 * Antes no existía ningún planificador: una campaña "Programada" se quedaba así
 * para siempre. Este endpoint lo invoca el microservicio realtime (Railway) cada
 * 5 minutos, así que las campañas salen aunque nadie tenga el panel abierto.
 *
 * Seguridad: se autentica con el secreto de servicio (el mismo que usa /api/emit),
 * no con sesión de administrador, porque lo llama una máquina.
 *   Authorization: Bearer <REALTIME_SERVICE_SECRET>
 */
function autorizado(req: NextRequest): boolean {
  const secret =
    process.env.REALTIME_SERVICE_SECRET || process.env.JWT_SECRET || 'logifast-dev-secret';
  const auth = req.headers.get('authorization') || req.headers.get('x-service-key') || '';
  return auth === secret || auth === `Bearer ${secret}`;
}

async function procesar() {
  const pendientes = await db.campana.findMany({
    where: { estado: 'programada', programadaPara: { lte: new Date() } },
    select: { id: true, titulo: true, programadaPara: true },
    orderBy: { programadaPara: 'asc' },
    take: 25,
  });

  const resultados: Array<Record<string, unknown>> = [];
  for (const c of pendientes) {
    try {
      resultados.push({ ...(await enviarCampana(c.id)) });
    } catch (e: any) {
      resultados.push({ campanaId: c.id, titulo: c.titulo, error: e?.message || 'Error al enviar' });
    }
  }

  return { ok: true, procesadas: resultados.length, resultados };
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    return NextResponse.json(await procesar());
  } catch (error: any) {
    console.error('[CRON_CAMPANAS]', error);
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
  }
}

/** Alias GET para planificadores externos que solo hacen GET. */
export async function GET(req: NextRequest) {
  return POST(req);
}
