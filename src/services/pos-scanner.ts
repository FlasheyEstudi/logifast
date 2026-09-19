'use client';

/**
 * Servicio singleton del escáner inalámbrico del POS.
 * La sala (PIN) vive aquí, NO en el componente del modal: sobrevive al cambio de
 * módulo, al cierre del modal y a las reconexiones del socket. El modal es solo visual.
 */
import { realtime, onRealtimeEvent } from './realtime';

type OyenteCodigo = (codigo: string) => void;
type OyenteEstado = (lectorConectado: boolean) => void;

const CLAVE_SESION = 'pos_active_session';

let pinActivo: string | null = null;
let lectorConectado = false;
let inicializado = false;
let oyentesCodigo: OyenteCodigo[] = [];
let oyentesEstado: OyenteEstado[] = [];

function limpiarPersistencia() {
  if (typeof window !== 'undefined') localStorage.removeItem(CLAVE_SESION);
}

/** Registra los listeners globales UNA sola vez (el POS los consume esté o no el modal abierto). */
export function iniciarPosScanner() {
  if (inicializado) return;
  inicializado = true;

  onRealtimeEvent('escaner:presencia', (d: { lectorConectado?: boolean }) => {
    if (!pinActivo) return;
    lectorConectado = !!d?.lectorConectado;
    oyentesEstado.forEach((f) => f(lectorConectado));
  });

  onRealtimeEvent('escaner:codigo:recibido', (d: { codigo?: string }) => {
    const codigo = d?.codigo;
    if (!pinActivo || !codigo) return;
    oyentesCodigo.forEach((f) => f(codigo));
  });

  onRealtimeEvent('escaner:cerrada', () => {
    pinActivo = null;
    lectorConectado = false;
    limpiarPersistencia();
    oyentesEstado.forEach((f) => f(false));
  });
}

/** Abre (o reabre) la sala con el PIN y persiste la sesión para reconectar automáticamente. */
export function abrirSesionPos(pin: string) {
  if (!pin) return;
  pinActivo = pin;
  lectorConectado = false;
  if (typeof window !== 'undefined') localStorage.setItem(CLAVE_SESION, pin);
  realtime.escanerAbrir(pin);
  // Registra el PIN para que el celular ya vinculado se una solo (WhatsApp Web).
  fetch('/api/qr-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  }).catch(() => null);
  oyentesEstado.forEach((f) => f(false));
}

/** Cierre explícito (botón Desconectar). Único punto que cierra la sala. */
export function cerrarSesionPos() {
  if (pinActivo) realtime.escanerCerrar(pinActivo);
  pinActivo = null;
  lectorConectado = false;
  limpiarPersistencia();
  oyentesEstado.forEach((f) => f(false));
}

/** Al arrancar la tienda: si había sesión activa, la reabre sin mostrar nada. */
export function reconectarSesionPos(): boolean {
  const pin = typeof window !== 'undefined' ? localStorage.getItem(CLAVE_SESION) : null;
  if (pin && /^\d{6}$/.test(pin)) {
    abrirSesionPos(pin);
    return true;
  }
  return false;
}

export function getSesionPos() {
  return { pin: pinActivo, lectorConectado };
}

export function onCodigoPos(fn: OyenteCodigo): () => void {
  oyentesCodigo.push(fn);
  return () => {
    oyentesCodigo = oyentesCodigo.filter((x) => x !== fn);
  };
}

export function onEstadoPos(fn: OyenteEstado): () => void {
  oyentesEstado.push(fn);
  return () => {
    oyentesEstado = oyentesEstado.filter((x) => x !== fn);
  };
}

/** El POS responde al celular si el código resolvió o no a un producto. */
export function responderCodigo(codigo: string, encontrado: boolean, nombre?: string | null) {
  if (!pinActivo) return;
  realtime.escanerResultado(pinActivo, codigo, encontrado, nombre ?? null);
}
