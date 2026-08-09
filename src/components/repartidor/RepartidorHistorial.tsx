'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ShoppingBag, AlertTriangle, ChevronRight, Bike, Clock,
  MapPin, Check, X, MessageSquare, Zap, Search, TrendingUp, Route as RouteIcon,
} from '@/components/icons';
import { useRepartidorStore, type ServicioHistorial, type OrdenActiva } from '@/lib/repartidor-store';
import PullToRefresh from '@/components/ui/PullToRefresh';

type ModuloSubTab = 'ofertas' | 'activos' | 'historial';
type Periodo = 'hoy' | 'semana' | 'mes';

const ESTADO_COLOR: Record<string, string> = {
  entregado: '#34C759', incidencia: '#FF3B30', cancelado: '#9E9E9E',
};

const pill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
};

const btnPrimary = (bg = 'var(--primario)'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 100, border: 'none', background: bg,
  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.2s',
});

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
};

export default function RepartidorHistorial() {
  const {
    ordenesActivas = [], ordenActiva, ofertasDisponibles = [], ordenAsignadaPendiente,
    serviciosHoy = [], obtenerStats, verServicioDetalle, syncFromBackend,
    aceptarOfertaDirecta, rechazarOfertaDirecta, seleccionarOrdenActiva,
    toggleChat, setPantalla,
  } = useRepartidorStore();

  const [activeSubTab, setActiveSubTab] = useState<ModuloSubTab>('activos');
  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const stats = obtenerStats(periodo);

  const ofertasLista = useMemo(() => {
    const lista: OrdenActiva[] = [];
    if (ordenAsignadaPendiente && !lista.some(o => o.id === ordenAsignadaPendiente.id)) lista.push(ordenAsignadaPendiente);
    (ofertasDisponibles || []).forEach(of => { if (!lista.some(o => o.id === of.id)) lista.push(of); });
    return lista;
  }, [ordenAsignadaPendiente, ofertasDisponibles]);

  const filteredHistorial = useMemo(() => {
    if (!search.trim()) return serviciosHoy;
    const q = search.toLowerCase();
    return serviciosHoy.filter(s => s.origen.toLowerCase().includes(q) || s.destino.toLowerCase().includes(q) || s.ordenId.toLowerCase().includes(q));
  }, [serviciosHoy, search]);

  const handleRefresh = async () => {
    setLoading(true);
    try { await syncFromBackend(); } catch {} finally { setLoading(false); }
  };

  const TABS = [
    { key: 'activos' as ModuloSubTab, label: `Activos (${ordenesActivas.length})`, icon: <Bike size={13} /> },
    { key: 'ofertas' as ModuloSubTab, label: `Ofertas (${ofertasLista.length})`, icon: <Zap size={13} /> },
    { key: 'historial' as ModuloSubTab, label: 'Historial', icon: <Clock size={13} /> },
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div style={{ paddingBottom: 100, maxWidth: 640, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Mis Servicios</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Gestión de entregas en curso e historial</p>
          </div>
          <button onClick={() => setPantalla('servicio')} style={btnPrimary()}>
            <MapPin size={13} /> Ver Mapa
          </button>
        </div>

        {/* STATS CAPSULARES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Hoy', val: `C$ ${stats.ganancias.toFixed(0)}`, sub: `${stats.entregas} entregas`, color: '#34C759' },
            { label: 'KM', val: `${stats.km.toFixed(1)}`, sub: 'recorridos', color: 'var(--primario)' },
            { label: 'Activos', val: String(ordenesActivas.length), sub: `max 3`, color: '#FF9500' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</span>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color, lineHeight: 1 }}>{s.val}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.sub}</span>
            </div>
          ))}
        </div>

        {/* TABS CAPSULARES */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveSubTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 100,
              border: activeSubTab === tab.key ? 'none' : '1px solid var(--border)',
              background: activeSubTab === tab.key ? 'var(--primario)' : 'var(--bg-alt)',
              color: activeSubTab === tab.key ? '#fff' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: ACTIVOS ── */}
        {activeSubTab === 'activos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{ordenesActivas.length}/3 servicios en curso</div>

            {ordenesActivas.length === 0 ? (
              <div style={{ ...card, padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primario-soft)', color: 'var(--primario)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bike size={28} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', marginBottom: 4 }}>Sin servicios en curso</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Revisa las ofertas disponibles</div>
                </div>
                <button onClick={() => setActiveSubTab('ofertas')} style={btnPrimary()}>Ver Ofertas</button>
              </div>
            ) : (
              ordenesActivas.map((ord, idx) => (
                <motion.div key={ord.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, padding: 0, overflow: 'hidden' }}>
                  {/* Banda de color */}
                  <div style={{ height: 3, background: ordenActiva?.id === ord.id ? 'var(--primario)' : 'var(--border)' }} />
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--primario)', fontFamily: "'Syne', sans-serif" }}>#{idx+1} EN CURSO</span>
                        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>{ord.id.substring(0,8)}</span>
                        {ord.tipo && (
                          <span style={{ ...pill, background: ord.tipo === 'compra' ? 'rgba(255,149,0,.15)' : 'var(--primario-soft)', color: ord.tipo === 'compra' ? '#FF9500' : 'var(--primario)', padding: '2px 8px' }}>
                            {ord.tipo === 'compra' ? 'PEDIDO' : 'ENVÍO'}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>+C${ord.ganancia}</span>
                    </div>

                    {/* Ruta */}
                    <div style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--bg-alt)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[{color:'#007AFF',label:'Recogida',val:ord.origen},{color:'#34C759',label:'Entrega',val:ord.destino}].map(r => (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <MapPin size={13} style={{ color: r.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 48 }}>{r.label}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { seleccionarOrdenActiva(ord.id); setPantalla('servicio'); }} style={{ ...btnPrimary(), flex: 1 }}>
                        <MapPin size={13} /> Ver en Mapa
                      </button>
                      <button onClick={() => toggleChat(ord.id)} style={{ ...btnPrimary('rgba(52,199,89,.18)'), color: '#34C759' }}>
                        <MessageSquare size={14} />
                      </button>
                      <button onClick={() => verServicioDetalle({ id: ord.id, ordenId: ord.id, cliente: ord.cliente, origen: ord.origen, destino: ord.destino, ganancia: ord.ganancia, estado: 'entregado', hora: 'En curso', tipo: ord.tipo||'envio', kmRecorridos: ord.kmEstimados||3.5, tiempoTotal: ord.tiempoEstimado||20 })} style={{ ...btnPrimary('var(--bg-alt)'), color: 'var(--text)' }}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: OFERTAS ── */}
        {activeSubTab === 'ofertas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{ofertasLista.length} solicitud{ofertasLista.length !== 1 ? 'es' : ''} disponible{ofertasLista.length !== 1 ? 's' : ''}</div>

            {ofertasLista.length === 0 ? (
              <div style={{ ...card, padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,149,0,.12)', color: '#FF9500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={28} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}>Sin ofertas por ahora</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mantente conectado para recibir asignaciones</div>
              </div>
            ) : (
              ofertasLista.map(oferta => (
                <motion.div key={oferta.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...card, border: '1px solid color-mix(in srgb, var(--primario) 25%, transparent)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ ...pill, background: oferta.tipo === 'compra' ? 'rgba(255,149,0,.15)' : 'var(--primario-soft)', color: oferta.tipo === 'compra' ? '#FF9500' : 'var(--primario)' }}>
                        {oferta.tipo === 'compra' ? 'PEDIDO TIENDA' : 'ENVÍO'}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>#{oferta.id.substring(0,8)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 8, color: '#34C759', fontWeight: 700, textTransform: 'uppercase' }}>Ganancia</div>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759', lineHeight: 1 }}>C${oferta.ganancia}</div>
                    </div>
                  </div>

                  {/* Ruta */}
                  <div style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--bg-alt)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[{color:'var(--primario)',label:'Recogida',val:oferta.origen},{color:'#FF3B30',label:'Entrega',val:oferta.destino}].map(r => (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 48 }}>{r.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Métricas + Botones */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{oferta.kmEstimados}km</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />~{oferta.tiempoEstimado}min</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => rechazarOfertaDirecta(oferta.id)} style={{ ...pill, background: 'rgba(255,59,48,.15)', color: '#FF3B30', border: 'none', cursor: 'pointer' }}>
                        <X size={11} /> Rechazar
                      </button>
                      <button onClick={() => { aceptarOfertaDirecta(oferta); setPantalla('servicio'); }} style={{ ...pill, background: '#34C759', color: '#fff', border: 'none', cursor: 'pointer', padding: '6px 16px', boxShadow: '0 4px 12px rgba(52,199,89,.4)' }}>
                        <Check size={11} /> ACEPTAR
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: HISTORIAL ── */}
        {activeSubTab === 'historial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Período + Búsqueda */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                <Search size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Buscar servicio..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '9px 14px 9px 34px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
              </div>
              {(['hoy','semana','mes'] as Periodo[]).map(p => (
                <button key={p} onClick={() => setPeriodo(p)} style={{ ...pill, border: `1px solid ${periodo===p?'var(--primario)':'var(--border)'}`, background: periodo===p?'var(--primario-soft)':'var(--bg-alt)', color: periodo===p?'var(--primario)':'var(--text-muted)', cursor: 'pointer', padding: '8px 14px' }}>
                  {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>

            {/* Stats de periodo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Ganancias', val: `C$ ${stats.ganancias.toFixed(2)}`, color: '#34C759' },
                { label: 'Entregas', val: `${stats.entregas} envíos`, color: 'var(--text)' },
              ].map(s => (
                <div key={s.label} style={{ ...card, padding: '12px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Lista */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{filteredHistorial.length} registros</div>

            {filteredHistorial.length === 0 ? (
              <div style={{ ...card, padding: '32px 24px', textAlign: 'center' }}>
                <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin entregas en este período</div>
              </div>
            ) : (
              filteredHistorial.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => verServicioDetalle(s)} style={{ ...card, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', background: s.estado === 'entregado' ? 'rgba(52,199,89,.15)' : 'rgba(255,59,48,.15)', color: ESTADO_COLOR[s.estado]||'#9E9E9E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.paqueteFotoUrl ? (
                      <img src={s.paqueteFotoUrl} alt="Foto paquete" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : s.tipo === 'compra' ? <ShoppingBag size={18} /> : <Package size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text-muted)' }}>#{s.ordenId.substring(0,8)}</span>
                      <span style={{ ...pill, padding: '2px 7px', background: s.estado === 'entregado' ? 'rgba(52,199,89,.15)' : 'rgba(255,59,48,.15)', color: ESTADO_COLOR[s.estado]||'#9E9E9E', border: 'none' }}>
                        {s.estado}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.origen} → {s.destino}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.hora}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>+C${s.ganancia}</div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
