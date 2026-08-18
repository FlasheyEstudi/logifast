'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  Search,
  Bike,
  Navigation,
  MessageCircle,
  X,
  Plus,
  MapPin,
  Star,
  ChevronRight,
} from '@/components/icons';
import dynamic from 'next/dynamic';
import { useStore } from '@/lib/store';
import PullToRefresh from '@/components/ui/PullToRefresh';

const RepartidorMap = dynamic(() => import('../repartidor/RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
      Cargando mapa GPS...
    </div>
  ),
});

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  pendiente:  { bg: 'rgba(255,149,0,.14)',  text: '#FF9500',  label: 'Buscando repartidor', dot: '#FF9500' },
  encamino:   { bg: 'var(--primario-soft)', text: 'var(--primario)', label: 'En camino', dot: 'var(--primario)' },
  recogido:   { bg: 'rgba(175,82,222,.14)', text: '#AF52DE',  label: 'Paquete recogido', dot: '#AF52DE' },
  entregado:  { bg: 'rgba(52,199,89,.14)',  text: '#34C759',  label: 'Entregado', dot: '#34C759' },
  incidencia: { bg: 'rgba(255,59,48,.14)',  text: '#FF3B30',  label: 'Incidencia', dot: '#FF3B30' },
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

const pillStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 'var(--lf-input-radius, 16px)',
  border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)',
  fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 100, border: 'none', background: 'var(--primario)',
  color: '#fff', fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const btnGhost: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 100, border: '1px solid var(--border)',
  background: 'transparent', color: 'var(--text-secondary)', fontWeight: 500,
  fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

