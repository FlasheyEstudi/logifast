'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CreditCard,
  Clock,
  Package,
  SlidersHorizontal,
  FileText,
  BarChart3,
  TrendingUp,
  Settings,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  LogOut,
  QrCode,
  X,
  ChevronDown,
  MoreHorizontal,
  Store,
  ArrowLeft,
} from '@/components/icons';
import { realtime } from '@/services/realtime';
import { notify } from '@/lib/notify';
import {
  iniciarPosScanner,
  reconectarSesionPos,
  onEstadoPos,
  getSesionPos,
  abrirSesionPos,
  cerrarSesionPos,
} from '@/services/pos-scanner';
import QRCode from 'qrcode';
import CamaraEscaneo from './CamaraEscaneo';

export type TiendaModulo =
  | 'kds'
  | 'pos'
  | 'inventario'
  | 'kardex'
  | 'facturacion'
  | 'reportes'
  | 'estadisticas'
  | 'configuracion';

export const TIENDA_MODULO_LABELS: Record<TiendaModulo, string> = {
  pos: 'Caja POS',
  kds: 'Monitor KDS',
  inventario: 'Inventario',
  kardex: 'Kardex',
  facturacion: 'Facturación & DGI',
  reportes: 'Reportes Excel',
  estadisticas: 'Métricas',
  configuracion: 'Ajustes',
};

interface TiendaNavbarProps {
  children?: React.ReactNode;
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  onReturnToClient?: () => void;
  tiendaNombre: string;
  tiendaCategoria?: string;
  tiendaImagenUrl?: string | null;
  tiendaEstado: string;
  moduloActivo: TiendaModulo;
  onSelectModulo: (mod: TiendaModulo) => void;
}

