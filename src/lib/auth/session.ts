/**
 * LOGIFAST — Sesión basada en JWT firmado con HS256.
 * El token se envía como cookie httpOnly `lf-session` y nunca
 * se expone al JS del navegador. Los claims incluyen userId,
 * email, role y name.
 *
 * Funciona tanto en Route Handlers (server) como en Server Components.
 */

import jwt, { type JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const COOKIE_NAME = 'lf-session';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // En desarrollo permitimos un fallback para no romper el primer arranque,
    // pero en producción exigimos que esté definido.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET debe estar definido en production (>=32 chars). Configura la variable de entorno.'
      );
    }
    return 'logifast-dev-secret-cambiar-en-produccion-9f3a7c2e8b1d4f6a';
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
  }
  return secret;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'cliente' | 'repartidor' | 'admin' | 'ingeniero';
  telefono?: string | null;
  initials?: string | null;
  color?: string | null;
  fotoUrl?: string | null;
  bio?: string | null;
}

export interface SessionClaims extends JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: SessionUser['role'];
  telefono?: string | null;
  initials?: string | null;
  color?: string | null;
  fotoUrl?: string | null;
  bio?: string | null;
}

/** Firma un JWT para el usuario dado y lo guarda como cookie httpOnly. */
export async function createSession(user: SessionUser): Promise<void> {
  // Garantizar que fotoUrl y bio nunca inflen la cookie JWT por encima del límite de 4KB por cookie (RFC 6265).
  // getSessionUser() recupera la fotoUrl y bio de forma segura directamente desde la BD en cada petición.
  const safeFotoUrl =
    user.fotoUrl && user.fotoUrl.length < 500 && !user.fotoUrl.startsWith('data:')
      ? user.fotoUrl
      : null;
  const safeBio = user.bio && user.bio.length < 500 ? user.bio : null;

  const claims: SessionClaims = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    telefono: user.telefono ?? null,
    initials: user.initials ?? null,
    color: user.color ?? null,
    fotoUrl: safeFotoUrl,
    bio: safeBio,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const token = jwt.sign(claims, getSecret(), { algorithm: 'HS256' });

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });
}

/** Elimina la cookie de sesión. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Lee el token JWT crudo desde la cookie (si existe). */
export async function readSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

/** Verifica el JWT y devuelve los claims, o null si es inválido/expirado. */
export function verifyToken(token: string): SessionClaims | null {
  try {
    const payload = jwt.verify(token, getSecret()) as SessionClaims;
    if (!payload.sub || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Devuelve el usuario de sesión actual verificado contra la base de datos,
 * o null si no hay sesión válida.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (token) {
    const claims = verifyToken(token);
    if (claims) {
      const user = await db.user.findUnique({
        where: { id: claims.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          telefono: true,
          initials: true,
          color: true,
          fotoUrl: true,
          bio: true,
        },
      });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as SessionUser['role'],
          telefono: user.telefono,
          initials: user.initials,
          color: user.color,
          fotoUrl: user.fotoUrl,
          bio: user.bio,
        };
      }
    }
  }

  return null;
}

/** Atajo: requiere sesión; lanza 401 si no la hay. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error('UNAUTHORIZED');
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  return user;
}

/** Atajo: requiere sesión con un rol específico. */
export async function requireRole(
  ...roles: SessionUser['role'][]
): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role)) {
    const err = new Error('FORBIDDEN');
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return user;
}

export const SESSION_COOKIE = COOKIE_NAME;
