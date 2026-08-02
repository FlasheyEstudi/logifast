import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ordenes/[id]/tracking
 * Devuelve información en tiempo real para el seguimiento del envío de un cliente.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    // Buscar si es una OrdenServicio (Envío)
    const ordenServicio = await db.ordenServicio.findUnique({
      where: { id },
      include: {
        repartidor: true,
        cliente: { select: { name: true, telefono: true } },
      },
    });

    if (ordenServicio) {
      // Ownership check: solo el cliente dueño, repartidor asignado o admin
      if (user.role === 'cliente' && ordenServicio.clienteId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      if (user.role === 'repartidor') {
        const myProfile = await db.repartidorProfile.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (!myProfile || ordenServicio.repartidorId !== myProfile.id) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }
      }
      if (user.role !== 'cliente' && user.role !== 'repartidor' && user.role !== 'admin' && user.role !== 'ingeniero') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      // Si tiene repartidor asignado, obtener la posición en tiempo real
      let repartidorPos: { lat: number; lng: number } | null = null;
      let repartidorInfo: any = null;

      if (ordenServicio.repartidorId) {
        const profile = await db.repartidorProfile.findUnique({
          where: { id: ordenServicio.repartidorId },
          include: { user: { select: { name: true, telefono: true, fotoUrl: true } } },
        });

        if (profile) {
          repartidorPos = {
            lat: profile.lat ?? 12.1364,
            lng: profile.lng ?? -86.2581,
          };
          repartidorInfo = {
            nombre: profile.nombre || profile.user?.name || 'Repartidor',
            telefono: profile.telefono || profile.user?.telefono || '',
            fotoUrl: profile.user?.fotoUrl || null,
            calificacion: profile.calificacion || 4.9,
            totalEntregas: profile.totalEntregas || 100,
          };
        }
      }

      return NextResponse.json({
        tipo: 'envio',
        orden: {
          id: ordenServicio.id,
          estado: ordenServicio.estado,
          origen: ordenServicio.origen,
          destino: ordenServicio.destino,
          origenLat: ordenServicio.origenLat,
          origenLng: ordenServicio.origenLng,
          destinoLat: ordenServicio.destinoLat,
          destinoLng: ordenServicio.destinoLng,
          paquete: ordenServicio.paquete,
          tamano: ordenServicio.tamano,
          monto: ordenServicio.monto,
          metodoPago: ordenServicio.metodoPago,
          createdAt: ordenServicio.createdAt,
          aceptadoEn: ordenServicio.aceptadoEn,
          recogidoEn: ordenServicio.recogidoEn,
          entregadoEn: ordenServicio.entregadoEn,
        },
        repartidor: repartidorInfo,
        repartidorPos,
      });
    }

    // Si no es envío, buscar si es OrdenCompra (Marketplace)
    const ordenCompra = await db.ordenCompra.findUnique({
      where: { id },
      include: {
        tienda: true,
        items: true,
      },
    });

    if (ordenCompra) {
      // Ownership check para orden de compra
      if (user.role === 'cliente' && ordenCompra.clienteId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      if (user.role === 'repartidor' && ordenCompra.repartidorId) {
        const myProfile = await db.repartidorProfile.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (!myProfile || ordenCompra.repartidorId !== myProfile.id) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }
      }
      if (user.role !== 'cliente' && user.role !== 'repartidor' && user.role !== 'admin' && user.role !== 'ingeniero') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      let repartidorPos: { lat: number; lng: number } | null = null;
      let repartidorInfo: any = null;

      if (ordenCompra.repartidorId) {
        const profile = await db.repartidorProfile.findUnique({
          where: { id: ordenCompra.repartidorId },
        });
        if (profile) {
          repartidorPos = {
            lat: profile.lat ?? 12.1364,
            lng: profile.lng ?? -86.2581,
          };
          repartidorInfo = {
            nombre: profile.nombre,
            telefono: profile.telefono ?? '',
            calificacion: profile.calificacion,
          };
        }
      }

      return NextResponse.json({
        tipo: 'compra',
        orden: {
          id: ordenCompra.id,
          estado: ordenCompra.estado,
          origen: ordenCompra.tienda.nombre,
          destino: ordenCompra.direccionEntrega,
          origenLat: ordenCompra.tienda.lat,
          origenLng: ordenCompra.tienda.lng,
          destinoLat: ordenCompra.lat,
          destinoLng: ordenCompra.lng,
          total: ordenCompra.total,
          items: ordenCompra.items,
          metodoPago: ordenCompra.metodoPago,
          createdAt: ordenCompra.createdAt,
        },
        repartidor: repartidorInfo,
        repartidorPos,
      });
    }

    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  } catch (error) {
    console.error('[TRACKING_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener seguimiento' }, { status: 500 });
  }
}