export function TiendaNavbar({
  children,
  isDark,
  toggleTheme,
  onLogout,
  onReturnToClient,
  tiendaNombre,
  tiendaCategoria = 'tienda',
  tiendaImagenUrl,
  tiendaEstado,
  moduloActivo,
  onSelectModulo,
}: TiendaNavbarProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estados del escáner por celular / QR
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [modalSesionAbierta, setModalSesionAbierta] = useState(false);
  const [sesionPin, setSesionPin] = useState<string | null>(null);
  const [lectorConectado, setLectorConectado] = useState(false);
  const [qrTokenImg, setQrTokenImg] = useState<string | null>(null);

  const moreRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Módulos visibles en el header (Desktop y Tablet horizontal)
  const desktopNavItems: { id: TiendaModulo; label: string; icon: typeof CreditCard; shortcut: string }[] = [
    { id: 'pos', label: 'Caja POS', icon: CreditCard, shortcut: '1' },
    { id: 'kds', label: 'Monitor KDS', icon: Clock, shortcut: '2' },
    { id: 'inventario', label: 'Inventario', icon: Package, shortcut: '3' },
    { id: 'kardex', label: 'Kardex', icon: SlidersHorizontal, shortcut: '4' },
    { id: 'facturacion', label: 'Facturación', icon: FileText, shortcut: '5' },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, shortcut: '6' },
  ];

  // Módulos complementarios en dropdown "Más"
  const moreNavItems: { id: TiendaModulo; label: string; descripcion: string; icon: typeof TrendingUp; shortcut: string }[] = [
    { id: 'estadisticas', label: 'Métricas & Ventas', descripcion: 'Horas pico y productos top', icon: TrendingUp, shortcut: '7' },
    { id: 'configuracion', label: 'Ajustes del Comercio', descripcion: 'Horarios, RUC, logo y tarifas', icon: Settings, shortcut: '8' },
  ];

  // Barra inferior móvil (<= 768px): 4 accesos primarios + Más
  const mobileNavItems: { id: TiendaModulo | 'more'; label: string; icon: typeof CreditCard }[] = [
    { id: 'pos', label: 'Caja', icon: CreditCard },
    { id: 'kds', label: 'KDS', icon: Clock },
    { id: 'inventario', label: 'Stock', icon: Package },
    { id: 'kardex', label: 'Kardex', icon: SlidersHorizontal },
    { id: 'more', label: 'Más', icon: MoreHorizontal },
  ];

  const isAbierta = tiendaEstado === 'activo';
  const handleExitAction = onReturnToClient || onLogout;

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pantalla completa (idéntico a Admin)
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Atajos de teclado (1-8 para módulos, F para fullscreen, Esc para cerrar)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          handleFullscreen();
          return;
        }
        if (e.key === 'Escape') {
          setMoreMenuOpen(false);
          setMobileMoreOpen(false);
          setAvatarOpen(false);
          return;
        }

        const allItems = [...desktopNavItems, ...moreNavItems];
        const num = parseInt(e.key);
        if (num >= 1 && num <= allItems.length) {
          e.preventDefault();
          onSelectModulo(allItems[num - 1].id);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onSelectModulo, handleFullscreen]);

  // Sesión persistente del escáner por celular
  useEffect(() => {
    iniciarPosScanner();
    if (reconectarSesionPos()) {
      setSesionPin(typeof window !== 'undefined' ? localStorage.getItem('pos_active_session') : null);
    }
    const off = onEstadoPos(setLectorConectado);
    return off;
  }, []);

  const abrirSesion = () => {
    let pin = getSesionPos().pin;
    if (!pin) {
      pin = String(100000 + Math.floor(Math.random() * 900000));
      abrirSesionPos(pin);
    }
    setSesionPin(pin);
    setModalSesionAbierta(true);
    setQrTokenImg(null);
    fetch('/api/qr-sync?action=token')
      .then((r) => r.json())
      .then((d) => {
        if (d?.token) {
          QRCode.toDataURL(d.token, { width: 360, margin: 1 })
            .then(setQrTokenImg)
            .catch(() => setQrTokenImg(null));
        }
      })
      .catch(() => setQrTokenImg(null));
  };

  const desconectar = () => {
    cerrarSesionPos();
    setSesionPin(null);
    setModalSesionAbierta(false);
    setQrTokenImg(null);
  };

  const tocarQr = () => {
    const esApp = !!(window as any).Capacitor?.isNativePlatform?.();
    const esMovil = esApp || (window.innerWidth <= 768 && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window));
    if (!esMovil) {
      abrirSesion();
      return;
    }
    setCamaraAbierta(true);
  };

  const procesarQrCelular = async (crudo: string) => {
    setCamaraAbierta(false);
    const contenido = String(crudo ?? '').trim();
    if (!contenido) return;
    const esApp = !!(window as any).Capacitor?.isNativePlatform?.();
    if (/^[A-Za-z0-9._-]{40,}$/.test(contenido)) {
      const r = await fetch('/api/qr-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: contenido }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        notify.error(d.error || 'No se pudo vincular con la caja.');
      } else {
        localStorage.setItem('qr_pos_vinculado', '1');
        window.location.href = esApp ? '/escaner.html' : '/escaner';
      }
      return;
    }
    const m = contenido.match(/(?:escaner\?pin=|pin[=:])(\d{6})/i);
    if (m?.[1]) {
      realtime.escanerUnir(m[1]);
      window.location.href = esApp ? `/escaner.html?pin=${m[1]}` : `/escaner?pin=${m[1]}`;
      return;
    }
    notify.error('Ese QR no es del POS. Escanea el código que muestra la caja.');
  };

  // Iniciales del comercio para el avatar
  const inicialesTienda = tiendaNombre
    ? tiendaNombre
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'TD';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        background: 'var(--lf-bg-base, var(--bg))',
        color: 'var(--lf-text-main, var(--text))',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ══════════════════════════════════════════════════════════
          1. HEADER SUPERIOR ESTILO ADMINISTRADOR (H: 56px)
          ══════════════════════════════════════════════════════════ */}
      <header
        className="lf-tienda-header"
        style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'var(--lf-surface, var(--surface))',
          borderBottom: '1px solid var(--lf-border, var(--border))',
          zIndex: 100,
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Left: Logo / Avatar de Tienda + Nombre + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {/* Avatar Squircle con indicador de estado en vivo */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: tiendaImagenUrl ? 'transparent' : 'var(--lf-accent, #007AFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                fontSize: 13,
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0, 102, 255, 0.25)',
              }}
            >
              {tiendaImagenUrl ? (
                <img src={tiendaImagenUrl} alt={tiendaNombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{inicialesTienda}</span>
              )}
              <span
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isAbierta ? 'var(--lf-success, #00C853)' : '#FFB300',
                  boxShadow: isAbierta ? '0 0 6px #00C853' : 'none',
                  border: '1.5px solid var(--lf-surface, #fff)',
                }}
                title={isAbierta ? 'Comercio en línea' : 'Comercio pausado'}
              />
            </div>

            {/* Nombre del comercio */}
            <span
              className="lf-dash-brand"
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--lf-text-main, var(--text))',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 160,
              }}
              title={tiendaNombre}
            >
              {tiendaNombre || 'Mi Tienda'}
            </span>
          </div>

          {/* Breadcrumb idéntico al Admin */}
          <div
            className="lf-dash-breadcrumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginLeft: 4,
              paddingLeft: 12,
              borderLeft: '1px solid var(--lf-border, var(--border))',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Tienda</span>
            <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>›</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-accent, #007AFF)' }}>
              {TIENDA_MODULO_LABELS[moduloActivo]}
            </span>
          </div>
        </div>

        {/* Center: Tabs Principales Desktop & Tablet Landscape */}
        <nav
          aria-label="Módulos de tienda"
          className="lf-dash-desktop-nav"
          style={{ display: 'flex', gap: 3, alignItems: 'center' }}
        >
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = moduloActivo === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModulo(item.id)}
                title={`${item.label} (${item.shortcut})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  background: isActive ? 'var(--lf-accent-soft, rgba(0, 122, 255, 0.1))' : 'transparent',
                  color: isActive ? 'var(--lf-accent, #007AFF)' : 'var(--lf-text-muted)',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
              >
                <Icon size={15} />
                <span className="lf-nav-label">{item.label}</span>
              </button>
            );
          })}

          {/* Dropdown "Más" para submódulos */}
          <div ref={moreRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMoreMenuOpen((p) => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: moreNavItems.some((n) => n.id === moduloActivo)
                  ? 'var(--lf-accent-soft, rgba(0, 122, 255, 0.1))'
                  : 'transparent',
                color: moreNavItems.some((n) => n.id === moduloActivo)
                  ? 'var(--lf-accent, #007AFF)'
                  : 'var(--lf-text-muted)',
                transition: 'all 0.18s ease',
              }}
            >
              <MoreHorizontal size={15} />
              <span className="lf-nav-label">Más</span>
              <ChevronDown
                size={12}
                style={{
                  transition: 'transform 0.2s',
                  transform: moreMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                }}
              />
            </button>

            {/* Menú Flotante "Más" Desktop */}
            <AnimatePresence>
              {moreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 44,
                    right: 0,
                    minWidth: 240,
                    background: 'var(--lf-surface, var(--surface))',
                    border: '1px solid var(--lf-border, var(--border))',
                    borderRadius: 12,
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                    padding: 6,
                    zIndex: 200,
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: 10.5, fontWeight: 800, color: 'var(--lf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Gestión Complementaria
                  </div>
                  {moreNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = moduloActivo === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectModulo(item.id);
                          setMoreMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: isActive ? 'var(--lf-accent-soft, rgba(0, 122, 255, 0.1))' : 'transparent',
                          color: isActive ? 'var(--lf-accent, #007AFF)' : 'var(--lf-text-main, var(--text))',
                          cursor: 'pointer',
                          fontSize: 12.5,
                          fontWeight: isActive ? 700 : 500,
                          textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'var(--lf-accent, #007AFF)' : 'rgba(255,255,255,0.05)', color: isActive ? '#fff' : 'inherit' }}>
                          <Icon size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--lf-text-muted)', marginTop: 2 }}>{item.descripcion}</div>
                        </div>
                        <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: 'var(--lf-text-muted)', opacity: 0.6 }}>
                          {item.shortcut}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right: Escáner QR + Indicador En Vivo + Fullscreen + Tema + Avatar Tienda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Conexión del celular como lector de código de barras para el POS */}
          {sesionPin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setModalSesionAbierta(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: 'rgba(0, 200, 83, 0.1)',
                  border: '1px solid rgba(0, 200, 83, 0.3)',
                  color: 'var(--lf-success, #00C853)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 6px #00C853' }} />
                <span>Lector Activo</span>
              </button>
              <button
                onClick={desconectar}
                title="Desconectar celular"
                aria-label="Desconectar celular"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid rgba(255, 59, 48, 0.3)',
                  background: 'rgba(255, 59, 48, 0.1)',
                  color: '#FF3B30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={tocarQr}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 8,
                background: 'rgba(0, 102, 255, 0.1)',
                border: '1px solid rgba(0, 102, 255, 0.25)',
                color: 'var(--lf-accent, #007AFF)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title="Conectar celular como lector de código de barras"
            >
              <QrCode size={14} />
              <span className="lf-nav-label">Lector Móvil</span>
            </button>
          )}

          {/* Indicador En Vivo (Admin Style) */}
          <div
            className="lf-dash-live"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(0, 200, 83, 0.08)',
              border: '1px solid rgba(0, 200, 83, 0.2)',
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lf-success, #00C853)', boxShadow: '0 0 8px #00C853' }} />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lf-success, #00C853)' }}>
              En vivo
            </span>
          </div>

          {/* Botón Pantalla Completa (Idéntico a Admin) */}
          <button
            onClick={handleFullscreen}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid var(--lf-border, var(--border))',
              background: 'var(--lf-surface, var(--surface))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lf-text-muted)',
              transition: 'all 0.15s',
            }}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Botón Tema Claro/Oscuro (Idéntico a Admin) */}
          <button
            onClick={toggleTheme}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid var(--lf-border, var(--border))',
              background: 'var(--lf-surface, var(--surface))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lf-text-muted)',
              transition: 'all 0.15s',
            }}
            aria-label="Cambiar tema"
            title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDark ? <Sun size={15} style={{ color: '#FFB300' }} /> : <Moon size={15} style={{ color: '#007AFF' }} />}
          </button>

          {/* Avatar Dropdown Perfil Tienda */}
          <div ref={avatarRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setAvatarOpen((p) => !p)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: '1px solid var(--lf-border, var(--border))',
                background: 'var(--lf-accent-soft, rgba(0, 122, 255, 0.1))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                fontSize: 12,
                color: 'var(--lf-accent, #007AFF)',
                transition: 'all 0.15s',
              }}
              aria-label="Menú de perfil"
            >
              {inicialesTienda}
            </button>

            {/* Menú Desplegable Avatar */}
            <AnimatePresence>
              {avatarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 44,
                    right: 0,
                    minWidth: 220,
                    background: 'var(--lf-surface, var(--surface))',
                    border: '1px solid var(--lf-border, var(--border))',
                    borderRadius: 12,
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                    overflow: 'hidden',
                    zIndex: 200,
                  }}
                >
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--lf-border, var(--border))' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--lf-text-main, var(--text))' }}>
                      {tiendaNombre || 'Mi Tienda'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--lf-text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                      Rubro: {tiendaCategoria}
                    </div>
                  </div>

                  {onReturnToClient && (
                    <button
                      onClick={() => {
                        setAvatarOpen(false);
                        onReturnToClient();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 12.5,
                        color: 'var(--lf-accent, #007AFF)',
                        fontWeight: 600,
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                    >
                      <ArrowLeft size={14} /> Volver a Marketplace
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setAvatarOpen(false);
                      onLogout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      color: 'var(--lf-danger, #FF3B30)',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s',
                      borderTop: '1px solid var(--lf-border, var(--border))',
                    }}
                  >
                    <LogOut size={14} /> Cerrar sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          2. ÁREA DE CONTENIDO CON SCROLL FLUIDO
          ══════════════════════════════════════════════════════════ */}
      <main
        className="lf-tienda-main"
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          width: '100%',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '16px 16px 84px 16px',
            boxSizing: 'border-box',
          }}
          className="lf-tienda-content-wrap"
        >
          {children}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════
          3. BARRA INFERIOR MÓVIL Y TABLET VERTICAL (H: 64px)
          Idéntica a la barra de navegación móvil del Administrador
          ══════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Navegación móvil de tienda"
        className="lf-dash-bottom-nav"
        style={{
          height: 64,
          flexShrink: 0,
          display: 'none', // Visible sólo en pantallas <= 768px via CSS
          alignItems: 'center',
          justifyContent: 'space-around',
          background: 'var(--lf-surface, var(--surface))',
          borderTop: '1px solid var(--lf-border, var(--border))',
          padding: '0 4px',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        {mobileNavItems.map((item) => {
          if (item.id === 'more') {
            const isMoreActive = moreNavItems.some((n) => n.id === moduloActivo);
            return (
              <button
                key="more"
                onClick={() => setMobileMoreOpen((p) => !p)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: isMoreActive ? 'var(--lf-accent, #007AFF)' : 'var(--lf-text-muted)',
                  fontSize: 10,
                  fontWeight: isMoreActive ? 700 : 500,
                  padding: '6px 12px',
                  minHeight: 44,
                  minWidth: 48,
                }}
              >
                <MoreHorizontal size={19} />
                <span>Más</span>
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = moduloActivo === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectModulo(item.id as TiendaModulo);
                setMobileMoreOpen(false);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: isActive ? 'var(--lf-accent, #007AFF)' : 'var(--lf-text-muted)',
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                padding: '6px 12px',
                minHeight: 44,
                minWidth: 48,
              }}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Submenú Flotante "Más" en Móvil / Tablet */}
        <AnimatePresence>
          {mobileMoreOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMoreOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 190,
                }}
              />

              {/* Panel Emergente */}
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
                  left: 12,
                  right: 12,
                  maxWidth: 420,
                  margin: '0 auto',
                  background: 'var(--lf-surface, var(--surface))',
                  border: '1px solid var(--lf-border, var(--border))',
                  borderRadius: 16,
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
                  padding: 12,
                  zIndex: 200,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--lf-border, var(--border))', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--lf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Módulos Adicionales
                  </span>
                  <button
                    onClick={() => setMobileMoreOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--lf-text-muted)', cursor: 'pointer', padding: 2 }}
                    aria-label="Cerrar menú"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Submódulos Facturación, Reportes, Métricas, Ajustes */}
                {[
                  { id: 'facturacion' as TiendaModulo, label: 'Facturación & DGI', desc: 'RUC y tickets', icon: FileText },
                  { id: 'reportes' as TiendaModulo, label: 'Reportes Excel', desc: 'Balances y caja', icon: BarChart3 },
                  { id: 'estadisticas' as TiendaModulo, label: 'Métricas', desc: 'Ventas y horas pico', icon: TrendingUp },
                  { id: 'configuracion' as TiendaModulo, label: 'Ajustes', desc: 'Datos y horarios', icon: Settings },
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = moduloActivo === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModulo(m.id);
                        setMobileMoreOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 6,
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: isActive ? '1px solid var(--lf-accent, #007AFF)' : '1px solid var(--lf-border, var(--border))',
                        background: isActive ? 'var(--lf-accent-soft, rgba(0, 122, 255, 0.1))' : 'rgba(255, 255, 255, 0.02)',
                        color: isActive ? 'var(--lf-accent, #007AFF)' : 'var(--lf-text-main, var(--text))',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'var(--lf-accent, #007AFF)' : 'rgba(0, 102, 255, 0.1)', color: isActive ? '#fff' : 'var(--lf-accent, #007AFF)' }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{m.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--lf-text-muted)', marginTop: 2 }}>{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          4. MODALES INTEGRADOS (Cámara QR y Sesión de Celular)
          ══════════════════════════════════════════════════════════ */}
      {camaraAbierta && (
        <CamaraEscaneo onCodigo={procesarQrCelular} onCerrar={() => setCamaraAbierta(false)} titulo="Escanear QR de la caja" />
      )}

      {modalSesionAbierta && (
        <div
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
          onClick={() => setModalSesionAbierta(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              background: 'var(--lf-surface, var(--surface))',
              borderRadius: 18,
              border: '1px solid var(--lf-border, var(--border))',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--lf-text-main, var(--text))' }}>
                Conectar Lector por Celular
              </h3>
              <button
                onClick={() => setModalSesionAbierta(false)}
                aria-label="Cerrar"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  color: 'var(--lf-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 100,
                background: lectorConectado ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                color: lectorConectado ? '#00C853' : 'var(--lf-text-muted)',
                border: lectorConectado ? '1px solid rgba(0, 200, 83, 0.3)' : '1px solid var(--lf-border, var(--border))',
              }}
            >
              {lectorConectado ? 'CELULAR CONECTADO • LECTOR ACTIVO' : 'ESPERANDO CONEXIÓN DEL CELULAR…'}
            </div>

            {qrTokenImg ? (
              <img
                src={qrTokenImg}
                alt="QR de vinculación"
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 14,
                  border: '1px solid var(--lf-border, var(--border))',
                  background: '#FFFFFF',
                  padding: 8,
                }}
              />
            ) : (
              <div style={{ width: 220, height: 220, borderRadius: 14, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Generando código QR…</span>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, fontFamily: 'monospace', color: 'var(--lf-text-main, var(--text))' }}>
                {sesionPin}
              </div>
              <p style={{ fontSize: 12, color: 'var(--lf-text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
                Escanea el código con tu celular para usar la cámara como pistola de códigos de barras.
              </p>
            </div>

            <button
              onClick={() => setModalSesionAbierta(false)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 100,
                background: 'var(--lf-accent, #007AFF)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          5. ESTILOS RESPONSIVOS MÓVIL Y TABLET (IDÉNTICO A ADMIN)
          ══════════════════════════════════════════════════════════ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .lf-nav-label { display: none !important; }
        }
        @media (max-width: 768px) {
          .lf-dash-desktop-nav { display: none !important; }
          .lf-dash-bottom-nav { display: flex !important; }
          .lf-dash-breadcrumb { display: none !important; }
          .lf-dash-live { display: none !important; }
          .lf-tienda-header { height: 52px !important; padding: 0 12px !important; }
          .lf-tienda-content-wrap { padding-bottom: 96px !important; padding-left: 10px !important; padding-right: 10px !important; }
        }
        @media (max-width: 480px) {
          .lf-dash-brand { max-width: 110px !important; }
        }
      ` }} />
    </div>
  );
}

export const TiendaLayout = TiendaNavbar;
export default TiendaNavbar;
