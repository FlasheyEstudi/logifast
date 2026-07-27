import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pagos/webhook
 * Webhook genérico para recibir confirmaciones de pago de pasarelas.
 * Body: { provider, event, data: { orderId, referencia, monto, estado } }
 *
 * Soporta: wompi, stripe, paypal (futuro)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = body.provider ?? 'unknown';
    const event = body.event ?? 'unknown';
    const data = body.data ?? {};

    // Verificar firma (en producción, cada pasarela tiene su método)
    // Por ahora solo registramos el evento
    console.log(`[PAGOS_WEBHOOK] ${provider}/${event}`, data);

    const orderId = data.orderId ?? data.referencia;
    const estado = data.estado ?? data.status;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    // Mapear estados de pasarelas a estados internos
    const estadoMap: Record<string, string> = {
      // Wompi
      'APPROVED': 'completado',
      'DECLINED': 'fallido',
      'ERROR': 'fallido',
      // Stripe
      'succeeded': 'completado',
      'failed': 'fallido',
      'pending': 'pendiente',
      // Genéricos
      'completado': 'completado',
      'fallido': 'fallido',
      'pendiente': 'pendiente',
    };

    const estadoInterno = estadoMap[estado] ?? 'pendiente';

    // Buscar la orden de compra
    const orden = await db.ordenCompra.findUnique({
      where: { id: orderId },
    });

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Si el pago fue completado, marcar orden como pagada
    if (estadoInterno === 'completado') {
      await db.ordenCompra.update({
        where: { id: orden.id },
        data: { estado: 'recibido' }, // Lista para ser procesada
      });

      // Crear notificación al cliente
      await db.notificacionPush.create({
        data: {
          userId: orden.clienteId,
          titulo: 'Pago confirmado',
          contenido: `Tu orden ${orden.id} ha sido confirmada. Total: C$ ${orden.total}`,
          tipo: 'orden',
          entidadId: orden.id,
        },
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, estado: estadoInterno });
  } catch (error) {
    console.error('[PAGOS_WEBHOOK]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
