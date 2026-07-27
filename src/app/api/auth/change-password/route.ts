import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { fail, ok, validateLength } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 * Cambia la contraseña del usuario autenticado.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return fail('No autorizado', 401);

    const body = await req.json();
    const currentPassword = body.currentPassword ?? '';
    const newPassword = body.newPassword ?? '';

    if (!currentPassword || !newPassword) {
      return fail('Contraseña actual y nueva son obligatorias');
    }

    const pwErr = validateLength(newPassword, 6, 200, 'Nueva contraseña');
    if (pwErr) return fail(pwErr);

    if (currentPassword === newPassword) {
      return fail('La nueva contraseña debe ser diferente a la actual');
    }

    // Obtener hash actual
    const userWithPw = await db.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!userWithPw) return fail('Usuario no encontrado', 404);

    // Verificar contraseña actual
    const okPw = await verifyPassword(currentPassword, userWithPw.password);
    if (!okPw) {
      return fail('Contraseña actual incorrecta', 401);
    }

    // Hashear y actualizar
    const hashed = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // Audit log
    await db.loginAudit.create({
      data: {
        email: user.email,
        success: true,
        reason: 'password_changed',
      },
    });

    return ok({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('[CHANGE_PASSWORD]', error);
    return fail('Error al cambiar contraseña', 500);
  }
}
