'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, Plus, MoreVertical, MapPin, X,
  ChevronLeft, ChevronRight, Package, Clock, CheckCircle,
  AlertCircle, Truck,
} from 'lucide-react';
import { useStore, type Order, type OrderStatus } from '@/lib/store';

const FILTER_TABS: { key: OrderStatus | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'programada', label: 'Programada' },
  { key: 'encamino', label: 'En camino' },
  { key: 'recogido', label: 'Recogido' },
  { key: 'entregado', label: 'Entregado' },
  { key: 'incidencia', label: 'Incidencia' },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; color: string; icon: typeof Package }> = {
  pendiente: { label: 'Pendiente', bg: 'rgba(251,191,36,0.1)', color: '#D97706', icon: Clock },
  programada: { label: 'Programada', bg: 'rgba(79,70,229,0.1)', color: '#4F46E5', icon: Clock },
  encamino: { label: 'En camino', bg: 'rgba(255,102,0,0.1)', color: '#FF6600', icon: Truck },
  recogido: { label: 'Recogido', bg: 'rgba(59,130,246,0.1)', color: '#3B82F6', icon: Package },
  entregado: { label: 'Entregado', bg: 'rgba(22,163,74,0.1)', color: '#16A34A', icon: CheckCircle },
  incidencia: { label: 'Incidencia', bg: 'rgba(220,38,38,0.1)', color: '#DC2626', icon: AlertCircle },
};

const ORDERS_PER_PAGE = 6;

/* ─── Toast hook ─── */
function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: 'success' | 'error' }>>([]);
  let idRef = 0;
  const addToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = ++idRef;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };
  return { toasts, addToast };
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <cfg.icon size={11} /> {cfg.label}
    </span>
  );
}

