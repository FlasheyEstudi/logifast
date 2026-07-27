import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/login-audit
 * Lista los intentos de login (solo admin).
 * Query: ?email=&limit=&offset=
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole('admin');

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};
    if (email) where.email = { contains: email };

    const [audits, total] = await Promise.all([
      db.loginAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      db.loginAudit.count({ where }),
    ]);

    return NextResponse.json({ audits, total });
  } catch (error) {
    return handleError(error, 'LOGIN_AUDIT_GET');
  }
}
