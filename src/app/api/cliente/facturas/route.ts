import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/facturas — compras (solicitudes de envío) del cliente logueado.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  try {
    const solicitudes = await db.solicitudEnvio.findMany({
      where: { clienteId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      ok: true,
      facturas: solicitudes.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        origen: s.origen,
        destino: s.destino,
        monto: s.monto,
        metodoPago: s.metodoPago,
        estado: s.estado,
        facturaUrlPdf: `/api/cliente/facturas/${s.id}/pdf`,
      })),
    });
  } catch (e) {
    console.error('[CLIENTE_FACTURAS]', e);
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 });
  }
}
