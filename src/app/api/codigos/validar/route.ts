import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  codigo: z.string().min(1, 'Código promocional requerido').max(50),
  montoSubtotal: z.number().min(0).optional(),
});

/**
 * POST /api/codigos/validar
 * Body: { codigo, montoSubtotal, aplicableA? }
 * Valida si un código promocional existe, está activo, vigente, no agotado,
 * no usado previamente por el usuario, y aplica al tipo de orden indicada (P1).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { codigo, montoSubtotal = 0 } = parsed.data;
    const codigoStr = codigo.trim().toUpperCase();

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

    // P1: Validar que el usuario no haya usado este código antes (uso único por usuario)
    const yaUsado = await db.usoCodigo.findFirst({
      where: { codigoId: promo.id, clienteId: user.id },
    });
    if (yaUsado) {
      return NextResponse.json({ error: 'Ya has usado este código anteriormente' }, { status: 400 });
    }

    // P1: Validar aplicabilidad según el tipo definido en el código
    // aplicableA en schema: 'todos' | 'primer_envio' | 'envio_minimo'
    if (promo.aplicableA === 'primer_envio') {
      // Verificar si es la primera orden del usuario
      const ordenesPrevias = await db.ordenServicio.count({
        where: { clienteId: user.id },
      });
      if (ordenesPrevias > 0) {
        return NextResponse.json(
          { error: 'Este código solo aplica a tu primer envío' },
          { status: 400 }
        );
      }
    } else if (promo.aplicableA === 'envio_minimo' && promo.montoMinimo) {
      if (montoSubtotal < promo.montoMinimo) {
        return NextResponse.json(
          { error: `Este código requiere un envío mínimo de C$${promo.montoMinimo}` },
          { status: 400 }
        );
      }
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
      aplicableA: promo.aplicableA ?? 'todos',
      mensaje: `¡Código ${promo.codigo} aplicado con éxito! Descuento: C$${descuento}`,
    });
  } catch (error) {
    console.error('[CODIGO_VALIDAR_ERROR]', error);
    return NextResponse.json({ error: 'Error al validar código promocional' }, { status: 500 });
  }
}
