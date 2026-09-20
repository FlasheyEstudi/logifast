import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { avisarRecurrente, MS_AVISO_ANTICIPADO } from '@/lib/tienda/recurrentes';

export const dynamic = 'force-dynamic';

/**
 * Cron de pedidos recurrentes (#1).
 *
 * Lo llama el microservicio realtime cada 5 minutos, autenticado con el secreto de
 * servicio (igual que el despacho de campañas).
 *
 * IMPORTANTE: este cron ya NO crea pedidos. Avisa al cliente que su pedido
 * programado llegó a la hora y lo deja pendiente de CONFIRMAR o CANCELAR; la orden
 * se crea en `POST /api/cliente/pedidos-recurrentes/confirmar`. Antes el cron
 * generaba la compra y el cobraba sin que el cliente hubiera dicho nada.
 */
export async function POST(req: NextRequest) {
  try {
    const secreto = process.env.REALTIME_SERVICE_SECRET || process.env.JWT_SECRET;
    const cabecera = req.headers.get('authorization') || '';
    const token = cabecera.replace(/^Bearer\s+/i, '');
    if (!secreto || token !== secreto) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    const ahora = new Date();

    // 1. Vencidos: llegó la hora. Se avisa (no se crea) y queda esperando respuesta.
    const vencidos = await db.pedidoRecurrente.findMany({
      where: {
        activo: true,
        pendienteAvisoEn: null,
        proximaEjecucion: { lte: ahora },
      },
      orderBy: { proximaEjecucion: 'asc' },
      take: 25,
      select: { id: true },
    });

    // 2. Próximos a vencer: se avisa un poco antes para que al cliente le dé tiempo
    //    de decidir sin que el pedido llegue tarde a la tienda.
    const proximos = await db.pedidoRecurrente.findMany({
      where: {
        activo: true,
        pendienteAvisoEn: null,
        proximaEjecucion: { gt: ahora, lte: new Date(ahora.getTime() + MS_AVISO_ANTICIPADO) },
      },
      orderBy: { proximaEjecucion: 'asc' },
      take: 25,
      select: { id: true },
    });

    const ids = Array.from(new Set([...vencidos.map((v) => v.id), ...proximos.map((p) => p.id)]));

    const resultados: { id: string; ok: boolean; motivo?: string }[] = [];
    for (const id of ids) {
      const res = await avisarRecurrente(id).catch((err) => ({ ok: false, motivo: String(err?.message || err) }));
      resultados.push({ id, ok: res.ok, motivo: res.ok ? undefined : (res as { motivo?: string }).motivo });
    }

    // 3. Avisos viejos sin respuesta: se saltan esa ejecución y se reprograman, para
    //    que un cliente que nunca contestó no acumule avisos eternos.
    const caducados = await db.pedidoRecurrente.findMany({
      where: { activo: true, pendienteAvisoEn: { not: null } },
      select: { id: true, pendienteAvisoEn: true },
    });
    const { saltarEjecucion } = await import('@/lib/tienda/recurrentes');
    let caducadosSaltados = 0;
    for (const c of caducados) {
      if (!c.pendienteAvisoEn) continue;
      if (Date.now() - c.pendienteAvisoEn.getTime() < 12 * 60 * 60 * 1000) continue;
      const rec = await db.pedidoRecurrente.findUnique({ where: { id: c.id }, select: { clienteId: true } });
      if (!rec) continue;
      await saltarEjecucion(c.id, rec.clienteId);
      caducadosSaltados++;
    }

    return NextResponse.json({
      ok: true,
      avisados: resultados.filter((r) => r.ok).length,
      procesados: resultados.length,
      sinAvisar: resultados.filter((r) => !r.ok).map((r) => ({ id: r.id, motivo: r.motivo })),
      caducadosSaltados,
    });
  } catch (err) {
    console.error('[cron/pedidos-recurrentes]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron procesar los recurrentes' }, { status: 500 });
  }
}
