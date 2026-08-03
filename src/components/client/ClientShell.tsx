'use client';

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  Package,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  Settings,
  CheckCircle,
  AlertTriangle,
  Bike,
  Tag,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from '@/components/icons';
import { useStore, type ClientModuleKey } from '@/lib/store';
import type { ClientNotificacion } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { LogoSpinner } from '@/components/ui/loaders';

/* ═══════════════════════════════════════════════
   SKELETON COMPONENT (PLACEHOLDER)
   ═══════════════════════════════════════════════ */
function MobileModuleSkeleton() {
  return (
    <div className="w-full space-y-4 p-4 animate-pulse">
      {/* Banner Skeleton */}
      <div className="w-full h-44 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
      
      {/* Categories Grid Skeleton */}
      <div className="grid grid-cols-4 gap-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
            <div className="w-10 h-3 bg-slate-200 dark:bg-slate-800/60 rounded-full" />
          </div>
        ))}
      </div>

      {/* Cards List Skeleton */}
      <div className="space-y-3 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 bg-slate-200 dark:bg-slate-800/40 rounded-2xl flex items-center space-x-3">
            <div className="w-12 h-12 bg-slate-300 dark:bg-slate-700/60 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-slate-300 dark:bg-slate-700/60 rounded-full" />
              <div className="w-1/2 h-3 bg-slate-300 dark:bg-slate-700/60 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DYNAMIC MODULE IMPORTS WITH ELEGANT SKELETON
   ═══════════════════════════════════════════════ */
