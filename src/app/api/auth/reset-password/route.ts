import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { fail, ok, tooManyRequests, validateLength } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`reset:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.success) return tooManyRequests(rl.resetAt);

    const body = await req.json();
    const token = (body.token ?? '').trim();
    const newPassword = body.newPassword ?? '';

    if (!token) return fail('Token requerido');
    const pwErr = validateLength(newPassword, 6, 200, 'Contraseña');
    if (pwErr) return fail(pwErr);

    const reset = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) return fail('Token inválido', 400);
    if (reset.usedAt) return fail('Token ya utilizado', 400);
    if (reset.expiresAt < new Date()) return fail('Token expirado', 400);

    // Hashear nueva contraseña
    const hashed = await hashPassword(newPassword);

    // Actualizar usuario
    await db.user.update({
      where: { id: reset.userId },
      data: { password: hashed },
    });

    // Marcar token como usado
    await db.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });

    // Invalidar todos los demás tokens del usuario
    await db.passwordReset.updateMany({
      where: { userId: reset.userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Audit log
    await db.loginAudit.create({
      data: {
        email: reset.user.email,
        ip,
        success: true,
        reason: 'password_reset_success',
      },
    });

    // Crear sesión automáticamente
    await createSession({
      id: reset.user.id,
      email: reset.user.email,
      name: reset.user.name,
      role: reset.user.role as 'cliente' | 'repartidor' | 'admin' | 'ingeniero',
      telefono: reset.user.telefono,
      initials: reset.user.initials,
      color: reset.user.color,
      fotoUrl: reset.user.fotoUrl,
      bio: reset.user.bio,
    });

    return ok({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('[RESET_PASSWORD]', error);
    return fail('Error al resetear contraseña', 500);
  }
}
