import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();

    // 1. Obtener todas las tiendas activas con coordenadas GPS válidas
    const tiendasDb = await db.tienda.findMany({
      where: {
        estado: 'activo',
        lat: { not: 0 },
        lng: { not: 0 },
      },
      select: {
        id: true,
        nombre: true,
        categoria: true,
        lat: true,
        lng: true,
        direccion: true,
        telefono: true,
        logoColor: true,
        imagenUrl: true,
        calificacion: true,
      },
    });

    const tiendas = tiendasDb.map((t) => ({
      id: t.id,
      tipo: 'tienda',
      nombre: t.nombre,
      categoria: t.categoria,
      lat: t.lat ?? 12.1365,
      lng: t.lng ?? -86.2514,
      direccion: t.direccion,
      telefono: t.telefono,
      logoColor: t.logoColor || '#0066FF',
      imagenUrl: t.imagenUrl,
      calificacion: t.calificacion || 5.0,
    }));

    // 2. Obtener direcciones de clientes con GPS válido
    let direccionesClienteWhere: any = {
      lat: { not: 0 },
      lng: { not: 0 },
    };

    // Si es un cliente común, solo ve sus propias direcciones guardadas
    if (user && user.role === 'cliente') {
      direccionesClienteWhere.clienteId = user.id;
    }

    const direccionesDb = await db.direccionCliente.findMany({
      where: direccionesClienteWhere,
      take: 50,
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

    const clientePuntos = direccionesDb.map((d) => ({
      id: d.id,
      tipo: 'cliente_direccion',
      etiqueta: d.etiqueta,
      nombreCliente: d.cliente?.name || 'Cliente',
      telefono: d.cliente?.telefono || '',
      direccion: d.direccion,
      referencia: d.referencia,
      lat: d.lat ?? 12.1365,
      lng: d.lng ?? -86.2514,
    }));

    // 3. Obtener repartidores conectados
    const repartidoresDb = await db.repartidorProfile.findMany({
      where: {
        conectado: true,
        lat: { not: 0 },
        lng: { not: 0 },
      },
      select: {
        id: true,
        nombre: true,
        vehiculoTipo: true,
        lat: true,
        lng: true,
        user: {
          select: {
            fotoUrl: true,
            color: true,
          },
        },
      },
    });

    const repartidoresPuntos = repartidoresDb.map((r) => ({
      id: r.id,
      tipo: 'repartidor',
      nombre: r.nombre,
      vehiculoTipo: r.vehiculoTipo || 'moto',
      lat: r.lat ?? 12.1365,
      lng: r.lng ?? -86.2514,
      fotoUrl: r.user?.fotoUrl || null,
      color: r.user?.color || '#10B981',
    }));

    return NextResponse.json(
      {
        ok: true,
        tiendas,
        clientePuntos,
        repartidoresPuntos,
        totalPuntos: tiendas.length + clientePuntos.length + repartidoresPuntos.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
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
