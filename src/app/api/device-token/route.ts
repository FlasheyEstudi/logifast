import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/device-token
 * Body: { token, plataforma? }
 *
 * Guarda el token push del dispositivo ligado al usuario de la sesión. Es el
 * eslabón que faltaba para que el backend pueda enviar una notificación con la app
 * cerrada: hasta ahora no existía ningún lugar donde estuviera ese token.
 *
 * El token es único por instalación: si el mismo aparato entra con otra cuenta, el
 * `upsert` lo reasigna al nuevo dueño en vez de dejar dos filas vivas.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      // Sin sesión no se puede asociar el token a nadie. La app reintenta al abrir.
      return NextResponse.json({ ok: false, error: 'Sin sesión' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? '').trim();
    const plataforma = String(body?.plataforma ?? 'android').slice(0, 20);
    const canal = String(body?.canal ?? 'logifast_urgente').slice(0, 40);

    // Un token FCM real es largo; se rechaza la basura para no llenar la tabla.
    if (token.length < 20 || token.length > 4096) {
      return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 400 });
    }

    await db.deviceToken.upsert({
      where: { token },
      create: { userId: user.id, token, plataforma, canal, activo: true },
      update: { userId: user.id, plataforma, canal, activo: true, ultimoUso: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DEVICE_TOKEN_POST]', error);
    return NextResponse.json({ ok: false, error: 'No se pudo registrar el dispositivo' }, { status: 500 });
  }
}

/**
 * DELETE /api/device-token
 * Body: { token }
 *
 * Desactiva el token al cerrar sesión, para que el siguiente usuario del mismo
 * teléfono no reciba avisos de la cuenta anterior.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: true });

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? '').trim();
    if (token) {
      await db.deviceToken
        .updateMany({ where: { token, userId: user.id }, data: { activo: false } })
        .catch(() => null);
    } else {
      // Sin token concreto: se apagan todos los de esta sesión de usuario.
      await db.deviceToken.updateMany({ where: { userId: user.id }, data: { activo: false } }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DEVICE_TOKEN_DELETE]', error);
    return NextResponse.json({ ok: true });
  }
}
