import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { geocodeAddress } from '@/lib/osrm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ordenes
 *   - Cliente: devuelve sus propias órdenes
 *   - Admin: devuelve todas
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;

    if (user?.role === 'cliente') {
      where.clienteId = user.id;
    } else if (user?.role === 'repartidor') {
      where.OR = [
        { repartidorId: user.id },
        { repartidorId: null, estado: 'pendiente' },
      ];
    }
    // Si es admin o no hay sesion de cookie (ej. polling de dashboard), devuelve todas

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
    return NextResponse.json({ ordenes: [] });
  }
}

/**
 * POST /api/ordenes
 * Crea una nueva orden de servicio (envío).
 */
export async function POST(req: NextRequest) {
  try {
    let user = await getSessionUser();
    if (!user) {
      let dbUser = await db.user.findFirst({ where: { role: 'cliente' } });
      if (!dbUser) {
        dbUser = await db.user.create({
          data: {
            email: 'cliente@logifast.com',
            name: 'María López',
            password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
            role: 'cliente',
            telefono: '+505 8888-1234',
            initials: 'ML',
            color: '#FF5722',
          },
        });
      }
      user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role as any,
        telefono: dbUser.telefono,
        initials: dbUser.initials,
        color: dbUser.color,
        fotoUrl: dbUser.fotoUrl,
        bio: dbUser.bio,
      };
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


    const rawOrigLat = Number(origenLat) || 0;
    const rawOrigLng = Number(origenLng) || 0;
    const rawDestLat = Number(destinoLat) || 0;
    const rawDestLng = Number(destinoLng) || 0;

    const [finalOrigLat, finalOrigLng] = (rawOrigLat !== 0 && rawOrigLng !== 0)
      ? [rawOrigLat, rawOrigLng]
      : geocodeAddress(origen, [12.1264, -86.2652]);

    const [finalDestLat, finalDestLng] = (rawDestLat !== 0 && rawDestLng !== 0)
      ? [rawDestLat, rawDestLng]
      : geocodeAddress(destino, [12.1402, -86.2954]);

    const orden = await db.ordenServicio.create({
      data: {
        clienteId: user.id,
        tipo,
        estado: 'pendiente',
        origen,
        destino,
        origenLat: finalOrigLat,
        origenLng: finalOrigLng,
        destinoLat: finalDestLat,
        destinoLng: finalDestLng,
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
