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
        repartidorId: null, // Queda disponible en la bolsa de ofertas
      },
    });

    // Crear orden de servicio unificada para la bolsa de ofertas
    const pinGenerado = String(Math.floor(1000 + Math.random() * 9000));
    await db.ordenServicio.create({
      data: {
        id: solicitud.id,
        clienteId: user.id,
        tipo: 'envio',
        estado: 'pendiente',
        origen,
        destino,
        origenLat: Number(origenLat) || 0,
        origenLng: Number(origenLng) || 0,
        destinoLat: Number(destinoLat) || 0,
        destinoLng: Number(destinoLng) || 0,
        paquete: paquete ?? null,
        tamano: tamano ?? 'Mediano',
        fragil: Boolean(fragil),
        metodoPago: metodoPago || 'efectivo',
        monto: Number(monto) || 0,
        ganancia: Math.round((Number(monto) || 0) * 0.7),
        kmEstimados: 3.5,
        tiempoEstimado: 20,
        clienteNombre: user.name,
        clienteTelefono: user.telefono ?? null,
        codigoPin: pinGenerado,
        repartidorId: null, // No auto-asignar a nadie; sale en Ofertas Disponibles
      },
    }).catch(() => null);

    // Notificar a todos los repartidores conectados sobre la nueva oferta disponible
    const repartidoresConectados = await db.repartidorProfile.findMany({
      where: { conectado: true, pausado: false },
      take: 25,
    }).catch(() => []);

    for (const rep of repartidoresConectados) {
      await db.notificacionRepartidor.create({
        data: {
          repartidorId: rep.id,
          tipo: 'nueva_orden_disponible',
          titulo: 'Nueva oferta disponible',
          contenido: `Envío disponible: ${origen} → ${destino} (C$ ${monto})`,
          leido: false,
          ordenId: solicitud.id,
        },
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, solicitud, status: 'disponible_en_ofertas' });
  } catch (error) {
    console.error('[SOLICITUDES_ENVIO_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
