'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X, CheckCircle2 } from '@/components/icons';
import { useQrCamera } from './useQrCamera';

interface QRSyncScannerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Escáner móvil full-screen: cámara con reconocimiento real de QR (jsQR) +
 * entrada manual del código como respaldo.
 */
export default function QRSyncScanner({ open, onClose }: QRSyncScannerProps) {
  const [estado, setEstado] = useState<'escaneando' | 'procesando' | 'vinculado' | 'error'>(
    'escaneando'
  );
  const [error, setError] = useState<string | null>(null);
  const [codigoManual, setCodigoManual] = useState('');

  const vincular = useCallback(async (token: string) => {
    setEstado('procesando');
    setError(null);
    try {
      const r = await fetch('/api/qr-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || 'No se pudo vincular');
      localStorage.setItem('qr_pos_vinculado', '1');
      setEstado('vinculado');
    } catch (e) {
      setEstado('error');
      setError(e instanceof Error ? e.message : 'No se pudo vincular');
    }
  }, []);

  const { videoRef, active, error: camError, start, stop } = useQrCamera({
    onDetect: vincular,
  });

  useEffect(() => {
    if (!open) return;
    setEstado('escaneando');
    setError(null);
    setCodigoManual('');
    start();
    return () => stop();
  }, [open, start, stop]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Cámara a pantalla completa */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex flex-col" style={{ background: 'rgba(0,0,0,0.35)' }}>
        {/* Barra superior */}
        <div
          className="flex items-center justify-between px-4 pb-3"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
        >
          <span className="font-bold text-white text-base drop-shadow">
            Escanear QR del POS
          </span>
          <button
            onClick={() => {
              stop();
              onClose();
            }}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {/* Zona central */}
        <div className="flex-1 flex items-center justify-center px-6">
          {estado === 'escaneando' && (
            <div className="w-64 h-64 rounded-2xl border-4 border-white/80 relative overflow-hidden">
              <div
                className="absolute inset-x-6 h-1 rounded-full"
                style={{
                  background: 'var(--primario)',
                  top: '50%',
                  animation: 'lf-qr-scan 2s ease-in-out infinite',
                  boxShadow: '0 0 18px var(--primario)',
                }}
              />
            </div>
          )}
          {estado === 'procesando' && (
            <span className="text-white font-semibold text-lg drop-shadow">Vinculando…</span>
          )}
          {estado === 'vinculado' && (
            <div className="bg-white/95 rounded-2xl p-6 flex flex-col items-center gap-3 w-full max-w-sm">
              <CheckCircle2 size={44} className="text-[var(--exito)]" />
              <span className="font-bold text-slate-900 text-lg">¡Vinculado al POS!</span>
              <span className="text-sm text-slate-600 text-center leading-relaxed">
                Tu celular quedó conectado como extensión del punto de venta.
              </span>
              <button
                onClick={onClose}
                className="h-11 px-6 rounded-full bg-[var(--primario)] text-white font-bold cursor-pointer active:scale-95 transition-transform"
              >
                Continuar
              </button>
            </div>
          )}
          {estado === 'error' && (
            <div className="bg-white/95 rounded-2xl p-6 flex flex-col items-center gap-3 w-full max-w-sm">
              <span className="font-bold text-slate-900 text-lg">No se pudo vincular</span>
              <span className="text-sm text-[var(--peligro)] text-center">
                {error || camError || 'Intenta de nuevo'}
              </span>
              <button
                onClick={() => {
                  setEstado('escaneando');
                  start();
                }}
                className="h-11 px-6 rounded-full bg-[var(--primario)] text-white font-bold cursor-pointer active:scale-95 transition-transform"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Entrada manual + estado de cámara */}
        <div
          className="px-4 pb-3 flex flex-col items-center gap-3"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex w-full max-w-sm gap-2">
            <input
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              placeholder="O pega el código aquí"
              className="flex-1 h-11 rounded-full bg-white/95 px-4 text-sm text-slate-900 outline-none border-2 border-transparent focus:border-[var(--primario)]"
            />
            <button
              onClick={() => codigoManual.trim() && vincular(codigoManual.trim())}
              className="h-11 px-5 rounded-full bg-[var(--primario)] text-white font-bold text-sm cursor-pointer active:scale-95 transition-transform"
            >
              Vincular
            </button>
          </div>
          {!active && !camError && (
            <button
              onClick={start}
              className="h-11 px-6 rounded-full bg-white/15 text-white font-semibold text-sm cursor-pointer"
            >
              Abrir cámara
            </button>
          )}
          {camError && <span className="text-xs text-white/80 text-center">{camError}</span>}
        </div>
      </div>
    </div>
  );
}
