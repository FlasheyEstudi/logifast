'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, Mail, Phone, MapPin, Package,
  ChevronRight, X, TrendingUp, Calendar, DollarSign, BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStore, type Client, type Order } from '@/lib/store';

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    '#002A5C', '#FF6600', '#16A34A', '#8B5CF6', '#DC2626',
    '#D97706', '#0891B2', '#7C3AED', '#059669', '#BE185D',
    '#4F46E5', '#0D9488', '#EA580C', '#6D28D9', '#0369A1',
  ];
  return palette[Math.abs(hash) % palette.length];
}

function getFrequencyBadge(totalEnvios: number) {
  if (totalEnvios > 20)
    return { label: 'Frecuente', bg: 'rgba(255,102,0,0.12)', color: '#FF6600' };
  if (totalEnvios >= 5)
    return { label: 'Regular', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' };
  return { label: 'Nuevo', bg: 'rgba(22,163,74,0.12)', color: '#16A34A' };
}

function formatCurrency(n: number) {
  return `C$${n.toLocaleString('es-NI')}`;
}

type SortKey = 'envios' | 'monto' | 'ultimo';

/* ═══════════════════════════════════════════════
   MONTHLY ACTIVITY CHART DATA
   ═══════════════════════════════════════════════ */

function buildMonthlyActivity(clientOrders: Order[]) {
  const monthMap: Record<string, number> = {};
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  // Initialize all months
  monthNames.forEach((m) => (monthMap[m] = 0));

  clientOrders.forEach((o) => {
    const d = new Date(o.fecha);
    if (!isNaN(d.getTime())) {
      const label = monthNames[d.getMonth()];
      monthMap[label] = (monthMap[label] || 0) + 1;
    }
  });

  return monthNames.map((name) => ({ mes: name, envios: monthMap[name] || 0 }));
}

/* ═══════════════════════════════════════════════
   CUSTOM TOOLTIP FOR CHART
   ═══════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--lf-surface)',
        border: '1px solid var(--lf-border)',
        borderRadius: 8,
        padding: '6px 10px',
        fontSize: 12,
        boxShadow: 'var(--lf-shadow-md)',
      }}
    >
      <span style={{ color: 'var(--lf-text-main)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--lf-text-muted)', marginLeft: 6 }}>{payload[0].value} envíos</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════ */

function statusColor(estado: string) {
  switch (estado) {
    case 'entregado': return { bg: 'rgba(22,163,74,0.12)', color: '#16A34A' };
    case 'encamino': return { bg: 'rgba(255,102,0,0.12)', color: '#FF6600' };
    case 'recogido': return { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' };
    case 'pendiente': return { bg: 'rgba(251,191,36,0.12)', color: '#D97706' };
    case 'incidencia': return { bg: 'rgba(220,38,38,0.12)', color: '#DC2626' };
    default: return { bg: 'rgba(107,114,128,0.12)', color: '#6B7280' };
  }
}

function statusLabel(estado: string) {
  switch (estado) {
    case 'entregado': return 'Entregado';
    case 'encamino': return 'En camino';
    case 'recogido': return 'Recogido';
    case 'pendiente': return 'Pendiente';
    case 'incidencia': return 'Incidencia';
    default: return estado;
  }
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ModuleClientes() {
  const { clients, orders } = useStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('envios');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Active this month: clients whose ultimoEnvio is within current month
  const activeThisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return clients.filter((c) => c.ultimoEnvio.startsWith(ym)).length;
  }, [clients]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    let list = [...clients];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'envios') list.sort((a, b) => b.totalEnvios - a.totalEnvios);
    else if (sortBy === 'monto') list.sort((a, b) => b.montoTotal - a.montoTotal);
    else list.sort((a, b) => b.ultimoEnvio.localeCompare(a.ultimoEnvio));
    return list;
  }, [clients, search, sortBy]);

  // Selected client orders
  const selectedOrders = useMemo(() => {
    if (!selectedClient) return [];
    return orders.filter((o) => o.cliente === selectedClient.nombre);
  }, [selectedClient, orders]);

  const selectedAvg = selectedClient
    ? selectedClient.totalEnvios > 0
      ? Math.round(selectedClient.montoTotal / selectedClient.totalEnvios)
      : 0
    : 0;

  const monthlyData = useMemo(
    () => buildMonthlyActivity(selectedOrders),
    [selectedOrders]
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h2
          className="font-serif"
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: 'var(--lf-text-main)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}
        >
          Gestión de Clientes
        </h2>
        <p style={{ fontSize: 13, color: 'var(--lf-text-muted)', marginBottom: 16 }}>
          {clients.length} clientes registrados · {activeThisMonth} activos este mes
        </p>

        {/* Search + Sort row */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Search input */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--lf-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: 10,
                border: '1px solid var(--lf-border)',
                background: 'var(--lf-surface)',
                color: 'var(--lf-text-main)',
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--lf-accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--lf-border)')}
            />
          </div>

          {/* Sort select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--lf-border)',
              background: 'var(--lf-surface)',
              color: 'var(--lf-text-main)',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
              minWidth: 150,
            }}
          >
            <option value="envios">Más envíos</option>
            <option value="monto">Mayor gasto</option>
            <option value="ultimo">Último envío</option>
          </select>
        </div>
      </div>

      {/* ═══ CLIENT GRID ═══ */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="lf-scrollbar">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
          className="lf-clientes-grid"
        >
          {filtered.map((client) => {
            const badge = getFrequencyBadge(client.totalEnvios);
            const avatarColor = hashColor(client.nombre);
            const initials = getInitials(client.nombre);

            return (
              <motion.div
                key={client.id}
                whileHover={{ y: -2, boxShadow: 'var(--lf-shadow-md)' }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'var(--lf-surface)',
                  border: '1px solid var(--lf-border)',
                  borderRadius: 16,
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onClick={() => setSelectedClient(client)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lf-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--lf-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Avatar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 17,
                      fontWeight: 700,
                      flexShrink: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: 'var(--lf-text-main)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 2,
                      }}
                    >
                      {client.nombre}
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
                      <Mail size={11} style={{ flexShrink: 0 }} />
                      {client.email}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--lf-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      <Phone size={11} style={{ flexShrink: 0 }} />
                      {client.telefono}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 13,
                    color: 'var(--lf-text-secondary)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Package size={13} style={{ color: 'var(--lf-accent)' }} />
                    <span className="font-mono" style={{ fontWeight: 600 }}>
                      {client.totalEnvios}
                    </span>
                    <span style={{ fontSize: 12 }}>envíos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <DollarSign size={13} style={{ color: 'var(--lf-success)' }} />
                    <span className="font-mono" style={{ fontWeight: 600 }}>
                      {formatCurrency(client.montoTotal)}
                    </span>
                  </div>
                </div>

                {/* Frequency badge + zona */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: badge.bg,
                      color: badge.color,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {badge.label}
                  </span>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--lf-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MapPin size={11} />
                    {client.zonaFrecuente}
                  </div>
                </div>

                {/* Ver detalle button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--lf-accent)',
                    marginTop: 2,
                  }}
                >
                  Ver detalle
                  <ChevronRight size={14} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div
            style={{
              padding: 64,
              textAlign: 'center',
              color: 'var(--lf-text-muted)',
            }}
          >
            <User size={40} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              No se encontraron clientes
            </div>
            <div style={{ fontSize: 13 }}>Intenta con otro término de búsqueda</div>
          </div>
        )}
      </div>

      {/* ═══ CLIENT DETAIL PANEL (MODAL) ═══ */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              padding: 20,
            }}
            onClick={() => setSelectedClient(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--lf-surface)',
                border: '1px solid var(--lf-border)',
                borderRadius: 20,
                boxShadow: 'var(--lf-shadow-xl)',
                width: '100%',
                maxWidth: 760,
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
              }}
              className="lf-scrollbar"
            >
              {/* Modal header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '24px 28px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: hashColor(selectedClient.nombre),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 22,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(selectedClient.nombre)}
                  </div>
                  <div>
                    <h3
                      className="font-serif"
                      style={{
                        fontSize: 24,
                        fontWeight: 400,
                        color: 'var(--lf-text-main)',
                        letterSpacing: '-0.02em',
                        marginBottom: 2,
                      }}
                    >
                      {selectedClient.nombre}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 13,
                        color: 'var(--lf-text-muted)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} /> {selectedClient.email}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} /> {selectedClient.telefono}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {selectedClient.direccion}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: '1px solid var(--lf-border)',
                    background: 'var(--lf-bg-base)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--lf-text-muted)',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--lf-accent-soft)';
                    e.currentTarget.style.color = 'var(--lf-accent)';
                    e.currentTarget.style.borderColor = 'var(--lf-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--lf-bg-base)';
                    e.currentTarget.style.color = 'var(--lf-text-muted)';
                    e.currentTarget.style.borderColor = 'var(--lf-border)';
                  }}
                  aria-label="Cerrar detalle"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Metrics cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  padding: '20px 28px',
                }}
                className="lf-clientes-metrics-grid"
              >
                {[
                  {
                    icon: Package,
                    label: 'Envíos totales',
                    value: String(selectedClient.totalEnvios),
                    color: 'var(--lf-accent)',
                    bg: 'var(--lf-accent-soft)',
                  },
                  {
                    icon: DollarSign,
                    label: 'Monto total',
                    value: formatCurrency(selectedClient.montoTotal),
                    color: 'var(--lf-success)',
                    bg: 'rgba(22,163,74,0.08)',
                  },
                  {
                    icon: TrendingUp,
                    label: 'Promedio por envío',
                    value: formatCurrency(selectedAvg),
                    color: 'var(--lf-primary)',
                    bg: 'var(--lf-primary-soft)',
                  },
                  {
                    icon: MapPin,
                    label: 'Zona más frecuente',
                    value: selectedClient.zonaFrecuente,
                    color: '#8B5CF6',
                    bg: 'rgba(139,92,246,0.08)',
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.label}
                      style={{
                        background: m.bg,
                        borderRadius: 14,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--lf-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        <Icon size={13} style={{ color: m.color }} />
                        {m.label}
                      </div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: m.color,
                          lineHeight: 1.2,
                        }}
                      >
                        {m.value}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Activity chart */}
              <div style={{ padding: '0 28px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <BarChart3 size={15} style={{ color: 'var(--lf-accent)' }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--lf-text-main)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Actividad mensual
                  </span>
                </div>
                <div
                  style={{
                    background: 'var(--lf-bg-base)',
                    borderRadius: 14,
                    border: '1px solid var(--lf-border)',
                    padding: '16px 12px 8px',
                  }}
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" vertical={false} />
                      <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }}
                        axisLine={{ stroke: 'var(--lf-border)' }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--lf-accent-soft)' }} />
                      <Bar
                        dataKey="envios"
                        fill="var(--lf-accent)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Historial de envíos */}
              <div style={{ padding: '0 28px 28px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Package size={15} style={{ color: 'var(--lf-accent)' }} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--lf-text-main)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Historial de envíos
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--lf-text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {selectedOrders.length} registros
                  </span>
                </div>

                {/* Table */}
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid var(--lf-border)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Table header */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1fr 100px 100px 110px',
                      gap: 0,
                      background: 'var(--lf-bg-base)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--lf-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--lf-border)',
                    }}
                    className="lf-clientes-table-row"
                  >
                    <span>ID</span>
                    <span>Destino</span>
                    <span>Monto</span>
                    <span>Estado</span>
                    <span>Fecha</span>
                  </div>

                  {/* Table body */}
                  <div style={{ maxHeight: 240, overflowY: 'auto' }} className="lf-scrollbar">
                    {selectedOrders.length > 0 ? (
                      selectedOrders.map((order) => {
                        const sc = statusColor(order.estado);
                        return (
                          <div
                            key={order.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '90px 1fr 100px 100px 110px',
                              gap: 0,
                              padding: '10px 14px',
                              fontSize: 13,
                              borderBottom: '1px solid var(--lf-border)',
                              alignItems: 'center',
                              transition: 'background 0.15s',
                            }}
                            className="lf-clientes-table-row"
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--lf-bg-base)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span className="font-mono" style={{ fontWeight: 600, color: 'var(--lf-primary)' }}>
                              {order.id}
                            </span>
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: 'var(--lf-text-secondary)',
                              }}
                            >
                              {order.destino}
                            </span>
                            <span className="font-mono" style={{ fontWeight: 600 }}>
                              {formatCurrency(order.monto)}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: sc.bg,
                                color: sc.color,
                                width: 'fit-content',
                              }}
                            >
                              {statusLabel(order.estado)}
                            </span>
                            <span style={{ color: 'var(--lf-text-muted)', fontSize: 12 }}>
                              {order.fecha}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          padding: 32,
                          textAlign: 'center',
                          color: 'var(--lf-text-muted)',
                          fontSize: 13,
                        }}
                      >
                        Sin envíos registrados
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ RESPONSIVE STYLES ═══ */}
      <style jsx global>{`
        .lf-clientes-grid {
          grid-template-columns: repeat(3, 1fr) !important;
        }
        @media (max-width: 1024px) {
          .lf-clientes-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .lf-clientes-grid {
            grid-template-columns: 1fr !important;
          }
          .lf-clientes-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .lf-clientes-table-row {
            grid-template-columns: 70px 1fr 80px 80px 90px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}
