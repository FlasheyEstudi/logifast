import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/helpers';
import { geocodeAddress } from '@/lib/osrm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/tienda
 * Devuelve la tienda afiliada del cliente autenticado.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, tienda: null, message: 'No autenticado' }, { status: 200 });
    }

    try {
      const tienda = await db.tienda.findFirst({
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
          _count: {
            select: {
              productos: true,
              ordenes: true,
            },
          },
        },
      });

      if (tienda) {
        const { _count, ...rest } = tienda;
        const tiendaConStats = {
          ...rest,
          stats: {
            totalProductos: _count?.productos ?? 0,
            ordenesActivas: 0,
            totalPedidos: rest.totalPedidos ?? (_count?.ordenes ?? 0),
            ingresos: 0,
          },
        };

        return ok({ ok: true, tienda: tiendaConStats });
      }
    } catch (dbErr) {
      console.warn('[CLIENTE_TIENDA_GET_DB]', dbErr);
    }

    return ok({ ok: true, tienda: null });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_GET]', error);
    return ok({ ok: true, tienda: null });
  }
}

/**
 * POST /api/cliente/tienda
 * Crea una nueva tienda afiliada para el cliente autenticado.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return fail('No autorizado', 401);
    }

    const body = await req.json();
    const { nombre, descripcion, categoria, direccion, lat, lng, ruc, whatsapp, telefono } = body;

    if (!nombre || !categoria || !direccion) {
      return fail('Faltan campos obligatorios (nombre, categoría, dirección)');
    }

    // Verificar si ya tiene tienda
    const existente = await db.tienda.findFirst({
      where: {
        OR: [
          { propietarioId: user.id },
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
      select: { id: true },
    });

    if (existente) {
      return fail('El usuario ya tiene una tienda registrada');
    }

    const [geoLat, geoLng] = geocodeAddress(direccion || nombre);

    const nuevaTienda = await db.tienda.create({
      data: {
        nombre,
        descripcion: descripcion || '',
        categoria: categoria || 'tienda',
        direccion,
        lat: parseFloat(lat) || geoLat || 12.1365,
        lng: parseFloat(lng) || geoLng || -86.2514,
        propietarioId: user.id,
        email: user.email || '',
        telefono: telefono || '',
        whatsapp: whatsapp || '',
        ruc: ruc || '',
        horario: '8:00 AM - 6:00 PM',
        logoIniciales: (nombre || 'NT').substring(0, 2).toUpperCase(),
        saludoFactura: `¡Gracias por comprar en ${nombre}!`,
        piePaginaFactura: 'Comprobante emitido por LogiFast Partner.',
      },
    });

    return ok({ ok: true, tienda: nuevaTienda, message: 'Tienda creada exitosamente' });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_POST]', error);
    return fail('Error al crear la tienda', 500);
  }
}
