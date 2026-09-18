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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


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
        return { mins, label: `${mins}m`, color: 'bg-[var(--exito)]/15 text-[var(--exito)]' };
      }
      if (mins < 30) {
        return { mins, label: `${mins}m`, color: 'bg-[var(--warning)]/15 text-[var(--warning)]' };
      }
      return { mins, label: `${mins}m`, color: 'bg-[var(--peligro)]/15 text-[var(--peligro)] font-extrabold' };
    } catch {
      return { mins: 0, label: '0m', color: 'bg-[var(--bg-alt)] text-[var(--text-muted)]' };
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* ─── Header & KDS Navigation Tabs ─── */}
      <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] font-syne">
                  {isComida ? 'Monitor KDS de Cocina' : 'Monitor de Comandas & Despacho'}
                </h2>
                {conteo.recibidos > 0 && (
                  <Badge className="animate-pulse px-3 py-0.5 rounded-full bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-white text-xs font-extrabold font-mono shadow-[var(--lf-shadow-card)]">
                    {conteo.recibidos} NUEVOS
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">
                Control en tiempo real de órdenes online y Marketplace para cocina o empaque
              </p>
            </div>

            {/* Quick Sound & Refresh Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`h-10 rounded-full px-4 text-xs font-bold gap-2 shadow-[var(--lf-shadow-card)] ${
                  soundEnabled
                    ? 'border-[var(--exito)] bg-[var(--exito)]/10 text-[var(--exito)] hover:bg-[var(--exito)]/20'
                    : ''
                }`}
              >
                <Bell size={15} />
                <span>{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={cargarOrdenes}
                className="h-10 rounded-full px-4 text-xs font-bold gap-1.5 shadow-[var(--lf-shadow-card)]"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-3 border-t border-[var(--border)]">
            {[
              { id: 'activos', label: 'En Proceso', count: conteo.activos },
              { id: 'recibido', label: 'Nuevos', count: conteo.recibidos, highlight: conteo.recibidos > 0 },
              { id: 'preparando', label: 'Preparando', count: conteo.preparando },
              { id: 'listo', label: 'Listos para Despacho', count: conteo.listos },
              { id: 'todos', label: 'Historial', count: conteo.todos },
            ].map((tab) => {
              const active = filtroEstado === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={active ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setFiltroEstado(tab.id)}
                  className={`h-9 rounded-full text-xs font-bold px-4 gap-2 shrink-0 transition-all ${
                    active
                      ? 'shadow-[var(--lf-shadow-card)] shadow-primary/25'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                      active
                        ? 'bg-white/25 text-white'
                        : tab.highlight
                        ? 'bg-[var(--warning)] text-white animate-pulse'
                        : 'bg-[var(--bg-alt)] text-[var(--text)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Orders Grid ─── */}
      {ordenesFiltradas.length === 0 ? (
        <div className="py-20 px-6 text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-[var(--lf-card-radius)]">
          <Clock size={44} className="mx-auto mb-3 opacity-30 text-[var(--text-muted)]" />
          <h3 className="text-base font-bold text-[var(--text)] font-syne">
            No hay pedidos en esta sección
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            Cuando un cliente realice un pedido desde la app móvil o el Marketplace, aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {ordenesFiltradas.map((ord) => {
            const elapsed = getElapsedInfo(ord.createdAt);
            const isRecibido = ord.estado === 'recibido';
            const isPreparando = ord.estado === 'preparando';
            const isListo = ord.estado === 'listo';

            return (
              <div
                key={ord.id}
                className="w-full max-w-[360px] mx-auto rounded-[var(--lf-card-radius)] overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] hover:shadow-[var(--lf-shadow-card)]/90 transition-all flex flex-col"
              >
                {/* Status Color Banner */}
                <div
                  className={`h-2 w-full ${
                    isRecibido
                      ? 'bg-[var(--peligro)]'
                      : isPreparando
                      ? 'bg-[var(--warning)]'
                      : isListo
                      ? 'bg-[var(--exito)]'
                      : 'bg-[var(--bg-alt)]'
                  }`}
                />

                <div className="p-5 font-mono text-xs flex flex-col gap-3.5 flex-1 justify-between">
                  {/* Cabecera comanda */}
                  <div className="pb-3 border-b border-dashed border-[var(--border)] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] uppercase font-bold tracking-widest text-[var(--text-muted)] font-sans">
                        LOGIFAST KDS
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${elapsed.color} font-sans`}>
                        {elapsed.label}
                      </span>
                    </div>

                    <div className="text-lg font-black tracking-tight text-[var(--text)]">
                      PEDIDO #{ord.id.slice(-5).toUpperCase()}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)]">
                      <span>{ord.createdAt}</span>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--bg-alt)] text-[var(--text)]">
                        {ord.estado}
                      </span>
                    </div>
                  </div>

                  {/* Cliente y Entrega */}
                  <div className="space-y-1.5 pb-3 border-b border-dashed border-[var(--border)]">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">CLIENTE:</span>
                      <span className="font-bold text-[var(--text)] text-right truncate">{ord.clienteNombre}</span>
                    </div>
                    {ord.clienteTelefono && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">TEL:</span>
                        <span className="text-[var(--text)]">{ord.clienteTelefono}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-2 text-[11px]">
                      <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">ENTREGA:</span>
                      <span className="text-[var(--text-muted)] text-right truncate">{ord.direccionEntrega}</span>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="space-y-1.5 pb-3 border-b border-dashed border-[var(--border)] flex-1">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <span>CANT / ARTÍCULO</span>
                      <span>PRECIO</span>
                    </div>
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2">
                        <span className="font-bold text-[var(--text)] flex-1">
                          <span className="font-black text-primary mr-1.5">{it.cantidad}x</span>
                          {it.nombreProducto}
                        </span>
                        <span className="text-[var(--text-muted)] shrink-0 font-medium">
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
                    <span className="text-base font-black text-[var(--text)] font-mono">
                      C$ {ord.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="pt-2 font-sans space-y-2">
                    {isRecibido && (
                      <Button
                        onClick={() => cambiarEstado(ord.id, 'preparando')}
                        className="w-full h-11 rounded-full text-xs font-bold shadow-[var(--lf-shadow-card)] shadow-primary/20"
                      >
                        Aceptar y Preparar
                      </Button>
                    )}

                    {isPreparando && (
                      <Button
                        onClick={() => cambiarEstado(ord.id, 'listo')}
                        className="w-full h-11 rounded-full text-xs font-bold bg-[var(--exito)] hover:bg-[var(--exito)]/90 text-white shadow-[var(--lf-shadow-card)] shadow-[var(--exito)]/20"
                      >
                        Marcar Listo
                      </Button>
                    )}

                    {isListo && (
                      <Button
                        variant="secondary"
                        onClick={() => cambiarEstado(ord.id, 'en_camino')}
                        className="w-full h-11 rounded-full text-xs font-bold shadow-[var(--lf-shadow-card)]"
                      >
                        Entregar a Repartidor
                      </Button>
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
