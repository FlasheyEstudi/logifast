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

// Demo users preset mapping
const DEMO_USERS: Record<string, { role: 'cliente' | 'repartidor' | 'admin' | 'ingeniero'; name: string; initials: string; color: string }> = {
  'cliente@logifast.com': { role: 'cliente', name: 'María López', initials: 'ML', color: '#FF5722' },
  'repartidor@logifast.com': { role: 'repartidor', name: 'Carlos Martínez', initials: 'CM', color: '#10B981' },
  'admin@logifast.com': { role: 'admin', name: 'Administrador Logifast', initials: 'AD', color: '#3B82F6' },
  'ingeniero@logifast.com': { role: 'ingeniero', name: 'Ingeniero Logifast', initials: 'ING', color: '#8B5CF6' },
};

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 200 intentos por IP cada 15 minutos (para evitar bloqueos en demo/pruebas)
    const ip = getClientIP(req);
    const rl = rateLimit(`login:${ip}`, 200, 15 * 60 * 1000);
    if (!rl.success) return tooManyRequests(rl.resetAt);

    const body = (await req.json()) as LoginBody;
    const rawEmail = (body.email ?? '').trim().toLowerCase();
    const email = rawEmail.replace('@logifast.app', '@logifast.com');
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

    // Buscar usuario en la base de datos con búsqueda case-insensitive
    let user: any = null;
    try {
      user = await db.user.findFirst({
        where: { email },
      });
    } catch (err) {
      console.warn('[AUTH_LOGIN] Database query error:', err);
    }

    // Auto-provisioning para cuentas demo si no existen en la BD aún
    if (!user && DEMO_USERS[email] && password === '123456') {
      try {
        const demo = DEMO_USERS[email];
        const pwHash = await hashPassword('123456');
        user = await db.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: demo.name,
            password: pwHash,
            role: demo.role,
            initials: demo.initials,
            color: demo.color,
            emailVerified: true,
          },
        });
      } catch (err) {
        console.warn('[AUTH_LOGIN] Demo auto-provisioning fallback:', err);
        const demo = DEMO_USERS[email];
        user = {
          id: `demo-${demo.role}`,
          email,
          name: demo.name,
          role: demo.role,
          password: '123456',
          initials: demo.initials,
          color: demo.color,
        };
      }
    }

    // Verificación timing-safe de contraseña
    let passwordOk = false;
    if (user?.password) {
      passwordOk = await verifyPassword(password, user.password).catch(() => false);
    } else {
      await verifyPassword(password, DUMMY_HASH).catch(() => false);
    }

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
  } catch (err: any) {
    console.error('[AUTH_LOGIN] Server Error:', err);
    return fail('Error interno al iniciar sesión', 500);
  }
}
