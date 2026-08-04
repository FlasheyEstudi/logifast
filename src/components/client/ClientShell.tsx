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
    case 'orden_confirmada': return { icon: <CheckCircle size={18} />, color: 'var(--exito)' };
    case 'repartidor_asignado': return { icon: <User size={18} />, color: '#2979FF' };
    case 'repartidor_camino': return { icon: <Bike size={18} />, color: '#FF9800' };
    case 'paquete_recogido': return { icon: <Package size={18} />, color: '#2979FF' };
    case 'entrega_exitosa': return { icon: <CheckCircle size={20} />, color: 'var(--exito)' };
    case 'incidencia': return { icon: <AlertTriangle size={18} />, color: 'var(--peligro)' };
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
  { key: 'inicio', label: 'Inicio', icon: <Home size={20} strokeWidth={2} /> },
  { key: 'explorar', label: 'Explorar', icon: <ShoppingBag size={20} strokeWidth={2} /> },
  { key: 'envios', label: 'Envíos', icon: <Package size={20} strokeWidth={2} /> },
  { key: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={20} strokeWidth={2} /> },
  { key: 'puntos', label: 'Billetera', icon: <Wallet size={20} strokeWidth={2} /> },
  { key: 'perfil', label: 'Perfil', icon: <User size={20} strokeWidth={2} /> },
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
    const moduleProps = { isDark, userName, onNavigate: handleNav, onOpenTracking: handleOpenTracking, onOpenChat: handleOpenChat, onOpenRating: handleOpenRating };
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
                background: 'linear-gradient(135deg, #007AFF, #0056B3)',
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

        {/* ═══════ HEADER / LAYOUT FLOTANTE ESTILO LÍQUIDO (CLIENTE) ═══════ */}
        <header
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 12px) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9980,
            width: 'calc(100vw - 24px)',
            maxWidth: 960,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            borderRadius: 100,
            background: 'color-mix(in srgb, var(--surface, #1E293B) 88%, transparent)',
            backdropFilter: 'saturate(200%) blur(24px)',
            WebkitBackdropFilter: 'saturate(200%) blur(24px)',
            border: '1px solid color-mix(in srgb, var(--primario) 25%, transparent)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3), 0 0 16px color-mix(in srgb, var(--primario) 12%, transparent)',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Left: Clean Module Title (Logo removed as requested) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text)',
                fontFamily: "'Syne', sans-serif",
                letterSpacing: '-0.01em',
              }}
            >
              {iosTitle}
            </span>
          </div>

          {/* Right Actions: Theme + Bell + Cart + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                background: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDark ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
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
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: 'none',
                  background: clientNotifOpen ? 'var(--primario)' : 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
                  color: clientNotifOpen ? '#FFFFFF' : 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Bell size={17} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 1,
                      right: 1,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: 'var(--peligro)',
                      color: '#FFFFFF',
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Cart */}
            <button
              onClick={() => setCarritoOpen(true)}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                background: carritoOpen ? 'var(--primario)' : 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
                color: carritoOpen ? '#FFFFFF' : 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
              aria-label="Carrito"
            >
              <ShoppingBag size={17} strokeWidth={1.8} />
              {getCartItemCount() > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 1,
                    minWidth: 14,
                    height: 14,
                    borderRadius: 7,
                    padding: '0 3px',
                    background: 'var(--peligro)',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {getCartItemCount() > 9 ? '9+' : getCartItemCount()}
                </span>
              )}
            </button>
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
            background: isDark
              ? 'rgba(15, 23, 42, 0.88)'
              : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'saturate(200%) blur(24px)',
            WebkitBackdropFilter: 'saturate(200%) blur(24px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : '1px solid rgba(0, 0, 0, 0.10)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25), 0 0 20px rgba(0, 102, 255, 0.15)',
            maxWidth: 'calc(100vw - 24px)',
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
                  color: isActive
                    ? '#FFFFFF'
                    : isDark
                    ? '#CBD5E1'
                    : '#334155',
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
                      background: 'var(--primario, var(--primario))',
                      boxShadow: '0 4px 14px color-mix(in srgb, var(--primario) 50%, transparent)',
                      zIndex: -1,
                    }}
                  />
                )}

                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', zIndex: 1, color: isActive ? '#FFFFFF' : isDark ? '#CBD5E1' : '#334155' }}>
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
                        background: 'var(--peligro)',
                        color: '#FFF',
                        fontSize: 9,
                        fontWeight: 700,
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
                isOpen={true}
                onClose={() => setCarritoOpen(false)}
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
