import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/comunicaciones
 * Fetches message templates and automatic notification configurations.
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [plantillas, notificacionesAuto, directMessages] = await Promise.all([
      db.plantillaMensaje.findMany({ orderBy: { createdAt: 'desc' } }),
      db.notificacionAutomatica.findMany(),
      db.mensajeDirecto.findMany({
        take: 50,
        orderBy: { enviadoEn: 'desc' },
      }),
    ]);

    return NextResponse.json({ plantillas, notificacionesAuto, directMessages });
  } catch (error) {
    console.error('[ADMIN_COMUNICACIONES_GET]', error);
    return NextResponse.json({ error: 'Error al obtener datos de comunicaciones' }, { status: 500 });
  }
}

/**
 * POST /api/admin/comunicaciones
 * Creates a message template or updates an automatic notification trigger.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { type, payload } = body;

    if (type === 'plantilla') {
      const { nombre, categoria = 'general', contenido, variables = [] } = payload;
      const plantilla = await db.plantillaMensaje.create({
        data: {
          nombre: String(nombre),
          categoria: String(categoria),
          contenido: String(contenido),
          variables: JSON.stringify(variables),
        },
      });
      return NextResponse.json({ plantilla });
    }

    if (type === 'notificacionAuto') {
      const { id, activa } = payload;
      if (id) {
        const notif = await db.notificacionAutomatica.update({
          where: { id },
          data: { activa: Boolean(activa) },
        });
        return NextResponse.json({ notificacionAuto: notif });
      }
    }

    return NextResponse.json({ error: 'Tipo no soportado' }, { status: 400 });
  } catch (error) {
    console.error('[ADMIN_COMUNICACIONES_POST]', error);
    return NextResponse.json({ error: 'Error al guardar comunicación' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/comunicaciones
 * Actualiza una plantilla de mensaje existente.
 * Body: { id, nombre?, categoria?, contenido?, variables? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { id, nombre, categoria, contenido, variables } = body ?? {};
    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const existente = await db.plantillaMensaje.findUnique({ where: { id: String(id) } });
    if (!existente) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (nombre !== undefined) data.nombre = String(nombre);
    if (categoria !== undefined) data.categoria = String(categoria);
    if (contenido !== undefined) data.contenido = String(contenido);
    if (variables !== undefined) data.variables = JSON.stringify(variables);

    const plantilla = await db.plantillaMensaje.update({
      where: { id: String(id) },
      data,
    });

    return NextResponse.json({ plantilla });
  } catch (error) {
    console.error('[ADMIN_COMUNICACIONES_PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar la plantilla' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/comunicaciones?id=...
 * Elimina una plantilla de mensaje.
 */
export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const id = new URL(req.url).searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const existente = await db.plantillaMensaje.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    await db.plantillaMensaje.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('[ADMIN_COMUNICACIONES_DELETE]', error);
    return NextResponse.json({ error: 'Error al eliminar la plantilla' }, { status: 500 });
  }
}