const ClientInicio = dynamic(() => import('./ClientInicio'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientSolicitar = dynamic(() => import('./ClientSolicitar'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientEnvios = dynamic(() => import('./ClientEnvios'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientPerfil = dynamic(() => import('./ClientPerfil'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientTracking = dynamic(() => import('./ClientTracking'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientChat = dynamic(() => import('./ClientChat'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientRating = dynamic(() => import('./ClientRating'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientExplorar = dynamic(() => import('./ClientExplorar'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientTienda = dynamic(() => import('./ClientTienda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientCarrito = dynamic(() => import('./ClientCarrito'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientPedidos = dynamic(() => import('./ClientPedidos'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientBusqueda = dynamic(() => import('./ClientBusqueda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientAyuda = dynamic(() => import('./ClientAyuda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientPuntos = dynamic(() => import('./ClientPuntos'), { ssr: false, loading: () => <MobileModuleSkeleton /> });
const ClientMiTienda = dynamic(() => import('./ClientMiTienda'), { ssr: false, loading: () => <MobileModuleSkeleton /> });

/* ═══════════════════════════════════════════════
   SNACKBAR CONTEXT
   ═══════════════════════════════════════════════ */
interface SnackbarData {
  message: string;
  action?: string;
  onAction?: () => void;
}

const SnackbarContext = createContext<(data: SnackbarData | null) => void>(() => {});
export function useSnackbar() {
  return useContext(SnackbarContext);
}

/* ═══════════════════════════════════════════════
   PROPS INTERFACE
   ═══════════════════════════════════════════════ */
interface ClientShellProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  userName: string;
}

/* ═══════════════════════════════════════════════
   HELPERS & ICON UTILS
   ═══════════════════════════════════════════════ */
function getInitials(name: string): string {
  const parts = (name || 'Usuario').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

function SignalIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 16 12" fill="currentColor">
      <rect x="0" y="9" width="3" height="3" rx="0.5" />
      <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
      <rect x="9" y="3" width="3" height="9" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.4" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 16 12" fill="currentColor">
      <circle cx="8" cy="9" r="1.5" />
      <path d="M4.93 6.47a4.36 4.36 0 016.14 0" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M2.1 3.64a7.8 7.8 0 0111.8 0" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="currentColor">
      <rect x="0" y="0.5" width="19" height="11" rx="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <rect x="1.5" y="2" width="14" height="8" rx="1" />
      <rect x="19.5" y="3.5" width="2" height="5" rx="0.8" opacity="0.4" />
    </svg>
  );
}

function getNotifIcon(tipo: ClientNotificacion['tipo']): { icon: React.ReactNode; color: string } {
  switch (tipo) {
    case 'orden_confirmada': return { icon: <CheckCircle size={18} />, color: '#00C853' };
    case 'repartidor_asignado': return { icon: <User size={18} />, color: '#2979FF' };
    case 'repartidor_camino': return { icon: <Bike size={18} />, color: '#FF9800' };
    case 'paquete_recogido': return { icon: <Package size={18} />, color: '#2979FF' };
    case 'entrega_exitosa': return { icon: <CheckCircle size={20} />, color: '#00C853' };
    case 'incidencia': return { icon: <AlertTriangle size={18} />, color: '#FF1744' };
    case 'codigo_nuevo': return { icon: <Tag size={18} />, color: '#FF9800' };
    case 'te_extranamos': return { icon: <Heart size={18} />, color: '#E91E63' };
    default: return { icon: <Bell size={18} />, color: '#FF5722' };
  }
}

/* ═══════════════════════════════════════════════
   NAV CONFIG — iOS native tab bar (5 items)
   🏠 Inicio | 📦 Envíos | 🛒 Pedidos | 💳 Billetera | 👤 Perfil
   ═══════════════════════════════════════════════ */
interface NavItem {
  key: ClientModuleKey;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'inicio', label: 'Inicio', icon: <Home size={24} strokeWidth={1.8} /> },
  { key: 'envios', label: 'Envíos', icon: <Package size={24} strokeWidth={1.8} /> },
  { key: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={24} strokeWidth={1.8} /> },
  { key: 'puntos', label: 'Billetera', icon: <Wallet size={24} strokeWidth={1.8} /> },
  { key: 'perfil', label: 'Perfil', icon: <User size={24} strokeWidth={1.8} /> },
];

/* ─── iOS Large Title map (header) ─── */
const IOS_TITLE_MAP: Record<ClientModuleKey, string> = {
  inicio: 'Inicio',
  solicitar: 'Nuevo Envío',
  envios: 'Mis Envíos',
  explorar: 'Explorar',
  pedidos: 'Mis Pedidos',
  perfil: 'Perfil',
  ayuda: 'Ayuda',
  puntos: 'Billetera',
  tienda: 'Mi Tienda',
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientShell({ isDark, toggleTheme, onLogout, userName }: ClientShellProps) {
  const {
    clientActiveModule,
    clientModuleFade,
    setClientActiveModule,
    clientNotificaciones,
    clientNotifOpen,
    setClientNotifOpen,
    markClientNotifRead,
    markAllClientNotifRead,
    trackingOrderId,
    chatOpen,
    ratingModalOpen,
    setTrackingOrder,
    setChatOpen,
    setChatOrderId,
    setRatingModalOpen,
    setRatingOrderId,
    fetchOrders,
    orders,
  } = useStore();

  const { tiendaSeleccionada, carritoOpen, setCarritoOpen, setTiendaSeleccionada, getCartItemCount, fetchTiendas, fetchOrdenesCompra, fetchFavoritos, fetchCarrito, ordenesCompra } = useMarketplaceStore();

  /* ─── Sync Dynamic URL Hash ─── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = `#/cliente/${clientActiveModule}`;
    }
  }, [clientActiveModule]);

  /* ─── Cargar datos del backend al montar (P1: persistencia BD) ─── */
  useEffect(() => {
    fetchTiendas();
    fetchOrdenesCompra();
    fetchFavoritos();
    fetchCarrito();
    fetchOrders(); // P1: cargar envíos del cliente desde la BD (sobrevive F5)
  }, [fetchTiendas, fetchOrdenesCompra, fetchFavoritos, fetchCarrito, fetchOrders]);

  /* ─── SPLASH STATE ─── */
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  /* ─── SNACKBAR STATE ─── */
  const [snackbar, setSnackbar] = useState<SnackbarData | null>(null);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = clientNotificaciones.filter((n) => !n.leida).length;
  const initials = getInitials(userName);

  /* ─── Active orders count for Pedidos badge (envíos + compras no entregadas) ─── */
  const activeOrdersCount =
    orders.filter((o) => !['entregado', 'incidencia'].includes(o.estado)).length +
    ordenesCompra.filter((o) => o.estado !== 'entregado').length;

  /* ─── iOS Large Title for current module ─── */
  const iosTitle = IOS_TITLE_MAP[clientActiveModule] || 'Logifast';

  /* ─── SPLASH TIMER ─── */
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 1500);
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  /* ─── SNACKBAR AUTO-DISMISS ─── */
  const showSnackbar = useCallback((data: SnackbarData | null) => {
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
    setSnackbar(data);
    if (data) {
      snackbarTimerRef.current = setTimeout(() => {
        setSnackbar(null);
      }, 4000);
    }
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setClientNotifOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setClientNotifOpen]);

  /* Close dropdowns on escape */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setClientNotifOpen(false);
        setAvatarOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [setClientNotifOpen]);

  const handleNav = useCallback(
    (mod: ClientModuleKey) => {
      setClientActiveModule(mod);
      setTrackingOrder(null);
      if (mod !== 'explorar') {
        setTiendaSeleccionada(null);
      }
      // Haptic feedback on nav tap
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(20); } catch { /* ignore */ }
      }
    },
    [setClientActiveModule, setTrackingOrder, setTiendaSeleccionada]
  );

  const handleOpenTracking = useCallback(
    (orderId: string) => {
      setTrackingOrder(orderId);
    },
    [setTrackingOrder]
  );

  const handleCloseTracking = useCallback(
    () => setTrackingOrder(null),
    [setTrackingOrder]
  );

  const handleOpenChat = useCallback(
    (orderId: string) => {
      setChatOrderId(orderId);
      setChatOpen(true);
    },
    [setChatOrderId, setChatOpen]
  );

  const handleOpenRating = useCallback(
    (orderId: string) => {
      setRatingOrderId(orderId);
      setRatingModalOpen(true);
    },
    [setRatingOrderId, setRatingModalOpen]
  );

  const renderModule = () => {
    const moduleProps = { isDark, userName, onNavigate: handleNav, onOpenTracking: handleOpenTracking, onOpenChat: handleOpenChat };
    const perfilProps = { ...moduleProps, onLogout };
    switch (clientActiveModule) {
      case 'inicio':
        return <ClientInicio {...moduleProps} />;
      case 'solicitar':
        return <ClientSolicitar {...moduleProps} />;
      case 'explorar':
        return <ClientExplorar {...moduleProps} />;
      case 'envios':
        return <ClientEnvios {...moduleProps} />;
      case 'pedidos':
        return <ClientPedidos {...moduleProps} />;
      case 'perfil':
        return <ClientPerfil {...perfilProps} />;
      case 'tienda':
        return <ClientMiTienda />;
      case 'ayuda':
        return <ClientAyuda isDark={isDark} onClose={() => setClientActiveModule('perfil')} />;
      case 'puntos':
        return <ClientPuntos isDark={isDark} onClose={() => setClientActiveModule('perfil')} />;
      default:
        return <ClientInicio {...moduleProps} />;
    }
  };

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      <div
        className="cliente-app lf-ios-app"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--ios-bg)',
          color: 'var(--ios-text-primary)',
          fontFamily: 'var(--ios-font)',
          transition: 'background-color 0.4s ease, color 0.3s ease',
        }}
      >
        {/* ═══════ SPLASH SCREEN — iOS native ═══════ */}
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: splashFading ? 0 : 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="lf-ios-splash"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'var(--ios-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              style={{
                width: 76,
                height: 76,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #FF5722, #FF8A65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 12px 36px rgba(255, 87, 34, 0.28)',
              }}
            >
              <Bike size={34} />
            </motion.div>
            {/* Brand text */}
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.2, 0, 0, 1] }}
              style={{
                fontFamily: 'var(--ios-font)',
                fontWeight: 700,
                fontSize: 22,
                color: 'var(--ios-text-primary)',
                marginTop: 20,
                letterSpacing: '-0.02em',
              }}
            >
              LOGIFAST
            </motion.span>
          </motion.div>
        )}

        {/* ═══════ NATIVE STATUS BAR (mobile) ═══════ */}
        <div
          className="lf-status-bar"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'max(24px, env(safe-area-inset-top, 24px))',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: 'transparent',
            pointerEvents: 'none',
          }}
        >
          {/* Left: Time */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--md-on-surface)',
              lineHeight: 1,
            }}
          >
            9:41
          </span>
          {/* Right: Signal + Wifi + Battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--md-on-surface)' }}>
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* ═══════ ANDROID GESTURE BAR (mobile) ═══════ */}
        <div
          className="lf-gesture-bar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'max(20px, env(safe-area-inset-bottom, 20px))',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 120,
              height: 3,
              borderRadius: 2,
              background: 'var(--md-on-surface-variant)',
              opacity: 0.3,
            }}
          />
        </div>

        {/* ─── HEADER — iOS native large title ─── */}
        <header
          className="lf-ios-header lf-header-bar"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            background: 'color-mix(in srgb, var(--ios-bg-elevated) 88%, transparent)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderBottom: '0.5px solid var(--ios-separator)',
            transition: 'background-color 0.3s ease, border-color 0.3s ease',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
          }}
        >
          {/* Top row: right-aligned action buttons (theme + bell + cart + avatar) */}
          <div
            className="lf-ios-header-actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 4,
              padding: '2px 8px 4px',
              minHeight: 36,
            }}
          >
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: 'var(--ios-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--ios-bg-secondary)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--ios-text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--ios-text-secondary)';
              }}
            >
              {isDark ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
            </button>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setClientNotifOpen(!clientNotifOpen);
                  setAvatarOpen(false);
                }}
                aria-label="Notificaciones"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: clientNotifOpen
                    ? 'color-mix(in srgb, var(--ios-blue) 12%, transparent)'
                    : 'transparent',
                  color: clientNotifOpen ? 'var(--ios-blue)' : 'var(--ios-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease, background 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!clientNotifOpen) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--ios-bg-secondary)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--ios-text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!clientNotifOpen) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--ios-text-secondary)';
                  }
                }}
              >
                <Bell size={20} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'var(--peligro)',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {clientNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      position: 'fixed',
                      top: 'max(56px, env(safe-area-inset-top))',
                      right: 'max(8px, env(safe-area-inset-right))',
                      left: 'max(8px, env(safe-area-inset-left))',
                      width: 'auto',
                      maxWidth: 360,
                      maxHeight: 'min(70vh, 460px)',
                      borderRadius: 16,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      zIndex: 60,
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 700,
                          fontSize: 15,
                          color: 'var(--text)',
                        }}
                      >
                        Notificaciones
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllClientNotifRead()}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--primario)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            padding: '4px 8px',
                            borderRadius: 6,
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              'var(--primario-soft)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          }}
                        >
                          Marcar todo como leído
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        maxHeight: 360,
                      }}
                    >
                      {clientNotificaciones.slice(0, 10).map((notif) => {
                        const { icon, color } = getNotifIcon(notif.tipo);
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markClientNotifRead(notif.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              padding: '12px 16px',
                              cursor: 'pointer',
                              background: !notif.leida
                                ? 'color-mix(in srgb, var(--info) 5%, transparent)'
                                : 'transparent',
                              borderLeft: !notif.leida
                                ? '3px solid var(--info)'
                                : '3px solid transparent',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLDivElement).style.background =
                                'color-mix(in srgb, var(--text-muted) 5%, transparent)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLDivElement).style.background = !notif.leida
                                ? 'color-mix(in srgb, var(--info) 5%, transparent)'
                                : 'transparent';
                            }}
                          >
                            <div
                              style={{
                                flexShrink: 0,
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: color,
                              }}
                            >
                              {icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: 'var(--text)',
                                  lineHeight: 1.3,
                                  marginBottom: 2,
                                }}
                              >
                                {notif.titulo}
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: 'var(--text-muted)',
                                  lineHeight: 1.4,
                                }}
                              >
                                {notif.descripcion}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-muted)',
                                  marginTop: 4,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  opacity: 0.7,
                                }}
                              >
                                {relativeTime(notif.timestamp)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {clientNotificaciones.length === 0 && (
                        <div
                          style={{
                            padding: 32,
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: 14,
                          }}
                        >
                          No hay notificaciones
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {clientNotificaciones.length > 0 && (
                      <div
                        style={{
                          borderTop: '1px solid var(--border)',
                          padding: '10px 16px',
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          onClick={() => {
                            clientNotificaciones.forEach((n) => markClientNotifRead(n.id));
                            setClientNotifOpen(false);
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                            padding: '4px 8px',
                            borderRadius: 6,
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                          }}
                        >
                          Limpiar todo
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart (always visible — iOS) */}
            <button
              onClick={() => setCarritoOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                background: carritoOpen ? 'color-mix(in srgb, var(--ios-blue) 12%, transparent)' : 'transparent',
                color: carritoOpen ? 'var(--ios-blue)' : 'var(--ios-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'color 0.2s ease, background 0.2s ease',
              }}
              aria-label="Carrito"
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              {getCartItemCount() > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    padding: '0 4px',
                    background: 'var(--ios-red)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--ios-font-mono)',
                    lineHeight: 1,
                  }}
                >
                  {getCartItemCount() > 9 ? '9+' : getCartItemCount()}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div ref={avatarRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setAvatarOpen(!avatarOpen);
                  setClientNotifOpen(false);
                }}
                aria-label="Menú de usuario"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'color-mix(in srgb, var(--ios-blue) 12%, transparent)',
                  color: 'var(--ios-blue)',
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: 'var(--ios-font)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'box-shadow 0.2s ease',
                  boxShadow: avatarOpen ? '0 0 0 2px var(--ios-blue)' : 'none',
                }}
              >
                {initials}
              </button>

              {/* Avatar Dropdown */}
              <AnimatePresence>
                {avatarOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      top: 46,
                      right: 0,
                      width: 220,
                      borderRadius: 'var(--ios-radius-md)',
                      background: 'var(--ios-bg-elevated)',
                      border: '0.5px solid var(--ios-separator)',
                      boxShadow: 'var(--ios-shadow-lg)',
                      overflow: 'hidden',
                      zIndex: 60,
                    }}
                  >
                    {/* User info */}
                    <div
                      style={{
                        padding: '14px 16px',
                        borderBottom: '0.5px solid var(--ios-separator)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--ios-text-primary)',
                          lineHeight: 1.3,
                          fontFamily: 'var(--ios-font)',
                        }}
                      >
                        {userName}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--ios-text-tertiary)',
                          marginTop: 2,
                          fontFamily: 'var(--ios-font)',
                        }}
                      >
                        Cliente
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px 6px' }}>
                      <button
                        onClick={() => {
                          handleNav('perfil');
                          setAvatarOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          border: 'none',
                          borderRadius: 'var(--ios-radius-sm)',
                          background: 'transparent',
                          color: 'var(--ios-text-primary)',
                          fontSize: 15,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'var(--ios-font)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--ios-bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        <User size={16} strokeWidth={1.8} style={{ color: 'var(--ios-text-tertiary)' }} />
                        Mi perfil
                      </button>

                      <button
                        onClick={() => setAvatarOpen(false)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          border: 'none',
                          borderRadius: 'var(--ios-radius-sm)',
                          background: 'transparent',
                          color: 'var(--ios-text-primary)',
                          fontSize: 15,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'var(--ios-font)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--ios-bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        <Settings size={16} strokeWidth={1.8} style={{ color: 'var(--ios-text-tertiary)' }} />
                        Configuración
                      </button>

                      <div
                        style={{
                          height: 0.5,
                          background: 'var(--ios-separator)',
                          margin: '4px 0',
                        }}
                      />

                      <button
                        onClick={() => {
                          setAvatarOpen(false);
                          onLogout();
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          border: 'none',
                          borderRadius: 'var(--ios-radius-sm)',
                          background: 'transparent',
                          color: 'var(--ios-red)',
                          fontSize: 15,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'var(--ios-font)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            'color-mix(in srgb, var(--ios-red) 8%, transparent)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        <LogOut size={16} strokeWidth={1.8} />
                        Cerrar sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* iOS Large Title — 34px, font-weight 700 */}
          <div
            className="lf-ios-large-title-wrap"
            style={{
              padding: '6px 16px 10px',
              maxWidth: 960,
              margin: '0 auto',
              width: '100%',
            }}
          >
            <motion.h1
              key={iosTitle}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                fontFamily: 'var(--ios-font)',
                fontSize: 34,
                fontWeight: 700,
                color: 'var(--ios-text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {iosTitle}
            </motion.h1>
          </div>
        </header>

        {/* ─── CONTENT AREA ─── */}
        <main
          style={{
            flex: 1,
            paddingTop: 'calc(96px + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(var(--ios-tabbar-height) + var(--ios-tabbar-safe) + 16px)',
            minHeight: '100vh',
            backgroundColor: 'var(--ios-bg)',
            transition: 'padding 0.3s ease, background-color 0.3s ease',
          }}
          className="lf-client-content-padded lf-ios-content"
        >
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto',
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 20,
              paddingBottom: 20,
            }}
            className="lf-client-inner-pad"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={clientActiveModule}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: clientModuleFade ? 0 : 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="lf-ios-screen-transition"
              >
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* ═══════ NAVBAR FLOTANTE ESTILO LÍQUIDO (CLIENTE) ═══════ */}
        <nav
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            borderRadius: 100,
            background: 'color-mix(in srgb, var(--surface, #1E293B) 88%, transparent)',
            backdropFilter: 'saturate(200%) blur(24px)',
            WebkitBackdropFilter: 'saturate(200%) blur(24px)',
            border: '1px solid color-mix(in srgb, var(--primario) 25%, transparent)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35), 0 0 20px color-mix(in srgb, var(--primario) 15%, transparent)',
            maxWidth: 'calc(100vw - 32px)',
          }}
          aria-label="Navegación principal flotante"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = clientActiveModule === item.key;
            const showPedidosBadge = item.key === 'pedidos' && activeOrdersCount > 0;
            return (
              <motion.button
                key={item.key}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleNav(item.key)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isActive ? 6 : 0,
                  padding: isActive ? '8px 16px' : '8px 12px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-dm-sans, sans-serif)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="liquidActiveClient"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 100,
                      background: 'var(--primario, #0066FF)',
                      boxShadow: '0 4px 14px color-mix(in srgb, var(--primario) 50%, transparent)',
                      zIndex: -1,
                    }}
                  />
                )}

                <span style={{ position: 'relative', display: 'inline-flex', zIndex: 1 }}>
                  {item.icon}
                  {showPedidosBadge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -6,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        background: '#FF1744',
                        color: '#FFF',
                        fontSize: 9,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        border: '2px solid var(--surface, #1E293B)',
                      }}
                    >
                      {activeOrdersCount > 9 ? '9+' : activeOrdersCount}
                    </span>
                  )}
                </span>

                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      whiteSpace: 'nowrap',
                      zIndex: 1,
                    }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* ═══════ iOS SNACKBAR ═══════ */}
        <AnimatePresence>
          {snackbar && (
            <motion.div
              key="snackbar"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="lf-snackbar visible lf-ios-snackbar"
              style={{
                position: 'fixed',
                bottom: 'calc(var(--ios-tabbar-height) + var(--ios-tabbar-safe) + 12px)',
                left: 16,
                right: 16,
                zIndex: 9998,
                background: 'var(--ios-bg-secondary)',
                color: 'var(--ios-text-primary)',
                borderRadius: 'var(--ios-radius-md)',
                padding: '14px 16px',
                boxShadow: 'var(--ios-shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                fontFamily: 'var(--ios-font)',
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>{snackbar.message}</span>
              {snackbar.action && (
                <button
                  onClick={() => {
                    snackbar.onAction?.();
                    setSnackbar(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--ios-blue)',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--ios-font)',
                    padding: '4px 8px',
                    borderRadius: 'var(--ios-radius-sm)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {snackbar.action}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── FULL-SCREEN SUBPAGES (100% Pantalla Completa — No Bottom Sheets) ─── */}
        <AnimatePresence>
          {trackingOrderId && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9995,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Seguimiento de envío"
            >
              <ClientTracking
                isDark={isDark}
                onBack={handleCloseTracking}
                onOpenChat={handleOpenChat}
                onRate={handleOpenRating}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9996,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Chat con repartidor"
            >
              <ClientChat
                isDark={isDark}
                onClose={() => setChatOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ratingModalOpen && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9997,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Calificar servicio"
            >
              <ClientRating
                isDark={isDark}
                onClose={() => setRatingModalOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tienda Profile Full Page */}
        <AnimatePresence>
          {tiendaSeleccionada && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9990,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Detalle de tienda"
            >
              <ClientTienda
                isDark={isDark}
                tiendaId={tiendaSeleccionada}
                onBack={() => setTiendaSeleccionada(null)}
                onOpenCart={() => setCarritoOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Overlay (Full Screen Page) */}
        <AnimatePresence>
          {carritoOpen && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Carrito de compras"
            >
              <ClientCarrito
                isDark={isDark}
                onClose={() => setCarritoOpen(false)}
                onBackToTienda={() => setCarritoOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── RESPONSIVE STYLES (iOS native) ─── */}
        <style>{`
          /* ─── Status bar & gesture bar: mobile simulation only ─── */
          .lf-status-bar,
          .lf-gesture-bar {
            display: flex !important;
          }
          @media (min-width: 1024px) {
            .lf-status-bar,
            .lf-gesture-bar {
              display: none !important;
            }
          }
          @media (pointer: coarse) {
            .lf-status-bar,
            .lf-gesture-bar {
              display: none !important;
            }
          }

          /* iOS app container — solid iOS background, no theme flash */
          .lf-ios-app {
            background: var(--ios-bg) !important;
            color: var(--ios-text-primary) !important;
          }

          /* iOS tab bar — visible at ALL widths (single source of truth) */
          .lf-ios-tabbar.lf-client-bottom-nav {
            display: flex !important;
            -webkit-overflow-scrolling: touch;
          }

          /* Wider horizontal padding on desktop */
          @media (min-width: 1024px) {
            .lf-client-inner-pad {
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
            .lf-ios-large-title-wrap {
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
            /* Snackbar centered on desktop */
            .lf-snackbar,
            .lf-ios-snackbar {
              max-width: 480px;
              left: 50% !important;
              right: auto !important;
              transform: translateX(-50%);
            }
          }

          /* Header offset for status bar on mobile */
          @media (max-width: 1023px) {
            .lf-header-bar.lf-ios-header {
              top: max(24px, env(safe-area-inset-top, 24px)) !important;
            }
            .lf-client-content-padded.lf-ios-content {
              padding-top: calc(96px + max(24px, env(safe-area-inset-top, 24px))) !important;
            }
          }
          @media (max-width: 1023px) and (pointer: coarse) {
            .lf-header-bar.lf-ios-header {
              top: env(safe-area-inset-top, 0px) !important;
            }
            .lf-client-content-padded.lf-ios-content {
              padding-top: calc(96px + env(safe-area-inset-top, 0px)) !important;
            }
          }

          /* iOS sheet — wrapper applies bottom-sheet styling (border-radius, padding,
             safe-area) as required; inner modal components retain their own positioning */
          .lf-ios-sheet {
            will-change: transform, opacity;
          }

          /* ─── Splash keyframes (fallback) ─── */
          @keyframes lf-splash-logo {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes lf-splash-text {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </SnackbarContext.Provider>
  );
}
