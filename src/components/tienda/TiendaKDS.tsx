'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Bell,
  RefreshCw,
} from '@/components/icons';
import { notify } from '@/lib/notify';
import { onRealtimeEvent, realtime } from '@/services/realtime';

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

    // ─── TIEMPO REAL ───
    // El KDS ya no depende del sondeo de 20 s para enterarse de un pedido nuevo: la
    // tablet se suscribe a la sala de la tienda y recibe el aviso al instante. El
    // sondeo se MANTIENE como respaldo (redes caídas, pestaña suspendida).
    let vivo = true;
    fetch('/api/tienda/perfil', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const tiendaId = d?.tienda?.id;
        if (vivo && tiendaId) realtime.tiendaConectar(tiendaId);
      })
      .catch(() => null);

    const offNueva = onRealtimeEvent('tienda:orden:nueva', () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') cargarOrdenes();
    });
    const offActualizada = onRealtimeEvent('tienda:orden:actualizada', () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') cargarOrdenes();
    });

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
      vivo = false;
      offNueva();
      offActualizada();
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
      if (mins < 10) {
        return { mins, label: `${mins}m`, color: 'border-[var(--exito)]/40 bg-[var(--exito)]/15 text-[var(--exito)]' };
      }
      if (mins < 20) {
        return { mins, label: `${mins}m`, color: 'border-[var(--warning)]/40 bg-[var(--warning)]/15 text-[var(--warning)]' };
      }
      return { mins, label: `${mins}m`, color: 'border-[var(--peligro)]/40 bg-[var(--peligro)]/15 text-[var(--peligro)] font-extrabold' };
    } catch {
      return { mins: 0, label: '0m', color: 'bg-[var(--bg-alt)] text-[var(--text-muted)]' };
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* ─── Header & KDS Navigation Tabs ─── */}
      <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-semibold text-[var(--text)] font-syne">
                  {isComida ? 'Monitor KDS de Cocina' : 'Monitor de Comandas & Despacho'}
                </h2>
                {conteo.recibidos > 0 && (
                  <Badge className="animate-pulse rounded-full border-[var(--warning)] bg-[var(--warning)]/15 px-2.5 py-1 font-mono text-xs font-bold text-[var(--warning)]">
                    {conteo.recibidos} NUEVOS
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Control en tiempo real de órdenes online y Marketplace para cocina o empaque
              </p>
            </div>

            {/* Quick Sound & Refresh Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`h-11 rounded-full px-4 text-xs font-bold gap-2 shadow-[var(--lf-shadow-card)] ${
                  soundEnabled
                    ? 'border-[var(--exito)] text-[var(--exito)] hover:bg-[var(--exito)]/10 hover:text-[var(--exito)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                <Bell size={15} />
                <span>{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={cargarOrdenes}
                className="h-11 rounded-full border-[var(--border)] px-4 text-xs font-bold gap-1.5 text-[var(--text)] shadow-[var(--lf-shadow-card)]"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-[var(--primario)]' : 'text-[var(--text-muted)]'} />
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
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroEstado(tab.id)}
                  className={`h-11 rounded-full px-4 text-xs font-bold gap-2 shrink-0 ${
                    active
                      ? 'shadow-[var(--lf-shadow-card)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-none hover:bg-[var(--bg-alt)] hover:text-[var(--text)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`font-mono text-[11px] font-bold tabular-nums ${
                      active
                        ? ''
                        : tab.highlight
                        ? 'animate-pulse text-[var(--warning)]'
                        : 'text-[var(--text-muted)]'
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
        <div className="flex flex-col items-center rounded-[var(--lf-card-radius)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
          <Clock size={40} className="mb-3 text-[var(--text-muted)]" />
          <h3 className="text-base font-semibold text-[var(--text)] font-syne">
            No hay pedidos en esta sección
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--text-muted)]">
            Cuando un cliente realice un pedido desde la app móvil o el Marketplace, aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 md:gap-4">
          {ordenesFiltradas.map((ord) => {
            const elapsed = getElapsedInfo(ord.createdAt);
            const isRecibido = ord.estado === 'recibido';
            const isPreparando = ord.estado === 'preparando';
            const isListo = ord.estado === 'listo';

            return (
              <div
                key={ord.id}
                className="w-full flex flex-col overflow-hidden rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--lf-shadow-card)] hover:shadow-[var(--lf-shadow-float)] transition-shadow"
              >
                {/* Status Color Banner */}
                <div
                  className={`h-1.5 w-full ${
                    isRecibido
                      ? 'bg-[var(--peligro)]'
                      : isPreparando
                      ? 'bg-[var(--warning)]'
                      : isListo
                      ? 'bg-[var(--exito)]'
                      : 'bg-[var(--bg-alt)]'
                  }`}
                />

                <div className="flex flex-1 flex-col">
                  <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
                    {/* Cabecera comanda: número, hora y tiempo */}
                    <div className="space-y-2 border-b border-[var(--border)] pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            LOGIFAST KDS
                          </span>
                          <span className="block break-words font-mono text-lg font-bold tracking-tight text-[var(--text)]">
                            PEDIDO #{ord.id.slice(-5).toUpperCase()}
                          </span>
                        </div>
                        <Badge className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-bold ${elapsed.color}`}>
                          {elapsed.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 break-words font-mono text-[11px] text-[var(--text-muted)]">
                          {ord.createdAt}
                        </span>
                        <Badge
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                            isRecibido
                              ? 'border-[var(--peligro)] bg-[var(--peligro)]/15 text-[var(--peligro)]'
                              : isPreparando
                              ? 'border-[var(--warning)] bg-[var(--warning)]/15 text-[var(--warning)]'
                              : isListo
                              ? 'border-[var(--exito)] bg-[var(--exito)]/15 text-[var(--exito)]'
                              : 'border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)]'
                          }`}
                        >
                          {ord.estado}
                        </Badge>
                      </div>
                    </div>

                    {/* Cliente y Entrega */}
                    <div className="space-y-2 border-b border-[var(--border)] pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">CLIENTE:</span>
                        <span className="min-w-0 break-words text-right text-sm font-semibold text-[var(--text)]">{ord.clienteNombre}</span>
                      </div>
                      {ord.clienteTelefono && (
                        <div className="flex items-start justify-between gap-3">
                          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">TEL:</span>
                          <span className="min-w-0 break-words text-right font-mono text-xs text-[var(--text)]">{ord.clienteTelefono}</span>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">ENTREGA:</span>
                        <span className="min-w-0 break-words text-right text-xs text-[var(--text-secondary)]">{ord.direccionEntrega}</span>
                      </div>
                    </div>

                    {/* Productos */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        <span>CANT / ARTÍCULO</span>
                        <span>PRECIO</span>
                      </div>
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3">
                          <span className="min-w-0 flex-1 break-words text-xs text-[var(--text)]">
                            <span className="mr-1.5 font-mono font-bold text-[var(--primario)]">{it.cantidad}x</span>
                            {it.nombreProducto}
                          </span>
                          <span className="shrink-0 font-mono text-xs text-[var(--text-secondary)]">
                            C$ {(it.cantidad * it.precioUnitario).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-baseline justify-between gap-3 border-y border-[var(--border)] bg-[var(--bg-alt)] px-4 py-3 sm:px-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      TOTAL ({ord.metodoPago}):
                    </span>
                    <span className="shrink-0 font-mono text-lg font-bold text-[var(--text)]">
                      C$ {ord.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Acciones */}
                  {(isRecibido || isPreparando || isListo) && (
                    <div className="space-y-2 p-4 sm:p-5">
                      {isRecibido && (
                        <Button
                          onClick={() => cambiarEstado(ord.id, 'preparando')}
                          className="w-full h-11 rounded-full text-sm font-bold shadow-[var(--lf-shadow-card)]"
                        >
                          Aceptar y Preparar
                        </Button>
                      )}

                      {isPreparando && (
                        <Button
                          onClick={() => cambiarEstado(ord.id, 'listo')}
                          className="w-full h-11 rounded-full text-sm font-bold shadow-[var(--lf-shadow-card)]"
                        >
                          Marcar Listo
                        </Button>
                      )}

                      {isListo && (
                        <Button
                          onClick={() => cambiarEstado(ord.id, 'en_camino')}
                          className="w-full h-11 rounded-full text-sm font-bold shadow-[var(--lf-shadow-card)]"
                        >
                          Entregar a Repartidor
                        </Button>
                      )}

                      {/* El rechazo es una acción real de la tienda y estaba ausente:
                          sin él solo quedaba dejar el pedido colgado sin respuesta. */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('¿Rechazar este pedido? Se cancelará y se avisará al cliente.')) {
                            cambiarEstado(ord.id, 'cancelado');
                          }
                        }}
                        className="w-full h-11 rounded-full border-[var(--peligro)]/40 text-sm font-bold text-[var(--peligro)]"
                      >
                        Rechazar pedido
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