export default function ClientEnvios({ onNavigate, onOpenTracking, onOpenChat }: ClientEnviosProps) {
  const { orders, clientEnvioTab, setClientEnvioTab, addToast, fetchOrders } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'todos' | 'entregados' | 'incidencia'>('todos');
  const [reportModal, setReportModal] = useState<ReportModalState>({ open: false, orderId: '', reason: 'retraso', description: '' });

  const activeOrders = useMemo(() => orders.filter(o => !['entregado', 'entregada', 'completado', 'completada', 'cancelado', 'cancelada', 'incidencia'].includes(o.estado)), [orders]);
  const historicalOrders = useMemo(() => orders.filter(o => ['entregado', 'entregada', 'completado', 'completada', 'cancelado', 'cancelada', 'incidencia'].includes(o.estado)), [orders]);

  const filteredHistory = useMemo(() => historicalOrders.filter(o => {
    if (filterState === 'entregados' && o.estado !== 'entregado') return false;
    if (filterState === 'incidencia' && o.estado !== 'incidencia') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.id.toLowerCase().includes(q) || o.destino.toLowerCase().includes(q) || o.origen.toLowerCase().includes(q);
  }), [historicalOrders, filterState, searchQuery]);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Reporte enviado a soporte. Te contactaremos pronto.', 'success');
    setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' });
  };

  return (
    <PullToRefresh onRefresh={async () => { await fetchOrders(); }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600, margin: '0 auto', padding: '0 4px 120px 4px', fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Mis Envíos</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Seguimiento en tiempo real</p>
        </div>
        <button onClick={() => onNavigate('solicitar')} style={btnPrimary}>
          <Plus size={14} /> Nuevo
        </button>
      </div>

      {/* TABS CAPSULARES */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { key: 'activos', label: `En Curso${activeOrders.length > 0 ? ` (${activeOrders.length})` : ''}` },
          { key: 'historial', label: `Historial (${historicalOrders.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setClientEnvioTab(tab.key as any)} style={{
            padding: '9px 20px', borderRadius: 100, border: clientEnvioTab === tab.key ? 'none' : '1px solid var(--border)',
            background: clientEnvioTab === tab.key ? 'var(--primario)' : 'var(--bg-alt)',
            color: clientEnvioTab === tab.key ? '#fff' : 'var(--text-muted)',
            fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', transition: 'all 0.2s ease',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACTIVOS */}
      {clientEnvioTab === 'activos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeOrders.length === 0 ? (
            <div style={{ background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primario-soft)', color: 'var(--primario)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bike size={30} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: '0 0 4px 0' }}>No tienes envíos activos</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Solicita tu repartidor express en segundos.</p>
              </div>
              <button onClick={() => onNavigate('solicitar')} style={btnPrimary}>Solicitar Envío Express</button>
            </div>
          ) : (
            activeOrders.map(order => {
              const badge = STATUS_BADGE[order.estado] || STATUS_BADGE['pendiente'];
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--lf-shadow-card)' }}>
                  {/* MAPA LIMPIO */}
                  <div style={{ position: 'relative', width: '100%', height: 240 }}>
                    <RepartidorMap
                      repartidorPos={[(order as any).repartidorLat || 12.1364, (order as any).repartidorLng || -86.2581]}
                      origenPos={[order.origenLat || 12.1264, order.origenLng || -86.2652]}
                      destinoPos={[order.destinoLat || 12.1402, order.destinoLng || -86.2954]}
                      estado={order.estado === 'encamino' ? 'EN_CAMINO_RECOGER' : order.estado === 'recogido' ? 'RECOGIDO' : 'ORDEN_ASIGNADA'}
                      altura="100%" zoom={13}
                    />
                    {/* Badge estado - cápsula izquierda */}
                    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100, background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: badge.dot, boxShadow: `0 0 8px ${badge.dot}` }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: badge.text, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>{badge.label}</span>
                    </div>
                    {/* ID + precio - cápsula derecha */}
                    <div style={{ position: 'absolute', top: 12, right: 12, padding: '6px 12px', borderRadius: 100, background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>#{order.id.substring(0,6)}</span>
                      <span style={{ width: 1, height: 10, background: 'var(--border)' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)' }}>C$ {(order.monto||0).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* INFO INFERIOR */}
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Ruta */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[{color:'#007AFF',label:'Origen',val:order.origen},{color:'#34C759',label:'Destino',val:order.destino}].map(r => (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', minWidth: 46 }}>{r.label}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Repartidor */}
                    {order.repartidor && (
                      (() => {
                        const repName = typeof order.repartidor === 'string' ? order.repartidor : ((order.repartidor as any)?.user?.name || (order.repartidor as any)?.nombre || 'Repartidor LogiFast');
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 14, background: 'var(--bg-alt)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primario)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                                {repName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{repName}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                                  <Star size={10} fill="#FF9500" style={{ color:'#FF9500' }} />
                                  <span>4.9 • LogiFast</span>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => onOpenChat(order.id)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primario-soft)', color: 'var(--primario)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MessageCircle size={17} />
                            </button>
                          </div>
                        );
                      })()
                    )}

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => onOpenTracking(order.id)} style={{ ...btnPrimary, flex: 1 }}>
                        <Navigation size={15} /> Rastrear en Vivo
                      </button>
                      <button onClick={() => setReportModal({ open: true, orderId: order.id, reason: 'retraso', description: '' })} style={{ ...btnGhost, color: '#FF3B30', borderColor: 'rgba(255,59,48,0.3)' }} title="Reportar">
                        <AlertTriangle size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* HISTORIAL */}
      {clientEnvioTab === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Buscar historial..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: 38, borderRadius: 100, padding: '10px 16px 10px 38px' }} />
            </div>
            {(['entregados','incidencia'] as const).map(f => (
              <button key={f} onClick={() => setFilterState(filterState === f ? 'todos' : f)} style={{ ...pillStyle, border: `1px solid ${filterState===f ? (f==='entregados'?'#34C759':'#FF3B30') : 'var(--border)'}`, background: filterState===f ? (f==='entregados'?'rgba(52,199,89,.15)':'rgba(255,59,48,.15)') : 'var(--bg-alt)', color: filterState===f ? (f==='entregados'?'#34C759':'#FF3B30') : 'var(--text-muted)', cursor: 'pointer' }}>
                {f === 'entregados' ? 'Entregados' : 'Incidencias'}
              </button>
            ))}
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)', padding: '36px 24px', textAlign: 'center' }}>
              <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto', display: 'block' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>No hay envíos en el historial</div>
            </div>
          ) : filteredHistory.map(order => {
            const badge = STATUS_BADGE[order.estado] || STATUS_BADGE['entregado'];
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {order.paqueteFotoUrl ? (
                      <img src={order.paqueteFotoUrl} alt="Paquete" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={20} style={{ color: 'var(--primario)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text-muted)' }}>#{order.id.substring(0,8)}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>C$ {(order.monto||0).toFixed(2)}</span>
                    </div>
                    <span style={{ ...pillStyle, padding: '2px 8px', background: badge.bg, color: badge.text, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.dot }} />{badge.label}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.origen} → {order.destino}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{order.fecha || 'Hoy'}</span>
                  <button onClick={() => onNavigate('solicitar')} style={{ background: 'none', border: 'none', color: 'var(--primario)', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                    Volver a pedir <ChevronRight size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL REPORTE */}
      <AnimatePresence>
        {reportModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: 400, borderRadius: 28, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>Reportar Problema</h3>
                <button onClick={() => setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' })} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Motivo</label>
                  <select value={reportModal.reason} onChange={e => setReportModal({ ...reportModal, reason: e.target.value })} style={inputStyle}>
                    <option value="retraso">Retraso en la entrega</option>
                    <option value="paquete_dañado">Paquete dañado</option>
                    <option value="cobro_incorrecto">Cobro incorrecto</option>
                    <option value="conductor">Problema con el repartidor</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Comentarios</label>
                  <textarea rows={3} placeholder="Describe el problema..." value={reportModal.description} onChange={e => setReportModal({ ...reportModal, description: e.target.value })} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={() => setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' })} style={btnGhost}>Cancelar</button>
                  <button type="submit" style={{ ...btnPrimary, background: '#FF3B30' }}>Enviar Reporte</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </PullToRefresh>
  );
}
