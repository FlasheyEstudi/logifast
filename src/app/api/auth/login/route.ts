import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { fail, isValidEmail, ok, tooManyRequests, validateLength } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

interface LoginBody {
  email: string;
  password: string;
}

// Dummy hash para prevenir timing attacks cuando el usuario no existe.
const DUMMY_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 intentos por IP cada 15 minutos (endurecido desde 100)
    const ip = getClientIP(req);
    const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.success) return tooManyRequests(rl.resetAt);

    const body = (await req.json()) as LoginBody;
    const email = (body.email ?? '').trim().toLowerCase();
    const password = (body.password ?? '').trim();

    // Validación
    if (!email || !password) {
      return fail('Email y contraseña son obligatorios');
    }
    if (!isValidEmail(email)) {
      return fail('Email inválido');
    }
    const pwErr = validateLength(password, 1, 200, 'Contraseña');
    if (pwErr) return fail(pwErr);

    // Buscar usuario en la base de datos
    let user: any = null;
    try {
      user = await db.user.findFirst({
        where: { email: { equals: email } },
      });
    } catch (err) {
      console.warn('[AUTH_LOGIN] Database query error:', err);
    }

    // Verificación timing-safe: siempre ejecutamos verifyPassword aunque el user no exista
    let passwordOk = false;
    if (user?.password) {
      passwordOk = await verifyPassword(password, user.password).catch(() => false);
    } else {
      // Usuario no existe: ejecutamos verifyPassword contra un hash dummy
      // para que el tiempo de respuesta sea similar al de un login válido.
      await verifyPassword(password, DUMMY_HASH).catch(() => false);
    }

    // P0: Bloque DEMO eliminado — los usuarios demo se crean con `node scripts/seed.js`
    // y se validan con bcrypt como cualquier usuario real. No más auto-creación en runtime.

    if (!user || !passwordOk) {
      // Audit log de intento fallido (silent catch)
      await db.loginAudit
        .create({
          data: {
            email,
            ip,
            success: false,
            reason: !user ? 'user_not_found' : 'wrong_password',
          },
        })
        .catch(() => null);
      return fail(
        'Credenciales inválidas. Por favor verifica tu correo y contraseña.',
        401
      );
    }

    // Audit log de login exitoso (silent catch)
    await db.loginAudit
      .create({
        data: {
          email,
          ip,
          userAgent: req.headers.get('user-agent') ?? null,
          success: true,
          reason: 'login_success',
        },
      })
      .catch(() => null);

    // Si es repartidor, asegurar su perfil en DB
    if (user.role === 'repartidor') {
      try {
        const existingProfile = await db.repartidorProfile.findUnique({
          where: { userId: user.id },
        });
        if (!existingProfile) {
          await db.repartidorProfile
            .create({
              data: {
                userId: user.id,
                nombre: user.name,
                email: user.email,
                telefono: user.telefono ?? null,
                saldo: 100,
                conectado: true,
                contratoAceptado: true,
              },
            })
            .catch(() => null);
        }
      } catch (e) {}
    }

    // Crear sesión JWT en cookie httpOnly y responder
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
    }).catch(() => null);

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
    console.error('[AUTH_LOGIN_ERROR]', error);
    return fail('Error en inicio de sesión. Por favor intenta de nuevo.', 500);
  }
}
