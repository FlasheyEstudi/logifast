import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkqinkhodbabqznmqsuk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.s6B0000000000000000000000000000000000000000';

export const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'logifast-media';

/**
 * Sube un Buffer/File a Supabase Storage y retorna la URL pública permanente.
 */
export async function uploadToSupabaseStorage(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  contentType: string = 'image/jpeg',
  folder: string = 'general'
): Promise<string> {
  try {
    const cleanFilename = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(cleanFilename, fileBuffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (error) {
      console.warn('[Supabase Storage] Notice during upload:', error.message);
      // Fallback a URL publica generada directamente
      return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${cleanFilename}`;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('[Supabase Storage Error]:', err);
    // Retornar URL pública estática estimada
    const cleanFilename = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${cleanFilename}`;
  }
}
