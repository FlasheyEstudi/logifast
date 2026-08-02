/**
 * LOGIFAST — Notificaciones unificadas con sileo.
 * Reemplaza todos los sistemas de toast duplicados (addToast, useToast,
 * showToast, setToast, LfToast, sonner).
 *
 * Uso:
 *   import { notify } from '@/lib/notify';
 *   notify.success('¡Orden creada!');
 *   notify.error('No se pudo conectar');
 *   notify.info('Repartidor en camino');
 *   notify.warning('Saldo bajo');
 *   notify.loading('Procesando...');
 *   notify.promise(asyncFn, { loading: '...', success: '...', error: '...' });
 */

import { sileo } from 'sileo';

type NotifyVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface NotifyOptions {
  title?: string;
  description?: string;
  duration?: number;
}

function emit(variant: NotifyVariant, message: string, opts?: NotifyOptions): string {
  // sileo acepta 'success' | 'loading' | 'error' | 'warning' | 'info' | 'action'
  const args = {
    title: opts?.title ?? message,
    description: opts?.description ?? (opts?.title ? message : undefined),
    duration: opts?.duration ?? 4000,
    type: variant,
  };
   
  const id = sileo.show(args as any);
  return id;
}

export const notify = {
  success: (msg: string, opts?: NotifyOptions) => emit('success', msg, opts),
  error:   (msg: string, opts?: NotifyOptions) => emit('error', msg, opts),
  info:    (msg: string, opts?: NotifyOptions) => emit('info', msg, opts),
  warning: (msg: string, opts?: NotifyOptions) => emit('warning', msg, opts),
  loading: (msg: string, opts?: NotifyOptions) => emit('loading', msg, { ...opts, duration: opts?.duration ?? 30000 }),

  /** Promesa con estados loading/success/error automáticos. */
  promise: async <T,>(
    fn: () => Promise<T>,
    opts: { loading: string; success: string | ((r: T) => string); error: string | ((e: Error) => string) }
  ): Promise<T> => {
    return sileo.promise(fn, {
      loading: { title: opts.loading, type: 'loading', duration: null },
      success: (r) => ({
        title: typeof opts.success === 'function' ? opts.success(r) : opts.success,
        type: 'success',
      }),
      error: (e) => ({
        title: typeof opts.error === 'function' ? opts.error(e as Error) : opts.error,
        type: 'error',
      }),
    });
  },

  /** Notificación con acción (botón). */
  action: (msg: string, actionLabel: string, onAction: () => void) => {
    sileo.action({
      title: msg,
      button: { title: actionLabel, onClick: onAction },
      duration: 6000,
    });
  },

  dismiss: (id?: string) => {
    if (id) sileo.dismiss(id);
    else sileo.clear();
  },
};
