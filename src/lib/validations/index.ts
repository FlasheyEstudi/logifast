// Helper compartido para validación Zod en route handlers (Zod v4 API)
import { ZodError, ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

export function validateBody<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (err) {
    if (err instanceof ZodError) {
      const firstIssue = err.issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Validación fallida';
      return {
        success: false,
        response: NextResponse.json(
          { error: message, details: err.issues },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      response: NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }),
    };
  }
}
