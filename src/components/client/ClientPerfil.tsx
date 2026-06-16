'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Edit3, Save, X, Plus, Trash2,
  LogOut, Shield, Bell, Globe, ChevronRight, AlertTriangle,
  Star, Banknote, CreditCard, Copy, Home, Building, ShoppingBag, Package,
  Heart, ShoppingCart, Gift, Users,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useStore } from '@/lib/store';
import type { DireccionGuardada } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { useConfigStore } from '@/store/configStore';
import { TemaToggle } from '@/components/ui/TemaToggle';
import { SonidoToggle } from '@/components/ui/SonidoToggle';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */
interface ClientPerfilProps {
  /** Kept for backward-compat with the parent shell — theme is now owned by configStore. */
  isDark?: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'perfil') => void;
  onLogout: () => void;
  onOpenTracking?: (orderId: string) => void;
  onOpenChat?: (orderId: string) => void;
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
        width: 48,
        height: 26,
        borderRadius: 13,
        border: '1px solid var(--border)',
        background: on ? 'var(--primario)' : 'var(--text-muted, #999)',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.25s ease',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        padding: 0,
      }}
    >
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
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
      className="modal-overlay visible"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="lf-modal open"
        style={{
          background: 'var(--surface)',
          padding: 24, maxWidth: 400, width: '100%',
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
        borderRadius: 12,
        padding: '6px 10px',
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--text)',
        boxShadow: 'var(--lf-shadow-card)',
      }}
    >
      <span style={{ color: 'var(--primario)', fontWeight: 700 }}>{payload[0].value}</span>
      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>envios</span>
      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHARED CARD STYLE
   ═══════════════════════════════════════════════ */
