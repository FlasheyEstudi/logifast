import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { calcularProximaEjecucion } from '@/lib/tienda/recurrentes';

export const dynamic = 'force-dynamic';

const DIAS_VALIDOS = [0, 1, 2, 3, 4, 5, 6];

/**
 * #1 — Pedidos recurrentes del cliente.
 *
 * GET    /api/cliente/pedidos-recurrentes        — lista los del cliente
 * POST   /api/cliente/pedidos-recurrentes        — programa uno nuevo
 * PATCH  /api/cliente/pedidos-recurrentes        — pausa / reanuda / cambia hora y días
 * DELETE /api/cliente/pedidos-recurrentes?id=…   — cancela
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const recurrentes = await db.pedidoRecurrente.findMany({
      where: { clienteId: user.id },
      orderBy: { creadoEn: 'desc' },
      include: { tienda: { select: { nombre: true } } },
    });

    return NextResponse.json({
      ok: true,
      recurrentes: recurrentes.map((r) => ({
        id: r.id,
        tiendaNombre: r.tienda?.nombre || '',
        frecuencia: r.frecuencia,
        diasSemana: r.diasSemana,
        hora: r.hora,
        direccionEntrega: r.direccionEntrega,
        activo: r.activo,
        proximaEjecucion: r.proximaEjecucion,
        ultimaEjecucion: r.ultimaEjecucion,
        items: r.items,
      })),
    });
  } catch (err) {
    console.error('[cliente/pedidos-recurrentes GET]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar tus pedidos programados' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'cliente') {
      return NextResponse.json({ ok: false, error: 'Se requiere sesión de cliente' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      tiendaId,
      items,
      direccionEntrega,
      lat = 0,
      lng = 0,
      metodoPago = 'efectivo',
      frecuencia = 'semanal',
      diasSemana = [],
      hora = '10:00',
    } = body as Record<string, unknown>;

    if (!tiendaId || !Array.isArray(items) || items.length === 0 || !direccionEntrega) {
      return NextResponse.json(
        { ok: false, error: 'Faltan datos: tiendaId, items y dirección de entrega' },
        { status: 400 }
      );
    }

    const tienda = await db.tienda.findUnique({ where: { id: String(tiendaId) }, select: { id: true } });
    if (!tienda) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });

    const dias = (Array.isArray(diasSemana) ? diasSemana : [])
      .map((n) => Number(n))
      .filter((n) => DIAS_VALIDOS.includes(n));

    if (!/^\d{1,2}:\d{2}$/.test(String(hora))) {
      return NextResponse.json({ ok: false, error: 'Hora inválida (formato HH:MM)' }, { status: 400 });
    }

    const limpios = (items as { productoId?: string; cantidad?: number }[])
      .map((i) => ({ productoId: String(i?.productoId ?? ''), cantidad: Math.max(1, Math.floor(Number(i?.cantidad) || 1)) }))
      .filter((i) => i.productoId);
    if (limpios.length === 0) {
      return NextResponse.json({ ok: false, error: 'El carrito programado está vacío' }, { status: 400 });
    }

    const proxima = calcularProximaEjecucion(dias, String(hora));

    const recurrente = await db.pedidoRecurrente.create({
      data: {
        clienteId: user.id,
        tiendaId: tienda.id,
        frecuencia: ['diario', 'semanal', 'quincenal', 'mensual'].includes(String(frecuencia)) ? String(frecuencia) : 'semanal',
        diasSemana: JSON.stringify(dias),
        hora: String(hora),
        items: JSON.stringify(limpios),
        direccionEntrega: String(direccionEntrega).slice(0, 200),
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        metodoPago: String(metodoPago),
        activo: true,
        proximaEjecucion: proxima,
      },
      select: { id: true, proximaEjecucion: true },
    });

    return NextResponse.json({ ok: true, recurrente });
  } catch (err) {
    console.error('[cliente/pedidos-recurrentes POST]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo programar el pedido' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { id, activo, hora, diasSemana } = body as Record<string, unknown>;
    if (!id) return NextResponse.json({ ok: false, error: 'Falta el id' }, { status: 400 });

    const existente = await db.pedidoRecurrente.findFirst({ where: { id: String(id), clienteId: user.id } });
    if (!existente) return NextResponse.json({ ok: false, error: 'Pedido programado no encontrado' }, { status: 404 });

    const datos: Record<string, unknown> = {};
    if (typeof activo === 'boolean') datos.activo = activo;

    if (hora !== undefined) {
      if (!/^\d{1,2}:\d{2}$/.test(String(hora))) {
        return NextResponse.json({ ok: false, error: 'Hora inválida (formato HH:MM)' }, { status: 400 });
      }
      datos.hora = String(hora);
    }
    if (Array.isArray(diasSemana)) {
      datos.diasSemana = JSON.stringify(
        diasSemana.map((n) => Number(n)).filter((n) => DIAS_VALIDOS.includes(n))
      );
    }

    // Al reactivar se recalcula la próxima ejecución para que no dispare de inmediato.
    if (datos.activo === true || datos.hora || datos.diasSemana) {
      const horas = String(datos.hora ?? existente.hora);
      const crudoDias = datos.diasSemana ? JSON.parse(String(datos.diasSemana)) : JSON.parse(existente.diasSemana);
      datos.proximaEjecucion = calcularProximaEjecucion(Array.isArray(crudoDias) ? crudoDias : [], horas);
    }

    const actualizado = await db.pedidoRecurrente.update({
      where: { id: existente.id },
      data: datos,
      select: { id: true, activo: true, hora: true, proximaEjecucion: true },
    });

    return NextResponse.json({ ok: true, recurrente: actualizado });
  } catch (err) {
    console.error('[cliente/pedidos-recurrentes PATCH]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo actualizar el pedido programado' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ ok: false, error: 'Falta el id' }, { status: 400 });

    const borrado = await db.pedidoRecurrente.deleteMany({ where: { id, clienteId: user.id } });
    if (borrado.count === 0) {
      return NextResponse.json({ ok: false, error: 'Pedido programado no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cliente/pedidos-recurrentes DELETE]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo cancelar el pedido programado' }, { status: 500 });
  }
}
