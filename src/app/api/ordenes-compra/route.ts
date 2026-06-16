import { NextRequest, NextResponse } from 'next/server';
import {
  MOCK_ORDENES_COMPRA,
  MOCK_TIENDAS,
  MOCK_PRODUCTOS,
  type OrdenCompra,
} from '@/lib/marketplace-store';

let ordenCounter = 100;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('clienteId');
    const estado = searchParams.get('estado');
    const tiendaId = searchParams.get('tiendaId');

    let ordenes = [...MOCK_ORDENES_COMPRA];

    if (clienteId) {
      ordenes = ordenes.filter((o) => o.clienteId === clienteId);
    }

    if (estado) {
      ordenes = ordenes.filter((o) => o.estado === estado);
    }

    if (tiendaId) {
      ordenes = ordenes.filter((o) => o.tiendaId === tiendaId);
    }

    // Sort by date descending (most recent first)
    ordenes.sort(
      (a, b) =>
        new Date(`${b.fecha}T${b.hora}`).getTime() -
        new Date(`${a.fecha}T${a.hora}`).getTime()
    );

    return NextResponse.json({
      total: ordenes.length,
      ordenes,
    });
  } catch (error) {
    console.error('Error fetching órdenes de compra:', error);
    return NextResponse.json(
      { error: 'Error al obtener las órdenes de compra' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tiendaId,
      items,
      direccionEntrega,
      metodoPago,
      codigoPromo,
      descuento = 0,
    } = body;

    // Validate required fields
    if (!tiendaId || !items || !items.length || !direccionEntrega || !metodoPago) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: tiendaId, items, direccionEntrega, metodoPago' },
        { status: 400 }
      );
    }

    // Find tienda
    const tienda = MOCK_TIENDAS.find((t) => t.id === tiendaId);
    if (!tienda) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    // Validate items and calculate subtotal
    let subtotal = 0;
    const validatedItems: { nombreProducto: string; cantidad: number; precioUnitario: number }[] = [];

    for (const item of items) {
      const producto = MOCK_PRODUCTOS.find((p) => p.id === item.productoId);
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
      validatedItems.push({
        nombreProducto: producto.nombre,
        cantidad: item.cantidad ?? 1,
        precioUnitario: producto.precio,
      });
      subtotal += producto.precio * (item.cantidad ?? 1);
    }

    const costoEnvio = tienda.costoEnvio;
    const total = subtotal + costoEnvio - descuento;

    ordenCounter++;
    const orderId = `LF-C${ordenCounter.toString().padStart(3, '0')}`;

    const newOrden: OrdenCompra = {
      id: orderId,
      clienteId: 'cliente-1',
      tiendaId,
      tiendaNombre: tienda.nombre,
      tiendaLogo: tienda.logoIniciales,
      tiendaColor: tienda.logoColor,
      estado: 'recibido',
      direccionEntrega,
      metodoPago,
      items: validatedItems,
      subtotal,
      costoEnvio,
      descuento,
      total,
      codigoUsado: codigoPromo || undefined,
      repartidorNombre: 'Carlos Mendoza',
      repartidorInitials: 'CM',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // In a real app this would persist to DB; for now return the mock
    return NextResponse.json(
      {
        message: 'Orden creada exitosamente',
        orden: newOrden,
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
