import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  nombre: z.string().min(1, 'nombre requerido').max(100),
  descripcion: z.string().max(500).optional().nullable(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radio: z.number().min(0).optional(),
});

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
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
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
