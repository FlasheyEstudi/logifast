import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { geocodeAddress } from '@/lib/osrm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();

    // 1. Obtener todas las tiendas registradas (sin excluir las que tengan estado pendiente o coords 0)
    const tiendasDb = await db.tienda.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        categoria: true,
        lat: true,
        lng: true,
        direccion: true,
        telefono: true,
        logoColor: true,
        imagenUrl: true,
        calificacion: true,
        verificado: true,
        popular: true,
        estado: true,
      },
    });

    const tiendas = tiendasDb.map((t) => {
      let lat = t.lat;
      let lng = t.lng;

      // Si las coordenadas son 0 o nulas, auto-geocodificar basándose en la dirección
      if (!lat || !lng || (lat === 0 && lng === 0)) {
        const [geoLat, geoLng] = geocodeAddress(t.direccion || t.nombre);
        lat = geoLat;
        lng = geoLng;
      }

      return {
        id: t.id,
        tipo: 'tienda' as const,
        nombre: t.nombre,
        descripcion: t.descripcion,
        categoria: t.categoria,
        lat,
        lng,
        direccion: t.direccion,
        telefono: t.telefono,
        logoColor: t.logoColor || '#0066FF',
        imagenUrl: t.imagenUrl,
        calificacion: t.calificacion || 5.0,
        verificado: t.verificado ?? true,
        popular: t.popular ?? false,
        estado: t.estado || 'activo',
      };
    });

    // 2. Obtener todas las motos de la flota con datos del repartidor asignado
    let motosDb: any[] = [];
    try {
      motosDb = await db.moto.findMany({
        include: {
          repartidores: {
            include: {
              user: {
                select: { name: true, telefono: true, fotoUrl: true, color: true },
              },
            },
          },
        },
      });
    } catch {
      motosDb = [];
    }

    const motos = motosDb.map((m) => {
      let lat = m.lat;
      let lng = m.lng;
      if (!lat || !lng || (lat === 0 && lng === 0)) {
        lat = 12.114 + (Math.sin(m.id.charCodeAt(0) || 1) * 0.03);
        lng = -86.236 + (Math.cos(m.id.charCodeAt(0) || 1) * 0.03);
      }

      const assignedRep = m.repartidores?.[0];

      return {
        id: m.id,
        tipo: 'moto' as const,
        nombre: m.nombre || m.modelo || 'Moto',
        modelo: m.modelo || 'Moto',
        placa: m.placa,
        anio: m.anio,
        estado: m.estado || 'available',
        lat,
        lng,
        km: m.kmAcumulados ?? m.km ?? 0,
        repartidorAsignado: assignedRep?.nombre || assignedRep?.user?.name || null,
        repartidorTelefono: assignedRep?.telefono || assignedRep?.user?.telefono || null,
        fotoUrl: assignedRep?.user?.fotoUrl || null,
        color: m.color || '#FF5722',
      };
    });

    // 3. Obtener todos los repartidores activos / en línea
    const repartidoresDb = await db.repartidorProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            telefono: true,
            fotoUrl: true,
            color: true,
            initials: true,
          },
        },
        moto: true,
      },
    });

    const repartidoresPuntos = repartidoresDb.map((r) => {
      let lat = r.lat;
      let lng = r.lng;
      if (!lat || !lng || (lat === 0 && lng === 0)) {
        lat = 12.126 + (Math.sin(r.id.charCodeAt(0) || 2) * 0.03);
        lng = -86.248 + (Math.cos(r.id.charCodeAt(0) || 2) * 0.03);
      }

      return {
        id: r.id,
        tipo: 'repartidor' as const,
        nombre: r.nombre || r.user?.name || 'Repartidor',
        vehiculoTipo: r.vehiculoTipo || 'Moto',
        vehiculoPlaca: r.vehiculoPlaca || r.moto?.placa || 'En servicio',
        telefono: r.telefono || r.user?.telefono || '',
        lat,
        lng,
        conectado: r.conectado,
        enServicio: r.enServicio,
        estado: r.enServicio ? 'in-service' : r.conectado ? 'available' : 'offline',
        calificacion: r.calificacion || 5.0,
        totalEntregas: r.totalEntregas || 0,
        fotoUrl: r.user?.fotoUrl || (r as any).fotoUrl || null,
        initials: r.user?.initials || (r.nombre ? r.nombre.slice(0, 2).toUpperCase() : 'RP'),
        color: r.user?.color || '#10B981',
      };
    });

    // 4. Obtener direcciones de clientes
    let direccionesClienteWhere: any = {};
    if (user && user.role === 'cliente') {
      direccionesClienteWhere.clienteId = user.id;
    }

    const direccionesDb = await db.direccionCliente.findMany({
      where: direccionesClienteWhere,
      take: 60,
      select: {
        id: true,
        clienteId: true,
        etiqueta: true,
        direccion: true,
        referencia: true,
        lat: true,
        lng: true,
        cliente: {
          select: {
            name: true,
            telefono: true,
          },
        },
      },
    });

    const clientePuntos = direccionesDb.map((d) => {
      let lat = d.lat;
      let lng = d.lng;
      if (!lat || !lng || (lat === 0 && lng === 0)) {
        const [geoLat, geoLng] = geocodeAddress(d.direccion);
        lat = geoLat;
        lng = geoLng;
      }
      return {
        id: d.id,
        tipo: 'cliente_direccion' as const,
        etiqueta: d.etiqueta,
        nombreCliente: d.cliente?.name || 'Cliente',
        telefono: d.cliente?.telefono || '',
        direccion: d.direccion,
        referencia: d.referencia,
        lat,
        lng,
      };
    });

    // 5. Órdenes activas con coordenadas
    const ordenesActivasDb = await db.ordenServicio.findMany({
      where: {
        estado: { in: ['pendiente', 'asignado', 'aceptado', 'en_camino', 'recogido', 'en_punto_recogida', 'en_punto_entrega'] },
      },
      select: {
        id: true,
        tipo: true,
        origen: true,
        destino: true,
        origenLat: true,
        origenLng: true,
        destinoLat: true,
        destinoLng: true,
        estado: true,
        repartidorId: true,
        clienteNombre: true,
        monto: true,
      },
      take: 30,
    });

    return NextResponse.json(
      {
        ok: true,
        tiendas,
        motos,
        repartidoresPuntos,
        clientePuntos,
        ordenesActivas: ordenesActivasDb,
        totalPuntos: tiendas.length + motos.length + repartidoresPuntos.length + clientePuntos.length,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[API_MAPA_PUNTOS_ERROR]', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener puntos del mapa' },
      { status: 500 }
    );
  }
}
