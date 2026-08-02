'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useUpload } from '@/hooks/useUpload';
import { notify } from '@/lib/notify';

interface ImageUploaderProps {
  categoria: string;
  entidadId?: string;
  onUploaded: (url: string, id: string) => void;
  onError?: (msg: string) => void;
  label?: string;
  hint?: string;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  previewUrl?: string | null;
  aspectRatio?: 'square' | 'wide' | 'tall';
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const aspectClass = {
  square: 'aspect-square',
  wide: 'aspect-video',
  tall: 'aspect-[3/4]',
};

const roundedClass = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
};

/**
 * Componente reutilizable para subir imágenes sin memory leaks.
 */
export function ImageUploader({
  categoria,
  entidadId,
  onUploaded,
  onError,
  label = 'Subir imagen',
  hint = 'JPG, PNG o WEBP — máx 5 MB',
  maxWidth,
  maxHeight,
  className = '',
  previewUrl,
  aspectRatio = 'square',
  rounded = 'lg',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl ?? null);

  // Clean up Object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const { upload, loading, progress } = useUpload({
    categoria,
    entidadId,
    onSuccess: (r) => {
      setLocalPreview(r.url);
      onUploaded(r.url, r.id);
      notify.success('Imagen subida correctamente');
    },
    onError: (msg) => {
      notify.error(msg);
      onError?.(msg);
    },
  });

  const handleFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      // Cleanup previous object URL to avoid memory leaks
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setLocalPreview(url);
      upload(file);
    },
    [upload]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (localPreview) {
    return (
      <div className={`lf-image-preview ${aspectClass[aspectRatio]} ${roundedClass[rounded]} ${className}`}>
        <img src={localPreview} alt="preview" />
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <div className="w-3/4 max-w-[200px]">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF5722] to-[#FF8A65] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white text-xs mt-2 text-center font-medium">Subiendo {progress}%</p>
            </div>
          </div>
        )}
        {!loading && (
          <div className="lf-image-preview-overlay">
            <button
              type="button"
              className="lf-image-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              title="Cambiar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <button
              type="button"
              className="lf-image-action-btn danger"
              onClick={handleRemove}
              title="Eliminar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
    <div
      className={`lf-upload-zone ${isDragging ? 'dragging' : ''} ${roundedClass[rounded]} ${className}`}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      {loading ? (
        <>
          <div className="lf-upload-icon">
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
          <div className="lf-upload-title">Subiendo... {progress}%</div>
          <div className="lf-upload-hint">No cierres esta ventana</div>
        </>
      ) : (
        <>
          <div className="lf-upload-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="lf-upload-title">{label}</div>
          <div className="lf-upload-hint">{hint}</div>
        </>
      )}
      {loading && (
        <div className="lf-upload-progress">
          <div className="lf-upload-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
