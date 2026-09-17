import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError, ok } from '@/lib/auth/helpers';
import { enviarCampana } from '@/lib/campanas-sender';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/campanas/procesar
 *
 * Despacha las campañas programadas cuya hora ya venció.
 * Antes no existía ningún planificador: una campaña "Programada" se quedaba
 * en ese estado para siempre y nunca se enviaba a nadie.
 *
 * Es idempotente: solo toma campañas en estado 'programada' con fecha <= ahora,
 * y `enviarCampana` las pasa a 'enviada' (con métricas reales) al terminar.
 * Se invoca al abrir el módulo de Marketing, así que no requiere infraestructura
 * de cron. Para un envío puntual sin abrir el panel, se puede programar un cron
 * que haga POST a esta ruta con la cookie de un administrador.
 */
export async function POST() {
  try {
    await requireRole('admin');

    const pendientes = await db.campana.findMany({
      where: { estado: 'programada', programadaPara: { lte: new Date() } },
      select: { id: true, titulo: true },
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

    return ok({ procesadas: resultados.length, resultados });
  } catch (error) {
    return handleError(error, 'CAMPANAS_PROCESAR');
  }
}
