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
    const userId = user?.id || 'usr-guest';

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const categoria = (formData.get('categoria') as string) || 'general';
    const entidadId = (formData.get('entidadId') as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
    }

    try {
      const result = await saveImage(file, {
        uploaderId: userId,
        categoria,
        entidadId,
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (saveErr) {
      console.warn('[UPLOAD_SAVE_BASE64_FALLBACK] Read-only filesystem, returning Data URL:', saveErr);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || 'image/png';
      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

      return NextResponse.json({
        ok: true,
        id: `img-${Date.now()}`,
        url: dataUrl,
        filename: file.name,
        size: file.size,
        width: 800,
        height: 600,
      });
    }
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error);
    return NextResponse.json({
      ok: false,
      error: 'Error al procesar la imagen',
    }, { status: 500 });
  }
}
