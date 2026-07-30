import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { ok, fail } from '@/lib/auth/helpers';

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
        where: { propietarioId: user.id },
        include: { productos: true, ordenes: true },
      });

      if (tienda) {
        return ok({ ok: true, tienda });
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
 * Registra/crea una nueva tienda para el cliente (Afiliación de negocio).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return fail('Debes iniciar sesión para afiliar tu negocio', 401);
    }

    const body = await req.json();
    const {
      nombre,
      descripcion = '',
      categoria = 'tienda',
      direccion = 'Managua, Nicaragua',
      telefono = user.telefono || '',
      email = user.email || '',
      logoColor = '#FF5722',
      portadaColor = '#002A5C',
    } = body;

    if (!nombre || !nombre.trim()) {
      return fail('El nombre del negocio es obligatorio');
    }

    const initials = nombre
      .trim()
      .split(/\s+/)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    let tiendaRecord = {
      id: `tnd-${Date.now()}`,
      propietarioId: user.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria,
      logoColor,
      logoIniciales: initials,
      portadaColor,
      direccion,
      lat: 12.1365,
      lng: -86.2514,
      telefono,
      email,
      calificacion: 5.0,
      totalPedidos: 0,
      tiempoEstimado: '20-30 min',
      costoEnvio: 20,
      pedidoMinimo: 50,
      horario: JSON.stringify({
        lun: { abre: '08:00', cierra: '18:00' },
        mar: { abre: '08:00', cierra: '18:00' },
        mie: { abre: '08:00', cierra: '18:00' },
        jue: { abre: '08:00', cierra: '18:00' },
        vie: { abre: '08:00', cierra: '18:00' },
        sab: { abre: '09:00', cierra: '15:00' },
        dom: { abre: '', cierra: '' },
      }),
      zonaCobertura: JSON.stringify(['Managua Central', 'Los Robles', 'Altamira']),
      verificado: true,
      popular: false,
      estado: 'activo',
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await db.tienda.create({
        data: {
          propietarioId: user.id,
          nombre: tiendaRecord.nombre,
          descripcion: tiendaRecord.descripcion,
          categoria: tiendaRecord.categoria,
          logoColor: tiendaRecord.logoColor,
          logoIniciales: tiendaRecord.logoIniciales,
          portadaColor: tiendaRecord.portadaColor,
          direccion: tiendaRecord.direccion,
          lat: tiendaRecord.lat,
          lng: tiendaRecord.lng,
          telefono: tiendaRecord.telefono,
          email: tiendaRecord.email,
          calificacion: 5.0,
          totalPedidos: 0,
          tiempoEstimado: '20-30 min',
          costoEnvio: 20,
          pedidoMinimo: 50,
          horario: tiendaRecord.horario,
          zonaCobertura: tiendaRecord.zonaCobertura,
          verificado: true,
          popular: false,
          estado: 'activo',
        },
      });

      tiendaRecord = {
        ...tiendaRecord,
        id: created.id,
      };
    } catch (dbErr) {
      console.warn('[CLIENTE_TIENDA_POST_DB]', dbErr);
    }

    return ok({ ok: true, tienda: tiendaRecord }, 201);
  } catch (error) {
    console.error('[CLIENTE_TIENDA_POST]', error);
    return fail('Error al registrar la tienda negocio', 500);
  }
}
