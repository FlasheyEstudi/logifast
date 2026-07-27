import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ordenes
 *   - Cliente: devuelve sus propias órdenes
 *   - Admin: devuelve todas
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (user.role === 'cliente') where.clienteId = user.id;
    if (user.role === 'repartidor') {
      // Repartidor: órdenes asignadas a él o disponibles
      where.OR = [
        { repartidorId: user.id },
        { repartidorId: null, estado: 'pendiente' },
      ];
    }

    const ordenes = await db.ordenServicio.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        cliente: { select: { id: true, name: true, email: true, telefono: true, initials: true, color: true } },
      },
    });

    return NextResponse.json({ ordenes });
  } catch (error) {
    console.error('[ORDENES_GET]', error);
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}

/**
 * POST /api/ordenes
 * Crea una nueva orden de servicio (envío).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      tipo = 'envio',
      origen,
      destino,
      origenLat,
      origenLng,
      destinoLat,
      destinoLng,
      paquete,
      tamano,
      fragil = false,
      tiendaId,
      tiendaNombre,
      metodoPago = 'efectivo',
      monto = 0,
      ganancia = 0,
      kmEstimados = 0,
      tiempoEstimado = 0,
    } = body;

    if (!origen || !destino) {
      return NextResponse.json(
        { error: 'Origen y destino son obligatorios' },
        { status: 400 }
      );
    }

    const orden = await db.ordenServicio.create({
      data: {
        clienteId: user.id,
        tipo,
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
        tiendaId: tiendaId ?? null,
        tiendaNombre: tiendaNombre ?? null,
        metodoPago,
        monto: Number(monto) || 0,
        ganancia: Number(ganancia) || 0,
        kmEstimados: Number(kmEstimados) || 0,
        tiempoEstimado: Number(tiempoEstimado) || 0,
        clienteNombre: user.name,
        clienteTelefono: user.telefono ?? null,
      },
    });

    // Auto-asignar al primer repartidor conectado disponible
    if (user.role === 'cliente') {
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
        await db.ordenServicio.update({
          where: { id: orden.id },
          data: { repartidorId: repartidor.id, estado: 'asignado' },
        });

        await db.notificacionRepartidor.create({
          data: {
            repartidorId: repartidor.id,
            tipo: 'orden_asignada',
            titulo: 'Nueva orden asignada',
            contenido: `${orden.id} — ${tipo === 'envio' ? 'Envío' : 'Compra'} de ${user.name}`,
            leido: false,
            ordenId: orden.id,
          },
        });

        return NextResponse.json({ orden: { ...orden, estado: 'asignado', repartidorId: repartidor.id } });
      }
    }

    return NextResponse.json({ orden });
  } catch (error) {
    console.error('[ORDENES_POST]', error);
    return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
  }
}
