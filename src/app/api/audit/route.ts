import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    await requireRole('admin');
    const { searchParams } = new URL(request.url);
    const usuario = searchParams.get('usuario');
    const accion = searchParams.get('accion');
    const modulo = searchParams.get('modulo');
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
    const offsetRaw = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const where: Prisma.AuditLogWhereInput = {};

    if (usuario) {
      where.userId = usuario;
    }
    if (accion) {
      where.accion = { contains: accion };
    }
    if (modulo) {
      where.recurso = { contains: modulo };
    }

    const [data, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
} catch (error) {
    return handleError(error, 'AUDIT_GET');
  }
}
