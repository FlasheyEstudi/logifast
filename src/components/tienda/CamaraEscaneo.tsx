'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { X } from '@/components/icons';

interface CamaraEscaneoProps {
  onCodigo: (codigo: string) => void;
  onCerrar: () => void;
  titulo?: string;
}

const MS_ANTI_REBOTE = 3000; // el mismo código se ignora 3 s: no se suma 1 tras 1

/**
 * Formatos que debe leer este visor. El QR va primero porque el mismo visor empareja
 * el celular con la caja (QR del POS); el resto son las barras de la mercadería:
 * EAN-13/UPC de producto envasado y CODE-128/39 de ropa, frescos y etiquetas propias.
 */
const FORMATOS_ZXING = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
  BarcodeFormat.DATA_MATRIX,
];

/**
 * Escáner de cámara autocontenido (getUserMedia + zxing): decodifica QR y códigos
 * de barras en navegador Y dentro de la app (WebView), sin plugins nativos ni rebuild.
 *
 * La lectura NO se corta al primer acierto: si el llamador no cierra el visor, el
 * anti-rebote de 3 s evita que el mismo producto entre repetido al dejarlo bajo el lente.
 */
export default function CamaraEscaneo({ onCodigo, onCerrar, titulo = 'Escanear código' }: CamaraEscaneoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const onCodigoRef = useRef(onCodigo);
  const ultimoCodigoRef = useRef('');
  const ultimoTiempoRef = useRef(0);

  // El callback del llamador se refresca en un efecto: asignarlo durante el render
  // puede dejar el ref apuntando a una versión de render descartada.
  useEffect(() => {
    onCodigoRef.current = onCodigo;
  }, [onCodigo]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Este dispositivo no permite abrir la cámara. Usa el código manual.');
          return;
        }
        const pistas = new Map<DecodeHintType, unknown>();
        pistas.set(DecodeHintType.POSSIBLE_FORMATS, FORMATOS_ZXING);
        pistas.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(pistas as Map<DecodeHintType, never>, {
          delayBetweenScanSuccess: 200,
          delayBetweenScanAttempts: 200,
        });
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          const texto = result?.getText?.()?.trim();
          if (!texto || !vivo) return;
          const ahora = Date.now();
          if (texto === ultimoCodigoRef.current && ahora - ultimoTiempoRef.current < MS_ANTI_REBOTE) return;
          ultimoCodigoRef.current = texto;
          ultimoTiempoRef.current = ahora;
          onCodigoRef.current(texto);
        });
        controlsRef.current = controls;
      } catch (e: any) {
        setError(e?.message || 'No se pudo abrir la cámara. Revisa el permiso.');
      }
    })();
    return () => {
      vivo = false;
      try { controlsRef.current?.stop(); } catch { /* ignorar */ }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 flex flex-col" style={{ background: 'rgba(0,0,0,0.35)' }}>
        <div className="flex items-center justify-between px-4 pb-3" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <span className="font-bold text-white text-base drop-shadow">{titulo}</span>
          <button onClick={onCerrar} aria-label="Cerrar" className="w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          {error ? (
            <div className="bg-white/95 rounded-2xl p-5 flex flex-col items-center gap-3 w-full max-w-sm">
              <span className="text-sm text-slate-900 font-bold text-center">{error}</span>
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Ingresa el código manualmente"
                className="w-full h-11 rounded-full bg-white px-4 text-sm text-slate-900 outline-none border-2 border-slate-200 focus:border-[var(--primario)]"
              />
              <button
                onClick={() => manual.trim() && onCodigo(manual.trim())}
                className="h-11 px-6 rounded-full bg-[var(--primario)] text-white font-bold text-sm cursor-pointer"
              >
                Aceptar código
              </button>
            </div>
          ) : (
            <div className="w-64 h-64 rounded-2xl border-4 border-white/80 relative overflow-hidden">
              <div
                className="absolute inset-x-6 h-1 rounded-full"
                style={{ background: 'var(--primario)', top: '50%', animation: 'lf-qr-scan 2s ease-in-out infinite', boxShadow: '0 0 18px var(--primario)' }}
              />
            </div>
          )}
        </div>

        <div className="px-4 pb-3 flex justify-center" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => setError(error ? null : 'Reintenta o usa el código manual')}
            className="h-11 px-6 rounded-full bg-white/15 text-white font-semibold text-sm cursor-pointer"
          >
            {error ? 'Reintentar cámara' : 'Código manual'}
          </button>
        </div>
      </div>
    </div>
  );
}
