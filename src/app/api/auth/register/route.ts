import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { fail, isValidEmail, ok, tooManyRequests, validateLength } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role?: 'cliente' | 'repartidor';
  telefono?: string;
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function computeColor(seed: string): string {
  const palette = ['#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#FF9800', '#00BCD4', '#3F51B5'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 registros por IP cada hora
    const ip = getClientIP(req);
    const rl = rateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
    if (!rl.success) return tooManyRequests(rl.resetAt);

    const body = (await req.json()) as RegisterBody;
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    const role = body.role === 'repartidor' ? 'repartidor' : 'cliente';
    const telefono = body.telefono?.trim() || null;

    // Validación
    const nameErr = validateLength(name, 2, 100, 'Nombre');
    if (nameErr) return fail(nameErr);
    if (!email) return fail('Email es obligatorio');
    if (!isValidEmail(email)) return fail('Email inválido');
    const pwErr = validateLength(password, 6, 200, 'Contraseña');
    if (pwErr) return fail(pwErr);
    if (telefono && !/^[+]?[\d\s\-()]{6,20}$/.test(telefono)) {
      return fail('Teléfono inválido');
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return fail('Ya existe una cuenta con ese email', 409);
    }

    const hashed = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        telefono,
        initials: computeInitials(name),
        color: computeColor(email),
      },
    });

    if (role === 'repartidor') {
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
    }, 201);
  } catch (error) {
    console.error('[AUTH_REGISTER]', error);
    return fail('Error interno al registrar la cuenta', 500);
  }
}
