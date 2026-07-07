'use client';

import { useEffect } from 'react';
import {
  useConfigStore,
  inicializarTema,
  aplicarTema,
} from '@/store/configStore';

/**
 * ThemeProvider — wires the LOGIFAST configStore `tema` value into
 * the DOM. Mounts once at the app root (or per-role layout).
 *
 * Responsibilities:
 *  1. On mount: call `inicializarTema()` to read the persisted tema
 *     from localStorage and apply it before first paint.
 *  2. Whenever the store `tema` changes: re-apply the data-theme
 *     attribute (handles hydration rehydration + user toggles).
 *  3. When tema === 'system': subscribe to OS prefers-color-scheme
 *     changes and live-update the data-theme attribute.
 *
 * Renders no wrapper DOM — just its children.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const tema = useConfigStore((s) => s.tema);
  // 1. Apply persisted theme on first mount, register Service Worker, and bind ChunkLoadError recovery.
  useEffect(() => {
    inicializarTema();

    const handleGlobalError = (event: ErrorEvent) => {
      const errorMsg = event.message || '';
      const isChunkError = 
        errorMsg.includes('Failed to load chunk') || 
        errorMsg.includes('ChunkLoadError') ||
        (event.error && (
          event.error.name === 'ChunkLoadError' || 
          event.error.message?.includes('Failed to load chunk')
        ));
      
      if (isChunkError) {
        console.warn('ChunkLoadError detectado. Limpiando cache/SW y recargando...');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            for (const reg of regs) {
              reg.unregister();
            }
          });
        }
        if ('caches' in window) {
          caches.keys().then(keys => {
            keys.forEach(key => caches.delete(key));
          });
        }
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    };

    window.addEventListener('error', handleGlobalError, true);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW registrado:', reg.scope))
          .catch(err => console.error('Error SW:', err));
      });
    }

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);
  // 2. Re-apply whenever the store tema changes (incl. after hydration).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    aplicarTema(tema);
  }, [tema]);

  // 3. When following the OS theme, listen for OS preference changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (tema !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (typeof document === 'undefined') return;
      const resolved = mq.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', resolved);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [tema]);

  return <>{children}</>;
}
