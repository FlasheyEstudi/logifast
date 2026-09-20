'use client';

/**
 * Servicio singleton del escáner inalámbrico del POS.
 * La sala (PIN) vive aquí, NO en el componente del modal: sobrevive al cambio de
 * módulo, al cierre del modal y a las reconexiones del socket. El modal es solo visual.
 */
import { realtime, onRealtimeEvent } from './realtime';

type OyenteCodigo = (codigo: string, cantidad: number) => void;
type OyenteEstado = (lectorConectado: boolean) => void;

const CLAVE_SESION = 'pos_active_session';

/**
 * El PIN de la sala se guarda en `sessionStorage` (vive en la pestaña), NO en
 * `localStorage`. Dos pestañas del mismo POS abriendo el panel a la vez se pisaban
 * la sala y dejaban al celular emparejado con la pestaña equivocada.
 */
const guardarSesion = (pin: string) => {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.setItem(CLAVE_SESION, pin); } catch { /* modo privado */ }
};

const leerSesion = (): string | null => {
  if (typeof window === 'undefined') return null;
  try { return window.sessionStorage.getItem(CLAVE_SESION); } catch { return null; }
};

let pinActivo: string | null = null;
let lectorConectado = false;
let inicializado = false;
let oyentesCodigo: OyenteCodigo[] = [];
let oyentesEstado: OyenteEstado[] = [];

function limpiarPersistencia() {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.removeItem(CLAVE_SESION); } catch { /* ignorar */ }
}

/** Registra los listeners globales UNA sola vez (el POS los consume esté o no el modal abierto). */
export function iniciarPosScanner() {
  if (inicializado) return;
  inicializado = true;

  onRealtimeEvent('escaner:presencia', (d: { lectorConectado?: boolean }) => {
    lectorConectado = !!d?.lectorConectado;
    // El estado del lector se publica aunque esta pestaña no tenga el pinActivo:
    // puede ser la pestaña sin sala y aun así la UI debe reflejar la verdad del socket.
    if (pinActivo) oyentesEstado.forEach((f) => f(lectorConectado));
  });

  onRealtimeEvent('escaner:codigo:recibido', (d: { codigo?: string; cantidad?: number }) => {
    const codigo = d?.codigo;
    if (!codigo) return;
    const cantidad = Math.max(1, Math.min(999, Math.round(Number(d?.cantidad) || 1)));
    oyentesCodigo.forEach((f) => f(codigo, cantidad));
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
  guardarSesion(pin);
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

/** Al arrancar la tienda: si esta pestaña tenía sesión activa, la reabre sin mostrar nada. */
export function reconectarSesionPos(): boolean {
  const pin = leerSesion();
  if (pin && /^\d{6}$/.test(pin)) {
    abrirSesionPos(pin);
    return true;
  }
  return false;
}

export function getSesionPos() {
  return { pin: pinActivo, lectorConectado };
}

export function onCodigoPos(fn: OyenteCodigo): () => void {  oyentesCodigo.push(fn);
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

/** El POS responde al celular si el código resolvió a un producto y con qué datos.
 *  El nombre/precio/stock viajan al celular para que la hoja de cantidad muestre la
 *  ficha real: el celular no consulta la base ni conoce el catálogo. */
export function responderCodigo(
  codigo: string,
  encontrado: boolean,
  nombre?: string | null,
  extra?: { precio?: number | null; stock?: number | null; imagenUrl?: string | null }
) {
  realtime.escanerResultado(codigo, encontrado, nombre ?? null, { pin: pinActivo ?? undefined, ...extra });
}
