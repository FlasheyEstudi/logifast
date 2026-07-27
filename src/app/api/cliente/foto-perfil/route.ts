import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { saveImage } from '@/lib/upload/image';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cliente/foto-perfil
 * Body: FormData con `file`.
 * Sube una foto de perfil para el cliente autenticado y la guarda en user.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });

    const result = await saveImage(file, {
      uploaderId: user.id,
      categoria: 'perfil',
      entidadId: user.id,
      maxWidth: 400,
      maxHeight: 400,
      quality: 85,
    });

    // Actualizar el User con la URL de la foto
    await db.user.update({
      where: { id: user.id },
      data: { fotoUrl: result.url },
    });

    return NextResponse.json({ ok: true, fotoUrl: result.url });
  } catch (error) {
    console.error('[CLIENTE_FOTO_POST]', error);
    return NextResponse.json({ error: 'Error al subir foto' }, { status: 500 });
  }
}
