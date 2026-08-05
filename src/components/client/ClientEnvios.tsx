'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Clock,
  AlertTriangle,
  Search,
  ArrowRight,
  Bike,
  Navigation,
  MessageCircle,
  X,
  Plus,
} from '@/components/icons';
import dynamic from 'next/dynamic';
import { useStore, type Order } from '@/lib/store';

const RepartidorMap = dynamic(() => import('../repartidor/RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: 220,
        borderRadius: 18,
        background: 'var(--bg-alt)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      Cargando mapa GPS en vivo...
    </div>
  ),
});

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'rgba(255, 149, 0, 0.15)', text: '#FF9500', label: 'Buscando repartidor' },
  encamino: { bg: 'var(--primario-soft)', text: 'var(--primario)', label: 'En camino' },
  recogido: { bg: 'rgba(175, 82, 222, 0.15)', text: '#AF52DE', label: 'Paquete recogido' },
  entregado: { bg: 'rgba(52, 199, 89, 0.15)', text: '#34C759', label: 'Entregado' },
  incidencia: { bg: 'rgba(255, 59, 48, 0.15)', text: '#FF3B30', label: 'Incidencia' },
};

interface ClientEnviosProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

interface ReportModalState {
  open: boolean;
  orderId: string;
  reason: string;
  description: string;
}

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 22px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--lf-input-radius, 16px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--lf-button-radius, 16px)',
  border: 'none',
  background: 'var(--primario)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

const btnGhost: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--lf-button-radius, 16px)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontWeight: 500,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

