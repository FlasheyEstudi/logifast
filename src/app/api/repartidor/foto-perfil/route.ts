import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from '@/lib/upload/supabase-storage';

export const dynamic = 'force-dynamic';

/**
 * POST /api/repartidor/foto-perfil
 * Permite al repartidor subir su foto de perfil directamente via FormData o JSON base64.
 * Optimiza a WebP (400x400) con Sharp, elimina la foto previa y nunca guarda base64 en BD.
 */
export async function POST(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { user } = rp;
    const contentType = req.headers.get('content-type') || '';
    let fotoUrlResult = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'Falta el archivo de imagen' }, { status: 400 });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fotoUrlResult = await uploadToSupabaseStorage(
        buffer,
        file.name,
        file.type || 'image/jpeg',
        'perfil-repartidor',
        { maxWidth: 400, maxHeight: 400, quality: 85 }
      );
    } else {
      const body = await req.json().catch(() => ({}));
      const rawFoto = String(body?.fotoUrl || '').trim();

      if (rawFoto.startsWith('data:image/')) {
        const matches = rawFoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const mime = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          fotoUrlResult = await uploadToSupabaseStorage(
            buffer,
            `repartidor-${user.id}`,
            mime,
            'perfil-repartidor',
            { maxWidth: 400, maxHeight: 400, quality: 85 }
          );
        }
      } else if (rawFoto.startsWith('http://') || rawFoto.startsWith('https://') || rawFoto.startsWith('/uploads/')) {
        fotoUrlResult = rawFoto;
      }
    }

    if (!fotoUrlResult) {
      return NextResponse.json({ error: 'Foto no válida o vacía' }, { status: 400 });
    }

    // Borrar foto previa de almacenamiento si existía
    const current = await db.user.findUnique({
      where: { id: user.id },
      select: { fotoUrl: true },
    });

    if (current?.fotoUrl && current.fotoUrl !== fotoUrlResult) {
      await deleteFromSupabaseStorage(current.fotoUrl).catch((err) =>
        console.warn('[RepartidorFotoDeleteOld] No se pudo borrar foto previa:', err)
      );
    }

    // Actualizar fotoUrl en la tabla User de la BD
    await db.user.update({
      where: { id: user.id },
      data: { fotoUrl: fotoUrlResult },
    });

    return NextResponse.json({ ok: true, fotoUrl: fotoUrlResult });
  } catch (error) {
    console.error('[REPARTIDOR_FOTO_POST]', error);
    return NextResponse.json({ error: 'Error al actualizar la foto de perfil' }, { status: 500 });
  }
}
