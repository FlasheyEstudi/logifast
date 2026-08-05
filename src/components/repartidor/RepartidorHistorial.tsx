'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  AlertTriangle,
  ChevronRight,
  Bike,
  Clock,
  DollarSign,
  Route as RouteIcon,
  Check,
  X,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Store,
  User,
  Phone,
  Maximize2,
  Zap,
} from '@/components/icons';
import { useRepartidorStore, type ServicioHistorial, type OrdenActiva } from '@/lib/repartidor-store';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { HistorialSkeleton } from '@/components/ui/Skeletons';

/* ═══════════════════════════════════════════════
   TYPES & HELPERS
   ═══════════════════════════════════════════════ */

type ModuloSubTab = 'ofertas' | 'activos' | 'envios' | 'pedidos' | 'historial';
type Periodo = 'hoy' | 'semana' | 'mes';

const PERIODO_LABEL: Record<Periodo, string> = {
  hoy: 'Hoy',
  semana: 'Semana',
  mes: 'Mes',
};

const ESTADO_SERVICIO_COLOR: Record<string, string> = {
  entregado: 'var(--exito, var(--exito))',
  incidencia: 'var(--peligro, var(--peligro))',
  cancelado: '#9E9E9E',
};

function formatTiempo(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT — MÓDULO DE GESTIÓN DE OFERTAS & SERVICIOS
   ═══════════════════════════════════════════════ */

export default function RepartidorHistorial() {
  const {
    ordenesActivas = [],
    ordenActiva,
    ofertasDisponibles = [],
    ordenAsignadaPendiente,
    serviciosHoy = [],
    obtenerStats,
    verServicioDetalle,
    syncFromBackend,
    aceptarOfertaDirecta,
    rechazarOfertaDirecta,
    seleccionarOrdenActiva,
    toggleChat,
    toggleIncidencia,
    setPantalla,
  } = useRepartidorStore();

  const [activeSubTab, setActiveSubTab] = useState<ModuloSubTab>('activos');
  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const [loading, setLoading] = useState(false);
  const [selectedActiveDetail, setSelectedActiveDetail] = useState<OrdenActiva | null>(null);

  const stats = obtenerStats(periodo);

  /* Build list of incoming offers combining ordenAsignadaPendiente + ofertasDisponibles */
  const ofertasLista = useMemo(() => {
    const lista: OrdenActiva[] = [];
    if (ordenAsignadaPendiente && !lista.some((o) => o.id === ordenAsignadaPendiente.id)) {
      lista.push(ordenAsignadaPendiente);
    }
    (ofertasDisponibles || []).forEach((of) => {
      if (!lista.some((o) => o.id === of.id)) {
        lista.push(of);
      }
    });
    return lista;
  }, [ordenAsignadaPendiente, ofertasDisponibles]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await syncFromBackend();
    } catch (err) {
      console.error('[RepartidorHistorial.handleRefresh]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div style={{ paddingBottom: 80, maxWidth: 960, margin: '0 auto' }}>

        {/* ═══════ ENCABEZADO Y PESTAÑAS DE GESTIÓN ═══════ */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            {/* Shortcut to Map */}
            <button
              onClick={() => setPantalla('servicio')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 100,
                border: 'none',
                background: 'var(--primario, var(--primario))',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--ios-font)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--primario, var(--primario)) 40%, transparent)',
              }}
            >
              <MapPin size={14} />
              <span>Ver Mapa</span>
            </button>
          </div>

          {/* ═══════ SUB-PESTAÑAS DE FILTRO PRINCIPALES ═══════ */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: 4,
              borderRadius: 100,
              background: 'color-mix(in srgb, var(--ios-bg-elevated, #1E293B) 90%, transparent)',
              border: '1px solid color-mix(in srgb, var(--ios-blue, var(--primario)) 20%, transparent)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {[
              { key: 'activos' as ModuloSubTab, label: `Activos (${ordenesActivas.length})`, icon: <Bike size={14} /> },
              { key: 'ofertas' as ModuloSubTab, label: `Ofertas (${ofertasLista.length})`, icon: <Zap size={14} /> },
              { key: 'envios' as ModuloSubTab, label: 'Envíos', icon: <Package size={14} /> },
              { key: 'pedidos' as ModuloSubTab, label: 'Pedidos', icon: <ShoppingBag size={14} /> },
              { key: 'historial' as ModuloSubTab, label: 'Historial', icon: <Clock size={14} /> },
            ].map((tab) => {
              const isActive = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTab(tab.key)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 100,
                    border: 'none',
                    background: isActive ? 'var(--primario, var(--primario))' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-muted, #94A3B8)',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 600,
                    fontFamily: 'var(--ios-font)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════ PESTAÑA 1: OFERTAS ENTRANTES ═══════ */}
        {activeSubTab === 'ofertas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
              {ofertasLista.length} Solicitud{ofertasLista.length !== 1 ? 'es' : ''} disponible{ofertasLista.length !== 1 ? 's' : ''}
            </div>

            {ofertasLista.map((oferta) => (
              <motion.div
                key={oferta.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  borderRadius: 20,
                  padding: 16,
                  background: 'color-mix(in srgb, var(--ios-bg-elevated, #1E293B) 94%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--ios-blue, var(--primario)) 25%, transparent)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Header card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 100,
                        background: oferta.tipo === 'compra' ? 'rgba(255, 149, 0, 0.2)' : 'rgba(0, 102, 255, 0.2)',
                        color: oferta.tipo === 'compra' ? '#FF9500' : 'var(--primario)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {oferta.tipo === 'compra' ? 'PEDIDO TIENDA' : 'ENVÍO MENSAJERÍA'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                      #{oferta.id}
                    </span>
                  </div>

                  {/* Earnings Highlight */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: '#34C759', fontWeight: 600 }}>Ganancia Est.</span>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#34C759', fontFamily: 'var(--font-mono)' }}>
                      C${oferta.ganancia}
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 14, background: 'color-mix(in srgb, var(--ios-bg-secondary, #0F172A) 80%, transparent)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primario)', marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--primario)', fontWeight: 700 }}>Origen / Recogida</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{oferta.origen}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF3B30', marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#FF3B30', fontWeight: 700 }}>Destino / Entrega</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{oferta.destino}</div>
                    </div>
                  </div>
                </div>

                {/* Footer metrics & actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {oferta.kmEstimados} km</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {oferta.tiempoEstimado} min</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => rechazarOfertaDirecta(oferta.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 100,
                        border: 'none',
                        background: 'rgba(255, 59, 48, 0.18)',
                        color: '#FF3B30',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <X size={12} />
                      Rechazar
                    </button>

                    <button
                      onClick={() => {
                        aceptarOfertaDirecta(oferta);
                        setPantalla('servicio');
                      }}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 100,
                        border: 'none',
                        background: '#34C759',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 4px 12px rgba(52, 199, 89, 0.4)',
                      }}
                    >
                      <Check size={12} />
                      ACEPTAR
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ═══════ PESTAÑA 2: SERVICIOS ACTIVOS ═══════ */}
        {activeSubTab === 'activos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
              {ordenesActivas.length}/3 Servicios en curso
            </div>

            {ordenesActivas.length === 0 ? (
              <div
                style={{
                  borderRadius: 20,
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: 'color-mix(in srgb, var(--ios-bg-elevated, #1E293B) 80%, transparent)',
                  border: '1px border-mix(in srgb, var(--ios-blue) 20%, transparent)',
                }}
              >
                <Bike size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>No tienes servicios en curso</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 16px' }}>
                  Revisa las ofertas entrantes para aceptar nuevas entregas.
                </p>
                <button
                  onClick={() => setActiveSubTab('ofertas')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--primario, var(--primario))',
                    color: '#FFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Ver Ofertas Disponibles
                </button>
              </div>
            ) : (
              ordenesActivas.map((ord, idx) => (
                <motion.div
                  key={ord.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    borderRadius: 20,
                    padding: 16,
                    background: 'color-mix(in srgb, var(--ios-bg-elevated, #1E293B) 94%, transparent)',
                    border: ordenActiva?.id === ord.id ? '2px solid var(--primario)' : '1px solid color-mix(in srgb, var(--ios-blue) 20%, transparent)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primario)' }}>
                        #{idx + 1} SERVICIO EN CURSO
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {ord.id}</span>
                    </div>

                    <span style={{ fontSize: 16, fontWeight: 700, color: '#34C759' }}>
                      C${ord.ganancia}
                    </span>
                  </div>

                  {/* Origen / Destino */}
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                    <div><strong>Origen:</strong> {ord.origen}</div>
                    <div style={{ marginTop: 4 }}><strong>Destino:</strong> {ord.destino}</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 6, borderTop: '1px solid color-mix(in srgb, var(--text-muted) 15%, transparent)' }}>
                    <button
                      onClick={() => {
                        seleccionarOrdenActiva(ord.id);
                        setPantalla('servicio');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 100,
                        border: 'none',
                        background: 'var(--primario)',
                        color: '#FFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <MapPin size={13} />
                      <span>Ver en Mapa</span>
                    </button>

                    <button
                      onClick={() =>
                        verServicioDetalle({
                          id: ord.id,
                          ordenId: ord.id,
                          cliente: ord.cliente,
                          origen: ord.origen,
                          destino: ord.destino,
                          ganancia: ord.ganancia,
                          estado: 'entregado',
                          hora: 'En curso',
                          tipo: ord.tipo || 'envio',
                          kmRecorridos: ord.kmEstimados || 3.5,
                          tiempoTotal: ord.tiempoEstimado || 20,
                        })
                      }
                      style={{
                        padding: '8px 14px',
                        borderRadius: 100,
                        border: 'none',
                        background: 'color-mix(in srgb, var(--text) 10%, transparent)',
                        color: 'var(--text)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Detalles
                    </button>

                    <button
                      onClick={() => toggleChat(ord.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 100,
                        border: 'none',
                        background: 'rgba(52, 199, 89, 0.2)',
                        color: '#34C759',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>Chat</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ═══════ PESTAÑA 3 & 4: ENVÍOS / PEDIDOS / HISTORIAL COMPLETO ═══════ */}
        {(activeSubTab === 'envios' || activeSubTab === 'pedidos' || activeSubTab === 'historial') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Analytics Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: 14, borderRadius: 16, background: 'color-mix(in srgb, var(--ios-bg-elevated) 90%, transparent)', border: '1px solid color-mix(in srgb, var(--ios-blue) 20%, transparent)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ENTREGAS COMPLETADAS</span>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{stats.entregas}</div>
              </div>

              <div style={{ padding: 14, borderRadius: 16, background: 'color-mix(in srgb, var(--ios-bg-elevated) 90%, transparent)', border: '1px solid color-mix(in srgb, var(--ios-blue) 20%, transparent)' }}>
                <span style={{ fontSize: 11, color: '#34C759', fontWeight: 600 }}>TOTAL GANANCIAS</span>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#34C759', marginTop: 2 }}>C${stats.ganancias}</div>
              </div>
            </div>

            {/* List of past services */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>
                Registro Histórico ({serviciosHoy.length})
              </div>

              {serviciosHoy.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: 'color-mix(in srgb, var(--ios-bg-elevated) 80%, transparent)', borderRadius: 16 }}>
                  No hay entregas registradas en este período.
                </div>
              ) : (
                serviciosHoy.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => verServicioDetalle(s)}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      background: 'color-mix(in srgb, var(--ios-bg-elevated) 92%, transparent)',
                      marginBottom: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {s.tipo === 'compra' ? 'PEDIDO' : 'ENVÍO'} #{s.ordenId}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {s.origen} ➔ {s.destino}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#34C759' }}>+C${s.ganancia}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.hora}</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
