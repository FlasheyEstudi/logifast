import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { fail, isValidEmail, ok, tooManyRequests, validateLength } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 50 intentos por IP cada 15 minutos
    const ip = getClientIP(req);
    const rl = rateLimit(`login:${ip}`, 50, 15 * 60 * 1000);
    if (!rl.success) return tooManyRequests(rl.resetAt);

    const body = (await req.json()) as LoginBody;
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';

    // Validación
    if (!email || !password) {
      return fail('Email y contraseña son obligatorios');
    }
    if (!isValidEmail(email)) {
      return fail('Email inválido');
    }
    const pwErr = validateLength(password, 1, 200, 'Contraseña');
    if (pwErr) return fail(pwErr);

    // Prevenir timing attacks: siempre ejecutar verifyPassword
    const user = await db.user.findUnique({ where: { email } });
    const dummyHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // hash de "dummy"
    const hashToVerify = user?.password ?? dummyHash;
    const passwordOk = await verifyPassword(password, hashToVerify);

    if (!user || !passwordOk) {
      // Audit log de intento fallido
      await db.loginAudit.create({
        data: {
          email,
          ip,
          success: false,
          reason: !user ? 'user_not_found' : 'wrong_password',
        },
      }).catch(() => null);
      return fail('Credenciales inválidas', 401);
    }

    // Audit log de login exitoso
    await db.loginAudit.create({
      data: {
        email,
        ip,
        userAgent: req.headers.get('user-agent') ?? null,
        success: true,
        reason: 'login_success',
      },
    }).catch(() => null);

    // Si es repartidor, asegurar que tenga RepartidorProfile
    if (user.role === 'repartidor') {
      const existingProfile = await db.repartidorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!existingProfile) {
        await db.repartidorProfile.create({
          data: {
            userId: user.id,
            nombre: user.name,
            email: user.email,
            telefono: user.telefono ?? null,
            saldo: 0,
            contratoAceptado: false,
            calificacion: 0,
            totalEntregas: 0,
            totalKm: 0,
            totalGanancias: 0,
            tiempoPromedio: 0,
          },
        });
      }
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'cliente' | 'repartidor' | 'admin' | 'ingeniero',
      telefono: user.telefono,
      initials: user.initials,
      color: user.color,
      fotoUrl: user.fotoUrl,
      bio: user.bio,
    });

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        telefono: user.telefono,
        initials: user.initials,
        color: user.color,
        fotoUrl: user.fotoUrl,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('[AUTH_LOGIN]', error);
    return fail('Error interno al iniciar sesión', 500);
  }
}
