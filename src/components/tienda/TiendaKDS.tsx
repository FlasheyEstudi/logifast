'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Bell,
  RefreshCw,
} from '@/components/icons';
import { notify } from '@/lib/notify';

interface ItemOrden {
  id?: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
}

interface OrdenKDS {
  id: string;
  estado: string;
  clienteNombre: string;
  clienteTelefono?: string;
  direccionEntrega: string;
  total: number;
  metodoPago: string;
  items: ItemOrden[];
  createdAt: string;
  repartidorNombre?: string;
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM CONSTANTS (LOGIFAST 2.0 UNIFIED)
   ═══════════════════════════════════════════════ */

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 20px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 20,
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--lf-button-radius, 14px)',
  border: 'none',
  background: 'var(--primario)',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
  transition: 'all 0.2s ease',
};

const btnSecondary: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 'var(--lf-button-radius, 14px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'all 0.2s ease',
};

const filterPill = (active: boolean): React.CSSProperties => ({
  padding: '7px 14px',
  borderRadius: 'var(--lf-pill-radius, 100px)',
  background: active ? 'var(--primario)' : 'var(--bg-alt)',
  color: active ? '#FFFFFF' : 'var(--text-muted)',
  border: `1px solid ${active ? 'var(--primario)' : 'var(--border)'}`,
  fontWeight: 600,
  fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.18s ease',
  boxShadow: active ? '0 2px 8px rgba(0, 122, 255, 0.25)' : 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
});

