import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/solicitudes-envio
 * Cliente: sus solicitudes. Repartidor: disponibles + asignadas.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    let where: Record<string, unknown> = {};
    if (user.role === 'cliente') {
      where.clienteId = user.id;
    } else if (user.role === 'repartidor') {
      where.OR = [
        { repartidorId: user.id },
        { repartidorId: null, estado: 'pendiente' },
      ];
    }

    const solicitudes = await db.solicitudEnvio.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ solicitudes });
  } catch (error) {
    console.error('[SOLICITUDES_ENVIO_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/solicitudes-envio
 * Cliente crea una solicitud de envío directo.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const {
      origen, destino, origenLat, origenLng, destinoLat, destinoLng,
      paquete, tamano, fragil, metodoPago, monto, notas,
    } = body;

    if (!origen || !destino) {
      return NextResponse.json({ error: 'origen y destino requeridos' }, { status: 400 });
    }

    const solicitud = await db.solicitudEnvio.create({
      data: {
        clienteId: user.id,
        estado: 'pendiente',
        origen,
        destino,
        origenLat: Number(origenLat) || 0,
        origenLng: Number(origenLng) || 0,
        destinoLat: Number(destinoLat) || 0,
        destinoLng: Number(destinoLng) || 0,
        paquete: paquete ?? null,
        tamano: tamano ?? null,
        fragil: Boolean(fragil),
        metodoPago: metodoPago || 'efectivo',
        monto: Number(monto) || 0,
        notas: notas ?? null,
      },
    });

    // Auto-asignar repartidor conectado
    const repartidor = await db.repartidorProfile.findFirst({
      where: {
        conectado: true,
        enServicio: false,
        pausado: false,
        contratoAceptado: true,
        saldo: { gt: 0 },
      },
      orderBy: { totalEntregas: 'asc' },
    });

    if (repartidor) {
      await db.solicitudEnvio.update({
        where: { id: solicitud.id },
        data: { repartidorId: repartidor.id, estado: 'aceptada' },
      });
      await db.notificacionRepartidor.create({
        data: {
          repartidorId: repartidor.id,
          tipo: 'orden_asignada',
          titulo: 'Nueva solicitud de envío',
          contenido: `${solicitud.id} — ${origen} → ${destino}`,
          leido: false,
        },
      });
    }

    return NextResponse.json({ ok: true, solicitud });
  } catch (error) {
    console.error('[SOLICITUDES_ENVIO_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
