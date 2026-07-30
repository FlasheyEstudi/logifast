import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError, fail, ok } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/send-push
 * Envía una notificación push a usuarios (solo admin).
 * Body: { userIds?, role?, titulo, contenido, tipo, entidadId? }
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole('admin');

    const body = await req.json();
    const { userIds, role, titulo, contenido, tipo = 'sistema', entidadId } = body;

    if (!titulo || !contenido) {
      return fail('titulo y contenido son obligatorios');
    }

    // Determinar destinatarios
    let targets: string[] = [];
    if (userIds && Array.isArray(userIds)) {
      targets = userIds;
    } else if (role === 'todos' || !role) {
      const users = await db.user.findMany({ select: { id: true } });
      targets = users.map((u) => u.id);
    } else if (role) {
      const users = await db.user.findMany({
        where: { role },
        select: { id: true },
      });
      targets = users.map((u) => u.id);
    }

    if (targets.length === 0) {
      return fail('No hay usuarios destinatarios');
    }

    // Crear notificaciones push en BD
    const result = await db.notificacionPush.createMany({
      data: targets.map((userId) => ({
        userId,
        titulo,
        contenido,
        tipo,
        entidadId: entidadId ?? null,
      })),
    });

    return ok({
      enviadas: result.count,
      destinatarios: targets.length,
    });
  } catch (error) {
    return handleError(error, 'ADMIN_SEND_PUSH');
  }
}