export default function ModulePedidos() {
  const {
    orders, riders, filterStatus, searchQuery, currentPage, dateFilter,
    setFilterStatus, setSearchQuery, setCurrentPage, setDateFilter,
    createOrderOpen, setCreateOrderOpen, detailOrder, setDetailOrder,
    reassignOrder, setReassignOrder, addOrder, cancelOrder, reassignRider,
  } = useStore();

  const { toasts, addToast } = useToast();
  const [actionMenuOrder, setActionMenuOrder] = useState<string | null>(null);

  // Form state for create order
  const [formOrigen, setFormOrigen] = useState('');
  const [formDestino, setFormDestino] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRider, setFormRider] = useState('');
  const [formPago, setFormPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [formMonto, setFormMonto] = useState('');
  const [formCliente, setFormCliente] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reassign state
  const [selectedRider, setSelectedRider] = useState('');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus !== 'todos' && o.estado !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return o.id.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q) ||
          o.destino.toLowerCase().includes(q) || (o.repartidor && o.repartidor.toLowerCase().includes(q));
      }
      if (dateFilter === 'hoy' && o.fecha !== '2026-06-10') return false;
      if (dateFilter === 'semana' && o.fecha < '2026-06-07') return false;
      return true;
    });
  }, [orders, filterStatus, searchQuery, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const safePage = currentPage > totalPages ? 1 : currentPage;
  const paginatedOrders = filteredOrders.slice((safePage - 1) * ORDERS_PER_PAGE, safePage * ORDERS_PER_PAGE);

  // Create order handler
  const handleCreateOrder = () => {
    const errors: Record<string, string> = {};
    if (!formCliente.trim()) errors.cliente = 'Requerido';
    if (!formOrigen.trim()) errors.origen = 'Requerido';
    if (!formDestino.trim()) errors.destino = 'Requerido';
    if (!formMonto || isNaN(Number(formMonto))) errors.monto = 'Monto inválido';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const newId = `LF-${2848 + orders.length}`;
    const rider = riders.find((r) => r.id === formRider);
    const newOrder: Order = {
      id: newId, cliente: formCliente, clienteTelefono: '+505 8888-0000',
      origen: formOrigen, destino: formDestino,
      origenLat: 12.11 + (Math.random() - 0.5) * 0.05, origenLng: -86.24 + (Math.random() - 0.5) * 0.05,
      destinoLat: 12.12 + (Math.random() - 0.5) * 0.05, destinoLng: -86.25 + (Math.random() - 0.5) * 0.05,
      repartidor: rider?.nombre || null, repartidorInitials: rider?.initials || '',
      descripcion: formDesc, monto: Number(formMonto), estado: 'pendiente',
      metodoPago: formPago, estadoPago: 'pendiente',
      fecha: '2026-06-10', hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      timeline: [
        { step: 'Orden creada', hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), completado: true },
        { step: 'En camino', hora: '—', completado: false },
        { step: 'Recogida', hora: '—', completado: false },
        { step: 'Entregada', hora: '—', completado: false },
      ],
    };
    addOrder(newOrder);
    setCreateOrderOpen(false);
    addToast(`Orden ${newId} creada exitosamente`);
    setFormOrigen(''); setFormDestino(''); setFormDesc(''); setFormRider('');
    setFormPago('efectivo'); setFormMonto(''); setFormCliente(''); setFormErrors({});
  };

  // Export CSV
  const exportCSV = () => {
    const header = 'ID,Cliente,Origen,Destino,Repartidor,Monto,Estado,Fecha';
    const rows = filteredOrders.map((o) => `${o.id},${o.cliente},${o.origen},${o.destino},${o.repartidor || 'Sin asignar'},${o.monto},${o.estado},${o.fecha}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pedidos.csv'; a.click();
    URL.revokeObjectURL(url);
    addToast('CSV exportado exitosamente');
  };

  // Reassign handler
  const handleReassign = () => {
    if (!reassignOrder || !selectedRider) return;
    const rider = riders.find((r) => r.id === selectedRider);
    if (rider) {
      reassignRider(reassignOrder.id, rider.nombre, rider.initials);
      addToast(`Orden ${reassignOrder.id} reasignada a ${rider.nombre}`);
    }
    setReassignOrder(null);
    setSelectedRider('');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 20px', overflow: 'auto' }}>
      {/* ═══ TOOLBAR ═══ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        {FILTER_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setFilterStatus(tab.key)} style={{
            padding: '6px 14px', borderRadius: 999, border: '1px solid var(--lf-border)',
            background: filterStatus === tab.key ? 'var(--lf-accent)' : 'transparent',
            color: filterStatus === tab.key ? '#fff' : 'var(--lf-text-muted)',
            fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--lf-text-muted)' }} />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por ID, cliente, destino..."
            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-surface)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
        </div>
        {/* Date filter */}
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{
          padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)',
          background: 'var(--lf-surface)', color: 'var(--lf-text-main)', fontSize: 13, cursor: 'pointer',
        }}>
          <option value="hoy">Hoy</option>
          <option value="semana">Este semana</option>
          <option value="mes">Este mes</option>
        </select>
        {/* Export */}
        <button onClick={exportCSV} style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid var(--lf-border)',
          background: 'transparent', color: 'var(--lf-text-muted)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}><Download size={14} /> Exportar CSV</button>
        {/* New order */}
        <button onClick={() => setCreateOrderOpen(true)} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: 'var(--lf-accent)', color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}><Plus size={14} /> Nueva orden</button>
      </div>

      {/* ═══ DESKTOP TABLE ═══ */}
      <div className="lf-pedidos-table" style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1.5fr 1fr 80px 100px 90px 40px', gap: 8, padding: '10px 12px', background: 'var(--lf-primary-soft)', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 11, color: 'var(--lf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>ID</span><span>Cliente</span><span>Origen → Destino</span><span>Repartidor</span><span>Monto</span><span>Estado</span><span>Fecha</span><span></span>
        </div>
        {/* Rows */}
        {paginatedOrders.map((order) => (
          <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1.5fr 1fr 80px 100px 90px 40px', gap: 8, padding: '12px', borderBottom: '1px solid var(--lf-border)', alignItems: 'center', fontSize: 13, transition: 'background 0.15s', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--lf-accent-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={() => setDetailOrder(order)}
          >
            <span className="font-mono" style={{ fontWeight: 700 }}>{order.id}</span>
            <span style={{ fontWeight: 500 }}>{order.cliente}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--lf-text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin size={11} style={{ flexShrink: 0 }} /> {order.origen} → {order.destino}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {order.repartidor ? (
                <>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--lf-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--lf-primary)', flexShrink: 0 }}>{order.repartidorInitials}</span>
                  <span style={{ fontSize: 12 }}>{order.repartidor}</span>
                </>
              ) : <span style={{ color: 'var(--lf-text-muted)', fontSize: 12 }}>Sin asignar</span>}
            </span>
            <span className="font-mono" style={{ fontWeight: 600 }}>C${order.monto}</span>
            <StatusBadge status={order.estado} />
            <span style={{ color: 'var(--lf-text-muted)', fontSize: 12 }}>{order.fecha}</span>
            <div style={{ position: 'relative' }}>
              <button onClick={(e) => { e.stopPropagation(); setActionMenuOrder(actionMenuOrder === order.id ? null : order.id); }} style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lf-text-muted)',
              }}><MoreVertical size={14} /></button>
              {actionMenuOrder === order.id && (
                <div style={{ position: 'absolute', right: 0, top: 32, minWidth: 180, background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 10, boxShadow: 'var(--lf-shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
                  {[
                    { label: 'Ver detalles', action: () => { setDetailOrder(order); setActionMenuOrder(null); } },
                    { label: 'Reasignar', action: () => { setReassignOrder(order); setActionMenuOrder(null); } },
                    { label: 'Cancelar', action: () => { cancelOrder(order.id); addToast(`Orden ${order.id} cancelada`, 'error'); setActionMenuOrder(null); } },
                  ].map((item) => (
                    <button key={item.label} onClick={(e) => { e.stopPropagation(); item.action(); }} style={{
                      display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                      cursor: 'pointer', fontSize: 13, textAlign: 'left', color: item.label === 'Cancelar' ? 'var(--lf-danger)' : 'var(--lf-text-main)',
                    }}>{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ MOBILE CARDS ═══ */}
      <div className="lf-pedidos-cards" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
        {paginatedOrders.map((order) => (
          <div key={order.id} onClick={() => setDetailOrder(order)} style={{
            background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 12, padding: 14, cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: 13 }}>{order.id}</span>
              <StatusBadge status={order.estado} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{order.cliente}</div>
            <div style={{ color: 'var(--lf-text-muted)', fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} /> {order.origen} → {order.destino}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-mono" style={{ fontWeight: 600 }}>C${order.monto}</span>
              <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{order.fecha}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ PAGINATION ═══ */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0' }}>
        <button disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
          border: '1px solid var(--lf-border)', background: 'var(--lf-surface)', color: 'var(--lf-text-main)',
          cursor: safePage <= 1 ? 'not-allowed' : 'pointer', opacity: safePage <= 1 ? 0.4 : 1, fontSize: 13,
        }}><ChevronLeft size={14} /> Anterior</button>
        <span className="font-mono" style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>{safePage} / {totalPages}</span>
        <button disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
          border: '1px solid var(--lf-border)', background: 'var(--lf-surface)', color: 'var(--lf-text-main)',
          cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.4 : 1, fontSize: 13,
        }}>Siguiente <ChevronRight size={14} /></button>
      </div>

      {/* ═══ CREATE ORDER MODAL ═══ */}
      <AnimatePresence>
        {createOrderOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setCreateOrderOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--lf-surface)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>Nueva Orden</h3>
                <button onClick={() => setCreateOrderOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Cliente *</label>
                  <input value={formCliente} onChange={(e) => setFormCliente(e.target.value)} placeholder="Nombre del cliente"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.cliente ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                  {formErrors.cliente && <span style={{ fontSize: 11, color: 'var(--lf-danger)' }}>{formErrors.cliente}</span>}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Origen *</label>
                  <input value={formOrigen} onChange={(e) => setFormOrigen(e.target.value)} placeholder="Dirección de origen"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.origen ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                  {formErrors.origen && <span style={{ fontSize: 11, color: 'var(--lf-danger)' }}>{formErrors.origen}</span>}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Destino *</label>
                  <input value={formDestino} onChange={(e) => setFormDestino(e.target.value)} placeholder="Dirección de destino"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.destino ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                  {formErrors.destino && <span style={{ fontSize: 11, color: 'var(--lf-danger)' }}>{formErrors.destino}</span>}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Descripción</label>
                  <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Descripción del envío"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Repartidor</label>
                    <select value={formRider} onChange={(e) => setFormRider(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13 }}>
                      <option value="">Sin asignar</option>
                      {riders.filter((r) => r.conectado).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Monto (C$) *</label>
                    <input value={formMonto} onChange={(e) => setFormMonto(e.target.value)} placeholder="0" type="number"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.monto ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                    {formErrors.monto && <span style={{ fontSize: 11, color: 'var(--lf-danger)' }}>{formErrors.monto}</span>}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Método de pago</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['efectivo', 'transferencia'] as const).map((m) => (
                      <button key={m} onClick={() => setFormPago(m)} style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${formPago === m ? 'var(--lf-accent)' : 'var(--lf-border)'}`,
                        background: formPago === m ? 'var(--lf-accent-soft)' : 'transparent',
                        color: formPago === m ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      }}>{m === 'efectivo' ? 'Efectivo' : 'Transferencia'}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleCreateOrder} style={{
                  padding: '12px 24px', borderRadius: 10, border: 'none',
                  background: 'var(--lf-accent)', color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', marginTop: 8,
                }}>Crear Orden</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ORDER DETAIL MODAL ═══ */}
      <AnimatePresence>
        {detailOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setDetailOrder(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--lf-surface)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 className="font-mono" style={{ fontWeight: 700, fontSize: 20 }}>{detailOrder.id}</h3>
                  <StatusBadge status={detailOrder.estado} />
                </div>
                <button onClick={() => setDetailOrder(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Cliente</span><div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{detailOrder.cliente}</div></div>
                <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Teléfono</span><div style={{ fontSize: 14, marginTop: 2 }}>{detailOrder.clienteTelefono}</div></div>
                <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Origen</span><div style={{ fontSize: 13, marginTop: 2 }}>{detailOrder.origen}</div></div>
                <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Destino</span><div style={{ fontSize: 13, marginTop: 2 }}>{detailOrder.destino}</div></div>
                <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Monto</span><div className="font-mono" style={{ fontWeight: 700, fontSize: 16, color: 'var(--lf-accent)', marginTop: 2 }}>C${detailOrder.monto}</div></div>
                <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Pago</span><div style={{ fontSize: 14, marginTop: 2 }}>{detailOrder.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'} · {detailOrder.estadoPago}</div></div>
                <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Repartidor</span><div style={{ fontSize: 14, marginTop: 2 }}>{detailOrder.repartidor || 'Sin asignar'}</div></div>
                <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Descripción</span><div style={{ fontSize: 13, marginTop: 2 }}>{detailOrder.descripcion}</div></div>
              </div>

              {/* Timeline */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Timeline</span>
                {detailOrder.timeline.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', position: 'relative' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${step.completado ? 'var(--lf-success)' : 'var(--lf-border)'}`, background: step.completado ? 'var(--lf-success)' : 'transparent', flexShrink: 0 }} />
                    {i < detailOrder.timeline.length - 1 && <div style={{ position: 'absolute', left: 5, top: 20, width: 2, height: 20, background: step.completado ? 'var(--lf-success)' : 'var(--lf-border)' }} />}
                    <span style={{ fontSize: 13, fontWeight: step.completado ? 600 : 400, color: step.completado ? 'var(--lf-text-main)' : 'var(--lf-text-muted)' }}>{step.step}</span>
                    <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)', marginLeft: 'auto' }}>{step.hora}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REASSIGN MODAL ═══ */}
      <AnimatePresence>
        {reassignOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setReassignOrder(null); setSelectedRider(''); }}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--lf-surface)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 420 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>Reasignar {reassignOrder.id}</h3>
                <button onClick={() => { setReassignOrder(null); setSelectedRider(''); }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                {riders.filter((r) => r.conectado && r.status === 'available').map((rider) => (
                  <label key={rider.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 10, border: `1px solid ${selectedRider === rider.id ? 'var(--lf-accent)' : 'var(--lf-border)'}`,
                    background: selectedRider === rider.id ? 'var(--lf-accent-soft)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="rider" checked={selectedRider === rider.id} onChange={() => setSelectedRider(rider.id)} style={{ accentColor: 'var(--lf-accent)' }} />
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: rider.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{rider.initials}</div>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{rider.nombre}</div><div style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>{rider.motoId}</div></div>
                  </label>
                ))}
              </div>
              <button onClick={handleReassign} disabled={!selectedRider} style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: selectedRider ? 'var(--lf-accent)' : 'var(--lf-border)',
                color: selectedRider ? '#fff' : 'var(--lf-text-muted)',
                fontWeight: 700, fontSize: 14, cursor: selectedRider ? 'pointer' : 'not-allowed', marginTop: 16,
              }}>Reasignar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TOASTS ═══ */}
      <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            style={{
              padding: '10px 16px', borderRadius: 10, background: t.type === 'success' ? 'var(--lf-success)' : 'var(--lf-danger)',
              color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: 'var(--lf-shadow-md)',
            }}>{t.msg}</motion.div>
        ))}
      </div>

      {/* Responsive */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .lf-pedidos-table { display: none !important; }
          .lf-pedidos-cards { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
