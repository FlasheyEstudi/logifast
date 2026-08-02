import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { geocodeAddress } from '@/lib/osrm';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  tipo: z.enum(['envio', 'compra']).optional(),
  origen: z.string().min(1, 'Origen es obligatorio').max(500),
  destino: z.string().min(1, 'Destino es obligatorio').max(500),
  origenLat: z.union([z.number(), z.string()]).optional(),
  origenLng: z.union([z.number(), z.string()]).optional(),
  destinoLat: z.union([z.number(), z.string()]).optional(),
  destinoLng: z.union([z.number(), z.string()]).optional(),
  paquete: z.string().max(500).optional().nullable(),
  tamano: z.string().max(50).optional().nullable(),
  fragil: z.boolean().optional(),
  tiendaId: z.string().optional().nullable(),
  tiendaNombre: z.string().max(200).optional().nullable(),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
  monto: z.union([z.number().min(0), z.string()]).optional(),
  ganancia: z.union([z.number().min(0), z.string()]).optional(),
  kmEstimados: z.union([z.number().min(0), z.string()]).optional(),
  tiempoEstimado: z.union([z.number().int().min(0), z.string()]).optional(),
});

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
    // Paginación segura contra NaN (P1)
    const limitRaw = parseInt(searchParams.get('limit') ?? '100', 10);
    const offsetRaw = parseInt(searchParams.get('offset') ?? '0', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 100;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;

    if (user?.role === 'cliente') {
      const demoUser = await db.user.findFirst({ where: { role: 'cliente' } }).catch(() => null);
      where.OR = [
        { clienteId: user.id },
        ...(demoUser ? [{ clienteId: demoUser.id }] : []),
        { clienteNombre: user.name },
      ];
    } else if (user?.role === 'repartidor') {
      where.OR = [
        { repartidorId: user.id },
        { repartidorId: null, estado: 'pendiente' },
      ];
    }
    // Si es admin o no hay sesion de cookie (ej. guest/polling), devuelve todas las ordenes

    const [ordenes, total] = await Promise.all([
      db.ordenServicio.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          cliente: { select: { id: true, name: true, email: true, telefono: true, initials: true, color: true } },
        },
      }),
      db.ordenServicio.count({ where }),
    ]);

    return NextResponse.json({ ordenes, total, limit, offset, hasMore: offset + limit < total });
  } catch (error) {
    console.error('[ORDENES_GET]', error);
    return NextResponse.json({ ordenes: [], total: 0 });
  }
}

/**
 * POST /api/ordenes
 * Crea una nueva orden de servicio (envío).
 * Garantiza persistencia 100% en PostgreSQL DB.
 */
export async function POST(req: NextRequest) {
  try {
    let user = await getSessionUser();
    if (!user) {
      // Resolver cliente por defecto en BD para evitar perdida de envio en modo demo/invitado
      let demoUser = await db.user.findFirst({ where: { role: 'cliente' } }).catch(() => null);
      if (!demoUser) {
        demoUser = await db.user.create({
          data: {
            email: 'cliente@logifast.app',
            name: 'Cliente Logifast',
            role: 'cliente',
            password: '$2a$10$demoPasswordHashForLogifast2026ClientAuthKey',
            telefono: '+505 8888-8888',
          },
        }).catch(() => null);
      }
      if (demoUser) {
        user = {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: 'cliente',
          telefono: demoUser.telefono,
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Se requiere usuario de cliente para crear la orden' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
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

    // Notificar a repartidores conectados
    const repartidoresConectados = await db.repartidorProfile.findMany({
      where: { conectado: true },
      take: 10,
    }).catch(() => []);

    for (const rep of repartidoresConectados) {
      await db.notificacionRepartidor.create({
        data: {
          repartidorId: rep.id,
          tipo: 'nueva_orden_disponible',
          titulo: 'Nueva orden disponible',
          contenido: `${orden.id} — ${tipo === 'envio' ? 'Envío' : 'Compra'} de ${user.name}`,
          leido: false,
          ordenId: orden.id,
        },
      }).catch(() => null);
    }

    // Difusión instantánea (< 5 segundos) a repartidores y admin
    try {
      const { emitOrdenCreada } = await import('@/lib/realtime-emitter');
      emitOrdenCreada(orden);
    } catch (e) {
      console.warn('[REALTIME_EMIT_WARN]', e);
    }

    return NextResponse.json({ orden, status: 'pendiente' }, { status: 201 });
  } catch (error) {
    console.error('[ORDENES_POST]', error);
    return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
  }
}
