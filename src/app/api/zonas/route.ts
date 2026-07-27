import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/zonas
 * Lista todas las zonas de cobertura activas.
 */
export async function GET() {
  try {
    const zonas = await db.zonaCobertura.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json({ zonas });
} catch (error) {
    return handleError(error, 'ZONAS_GET');
  }
}

/**
 * POST /api/zonas (admin)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('admin');
    const body = await req.json();
    const { nombre, descripcion, lat, lng, radio } = body;
    if (!nombre) return NextResponse.json({ error: 'nombre requerido' }, { status: 400 });

    const zona = await db.zonaCobertura.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        radio: Number(radio) || 5,
      },
    });
    return NextResponse.json({ ok: true, zona });
} catch (error) {
    return handleError(error, 'ZONAS_POST');
  }
}
