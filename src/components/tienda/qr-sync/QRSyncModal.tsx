'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, CheckCircle2, Loader2 } from '@/components/icons';

interface QRSyncModalProps {
  open: boolean;
  onClose: () => void;
}

type Fase = 'generando' | 'esperando' | 'vinculado' | 'error';

/** Modal del PC: pide un token temporal, lo muestra como QR y espera a que el celular escanee. */
export default function QRSyncModal({ open, onClose }: QRSyncModalProps) {
  const [fase, setFase] = useState<Fase>('generando');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const limpiar = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    setFase('generando');
    setError(null);
    setQrUrl(null);

    (async () => {
      try {
        const r = await fetch('/api/qr-sync?action=token');
        const d = await r.json();
        if (!r.ok || !d.token) throw new Error(d.error || 'No se pudo generar el código');
        if (cancelado) return;

        const dataUrl = await QRCode.toDataURL(d.token, {
          width: 480,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        if (cancelado) return;
        setQrUrl(dataUrl);
        setFase('esperando');

        pollRef.current = setInterval(async () => {
          try {
            const s = await fetch(
              `/api/qr-sync?action=status&token=${encodeURIComponent(d.token)}`
            ).then((x) => x.json());
            if (s.estado === 'vinculado') {
              limpiar();
              localStorage.setItem('qr_pos_vinculado', '1');
              setFase('vinculado');
            } else if (s.estado === 'expirado') {
              limpiar();
              setFase('error');
              setError('El código expiró. Cierra y genera uno nuevo.');
            }
          } catch {
            /* reintenta en el próximo tick */
          }
        }, 2000);
      } catch (e) {
        setFase('error');
        setError(e instanceof Error ? e.message : 'Error al generar el código');
      }
    })();

    return () => {
      cancelado = true;
      limpiar();
    };
  }, [open, limpiar]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4"
      style={{ backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[var(--lf-card-radius,22px)] bg-[var(--surface)] border border-[var(--border)] p-6 flex flex-col items-center gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <h3 className="font-syne text-lg font-bold text-[var(--text)] m-0">Conectar Celular</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-full bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-[var(--text-muted)] text-center m-0 leading-relaxed">
          Escanea este código desde el portal de tu tienda en el celular para usarlo como extensión
          del punto de venta. Tu PC no se desconecta.
        </p>

        {fase === 'generando' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-[var(--primario)]" />
            <span className="text-xs text-[var(--text-muted)]">Generando código…</span>
          </div>
        )}

        {fase === 'esperando' && qrUrl && (
          <img
            src={qrUrl}
            alt="QR de vinculación del POS"
            className="w-56 h-56 rounded-xl border border-[var(--border)] bg-white"
          />
        )}

        {fase === 'vinculado' && (
          <div className="flex flex-col items-center gap-2 py-4">
            <CheckCircle2 size={44} className="text-[var(--exito)]" />
            <span className="font-bold text-[var(--text)]">¡Celular vinculado!</span>
            <span className="text-xs text-[var(--text-muted)] text-center">
              Tu celular quedó conectado como extensión del POS.
            </span>
          </div>
        )}

        {fase === 'error' && (
          <span className="text-sm text-[var(--peligro)] text-center">{error}</span>
        )}

        <button
          onClick={onClose}
          className="h-11 px-6 rounded-full bg-[var(--primario)] text-white font-bold text-sm cursor-pointer active:scale-95 transition-transform"
        >
          Listo
        </button>
      </div>
    </div>
  );
}
