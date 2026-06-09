'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutList, Package, User, MapPin, Clock, DollarSign,
  Check, X, ChevronRight, Timer, ArrowRight, Bike, Radio,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Order, Rider } from '@/lib/store';

/* ─── Haversine ─── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Toast hook ─── */
function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([]);
  const idRef = useRef(0);
  const showToast = useCallback((msg: string) => {
    const id = ++idRef.current;
    setToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, showToast };
}

export default function ModuleDespacho() {
  const { orders, riders, motos, dispatchOrder, addActivityEvent } = useStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmRiderId, setConfirmRiderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
  const { toasts, showToast } = useToast();

  /* ─── Derived data ─── */
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.estado === 'pendiente' && !o.repartidor),
    [orders]
  );

  const onlineRiders = useMemo(
    () => riders.filter((r) => r.conectado),
    [riders]
  );

  const getMotoModel = useCallback(
    (motoId: string | null) => {
      if (!motoId) return 'Sin moto';
      const m = motos.find((mo) => mo.id === motoId);
      return m ? m.modelo : motoId;
    },
    [motos]
  );

  const getRiderStatus = useCallback(
    (rider: Rider): { label: string; color: string; bg: string } => {
      if (!rider.conectado) return { label: 'Inactivo', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
      if (rider.status === 'in-service') return { label: 'En entrega', color: '#FF6600', bg: 'rgba(255,102,0,0.1)' };
      return { label: 'Libre', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' };
    },
    []
  );

  const getActiveOrderForRider = useCallback(
    (rider: Rider): Order | undefined =>
      orders.find((o) => o.repartidor === rider.nombre && (o.estado === 'encamino' || o.estado === 'recogido')),
    [orders]
  );

  /* ─── Wait time ─── */
  const getWaitMinutes = useCallback((fecha: string, hora: string) => {
    const [y, mo, d] = fecha.split('-').map(Number);
    const [h, mi] = hora.split(':').map(Number);
    const orderDate = new Date(y, mo - 1, d, h, mi);
    const now = new Date('2026-06-10T15:30:00');
    return Math.max(0, Math.floor((now.getTime() - orderDate.getTime()) / 60000));
  }, []);

  const getWaitColor = (min: number) => {
    if (min < 10) return '#16A34A';
    if (min < 30) return '#F59E0B';
    return '#DC2626';
  };

  /* ─── Distance estimate (precomputed for stable values) ─── */
  const distanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const order of pendingOrders) {
      const km = haversineKm(order.origenLat, order.origenLng, order.destinoLat, order.destinoLng);
      map[order.id] = (km * 1.4 * (1 + ((order.monto * 7) % 20) / 100)).toFixed(1);
    }
    return map;
  }, [pendingOrders]);

  /* ─── Assign handler ─── */
  const handleConfirmAssign = (orderId: string, riderId: string) => {
    const rider = riders.find((r) => r.id === riderId);
    const order = orders.find((o) => o.id === orderId);
    if (!rider || !order) return;

    dispatchOrder(orderId, riderId);
    addActivityEvent({
      tipo: 'orden',
      titulo: `Orden ${orderId} asignada`,
      detalle: `Asignada a ${rider.nombre} · ${order.origen} → ${order.destino} · C$${order.monto}`,
      timestamp: new Date().toISOString(),
      leido: false,
    });
    showToast(`✓ ${orderId} asignada a ${rider.nombre}`);
    setSelectedOrderId(null);
    setConfirmRiderId(null);
  };

  /* ─── Timeline view data (last 4 hours) ─── */
  const timelineHours = useMemo(() => {
    const now = 16;
    const hours: number[] = [];
    for (let h = now - 3; h <= now; h++) hours.push(h);
    return hours;
  }, []);

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        overflow: 'hidden',
      }}
    >
      {/* ─── Header ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <div>
          <h2
            style={{
              fontWeight: 700,
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--lf-text-main)',
            }}
          >
            <LayoutList size={20} style={{ color: '#FF6600' }} /> Centro de Despacho
          </h2>
          <p style={{ fontSize: 12, color: 'var(--lf-text-muted)', marginTop: 2 }}>
            {pendingOrders.length} órdenes por asignar · {onlineRiders.filter((r) => r.status === 'available').length}{' '}
            repartidores libres
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--lf-border)',
              background: viewMode === 'cards' ? '#FF6600' : 'transparent',
              color: viewMode === 'cards' ? '#fff' : 'var(--lf-text-muted)',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s',
            }}
          >
            <LayoutList size={14} /> Tablero
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--lf-border)',
              background: viewMode === 'timeline' ? '#FF6600' : 'transparent',
              color: viewMode === 'timeline' ? '#fff' : 'var(--lf-text-muted)',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s',
            }}
          >
            <Timer size={14} /> Línea de tiempo
          </button>
        </div>
      </div>

      {/* ─── Cards View ─── */}
      {viewMode === 'cards' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 16,
            overflow: 'hidden',
          }}
          className="lf-dispatch-columns"
        >
          {/* ─── Left: Orders (55%) ─── */}
          <div
            style={{
              flex: '55 1 0',
              overflowY: 'auto',
              paddingRight: 4,
              minWidth: 0,
            }}
            className="lf-scrollbar"
          >
            <h3
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--lf-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Package size={12} style={{ color: '#FF6600' }} />
              Órdenes por asignar ({pendingOrders.length})
            </h3>

            {pendingOrders.length === 0 && (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--lf-text-muted)',
                  fontSize: 14,
                }}
              >
                <Package
                  size={40}
                  style={{ margin: '0 auto 12px', opacity: 0.25 }}
                />
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  Todo al día
                </div>
                No hay órdenes pendientes por asignar
              </div>
            )}

            {pendingOrders.map((order) => {
              const isSelected = selectedOrderId === order.id;
              const waitMin = getWaitMinutes(order.fecha, order.hora);
              const waitColor = getWaitColor(waitMin);
              const dist = distanceMap[order.id] || '—';

              return (
                <motion.div
                  key={order.id}
                  layout
                  onClick={() => setSelectedOrderId(isSelected ? null : order.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    marginBottom: 8,
                    cursor: 'pointer',
                    background: 'var(--lf-surface)',
                    border: `1px solid ${isSelected ? '#FF6600' : 'var(--lf-border)'}`,
                    borderLeft: '4px solid #FF6600',
                    boxShadow: isSelected
                      ? '0 0 0 2px rgba(255,102,0,0.15), 0 4px 12px rgba(255,102,0,0.1)'
                      : 'none',
                    transition: 'all 0.2s',
                  }}
                  whileHover={{
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Row 1: ID + wait time */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 13,
                        color: 'var(--lf-text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {order.id}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        color: waitColor,
                      }}
                    >
                      <Clock size={11} /> {waitMin}min
                    </span>
                  </div>

                  {/* Row 2: Cliente */}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 3,
                      color: 'var(--lf-text-main)',
                    }}
                  >
                    {order.cliente}
                  </div>

                  {/* Row 3: Ruta */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      color: 'var(--lf-text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    <MapPin size={11} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.origen.split(',')[0]}
                    </span>
                    <ArrowRight size={10} style={{ flexShrink: 0, opacity: 0.5 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.destino.split(',')[0]}
                    </span>
                  </div>

                  {/* Row 4: Distance + monto */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}
                    >
                      ~{dist} km
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: '#FF6600',
                        }}
                      >
                        C$ {order.monto}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#FF6600',
                            fontWeight: 600,
                            background: 'rgba(255,102,0,0.08)',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          Selecciona repartidor →
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ─── Right: Riders (45%) ─── */}
          <div
            style={{
              flex: '45 1 0',
              overflowY: 'auto',
              paddingLeft: 4,
              minWidth: 0,
            }}
            className="lf-scrollbar"
          >
            <h3
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--lf-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Radio size={12} style={{ color: '#16A34A' }} />
              Repartidores en línea ({onlineRiders.length})
            </h3>

            {onlineRiders.length === 0 && (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--lf-text-muted)',
                  fontSize: 14,
                }}
              >
                <User
                  size={40}
                  style={{ margin: '0 auto 12px', opacity: 0.25 }}
                />
                No hay repartidores conectados
              </div>
            )}

            {onlineRiders.map((rider) => {
              const statusInfo = getRiderStatus(rider);
              const isConfirming = confirmRiderId === rider.id && selectedOrderId;
              const activeOrder = getActiveOrderForRider(rider);

              return (
                <div
                  key={rider.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    marginBottom: 8,
                    background: 'var(--lf-surface)',
                    border: '1px solid var(--lf-border)',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Avatar + info row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: activeOrder ? 8 : 6,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: rider.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {rider.initials}
                    </div>

                    {/* Name + moto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: 'var(--lf-text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rider.nombre}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--lf-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Bike size={11} style={{ flexShrink: 0 }} />
                        {getMotoModel(rider.motoId)}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Active order mini card */}
                  {activeOrder && (
                    <div
                      style={{
                        background: 'rgba(255,102,0,0.05)',
                        border: '1px solid rgba(255,102,0,0.15)',
                        borderRadius: 6,
                        padding: '6px 8px',
                        marginBottom: 6,
                        fontSize: 11,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{
                            fontWeight: 700,
                            color: '#FF6600',
                            fontSize: 11,
                          }}
                        >
                          {activeOrder.id}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color:
                              activeOrder.estado === 'encamino'
                                ? '#FF6600'
                                : '#3B82F6',
                          }}
                        >
                          {activeOrder.estado === 'encamino'
                            ? 'En camino'
                            : 'Recogido'}
                        </span>
                      </div>
                      <div
                        style={{
                          color: 'var(--lf-text-muted)',
                          fontSize: 10,
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {activeOrder.destino.split(',')[0]}
                      </div>
                    </div>
                  )}

                  {/* Entregas hoy */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 12,
                        color: 'var(--lf-text-secondary)',
                      }}
                    >
                      {rider.entregasHoy} entregas
                    </span>

                    {/* Assign actions */}
                    {isConfirming ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--lf-text-muted)',
                          }}
                        >
                          ¿Asignar{' '}
                          <strong style={{ color: 'var(--lf-text-main)' }}>
                            {selectedOrderId}
                          </strong>{' '}
                          a{' '}
                          <strong style={{ color: 'var(--lf-text-main)' }}>
                            {rider.nombre.split(' ')[0]}
                          </strong>
                          ?
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmAssign(selectedOrderId!, rider.id);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#16A34A',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Check size={11} /> Confirmar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRiderId(null);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--lf-border)',
                            background: 'transparent',
                            color: 'var(--lf-text-muted)',
                            fontSize: 11,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <X size={11} /> Cancelar
                        </button>
                      </div>
                    ) : selectedOrderId ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmRiderId(rider.id);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid #FF6600',
                          background: 'rgba(255,102,0,0.06)',
                          color: '#FF6600',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <ChevronRight size={11} /> Asignar
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── Timeline View ─── */
        <div style={{ flex: 1, overflow: 'auto' }} className="lf-scrollbar">
          <div style={{ position: 'relative', minWidth: 700 }}>
            {/* Hour headers */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--lf-border)',
                paddingBottom: 4,
                marginBottom: 8,
              }}
            >
              <div style={{ width: 140, flexShrink: 0 }} />
              {timelineHours.map((h) => (
                <div
                  key={h}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--lf-text-muted)',
                  }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* Rider rows */}
            {onlineRiders.map((rider) => {
              const riderOrders = orders.filter(
                (o) =>
                  o.repartidor === rider.nombre &&
                  (o.estado === 'encamino' ||
                    o.estado === 'recogido' ||
                    o.estado === 'entregado')
              );

              return (
                <div
                  key={rider.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 52,
                    borderBottom: '1px solid var(--lf-border)',
                  }}
                >
                  <div
                    style={{
                      width: 140,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 0',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: rider.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {rider.initials}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--lf-text-main)',
                      }}
                    >
                      {rider.nombre.split(' ')[0]}
                    </span>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      height: 36,
                    }}
                  >
                    {rider.status === 'available' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 0,
                          right: 0,
                          height: 24,
                          borderRadius: 4,
                          background: 'rgba(22,163,74,0.06)',
                          border: '1px dashed rgba(22,163,74,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 8px',
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#16A34A',
                        }}
                      >
                        Libre
                      </div>
                    )}
                    {riderOrders.map((order) => {
                      const [oh] = order.hora.split(':').map(Number);
                      const startHour = timelineHours[0];
                      const endHour = timelineHours[timelineHours.length - 1];
                      const leftPct =
                        ((Math.max(oh, startHour) - startHour) /
                          (endHour - startHour + 1)) *
                        100;
                      const widthPct =
                        (1 / (endHour - startHour + 1)) * 100 * 1.2;
                      const statusColor =
                        order.estado === 'encamino'
                          ? '#FF6600'
                          : order.estado === 'recogido'
                            ? '#3B82F6'
                            : '#16A34A';

                      return (
                        <div
                          key={order.id}
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: `${Math.max(0, leftPct)}%`,
                            width: `${Math.min(widthPct, 100 - leftPct)}%`,
                            height: 24,
                            borderRadius: 4,
                            background: `${statusColor}18`,
                            borderLeft: `3px solid ${statusColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 6px',
                            fontSize: 10,
                            fontWeight: 700,
                            color: statusColor,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {order.id}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Toasts ─── */}
      <div
        style={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: '#16A34A',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              maxWidth: 320,
            }}
          >
            <Check size={14} />
            {t.msg}
          </motion.div>
        ))}
      </div>

      {/* ─── Responsive styles ─── */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .lf-dispatch-columns {
            flex-direction: column !important;
          }
          .lf-dispatch-columns > div {
            flex: none !important;
            max-height: 50vh;
          }
        }
      `}</style>
    </div>
  );
}
