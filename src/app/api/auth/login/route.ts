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

    // Intentar buscar usuario en la base de datos
    let user: any = null;
    try {
      user = await db.user.findUnique({ where: { email } });
    } catch (err) {
      console.warn('[AUTH_LOGIN] Database unavailable, falling back to demo credentials:', err);
    }

    const dummyHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // hash de "dummy"
    const hashToVerify = user?.password ?? dummyHash;
    let passwordOk = await verifyPassword(password, hashToVerify).catch(() => false);

    // Fallback para cuentas demo si no existe usuario en la BD o falla la conexión
    const DEMO_ACCOUNTS: Record<string, { name: string; role: 'cliente' | 'repartidor' | 'admin' | 'ingeniero' }> = {
      'cliente@logifast.com': { name: 'María López', role: 'cliente' },
      'repartidor@logifast.com': { name: 'Carlos Mendoza', role: 'repartidor' },
      'admin@logifast.com': { name: 'Administrador', role: 'admin' },
      'ingeniero@logifast.com': { name: 'Ingeniero Demo', role: 'ingeniero' },
    };

    if (!user && DEMO_ACCOUNTS[email] && password === '123456') {
      const demo = DEMO_ACCOUNTS[email];
      user = {
        id: `demo-${demo.role}`,
        email,
        name: demo.name,
        role: demo.role,
        telefono: '+505 8888-0000',
        initials: demo.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
        color: '#FF5722',
        fotoUrl: null,
        bio: null,
        password: '',
        emailVerified: true,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      passwordOk = true;
    }

    if (!user || !passwordOk) {
      // Audit log de intento fallido (silent catch si BD falla)
      await db.loginAudit.create({
        data: {
          email,
          ip,
          success: false,
          reason: !user ? 'user_not_found' : 'wrong_password',
        },
      }).catch(() => null);
      return fail('Credenciales inválidas. Usa una cuenta demo (ej: admin@logifast.com / 123456)', 401);
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

    // Si es repartidor y hay BD, asegurar que tenga RepartidorProfile (silent catch)
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
      } catch (e) {}
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
    console.error('[AUTH_LOGIN]', error);
    return fail('Error en inicio de sesión. Por favor intenta de nuevo.', 400);
  }
}
