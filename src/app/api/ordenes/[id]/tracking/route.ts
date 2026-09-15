import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { geocodeAddress } from '@/lib/osrm';

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
          if (profile.lat && profile.lng && profile.lat !== 0 && profile.lng !== 0) {
            repartidorPos = {
              lat: profile.lat,
              lng: profile.lng,
            };
          }
          repartidorInfo = {
            nombre: profile.nombre || profile.user?.name || 'Repartidor',
            telefono: profile.telefono || profile.user?.telefono || '',
            fotoUrl: profile.user?.fotoUrl || null,
            calificacion: profile.calificacion || 4.9,
            totalEntregas: profile.totalEntregas || 100,
          };
        }
      }

      const st = (ordenServicio.estado || '').toLowerCase();
      const driverEstado = st === 'entregado'
        ? 'ENTREGADO'
        : st === 'recogido'
          ? 'RECOGIDO'
          : (st === 'en_camino' || st === 'encamino' || st === 'aceptado' || st === 'aceptada')
            ? 'EN_CAMINO_RECOGER'
            : 'ORDEN_ASIGNADA';

      let oLat = ordenServicio.origenLat;
      let oLng = ordenServicio.origenLng;
      let dLat = ordenServicio.destinoLat;
      let dLng = ordenServicio.destinoLng;

      if ((!oLat || oLat === 0) && ordenServicio.origen) {
        const [gcLat, gcLng] = geocodeAddress(ordenServicio.origen);
        oLat = gcLat;
        oLng = gcLng;
      }
      if ((!dLat || dLat === 0) && ordenServicio.destino) {
        const [gcLat, gcLng] = geocodeAddress(ordenServicio.destino);
        dLat = gcLat;
        dLng = gcLng;
      }

      return NextResponse.json({
        tipo: 'envio',
        orden: {
          id: ordenServicio.id,
          estado: ordenServicio.estado,
          origen: ordenServicio.origen,
          destino: ordenServicio.destino,
          origenLat: oLat,
          origenLng: oLng,
          destinoLat: dLat,
          destinoLng: dLng,
          paquete: ordenServicio.paquete,
          tamano: ordenServicio.tamano,
          fragil: ordenServicio.fragil,
          monto: ordenServicio.monto,
          metodoPago: ordenServicio.metodoPago,
          codigoPin: (ordenServicio as any).codigoPin,
          kmEstimados: ordenServicio.kmEstimados,
          tiempoEstimado: ordenServicio.tiempoEstimado,
          clienteNombre: ordenServicio.clienteNombre || ordenServicio.cliente?.name,
          clienteTelefono: ordenServicio.clienteTelefono || ordenServicio.cliente?.telefono,
          createdAt: ordenServicio.createdAt,
          aceptadoEn: ordenServicio.aceptadoEn,
          recogidoEn: ordenServicio.recogidoEn,
          entregadoEn: ordenServicio.entregadoEn,
          incidenciaTipo: ordenServicio.incidenciaTipo,
          incidenciaDesc: ordenServicio.incidenciaDesc,
        },
        repartidor: repartidorInfo,
        repartidorPos,
        driverEstado,
      });
    }

    // Si no es envío, buscar si es OrdenCompra (Marketplace)
    const ordenCompra = await db.ordenCompra.findUnique({
      where: { id },
      include: {
        tienda: true,
        items: true,
        cliente: { select: { name: true, telefono: true } },
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
          include: { user: { select: { name: true, telefono: true, fotoUrl: true } } },
        });
        if (profile) {
          if (profile.lat && profile.lng && profile.lat !== 0 && profile.lng !== 0) {
            repartidorPos = {
              lat: profile.lat,
              lng: profile.lng,
            };
          }
          repartidorInfo = {
            nombre: profile.nombre || profile.user?.name || 'Repartidor',
            telefono: profile.telefono || profile.user?.telefono || '',
            calificacion: profile.calificacion || 5.0,
            fotoUrl: profile.user?.fotoUrl || null,
          };
        }
      }

      const stCompra = (ordenCompra.estado || '').toLowerCase();
      const driverEstado = stCompra === 'entregado'
        ? 'ENTREGADO'
        : stCompra === 'recogido'
          ? 'RECOGIDO'
          : (stCompra === 'en_camino' || stCompra === 'encamino' || stCompra === 'aceptado')
            ? 'EN_CAMINO_RECOGER'
            : 'ORDEN_ASIGNADA';

      let tLat = ordenCompra.tienda.lat || 0;
      let tLng = ordenCompra.tienda.lng || 0;
      if ((tLat === 0 || tLng === 0) && ordenCompra.tienda.direccion) {
        const [gcTLat, gcTLng] = geocodeAddress(ordenCompra.tienda.direccion);
        tLat = gcTLat;
        tLng = gcTLng;
      }

      let dLat = ordenCompra.lat || 0;
      let dLng = ordenCompra.lng || 0;
      if ((dLat === 0 || dLng === 0) && ordenCompra.direccionEntrega) {
        const [gcDLat, gcDLng] = geocodeAddress(ordenCompra.direccionEntrega);
        dLat = gcDLat;
        dLng = gcDLng;
      }

      return NextResponse.json({
        tipo: 'compra',
        orden: {
          id: ordenCompra.id,
          estado: ordenCompra.estado,
          origen: ordenCompra.tienda.nombre,
          destino: ordenCompra.direccionEntrega,
          origenLat: tLat,
          origenLng: tLng,
          destinoLat: dLat,
          destinoLng: dLng,
          subtotal: ordenCompra.subtotal,
          costoEnvio: ordenCompra.costoEnvio,
          descuento: ordenCompra.descuento,
          codigoUsado: ordenCompra.codigoUsado,
          instrucciones: ordenCompra.instrucciones,
          total: ordenCompra.total,
          items: ordenCompra.items,
          metodoPago: ordenCompra.metodoPago,
          codigoPin: (ordenCompra as any).codigoPin ?? '',
          clienteNombre: ordenCompra.cliente?.name || 'Cliente',
          clienteTelefono: ordenCompra.cliente?.telefono || '',
          createdAt: ordenCompra.createdAt,
          incidenciaTipo: (ordenCompra as any).incidenciaTipo,
          incidenciaDesc: (ordenCompra as any).incidenciaDesc,
        },
        repartidor: repartidorInfo,
        repartidorPos,
        driverEstado,
      });
    }

    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  } catch (error) {
    console.error('[TRACKING_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener seguimiento' }, { status: 500 });
  }
}
