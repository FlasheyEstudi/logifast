'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { reproducirSonido } from '@/services/audio';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

export type Tema = 'light' | 'dark' | 'system';
export type Idioma = 'es' | 'en';

export interface ConfigState {
  /* ─── Persisted state ─── */
  tema: Tema;
  sonidoActivo: boolean;
  volumenSonido: number; // 0-100
  vibracionActiva: boolean;
  notificacionesPush: boolean;
  notificacionesEmail: boolean;
  notificacionesSonido: boolean;
  compartirUbicacion: boolean;
  idioma: Idioma;

  /* ─── Actions ─── */
  setTema: (tema: Tema) => void;
  toggleSonido: () => void;
  setVolumen: (volumen: number) => void;
  toggleVibracion: () => void;
  toggleNotificacionesPush: () => void;
  toggleNotificacionesEmail: () => void;
  toggleNotificacionesSonido: () => void;
  toggleCompartirUbicacion: () => void;
  setIdioma: (idioma: Idioma) => void;
}

/* ═══════════════════════════════════════════════
   THEME HELPERS
   ═══════════════════════════════════════════════ */

export const CONFIG_STORAGE_KEY = 'logifast-config';

/**
 * Apply a tema to the document root. For 'system', resolves against
 * the OS prefers-color-scheme media query. SSR-safe (no-ops on server).
 *
 * NOTE: this is intentionally exported so ThemeProvider and other
 * callers can apply the theme imperatively without going through the
 * store (e.g. on first paint before React hydrates).
 */
export function aplicarTema(tema: Tema): void {
  if (typeof window === 'undefined') return;
  if (typeof document === 'undefined') return;

  let resolved: 'light' | 'dark';
  if (tema === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } else {
    resolved = tema;
  }
  document.documentElement.setAttribute('data-theme', resolved);
}

/**
 * Read the persisted tema from localStorage and apply it immediately.
 * Used by ThemeProvider on mount to avoid a flash of the wrong theme
 * after hydration. Falls back to 'system' on any error.
 */
export function inicializarTema(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        state?: { tema?: Tema };
      };
      const tema = parsed?.state?.tema ?? 'system';
      aplicarTema(tema);
    } else {
      aplicarTema('system');
    }
  } catch {
    aplicarTema('system');
  }
}

/* ═══════════════════════════════════════════════
   SSR-SAFE STORAGE ADAPTER
   ═══════════════════════════════════════════════ */

/**
 * Noop StateStorage used during SSR. Persist hydrates on the client
 * so this is only hit if the store is somehow read on the server.
 */
const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/* ═══════════════════════════════════════════════
   ZUSTAND STORE
   ═══════════════════════════════════════════════ */

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      /* ─── Defaults ─── */
      tema: 'system',
      sonidoActivo: true,
      volumenSonido: 80,
      vibracionActiva: true,
      notificacionesPush: true,
      notificacionesEmail: false,
      notificacionesSonido: true,
      compartirUbicacion: true,
      idioma: 'es',

      /* ─── Actions ─── */
      setTema: (tema) => {
        aplicarTema(tema);
        set({ tema });
      },

      toggleSonido: () => {
        const next = !get().sonidoActivo;
        set({ sonidoActivo: next });
        // Play a confirmation chirp after a tiny delay so the toggle
        // UI has time to flip before the sound fires.
        if (next) {
          setTimeout(() => {
            try {
              reproducirSonido('toggle_on', get().volumenSonido);
            } catch (err) {
              console.warn('configStore: toggle_on sound failed', err);
            }
          }, 50);
        }
      },

      setVolumen: (volumen) => {
        const clamped = Math.max(0, Math.min(100, Math.round(volumen)));
        set({ volumenSonido: clamped });
      },

      toggleVibracion: () => {
        const next = !get().vibracionActiva;
        set({ vibracionActiva: next });
        if (
          next &&
          typeof navigator !== 'undefined' &&
          typeof navigator.vibrate === 'function'
        ) {
          try {
            navigator.vibrate(50);
          } catch {
            // Ignore — Vibration API isn't critical.
          }
        }
      },

      toggleNotificacionesPush: () =>
        set((s) => ({ notificacionesPush: !s.notificacionesPush })),

      toggleNotificacionesEmail: () =>
        set((s) => ({ notificacionesEmail: !s.notificacionesEmail })),

      toggleNotificacionesSonido: () =>
        set((s) => ({ notificacionesSonido: !s.notificacionesSonido })),

      toggleCompartirUbicacion: () =>
        set((s) => ({ compartirUbicacion: !s.compartirUbicacion })),

      setIdioma: (idioma) => set({ idioma }),
    }),
    {
      name: CONFIG_STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : noopStorage
      ),
      // Only persist the data fields, never the action functions.
      partialize: (state) => ({
        tema: state.tema,
        sonidoActivo: state.sonidoActivo,
        volumenSonido: state.volumenSonido,
        vibracionActiva: state.vibracionActiva,
        notificacionesPush: state.notificacionesPush,
        notificacionesEmail: state.notificacionesEmail,
        notificacionesSonido: state.notificacionesSonido,
        compartirUbicacion: state.compartirUbicacion,
        idioma: state.idioma,
      }),
    }
  )
);
