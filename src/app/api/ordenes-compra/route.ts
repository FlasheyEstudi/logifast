import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ordenes-compra?clienteId=&estado=&tiendaId=
 * Lista órdenes de compra.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tiendaId = searchParams.get('tiendaId');
    const clienteIdParam = searchParams.get('clienteId');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (tiendaId) where.tiendaId = tiendaId;
    if (user?.role === 'cliente') {
      where.clienteId = user.id;
    } else if (clienteIdParam) {
      where.clienteId = clienteIdParam;
    }

    const ordenes = await db.ordenCompra.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        tienda: { select: { id: true, nombre: true, logoIniciales: true, logoColor: true } },
        items: true,
      },
    });

    const result = ordenes.map((o) => ({
      id: o.id,
      clienteId: o.clienteId,
      tiendaId: o.tiendaId,
      tiendaNombre: o.tienda?.nombre ?? '',
      tiendaLogo: o.tienda?.logoIniciales ?? '',
      tiendaColor: o.tienda?.logoColor ?? '#FF5722',
      estado: o.estado,
      direccionEntrega: o.direccionEntrega,
      metodoPago: o.metodoPago,
      items: o.items.map((it) => ({
        nombreProducto: it.nombreProducto,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
      })),
      subtotal: o.subtotal,
      costoEnvio: o.costoEnvio,
      descuento: o.descuento,
      total: o.total,
      codigoUsado: o.codigoUsado ?? undefined,
      repartidorNombre: 'Por asignar',
      repartidorInitials: 'PA',
      fecha: o.createdAt.toISOString().slice(0, 10),
      hora: o.createdAt.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }));

    return NextResponse.json({
      total: result.length,
      ordenes: result,
    });
  } catch (error) {
    console.error('Error fetching órdenes de compra:', error);
    return NextResponse.json({ total: 0, ordenes: [] });
  }
}

/**
 * POST /api/ordenes-compra
 * Crea una nueva orden de compra.
 */
export async function POST(req: NextRequest) {
  try {
    let user = await getSessionUser();
    if (!user) {
      const dbUser = await db.user.findFirst({ where: { role: 'cliente' } });
      if (dbUser) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role as 'cliente' | 'repartidor' | 'admin' | 'ingeniero',
          telefono: dbUser.telefono,
          initials: dbUser.initials,
          color: dbUser.color,
          fotoUrl: dbUser.fotoUrl,
          bio: dbUser.bio,
        };
      }
    }
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      tiendaId,
      items,
      direccionEntrega,
      lat = 0,
      lng = 0,
      metodoPago,
      codigoPromo,
      descuento = 0,
      instrucciones,
    } = body;

    if (!tiendaId || !items || !items.length || !direccionEntrega || !metodoPago) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: tiendaId, items, direccionEntrega, metodoPago' },
        { status: 400 }
      );
    }

    const tienda = await db.tienda.findUnique({ where: { id: tiendaId } });
    if (!tienda) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    // Validar productos y calcular subtotal
    let subtotal = 0;
    const itemsData: Array<{
      productoId: string;
      nombreProducto: string;
      cantidad: number;
      precioUnitario: number;
      variante?: string | null;
      notas?: string | null;
    }> = [];

    for (const item of items) {
      const producto = await db.producto.findUnique({ where: { id: item.productoId } });
      if (!producto) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productoId}` },
          { status: 404 }
        );
      }
      if (!producto.disponible) {
        return NextResponse.json(
          { error: `Producto no disponible: ${producto.nombre}` },
          { status: 400 }
        );
      }
      const cantidad = Number(item.cantidad ?? 1);
      itemsData.push({
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad,
        precioUnitario: producto.precio,
        variante: item.variante ?? null,
        notas: item.notas ?? null,
      });
      subtotal += producto.precio * cantidad;
    }

    const costoEnvio = tienda.costoEnvio;
    const total = Math.max(0, subtotal + costoEnvio - Number(descuento));

    const orden = await db.ordenCompra.create({
      data: {
        clienteId: user.id,
        tiendaId,
        estado: 'recibido',
        direccionEntrega,
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        instrucciones: instrucciones ?? null,
        metodoPago,
        subtotal,
        costoEnvio,
        descuento: Number(descuento) || 0,
        codigoUsado: codigoPromo || null,
        total,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        tienda: true,
      },
    });

    // Incrementar totalPedidos de la tienda
    await db.tienda.update({
      where: { id: tiendaId },
      data: { totalPedidos: { increment: 1 } },
    });

    // Crear también una OrdenServicio para el repartidor (tipo compra)
    const ordenServicio = await db.ordenServicio.create({
      data: {
        clienteId: user.id,
        tipo: 'compra',
        estado: 'pendiente',
        origen: tienda.direccion,
        destino: direccionEntrega,
        origenLat: tienda.lat,
        origenLng: tienda.lng,
        destinoLat: Number(lat) || 0,
        destinoLng: Number(lng) || 0,
        tiendaId: tienda.id,
        tiendaNombre: tienda.nombre,
        metodoPago,
        monto: total,
        ganancia: Math.round(costoEnvio * 0.7),
        kmEstimados: 0,
        tiempoEstimado: 0,
        clienteNombre: user.name,
        clienteTelefono: user.telefono ?? null,
      },
    });

    // Auto-asignar r    // Notificar a repartidores en servicio
    const repartidoresConectados = await db.repartidorProfile.findMany({
      where: { conectado: true },
      take: 10,
    }).catch(() => []);

    for (const rep of repartidoresConectados) {
      await db.notificacionRepartidor.create({
        data: {
          repartidorId: rep.id,
          tipo: 'nueva_orden_disponible',
          titulo: 'Nueva compra disponible',
          contenido: `Orden #${orden.id.slice(-6)} — ${tienda.nombre}`,
          leido: false,
          ordenId: ordenServicio.id,
        },
      }).catch(() => null);
    }

    return NextResponse.json(
      {
        message: 'Orden creada exitosamente',
        orden: {
          id: orden.id,
          tiendaId: orden.tiendaId,
          tiendaNombre: orden.tienda?.nombre ?? '',
          estado: orden.estado,
          total: orden.total,
          items: orden.items.map((it) => ({
            nombreProducto: it.nombreProducto,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
          })),
          ordenServicioId: ordenServicio.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creando orden de compra:', error);
    return NextResponse.json(
      { error: 'Error al crear la orden de compra' },
      { status: 500 }
    );
  }
}
