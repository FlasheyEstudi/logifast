import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ejecutarRecurrente } from '@/lib/tienda/recurrentes';

export const dynamic = 'force-dynamic';

/**
 * Cron de pedidos recurrentes (#1).
 *
 * Lo llama el microservicio realtime cada 5 minutos, autenticado con el secreto de
 * servicio (igual que el despacho de campañas). Toma los recurrentes vencidos y crea
 * sus órdenes.
 */
export async function POST(req: NextRequest) {
  try {
    const secreto = process.env.REALTIME_SERVICE_SECRET || process.env.JWT_SECRET;
    const cabecera = req.headers.get('authorization') || '';
    const token = cabecera.replace(/^Bearer\s+/i, '');
    if (!secreto || token !== secreto) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const vencidos = await db.pedidoRecurrente.findMany({
      where: { activo: true, proximaEjecucion: { lte: new Date() } },
      orderBy: { proximaEjecucion: 'asc' },
      take: 25,
      select: { id: true },
    });

    const resultados: { id: string; ok: boolean; ordenId?: string; error?: string }[] = [];
    for (const r of vencidos) {
      const res = await ejecutarRecurrente(r.id).catch((err) => ({
        ok: false as const,
        ordenId: undefined,
        error: String(err?.message || err),
        avisos: [],
      }));
      resultados.push({ id: r.id, ok: res.ok, ordenId: res.ordenId, error: res.error });
    }

    return NextResponse.json({
      ok: true,
      procesados: resultados.length,
      creadas: resultados.filter((r) => r.ok).length,
      resultados,
    });
  } catch (err) {
    console.error('[cron/pedidos-recurrentes]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron procesar los recurrentes' }, { status: 500 });
  }
}
