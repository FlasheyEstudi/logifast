/**
 * Rate limiting en memoria por IP.
 * Para producción: usar Redis (Upstash) o similar.
 * Para desarrollo: esta implementación simple funciona.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

// Limpiar entries expirados cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of limits.entries()) {
      if (entry.resetAt < now) limits.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Verifica rate limit por key.
 * @param key Identificador (ej: IP + endpoint)
 * @param limit Máximo de requests
 * @param windowMs Ventana de tiempo en ms
 */
export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();

  // Limpieza preventiva si el mapa crece excesivamente
  if (limits.size > 2000) {
    for (const [k, v] of limits.entries()) {
      if (v.resetAt < now) limits.delete(k);
    }
  }

  const entry = limits.get(key);

  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    limits.set(key, newEntry);
    return { success: true, limit, remaining: limit - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, limit, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Helper para obtener IP del request de manera segura. */
export function getClientIP(req: Request): string {
  // Priorizar Cloudflare / Railway / Vercel direct client IP headers
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    return parts[0].trim();
  }

  return '127.0.0.1';
}
