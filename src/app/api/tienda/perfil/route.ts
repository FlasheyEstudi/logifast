import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

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
      where: { propietarioId: user.id },
      include: {
        productos: {
          orderBy: { posicion: 'asc' },
        },
      },
    });

    if (!tienda) {
      // Auto-crear tienda demo para el comercio si no existe
      tienda = await db.tienda.create({
        data: {
          nombre: `Tienda de ${user.name}`,
          categoria: 'tienda',
          propietarioId: user.id,
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
        include: {
          productos: true,
        },
      });
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
      where: { propietarioId: user.id },
    });

    if (!tienda) {
      return NextResponse.json({ ok: false, error: 'Tienda no encontrada' }, { status: 404 });
    }

    const updated = await db.tienda.update({
      where: { id: tienda.id },
      data: {
        nombre: typeof nombre === 'string' && nombre.trim() ? nombre.trim() : undefined,
        descripcion: typeof descripcion === 'string' ? descripcion.trim() : undefined,
        categoria: typeof categoria === 'string' && categoria.trim() ? categoria.trim() : undefined,
        direccion: typeof direccion === 'string' && direccion.trim() ? direccion.trim() : undefined,
        telefono: typeof telefono === 'string' ? telefono.trim() : undefined,
        email: typeof email === 'string' ? email.trim() : undefined,
        whatsapp: typeof whatsapp === 'string' ? whatsapp.trim() : undefined,
        ruc: typeof ruc === 'string' ? ruc.trim() : undefined,
        razonSocial: typeof razonSocial === 'string' ? razonSocial.trim() : undefined,
        regimenDgi: typeof regimenDgi === 'string' ? regimenDgi.trim() : undefined,
        saludoFactura: typeof saludoFactura === 'string' ? saludoFactura.trim() : undefined,
        piePaginaFactura: typeof piePaginaFactura === 'string' ? piePaginaFactura.trim() : undefined,
        serieFactura: typeof serieFactura === 'string' ? serieFactura.trim() : undefined,
        imagenUrl: typeof imagenUrl === 'string' ? imagenUrl.trim() : undefined,
        bannerUrl: typeof bannerUrl === 'string' ? bannerUrl.trim() : undefined,
        costoEnvio: typeof costoEnvio === 'number' ? costoEnvio : undefined,
        pedidoMinimo: typeof pedidoMinimo === 'number' ? pedidoMinimo : undefined,
        horario: typeof horario === 'string' ? horario.trim() : undefined,
        estado: typeof estado === 'string' ? estado.trim() : undefined,
      },
    });

    return NextResponse.json({ ok: true, tienda: updated });
  } catch (error) {
    console.error('[TIENDA_PERFIL_PATCH_ERROR]', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar perfil de tienda' }, { status: 500 });
  }
}