export function TiendaKDS({ isDark, categoriaTienda = 'tienda' }: { isDark: boolean; categoriaTienda?: string }) {
  const [ordenes, setOrdenes] = useState<OrdenKDS[]>([]);
  const [catTienda] = useState(categoriaTienda);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('activos');
  const [ahora, setAhora] = useState(Date.now());

  // Actualizar timer cada minuto para recalcular minutos transcurridos
  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const cargarOrdenes = useCallback(async () => {
    try {
      const res = await fetch('/api/cliente/tienda/pedidos');
      if (!res.ok) return;
      const data = await res.json();
      const ordenesRecibidas: OrdenKDS[] = (data.pedidos || []).map((p: any) => ({
        id: p.id,
        estado: p.estado || 'recibido',
        clienteNombre: p.clienteNombre || 'Cliente',
        clienteTelefono: p.clienteTelefono || '',
        direccionEntrega: p.direccionEntrega || 'Managua',
        total: p.total || 0,
        metodoPago: p.metodoPago || 'efectivo',
        items: p.items || [],
        createdAt: p.fecha ? `${p.fecha} ${p.hora || ''}` : new Date().toISOString(),
      }));

      // Alerta sonora si hay nuevos pedidos recibidos
      const hayNuevas = ordenesRecibidas.some((o) => o.estado === 'recibido');
      if (hayNuevas && soundEnabled) {
        try {
          const audio = new Audio('/sounds/kds-alert.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }

      setOrdenes(ordenesRecibidas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    cargarOrdenes();

    const handleVisibilityAndFetch = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        cargarOrdenes();
      }
    };

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        cargarOrdenes();
      }
    }, 20000);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityAndFetch);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityAndFetch);
      }
    };
  }, [cargarOrdenes]);

  const cambiarEstado = async (ordenId: string, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/cliente/tienda/pedidos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ordenId, estado: nuevoEstado }),
      });
      if (res.ok) {
        notify.success(`Pedido actualizado a ${nuevoEstado}`);
        cargarOrdenes();
      } else {
        const data = await res.json().catch(() => null);
        notify.error(data?.error || 'Error al actualizar el estado');
      }
    } catch (e) {
      notify.error('Error de conexión');
    }
  };

  const isComida = catTienda === 'comida';

  // Conteo por estado
  const conteo = useMemo(() => {
    const recibidos = ordenes.filter((o) => o.estado === 'recibido').length;
    const preparando = ordenes.filter((o) => o.estado === 'preparando').length;
    const listos = ordenes.filter((o) => o.estado === 'listo').length;
    const activos = recibidos + preparando + listos;
    return { activos, recibidos, preparando, listos, todos: ordenes.length };
  }, [ordenes]);

  // Filtrado
  const ordenesFiltradas = useMemo(() => {
    if (filtroEstado === 'activos') {
      return ordenes.filter((o) => o.estado === 'recibido' || o.estado === 'preparando' || o.estado === 'listo');
    }
    if (filtroEstado === 'recibido') return ordenes.filter((o) => o.estado === 'recibido');
    if (filtroEstado === 'preparando') return ordenes.filter((o) => o.estado === 'preparando');
    if (filtroEstado === 'listo') return ordenes.filter((o) => o.estado === 'listo');
    return ordenes;
  }, [ordenes, filtroEstado]);

  // Cálculo de tiempo transcurrido
  const getElapsedInfo = (createdAt: string) => {
    try {
      const diffMs = ahora - new Date(createdAt).getTime();
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      if (mins < 15) {
        return { mins, label: `${mins}m`, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
      }
      if (mins < 30) {
        return { mins, label: `${mins}m`, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
      }
      return { mins, label: `${mins}m`, color: 'bg-red-500/15 text-red-600 dark:text-red-400 font-extrabold' };
    } catch {
      return { mins: 0, label: '0m', color: 'bg-slate-100 text-slate-500' };
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* ─── Header & KDS Navigation Tabs ─── */}
      <div style={sectionCard} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)] font-syne">
                {isComida ? 'Monitor KDS de Cocina' : 'Monitor de Comandas & Despacho'}
              </h2>
              {conteo.recibidos > 0 && (
                <span className="animate-pulse px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-extrabold font-mono shadow-sm">
                  {conteo.recibidos} NUEVOS
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Control en tiempo real de órdenes online y Marketplace para cocina o empaque
            </p>
          </div>

          {/* Quick Sound & Refresh Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={btnSecondary}
              className={`h-11 min-h-[44px] ${
                soundEnabled
                  ? '!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-600 dark:!text-emerald-400'
                  : ''
              }`}
            >
              <Bell size={15} />
              <span>{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
            </button>

            <button
              onClick={cargarOrdenes}
              style={btnSecondary}
              className="h-11 min-h-[44px]"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-[var(--border)]">
          {[
            { id: 'activos', label: 'En Proceso', count: conteo.activos },
            { id: 'recibido', label: 'Nuevos', count: conteo.recibidos, highlight: conteo.recibidos > 0 },
            { id: 'preparando', label: 'Preparando', count: conteo.preparando },
            { id: 'listo', label: 'Listos para Despacho', count: conteo.listos },
            { id: 'todos', label: 'Historial', count: conteo.todos },
          ].map((tab) => {
            const active = filtroEstado === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFiltroEstado(tab.id)}
                style={filterPill(active)}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: active
                      ? 'rgba(255, 255, 255, 0.25)'
                      : tab.highlight
                      ? '#F59E0B'
                      : 'var(--border)',
                    color: active || tab.highlight ? '#FFFFFF' : 'var(--text)',
                  }}
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full font-mono ${
                    tab.highlight && !active ? 'animate-pulse' : ''
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Orders Grid ─── */}
      {ordenesFiltradas.length === 0 ? (
        <div
          style={{
            padding: '80px 24px',
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px dashed var(--border)',
            borderRadius: 20,
          }}
        >
          <Clock size={44} className="mx-auto mb-3 opacity-30 text-slate-500" />
          <h3 className="text-base font-bold text-[var(--text)] font-syne">
            No hay pedidos en esta sección
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Cuando un cliente realice un pedido desde la app móvil o el Marketplace, aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ordenesFiltradas.map((ord) => {
            const elapsed = getElapsedInfo(ord.createdAt);
            const isRecibido = ord.estado === 'recibido';
            const isPreparando = ord.estado === 'preparando';
            const isListo = ord.estado === 'listo';

            return (
              <div
                key={ord.id}
                style={{
                  filter: 'drop-shadow(var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15)))',
                }}
                className="w-full max-w-[320px] mx-auto"
              >
                <div
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    clipPath:
                      'polygon(0% 0%, 100% 0%, 100% calc(100% - 10px), 97.5% 100%, 95% calc(100% - 10px), 92.5% 100%, 90% calc(100% - 10px), 87.5% 100%, 85% calc(100% - 10px), 82.5% 100%, 80% calc(100% - 10px), 77.5% 100%, 75% calc(100% - 10px), 72.5% 100%, 70% calc(100% - 10px), 67.5% 100%, 65% calc(100% - 10px), 62.5% 100%, 60% calc(100% - 10px), 57.5% 100%, 55% calc(100% - 10px), 52.5% 100%, 50% calc(100% - 10px), 47.5% 100%, 45% calc(100% - 10px), 42.5% 100%, 40% calc(100% - 10px), 37.5% 100%, 35% calc(100% - 10px), 32.5% 100%, 30% calc(100% - 10px), 27.5% 100%, 25% calc(100% - 10px), 22.5% 100%, 20% calc(100% - 10px), 17.5% 100%, 15% calc(100% - 10px), 12.5% 100%, 10% calc(100% - 10px), 7.5% 100%, 5% calc(100% - 10px), 2.5% 100%, 0% calc(100% - 10px))',
                    borderTop: isRecibido
                      ? '4px solid var(--peligro, #FF3B30)'
                      : isPreparando
                      ? '4px solid var(--warning, #FF9500)'
                      : isListo
                      ? '4px solid var(--exito, #34C759)'
                      : '4px solid var(--border)',
                  }}
                  className="p-4 pb-8 font-mono text-xs flex flex-col gap-3 transition-colors duration-200"
                >
                  {/* Cabecera comanda */}
                  <div className="text-center pb-2 border-b border-dashed border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                      LOGIFAST KDS
                    </div>
                    <div className="text-xl font-black tracking-tight text-[var(--text)] mt-0.5">
                      PEDIDO #{ord.id.slice(-5).toUpperCase()}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {ord.createdAt}
                    </div>
                    <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-alt)] text-[var(--text)]">
                      {ord.estado} &middot; {elapsed.label}
                    </div>
                  </div>

                  {/* Cliente y Entrega */}
                  <div className="space-y-1 pb-2 border-b border-dashed border-[var(--border)]">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">CLIENTE:</span>
                      <span className="font-bold text-[var(--text)] text-right truncate">{ord.clienteNombre}</span>
                    </div>
                    {ord.clienteTelefono && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">TEL:</span>
                        <span className="text-[var(--text)]">{ord.clienteTelefono}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-2 text-[11px]">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">ENTREGA:</span>
                      <span className="text-[var(--text-muted)] text-right truncate">{ord.direccionEntrega}</span>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="space-y-1.5 pb-2 border-b border-dashed border-[var(--border)]">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <span>CANT / ARTICULO</span>
                      <span>PRECIO</span>
                    </div>
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2">
                        <span className="font-bold text-[var(--text)] flex-1">
                          <span className="font-black text-[var(--primario)] mr-1">{it.cantidad}x</span>
                          {it.nombreProducto}
                        </span>
                        <span className="text-[var(--text-muted)] shrink-0">
                          C$ {(it.cantidad * it.precioUnitario).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
                      TOTAL ({ord.metodoPago}):
                    </span>
                    <span className="text-base font-black text-[var(--text)]">
                      C$ {ord.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="pt-2 font-sans space-y-1.5">
                    {isRecibido && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'preparando')}
                        style={{ ...btnPrimary, width: '100%' }}
                        className="h-10 text-xs font-bold active:scale-95 transition-all"
                      >
                        Aceptar y Preparar
                      </button>
                    )}

                    {isPreparando && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'listo')}
                        style={{
                          ...btnPrimary,
                          width: '100%',
                          background: 'var(--exito, #34C759)',
                        }}
                        className="h-10 text-xs font-bold active:scale-95 transition-all"
                      >
                        Marcar Listo
                      </button>
                    )}

                    {isListo && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'en_camino')}
                        style={{ ...btnSecondary, width: '100%' }}
                        className="h-10 text-xs font-bold active:scale-95 transition-all"
                      >
                        Entregar a Repartidor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
