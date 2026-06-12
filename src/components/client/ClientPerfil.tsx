'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Edit3, Save, X, Plus, Trash2,
  LogOut, Shield, Bell, Moon, Sun, Globe, ChevronRight, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useStore } from '@/lib/store';
import type { DireccionGuardada } from '@/lib/store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */
interface ClientPerfilProps {
  isDark: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'perfil') => void;
  onLogout: () => void;
}

/* ═══════════════════════════════════════════════
   MOCK CHART DATA
   ═══════════════════════════════════════════════ */
const MONTHLY_DATA = [
  { mes: 'Ene', envios: 3 },
  { mes: 'Feb', envios: 5 },
  { mes: 'Mar', envios: 2 },
  { mes: 'Abr', envios: 4 },
  { mes: 'May', envios: 6 },
  { mes: 'Jun', envios: 4 },
];

/* ═══════════════════════════════════════════════
   CUSTOM TOGGLE
   ═══════════════════════════════════════════════ */
function Toggle({ on, onToggle, disabled = false }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: on ? 'var(--primario)' : 'var(--text-muted, #999)',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: on ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
        }}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════════ */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 20,
          padding: 24, maxWidth: 400, width: '100%',
          border: '1px solid var(--border)',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   TOOLTIP CUSTOM (Recharts)
   ═══════════════════════════════════════════════ */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '6px 10px',
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--text)',
      }}
    >
      <span style={{ color: 'var(--primario)', fontWeight: 700 }}>{payload[0].value}</span>
      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>envíos</span>
      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function ClientPerfil({ isDark, userName, onNavigate, onLogout }: ClientPerfilProps) {
  const {
    direccionesGuardadas,
    addDireccionGuardada,
    removeDireccionGuardada,
    direccionesSugerencias,
    orders,
  } = useStore();

  /* ─── Edit profile state ─── */
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editPhone, setEditPhone] = useState('+505 8888-1234');
  const [editAddress, setEditAddress] = useState('Col. Los Robles, Managua');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSugg, setShowAddressSugg] = useState(false);

  /* ─── Add address state ─── */
  const [addingAddr, setAddingAddr] = useState(false);
  const [newAddr, setNewAddr] = useState('');
  const [newAddrLabel, setNewAddrLabel] = useState<'Casa' | 'Trabajo' | 'Otro'>('Casa');
  const [newAddrSuggestions, setNewAddrSuggestions] = useState<string[]>([]);
  const [showNewAddrSugg, setShowNewAddrSugg] = useState(false);

  /* ─── Settings state ─── */
  const [pushNotif, setPushNotif] = useState(true);
  const [emailPromo, setEmailPromo] = useState(true);
  const [prefPayment, setPrefPayment] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [prefPaymentInited, setPrefPaymentInited] = useState(false);

  /* ─── Modals ─── */
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  /* ─── Computed metrics ─── */
  const clientOrders = useMemo(
    () => orders.filter((o) => o.cliente === userName || o.cliente === 'María López' || o.cliente === 'Maria López'),
    [orders, userName],
  );

  const metrics = useMemo(() => {
    const total = clientOrders.length;
    const totalSpent = clientOrders.reduce((s, o) => s + o.monto, 0);
    const avg = total > 0 ? Math.round(totalSpent / total) : 0;

    // Most frequent zone: most common destination barrio
    const zoneCount: Record<string, number> = {};
    clientOrders.forEach((o) => {
      const zone = o.destino.split(',')[0].trim();
      zoneCount[zone] = (zoneCount[zone] || 0) + 1;
    });
    const topZone = Object.entries(zoneCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // Most used payment method
    const payCount: Record<string, number> = {};
    clientOrders.forEach((o) => {
      payCount[o.metodoPago] = (payCount[o.metodoPago] || 0) + 1;
    });
    const topPayment = (Object.entries(payCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'efectivo') as 'efectivo' | 'transferencia';

    return { total, totalSpent, avg, topZone, topPayment };
  }, [clientOrders]);

  // Initialize preferred payment from order history (once)
  if (!prefPaymentInited && metrics.topPayment) {
    setPrefPayment(metrics.topPayment);
    setPrefPaymentInited(true);
  }

  /* ─── Autocomplete helpers ─── */
  const filterSuggestions = (val: string) => {
    if (!val || val.length < 2) return [];
    const lower = val.toLowerCase();
    return direccionesSugerencias
      .filter((d) => d.direccion.toLowerCase().includes(lower))
      .map((d) => d.direccion)
      .slice(0, 5);
  };

  const handleEditAddrChange = (val: string) => {
    setEditAddress(val);
    const s = filterSuggestions(val);
    setAddressSuggestions(s);
    setShowAddressSugg(s.length > 0);
  };

  const handleNewAddrChange = (val: string) => {
    setNewAddr(val);
    const s = filterSuggestions(val);
    setNewAddrSuggestions(s);
    setShowNewAddrSugg(s.length > 0);
  };

  /* ─── Init helpers ─── */
  const initials = useMemo(() => {
    const parts = userName.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : userName.slice(0, 2).toUpperCase();
  }, [userName]);

  const email = 'cliente@logifast.com';

  /* ─── Save address ─── */
  const handleAddAddress = () => {
    if (!newAddr.trim()) return;
    const match = direccionesSugerencias.find((d) => d.direccion === newAddr);
    addDireccionGuardada({
      id: `DG-${Date.now()}`,
      etiqueta: newAddrLabel,
      direccion: newAddr,
      lat: match?.lat ?? 12.12,
      lng: match?.lng ?? -86.25,
    });
    setNewAddr('');
    setNewAddrLabel('Casa');
    setAddingAddr(false);
  };

  /* ─── Toggle theme ─── */
  const toggleThemeLocal = () => {
    const next = !isDark;
    localStorage.setItem('logifast-theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    // Dispatch storage event for parent
    window.dispatchEvent(new Event('storage'));
  };

  /* ═══════════════════════════════════════════════
     STYLES
     ═══════════════════════════════════════════════ */
  const section: React.CSSProperties = {
    background: 'var(--surface)',
    borderRadius: 20,
    border: '1px solid var(--border)',
    padding: 24,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--bg-alt)',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--primario)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };

  const btnGhost: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto', padding: '0 4px' }}>
      {/* ─── 1. PERSONAL INFO ─── */}
      <div style={section}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--primario-soft, rgba(255,87,34,0.12))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primario)',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <AnimatePresence mode="wait">
            {!editing ? (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{ textAlign: 'center', width: '100%' }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>
                  {userName}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Mail size={14} /> {email}
                </div>
                <button
                  onClick={() => {
                    setEditName(userName);
                    setEditPhone('+505 8888-1234');
                    setEditAddress('Col. Los Robles, Managua');
                    setEditing(true);
                  }}
                  style={{
                    ...btnGhost,
                    marginTop: 16,
                    color: 'var(--primario)',
                    borderColor: 'var(--primario)',
                  }}
                >
                  <Edit3 size={15} /> Editar perfil
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}
              >
                {/* Name */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} /> Nombre
                  </label>
                  <input
                    style={inputStyle}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                {/* Email (disabled) */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={12} /> Correo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: 36, opacity: 0.6 }}
                      value={email}
                      disabled
                    />
                    <Shield
                      size={14}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </div>
                </div>
                {/* Phone */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} /> Teléfono
                  </label>
                  <input
                    style={inputStyle}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                {/* Address with autocomplete */}
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> Dirección principal
                  </label>
                  <input
                    style={inputStyle}
                    value={editAddress}
                    onChange={(e) => handleEditAddrChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowAddressSugg(false), 200)}
                    onFocus={() => {
                      const s = filterSuggestions(editAddress);
                      if (s.length) setShowAddressSugg(true);
                    }}
                  />
                  <AnimatePresence>
                    {showAddressSugg && addressSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 12, marginTop: 4, overflow: 'hidden',
                        }}
                      >
                        {addressSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setEditAddress(s);
                              setShowAddressSugg(false);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 14px', width: '100%', border: 'none',
                              background: 'transparent', color: 'var(--text)',
                              cursor: 'pointer', fontSize: 13, textAlign: 'left',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-alt)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <MapPin size={13} style={{ color: 'var(--primario)', flexShrink: 0 }} /> {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button style={btnGhost} onClick={() => setEditing(false)}>
                    <X size={15} /> Cancelar
                  </button>
                  <button style={btnPrimary} onClick={() => setEditing(false)}>
                    <Save size={15} /> Guardar cambios
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── 2. METRICS ─── */}
      <div style={section}>
        <h3
          style={{
            fontSize: 16, fontWeight: 700, color: 'var(--text)',
            fontFamily: "'Syne', sans-serif", marginBottom: 16,
          }}
        >
          Mis métricas
        </h3>

        {/* Bar chart */}
        <div style={{ height: 120, marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                width={25}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--primario-soft, rgba(255,87,34,0.08))' }} />
              <Bar dataKey="envios" fill="var(--primario)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <StatCard label="Envíos totales" value={String(metrics.total)} />
          <StatCard label="Total gastado" value={`C$${metrics.totalSpent.toLocaleString()}`} />
          <StatCard label="Promedio/envío" value={`C$${metrics.avg}`} />
          <StatCard label="Zona frecuente" value={metrics.topZone} />
        </div>
      </div>

      {/* ─── 3. SAVED ADDRESSES ─── */}
      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", margin: 0 }}>
            Direcciones guardadas
          </h3>
          <button
            onClick={() => setAddingAddr(true)}
            style={{
              ...btnGhost,
              padding: '6px 12px',
              fontSize: 13,
              color: 'var(--primario)',
              borderColor: 'var(--primario)',
            }}
          >
            <Plus size={14} /> Agregar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {direccionesGuardadas.map((d) => (
            <div
              key={d.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 14,
                background: 'var(--bg-alt)', border: '1px solid var(--border)',
              }}
            >
              <MapPin size={16} style={{ color: 'var(--primario)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.direccion}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 8,
                  background: d.etiqueta === 'Casa' ? 'var(--primario-soft, rgba(255,87,34,0.12))'
                    : d.etiqueta === 'Trabajo' ? 'rgba(41,121,255,0.12)'
                    : 'var(--bg)',
                  color: d.etiqueta === 'Casa' ? 'var(--primario)'
                    : d.etiqueta === 'Trabajo' ? 'var(--info, #2979FF)'
                    : 'var(--text-muted)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {d.etiqueta}
              </span>
              <button
                onClick={() => removeDireccionGuardada(d.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, display: 'flex', color: 'var(--text-muted)',
                }}
                title="Eliminar"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add address form */}
        <AnimatePresence>
          {addingAddr && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginTop: 12 }}
            >
              <div
                style={{
                  padding: 16, borderRadius: 14,
                  background: 'var(--bg-alt)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                {/* Address input with autocomplete */}
                <div style={{ position: 'relative' }}>
                  <input
                    style={inputStyle}
                    placeholder="Buscar dirección..."
                    value={newAddr}
                    onChange={(e) => handleNewAddrChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowNewAddrSugg(false), 200)}
                    onFocus={() => {
                      const s = filterSuggestions(newAddr);
                      if (s.length) setShowNewAddrSugg(true);
                    }}
                  />
                  <AnimatePresence>
                    {showNewAddrSugg && newAddrSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 12, marginTop: 4, overflow: 'hidden',
                        }}
                      >
                        {newAddrSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setNewAddr(s);
                              setShowNewAddrSugg(false);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 14px', width: '100%', border: 'none',
                              background: 'transparent', color: 'var(--text)',
                              cursor: 'pointer', fontSize: 13, textAlign: 'left',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-alt)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <MapPin size={13} style={{ color: 'var(--primario)', flexShrink: 0 }} /> {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label select */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Casa', 'Trabajo', 'Otro'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      onClick={() => setNewAddrLabel(lbl)}
                      style={{
                        padding: '6px 14px', borderRadius: 10,
                        border: '1px solid',
                        borderColor: newAddrLabel === lbl ? 'var(--primario)' : 'var(--border)',
                        background: newAddrLabel === lbl ? 'var(--primario-soft, rgba(255,87,34,0.12))' : 'transparent',
                        color: newAddrLabel === lbl ? 'var(--primario)' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button style={{ ...btnGhost, padding: '8px 14px' }} onClick={() => { setAddingAddr(false); setNewAddr(''); }}>
                    Cancelar
                  </button>
                  <button
                    style={{ ...btnPrimary, padding: '8px 14px' }}
                    onClick={handleAddAddress}
                    disabled={!newAddr.trim()}
                  >
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── 4. PREFERRED PAYMENT ─── */}
      <div style={section}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 12 }}>
          Método de pago preferido
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: prefPayment === 'efectivo' ? 'var(--primario-soft, rgba(255,87,34,0.12))' : 'rgba(41,121,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 20 }}>
                {prefPayment === 'efectivo' ? '💵' : '🏦'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                {prefPayment === 'efectivo' ? 'Efectivo' : 'Transferencia'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Más usado en tus envíos
              </div>
            </div>
          </div>
          <button
            onClick={() => setPrefPayment((p) => (p === 'efectivo' ? 'transferencia' : 'efectivo'))}
            style={{
              ...btnGhost,
              padding: '8px 14px',
              fontSize: 13,
            }}
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* ─── 5. SETTINGS ─── */}
      <div style={section}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 16 }}>
          Configuración
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Push notifications */}
          <SettingsRow
            icon={<Bell size={18} />}
            label="Recibir notificaciones push"
            right={<Toggle on={pushNotif} onToggle={() => setPushNotif((p) => !p)} />}
          />
          {/* Email promos */}
          <SettingsRow
            icon={<Mail size={18} />}
            label="Recibir promociones por email"
            right={<Toggle on={emailPromo} onToggle={() => setEmailPromo((p) => !p)} />}
          />
          {/* Dark mode */}
          <SettingsRow
            icon={isDark ? <Moon size={18} /> : <Sun size={18} />}
            label="Modo oscuro"
            right={<Toggle on={isDark} onToggle={toggleThemeLocal} />}
          />
          {/* Language */}
          <SettingsRow
            icon={<Globe size={18} />}
            label="Idioma"
            right={
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                color: 'var(--text-muted)', fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Español <ChevronRight size={14} />
              </div>
            }
            disabled
          />
          {/* Privacy */}
          <SettingsRow
            icon={<Shield size={18} />}
            label="Política de privacidad"
            right={<ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
            onClick={() => {}}
          />
          {/* Terms */}
          <SettingsRow
            icon={<AlertTriangle size={18} />}
            label="Términos de servicio"
            right={<ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* ─── 6. DANGER ZONE ─── */}
      <div style={{ ...section, borderColor: 'var(--peligro, #FF1744)', borderWidth: 1, borderStyle: 'solid' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--peligro, #FF1744)', fontFamily: "'Syne', sans-serif", marginBottom: 16 }}>
          Zona de peligro
        </h3>

        {/* Logout */}
        <button
          onClick={() => setLogoutModal(true)}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: 14,
            border: '1px solid var(--peligro, #FF1744)',
            background: 'transparent', color: 'var(--peligro, #FF1744)',
            fontWeight: 600, fontSize: 15, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <LogOut size={18} /> Cerrar sesión
        </button>

        {/* Delete account */}
        <button
          onClick={() => { setDeleteModal(true); setDeleteText(''); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--peligro, #FF1744)', fontSize: 13, marginTop: 12,
            opacity: 0.6, fontFamily: "'DM Sans', sans-serif",
            display: 'block', margin: '12px auto 0',
          }}
        >
          Eliminar cuenta
        </button>
      </div>

      {/* ─── LOGOUT MODAL ─── */}
      <AnimatePresence>
        {logoutModal && (
          <Modal onClose={() => setLogoutModal(false)}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,23,68,0.1)', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogOut size={24} style={{ color: 'var(--peligro, #FF1744)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                ¿Cerrar sesión?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                Se cerrará tu sesión actual.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button style={btnGhost} onClick={() => setLogoutModal(false)}>
                  Cancelar
                </button>
                <button
                  style={{
                    ...btnPrimary,
                    background: 'var(--peligro, #FF1744)',
                  }}
                  onClick={() => {
                    setLogoutModal(false);
                    onLogout();
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ─── DELETE ACCOUNT MODAL ─── */}
      <AnimatePresence>
        {deleteModal && (
          <Modal onClose={() => setDeleteModal(false)}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,23,68,0.1)', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={24} style={{ color: 'var(--peligro, #FF1744)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                Eliminar cuenta
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                Esta acción es irreversible. Se eliminarán todos tus datos.
              </p>
              <div style={{ textAlign: 'left', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Escribe <strong style={{ color: 'var(--peligro, #FF1744)' }}>ELIMINAR</strong> para confirmar
                </label>
                <input
                  style={inputStyle}
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="ELIMINAR"
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                <button style={btnGhost} onClick={() => setDeleteModal(false)}>
                  Cancelar
                </button>
                <button
                  style={{
                    ...btnPrimary,
                    background: deleteText === 'ELIMINAR' ? 'var(--peligro, #FF1744)' : 'var(--text-muted)',
                    cursor: deleteText === 'ELIMINAR' ? 'pointer' : 'not-allowed',
                    opacity: deleteText === 'ELIMINAR' ? 1 : 0.5,
                  }}
                  disabled={deleteText !== 'ELIMINAR'}
                  onClick={() => {
                    setDeleteModal(false);
                    onLogout();
                  }}
                >
                  <Trash2 size={14} /> Eliminar permanentemente
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: 'var(--bg-alt)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  right,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        border: 'none',
        background: 'transparent',
        width: '100%',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        borderBottom: '1px solid var(--border)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>
        <span style={{ fontSize: 14, color: disabled ? 'var(--text-muted)' : 'var(--text)' }}>{label}</span>
      </div>
      {right}
    </button>
  );
}
