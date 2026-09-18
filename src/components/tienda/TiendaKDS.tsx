'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  RefreshCw,
  Bike,
  Package,
  Phone,
  MapPin,
  Flame,
  Check,
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
    <div className="space-y-4 sm:space-y-5">
      {/* ─── Header & KDS Navigation Tabs ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
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
              className={`h-11 min-h-[44px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 border ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[var(--bg-alt)] border-[var(--border)] text-slate-500'
              }`}
            >
              <Bell size={15} />
              <span>{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
            </button>

            <button
              onClick={cargarOrdenes}
              className="h-11 min-h-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-[var(--border)] text-[var(--text)] text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
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
                className={`h-10 min-h-[40px] px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 flex items-center gap-2 shrink-0 ${
                  active
                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                    : 'bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md font-mono ${
                    active
                      ? 'bg-white/20 text-white'
                      : tab.highlight
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-[var(--border)] text-[var(--text)]'
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
        <div className="py-20 text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl p-6">
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
                className={`rounded-2xl bg-[var(--surface)] border shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                  isRecibido
                    ? 'border-amber-500/60 ring-2 ring-amber-500/20 shadow-amber-500/5'
                    : isPreparando
                    ? 'border-blue-500/60'
                    : isListo
                    ? 'border-emerald-500/60'
                    : 'border-[var(--border)]'
                }`}
              >
                {/* Order Top Banner */}
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
                    isRecibido
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                      : isPreparando
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
                      : isListo
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold font-mono tracking-tight">
                      #{ord.id.slice(-5).toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono ${elapsed.color}`}
                    >
                      {elapsed.mins >= 30 && <AlertCircle size={11} className="shrink-0" />}
                      <span>{elapsed.label}</span>
                    </span>
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider">
                    {ord.estado}
                  </span>
                </div>

                {/* Customer & Delivery Information */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text)]">
                          {ord.clienteNombre}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{ord.direccionEntrega}</span>
                        </p>
                      </div>

                      {ord.clienteTelefono && (
                        <a
                          href={`tel:${ord.clienteTelefono}`}
                          className="w-8 h-8 rounded-lg bg-[var(--bg-alt)] text-[var(--text-secondary)] flex items-center justify-center shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Llamar al cliente"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                    </div>

                    {/* Order Items List */}
                    <div className="mt-3 p-3 rounded-xl bg-[var(--bg-alt)] border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                        {isComida ? 'Comanda para Preparar' : 'Artículos a Empacar'}
                      </div>
                      {ord.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs text-[var(--text)]"
                        >
                          <span className="font-semibold">
                            <span className="font-mono font-bold text-primary mr-1.5">{it.cantidad}x</span>
                            {it.nombreProducto}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            C$ {(it.cantidad * it.precioUnitario).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Total */}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      Pago: <span className="capitalize font-bold text-[var(--text)]">{ord.metodoPago}</span>
                    </span>
                    <span className="text-base font-extrabold text-primary font-mono">
                      C$ {ord.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Action Transition Buttons (Min height 44px) */}
                  <div className="pt-2">
                    {isRecibido && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'preparando')}
                        className="w-full h-11 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Flame size={16} />
                        <span>{isComida ? 'Aceptar & Preparar Platos' : 'Aceptar & Alistar Pedido'}</span>
                      </button>
                    )}

                    {isPreparando && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'listo')}
                        className="w-full h-11 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Check size={16} />
                        <span>{isComida ? 'Marcar Comanda Lista' : 'Marcar Paquete Empacado'}</span>
                      </button>
                    )}

                    {isListo && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'en_camino')}
                        className="w-full h-11 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Bike size={16} />
                        <span>Entregar a Repartidor</span>
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
