import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * Cupones propios de la tienda (#6).
 *
 * GET  /api/tienda/cupones  — lista los cupones creados por esta tienda
 * POST /api/tienda/cupones  — crea uno nuevo, atado a la tienda (`tiendaId`)
 *
 * Un cupón con `tiendaId` **solo aplica a los productos de esa tienda**: lo impone
 * el motor único (`src/lib/cupones.ts`), que es el mismo que usa el cobro real.
 * Los cupones globales de LogiFast (tiendaId null) siguen funcionando igual.
 */

const MAX_VALOR = 100000;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });

    const cupones = await db.codigoPromocional.findMany({
      where: { tiendaId: tienda.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        codigo: true,
        tipoDescuento: true,
        valor: true,
        montoMinimo: true,
        descuentoMaximo: true,
        maxUsos: true,
        usosActuales: true,
        vigenciaInicio: true,
        vigenciaFin: true,
        estado: true,
      },
    });

    return NextResponse.json({ ok: true, cupones });
  } catch (err) {
    console.error('[tienda/cupones GET]', err);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los cupones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const {
      codigo,
      tipoDescuento = 'porcentaje',
      valor,
      montoMinimo = 0,
      descuentoMaximo = 0,
      vigenciaDias = 30,
      maxUsos = 0,
      soloPrimerPedido = false,
    } = body as Record<string, unknown>;

    const codigoLimpio = String(codigo ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');

    if (codigoLimpio.length < 4 || codigoLimpio.length > 20) {
      return NextResponse.json(
        { ok: false, error: 'El código debe tener entre 4 y 20 caracteres (letras, números y guiones)' },
        { status: 400 }
      );
    }

    const tipo = tipoDescuento === 'fijo' ? 'fijo' : 'porcentaje';
    const valorNum = Number(valor);
    if (!Number.isFinite(valorNum) || valorNum <= 0 || valorNum > MAX_VALOR) {
      return NextResponse.json({ ok: false, error: 'Valor de descuento inválido' }, { status: 400 });
    }
    if (tipo === 'porcentaje' && valorNum > 90) {
      return NextResponse.json({ ok: false, error: 'El porcentaje no puede superar 90%' }, { status: 400 });
    }

    const dias = Math.min(365, Math.max(1, parseInt(String(vigenciaDias), 10) || 30));
    const usos = Math.max(0, parseInt(String(maxUsos), 10) || 0);

    const existente = await db.codigoPromocional.findUnique({ where: { codigo: codigoLimpio } });
    if (existente) {
      return NextResponse.json(
        {
          ok: false,
          error: existente.tiendaId === tienda.id ? 'Ya tienes un cupón con ese código' : 'Ese código ya está en uso en LogiFast',
        },
        { status: 409 }
      );
    }

    const inicio = new Date();
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + dias);

    const cupon = await db.codigoPromocional.create({
      data: {
        codigo: codigoLimpio,
        tipoDescuento: tipo,
        valor: valorNum,
        aplicableA: 'ambos',
        montoMinimo: Number(montoMinimo) > 0 ? Number(montoMinimo) : null,
        descuentoMaximo: Number(descuentoMaximo) > 0 ? Number(descuentoMaximo) : null,
        primerPedidoSolo: Boolean(soloPrimerPedido),
        tipoServicio: 'marketplace',
        maxUsos: usos,
        usosActuales: 0,
        segmento: 'todos',
        vigenciaInicio: inicio,
        vigenciaFin: fin,
        estado: 'activo',
        creadoPor: user.id,
        tiendaId: tienda.id,
      },
      select: { id: true, codigo: true, valor: true, tipoDescuento: true, vigenciaFin: true },
    });

    return NextResponse.json({ ok: true, cupon });
  } catch (err) {
    console.error('[tienda/cupones POST]', err);
    return NextResponse.json({ ok: false, error: 'No se pudo crear el cupón' }, { status: 500 });
  }
}
