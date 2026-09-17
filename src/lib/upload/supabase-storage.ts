import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { optimizeImageBuffer, saveLocalImage, deleteLocalImageByUrl } from './image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const BUCKET_NAME = 'logifast-media';

/**
 * Optimiza con Sharp y sube la imagen a Supabase Storage (o fallback local en disco).
 * Retorna siempre una URL HTTP/HTTPS válida (NUNCA data:image base64).
 */
export async function uploadToSupabaseStorage(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  contentType: string = 'image/jpeg',
  folder: string = 'general',
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> {
  // 1. Optimización con Sharp (auto-rotación EXIF + conversión a WebP)
  let optimizedBuffer: Buffer;
  try {
    const res = await optimizeImageBuffer(fileBuffer, options);
    optimizedBuffer = res.buffer;
  } catch (optErr) {
    console.warn('[Sharp Optimize Warning] Usando buffer original:', optErr);
    optimizedBuffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
  }

  const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
  const targetFilename = `${folder}/${Date.now()}-${cleanName}.webp`;

  // 2. Intentar subir a Supabase Storage
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(targetFilename, optimizedBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true,
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }

      if (error) {
        console.warn(`[Supabase Storage Warning] (${error.message}). Usando almacenamiento local.`);
      }
    } catch (sbErr) {
      console.warn('[Supabase Storage Catch] Fallo de conexión:', sbErr);
    }
  } else {
    console.warn('[Supabase Storage] Sin credenciales configuradas en .env. Usando almacenamiento local.');
  }

  // 3. Fallback seguro: guardar en almacenamiento local en disco (/public/uploads)
  // Garantiza 100% de disponibilidad y CERO contaminación de base de datos con cadenas base64.
  const localResult = await saveLocalImage(optimizedBuffer, folder, filename);
  return localResult.url;
}

/**
 * Elimina un archivo de Supabase Storage o del almacenamiento local a partir de su URL.
 */
export async function deleteFromSupabaseStorage(urlOrPath: string): Promise<boolean> {
  if (!urlOrPath) return false;

  // Si es una ruta local /uploads/...
  if (urlOrPath.startsWith('/uploads/')) {
    return deleteLocalImageByUrl(urlOrPath);
  }

  // Si es una URL de Supabase Storage
  if (supabase && urlOrPath.includes(BUCKET_NAME)) {
    try {
      // Extraer ruta relativa dentro del bucket:
      // ej: https://.../object/public/logifast-media/perfil/123.webp -> perfil/123.webp
      const bucketMarker = `${BUCKET_NAME}/`;
      const idx = urlOrPath.indexOf(bucketMarker);
      if (idx !== -1) {
        const filePath = urlOrPath.substring(idx + bucketMarker.length).split('?')[0];
        const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        if (!error) return true;
        console.warn('[Supabase Delete Warning]:', error.message);
      }
    } catch (delErr) {
      console.warn('[Supabase Delete Catch]:', delErr);
    }
  }

  return false;
}

/** Helper unificado para borrar archivos multimedia reemplazados. */
export const deleteMediaFile = deleteFromSupabaseStorage;
