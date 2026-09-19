'use client';

/**
 * LECTOR DE CÓDIGOS DE BARRAS — vista móvil del POS.
 *
 * No es una app aparte: es una ruta de la misma app (`/escaner`). El celular la
 * abre en su navegador, teclea el PIN de 6 dígitos que muestra la tablet del POS y
 * desde ahí transmite por WebSocket cada código que lee la cámara. El POS recibe
 * `escaner:codigo:recibido`, lo busca por `codigoBarras` y lo agrega al carrito.
 *
 * Sin dependencias nuevas: usa la API nativa `BarcodeDetector` (Chrome/Android).
 * Si el navegador no la trae (iOS Safari, Firefox), el modo manual por teclado
 * sigue funcionando y se avisa en pantalla.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onRealtimeEvent, realtime, getRealtimeUrl } from '@/services/realtime';

// ─── Tipos mínimos de las APIs nativas que no están en los tipos del DOM ───
type DeteccionCodigo = { rawValue: string; format: string };
interface DetectorCodigos {
  detect: (fuente: HTMLVideoElement) => Promise<DeteccionCodigo[]>;
}
type CtorDetector = {
  new (opciones?: { formats?: string[] }): DetectorCodigos;
  getSupportedFormats?: () => Promise<string[]>;
};
interface WakeLockLike {
  released: boolean;
  release: () => Promise<void>;
}

const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'codabar', 'qr_code'];
const MS_ENTRE_LECTURAS = 300;   // ritmo del escaneo continuo
const MS_ANTI_REBOTE = 1500;     // ignora el mismo código repetido por la misma etiqueta

type Fase = 'pin' | 'escaneando';

export default function EscanerPage() {
  const [fase, setFase] = useState<Fase>('pin');
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState('Teclea el PIN que muestra la caja');
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviados, setEnviados] = useState(0);
  const [ultimo, setUltimo] = useState<{ codigo: string; ok: boolean | null; nombre?: string | null } | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [soportaCamara, setSoportaCamara] = useState(true);
  const [manual, setManual] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<DetectorCodigos | null>(null);
  const wakeLockRef = useRef<WakeLockLike | null>(null);
  const pinRef = useRef<string>('');            // el bucle de escaneo lee el PIN ya emparejado
  const ultimaLecturaRef = useRef<Map<string, number>>(new Map());
  const enviandoRef = useRef<number>(0);        // t0 del último envío, para medir el ack

  const vibrar = (patron: number | number[]) => {
    try { navigator.vibrate?.(patron); } catch { /* no soportado */ }
  };

  // ─── Envío de un código al POS ───
  const enviarCodigo = useCallback((codigoCrudo: string) => {
    const codigo = String(codigoCrudo ?? '').trim();
    const pinActual = pinRef.current;
    if (!codigo || codigo.length < 3 || !pinActual) return;

    const ahora = Date.now();
    const previo = ultimaLecturaRef.current.get(codigo);
    if (previo && ahora - previo < MS_ANTI_REBOTE) return; // la cámara ve la misma etiqueta 10 veces por segundo
    ultimaLecturaRef.current.set(codigo, ahora);
    if (ultimaLecturaRef.current.size > 200) {
      for (const [k, t] of ultimaLecturaRef.current) if (ahora - t > 60_000) ultimaLecturaRef.current.delete(k);
    }

    enviandoRef.current = ahora;
    realtime.escanerEnviarCodigo(pinActual, codigo);
    setEnviados((n) => n + 1);
    setUltimo({ codigo, ok: null, nombre: null });
    vibrar(40);
  }, []);

  // ─── Cámara ───
  const detenerCamara = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamaraActiva(false);
  }, []);

  const iniciarCamara = useCallback(async () => {
    const Ctor = (window as unknown as { BarcodeDetector?: CtorDetector }).BarcodeDetector;
    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      setSoportaCamara(false);
      setAviso('Este navegador no trae lector de cámara. Usa el campo manual o Chrome en Android.');
      return;
    }
    try {
      const formats = Ctor.getSupportedFormats ? await Ctor.getSupportedFormats() : FORMATOS;
      const disponibles = FORMATOS.filter((f) => !formats?.length || formats.includes(f));
      detectorRef.current = new Ctor({ formats: disponibles.length ? disponibles : undefined });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCamaraActiva(true);
      setAviso(disponibles.includes('ean_13') ? null : 'Tu navegador no reporta formatos EAN/UPC; prueba el campo manual.');

      // La pantalla no debe apagarse mientras se cobra.
      const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockLike> } }).wakeLock;
      if (wl) wakeLockRef.current = await wl.request('screen').catch(() => null);
    } catch (err) {
      setSoportaCamara(false);
      setAviso(
        (err as Error)?.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Habilítalo en el navegador y recarga.'
          : 'No se pudo abrir la cámara. Usa el campo manual.'
      );
    }
  }, []);

  // ─── Bucle de lectura continua (solo en fase escaneando) ───
  useEffect(() => {
    if (fase !== 'escaneando' || !soportaCamara) return;
    let vivo = true;
    iniciarCamara();
    const id = setInterval(async () => {
      const detector = detectorRef.current;
      const video = videoRef.current;
      if (!vivo || !detector || !video || video.readyState < 2) return;
      try {
        const lecturas = await detector.detect(video);
        for (const l of lecturas) if (l?.rawValue) enviarCodigo(l.rawValue);
      } catch { /* frame ilegible: se reintenta en el siguiente tick */ }
    }, MS_ENTRE_LECTURAS);

    const alVolver = async () => {
      if (document.visibilityState !== 'visible' || !vivo) return;
      if (!streamRef.current) iniciarCamara();
      const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockLike> } }).wakeLock;
      if (wl && !wakeLockRef.current) wakeLockRef.current = await wl.request('screen').catch(() => null);
    };
    document.addEventListener('visibilitychange', alVolver);

    return () => {
      vivo = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', alVolver);
      detenerCamara();
    };
  }, [fase, soportaCamara, iniciarCamara, detenerCamara, enviarCodigo]);

  // ─── Eventos del servidor ───
  useEffect(() => {
    const offs = [
      onRealtimeEvent('escaner:unida', () => {
        setFase('escaneando');
        setEstado('Emparejado con la caja');
        vibrar([30, 40, 30]);
      }),
      onRealtimeEvent('escaner:presencia', (d: { lectorConectado?: boolean }) => {
        if (!d?.lectorConectado) {
          pinRef.current = '';
          setFase('pin');
          setEstado('La caja cerró el emparejamiento');
        }
      }),
      onRealtimeEvent('escaner:codigo:ack', (d: { codigo?: string }) => {
        if (!d?.codigo) return;
        const ms = enviandoRef.current ? Date.now() - enviandoRef.current : 0;
        setEstado(`Enviado (${ms} ms)`);
      }),
      onRealtimeEvent('escaner:resultado', (d: { codigo?: string; encontrado?: boolean; nombre?: string | null }) => {
        setUltimo({ codigo: d?.codigo ?? '', ok: !!d?.encontrado, nombre: d?.nombre ?? null });
        if (d?.encontrado) vibrar(50);
        else { vibrar([80, 60, 80]); setAviso(`La caja no tiene registrado el código ${d?.codigo ?? ''}`); }
      }),
      onRealtimeEvent('escaner:cerrada', (d: { motivo?: string }) => {
        pinRef.current = '';
        setFase('pin');
        setPin('');
        setEstado('Sesión cerrada en la caja');
        setAviso(d?.motivo === 'expirada' ? 'La sesión expiró por inactividad.' : null);
      }),
      onRealtimeEvent('escaner:error', (d: { contexto?: string; mensaje?: string }) => {
        setAviso(d?.mensaje || 'Error de emparejamiento');
        if (d?.contexto === 'unir') { pinRef.current = ''; setFase('pin'); }
      }),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  // ─── Limpieza al salir ───
  useEffect(() => {
    return () => {
      realtime.escanerSalir();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      wakeLockRef.current?.release?.().catch(() => undefined);
    };
  }, []);

  const emparejar = () => {
    const limpio = pin.replace(/\D/g, '').slice(0, 6);
    if (limpio.length !== 6) { setAviso('El PIN son 6 dígitos'); return; }
    setAviso(null);
    setEstado('Emparejando…');
    pinRef.current = limpio;
    realtime.escanerUnir(limpio);
  };

  const salir = () => {
    realtime.escanerSalir();
    pinRef.current = '';
    setFase('pin');
    setPin('');
    setEstado('Desemparejado');
  };

  // ─── PIN por URL (?pin=XXXXXX): el celular escanea el QR de la caja y entra directo ───
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const param = new URLSearchParams(window.location.search).get('pin');
    if (!param) return;
    const limpio = param.replace(/\D/g, '').slice(0, 6);
    if (limpio.length === 6) {
      setPin(limpio);
      pinRef.current = limpio;
      setEstado('Emparejando…');
      realtime.escanerUnir(limpio);
    }
  }, []);

  // ─── Vinculación persistente: si el celular ya está vinculado a la caja (WhatsApp Web),
  //      se une SOLO a la sala activa sin volver a escanear el QR. ───
  useEffect(() => {
    let vivo = true;
    const poll = async () => {
      try {
        const d = await fetch('/api/qr-sync?action=pin-activo').then((r) => r.json());
        if (!vivo || !d?.vinculado || !d?.pinActivo) return;
        const pinLimpio = String(d.pinActivo).replace(/\D/g, '').slice(0, 6);
        if (pinLimpio.length === 6) {
          setPin(pinLimpio);
          pinRef.current = pinLimpio;
          setEstado('Emparejando…');
          realtime.escanerUnir(pinLimpio);
        }
      } catch {
        /* reintentar en el siguiente tick */
      }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  const color = (ok: boolean | null) => (ok === null ? 'var(--text-muted)' : ok ? '#22C55E' : '#EF4444');

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg, #0B0B0F)', color: 'var(--text, #fff)', padding: 18, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Lector de códigos</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted, #9CA3AF)', margin: '2px 0 0' }}>{estado}</p>
        </div>
        <span style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 999, background: fase === 'escaneando' ? 'rgba(34,197,94,.15)' : 'rgba(148,163,184,.15)', color: fase === 'escaneando' ? '#22C55E' : 'var(--text-muted, #9CA3AF)', fontWeight: 700 }}>
          {fase === 'escaneando' ? (camaraActiva ? 'LECTOR ACTIVO' : 'SIN CÁMARA') : 'SIN EMPAREJAR'}
        </span>
      </header>

      {aviso && (
        <div style={{ background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.35)', color: '#F59E0B', padding: '10px 12px', borderRadius: 12, fontSize: 13, marginBottom: 14 }}>
          {aviso}
        </div>
      )}

      {fase === 'pin' ? (
        <section style={{ background: 'var(--surface, #15151C)', border: '1px solid var(--border, #26262F)', borderRadius: 18, padding: 18 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0, color: 'var(--text-muted, #9CA3AF)' }}>
            En la tablet de la caja abre <b>POS → Escáner inalámbrico</b>. Aparecerá un PIN de 6 dígitos.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => { if (e.key === 'Enter') emparejar(); }}
            placeholder="000000"
            aria-label="PIN de emparejamiento"
            style={{ width: '100%', marginTop: 14, padding: '16px 12px', fontSize: 34, letterSpacing: 12, textAlign: 'center', fontWeight: 800, fontFamily: 'ui-monospace, monospace', borderRadius: 14, border: '1px solid var(--border, #26262F)', background: 'var(--bg-alt, #0F0F14)', color: 'var(--text, #fff)', outline: 'none' }}
          />
          <button
            onClick={emparejar}
            disabled={pin.length !== 6}
            style={{ width: '100%', marginTop: 14, height: 54, borderRadius: 14, border: 'none', fontWeight: 800, fontSize: 16, cursor: pin.length === 6 ? 'pointer' : 'not-allowed', background: pin.length === 6 ? '#22C55E' : '#2A2A33', color: pin.length === 6 ? '#06240F' : 'var(--text-muted, #9CA3AF)' }}
          >
            Emparejar con la caja
          </button>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted, #9CA3AF)', margin: '12px 0 0', wordBreak: 'break-all' }}>
            Servicio en vivo: {getRealtimeUrl()}
          </p>
        </section>
      ) : (
        <section>
          <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border, #26262F)', background: '#000', aspectRatio: '3 / 4' }}>
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: '28% 8%', border: '2px solid rgba(34,197,94,.85)', borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,.28)' }} />
            {!soportaCamara && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 20, textAlign: 'center', fontSize: 13.5, color: '#E5E7EB' }}>
                Cámara no disponible en este navegador.<br />Usa el campo manual de abajo.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { enviarCodigo(manual); setManual(''); } }}
              placeholder="Escribir código a mano…"
              inputMode="numeric"
              aria-label="Código manual"
              style={{ flex: 1, padding: '14px 12px', fontSize: 16, borderRadius: 12, border: '1px solid var(--border, #26262F)', background: 'var(--bg-alt, #0F0F14)', color: 'var(--text, #fff)', outline: 'none' }}
            />
            <button
              onClick={() => { enviarCodigo(manual); setManual(''); }}
              style={{ padding: '0 18px', borderRadius: 12, border: 'none', fontWeight: 800, background: 'var(--surface, #15151C)', color: 'var(--text, #fff)' }}
            >
              Enviar
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '12px 14px', borderRadius: 14, background: 'var(--surface, #15151C)', border: '1px solid var(--border, #26262F)' }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted, #9CA3AF)' }}>Códigos enviados</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{enviados}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted, #9CA3AF)' }}>Último</div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: ultimo ? color(ultimo.ok) : 'var(--text-muted, #9CA3AF)' }}>
                {ultimo ? ultimo.codigo : '—'}
              </div>
              {ultimo?.nombre && <div style={{ fontSize: 12, color: '#22C55E' }}>+1 {ultimo.nombre}</div>}
            </div>
          </div>

          <button
            onClick={salir}
            style={{ width: '100%', marginTop: 14, height: 48, borderRadius: 14, border: '1px solid var(--border, #26262F)', background: 'transparent', color: 'var(--text-muted, #9CA3AF)', fontWeight: 700 }}
          >
            Desemparejar
          </button>
        </section>
      )}
    </main>
  );
}
