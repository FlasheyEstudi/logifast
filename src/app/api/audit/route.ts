import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuario = searchParams.get('usuario');
    const accion = searchParams.get('accion');
    const modulo = searchParams.get('modulo');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

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
    console.error('[AUDIT_GET]', error);
    return NextResponse.json({ error: 'Error al obtener logs de auditoría' }, { status: 500 });
  }
}
