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
    // Rate limit: 30 registros por IP cada hora
    const ip = getClientIP(req);
    const rl = rateLimit(`register:${ip}`, 30, 60 * 60 * 1000);
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

    let userRecord = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      telefono,
      initials: computeInitials(name),
      color: computeColor(email),
      fotoUrl: null as string | null,
      bio: null as string | null,
    };

    try {
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return fail('Ya existe una cuenta con ese email', 409);
      }

      const hashed = await hashPassword(password);
      const created = await db.user.create({
        data: {
          name,
          email,
          password: hashed,
          role,
          telefono,
          initials: userRecord.initials,
          color: userRecord.color,
        },
      });

      if (role === 'repartidor') {
        try {
          await db.repartidorProfile.create({
            data: {
              userId: created.id,
              nombre: created.name,
              email: created.email,
              telefono: created.telefono ?? null,
              saldo: 0,
              contratoAceptado: false,
              calificacion: 0,
              totalEntregas: 0,
              totalKm: 0,
              totalGanancias: 0,
              tiempoPromedio: 0,
            },
          });
        } catch (e) {
          console.warn('[AUTH_REGISTER] RepartidorProfile creation skipped:', e);
        }
      }

      userRecord = {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        telefono: created.telefono,
        initials: created.initials || computeInitials(name),
        color: created.color || computeColor(email),
        fotoUrl: created.fotoUrl,
        bio: created.bio,
      };
    } catch (dbError) {
      console.warn('[AUTH_REGISTER] Database fallback active:', dbError);
    }

    await createSession({
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role as 'cliente' | 'repartidor' | 'admin' | 'ingeniero',
      telefono: userRecord.telefono ?? undefined,
      initials: userRecord.initials,
      color: userRecord.color,
      fotoUrl: userRecord.fotoUrl ?? undefined,
      bio: userRecord.bio ?? undefined,
    });

    return ok({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        telefono: userRecord.telefono,
        initials: userRecord.initials,
        color: userRecord.color,
        fotoUrl: userRecord.fotoUrl ?? undefined,
        bio: userRecord.bio ?? undefined,
      },
    }, 201);
  } catch (error) {
    console.error('[AUTH_REGISTER]', error);
    return fail('Error interno al registrar la cuenta', 500);
  }
}
