'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

export interface QrCameraOptions {
  /** Se llama UNA vez con el texto decodificado del primer QR reconocido. */
  onDetect: (text: string) => void;
  /** Intervalo entre intentos de decodificación (ms). Default 300. */
  scanIntervalMs?: number;
  /** Cámara trasera (environment) por defecto. */
  facingMode?: 'environment' | 'user';
}

export interface QrCamera {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  active: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Motor de escaneo QR por cámara (web, sin plugins nativos):
 * getUserMedia -> frames a canvas -> jsQR. Devuelve el texto del primer QR
 * que reconoce y se detiene. Úsalo con un <video ref={videoRef} playsInline
 * muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />.
 */
export function useQrCamera({ onDetect, scanIntervalMs = 300, facingMode = 'environment' }: QrCameraOptions): QrCamera {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScanRef = useRef(0);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('La cámara no está disponible en este dispositivo.');
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => null);
      }
      setActive(true);
      lastScanRef.current = 0;

      const scan = () => {
        rafRef.current = requestAnimationFrame(scan);
        const now = performance.now();
        if (now - lastScanRef.current < scanIntervalMs) return;
        lastScanRef.current = now;

        const video = videoRef.current;
        if (!video || video.readyState < 2 || !video.videoWidth) return;

        const size = Math.min(video.videoWidth, video.videoHeight, 640);
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Recorte central cuadrado (los QR suelen estar centrados en el overlay).
        const sx = Math.max(0, (video.videoWidth - size) / 2);
        const sy = Math.max(0, (video.videoHeight - size) / 2);
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        const img = ctx.getImageData(0, 0, size, size);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          stop();
          onDetectRef.current(code.data);
        }
      };
      scan();
    } catch {
      setError('No se pudo abrir la cámara. Verifica los permisos del navegador.');
    }
  }, [facingMode, scanIntervalMs, stop]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, active, error, start, stop };
}
