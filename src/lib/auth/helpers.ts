/**
 * Helpers para respuestas HTTP estandarizadas y validación de input.
 */

import { NextResponse } from 'next/server';

/** Respuesta de éxito estandarizada. */
export function ok<T>(data: T, status: number = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

/** Respuesta de error estandarizada. */
export function fail(error: string, status: number = 400, details?: unknown) {
  return NextResponse.json(
    { ok: false, error, ...(details ? { details } : {}) },
    { status }
  );
}

/** Respuesta 401 No autorizado. */
export function unauthorized(error: string = 'No autorizado') {
  return fail(error, 401);
}

/** Respuesta 403 Prohibido. */
export function forbidden(error: string = 'No tienes permiso para esta acción') {
  return fail(error, 403);
}

/** Respuesta 404 No encontrado. */
export function notFound(error: string = 'No encontrado') {
  return fail(error, 404);
}

/** Respuesta 429 Demasiadas peticiones. */
export function tooManyRequests(resetAt: number) {
  return NextResponse.json(
    { ok: false, error: 'Demasiadas peticiones. Intenta más tarde.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Reset': String(resetAt),
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  );
}

/** Valida que un string no esté vacío. */
export function requireString(value: unknown, field: string): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return `${field} es obligatorio`;
  }
  return null;
}

/** Valida email. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valida que un valor sea un número positivo. */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

/** Sanitiza un string (trim + escape HTML básico). */
export function sanitize(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Valida longitud de string. */
export function validateLength(
  value: string,
  min: number,
  max: number,
  field: string
): string | null {
  if (value.length < min) return `${field} debe tener al menos ${min} caracteres`;
  if (value.length > max) return `${field} no puede exceder ${max} caracteres`;
  return null;
}

/**
 * Maneja errores en route handlers.
 * Reconoce errores de auth (UNAUTHORIZED, FORBIDDEN) y devuelve el status correcto.
 */
export function handleError(error: unknown, context?: string) {
  if (context) console.error(`[${context}]`, error);

  const err = error as Error & { status?: number };
  if (err?.status === 401 || err?.message === 'UNAUTHORIZED') {
    return NextResponse.json(
      { ok: false, error: 'No autorizado' },
      { status: 401 }
    );
  }
  if (err?.status === 403 || err?.message === 'FORBIDDEN') {
    return NextResponse.json(
      { ok: false, error: 'No tienes permiso para esta acción' },
      { status: 403 }
    );
  }

  // Prisma errors conocidos
  const msg = err?.message ?? '';
  if (msg.includes('Unique constraint')) {
    return NextResponse.json(
      { ok: false, error: 'Ya existe un registro con esos datos únicos' },
      { status: 409 }
    );
  }
  if (msg.includes('Foreign key constraint')) {
    return NextResponse.json(
      { ok: false, error: 'Referencia inválida (la entidad relacionada no existe)' },
      { status: 400 }
    );
  }
  if (msg.includes('Record to update not found') || msg.includes('Record to delete not found')) {
    return NextResponse.json(
      { ok: false, error: 'Registro no encontrado' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { ok: false, error: 'Error interno del servidor' },
    { status: 500 }
  );
}
