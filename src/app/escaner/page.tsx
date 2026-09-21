'use client';

/**
 * LECTOR DE CÓDIGOS DE BARRAS — vista móvil del POS.
 *
 * No es una app aparte: es una ruta de la misma app (`/escaner`). El celular la
 * abre en su navegador, teclea el PIN de 6 dígitos que muestra la tablet del POS y
 * desde ahí transmite por WebSocket cada código que lee la cámara. El POS recibe
 * `escaner:codigo:recibido`, lo busca por `codigoBarras` y lo agrega al carrito.
 *
 * Dos reglas de oro aprendidas a golpes:
 *  1. La cámara deja de leer mientras se decide la cantidad (stopScan/startScan):
 *     si sigue viva, el mismo código entra una y otra vez.
 *  2. El mismo código se ignora 3 s (ventana anti-rebote) aunque la cámara lo vuelva
 *     a ver, para que un producto no se agregue 1 tras 1 al dejarlo bajo el lente.
 *
 * Sin dependencias nuevas: usa la API nativa `BarcodeDetector` (Chrome/Android) y,
 * si no existe (iOS Safari, WebView viejo), cae a `@zxing/browser`. El modo manual
 * por teclado sigue funcionando y se avisa en pantalla.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Package } from 'lucide-react';
import { onRealtimeEvent, realtime, getRealtimeUrl } from '@/services/realtime';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

// ─── Tipos mínimos de las APIs nativas que no están en los tipos del DOM ───
type ResultadoCodigo = { rawValue: string; format: string };
interface DetectorCodigos {
  detect: (fuente: HTMLVideoElement) => Promise<ResultadoCodigo[]>;
}
type CtorDetector = {
  new (opciones?: { formats?: string[]; tryHarder?: boolean }): DetectorCodigos;
  getSupportedFormats?: () => Promise<string[]>;
};
interface WakeLockLike {
  released: boolean;
  release: () => Promise<void>;
}

/**
 * Formatos que debe leer el lector. `QR_CODE` sigue primero porque el QR de la caja
 * (…/escaner?pin=XXXXXX) se escanea con este mismo visor, pero el grueso de la mercadería
 * viene en barras: EAN-13/UPC de producto envasado y CODE-128/39 de ropa y etiquetas propias.
 */
const FORMATOS: string[] = [
  'qr_code',
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'itf',
  'codabar',
  'data_matrix',
];

/** Equivalente en zxing (el plan B cuando no hay `BarcodeDetector`). */
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

const MS_ANTI_REBOTE = 3000;     // el mismo código se ignora 3 s: evita "1 tras 1"
const MS_REANUDAR = 500;         // respiro antes de reactivar la cámara
const MS_ESPERA_POS = 2500;      // cuánto espera el POS para confirmar el producto
const SALTO_RAPIDO = 5;          // botón [+5]

type Fase = 'pin' | 'escaneando';
type ProductoEscaneado = { codigo: string; nombre: string; precio: number; stock?: number | null; imagenUrl?: string | null };

