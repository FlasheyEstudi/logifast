'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
}

interface UseUploadOptions {
  categoria?: string;
  entidadId?: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (err: string) => void;
}

/**
 * Hook para subir imágenes a /api/upload.
 * Uso:
 *   const { upload, loading, error, progress } = useUpload({ categoria: 'perfil' });
 *   <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
 */
export function useUpload(options: UseUploadOptions = {}) {
  const { categoria, entidadId, onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const upload = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return null;
      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (categoria) formData.append('categoria', categoria);
        if (entidadId) formData.append('entidadId', entidadId);

        // Simular progreso de subida
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setProgress((p) => Math.min(p + 10, 90));
        }, 100);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setProgress(100);

        const responseText = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error('El servidor no devolvió una respuesta JSON válida. Inténtalo con una imagen de menor tamaño.');
        }

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Error al subir la imagen');
        }

        const r: UploadResult = {
          id: data.id,
          url: data.url,
          filename: data.filename,
          size: data.size,
          width: data.width,
          height: data.height,
        };
        setResult(r);
        onSuccess?.(r);
        return r;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al subir imagen';
        setError(msg);
        onError?.(msg);
        return null;
      } finally {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setLoading(false);
        setTimeout(() => setProgress(0), 500);
      }
    },
    [categoria, entidadId, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return { upload, loading, error, result, progress, reset };
}
