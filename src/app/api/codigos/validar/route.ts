import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  codigo: z.string().min(1, 'Código promocional requerido').max(50),
  montoSubtotal: z.number().min(0).optional(),
  tipoOrden: z.enum(['envio', 'marketplace', 'ambos']).optional(),
});

/**
 * POST /api/codigos/validar
 * Body: { codigo, montoSubtotal, tipoOrden? }
 * Bandwidth-optimized, intelligent commercial rules engine:
 * - Unique code usage per client
 * - Expiration and max uses checks
 * - Minimum order amount threshold
 * - First-order-only validation (primerPedidoSolo / first_order)
 * - Maximum discount ceiling (descuentoMaximo in C$)
 * - Service category matching (envio vs marketplace)
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
    const { codigo, montoSubtotal = 0, tipoOrden = 'envio' } = parsed.data;
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

    // 1. Tipo de servicio (envio vs marketplace)
    if (promo.tipoServicio && promo.tipoServicio !== 'ambos' && promo.tipoServicio !== tipoOrden) {
      const tipoLabel = promo.tipoServicio === 'envio' ? 'envíos directos' : 'compras en tiendas';
      return NextResponse.json(
        { error: `Este código solo es aplicable para ${tipoLabel}` },
        { status: 400 }
      );
    }

    // 2. Monto mínimo
    if (promo.montoMinimo && montoSubtotal < promo.montoMinimo) {
      return NextResponse.json(
        { error: `El pedido mínimo para aplicar este código es C$${promo.montoMinimo}` },
        { status: 400 }
      );
    }

    // 3. Límite de usos globales
    if (promo.maxUsos > 0 && promo.usosActuales >= promo.maxUsos) {
      return NextResponse.json({ error: 'El código ha alcanzado su límite de usos' }, { status: 400 });
    }

    // 4. Validar uso único por cliente
    const yaUsado = await db.usoCodigo.findFirst({
      where: { codigoId: promo.id, clienteId: user.id },
    });
    if (yaUsado) {
      return NextResponse.json({ error: 'Ya has usado este código promocional anteriormente' }, { status: 400 });
    }

    // 5. Validar solo primer pedido
    if (promo.primerPedidoSolo || promo.aplicableA === 'primer_envio') {
      const [ordenesServicioPrevias, ordenesCompraPrevias] = await Promise.all([
        db.ordenServicio.count({ where: { clienteId: user.id } }),
        db.ordenCompra.count({ where: { clienteId: user.id } }),
      ]);
      if (ordenesServicioPrevias + ordenesCompraPrevias > 0) {
        return NextResponse.json(
          { error: 'Este código es exclusivo para nuevos clientes en su primer pedido' },
          { status: 400 }
        );
      }
    }

    // 6. Calcular monto de descuento con tope comercial
    let descuento = 0;
    if (promo.tipoDescuento === 'porcentaje') {
      descuento = Math.round((montoSubtotal * promo.valor) / 100);
      if (promo.descuentoMaximo && promo.descuentoMaximo > 0 && descuento > promo.descuentoMaximo) {
        descuento = promo.descuentoMaximo;
      }
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
      descuentoMaximo: promo.descuentoMaximo,
      primerPedidoSolo: promo.primerPedidoSolo,
      tipoServicio: promo.tipoServicio,
      mensaje: `¡Código ${promo.codigo} aplicado con éxito! Ahorro: C$${descuento}`,
    });
  } catch (error) {
    console.error('[CODIGO_VALIDAR_ERROR]', error);
    return NextResponse.json({ error: 'Error al validar código promocional' }, { status: 500 });
  }
}
