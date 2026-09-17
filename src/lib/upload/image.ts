/**
 * LOGIFAST — Helper de subida y optimización de imágenes (Fase 0)
 * - Procesa buffers/archivos con sharp (auto-rotación EXIF, WebP calidad 82, máx 1200x1200)
 * - Reduce imágenes de 4-5 MB a ~35-50 KB sin pérdida perceptible
 * - Soporta guardado local en /public/uploads/<categoria>/<uuid>.webp
 * - Elimina imágenes huérfanas al reemplazarlas
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { db } from '@/lib/db';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export interface OptimizedImageResult {
  buffer: Buffer;
  format: 'webp';
  mimeType: 'image/webp';
  width?: number;
  height?: number;
  size: number;
}

export interface UploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
}

/**
 * Optimiza cualquier buffer de imagen con sharp:
 * - Corrige rotación EXIF (fotos tomadas con smartphones)
 * - Escala con fit 'inside' sin deformar
 * - Convierte a WebP con calidad 82
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer | Uint8Array,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<OptimizedImageResult> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 82 } = options;
  const buffer = Buffer.isBuffer(inputBuffer) ? inputBuffer : Buffer.from(inputBuffer);

  const transformer = sharp(buffer)
    .rotate() // auto-rotación según EXIF
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4 });

  const { data, info } = await transformer.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    format: 'webp',
    mimeType: 'image/webp',
    width: info.width,
    height: info.height,
    size: info.size,
  };
}

/**
 * Guarda una imagen optimizada en el almacenamiento local (/public/uploads).
 * Utilizado como fallback offline y de alta velocidad.
 */
export async function saveLocalImage(
  buffer: Buffer,
  folder: string = 'general',
  originalFilename?: string
): Promise<{ url: string; filepath: string; filename: string; size: number }> {
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetDir = path.join(UPLOAD_ROOT, cleanFolder);
  await fs.mkdir(targetDir, { recursive: true });

  const uuid = crypto.randomUUID();
  const filename = `${Date.now()}-${uuid.slice(0, 8)}.webp`;
  const filepath = path.join(targetDir, filename);

  await fs.writeFile(filepath, buffer);
  const url = `/uploads/${cleanFolder}/${filename}`;

  return { url, filepath, filename, size: buffer.length };
}

/**
 * Elimina una imagen del almacenamiento local en disco (/public/uploads).
 */
export async function deleteLocalImageByUrl(url: string): Promise<boolean> {
  if (!url || !url.startsWith('/uploads/')) return false;
  try {
    const relativePath = url.replace(/^\/uploads\//, '');
    const fullPath = path.join(UPLOAD_ROOT, relativePath);
    await fs.unlink(fullPath);
    return true;
  } catch {
    // Si el archivo ya no existe, ignorar limpiamente
    return false;
  }
}

/**
 * Guarda imagen directamente en disco y crea el registro MediaAsset en la BD.
 */
export async function saveImage(
  file: File,
  options: {
    uploaderId?: string;
    categoria?: string;
    entidadId?: string;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<UploadResult> {
  const {
    uploaderId,
    categoria = 'general',
    entidadId,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 82,
  } = options;

  if (!file) throw new Error('No se envió ningún archivo');
  if (file.size > MAX_SIZE) {
    throw new Error(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(1)} MB. Máx 8 MB.`);
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const optimized = await optimizeImageBuffer(rawBuffer, { maxWidth, maxHeight, quality });
  const local = await saveLocalImage(optimized.buffer, categoria, file.name);

  // Registrar en la BD
  const media = await db.mediaAsset.create({
    data: {
      filename: local.filename,
      originalName: file.name,
      mimeType: optimized.mimeType,
      size: optimized.size,
      width: optimized.width ?? 0,
      height: optimized.height ?? 0,
      url: local.url,
      uploaderId: uploaderId ?? null,
      categoria,
      entidadId: entidadId ?? null,
    },
  });

  return {
    id: media.id,
    url: local.url,
    filename: local.filename,
    size: optimized.size,
    width: optimized.width,
    height: optimized.height,
  };
}

/** Elimina una imagen del disco y de la tabla MediaAsset en la BD. */
export async function deleteImage(mediaId: string): Promise<void> {
  const media = await db.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!media) return;
  await deleteLocalImageByUrl(media.url);
  await db.mediaAsset.delete({ where: { id: mediaId } }).catch(() => {});
}