export default function ClientEnvios({
  userName,
  onNavigate,
  onOpenTracking,
  onOpenChat,
}: ClientEnviosProps) {
  const { orders, clientEnvioTab, setClientEnvioTab, addToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'todos' | 'entregados' | 'incidencia'>('todos');
  const [reportModal, setReportModal] = useState<ReportModalState>({
    open: false,
    orderId: '',
    reason: 'retraso',
    description: '',
  });

  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido'
    );
  }, [orders]);

  const historicalOrders = useMemo(() => {
    return orders.filter(
      (o) => o.estado === 'entregado' || o.estado === 'incidencia'
    );
  }, [orders]);

  const filteredHistory = useMemo(() => {
    return historicalOrders.filter((o) => {
      if (filterState === 'entregados' && o.estado !== 'entregado') return false;
      if (filterState === 'incidencia' && o.estado !== 'incidencia') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.destino.toLowerCase().includes(q) ||
        o.origen.toLowerCase().includes(q)
      );
    });
  }, [historicalOrders, filterState, searchQuery]);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Reporte enviado a soporte. Te contactaremos pronto.', 'success');
    setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        maxWidth: 600,
        margin: '0 auto',
        padding: '0 4px 120px 4px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── ENCABEZADO & PESTAÑAS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                color: 'var(--text)',
                margin: 0,
              }}
            >
              Mis Envíos
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Gestión de envíos express y seguimiento en vivo
            </p>
          </div>

          <button
            onClick={() => onNavigate('solicitar')}
            style={btnPrimary}
          >
            <Plus size={16} /> Nuevo Envío
          </button>
        </div>

        {/* Pestañas Segmentadas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            padding: 4,
            borderRadius: 'var(--lf-card-radius, 18px)',
            background: 'var(--bg-alt)',
            border: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => setClientEnvioTab('activos')}
            style={{
              padding: '10px 14px',
              borderRadius: 14,
              border: 'none',
              background: clientEnvioTab === 'activos' ? 'var(--surface)' : 'transparent',
              color: clientEnvioTab === 'activos' ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              boxShadow: clientEnvioTab === 'activos' ? 'var(--lf-shadow-card)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>En Curso</span>
            {activeOrders.length > 0 && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: 'var(--primario)',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setClientEnvioTab('historial')}
            style={{
              padding: '10px 14px',
              borderRadius: 14,
              border: 'none',
              background: clientEnvioTab === 'historial' ? 'var(--surface)' : 'transparent',
              color: clientEnvioTab === 'historial' ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              boxShadow: clientEnvioTab === 'historial' ? 'var(--lf-shadow-card)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>Historial ({historicalOrders.length})</span>
          </button>
        </div>
      </div>

      {/* ── SECCIÓN 1: ACTIVOS EN CURSO ── */}
      {clientEnvioTab === 'activos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeOrders.length === 0 ? (
            <div style={{ ...sectionCard, padding: 36, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'var(--primario-soft)',
                  color: 'var(--primario)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <Bike size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: '0 0 4px 0' }}>
                  No tienes envíos activos
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Solicita tu repartidor express en segundos y realiza tu envío rápido.
                </p>
              </div>
              <button
                onClick={() => onNavigate('solicitar')}
                style={{ ...btnPrimary, margin: '8px auto 0 auto' }}
              >
                Solicitar Envío Express
              </button>
            </div>
          ) : (
            activeOrders.map((order) => {
              const badge = STATUS_BADGE[order.estado] || STATUS_BADGE['pendiente'];
              return (
                <div key={order.id} style={{ ...sectionCard, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text)' }}>
                        #{order.id.substring(0, 8)}
                      </span>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 8,
                          background: badge.bg,
                          color: badge.text,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)', marginLeft: 'auto' }}>
                      C$ {(order.monto || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Timeline de la ruta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#007AFF', marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Origen</div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.origen}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34C759', marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destino</div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.destino}</div>
                      </div>
                    </div>
                  </div>

                  {/* Mapa GPS en vivo preview */}
                  <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <RepartidorMap
                      repartidorPos={[(order as any).repartidorLat || 12.1364, (order as any).repartidorLng || -86.2581]}
                      origenPos={[order.origenLat || 12.1264, order.origenLng || -86.2652]}
                      destinoPos={[order.destinoLat || 12.1402, order.destinoLng || -86.2954]}
                      estado={order.estado === 'encamino' ? 'EN_CAMINO_RECOGER' : order.estado === 'recogido' ? 'RECOGIDO' : 'ORDEN_ASIGNADA'}
                      altura="180px"
                      zoom={13}
                    />
                  </div>

                  {/* Información del repartidor asignado */}
                  {order.repartidor && (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: 'var(--bg-alt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'var(--primario)',
                            color: '#FFFFFF',
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 700,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {order.repartidor.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                            {order.repartidor}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                            Repartidor LogiFast • ★ 4.9
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenChat(order.id)}
                        style={{
                          padding: 8,
                          borderRadius: 10,
                          background: 'var(--primario-soft)',
                          color: 'var(--primario)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        title="Chat"
                      >
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  )}

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                    <button
                      onClick={() => onOpenTracking(order.id)}
                      style={{ ...btnPrimary, flex: 1 }}
                    >
                      <Navigation size={16} /> Rastrear en Tiempo Real
                    </button>
                    <button
                      onClick={() => setReportModal({ open: true, orderId: order.id, reason: 'retraso', description: '' })}
                      style={{ ...btnGhost, padding: '10px' }}
                      title="Reportar problema"
                    >
                      <AlertTriangle size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── SECCIÓN 2: HISTORIAL DE ENVÍOS ── */}
      {clientEnvioTab === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Filtro y Búsqueda */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar en el historial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 38 }}
              />
            </div>

            <button
              onClick={() => setFilterState(filterState === 'entregados' ? 'todos' : 'entregados')}
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                background: filterState === 'entregados' ? '#34C759' : 'var(--bg-alt)',
                color: filterState === 'entregados' ? '#FFFFFF' : 'var(--text)',
                border: '1px solid var(--border)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Entregados
            </button>
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ ...sectionCard, padding: 36, textAlign: 'center' }}>
              <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                No hay envíos registrados en el historial
              </div>
            </div>
          ) : (
            filteredHistory.map((order) => {
              const badge = STATUS_BADGE[order.estado] || STATUS_BADGE['entregado'];
              return (
                <div key={order.id} style={{ ...sectionCard, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text)' }}>
                        #{order.id.substring(0, 8)}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: badge.bg, color: badge.text, fontSize: 10, fontWeight: 700 }}>
                        {badge.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
                      C$ {(order.monto || 0).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {order.origen} → {order.destino}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', paddingTop: 4 }}>
                    <span>{order.fecha || 'Hoy'}</span>
                    <button
                      onClick={() => onNavigate('solicitar')}
                      style={{ background: 'none', border: 'none', color: 'var(--primario)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Volver a pedir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── MODAL REPORTAR PROBLEMA ── */}
      <AnimatePresence>
        {reportModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 400,
                borderRadius: 'var(--lf-card-radius, 22px)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                  Reportar Problema
                </h3>
                <button
                  onClick={() => setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' })}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    Motivo
                  </label>
                  <select
                    value={reportModal.reason}
                    onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="retraso">Retraso en la entrega</option>
                    <option value="paquete_dañado">Paquete dañado</option>
                    <option value="cobro_incorrecto">Cobro o tarifa incorrecta</option>
                    <option value="conductor">Problema con el repartidor</option>
                    <option value="otro">Otro problema</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    Comentarios adicionales
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Escribe detalles del inconveniente..."
                    value={reportModal.description}
                    onChange={(e) => setReportModal({ ...reportModal, description: e.target.value })}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' })}
                    style={btnGhost}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ ...btnPrimary, background: '#FF3B30' }}
                  >
                    Enviar Reporte
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
