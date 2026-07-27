import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/tienda
 * Devuelve la tienda del cliente autenticado (si tiene).
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({
      where: { propietarioId: user.id },
      include: {
        productos: { orderBy: { createdAt: 'desc' } },
        ordenes: {
          where: { estado: { in: ['recibido', 'preparando', 'listo', 'en_camino'] } },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!tienda) {
      return NextResponse.json({ tienda: null });
    }

    // Stats rápidas
    const totalProductos = tienda.productos.length;
    const ordenesActivas = tienda.ordenes.length;
    const totalPedidos = await db.ordenCompra.count({ where: { tiendaId: tienda.id } });
    const ingresos = await db.ordenCompra.aggregate({
      where: { tiendaId: tienda.id, estado: 'entregado' },
      _sum: { total: true },
    });

    return NextResponse.json({
      tienda: {
        ...tienda,
        horario: (() => { try { return JSON.parse(tienda.horario); } catch { return {}; } })(),
        zonaCobertura: (() => { try { return JSON.parse(tienda.zonaCobertura); } catch { return []; } })(),
        stats: {
          totalProductos,
          ordenesActivas,
          totalPedidos,
          ingresos: ingresos._sum.total ?? 0,
        },
      },
    });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/cliente/tienda
 * Crea una tienda para el cliente autenticado.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Verificar si ya tiene tienda
    const existing = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (existing) {
      return NextResponse.json({ error: 'Ya tienes una tienda registrada' }, { status: 400 });
    }

    const body = await req.json();
    const {
      nombre,
      descripcion,
      categoria,
      direccion,
      lat,
      lng,
      telefono,
      email,
      costoEnvio = 20,
      pedidoMinimo = 50,
      tiempoEstimado = '20-30 min',
      zonaCobertura = [],
      horario = {},
      logoColor,
      logoIniciales,
      portadaColor,
      imagenUrl,
    } = body;

    if (!nombre || !direccion || !categoria) {
      return NextResponse.json(
        { error: 'Nombre, dirección y categoría son obligatorios' },
        { status: 400 }
      );
    }

    const tienda = await db.tienda.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        categoria,
        logoColor: logoColor || '#FF5722',
        logoIniciales: logoIniciales || nombre.slice(0, 2).toUpperCase(),
        portadaColor: portadaColor || '#1B1B2F',
        imagenUrl: imagenUrl || null,
        direccion,
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        telefono: telefono || user.telefono || null,
        email: email || user.email || null,
        costoEnvio: Number(costoEnvio) || 20,
        pedidoMinimo: Number(pedidoMinimo) || 0,
        tiempoEstimado,
        horario: JSON.stringify(horario),
        zonaCobertura: JSON.stringify(zonaCobertura),
        verificado: false,
        popular: false,
        estado: 'activo',
        propietarioId: user.id,
      },
    });

    return NextResponse.json({ ok: true, tienda });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_POST]', error);
    return NextResponse.json({ error: 'Error al crear tienda' }, { status: 500 });
  }
}

/**
 * PATCH /api/cliente/tienda
 * Actualiza la tienda del cliente.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tienda = await db.tienda.findFirst({ where: { propietarioId: user.id } });
    if (!tienda) return NextResponse.json({ error: 'No tienes tienda' }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    const allowed = ['nombre', 'descripcion', 'categoria', 'logoColor', 'logoIniciales', 'portadaColor', 'imagenUrl', 'direccion', 'telefono', 'email', 'tiempoEstimado', 'estado'];

    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    if ('lat' in body) data.lat = Number(body.lat);
    if ('lng' in body) data.lng = Number(body.lng);
    if ('costoEnvio' in body) data.costoEnvio = Number(body.costoEnvio);
    if ('pedidoMinimo' in body) data.pedidoMinimo = Number(body.pedidoMinimo);
    if ('horario' in body) data.horario = JSON.stringify(body.horario);
    if ('zonaCobertura' in body) data.zonaCobertura = JSON.stringify(body.zonaCobertura);

    const updated = await db.tienda.update({ where: { id: tienda.id }, data });
    return NextResponse.json({ ok: true, tienda: updated });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