const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 22px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 24,
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function ClientPerfil({ userName, onNavigate, onLogout }: ClientPerfilProps) {
  const {
    direccionesGuardadas,
    addDireccionGuardada,
    removeDireccionGuardada,
    direccionesSugerencias,
    orders,
    fidelizacion,
    referidos,
    calificaciones,
    canjearPuntos,
    setClientActiveModule,
  } = useStore();

  const {
    tiendas,
    productos,
    favoritosTiendas,
    favoritosProductos,
    toggleFavoritoTienda,
    toggleFavoritoProducto,
    addToCart,
  } = useMarketplaceStore();

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

  /* ─── Favorites tabs ─── */
  const [favTab, setFavTab] = useState<'tiendas' | 'productos'>('tiendas');

  /* ─── Settings state ─── */
  const [prefPayment, setPrefPayment] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [prefPaymentInited, setPrefPaymentInited] = useState(false);

  /* ─── Configuración global (configStore) ─── */
  const notificacionesPush = useConfigStore((s) => s.notificacionesPush);
  const toggleNotificacionesPush = useConfigStore((s) => s.toggleNotificacionesPush);
  const notificacionesEmail = useConfigStore((s) => s.notificacionesEmail);
  const toggleNotificacionesEmail = useConfigStore((s) => s.toggleNotificacionesEmail);
  const compartirUbicacion = useConfigStore((s) => s.compartirUbicacion);
  const toggleCompartirUbicacion = useConfigStore((s) => s.toggleCompartirUbicacion);

  /* ─── Modals ─── */
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  /* ─── Toast state ─── */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /* ─── Computed metrics ─── */
  const clientOrders = useMemo(
    () => orders.filter((o) => o.cliente === userName || o.cliente === 'Maria Lopez' || o.cliente === 'Maria Lopez'),
    [orders, userName],
  );

  const metrics = useMemo(() => {
    const total = clientOrders.length;
    const totalSpent = clientOrders.reduce((s, o) => s + o.monto, 0);
    const avg = total > 0 ? Math.round(totalSpent / total) : 0;
    const thisMonth = clientOrders.filter((o) => o.fecha.startsWith('2026-06')).length;
    const zoneCount: Record<string, number> = {};
    clientOrders.forEach((o) => {
      const zone = o.destino.split(',')[0].trim();
      zoneCount[zone] = (zoneCount[zone] || 0) + 1;
    });
    const topZone = Object.entries(zoneCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const payCount: Record<string, number> = {};
    clientOrders.forEach((o) => {
      payCount[o.metodoPago] = (payCount[o.metodoPago] || 0) + 1;
    });
    const topPayment = (Object.entries(payCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'efectivo') as 'efectivo' | 'transferencia';
    return { total, totalSpent, avg, thisMonth, topZone, topPayment };
  }, [clientOrders]);

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

  /* ─── Loyalty computations ─── */
  const nivelColor = useMemo(() => {
    switch (fidelizacion.nivel) {
      case 'bronce': return '#CD7F32';
      case 'plata': return '#C0C0C0';
      case 'oro': return '#FFD700';
      case 'platino': return '#E5E4E2';
      default: return '#CD7F32';
    }
  }, [fidelizacion.nivel]);

  const capitalizedNivel = fidelizacion.nivel.charAt(0).toUpperCase() + fidelizacion.nivel.slice(1);

  const { progressPercent, pointsToNext } = useMemo(() => {
    const thresholds = { bronce: 0, plata: 100, oro: 300, platino: 600 };
    const levelOrder: Array<'bronce' | 'plata' | 'oro' | 'platino'> = ['bronce', 'plata', 'oro', 'platino'];
    const currentIdx = levelOrder.indexOf(fidelizacion.nivel);
    const currentThreshold = thresholds[fidelizacion.nivel];
    const nextIdx = currentIdx + 1;
    if (nextIdx >= levelOrder.length) {
      return { progressPercent: 100, pointsToNext: 0 };
    }
    const nextLevel = levelOrder[nextIdx];
    const nextThreshold = thresholds[nextLevel];
    const range = nextThreshold - currentThreshold;
    const progress = fidelizacion.puntos - currentThreshold;
    const pct = Math.min(Math.max((progress / range) * 100, 0), 100);
    const remaining = Math.max(nextThreshold - fidelizacion.puntos, 0);
    return { progressPercent: pct, pointsToNext: remaining };
  }, [fidelizacion.nivel, fidelizacion.puntos]);

  const pillButtonStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 'var(--lf-pill-radius, 100px)',
    border: '1px solid var(--primario)',
    background: 'var(--primario-soft)',
    color: 'var(--primario)',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  };

  const handleCanjear = (puntos: number) => {
    const ok = canjearPuntos(puntos);
    if (ok) {
      setToast({ message: `Se canjearon ${puntos} puntos correctamente`, type: 'success' });
    } else {
      setToast({ message: 'No tienes suficientes puntos', type: 'error' });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referidos.codigo).then(() => {
      setToast({ message: 'Codigo copiado: ' + referidos.codigo, type: 'success' });
    }).catch(() => {
      setToast({ message: 'Codigo: ' + referidos.codigo, type: 'success' });
    });
  };

  const handleShare = () => {
    const shareData = {
      title: 'LOGIFAST - Envios en moto',
      text: `Unete a LOGIFAST con mi codigo ${referidos.codigo} y gana 20 puntos en tu primer envio!`,
      url: referidos.link,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share(shareData).catch(() => {
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => {
          setToast({ message: 'Enlace copiado al portapapeles', type: 'success' });
        });
      });
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => {
        setToast({ message: 'Enlace copiado al portapapeles', type: 'success' });
      }).catch(() => {
        setToast({ message: 'Codigo: ' + referidos.codigo + ' | Link: ' + referidos.link, type: 'success' });
      });
    }
  };

  /* ─── Favorite tiendas/productos computed ─── */
  const favoriteTiendas = useMemo(
    () => tiendas.filter(t => favoritosTiendas.some(f => f.tiendaId === t.id)),
    [tiendas, favoritosTiendas]
  );

  const favoriteProductos = useMemo(
    () => productos.filter(p => favoritosProductos.some(f => f.productoId === p.id)),
    [productos, favoritosProductos]
  );

  /* ─── Styles ─── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
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
    gap: 6,
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, margin: '0 auto', padding: '0 4px' }}>

      {/* ═══════════════════════════════════════════
          HEADER: Avatar + Name + Email
          ═══════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 8 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--primario-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primario)',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            flexShrink: 0,
            border: '3px solid var(--primario)',
          }}
        >
          {initials}
        </div>
        <div style={{ textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            {!editing ? (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>
                  {userName}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
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
                    marginTop: 14,
                    padding: '8px 18px',
                    color: 'var(--primario)',
                    borderColor: 'var(--primario)',
                    fontSize: 13,
                  }}
                >
                  <Edit3 size={14} /> Editar perfil
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8, textAlign: 'left' }}
              >
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} /> Nombre
                  </label>
                  <input className="lf-input" style={inputStyle} value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={12} /> Correo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input className="lf-input" style={{ ...inputStyle, paddingRight: 36, opacity: 0.6 }} value={email} disabled />
                    <Shield size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} /> Telefono
                  </label>
                  <input className="lf-input" style={inputStyle} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> Direccion principal
                  </label>
                  <input
                    className="lf-input"
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
                            onClick={() => { setEditAddress(s); setShowAddressSugg(false); }}
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
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button style={btnGhost} onClick={() => setEditing(false)}>
                    <X size={15} /> Cancelar
                  </button>
                  <button style={btnPrimary} onClick={() => setEditing(false)}>
                    <Save size={15} /> Guardar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          1. PUNTOS LOGIFAST
          ═══════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: nivelColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={24} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: 'var(--primario)', lineHeight: 1.1 }}>
                {fidelizacion.puntos}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>puntos</span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: 'var(--lf-pill-radius, 100px)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                background: `${nivelColor}20`,
                color: nivelColor,
                marginTop: 4,
              }}
            >
              Nivel {capitalizedNivel}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-alt)', overflow: 'hidden', marginBottom: 6 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 4,
              background: 'linear-gradient(90deg, var(--primario), var(--primario-hover))',
            }}
          />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
          {pointsToNext} puntos para {fidelizacion.nivel === 'bronce' ? 'Plata' : fidelizacion.nivel === 'plata' ? 'Oro' : 'Platino'}
        </div>

        {/* Canjear puntos */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => handleCanjear(100)} disabled={fidelizacion.puntos < 100}
            style={{ ...pillButtonStyle, opacity: fidelizacion.puntos < 100 ? 0.5 : 1 }}>
            100 pts = C$20
          </button>
          <button onClick={() => handleCanjear(200)} disabled={fidelizacion.puntos < 200}
            style={{ ...pillButtonStyle, opacity: fidelizacion.puntos < 200 ? 0.5 : 1 }}>
            200 pts = C$50
          </button>
          <button onClick={() => handleCanjear(500)} disabled={fidelizacion.puntos < 500}
            style={{ ...pillButtonStyle, opacity: fidelizacion.puntos < 500 ? 0.5 : 1 }}>
            500 pts = Envio gratis
          </button>
          <button
            onClick={() => setClientActiveModule('puntos')}
            style={{
              ...pillButtonStyle,
              background: 'var(--primario)',
              color: '#FFFFFF',
              border: 'none',
            }}
          >
            Ver recompensas
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          2. METRICAS
          ═══════════════════════════════════════════ */}
      <div style={sectionCard}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 16 }}>
          Metricas
        </h3>

        {/* 3 stats in row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { value: String(metrics.total), label: 'Envios totales' },
            { value: `C$${metrics.totalSpent.toLocaleString()}`, label: 'Gastados' },
            { value: String(metrics.thisMonth), label: 'Este mes' },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 14, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
                {m.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ height: 120, marginBottom: 0, minWidth: 0, minHeight: 120 }}>
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--primario-soft)' }} />
              <Bar dataKey="envios" fill="var(--primario)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          3. DIRECCIONES GUARDADAS
          ═══════════════════════════════════════════ */}
      <div style={sectionCard}>
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
          {direccionesGuardadas.map((d) => {
            const Icon = d.etiqueta === 'Casa' ? Home : d.etiqueta === 'Trabajo' ? Building : MapPin;
            return (
              <div
                key={d.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14,
                  background: 'var(--bg-alt)', border: '1px solid var(--border)',
                }}
              >
                <Icon size={18} style={{ color: 'var(--primario)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {d.etiqueta}
                  </span>
                  <div style={{ fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.direccion}
                  </div>
                </div>
                <button
                  onClick={() => removeDireccionGuardada(d.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--text-muted)' }}
                  title="Eliminar"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
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
                <div style={{ position: 'relative' }}>
                  <input
                    className="lf-input"
                    style={inputStyle}
                    placeholder="Buscar direccion..."
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
                            onClick={() => { setNewAddr(s); setShowNewAddrSugg(false); }}
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
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Casa', 'Trabajo', 'Otro'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      onClick={() => setNewAddrLabel(lbl)}
                      style={{
                        padding: '6px 14px', borderRadius: 10,
                        border: '1px solid',
                        borderColor: newAddrLabel === lbl ? 'var(--primario)' : 'var(--border)',
                        background: newAddrLabel === lbl ? 'var(--primario-soft)' : 'transparent',
                        color: newAddrLabel === lbl ? 'var(--primario)' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button style={{ ...btnGhost, padding: '8px 14px' }} onClick={() => { setAddingAddr(false); setNewAddr(''); }}>
                    Cancelar
                  </button>
                  <button style={{ ...btnPrimary, padding: '8px 14px' }} onClick={handleAddAddress} disabled={!newAddr.trim()}>
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════
          4. FAVORITOS
          ═══════════════════════════════════════════ */}
      <div style={sectionCard}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 16 }}>
          Favoritos
        </h3>

        {/* Tabs: Tiendas / Productos with sliding underline */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {(['tiendas', 'productos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFavTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'transparent',
                  color: favTab === tab ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 14,
                  fontWeight: favTab === tab ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif",
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'color 0.2s ease',
                }}
              >
                {tab === 'tiendas' ? <ShoppingBag size={14} /> : <Package size={14} />}
                {tab === 'tiendas' ? 'Tiendas' : 'Productos'}
                {favTab === tab && (
                  <motion.div
                    layoutId="fav-tab-underline"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '25%',
                      right: '25%',
                      height: 3,
                      borderRadius: 2,
                      background: 'var(--primario)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--border)', zIndex: -1 }} />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {favTab === 'tiendas' && (
            <motion.div
              key="tiendas"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {favoriteTiendas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                  <Heart size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <p>No tienes tiendas favoritas</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {favoriteTiendas.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px',
                        borderRadius: 14,
                        background: 'var(--bg-alt)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: t.logoColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11 }}>
                          {t.logoIniciales}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.nombre}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {favTab === 'productos' && (
            <motion.div
              key="productos"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {favoriteProductos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                  <Heart size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <p>No tienes productos favoritos</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {favoriteProductos.map((p) => {
                    const tienda = tiendas.find(t => t.id === p.tiendaId);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 14,
                          background: 'var(--bg-alt)', border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: p.imagenColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Package size={16} style={{ color: '#fff' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.nombre}
                          </div>
                          <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)', fontWeight: 600 }}>
                            C$ {p.precio}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (tienda) addToCart(p, tienda);
                            setToast({ message: `${p.nombre} agregado al carrito`, type: 'success' });
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 10,
                            border: '1px solid var(--primario)',
                            background: 'var(--primario-soft)',
                            color: 'var(--primario)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          <ShoppingCart size={12} />
                          Agregar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════
          5. REFERIDOS
          ═══════════════════════════════════════════ */}
      <div
        style={{
          padding: 24,
          borderRadius: 'var(--lf-card-radius, 22px)',
          background: 'linear-gradient(135deg, var(--primario), #FF8A65)',
          color: '#FFFFFF',
          boxShadow: 'var(--shadow-primario)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Gift size={20} />
          <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
            Invita amigos, gana puntos
          </span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 18, lineHeight: 1.5 }}>
          Tu amigo recibe 20 puntos en su primer envio. Tu ganas 50 puntos por cada referido.
        </div>

        {/* Referral code */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 14,
            padding: '10px 14px',
            marginBottom: 14,
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, letterSpacing: '2px', flex: 1 }}>
            {referidos.codigo}
          </span>
          <button
            onClick={handleCopyCode}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Copy size={14} /> Copiar
          </button>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--lf-button-radius, 16px)',
            border: 'none',
            background: '#FFFFFF',
            color: 'var(--primario)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Users size={16} /> Compartir
        </button>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700 }}>{referidos.referidos.length}</div>
            <div style={{ fontSize: 11, opacity: 0.8, fontFamily: "'DM Sans', sans-serif" }}>Invitados</div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700 }}>
              {referidos.referidos.filter(r => r.primerEnvio).length}
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, fontFamily: "'DM Sans', sans-serif" }}>Registrados</div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700 }}>{referidos.puntosGanados}</div>
            <div style={{ fontSize: 11, opacity: 0.8, fontFamily: "'DM Sans', sans-serif" }}>Pts ganados</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          6. CALIFICACIONES
          ═══════════════════════════════════════════ */}
      <div style={sectionCard}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 16 }}>
          Calificaciones
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
          {calificaciones.map(cal => (
            <div
              key={cal.id}
              style={{
                padding: '14px 16px',
                background: 'var(--bg-alt)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{cal.repartidorNombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  {cal.fecha}
                </div>
                {cal.comentario && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    {cal.comentario}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, marginLeft: 12 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={i < cal.estrellas ? 'var(--primario)' : 'none'} color={i < cal.estrellas ? 'var(--primario)' : 'var(--border)'} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          7. CONFIGURACION
          ═══════════════════════════════════════════ */}
      <div style={sectionCard}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 16 }}>
          Configuracion
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Notificaciones push — wired to configStore */}
          <SettingsRow
            icon={<Bell size={18} />}
            label="Notificaciones push"
            right={<Toggle on={notificacionesPush} onToggle={() => toggleNotificacionesPush()} />}
          />
          {/* Notificaciones por email — wired to configStore */}
          <SettingsRow
            icon={<Mail size={18} />}
            label="Notificaciones por email"
            right={<Toggle on={notificacionesEmail} onToggle={() => toggleNotificacionesEmail()} />}
          />
          {/* Compartir ubicación — wired to configStore */}
          <SettingsRow
            icon={<MapPin size={18} />}
            label="Compartir ubicación"
            right={<Toggle on={compartirUbicacion} onToggle={() => toggleCompartirUbicacion()} />}
          />
          {/* Metodo de pago preferido */}
          <SettingsRow
            icon={prefPayment === 'efectivo' ? <Banknote size={18} /> : <CreditCard size={18} />}
            label="Pago preferido"
            right={
              <button
                onClick={() => setPrefPayment((p) => (p === 'efectivo' ? 'transferencia' : 'efectivo'))}
                style={{
                  padding: '4px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {prefPayment === 'efectivo' ? 'Efectivo' : 'Transferencia'} <ChevronRight size={14} />
              </button>
            }
          />
          {/* Idioma */}
          <SettingsRow
            icon={<Globe size={18} />}
            label="Idioma"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                Espanol <ChevronRight size={14} />
              </div>
            }
            disabled
          />
          {/* Privacidad */}
          <SettingsRow
            icon={<Shield size={18} />}
            label="Politica de privacidad"
            right={<ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
            onClick={() => {}}
          />
          {/* Centro de ayuda */}
          <SettingsRow
            icon={<AlertTriangle size={18} />}
            label="Centro de ayuda"
            right={<ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
            onClick={() => setClientActiveModule('ayuda')}
          />
        </div>

        {/* Tema — 3-state segmented control wired to configStore */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            Tema
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
            Claro, oscuro o seguir al sistema
          </div>
          <TemaToggle />
        </div>

        {/* Sonido — toggle + volume slider + test button wired to configStore */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
            Sonido
          </div>
          <SonidoToggle />
        </div>

        {/* Cerrar sesion */}
        <button
          onClick={() => setLogoutModal(true)}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 'var(--lf-button-radius, 16px)',
            border: '1px solid var(--peligro)',
            background: 'transparent',
            color: 'var(--peligro)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 16,
          }}
        >
          <LogOut size={18} /> Cerrar sesion
        </button>

        {/* Eliminar cuenta */}
        <button
          onClick={() => { setDeleteModal(true); setDeleteText(''); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--peligro)',
            fontSize: 12,
            marginTop: 12,
            opacity: 0.6,
            fontFamily: "'DM Sans', sans-serif",
            display: 'block',
            margin: '12px auto 0',
          }}
        >
          Eliminar cuenta
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          LOGOUT MODAL
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {logoutModal && (
          <Modal onClose={() => setLogoutModal(false)}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,23,68,0.1)', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogOut size={24} style={{ color: 'var(--peligro)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                Cerrar sesion?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
                Se cerrara tu sesion actual.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button style={btnGhost} onClick={() => setLogoutModal(false)}>
                  Cancelar
                </button>
                <button
                  style={{ ...btnPrimary, background: 'var(--peligro)' }}
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

      {/* ═══════════════════════════════════════════
          DELETE ACCOUNT MODAL
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteModal && (
          <Modal onClose={() => setDeleteModal(false)}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,23,68,0.1)', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={24} style={{ color: 'var(--peligro)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                Eliminar cuenta
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
                Esta accion es irreversible. Se eliminaran todos tus datos.
              </p>
              <div style={{ textAlign: 'left', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontFamily: "'DM Sans', sans-serif" }}>
                  Escribe <strong style={{ color: 'var(--peligro)' }}>ELIMINAR</strong> para confirmar
                </label>
                <input className="lf-input" style={inputStyle} value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="ELIMINAR" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                <button style={btnGhost} onClick={() => setDeleteModal(false)}>
                  Cancelar
                </button>
                <button
                  style={{
                    ...btnPrimary,
                    background: deleteText === 'ELIMINAR' ? 'var(--peligro)' : 'var(--text-muted)',
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

      {/* ═══════════════════════════════════════════
          TOAST NOTIFICATION
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 100,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              borderRadius: 14,
              background: toast.type === 'success' ? 'var(--exito)' : 'var(--peligro)',
              color: '#fff',
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              zIndex: 9999,
              boxShadow: 'var(--shadow-lg)',
              maxWidth: '90vw',
              textAlign: 'center',
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SETTINGS ROW
   ═══════════════════════════════════════════════ */
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
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0',
        border: 'none',
        background: 'transparent',
        width: '100%',
        cursor: disabled ? 'default' : onClick ? 'pointer' : 'default',
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
    </div>
  );
}
