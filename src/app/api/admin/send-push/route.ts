import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError, fail, ok } from '@/lib/auth/helpers';
import { emitirEventoRealtimeAsync } from '@/lib/realtime-emitter';

export const dynamic = 'force-dynamic';

/** Tamaño de lote para no saturar el microservicio realtime en envíos masivos. */
const LOTE_SALAS = 500;

/**
 * POST /api/admin/send-push
 * Envía una notificación a los usuarios (solo admin).
 * Body: { userIds?, role?, titulo, contenido, tipo?, entidadId? }
 *
 * Entrega real:
 *  1) Persiste una fila por usuario en `NotificacionPush` (bandeja dentro de la app).
 *  2) Emite el evento `notificacion:push` a la sala personal `usuario:{userId}` por lotes de 500.
 *  3) Registra la campaña en `Campana` con las métricas reales del envío.
 *
 * IMPORTANTE: sin un proveedor de push (FCM/Web Push) esto solo alcanza dispositivos
 * con la app abierta y el socket conectado. `entregadosEnVivo` es exactamente eso.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole('admin');

    const body = await req.json();
    const { userIds, role, titulo, contenido, tipo = 'sistema', entidadId } = body;

    if (!titulo || !contenido) {
      return fail('titulo y contenido son obligatorios');
    }

    // ─── 1. Resolver destinatarios ───
    let destinatarios: Array<{ id: string; role: string }> = [];

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      destinatarios = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, role: true },
      });
    } else if (role && role !== 'todos') {
      destinatarios = await db.user.findMany({
        where: { role },
        select: { id: true, role: true },
      });
    } else {
      destinatarios = await db.user.findMany({ select: { id: true, role: true } });
    }

    if (destinatarios.length === 0) {
      return fail('No hay usuarios destinatarios para este segmento');
    }

    // ─── 2. Persistir en la bandeja de cada usuario (una sola query, por lotes) ───
    let guardadas = 0;
    const filas = destinatarios.map((u) => ({
      userId: u.id,
      titulo,
      contenido,
      tipo,
      entidadId: entidadId ?? null,
    }));

    for (let i = 0; i < filas.length; i += LOTE_SALAS) {
      const res = await db.notificacionPush.createMany({
        data: filas.slice(i, i + LOTE_SALAS),
      });
      guardadas += res.count;
    }

    // ─── 3. Emitir en vivo a la sala personal de cada usuario, por lotes de 500 ───
    const salas = destinatarios.map((u) => `usuario:${u.id}`);
    let entregadosEnVivo = 0;
    let salasActivas = 0;
    let lotesFallidos = 0;

    for (let i = 0; i < salas.length; i += LOTE_SALAS) {
      const lote = salas.slice(i, i + LOTE_SALAS);
      const resultado = await emitirEventoRealtimeAsync({
        rooms: lote,
        event: 'notificacion:push',
        data: { titulo, contenido, tipo, entidadId: entidadId ?? null },
      });

      if (resultado) {
        entregadosEnVivo += resultado.entregados ?? 0;
        salasActivas += resultado.salasActivas ?? 0;
      } else {
        lotesFallidos += 1;
      }
    }

    // ─── 4. Registrar la campaña con métricas reales (log visible en el panel) ───
    let campanaId: string | null = null;
    try {
      const campana = await db.campana.create({
        data: {
          titulo,
          tipo: 'notificacion',
          segmento: role || (userIds ? 'seleccion' : 'todos'),
          contenido,
          estado: lotesFallidos > 0 ? 'fallida' : 'enviada',
          enviadaEn: new Date(),
          destinatarios: destinatarios.length,
          creadoPor: admin?.id || admin?.email || 'admin',
        },
      });
      campanaId = campana.id;
    } catch (e) {
      console.warn('[SEND_PUSH_CAMPANA_WARN]', e);
    }

    return ok({
      destinatarios: destinatarios.length,
      guardadas,
      entregadosEnVivo,
      sinConexion: destinatarios.length - entregadosEnVivo,
      salasActivas,
      lotes: Math.ceil(salas.length / LOTE_SALAS),
      lotesFallidos,
      campanaId,
      canal: 'ws+bandeja',
      nota:
        'La entrega en vivo requiere la app abierta o en segundo plano con socket conectado. Para entregas con la app cerrada se necesita un proveedor de push (FCM).',
    });
  } catch (error) {
    return handleError(error, 'ADMIN_SEND_PUSH');
  }
}
