import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { geocodeAddress, calcularDistanciaHaversine, calcularTiempoEstimado } from '@/lib/osrm';
import { emitOrdenCreada } from '@/lib/realtime-emitter';

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
  metodoPago: z.string().optional(),
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
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    // Paginación segura contra NaN (P1)
    const limitRaw = parseInt(searchParams.get('limit') ?? '100', 10);
    const offsetRaw = parseInt(searchParams.get('offset') ?? '0', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 100;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;

    if (user.role === 'cliente') {
      where.clienteId = user.id;
    } else if (user.role === 'repartidor') {
      where.OR = [
        { repartidorId: user.id },
        { repartidorId: null, estado: 'pendiente' },
      ];
    } else if (user.role !== 'admin') {
      where.clienteId = user.id;
    }

    const [ordenes, total] = await Promise.all([
      db.ordenServicio.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          cliente: { select: { id: true, name: true, email: true, telefono: true, initials: true, color: true } },
          repartidor: { select: { id: true, user: { select: { name: true, telefono: true, fotoUrl: true } } } },
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
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para solicitar un envío' }, { status: 401 });
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

    let finalOrigLat = rawOrigLat;
    let finalOrigLng = rawOrigLng;
    if (finalOrigLat === 0 && finalOrigLng === 0) {
      const [gcLat, gcLng] = geocodeAddress(origen);
      finalOrigLat = gcLat;
      finalOrigLng = gcLng;
    }

    let finalDestLat = rawDestLat;
    let finalDestLng = rawDestLng;
    if (finalDestLat === 0 && finalDestLng === 0) {
      const [gcLat, gcLng] = geocodeAddress(destino);
      finalDestLat = gcLat;
      finalDestLng = gcLng;
    }

    const hasCoords = finalOrigLat !== 0 && finalOrigLng !== 0 && finalDestLat !== 0 && finalDestLng !== 0;
    const kmCalc = hasCoords ? calcularDistanciaHaversine(finalOrigLat, finalOrigLng, finalDestLat, finalDestLng) : 0;
    const kmReales = (Number(body.kmEstimados) > 0) ? Number(body.kmEstimados) : kmCalc;
    const tiempoEstimadoMin = (Number(body.tiempoEstimado) > 0) ? Number(body.tiempoEstimado) : (kmReales > 0 ? calcularTiempoEstimado(kmReales) : 0);

    // Tarifa base C$40 (cubre primeros 2km) + C$15 por km adicional
    let tarifaCalculada = 40;
    if (kmReales > 2) {
      tarifaCalculada += Math.round((kmReales - 2) * 15);
    }
    if (fragil) tarifaCalculada += 20;
    if (tamano === 'Grande') tarifaCalculada += 30;
    if (tamano === 'Mediano') tarifaCalculada += 15;

    // Si el body provee un monto mayor o igual a la tarifa calculada, respetarlo; de lo contrario usar la tarifa oficial
    const montoBody = Number(body.monto) || 0;
    const montoFinal = montoBody >= tarifaCalculada * 0.8 ? montoBody : tarifaCalculada;
    const gananciaRepartidor = Math.round(montoFinal * 0.7);

    const pinGenerado = String(Math.floor(1000 + Math.random() * 9000));

    const createData: any = {
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
      incidenciaDesc: body.paqueteFotoUrl ?? null,
      tiendaId: tiendaId ?? null,
      tiendaNombre: tiendaNombre ?? null,
      metodoPago,
      monto: montoFinal,
      ganancia: gananciaRepartidor,
      kmEstimados: kmReales,
      tiempoEstimado: tiempoEstimadoMin,
      clienteNombre: user.name,
      clienteTelefono: user.telefono ?? null,
      codigoPin: pinGenerado,
    };

    const orden = await db.ordenServicio.create({
      data: createData,
    });

    // Emitir evento en tiempo real a Admin y Repartidores
    emitOrdenCreada(orden);

    // Auto-aprender y guardar dirección para futuras entregas inteligentes
    if (user.id && user.id !== 'usr_cliente_demo' && finalDestLat && finalDestLng) {
      db.direccionCliente.findFirst({
        where: { clienteId: user.id, direccion: destino },
      }).then((existing) => {
        if (!existing) {
          db.direccionCliente.create({
            data: {
              clienteId: user.id,
              etiqueta: destino.split(',')[0].slice(0, 30),
              direccion: destino,
              lat: finalDestLat,
              lng: finalDestLng,
              predeterminada: false,
            },
          }).catch(() => null);
        }
      }).catch(() => null);
    }

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

    return NextResponse.json({ orden, status: 'pendiente' }, { status: 201 });
  } catch (error) {
    console.error('[ORDENES_POST]', error);
    return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
  }
}
