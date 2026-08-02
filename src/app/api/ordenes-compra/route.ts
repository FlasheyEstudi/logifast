import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { emitOrdenCreada } from '@/lib/realtime-emitter';

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
 * Crea una nueva orden de compra con validación de auth, stock transaccional y re-validación server-side de promociones.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'cliente') {
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

    const result = await db.$transaction(async (tx) => {
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
        const producto = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (!producto) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.productoId}`);
        }
        if (!producto.disponible) {
          throw new Error(`PRODUCT_NOT_AVAILABLE:${producto.nombre}`);
        }

        const cantidad = Number(item.cantidad ?? 1);
        if (producto.stock !== null && producto.stock < cantidad) {
          throw new Error(`INSUFFICIENT_STOCK:${producto.nombre}`);
        }

        if (producto.stock !== null) {
          await tx.producto.update({
            where: { id: producto.id },
            data: { stock: { decrement: cantidad } },
          });
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

      // Re-validar código promocional server-side
      let descuentoCalculado = 0;
      let codigoPromoObj: any = null;
      if (codigoPromo) {
        codigoPromoObj = await tx.codigoPromocional.findUnique({ where: { codigo: String(codigoPromo) } });
        if (codigoPromoObj && codigoPromoObj.estado === 'activo') {
          const now = new Date();
          if (now >= codigoPromoObj.vigenciaInicio && now <= codigoPromoObj.vigenciaFin) {
            if (codigoPromoObj.maxUsos === 0 || codigoPromoObj.usosActuales < codigoPromoObj.maxUsos) {
              if (codigoPromoObj.tipoDescuento === 'porcentaje') {
                descuentoCalculado = Math.round((subtotal * codigoPromoObj.valor) / 100);
              } else {
                descuentoCalculado = codigoPromoObj.valor;
              }

              await tx.codigoPromocional.update({
                where: { id: codigoPromoObj.id },
                data: { usosActuales: { increment: 1 } },
              });

              await tx.usoCodigo.create({
                data: {
                  codigoId: codigoPromoObj.id,
                  userId: user.id,
                  descuento: descuentoCalculado,
                },
              }).catch(() => null);
            }
          }
        }
      }

      const costoEnvio = tienda.costoEnvio;
      const total = Math.max(0, subtotal + costoEnvio - descuentoCalculado);

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
          descuento: descuentoCalculado,
          codigoUsado: codigoPromoObj ? codigoPromoObj.codigo : null,
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

      await tx.tienda.update({
        where: { id: tiendaId },
        data: { totalPedidos: { increment: 1 } },
      });

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

    emitOrdenCreada(result.ordenServicio);

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
          contenido: `Orden #${result.orden.id.slice(-6)} — ${tienda.nombre}`,
          leido: false,
          ordenId: result.ordenServicio.id,
        },
      }).catch(() => null);
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
  } catch (error: any) {
    if (error.message?.startsWith('INSUFFICIENT_STOCK:')) {
      const name = error.message.split('INSUFFICIENT_STOCK:')[1];
      return NextResponse.json({ error: `Stock insuficiente para: ${name}` }, { status: 400 });
    }
    if (error.message?.startsWith('PRODUCT_NOT_AVAILABLE:')) {
      const name = error.message.split('PRODUCT_NOT_AVAILABLE:')[1];
      return NextResponse.json({ error: `Producto no disponible: ${name}` }, { status: 400 });
    }
    if (error.message?.startsWith('PRODUCT_NOT_FOUND:')) {
      const id = error.message.split('PRODUCT_NOT_FOUND:')[1];
      return NextResponse.json({ error: `Producto no encontrado: ${id}` }, { status: 404 });
    }
    console.error('Error creando orden de compra:', error);
    return NextResponse.json(
      { error: 'Error al crear la orden de compra' },
      { status: 500 }
    );
  }
}
