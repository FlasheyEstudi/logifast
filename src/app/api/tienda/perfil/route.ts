import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { geocodeAddress } from '@/lib/osrm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tienda/perfil
 * Devuelve el perfil completo de la tienda asociada al usuario autenticado.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }

    let tienda = await db.tienda.findFirst({
      where: {
        OR: [
          { propietarioId: user.id },
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        categoria: true,
        direccion: true,
        lat: true,
        lng: true,
        telefono: true,
        email: true,
        whatsapp: true,
        ruc: true,
        razonSocial: true,
        regimenDgi: true,
        saludoFactura: true,
        piePaginaFactura: true,
        serieFactura: true,
        imagenUrl: true,
        logoIniciales: true,
        bannerUrl: true,
        calificacion: true,
        totalPedidos: true,
        costoEnvio: true,
        pedidoMinimo: true,
        horario: true,
        estado: true,
        propietarioId: true,
      },
    });

    if (!tienda) {
      // Auto-crear tienda demo vinculada al usuario si no existe
      const nueva = await db.tienda.create({
        data: {
          nombre: `Tienda de ${user.name}`,
          categoria: 'tienda',
          propietarioId: user.id,
          email: user.email || '',
          direccion: 'Managua, Nicaragua',
          lat: 12.1365,
          lng: -86.2514,
          horario: '8:00 AM - 6:00 PM',
          logoIniciales: user.initials || 'TN',
          ruc: 'J0310000000000',
          razonSocial: `${user.name} Comercial`,
          regimenDgi: 'Cuota Fija',
          saludoFactura: '¡Gracias por su compra en LogiFast Partner!',
          piePaginaFactura: 'Conservar este comprobante para cualquier garantía.',
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          categoria: true,
          direccion: true,
          lat: true,
          lng: true,
          telefono: true,
          email: true,
          whatsapp: true,
          ruc: true,
          razonSocial: true,
          regimenDgi: true,
          saludoFactura: true,
          piePaginaFactura: true,
          serieFactura: true,
          imagenUrl: true,
          logoIniciales: true,
          bannerUrl: true,
          calificacion: true,
          totalPedidos: true,
          costoEnvio: true,
          pedidoMinimo: true,
          horario: true,
          estado: true,
          propietarioId: true,
        },
      });
      tienda = nueva;
    }

    return NextResponse.json({ ok: true, tienda });
  } catch (error) {
    console.error('[TIENDA_PERFIL_GET_ERROR]', error);
    return NextResponse.json({ ok: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/tienda/perfil
 * Actualiza la información fiscal y comercial de la tienda.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
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
      whatsapp,
      ruc,
      razonSocial,
      regimenDgi,
      saludoFactura,
      piePaginaFactura,
      serieFactura,
      imagenUrl,
      bannerUrl,
      costoEnvio,
      pedidoMinimo,
      horario,
      estado,
    } = body;

    const tienda = await db.tienda.findFirst({
      where: {
        OR: [
          { propietarioId: user.id },
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
      select: { id: true },
    });

    if (!tienda) {
      return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const updated = await db.tienda.update({
      where: { id: tienda.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(direccion !== undefined && { direccion }),
        ...(lat !== undefined ? { lat: parseFloat(lat) || (direccion ? geocodeAddress(direccion)[0] : 12.1365) } : (direccion ? { lat: geocodeAddress(direccion)[0] } : {})),
        ...(lng !== undefined ? { lng: parseFloat(lng) || (direccion ? geocodeAddress(direccion)[1] : -86.2514) } : (direccion ? { lng: geocodeAddress(direccion)[1] } : {})),
        ...(telefono !== undefined && { telefono }),
        ...(email !== undefined && { email }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(ruc !== undefined && { ruc }),
        ...(razonSocial !== undefined && { razonSocial }),
        ...(regimenDgi !== undefined && { regimenDgi }),
        ...(saludoFactura !== undefined && { saludoFactura }),
        ...(piePaginaFactura !== undefined && { piePaginaFactura }),
        ...(serieFactura !== undefined && { serieFactura }),
        ...(imagenUrl !== undefined && { imagenUrl }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(costoEnvio !== undefined && { costoEnvio: parseFloat(costoEnvio) || 0 }),
        ...(pedidoMinimo !== undefined && { pedidoMinimo: parseFloat(pedidoMinimo) || 0 }),
        ...(horario !== undefined && { horario }),
        ...(estado !== undefined && { estado }),
      },
    });

    return NextResponse.json({ ok: true, tienda: updated });
  } catch (error) {
    console.error('[TIENDA_PERFIL_PATCH_ERROR]', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
