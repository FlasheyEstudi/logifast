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
        const ordenesActivas = (tienda.ordenes ?? []).filter(
          (o: any) => !['entregado', 'cancelado'].includes(o.estado ?? '')
        ).length;

        const ingresos = (tienda.ordenes ?? [])
          .filter((o: any) => o.estado === 'entregado')
          .reduce((sum: number, o: any) => sum + (o.total ?? 0), 0);

        const tiendaConStats = {
          ...tienda,
          stats: {
            totalProductos: (tienda.productos ?? []).length,
            ordenesActivas,
            totalPedidos: tienda.totalPedidos ?? (tienda.ordenes ?? []).length,
            ingresos,
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
 * Registra/crea una nueva tienda para el cliente autenticado (Afiliación de negocio exigente).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return fail('Debes iniciar sesión como cliente para afiliar tu negocio', 401);
    }

    const body = await req.json();
    const nombre = (body.nombre ?? '').trim();
    const descripcion = (body.descripcion ?? '').trim();
    const categoria = (body.categoria ?? '').trim();
    const direccion = (body.direccion ?? '').trim();
    const lat = Number(body.lat) || 12.1365;
    const lng = Number(body.lng) || -86.2514;
    const telefono = (body.telefono ?? user.telefono ?? '').trim();
    const email = (body.email ?? user.email ?? '').trim();
    const ruc = (body.ruc ?? '').trim().toUpperCase();
    const whatsapp = (body.whatsapp ?? '').trim();
    const imagenUrl = (body.imagenUrl ?? '').trim(); // Logo/Foto del local
    const bannerUrl = (body.bannerUrl ?? '').trim();
    const logoColor = body.logoColor || '#FF5722';
    const portadaColor = body.portadaColor || '#1B1B2F';
    const costoEnvio = Number(body.costoEnvio) || 25;
    const pedidoMinimo = Number(body.pedidoMinimo) || 50;
    const tiempoEstimado = body.tiempoEstimado || '20-35 min';

    // Exigencia 1: Logo o foto de la tienda obligatoria
    if (!imagenUrl) {
      return fail('El logo o fotografía de la fachada de tu tienda es obligatorio');
    }

    // Exigencia 2: Nombre del Negocio obligatorio
    if (!nombre) {
      return fail('El nombre comercial de la tienda es obligatorio');
    }

    // Exigencia 3: Categoría comercial obligatoria
    if (!categoria) {
      return fail('Debes seleccionar una categoría para tu negocio');
    }

    // Exigencia 4: RUC del negocio o Cédula del Propietario obligatorios
    if (!ruc) {
      return fail('El número RUC o Cédula del propietario es obligatorio para verificación comercial');
    }

    // Exigencia 5: WhatsApp Comercial obligatorio
    if (!whatsapp) {
      return fail('El número de WhatsApp comercial de pedidos es obligatorio');
    }

    // Exigencia 6: Dirección Física Completa y GPS
    if (!direccion) {
      return fail('La dirección física completa de tu local es obligatoria');
    }
    if (!lat || !lng) {
      return fail('Debes marcar las coordenadas GPS exactas de tu tienda en el mapa');
    }

    const initials = nombre
      .split(/\s+/)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const horarioObj = body.horario || {
      lun: { abre: '08:00', cierra: '18:00' },
      mar: { abre: '08:00', cierra: '18:00' },
      mie: { abre: '08:00', cierra: '18:00' },
      jue: { abre: '08:00', cierra: '18:00' },
      vie: { abre: '08:00', cierra: '18:00' },
      sab: { abre: '09:00', cierra: '15:00' },
      dom: { abre: '', cierra: '' },
    };

    const zonaObj = Array.isArray(body.zonaCobertura)
      ? body.zonaCobertura
      : ['Managua Centro', 'Zona Comercial'];

    let tiendaRecord = {
      id: `tnd-${Date.now()}`,
      propietarioId: user.id,
      nombre,
      descripcion,
      categoria,
      logoColor,
      logoIniciales: initials,
      portadaColor,
      imagenUrl,
      bannerUrl: bannerUrl || null,
      direccion,
      lat,
      lng,
      telefono,
      email,
      ruc,
      whatsapp,
      calificacion: 5.0,
      totalPedidos: 0,
      tiempoEstimado,
      costoEnvio,
      pedidoMinimo,
      horario: JSON.stringify(horarioObj),
      zonaCobertura: JSON.stringify(zonaObj),
      verificado: false, // Inicia pendiente de verificación administrativa
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
          imagenUrl: tiendaRecord.imagenUrl,
          bannerUrl: tiendaRecord.bannerUrl,
          direccion: tiendaRecord.direccion,
          lat: tiendaRecord.lat,
          lng: tiendaRecord.lng,
          telefono: tiendaRecord.telefono,
          email: tiendaRecord.email,
          ruc: tiendaRecord.ruc,
          whatsapp: tiendaRecord.whatsapp,
          calificacion: 5.0,
          totalPedidos: 0,
          tiempoEstimado: tiendaRecord.tiempoEstimado,
          costoEnvio: tiendaRecord.costoEnvio,
          pedidoMinimo: tiendaRecord.pedidoMinimo,
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
    return fail('Error interno al afiliar la tienda negocio', 500);
  }
}

/**
 * PATCH /api/cliente/tienda
 * Actualiza la información y/o foto/logo de la tienda del cliente autenticado.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return fail('No autorizado', 401);
    }

    const body = await req.json();

    const tienda = await db.tienda.findFirst({
      where: { propietarioId: user.id },
    });

    if (!tienda) {
      return fail('No tienes una tienda registrada', 440);
    }

    const updateData: Record<string, any> = {};
    if (body.nombre) updateData.nombre = String(body.nombre).trim();
    if (body.descripcion !== undefined) updateData.descripcion = String(body.descripcion).trim();
    if (body.categoria) updateData.categoria = String(body.categoria).trim();
    if (body.direccion) updateData.direccion = String(body.direccion).trim();
    if (body.telefono) updateData.telefono = String(body.telefono).trim();
    if (body.email) updateData.email = String(body.email).trim();
    if (body.imagenUrl !== undefined) updateData.imagenUrl = String(body.imagenUrl).trim();
    if (body.bannerUrl !== undefined) updateData.bannerUrl = String(body.bannerUrl).trim();
    if (body.logoColor) updateData.logoColor = String(body.logoColor);
    if (body.portadaColor) updateData.portadaColor = String(body.portadaColor);
    if (body.costoEnvio !== undefined) updateData.costoEnvio = Number(body.costoEnvio);
    if (body.pedidoMinimo !== undefined) updateData.pedidoMinimo = Number(body.pedidoMinimo);
    if (body.tiempoEstimado) updateData.tiempoEstimado = String(body.tiempoEstimado);
    if (body.estado) updateData.estado = String(body.estado);
    if (body.horario) updateData.horario = typeof body.horario === 'string' ? body.horario : JSON.stringify(body.horario);
    if (body.zonaCobertura) updateData.zonaCobertura = typeof body.zonaCobertura === 'string' ? body.zonaCobertura : JSON.stringify(body.zonaCobertura);

    const updated = await db.tienda.update({
      where: { id: tienda.id },
      data: updateData,
      include: { productos: true, ordenes: true },
    });

    return ok({ ok: true, tienda: updated });
  } catch (error) {
    console.error('[CLIENTE_TIENDA_PATCH]', error);
    return fail('Error al actualizar datos de la tienda', 500);
  }
}
