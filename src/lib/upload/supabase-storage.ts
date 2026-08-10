import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkqinkhodbabqznmqsuk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcWlua2hvZGJhYnF6bm1xc3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDU0NzEsImV4cCI6MjEwMDc4MTQ3MX0.PU3u6kh_JrxhBUBRhO6hCKciLuvV_BVfvhAXs21iXeg';

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
      console.warn('[Supabase Storage Upload Warning]:', error.message);
      // Si falla por permisos RLS del bucket, devolver Data URL para no romper la UI
      const base64Str = Buffer.from(fileBuffer).toString('base64');
      return `data:${contentType};base64,${base64Str}`;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('[Supabase Storage Error]:', err);
    const base64Str = Buffer.from(fileBuffer).toString('base64');
    return `data:${contentType};base64,${base64Str}`;
  }
}
