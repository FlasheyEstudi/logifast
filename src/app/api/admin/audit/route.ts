import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit
 * Retrieves system activity audit logs and authentication login audits.
 */
export async function GET() {
  try {
    await requireRole('admin', 'ingeniero');

    const [auditLogs, loginAudits] = await Promise.all([
      db.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      db.loginAudit.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ auditLogs, loginAudits });
  } catch (error) {
    console.error('[ADMIN_AUDIT_GET]', error);
    return NextResponse.json({ error: 'Error al obtener registros de auditoría' }, { status: 500 });
  }
}
