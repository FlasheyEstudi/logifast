/**
 * LOGIFAST — Helper de subida de imágenes
 * - Lee FormData con un File
 * - Valida tipo (jpeg, png, webp) y tamaño (< 5 MB)
 * - Optimiza con sharp (máx 1200x1200, calidad 82, formato webp)
 * - Guarda en /public/uploads/<categoria>/<cuid>.webp
 * - Crea un MediaAsset en la BD
 */

import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { db } from '@/lib/db';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
}

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
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error(`Tipo no permitido: ${file.type}. Solo JPG, PNG, WEBP, GIF.`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(1)} MB. Máx 5 MB.`);
  }

  // Crear directorio por categoría
  const dir = path.join(UPLOAD_ROOT, categoria);
  await fs.mkdir(dir, { recursive: true });

  // Generar nombre único
  const { randomUUID } = await import('crypto');
  const filename = `${randomUUID()}.webp`;
  const filepath = path.join(dir, filename);

  // Optimizar con sharp
  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer).rotate(); // auto-rotate from EXIF
  const metadata = await image.metadata();
  const processed = await image
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(filepath);

  const url = `/uploads/${categoria}/${filename}`;

  // Guardar en BD
  const media = await db.mediaAsset.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: 'image/webp',
      size: processed.size,
      width: processed.width,
      height: processed.height,
      url,
      uploaderId: uploaderId ?? null,
      categoria,
      entidadId: entidadId ?? null,
    },
  });

  return {
    id: media.id,
    url,
    filename,
    size: processed.size,
    width: processed.width,
    height: processed.height,
  };
}

/** Elimina una imagen del disco y de la BD. */
export async function deleteImage(mediaId: string): Promise<void> {
  const media = await db.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!media) return;
  const filepath = path.join(UPLOAD_ROOT, '..', '..', media.url.replace('/uploads/', ''));
  try {
    await fs.unlink(filepath);
  } catch {
    // ok si no existe
  }
  await db.mediaAsset.delete({ where: { id: mediaId } });
}
