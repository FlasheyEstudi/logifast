/**
 * LogiFast Ultra-Light Image Compressor & LocalStorage Cache
 * - Comprime imágenes en el navegador antes de subir o guardar.
 * - Reduce archivos de 5MB a ~30-60KB usando HTML5 Canvas y WebP/JPEG.
 * - Almacena en localStorage para carga instantánea con footprint mínimo.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export async function compressImage(
  file: File | Blob | string,
  options: CompressionOptions = {}
): Promise<{ file: File; dataUrl: string; sizeKB: number }> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.75,
    format = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calcular proporciones manteniendo aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo inicializar canvas 2D'));
        return;
      }

      // Suavizado de imagen de alta calidad
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a Data URL optimizado
      const dataUrl = canvas.toDataURL(format, quality);

      // Convertir a Blob/File
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al generar blob comprimido'));
            return;
          }
          const fileName = `img_${Date.now()}.${format === 'image/webp' ? 'webp' : 'jpg'}`;
          const compressedFile = new File([blob], fileName, { type: format });
          const sizeKB = Math.round(blob.size / 1024);

          resolve({
            file: compressedFile,
            dataUrl,
            sizeKB,
          });
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen para compresión'));
    };

    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Cachea una imagen ultraligera en localStorage con control de cuota.
 */
export function cacheImageLocally(key: string, dataUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const storageKey = `lf_img_${key}`;
    localStorage.setItem(storageKey, dataUrl);
    return true;
  } catch (e) {
    // Si la cuota de localStorage está llena, limpiar imágenes antiguas
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('lf_img_')) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(`lf_img_${key}`, dataUrl);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Recupera una imagen cacheada localmente.
 */
export function getCachedImage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`lf_img_${key}`);
  } catch {
    return null;
  }
}
