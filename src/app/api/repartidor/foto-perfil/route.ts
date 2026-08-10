import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { saveImage } from '@/lib/upload/image';

export const dynamic = 'force-dynamic';

/**
 * POST /api/repartidor/foto-perfil
 * Permite al repartidor subir su foto de perfil directamente via FormData o JSON base64.
 */
export async function POST(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { user, profile } = rp;
    const contentType = req.headers.get('content-type') || '';
    let fotoUrlResult = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'Falta el archivo de imagen' }, { status: 400 });

      const result = await saveImage(file, {
        uploaderId: user.id,
        categoria: 'perfil_repartidor',
        entidadId: profile.id,
        maxWidth: 500,
        maxHeight: 500,
        quality: 85,
      });
      fotoUrlResult = result.url;
    } else {
      const body = await req.json();
      if (body.fotoUrl && typeof body.fotoUrl === 'string') {
        fotoUrlResult = body.fotoUrl.trim();
      }
    }

    if (!fotoUrlResult) {
      return NextResponse.json({ error: 'Foto no válida o vacía' }, { status: 400 });
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
