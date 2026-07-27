import { NextRequest, NextResponse } from 'next/server';
import { saveImage } from '@/lib/upload/image';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload
 * Body: FormData con `file` (imagen) y opcional `categoria` y `entidadId`.
 * Devuelve { id, url, filename, size, width, height }.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const categoria = (formData.get('categoria') as string) || 'general';
    const entidadId = (formData.get('entidadId') as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
    }

    const result = await saveImage(file, {
      uploaderId: user.id,
      categoria,
      entidadId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[UPLOAD]', error);
    const msg = error instanceof Error ? error.message : 'Error al subir imagen';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
