'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ShoppingBag, Navigation, MessageCircle, RefreshCw, Star,
  Clock, MapPin, RotateCcw, Search, ChevronRight, Bike, Plus,
} from '@/components/icons';
import { useStore, type Order } from '@/lib/store';
import { useMarketplaceStore, type OrdenCompra } from '@/lib/marketplace-store';

interface ClientPedidosProps {
  isDark: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
  onOpenRating?: (orderId: string) => void;
}

type TabKey = 'activos' | 'historial';
type HistoriaFilterKey = 'todos' | 'entregados';

/* ── Color helpers ── */
const STATUS_MAP: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pendiente:   { bg: 'rgba(255,149,0,.13)',  text: '#FF9500', dot: '#FF9500', label: 'Pendiente' },
  encamino:    { bg: 'var(--primario-soft)', text: 'var(--primario)', dot: 'var(--primario)', label: 'En camino' },
  recogido:    { bg: 'rgba(175,82,222,.13)', text: '#AF52DE', dot: '#AF52DE', label: 'Recogido' },
  entregado:   { bg: 'rgba(52,199,89,.13)',  text: '#34C759', dot: '#34C759', label: 'Entregado' },
  incidencia:  { bg: 'rgba(255,59,48,.13)',  text: '#FF3B30', dot: '#FF3B30', label: 'Incidencia' },
  recibido:    { bg: 'rgba(0,122,255,.12)',  text: '#007AFF', dot: '#007AFF', label: 'Recibido' },
  preparando:  { bg: 'rgba(255,149,0,.13)',  text: '#FF9500', dot: '#FF9500', label: 'Preparando' },
  listo:       { bg: 'rgba(0,122,255,.12)',  text: '#007AFF', dot: '#007AFF', label: 'Listo p/envío' },
  en_camino:   { bg: 'var(--primario-soft)', text: 'var(--primario)', dot: 'var(--primario)', label: 'En camino' },
};

function statusInfo(estado: string) {
  return STATUS_MAP[estado] || { bg: 'var(--bg-alt)', text: 'var(--text-muted)', dot: 'var(--text-muted)', label: estado };
}

/* ── Shared styles ── */
const pill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
};

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
};

const btnPrimary = (bg = 'var(--primario)', shadow?: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 18px', borderRadius: 100, border: 'none', background: bg,
  color: bg === 'var(--primario)' || bg === '#34C759' || bg === '#007AFF' ? '#fff' : 'var(--text)',
  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  boxShadow: shadow, transition: 'all 0.2s',
});

