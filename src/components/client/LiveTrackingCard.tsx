'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onRealtimeEvent } from '@/services/realtime';

export interface OrdenActiva {
  id: string;
  estado: string;
  origen?: string;
  destino?: string;
  repartidorNombre?: string;
  tiempoEstimadoMin?: number;
}

interface LiveTrackingCardProps {
  order: OrdenActiva | null;
  isDark?: boolean;
  onOpen: () => void;
}

interface Toast {
  id: number;
  texto: string;
}

const PASOS = ['Recibido', 'Preparando', 'En Camino', 'Entregado'];

function pasoDeEstado(estado: string): number {
  const e = (estado || '').toLowerCase();
  if (e === 'entregado') return 3;
  if (['en_camino', 'recogido', 'aceptado', 'en camino', 'en transito'].includes(e)) return 2;
  if (['preparando', 'preparacion', 'preparada', 'confirmado', 'confirmada'].includes(e)) return 1;
  return 0;
}

const TOASTS_POR_PASO: Record<number, string> = {
  0: 'Tu pedido fue recibido 🧾',
  1: 'Tu pedido ya está en preparación 🔥',
  2: 'Tu repartidor va en camino 🛵',
  3: 'Tu pedido fue entregado ✅',
};

/** Tarjeta en vivo sticky del portal cliente: timeline animado + repartidor + toasts. */
export default function LiveTrackingCard({ order, isDark = false, onOpen }: LiveTrackingCardProps) {
  const [estado, setEstado] = useState<string>(order?.estado ?? '');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const ultimoPasoRef = useRef<number>(-1);

  useEffect(() => {
    setEstado(order?.estado ?? '');
  }, [order?.id, order?.estado]);

  const paso = useMemo(() => pasoDeEstado(estado), [estado]);

  const mostrarToast = useCallback((texto: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, texto }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Toast al cambiar de paso
  useEffect(() => {
    if (ultimoPasoRef.current === -1) {
      ultimoPasoRef.current = paso;
      return;
    }
    if (paso !== ultimoPasoRef.current) {
      ultimoPasoRef.current = paso;
      mostrarToast(TOASTS_POR_PASO[paso] ?? 'Tu pedido cambió de estado');
    }
  }, [paso, mostrarToast]);

  // Realtime: el servidor notifica cambios de estado del pedido sin recargar
  useEffect(() => {
    if (!order?.id) return;
    const off = onRealtimeEvent('orden:estado:update', (d: { ordenId?: string; id?: string; estado?: string }) => {
      const oid = d?.ordenId || d?.id;
      if (oid && String(oid) === String(order.id) && d?.estado) {
        setEstado(d.estado);
      }
    });
    return off;
  }, [order?.id]);

  if (!order) return null;

  const enCamino = paso === 2;
  const progreso = Math.round((paso / (PASOS.length - 1)) * 100);
  const nombre = order.repartidorNombre || 'Tu repartidor';
  const eta = order.tiempoEstimadoMin ?? 12;

  return (
    <>
      {/* Toasts animados (slide-in-right + fade) */}
      <div
        className="fixed flex flex-col items-end gap-2 z-[9998]"
        style={{ top: 'calc(env(safe-area-inset-top, 10px) + 64px)', right: 12, pointerEvents: 'none' }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="lf-toast rounded-full px-4 py-2.5 text-xs font-bold shadow-lg"
            style={{
              background: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.97)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {t.texto}
          </div>
        ))}
      </div>

      {/* Card en vivo sticky (full-bleed, esquinas superiores redondeadas) */}
      <div
        className="lf-live-card fixed left-0 right-0 z-[9980] rounded-t-[24px] cursor-pointer"
        style={{
          bottom: 'calc(var(--ios-tabbar-height, 76px) + env(safe-area-inset-bottom, 0px) + 10px)',
          background: isDark ? 'rgba(20,20,28,0.97)' : 'rgba(255,255,255,0.98)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          padding: '14px 16px 16px',
        }}
        onClick={onOpen}
      >
        {/* Timeline 4 pasos */}
        <div className="flex items-center gap-2">
          {PASOS.map((label, i) => {
            const activo = i === paso;
            const completado = i < paso;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1" style={{ flex: i === PASOS.length - 1 ? '0 0 auto' : 1 }}>
                  <div
                    className={`relative w-3.5 h-3.5 rounded-full border-2 ${activo ? 'animate-pulse' : ''}`}
                    style={{
                      background: completado || activo ? '#22C55E' : 'transparent',
                      borderColor: completado || activo ? '#22C55E' : 'var(--text-muted)',
                    }}
                  />
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: activo ? 'var(--text)' : 'var(--text-muted)', opacity: activo || completado ? 1 : 0.65 }}
                  >
                    {label}
                  </span>
                </div>
                {i < PASOS.length - 1 && (
                  <div className="flex-1 h-1 rounded-full overflow-hidden mb-3" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: i < paso ? '100%' : i === paso && activo ? '45%' : '0%', background: '#22C55E' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Detalle del estado */}
        <div className="flex items-center gap-3 mt-3">
          {enCamino ? (
            <>
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                style={{ background: 'var(--primario)' }}
              >
                {nombre.trim().charAt(0).toUpperCase()}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full animate-pulse"
                  style={{ background: '#22C55E', border: '2px solid var(--surface)' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{nombre} viene en camino</div>
                <div className="relative h-2 rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--border)' }}>
                  <div
                    className="absolute inset-y-0 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progreso}%`, background: 'var(--primario)' }}
                  />
                  <span
                    className="absolute top-1/2 -translate-y-1/2 text-base"
                    style={{ left: `${Math.min(progreso, 92)}%`, animation: 'lf-moto 2.4s ease-in-out infinite' }}
                  >
                    🛵
                  </span>
                </div>
                <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Llega en <b style={{ color: 'var(--text)' }}>{eta} min</b> · {order.origen} → {order.destino}
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-xl">📦</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{PASOS[paso]}</div>
                <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {order.origen} → {order.destino}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
