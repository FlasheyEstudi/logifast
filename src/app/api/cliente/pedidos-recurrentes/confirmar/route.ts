import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { calcularApertura } from '@/lib/tienda/horarios';
import { ejecutarRecurrente, saltarEjecucion } from '@/lib/tienda/recurrentes';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/pedidos-recurrentes/confirmar
 * Body: { id, accion: 'confirmar' | 'cancelar' }
 *
 * Cierra la ejecución que el cron dejó pendiente:
 *  - `confirmar` crea la orden AHORA (precio del día, stock descontado) y reprograma.
 *  - `cancelar` salta esta vez y reprograma la siguiente, sin desactivar la regla.
 *
 * Solo el dueño del recurrente puede decidir; el backend vuelve a comprobar que la
 * tienda esté abierta antes de crear nada.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? '').trim();
    const accion = String(body?.accion ?? '').trim();

    if (!id) return NextResponse.json({ ok: false, error: 'Falta el id' }, { status: 400 });
    if (accion !== 'confirmar' && accion !== 'cancelar') {
      return NextResponse.json({ ok: false, error: 'Acción inválida (confirmar|cancelar)' }, { status: 400 });
    }

    const rec = await db.pedidoRecurrente.findUnique({
      where: { id },
      include: { tienda: { select: { id: true, nombre: true, horario: true, estado: true } } },
    });
    if (!rec || rec.clienteId !== user.id) {
      return NextResponse.json({ ok: false, error: 'Pedido programado no encontrado' }, { status: 404 });
    }

    if (accion === 'cancelar') {
      const res = await saltarEjecucion(rec.id, user.id);
      return NextResponse.json({
        ok: true,
        accion: 'cancelar',
        message: 'Se saltó esta ejecución. Tu programación sigue activa.',
        proximaEjecucion: res.proximaEjecucion,
      });
    }

    // Confirmar: la tienda debe estar abierta AHORA (el cron ya lo comprobó al
    // avisar, pero el cliente puede tardar media hora en contestar).
    if (rec.tienda.estado !== 'activo') {
      return NextResponse.json(
        { ok: false, error: `${rec.tienda.nombre} no está recibiendo pedidos por ahora.`, codigo: 'TIENDA_CERRADA' },
        { status: 409 }
      );
    }
    const apertura = calcularApertura(rec.tienda.horario);
    if (!apertura.abierto) {
      return NextResponse.json(
        {
          ok: false,
          error: `${rec.tienda.nombre} está cerrada. ${apertura.texto}.`,
          codigo: 'TIENDA_CERRADA',
          proximaApertura: apertura.proximaApertura,
        },
        { status: 409 }
      );
    }

    // Idempotencia: si ya se creó la orden de esta ejecución, no se crea otra.
    if (rec.ultimaEjecucion && rec.pendientePara && rec.ultimaEjecucion >= rec.pendientePara) {
      return NextResponse.json({ ok: true, accion: 'confirmar', yaEjecutado: true });
    }

    const res = await ejecutarRecurrente(rec.id);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error || 'No se pudo crear el pedido' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      accion: 'confirmar',
      ordenId: res.ordenId,
      avisos: res.avisos,
      message: 'Pedido generado. Ya está en la tienda.',
    });
  } catch (err) {
    console.error('[pedidos-recurrentes/confirmar]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo procesar la confirmación' }, { status: 500 });
  }
}
