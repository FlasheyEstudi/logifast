import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { saveImage } from '@/lib/upload/image';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/foto-perfil
 * Soporta Multipart FormData (File) y JSON ({ fotoUrl: base64/url }).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const contentType = req.headers.get('content-type') || '';
    let fotoUrlResult = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'Falta el archivo de imagen' }, { status: 400 });

      try {
        const result = await saveImage(file, {
          uploaderId: user.id,
          categoria: 'perfil',
          entidadId: user.id,
          maxWidth: 500,
          maxHeight: 500,
          quality: 85,
        });
        fotoUrlResult = result.url;
      } catch (saveErr) {
        console.warn('[CLIENTE_FOTO_FS_WARN] Read-only filesystem detected, falling back to Base64:', saveErr);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || 'image/jpeg';
        fotoUrlResult = `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
    } else {
      const body = await req.json();
      if (body.fotoUrl && typeof body.fotoUrl === 'string') {
        fotoUrlResult = body.fotoUrl.trim();
      }
    }

    if (!fotoUrlResult) {
      return NextResponse.json({ error: 'Foto no válida o vacía' }, { status: 400 });
    }

    // Actualizar el User con la URL de la foto
    await db.user.update({
      where: { id: user.id },
      data: { fotoUrl: fotoUrlResult },
    });

    return NextResponse.json({ ok: true, fotoUrl: fotoUrlResult });
  } catch (error) {
    console.error('[CLIENTE_FOTO_POST]', error);
    return NextResponse.json({ error: 'Error al actualizar foto de perfil' }, { status: 500 });
  }
}
