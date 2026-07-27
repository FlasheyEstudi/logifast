import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { fail, ok, tooManyRequests, isValidEmail } from '@/lib/auth/helpers';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Genera un token de reseteo y lo "envía por email" (en desarrollo solo lo registramos).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000);
    if (!rl.success) return tooManyRequests(rl.resetAt);

    const body = await req.json();
    const email = (body.email ?? '').trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return fail('Email inválido');
    }

    // Por seguridad, siempre respondemos lo mismo (no revelar si el email existe)
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      // Invalidar tokens anteriores
      await db.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Generar token seguro
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await db.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // En producción: enviar email con el link de reseteo
      // En desarrollo: loguear el token para testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FORGOT_PASSWORD] Token para ${email}: ${token}`);
        console.log(`[FORGOT_PASSWORD] Reset URL: /reset-password?token=${token}`);
      }

      // Audit log
      await db.loginAudit.create({
        data: {
          email,
          ip,
          success: true,
          reason: 'forgot_password_requested',
        },
      });
    } else {
      // Audit log para email no existente
      await db.loginAudit.create({
        data: {
          email,
          ip,
          success: false,
          reason: 'forgot_password_email_not_found',
        },
      });
    }

    return ok({
      message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
    });
  } catch (error) {
    console.error('[FORGOT_PASSWORD]', error);
    return fail('Error al procesar la solicitud', 500);
  }
}