/* ── Compra Status step bar ── */
const COMPRA_STEPS = ['recibido', 'preparando', 'listo', 'en_camino', 'entregado'];
function CompraStepBar({ estado }: { estado: string }) {
  const idx = COMPRA_STEPS.indexOf(estado);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '4px 0' }}>
      {COMPRA_STEPS.map((step, i) => {
        const done = i <= idx;
        const info = statusInfo(step);
        return (
          <React.Fragment key={step}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: done ? info.dot : 'var(--border)', flexShrink: 0, transition: 'background 0.3s' }} />
            {i < COMPRA_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done && i < idx ? info.dot : 'var(--border)', transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── ActiveCompraCard ── */
function ActiveCompraCard({ oc, onOpenTracking, onOpenChat }: { oc: OrdenCompra; onOpenTracking: (id: string) => void; onOpenChat?: (id: string) => void }) {
  const info = statusInfo(oc.estado);
  const etaMin = useMemo(() => Math.floor(Math.random() * 20) + 15, []);

  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ ...card, overflow: 'hidden' }}>
      <div style={{ height: 3, background: info.dot }} />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: oc.tiendaColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>{oc.tiendaLogo}</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{oc.tiendaNombre}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{oc.items.length} producto{oc.items.length !== 1 ? 's' : ''} • {oc.items.map(i => i.nombreProducto).join(', ').substring(0, 30)}…</div>
            </div>
          </div>
          <span style={{ ...pill, background: info.bg, color: info.text, border: 'none' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: info.dot }} />{info.label}
          </span>
        </div>

        {/* Step progress */}
        <CompraStepBar estado={oc.estado} />

        {/* Repartidor + ETA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 14, background: 'var(--bg-alt)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primario-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primario)' }}>
              {oc.repartidorInitials || '?'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{oc.repartidorNombre || 'Sin asignar'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Repartidor</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)', lineHeight: 1 }}>~{etaMin}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>minutos</div>
          </div>
        </div>

        {/* Total + Botones */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>C$ {oc.total}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {onOpenChat && (
              <button onClick={() => onOpenChat(oc.id)} style={{ ...btnPrimary('var(--bg-alt)'), color: 'var(--text)', padding: '9px 14px' }}>
                <MessageCircle size={15} /> Mensaje
              </button>
            )}
            <button onClick={() => onOpenTracking(oc.id)} style={btnPrimary()}>
              <Navigation size={15} /> Rastrear
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── ActiveEnvioCard ── */
function ActiveEnvioCard({ order, onOpenTracking, onOpenChat }: { order: Order; onOpenTracking: (id: string) => void; onOpenChat: (id: string) => void }) {
  const info = statusInfo(order.estado);
  const etaMin = useMemo(() => Math.floor(Math.random() * 12) + 8, []);

  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ ...card, overflow: 'hidden' }}>
      <div style={{ height: 3, background: info.dot }} />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primario-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={22} style={{ color: 'var(--primario)' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', marginBottom: 2 }}>#{order.id.substring(0, 10)}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                {order.origen} → {order.destino}
              </div>
            </div>
          </div>
          <span style={{ ...pill, background: info.bg, color: info.text, border: 'none' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: info.dot }} />{info.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 14, background: 'var(--bg-alt)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primario-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primario)' }}>
              {order.repartidorInitials || '?'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{order.repartidor || 'Sin asignar'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Repartidor</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)', lineHeight: 1 }}>~{etaMin}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>minutos</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onOpenTracking(order.id)} style={{ ...btnPrimary(), flex: 1 }}>
            <Navigation size={15} /> Rastrear
          </button>
          {order.repartidor && (
            <button onClick={() => onOpenChat(order.id)} style={{ ...btnPrimary('var(--bg-alt)'), color: 'var(--text)', padding: '10px 14px' }}>
              <MessageCircle size={15} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── History item (compra) ── */
function CompraHistoryItem({ oc, onNavigate, onOpenRating }: { oc: OrdenCompra; onNavigate: any; onOpenRating?: (id: string) => void }) {
  const info = statusInfo(oc.estado);
  const itemCount = oc.items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ ...card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: oc.tiendaColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: "'Syne', sans-serif" }}>{oc.tiendaLogo}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oc.tiendaNombre}</span>
          <span style={{ ...pill, padding: '2px 8px', background: info.bg, color: info.text, border: 'none' }}>{info.label}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{itemCount} ítem{itemCount !== 1 ? 's' : ''} • {oc.fecha}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>C$ {oc.total}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onNavigate('explorar')} style={{ ...pill, background: 'var(--bg-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', padding: '4px 10px' }}>
            <RotateCcw size={10} /> Reordenar
          </button>
          {!oc.calificacion && onOpenRating && (
            <button onClick={() => onOpenRating(oc.id)} style={{ ...pill, background: 'rgba(245,158,11,.12)', color: '#F59E0B', border: 'none', cursor: 'pointer' }}>
              <Star size={10} /> Calificar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── MAIN ── */
export default function ClientPedidos({ isDark, userName, onNavigate, onOpenTracking, onOpenChat, onOpenRating }: ClientPedidosProps) {
  const { orders } = useStore();
  const { ordenesCompra } = useMarketplaceStore();
  const [activeTab, setActiveTab] = useState<TabKey>('activos');
  const [historiaFilter, setHistoriaFilter] = useState<HistoriaFilterKey>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const fetchClientOrders = async () => {
      try {
        const res = await fetch('/api/ordenes');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.ordenes)) useStore.setState({ orders: data.ordenes });
        }
      } catch {}
    };
    fetchClientOrders();
    const interval = setInterval(fetchClientOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeEnvios = useMemo(() => orders.filter(o => ['pendiente','encamino','recogido'].includes(o.estado)), [orders]);
  const activeCompras = useMemo(() => ordenesCompra.filter(oc => oc.estado !== 'entregado'), [ordenesCompra]);
  const deliveredCompras = useMemo(() => ordenesCompra.filter(oc => oc.estado === 'entregado'), [ordenesCompra]);

  const filteredHistory = useMemo(() => {
    let compras = deliveredCompras.map(oc => ({ ...oc, _type: 'compra' as const }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      compras = compras.filter(oc => oc.tiendaNombre.toLowerCase().includes(q) || oc.id.toLowerCase().includes(q));
    }
    return compras;
  }, [deliveredCompras, historiaFilter, searchQuery]);

  const totalActivos = activeEnvios.length + activeCompras.length;

  const TABS = [
    { key: 'activos' as TabKey, label: `Activos${totalActivos > 0 ? ` (${totalActivos})` : ''}` },
    { key: 'historial' as TabKey, label: `Historial (${deliveredCompras.length})` },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingTop: 4 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Mis Pedidos</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Envíos y compras de tienda</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onNavigate('solicitar')} style={{ ...btnPrimary(), padding: '9px 16px', fontSize: 13 }}>
            <Package size={14} /> Envío
          </button>
          <button onClick={() => onNavigate('explorar')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <ShoppingBag size={14} /> Tienda
          </button>
        </div>
      </div>

      {/* RESUMEN CAPSULAR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Envíos activos', val: String(activeEnvios.length), color: 'var(--primario)', icon: <Package size={14} style={{ color: 'var(--primario)' }} /> },
          { label: 'Compras activas', val: String(activeCompras.length), color: '#FF9500', icon: <ShoppingBag size={14} style={{ color: '#FF9500' }} /> },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {s.icon}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color, lineHeight: 1 }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TABS CAPSULARES */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '9px 20px', borderRadius: 100,
            border: activeTab === tab.key ? 'none' : '1px solid var(--border)',
            background: activeTab === tab.key ? 'var(--primario)' : 'var(--bg-alt)',
            color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── TAB ACTIVOS ── */}
        {activeTab === 'activos' && (
          <motion.div key="activos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {totalActivos === 0 ? (
              <div style={{ ...card, padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <svg width="100" height="80" viewBox="0 0 140 110" fill="none">
                  <rect x="30" y="40" width="80" height="55" rx="8" style={{ fill: 'var(--bg-alt)' }} stroke="var(--border)" strokeWidth="2" />
                  <rect x="30" y="40" width="80" height="20" rx="8" style={{ fill: 'var(--primario-soft)' }} stroke="var(--primario)" strokeWidth="1.5" />
                  <path d="M30 52 L70 32 L110 52" stroke="var(--primario)" strokeWidth="2" fill="none" />
                  <circle cx="50" cy="70" r="4" style={{ fill: 'var(--border)' }} />
                  <circle cx="90" cy="70" r="4" style={{ fill: 'var(--border)' }} />
                </svg>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: '0 0 4px 0' }}>Sin pedidos activos</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Solicita un envío o haz una compra</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onNavigate('solicitar')} style={btnPrimary()}>
                    <Package size={14} /> Envío Express
                  </button>
                  <button onClick={() => onNavigate('explorar')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '10px 18px', borderRadius: 100, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <ShoppingBag size={14} /> Explorar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Envíos activos */}
                {activeEnvios.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Package size={12} /> Envíos en curso ({activeEnvios.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {activeEnvios.map(order => <ActiveEnvioCard key={order.id} order={order} onOpenTracking={onOpenTracking} onOpenChat={onOpenChat} />)}
                    </div>
                  </div>
                )}
                {/* Compras activas */}
                {activeCompras.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShoppingBag size={12} /> Compras de tienda ({activeCompras.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {activeCompras.map(oc => <ActiveCompraCard key={oc.id} oc={oc} onOpenTracking={onOpenTracking} onOpenChat={onOpenChat} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── TAB HISTORIAL ── */}
        {activeTab === 'historial' && (
          <motion.div key="historial" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Búsqueda + Filtro */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                <Search size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Buscar pedidos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '9px 14px 9px 34px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
              </div>
              <button onClick={() => setHistoriaFilter(historiaFilter === 'entregados' ? 'todos' : 'entregados')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 100,
                border: `1px solid ${historiaFilter === 'entregados' ? '#34C759' : 'var(--border)'}`,
                background: historiaFilter === 'entregados' ? 'rgba(52,199,89,.12)' : 'var(--bg-alt)',
                color: historiaFilter === 'entregados' ? '#34C759' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Entregados
              </button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredHistory.length} pedido{filteredHistory.length !== 1 ? 's' : ''}</div>

            {filteredHistory.length === 0 ? (
              <div style={{ ...card, padding: '36px 24px', textAlign: 'center' }}>
                <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay pedidos en el historial</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredHistory.map(item => (
                  <CompraHistoryItem key={item.id} oc={item} onNavigate={onNavigate} onOpenRating={onOpenRating} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
