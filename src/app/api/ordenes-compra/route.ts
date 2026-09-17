import { NextRequest, NextResponse } from 'next/server';
import { otorgarRecompensaMensual } from '@/lib/tienda/recompensas';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { getOrdenPin, generarPinAleatorio } from '@/lib/utils';
import { validarCodigoPromocional } from '@/lib/cupones';
import { emitOrdenCreada, emitOrdenAsignada, emitirEventoRealtime } from '@/lib/realtime-emitter';
import { geocodeAddress, calcularDistanciaHaversine, calcularTiempoEstimado } from '@/lib/osrm';

export const dynamic = 'force-dynamic';

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

    const ordenes = await (db.ordenCompra.findMany as any)({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        tienda: { select: { id: true, nombre: true, logoIniciales: true, logoColor: true, lat: true, lng: true } },
        items: true,
        repartidor: { include: { user: { select: { name: true, telefono: true, fotoUrl: true } } } },
      },
    });

    const result = (ordenes as any[]).map((o: any) => {
      const repNombre = o.repartidor?.nombre || o.repartidor?.user?.name || null;
      const repInitials = repNombre
        ? repNombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'RP';

      return {
        id: o.id,
        clienteId: o.clienteId,
        tiendaId: o.tiendaId,
        tiendaNombre: o.tienda?.nombre ?? '',
        tiendaLogo: o.tienda?.logoIniciales ?? '',
        tiendaColor: o.tienda?.logoColor ?? '#FF5722',
        estado: o.estado,
        direccionEntrega: o.direccionEntrega,
        origenLat: o.tienda?.lat ?? 0,
        origenLng: o.tienda?.lng ?? 0,
        destinoLat: o.lat ?? 0,
        destinoLng: o.lng ?? 0,
        metodoPago: o.metodoPago,
        codigoPin: getOrdenPin(o.id, o.codigoPin),
        repartidorNombre: repNombre,
        repartidorTelefono: o.repartidor?.telefono || o.repartidor?.user?.telefono || null,
        repartidorFotoUrl: o.repartidor?.user?.fotoUrl || null,
        repartidorInitials: repInitials,
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
      };
    });

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
      modoEntrega: modoEntregaCrudo,
    } = body;

    // #2 Retiro en punto: el cliente recoge en la tienda. En ese modo no hay envío ni
    // repartidor, la dirección es la propia tienda y el código PIN sirve para retirar.
    const modoEntrega: 'reparto' | 'retiro' = modoEntregaCrudo === 'retiro' ? 'retiro' : 'reparto';

    if (!tiendaId || !items || !items.length || !metodoPago) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: tiendaId, items, metodoPago' },
        { status: 400 }
      );
    }
    if (modoEntrega === 'reparto' && !direccionEntrega) {
      return NextResponse.json(
        { error: 'Falta la dirección de entrega para un pedido con reparto' },
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

    // Re-validar código promocional server-side (P0-13) con el MISMO motor de reglas
    // que POST /api/codigos/validar: tipo de servicio, monto mínimo, usos globales,
    // uso único por cliente, primer pedido y tope de descuento. Así el descuento que
    // vio el cliente es el que se cobra y no se puede saltar reglas posteando directo.
    // El descuento se calcula sobre el subtotal de productos, nunca sobre el envío.
    let descuentoValidado = 0;
    let codigoUsado: string | null = null;
    if (codigoPromo) {
      const validacion = await validarCodigoPromocional({
        codigo: String(codigoPromo),
        montoSubtotal: subtotal,
        tipoOrden: 'marketplace',
        clienteId: user.id,
        // #6: un cupón creado por una tienda solo vale en ESA tienda.
        tiendaId,
      });
      if (!validacion.ok) {
        return NextResponse.json({ error: validacion.error }, { status: validacion.status });
      }
      descuentoValidado = validacion.descuento;
      codigoUsado = validacion.promo.codigo;
    }

    // En retiro no se cobra envío: no hay reparto que pagar.
    const costoEnvio = modoEntrega === 'retiro' ? 0 : tienda.costoEnvio;
    const total = Math.max(0, subtotal + costoEnvio - descuentoValidado);

    const pinGenerado = String(Math.floor(1000 + Math.random() * 9000));

    // Transacción: crear orden + items + decrementar stock + usar código + crear OrdenServicio
    const result = await db.$transaction(async (tx) => {
      const ordenData: any = {
        clienteId: user.id,
        tiendaId,
        estado: 'recibido',
        modoEntrega,
        direccionEntrega: modoEntrega === 'retiro' ? `Retiro en tienda — ${tienda.nombre}` : direccionEntrega,
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        instrucciones: instrucciones ?? null,
        metodoPago,
        subtotal,
        costoEnvio,
        descuento: descuentoValidado,
        codigoUsado,
        total,
        codigoPin: pinGenerado,
        items: {
          create: itemsData,
        },
      };

      // 1. Crear orden de compra
      const orden = await (tx.ordenCompra.create as any)({
        data: ordenData,
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

      // #2: en modo retiro no existe envío que ofrecer — se sale antes de crear la
      // OrdenServicio y de publicar la oferta a los repartidores.
      if (modoEntrega === 'retiro') {
        return { orden, ordenServicio: null as null };
      }

      // 5. Crear OrdenServicio para el repartidor (tipo compra)
      const rawDestLat = Number(lat) || 0;
      const rawDestLng = Number(lng) || 0;
      let finalDestLat = rawDestLat;
      let finalDestLng = rawDestLng;
      if (finalDestLat === 0 && finalDestLng === 0) {
        const [gcLat, gcLng] = geocodeAddress(direccionEntrega);
        finalDestLat = gcLat;
        finalDestLng = gcLng;
      }

      let tLat = tienda.lat || 0;
      let tLng = tienda.lng || 0;
      if (tLat === 0 && tLng === 0 && tienda.direccion) {
        const [gcTLat, gcTLng] = geocodeAddress(tienda.direccion);
        tLat = gcTLat;
        tLng = gcTLng;
      }

      const km = (tLat !== 0 && tLng !== 0 && finalDestLat !== 0 && finalDestLng !== 0)
        ? calcularDistanciaHaversine(tLat, tLng, finalDestLat, finalDestLng)
        : 0;
      const tiempoEst = km > 0 ? calcularTiempoEstimado(km) : 0;

      const ordenServicioData: any = {
        clienteId: user.id,
        tipo: 'compra',
        estado: 'pendiente',
        origen: tienda.direccion,
        destino: direccionEntrega,
        origenLat: tLat,
        origenLng: tLng,
        destinoLat: finalDestLat,
        destinoLng: finalDestLng,
        tiendaId: tienda.id,
        tiendaNombre: tienda.nombre,
        metodoPago,
        monto: total,
        ganancia: Math.round(costoEnvio * 0.7),
        kmEstimados: km,
        tiempoEstimado: tiempoEst,
        codigoPin: pinGenerado,
        clienteNombre: user.name,
        clienteTelefono: user.telefono ?? null,
      };

      const ordenServicio = await tx.ordenServicio.create({
        data: ordenServicioData,
      });

      return { orden, ordenServicio };
    });

    // 1. Emitir eventos a Admin y Tienda
    emitirEventoRealtime({ room: 'admin', event: 'admin:orden:nueva', data: result.orden });
    emitirEventoRealtime({ room: `tienda:${tiendaId}`, event: 'tienda:orden:nueva', data: result.orden });

    // 2. Publicar a la bolsa de Ofertas Disponibles para todos los repartidores.
    //    Un pedido de retiro no tiene OrdenServicio, así que no se publica nada.
    if (result.ordenServicio) {
      emitOrdenCreada(result.ordenServicio);

    const repartidoresConectados = await db.repartidorProfile
      .findMany({
        where: { conectado: true, pausado: false, contratoAceptado: true },
        take: 25,
      })
      .catch(() => []);

    for (const rep of repartidoresConectados) {
      await db.notificacionRepartidor
        .create({
          data: {
            repartidorId: rep.id,
            tipo: 'nueva_orden_disponible',
            titulo: 'Nueva oferta de tienda disponible',
            contenido: `Pedido de ${tienda.nombre} — Total: C$${total} — Ganancia: +C$${Math.round(costoEnvio || (total * 0.2))}`,
            leido: false,
            ordenId: result.ordenServicio.id,
          },
        })
        .catch(() => null);
    }

    }

    // ─── #4 Recompensa: 5 compras en el mes calendario → cupón automático ───
    // El conteo es del mes en curso y cada mes estrena su propio código, así que el
    // mes siguiente no arrastra el contador anterior. Un fallo aquí no puede tumbar
    // una venta ya cobrada: por eso va fuera de la transacción y en try/catch.
    let recompensa = null as Awaited<ReturnType<typeof otorgarRecompensaMensual>>;
    try {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const comprasDelMes = await db.ordenCompra.count({
        where: { clienteId: user.id, createdAt: { gte: inicioMes }, estado: { not: 'cancelado' } },
      });
      recompensa = await otorgarRecompensaMensual(db, user.id, comprasDelMes);
    } catch (err) {
      console.error('[ordenes-compra] recompensa mensual', err);
    }

    const createdOrden = result.orden as any;
    return NextResponse.json(
      {
        message: 'Orden creada exitosamente',
        recompensa,
        orden: {
          id: createdOrden.id,
          tiendaId: createdOrden.tiendaId,
          tiendaNombre: createdOrden.tienda?.nombre || tienda.nombre,
          estado: createdOrden.estado,
          modoEntrega: createdOrden.modoEntrega || modoEntrega,
          total: createdOrden.total,
          subtotal: createdOrden.subtotal,
          costoEnvio: createdOrden.costoEnvio,
          descuento: createdOrden.descuento,
          metodoPago: createdOrden.metodoPago,
          direccionEntrega: createdOrden.direccionEntrega,
          codigoPin: pinGenerado,
          // En modo retiro no hay OrdenServicio: estos campos van en null y el cliente
          // no muestra repartidor ni estimación de entrega.
          origenLat: result.ordenServicio?.origenLat ?? null,
          origenLng: result.ordenServicio?.origenLng ?? null,
          destinoLat: result.ordenServicio?.destinoLat ?? null,
          destinoLng: result.ordenServicio?.destinoLng ?? null,
          kmEstimados: result.ordenServicio?.kmEstimados ?? null,
          tiempoEstimado: result.ordenServicio?.tiempoEstimado ?? null,
          clienteNombre: user.name,
          clienteTelefono: user.telefono ?? '',
          createdAt: createdOrden.createdAt,
          items: (createdOrden.items || []).map((it: any) => ({
            productoId: it.productoId,
            nombreProducto: it.nombreProducto,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
          })),
          ordenServicioId: result.ordenServicio?.id ?? null,
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
