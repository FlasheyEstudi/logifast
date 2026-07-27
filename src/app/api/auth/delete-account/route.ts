import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { rateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { fail, ok, tooManyRequests } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/delete-account
 * Body: { password }
 * Elimina la cuenta del usuario autenticado (GDPR compliance).
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`delete:${ip}`, 2, 60 * 60 * 1000);
    if (!rl.success) return tooManyRequests(rl.resetAt);

    const user = await getSessionUser();
    if (!user) return fail('No autorizado', 401);

    const body = await req.json();
    const password = body.password ?? '';
    const confirm = body.confirm ?? '';

    if (!password) return fail('Contraseña requerida');
    if (confirm !== 'ELIMINAR') {
      return fail('Debes escribir "ELIMINAR" para confirmar');
    }

    // Verificar contraseña
    const { verifyPassword } = await import('@/lib/auth/password');
    const userWithPw = await db.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!userWithPw) return fail('Usuario no encontrado', 404);

    const okPw = await verifyPassword(password, userWithPw.password);
    if (!okPw) return fail('Contraseña incorrecta', 401);

    // Audit log antes de eliminar
    await db.loginAudit.create({
      data: {
        email: user.email,
        success: true,
        reason: 'account_deleted',
      },
    });

    // Eliminar usuario (cascade elimina todo lo relacionado)
    await db.user.delete({ where: { id: user.id } });

    // Destruir sesión
    const { destroySession } = await import('@/lib/auth/session');
    await destroySession();

    return ok({ message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    console.error('[DELETE_ACCOUNT]', error);
    return fail('Error al eliminar cuenta', 500);
  }
}
