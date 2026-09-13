import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware global de LOGIFAST.
 * - Agrega headers de seguridad
 * - Loggea requests lentos (> 1s)
 * - Rate limit básico en /api/auth/*
 */

export function middleware(req: NextRequest) {
  const start = Date.now();
  const path = req.nextUrl.pathname;

  const origin = req.headers.get('origin');
  const isApi = path.startsWith('/api/');

  // Manejo de preflight OPTIONS para rutas de API desde Capacitor (localhost)
  if (isApi && req.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    preflight.headers.set('Access-Control-Allow-Origin', origin || '*');
    preflight.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    preflight.headers.set('Access-Control-Max-Age', '86400');
    return preflight;
  }

  // Headers de seguridad en todas las respuestas
  const res = NextResponse.next();

  if (isApi) {
    res.headers.set('Access-Control-Allow-Origin', origin || '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // Log de requests a API (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && path.startsWith('/api/')) {
    const method = req.method;
    const elapsed = Date.now() - start;
    if (elapsed > 1000) {
      console.warn(`[SLOW] ${method} ${path} - ${elapsed}ms`);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads|icons|logos|logo|manifest|sw|robots).*)',
  ],
};
