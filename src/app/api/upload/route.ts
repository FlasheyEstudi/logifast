import { NextRequest, NextResponse } from 'next/server';
import { uploadToSupabaseStorage } from '@/lib/upload/supabase-storage';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 * Body: FormData con `file` (imagen) y opcional `categoria` y `entidadId`.
 * Devuelve { id, url, filename, size, width, height }.
 * Optimiza automáticamente con Sharp a WebP y sube a Supabase (o disco local).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const userId = user?.id || 'usr-guest';

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const categoria = (formData.get('categoria') as string) || 'general';
    const entidadId = (formData.get('entidadId') as string) || undefined;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'Falta el archivo de imagen' }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: 'El archivo excede el tamaño máximo permitido (8 MB)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';

    const publicUrl = await uploadToSupabaseStorage(buffer, file.name, mimeType, categoria);

    return NextResponse.json({
      ok: true,
      id: `img-${Date.now()}`,
      url: publicUrl,
      filename: file.name,
      size: buffer.length,
    });
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'No se pudo procesar o almacenar la imagen',
      },
      { status: 500 }
    );
  }
}
