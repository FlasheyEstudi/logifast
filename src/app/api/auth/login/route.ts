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

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 100 intentos por IP cada 15 minutos
    const ip = getClientIP(req);
    const rl = rateLimit(`login:${ip}`, 100, 15 * 60 * 1000);
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

    // Cuentas demo predefinidas (desactivadas en producción)
    const isProd = process.env.NODE_ENV === 'production';
    const DEMO_ACCOUNTS: Record<string, { name: string; role: 'cliente' | 'repartidor' | 'admin' | 'ingeniero' }> = {
      'cliente@logifast.com': { name: 'María López', role: 'cliente' },
      'repartidor@logifast.com': { name: 'Carlos Mendoza', role: 'repartidor' },
      'admin@logifast.com': { name: 'Administrador', role: 'admin' },
      'ingeniero@logifast.com': { name: 'Ingeniero Demo', role: 'ingeniero' },
    };

    // Intentar buscar usuario en la base de datos
    let user: any = null;
    try {
      user = await db.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
    } catch (err) {
      console.warn('[AUTH_LOGIN] Database query error:', err);
    }

    let passwordOk = false;

    // 1. Verificación para cuentas Demo (desactivadas en producción)
    if (!isProd && DEMO_ACCOUNTS[email] && (password === '123456' || password === 'Logifast2026!' || password === 'admin123')) {
      const demo = DEMO_ACCOUNTS[email];
      if (!user) {
        // Intentar crear el usuario demo en PostgreSQL para persistencia real
        user = await db.user.create({
          data: {
            email,
            name: demo.name,
            password: await hashPassword(password),
            role: demo.role,
            telefono: '+505 8888-0000',
            initials: demo.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
            color: '#FF5722',
          },
        }).catch(() => null);
      }
      if (!user) {
        user = {
          id: `demo-${demo.role}`,
          email,
          name: demo.name,
          role: demo.role,
          telefono: '+505 8888-0000',
          initials: demo.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          color: '#FF5722',
        };
      }
      passwordOk = true;
    } else if (user) {
      // 2. Verificación para usuarios registrados reales en la BD
      if (user.password) {
        passwordOk = await verifyPassword(password, user.password).catch(() => false);
      } else {
        await verifyPassword(password, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy').catch(() => false);
      }
    } else {
      // Dummy verification for timing-attack prevention when user is not found
      await verifyPassword(password, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy').catch(() => false);
    }

    if (!user || !passwordOk) {
      // Audit log de intento fallido (silent catch)
      await db.loginAudit.create({
        data: {
          email,
          ip,
          success: false,
          reason: !user ? 'user_not_found' : 'wrong_password',
        },
      }).catch(() => null);
      return fail('Credenciales inválidas. Por favor verifica tu correo y contraseña.', 401);
    }

    // Audit log de login exitoso (silent catch)
    await db.loginAudit.create({
      data: {
        email,
        ip,
        userAgent: req.headers.get('user-agent') ?? null,
        success: true,
        reason: 'login_success',
      },
    }).catch(() => null);

    // Si es repartidor, asegurar su perfil en DB
    if (user.role === 'repartidor') {
      try {
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
              saldo: 100,
              conectado: true,
              contratoAceptado: true,
            },
          }).catch(() => null);
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
