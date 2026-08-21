import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { uploadToSupabaseStorage } from '@/lib/upload/supabase-storage';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mantenimientos/[id]/fotos
 * Sube fotos "antes/después" de un mantenimiento a Supabase Storage.
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';
    const publicUrl = await uploadToSupabaseStorage(buffer, file.name, mimeType, 'mantenimiento');

    const mediaAsset = await db.mediaAsset.create({
      data: {
        uploaderId: user.id,
        categoria: 'mantenimiento',
        entidadId: id,
        url: publicUrl,
        filename: file.name,
        originalName: file.name,
        size: file.size,
        mimeType,
      },
    });

    // Guardar metadata del tipo en la descripción del MediaAsset
    // (usamos entidadId como identificador del mantenimiento)
    return NextResponse.json({
      ok: true,
      foto: { ...mediaAsset, tipo, mantenimientoId: id },
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
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
