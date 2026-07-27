import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { saveImage } from '@/lib/upload/image';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mantenimientos/[id]/fotos
 * Sube fotos "antes/después" de un mantenimiento.
 * Body: FormData con `file` y opcional `tipo` (antes|después|proceso).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ingeniero' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const mantenimiento = await db.mantenimiento.findUnique({ where: { id } });
    if (!mantenimiento) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tipo = (formData.get('tipo') as string) || 'proceso';

    if (!file) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });

    const result = await saveImage(file, {
      uploaderId: user.id,
      categoria: 'mantenimiento',
      entidadId: id,
      maxWidth: 1600,
      maxHeight: 1200,
      quality: 82,
    });

    // Guardar metadata del tipo en la descripción del MediaAsset
    // (usamos entidadId como identificador del mantenimiento)
    return NextResponse.json({
      ok: true,
      foto: { ...result, tipo, mantenimientoId: id },
    });
  } catch (error) {
    console.error('[MANTENIMIENTO_FOTOS_POST]', error);
    return NextResponse.json({ error: 'Error al subir foto' }, { status: 500 });
  }
}

/**
 * GET /api/mantenimientos/[id]/fotos
 * Lista las fotos asociadas a un mantenimiento.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fotos = await db.mediaAsset.findMany({
      where: { categoria: 'mantenimiento', entidadId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ fotos });
  } catch (error) {
    console.error('[MANTENIMIENTO_FOTOS_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
