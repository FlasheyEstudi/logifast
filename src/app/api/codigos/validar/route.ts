import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { validarCodigoPromocional } from '@/lib/cupones';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  codigo: z.string().min(1, 'Código promocional requerido').max(50),
  montoSubtotal: z.number().min(0).optional(),
  tipoOrden: z.enum(['envio', 'marketplace', 'ambos']).optional(),
  tiendaId: z.string().optional(),
});

/**
 * POST /api/codigos/validar
 * Body: { codigo, montoSubtotal, tipoOrden? }
 * Vista previa del motor comercial único (`src/lib/cupones.ts`):
 * - Tipo de servicio (envio vs marketplace)
 * - Expiración y máximo de usos
 * - Monto mínimo del pedido
 * - Uso único por cliente
 * - Exclusivo de primer pedido (primerPedidoSolo / first_order)
 * - Tope de descuento (descuentoMaximo en C$)
 *
 * La misma función se usa en `POST /api/ordenes-compra`, así que el descuento
 * que ve el cliente es exactamente el que se cobra.
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
    const { codigo, montoSubtotal = 0, tipoOrden = 'envio', tiendaId } = parsed.data;

    const resultado = await validarCodigoPromocional({
      codigo,
      montoSubtotal,
      tipoOrden,
      clienteId: user.id,
      // La vista previa del cliente respeta la misma regla de tienda que el cobro real.
      tiendaId,
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }

    const { promo, descuento } = resultado;

    return NextResponse.json({
      ok: true,
      valido: true,
      codigo: promo.codigo,
      tipoDescuento: promo.tipoDescuento,
      valor: promo.valor,
      descuentoCalculado: descuento,
      descuentoMaximo: promo.descuentoMaximo || null,
      primerPedidoSolo: promo.primerPedidoSolo || false,
      tipoServicio: promo.tipoServicio || 'ambos',
      mensaje: `¡Código ${promo.codigo} aplicado con éxito! Ahorro: C$${descuento}`,
    });
  } catch (error) {
    console.error('[CODIGO_VALIDAR_ERROR]', error);
    return NextResponse.json({ error: 'Error al validar código promocional' }, { status: 500 });
  }
}
