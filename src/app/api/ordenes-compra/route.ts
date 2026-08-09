import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { emitOrdenCreada, emitOrdenAsignada, emitirEventoRealtime } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ordenes-compra?clienteId=&estado=&tiendaId=
 * Lista órdenes de compra.
 * - Cliente: solo sus propias órdenes.
 * - Repartidor/Ingeniero: no listado (deben usar /api/repartidor/ordenes).
 * - Admin: puede filtrar por clienteId.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tiendaId = searchParams.get('tiendaId');
    const clienteIdParam = searchParams.get('clienteId');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (tiendaId) where.tiendaId = tiendaId;

    if (user.role === 'cliente') {
      where.clienteId = user.id;
    } else if (user.role === 'admin' && clienteIdParam) {
      where.clienteId = clienteIdParam;
    } else if (user.role === 'admin') {
      // admin sin filtro explícito: lista todo
    } else {
      // repartidor/ingeniero: no listado aquí
      return NextResponse.json({ total: 0, ordenes: [] });
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
 * Crea una nueva orden de compra. Requiere sesión de cliente (P0-12).
 * Re-valida código promocional server-side (P0-13).
 * Decrementa stock transaccionalmente (P0-14).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'cliente') {
      return NextResponse.json(
        { error: 'Se requiere sesión de cliente para crear órdenes' },
        { status: 401 }
      );
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
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    // Validar productos, calcular subtotal y verificar stock
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
      // Validar que el producto pertenece a la tienda indicada
      if (producto.tiendaId !== tiendaId) {
        return NextResponse.json(
          { error: `Producto ${producto.nombre} no pertenece a la tienda indicada` },
          { status: 400 }
        );
      }
      const cantidad = Math.max(1, Math.floor(Number(item.cantidad ?? 1)));
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return NextResponse.json({ error: `Cantidad inválida para ${producto.nombre}` }, { status: 400 });
      }
      // Validar stock si el producto lo gestiona
      if (producto.stock !== null && producto.stock < cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}` },
          { status: 400 }
        );
      }
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

    // Re-validar código promocional server-side (P0-13)
    let descuentoValidado = 0;
    let codigoUsado: string | null = null;
    if (codigoPromo) {
      const codigoUpper = String(codigoPromo).toUpperCase();
      const promo = await db.codigoPromocional.findUnique({
        where: { codigo: codigoUpper },
      });
      if (!promo) {
        return NextResponse.json({ error: 'Código promocional inválido' }, { status: 400 });
      }
      if (promo.estado !== 'activo') {
        return NextResponse.json({ error: 'Código promocional inactivo' }, { status: 400 });
      }
      const now = new Date();
      if (now < promo.vigenciaInicio || now > promo.vigenciaFin) {
        return NextResponse.json({ error: 'Código promocional expirado' }, { status: 400 });
      }
      if (promo.maxUsos > 0 && promo.usosActuales >= promo.maxUsos) {
        return NextResponse.json({ error: 'Código promocional agotado' }, { status: 400 });
      }
      const yaUsado = await db.usoCodigo.findFirst({
        where: { codigoId: promo.id, clienteId: user.id },
      });
      if (yaUsado) {
        return NextResponse.json({ error: 'Ya usaste este código' }, { status: 400 });
      }
      descuentoValidado =
        promo.tipoDescuento === 'porcentaje'
          ? Math.round((subtotal * promo.valor) / 100)
          : Math.min(subtotal, promo.valor);
      codigoUsado = codigoUpper;
    }

    const costoEnvio = tienda.costoEnvio;
    const total = Math.max(0, subtotal + costoEnvio - descuentoValidado);

    // Transacción: crear orden + items + decrementar stock + usar código + crear OrdenServicio
    const result = await db.$transaction(async (tx) => {
      // 1. Crear orden de compra
      const orden = await tx.ordenCompra.create({
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
          descuento: descuentoValidado,
          codigoUsado,
          total,
          items: {
            create: itemsData,
          },
        },
        include: { items: true, tienda: true },
      });

      // 2. Decrementar stock por cada item
      for (const item of itemsData) {
        const updated = await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { decrement: item.cantidad } },
        });
        if (updated.stock !== null && updated.stock < 0) {
          throw new Error(`Stock insuficiente para ${item.nombreProducto}`);
        }
      }

      // 3. Si se usó código, registrar uso
      if (codigoUsado) {
        const promo = await tx.codigoPromocional.findUnique({ where: { codigo: codigoUsado } });
        if (promo) {
          await tx.usoCodigo.create({
            data: {
              codigoId: promo.id,
              clienteId: user.id,
              ordenId: orden.id,
              descuento: descuentoValidado,
            },
          });
          await tx.codigoPromocional.update({
            where: { id: promo.id },
            data: { usosActuales: { increment: 1 } },
          });
        }
      }

      // 4. Incrementar totalPedidos de la tienda
      await tx.tienda.update({
        where: { id: tiendaId },
        data: { totalPedidos: { increment: 1 } },
      });

      // 5. Crear OrdenServicio para el repartidor (tipo compra)
      const ordenServicio = await tx.ordenServicio.create({
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

      return { orden, ordenServicio };
    });

    // 1. Emitir eventos en tiempo real al instante (Socket.io WebSocket + Push)
    emitOrdenCreada(result.ordenServicio);
    emitirEventoRealtime({ room: 'admin', event: 'admin:orden:nueva', data: result.orden });
    emitirEventoRealtime({ room: `tienda:${tiendaId}`, event: 'tienda:orden:nueva', data: result.orden });

    // 2. Auto-asignar a repartidor disponible conectado (si existe)
    const repartidorDisponible = await db.repartidorProfile
      .findFirst({
        where: { conectado: true, enServicio: false, pausado: false, contratoAceptado: true },
        orderBy: { totalEntregas: 'asc' },
      })
      .catch(() => null);

    if (repartidorDisponible) {
      await db.ordenServicio
        .update({
          where: { id: result.ordenServicio.id },
          data: { repartidorId: repartidorDisponible.id, estado: 'aceptado' },
        })
        .catch(() => null);

      emitOrdenAsignada(repartidorDisponible.id, result.ordenServicio);

      await db.notificacionRepartidor
        .create({
          data: {
            repartidorId: repartidorDisponible.id,
            tipo: 'orden_asignada',
            titulo: 'Nueva compra asignada al instante',
            contenido: `Orden #${result.orden.id.slice(-6)} — ${tienda.nombre} — C$${total}`,
            leido: false,
            ordenId: result.ordenServicio.id,
          },
        })
        .catch(() => null);
    } else {
      // Si no hay repartidor libre inmediatamente, notificar a todos los conectados
      const repartidoresConectados = await db.repartidorProfile
        .findMany({
          where: { conectado: true, pausado: false, contratoAceptado: true },
          take: 15,
        })
        .catch(() => []);

      for (const rep of repartidoresConectados) {
        await db.notificacionRepartidor
          .create({
            data: {
              repartidorId: rep.id,
              tipo: 'nueva_orden_disponible',
              titulo: 'Nueva compra disponible',
              contenido: `Orden #${result.orden.id.slice(-6)} — ${tienda.nombre} — Total: C$${total}`,
              leido: false,
              ordenId: result.ordenServicio.id,
            },
          })
          .catch(() => null);
      }
    }

    return NextResponse.json(
      {
        message: 'Orden creada exitosamente',
        orden: {
          id: result.orden.id,
          tiendaId: result.orden.tiendaId,
          tiendaNombre: result.orden.tienda?.nombre ?? '',
          estado: result.orden.estado,
          total: result.orden.total,
          items: result.orden.items.map((it) => ({
            nombreProducto: it.nombreProducto,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
          })),
          ordenServicioId: result.ordenServicio.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creando orden de compra:', error);
    const msg = error instanceof Error ? error.message : 'Error al crear la orden de compra';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