const soloDigitos = (v: string) => String(v ?? '').replace(/\D/g, '').slice(0, 6);

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
  const [producto, setProducto] = useState<ProductoEscaneado | null>(null);
  const [cantidad, setCantidad] = useState(1);
  // Espejo en estado del bloqueo de lectura: el ref decide (lo lee el bucle de la
  // cámara) y el estado solo pinta el marco, para no leer refs durante el render.
  const [bloqueado, setBloqueado] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lectorRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<WakeLockLike | null>(null);
  const peticionRef = useRef<number | null>(null);     // rAF del bucle de BarcodeDetector
  const alLeerRef = useRef<(codigo: string) => void>(() => {});
  const abrirHojaRef = useRef<(p: ProductoEscaneado) => void>(() => {});
  const pinRef = useRef<string>('');            // el bucle de escaneo lee el PIN ya emparejado
  const ultimoCodigoRef = useRef('');           // último código aceptado (para el anti-rebote)
  const ultimoTiempoRef = useRef(0);
  const enviandoRef = useRef<number>(0);        // t0 del último envío, para medir el ack
  const esperaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reanudarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendienteRef = useRef<string | null>(null); // código enviado, esperando respuesta del POS
  const bloqueadoRef = useRef(false);           // true = la cámara no debe entregar más códigos

  const vibrar = (patron: number | number[]) => {
    try { navigator.vibrate?.(patron); } catch { /* no soportado */ }
  };

  /** Beep corto de confirmación. WebAudio: no hace falta traer un mp3 ni un asset nuevo. */
  const beep = useCallback((agudo = false) => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gan = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = agudo ? 1400 : 900;
      gan.gain.value = 0.06;
      osc.connect(gan).connect(ctx.destination);
      const t = ctx.currentTime;
      osc.start(t);
      gan.gain.setValueAtTime(0.06, t);
      gan.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.stop(t + 0.13);
      osc.onended = () => { ctx.close().catch(() => undefined); };
    } catch { /* navegador sin audio: el resto del flujo sigue */ }
  }, []);
  // ─── Cámara ───

  const detenerCamara = useCallback(() => {
    try { lectorRef.current?.stop(); } catch { /* ignorar */ }
    lectorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamaraActiva(false);
  }, []);

  /** Pausa el bucle de lectura sin soltar la cámara: se usa mientras se elige la cantidad. */
  const pausarLectura = useCallback(() => {
    try { lectorRef.current?.stop(); } catch { /* ignorar */ }
    lectorRef.current = null;
    setCamaraActiva(false);
  }, []);

  const iniciarCamara = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSoportaCamara(false);
      setAviso('Este dispositivo no permite la cámara. Usa el campo manual.');
      return;
    }
    // 1) API nativa del navegador: lee barras y QR y es la más rápida en Android.
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const Ctor = (window as unknown as { BarcodeDetector: CtorDetector }).BarcodeDetector;
        let formatos = FORMATOS;
        try {
          const soportados = (await Ctor.getSupportedFormats?.()) ?? FORMATOS;
          formatos = FORMATOS.filter((f) => soportados.includes(f));
        } catch { /* el navegador no lista formatos: se piden todos */ }
        const detector = new Ctor({ formats: formatos.length ? formatos : FORMATOS, tryHarder: true });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        const video = videoRef.current;
        if (!video) throw new Error('sin elemento de video');
        video.srcObject = stream;
        await video.play().catch(() => undefined);
        streamRef.current = stream;
        let vivo = true;
        let ultimoEscaneo = 0;
        const bucle = async () => {
          if (!vivo) return;
          const ahora = performance.now();
          // ~8 lecturas por segundo: el anti-rebote y el bloqueo hacen el resto.
          if (ahora - ultimoEscaneo > 120) {
            ultimoEscaneo = ahora;
            if (!bloqueadoRef.current) {
              try {
                const res = await detector.detect(video);
                const codigo = res?.[0]?.rawValue ? String(res[0].rawValue).trim() : '';
                if (codigo) alLeerRef.current(codigo);
              } catch { /* fotograma ilegible: se reintenta */ }
            }
          }
          if (vivo) peticionRef.current = requestAnimationFrame(() => { void bucle(); });
        };
        peticionRef.current = requestAnimationFrame(() => { void bucle(); });
        lectorRef.current = {
          stop: () => {
            vivo = false;
            if (peticionRef.current) cancelAnimationFrame(peticionRef.current);
          },
        };
        setCamaraActiva(true);
        setAviso(null);
        const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockLike> } }).wakeLock;
        if (wl && !wakeLockRef.current) wakeLockRef.current = await wl.request('screen').catch(() => null);
        return;
      } catch (e) {
        const nombre = (e as Error)?.name;
        // Permiso denegado: no insistas con el plan B (también pide cámara).
        if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
          setSoportaCamara(false);
          setAviso('Permiso de cámara denegado. Habilítalo y recarga.');
          return;
        }
        // Otra causa (formato no soportado, detector roto): se intenta con zxing.
      }
    }

    // 2) Plan B: zxing con todos los formatos habilitados (iOS Safari, WebView viejo).
    try {
      const pistas = new Map<DecodeHintType, unknown>();
      pistas.set(DecodeHintType.POSSIBLE_FORMATS, FORMATOS_ZXING);
      pistas.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(pistas as Map<DecodeHintType, never>, {
        delayBetweenScanSuccess: 200,
        delayBetweenScanAttempts: 200,
      });
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        const texto = result?.getText?.();
        if (texto) alLeerRef.current(String(texto).trim());
      });
      lectorRef.current = controls;
      setCamaraActiva(true);
      setAviso(null);

      // La pantalla no debe apagarse mientras se cobra.
      const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockLike> } }).wakeLock;
      if (wl && !wakeLockRef.current) wakeLockRef.current = await wl.request('screen').catch(() => null);
    } catch (err) {
      setSoportaCamara(false);
      setAviso(
        (err as Error)?.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Habilítalo y recarga.'
          : 'No se pudo abrir la cámara. Usa el campo manual.'
      );
    }
  }, []);

  // ─── Lectura de un código ───
  // Regla 1: el mismo código dentro de 3 s se ignora (la cámara lo ve muchas veces por segundo).
  // Regla 2: mientras hay una hoja de cantidad abierta o se espera al POS, no entra nada más.
  const alLeer = useCallback((codigo: string) => {
    const pinActual = pinRef.current;
    if (!codigo || codigo.length < 3 || !pinActual) return;
    if (bloqueadoRef.current) return;

    const ahora = Date.now();
    if (codigo === ultimoCodigoRef.current && ahora - ultimoTiempoRef.current < MS_ANTI_REBOTE) return;
    ultimoCodigoRef.current = codigo;
    ultimoTiempoRef.current = ahora;

    if (esperaRef.current) { clearTimeout(esperaRef.current); esperaRef.current = null; }
    pendienteRef.current = codigo;
    enviandoRef.current = ahora;
    setEnviados((n) => n + 1);
    setUltimo({ codigo, ok: null, nombre: null });
    vibrar(40);
    realtime.escanerEnviarCodigo(pinActual, codigo);
    esperaRef.current = setTimeout(() => {
      pendienteRef.current = null;
      abrirHojaRef.current({ codigo, nombre: 'Producto sin registrar', precio: 0 });
      setAviso(`La caja no reconoció el código ${codigo}. Se agregará como línea libre.`);
    }, MS_ESPERA_POS);
  }, []);

  // Los refs apuntan a la última versión de cada callback sin re-suscribir la cámara.
  // Se sincronizan en un efecto (nunca durante el render: React puede descartar el
  // render y el ref quedaría apuntando a una versión que no llegó a la pantalla).
  useEffect(() => {
    alLeerRef.current = alLeer;
  }, [alLeer]);

  /** Abre la hoja de cantidad y congela la cámara hasta que el cajero decida. */
  const abrirHoja = useCallback((p: ProductoEscaneado) => {
    bloqueadoRef.current = true;
    setBloqueado(true);
    pausarLectura();
    setProducto(p);
    setCantidad(1);
    vibrar(50);
    beep(true);
  }, [pausarLectura, beep]);

  useEffect(() => {
    abrirHojaRef.current = abrirHoja;
  }, [abrirHoja]);

  /** Desbloquea y reactiva la cámara tras el respiro de MS_REANUDAR. */
  const reanudarEscaneo = useCallback(() => {
    if (reanudarRef.current) clearTimeout(reanudarRef.current);
    reanudarRef.current = setTimeout(() => {
      bloqueadoRef.current = false;
      setBloqueado(false);
      pendienteRef.current = null;
      setProducto(null);
      setCantidad(1);
      iniciarCamara();
    }, MS_REANUDAR);
  }, [iniciarCamara]);

  /** El código + la cantidad van juntos: así el POS agrega N de una sola vez. */
  const confirmarCantidad = useCallback(() => {
    const pinActual = pinRef.current;
    const p = producto;
    if (!pinActual || !p) return;
    const n = Math.max(1, Math.min(999, Math.round(cantidad)));
    realtime.escanerEnviarCodigo(pinActual, p.codigo, n);
    setEnviados((e) => e + 1);
    setUltimo({ codigo: `${p.codigo} ×${n}`, ok: null, nombre: p.nombre });
    vibrar([30, 40, 30]);
    reanudarEscaneo();
  }, [producto, cantidad, reanudarEscaneo]);

  // ─── Cámara de lectura continua (solo en fase escaneando) ───
  useEffect(() => {
    if (fase !== 'escaneando' || !soportaCamara) return;
    let vivo = true;
    iniciarCamara();

    const alVolver = async () => {
      if (document.visibilityState !== 'visible' || !vivo) return;
      if (!streamRef.current && !bloqueadoRef.current) iniciarCamara();
      const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockLike> } }).wakeLock;
      if (wl && !wakeLockRef.current) wakeLockRef.current = await wl.request('screen').catch(() => null);
    };
    document.addEventListener('visibilitychange', alVolver);

    return () => {
      vivo = false;
      document.removeEventListener('visibilitychange', alVolver);
      detenerCamara();
    };
  }, [fase, soportaCamara, iniciarCamara, detenerCamara]);

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
      onRealtimeEvent('escaner:codigo:ack', () => {
        const ms = enviandoRef.current ? Date.now() - enviandoRef.current : 0;
        setEstado(`Enviado (${ms} ms)`);
      }),
      onRealtimeEvent('escaner:resultado', (d: { codigo?: string; encontrado?: boolean; nombre?: string | null; precio?: number | null; stock?: number | null; imagenUrl?: string | null }) => {
        // Solo aplica al código que está en vuelo: un resultado viejo no debe reabrir la hoja.
        if (!d?.codigo || d.codigo !== pendienteRef.current) return;
        pendienteRef.current = null;
        if (esperaRef.current) { clearTimeout(esperaRef.current); esperaRef.current = null; }
        if (d.encontrado) {
          setUltimo({ codigo: d.codigo, ok: true, nombre: d.nombre ?? null });
          abrirHoja({
            codigo: d.codigo,
            nombre: d.nombre || 'Producto',
            precio: typeof d.precio === 'number' ? d.precio : 0,
            stock: typeof d.stock === 'number' ? d.stock : null,
            imagenUrl: d.imagenUrl ?? null,
          });
        } else {
          setUltimo({ codigo: d.codigo, ok: false, nombre: null });
          vibrar([80, 60, 80]);
          abrirHoja({ codigo: d.codigo, nombre: 'Producto sin registrar', precio: 0 });
          setAviso(`La caja no tiene registrado el código ${d.codigo}.`);
        }
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
  }, [abrirHoja]);

  // ─── Limpieza al salir ───
  useEffect(() => {
    return () => {
      if (esperaRef.current) clearTimeout(esperaRef.current);
      if (reanudarRef.current) clearTimeout(reanudarRef.current);
      try { lectorRef.current?.stop(); } catch { /* ignorar */ }
      realtime.escanerSalir();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      wakeLockRef.current?.release?.().catch(() => undefined);
    };
  }, []);

  const emparejar = () => {
    const limpio = soloDigitos(pin);
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

  const enviarManual = () => {
    const codigo = manual.trim();
    if (!codigo) return;
    setManual('');
    if (bloqueadoRef.current) { setAviso('Termina de agregar el producto actual.'); return; }
    // El teclado da un código seguro: se salta el anti-rebote de cámara.
    ultimoCodigoRef.current = '';
    alLeer(codigo);
  };

  // ─── PIN por URL (?pin=XXXXXX): el celular escanea el QR de la caja y entra directo ───
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const param = new URLSearchParams(window.location.search).get('pin');
    if (!param) return;
    const limpio = soloDigitos(param);
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
        const pinLimpio = soloDigitos(d.pinActivo);
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
  const total = producto ? producto.precio * cantidad : 0;

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg, #0B0B0F)', color: 'var(--text, #fff)', padding: 18, fontFamily: 'system-ui, sans-serif', paddingBottom: producto ? 8 : 18 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Lector de códigos</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted, #9CA3AF)', margin: '2px 0 0' }}>{estado}</p>
        </div>
        <span style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 999, background: fase === 'escaneando' ? 'rgba(34,197,94,.15)' : 'rgba(148,163,184,.15)', color: fase === 'escaneando' ? '#22C55E' : 'var(--text-muted, #9CA3AF)', fontWeight: 700 }}>
          {fase === 'escaneando' ? (camaraActiva ? 'LECTOR ACTIVO' : 'PAUSADO') : 'SIN EMPAREJAR'}
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
            onChange={(e) => setPin(soloDigitos(e.target.value))}
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
            <div style={{ position: 'absolute', inset: '28% 8%', border: `2px solid ${bloqueado ? 'rgba(148,163,184,.8)' : 'rgba(34,197,94,.85)'}`, borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,.28)' }}>
              {!bloqueado && (
                <div className="lf-scanframe" style={{ position: 'absolute', left: 10, right: 10, top: '50%', height: 2, borderRadius: 999, background: '#22C55E', boxShadow: '0 0 14px #22C55E' }} />
              )}
            </div>
            {!camaraActiva && soportaCamara && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 20, textAlign: 'center', fontSize: 13.5, color: '#E5E7EB', background: 'rgba(0,0,0,.45)' }}>
                {producto ? 'Lectura en pausa: elige la cantidad' : 'Reactivando la cámara…'}
              </div>
            )}
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
              onKeyDown={(e) => { if (e.key === 'Enter') enviarManual(); }}
              placeholder="Escribir código a mano…"
              inputMode="numeric"
              aria-label="Código manual"
              style={{ flex: 1, padding: '14px 12px', fontSize: 16, borderRadius: 12, border: '1px solid var(--border, #26262F)', background: 'var(--bg-alt, #0F0F14)', color: 'var(--text, #fff)', outline: 'none' }}
            />
            <button
              onClick={enviarManual}
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
              {ultimo?.nombre && <div style={{ fontSize: 12, color: '#22C55E' }}>{ultimo.nombre}</div>}
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

      {/* ─── HOJA DE CANTIDAD ───
          La cámara está detenida aquí: el mismo producto no puede entrar dos veces por accidente. */}
      {producto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,.55)' }}>
          <div className="lf-sheet-up" role="dialog" aria-label="Cantidad del producto" style={{ background: 'var(--surface, #15151C)', borderTop: '1px solid var(--border, #26262F)', borderRadius: '20px 20px 0 0', padding: '14px 16px calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ width: 44, height: 4, borderRadius: 999, background: 'var(--border, #26262F)', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 58, height: 58, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-alt, #0F0F14)', border: '1px solid var(--border, #26262F)', display: 'grid', placeItems: 'center' }}>
                {producto.imagenUrl ? (
                  <img src={producto.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={24} style={{ color: 'var(--text-muted, #9CA3AF)' }} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.25 }}>{producto.nombre}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted, #9CA3AF)', fontFamily: 'ui-monospace, monospace', marginTop: 2, wordBreak: 'break-all' }}>{producto.codigo}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#22C55E', marginTop: 4 }}>
                  C$ {producto.precio.toFixed(2)}
                  {typeof producto.stock === 'number' && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted, #9CA3AF)', marginLeft: 8 }}>
                      stock {producto.stock}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                aria-label="Quitar una unidad"
                style={{ width: 58, height: 58, borderRadius: 14, border: '1px solid var(--border, #26262F)', background: 'var(--bg-alt, #0F0F14)', color: '#fff', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
              </button>
              <input
                value={cantidad}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
                  setCantidad(Number.isFinite(n) ? Math.max(1, Math.min(999, n)) : 1);
                }}
                inputMode="numeric"
                aria-label="Cantidad"
                style={{ width: 84, height: 58, textAlign: 'center', fontSize: 26, fontWeight: 800, borderRadius: 14, border: '1px solid var(--border, #26262F)', background: 'var(--bg-alt, #0F0F14)', color: '#fff', outline: 'none', fontFamily: 'ui-monospace, monospace' }}
              />
              <button
                onClick={() => setCantidad((c) => Math.min(999, c + 1))}
                aria-label="Agregar una unidad"
                style={{ width: 58, height: 58, borderRadius: 14, border: 'none', background: '#22C55E', color: '#06240F', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[1, 2, 3, SALTO_RAPIDO].map((n) => (
                <button
                  key={n}
                  onClick={() => setCantidad((c) => Math.min(999, c + n))}
                  style={{ flex: 1, height: 48, borderRadius: 12, border: '1px solid var(--border, #26262F)', background: 'transparent', color: 'var(--text, #fff)', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                >
                  +{n}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted, #9CA3AF)' }}>Total de la línea</span>
              <span style={{ fontSize: 20, fontWeight: 800 }}>C$ {total.toFixed(2)}</span>
            </div>

            <button
              onClick={confirmarCantidad}
              style={{ width: '100%', marginTop: 12, height: 58, borderRadius: 16, border: 'none', background: '#22C55E', color: '#06240F', fontWeight: 900, fontSize: 16.5, cursor: 'pointer' }}
            >
              AGREGAR A VENTA
            </button>
            <button
              onClick={reanudarEscaneo}
              style={{ width: '100%', marginTop: 8, height: 48, borderRadius: 14, border: '1px solid var(--border, #26262F)', background: 'transparent', color: 'var(--text-muted, #9CA3AF)', fontWeight: 700, cursor: 'pointer' }}
            >
              Seguir escaneando
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
