import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/codigos/validar
 * Body: { codigo, montoSubtotal }
 * Valida si un código promocional existe, está activo y vigente en la BD.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const codigoStr = String(body.codigo || '').trim().toUpperCase();
    const montoSubtotal = Number(body.montoSubtotal || 0);

    if (!codigoStr) {
      return NextResponse.json({ error: 'Código promocional requerido' }, { status: 400 });
    }

    const promo = await db.codigoPromocional.findUnique({
      where: { codigo: codigoStr },
    });

    if (!promo || promo.estado !== 'activo') {
      return NextResponse.json({ error: 'Código promocional inválido o inactivo' }, { status: 400 });
    }

    const now = new Date();
    if (now < promo.vigenciaInicio || now > promo.vigenciaFin) {
      return NextResponse.json({ error: 'El código promocional ha expirado' }, { status: 400 });
    }

    if (promo.montoMinimo && montoSubtotal < promo.montoMinimo) {
      return NextResponse.json(
        { error: `El pedido mínimo para aplicar este código es C$${promo.montoMinimo}` },
        { status: 400 }
      );
    }

    if (promo.maxUsos > 0 && promo.usosActuales >= promo.maxUsos) {
      return NextResponse.json({ error: 'El código ha alcanzado su límite de usos' }, { status: 400 });
    }

    // Calcular monto de descuento
    let descuento = 0;
    if (promo.tipoDescuento === 'porcentaje') {
      descuento = Math.round((montoSubtotal * promo.valor) / 100);
    } else {
      descuento = Math.min(montoSubtotal, promo.valor);
    }

    return NextResponse.json({
      ok: true,
      valido: true,
      codigo: promo.codigo,
      tipoDescuento: promo.tipoDescuento,
      valor: promo.valor,
      descuentoCalculado: descuento,
      mensaje: `¡Código ${promo.codigo} aplicado con éxito! Descuento: C$${descuento}`,
    });
  } catch (error) {
    console.error('[CODIGO_VALIDAR_ERROR]', error);
    return NextResponse.json({ error: 'Error al validar código promocional' }, { status: 500 });
  }
}
