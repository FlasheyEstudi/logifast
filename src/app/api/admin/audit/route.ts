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

    const [auditLogsRaw, loginAudits] = await Promise.all([
      db.auditLog.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      db.loginAudit.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const auditLogs = auditLogsRaw.map((a) => ({
      id: a.id,
      userId: a.userId,
      usuario: a.user?.name || a.user?.email || 'Super Admin',
      email: a.user?.email,
      rol: a.user?.role,
      accion: a.accion,
      recurso: a.recurso,
      recursoId: a.recursoId,
      detalles: a.detalles,
      ip: a.ip || '192.168.1.1',
      dispositivo: a.dispositivo || 'Web / Dashboard',
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ auditLogs, loginAudits });
  } catch (error) {
    console.error('[ADMIN_AUDIT_GET]', error);
    return NextResponse.json({ error: 'Error al obtener registros de auditoría' }, { status: 500 });
  }
}
