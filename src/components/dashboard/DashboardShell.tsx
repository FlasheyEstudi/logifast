'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutGrid, Package, Bike, Users, BarChart3, Settings,
  Sun, Moon, LogOut, Bell, Zap, Plus, Crosshair,
  Compass, Eye, Route, Maximize2, Minimize2,
  ChevronsUp, Search, Radio, Shield,
  Megaphone, MessageCircle, ChevronDown, MoreHorizontal,
} from 'lucide-react';
import { useStore, type ModuleKey } from '@/lib/store';
import ModuleOverview from './ModuleOverview';
import ModulePedidos from './ModulePedidos';
import ModuleFlota from './ModuleFlota';
import ModuleRepartidores from './ModuleRepartidores';
import ModuleReportes from './ModuleReportes';
import ModuleConfig from './ModuleConfig';
import ModuleDespacho from './ModuleDespacho';
import ModuleFinanzas from './ModuleFinanzas';
import ModuleClientes from './ModuleClientes';
import ModuleIncidencias from './ModuleIncidencias';
import ModuleMarketing from './ModuleMarketing';
import ModuleComunicaciones from './ModuleComunicaciones';
import ModuleSuperAdmin from './ModuleSuperAdmin';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';
import { SkeletonLoader, getSkeletonVariant, type SkeletonVariant } from './SkeletonLoader';

const NAV_ITEMS: { key: ModuleKey; label: string; icon: typeof LayoutGrid; shortcut?: string; desktop?: boolean }[] = [
  { key: 'overview', label: 'General', icon: LayoutGrid, shortcut: '1', desktop: true },
  { key: 'pedidos', label: 'Pedidos', icon: Package, shortcut: '2', desktop: true },
  { key: 'flota', label: 'Flota', icon: Bike, shortcut: '3', desktop: true },
  { key: 'repartidores', label: 'Repartidores', icon: Users, shortcut: '4', desktop: false },
  { key: 'reportes', label: 'Reportes', icon: BarChart3, shortcut: '5', desktop: true },
  { key: 'marketing', label: 'Marketing', icon: Megaphone, shortcut: '6', desktop: true },
  { key: 'config', label: 'Config', icon: Settings, shortcut: '7', desktop: true },
  { key: 'despacho', label: 'Despacho', icon: Zap, shortcut: '8', desktop: false },
  { key: 'finanzas', label: 'Finanzas', icon: BarChart3, shortcut: '9', desktop: false },
  { key: 'clientes', label: 'Clientes', icon: Users, shortcut: '0', desktop: false },
  { key: 'incidencias', label: 'Incidencias', icon: Shield, shortcut: 'i', desktop: false },
  { key: 'comunicaciones', label: 'Mensajes', icon: MessageCircle, shortcut: 'm', desktop: false },
  { key: 'superadmin', label: 'Super Admin', icon: Shield, shortcut: 's', desktop: false },
];

const DESKTOP_NAV = NAV_ITEMS.filter((n) => n.desktop);
const MORE_NAV = NAV_ITEMS.filter((n) => !n.desktop);

const MOBILE_NAV: ModuleKey[] = ['overview', 'pedidos', 'flota', 'marketing', 'more'];

const MODULE_LABELS: Record<ModuleKey, string> = {
  overview: 'Vista General',
  pedidos: 'Pedidos',
  flota: 'Flota',
  repartidores: 'Repartidores',
  despacho: 'Centro de Despacho',
  finanzas: 'Centro Financiero',
  clientes: 'Clientes',
  incidencias: 'Incidencias',
  reportes: 'Reportes',
  config: 'Configuración',
  marketing: 'Centro de Marketing',
  comunicaciones: 'Comunicaciones',
  superadmin: 'Super Admin',
};

export default function DashboardShell({ isDark, toggleTheme, onLogout }: { isDark: boolean; toggleTheme: () => void; onLogout: () => void }) {
  const {
    activeModule, setActiveModule, moduleFade, alerts,
    commandPaletteOpen, setCommandPaletteOpen,
    simulationRunning, toggleSimulation,
    simulateNewOrder, simulateDelivery, simulateStatusChange, updateMotoPositions,
  } = useStore();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelpOverlay, setShowHelpOverlay] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [loadedModule, setLoadedModule] = useState<ModuleKey>(activeModule);
  const avatarRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLDivElement>(null);

  // Skeleton variant for current module
  const skeletonVariant: SkeletonVariant = useMemo(() => getSkeletonVariant(activeModule), [activeModule]);

  // Show skeleton for 400ms when switching modules
  // loadedModule lags behind activeModule for 400ms to show skeleton
  const isModuleLoading = loadedModule !== activeModule;
  useEffect(() => {
    const timer = setTimeout(() => setLoadedModule(activeModule), 400);
    return () => clearTimeout(timer);
  }, [activeModule]);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close FAB on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setFabOpen(false);
    };
    if (fabOpen) {
      setTimeout(() => document.addEventListener('mousedown', handler), 0);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [fabOpen]);

  // Close more menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fullscreen toggle
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }
      // Number keys 1-9 for module navigation (only when not in input)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        const num = parseInt(e.key);
        if (num >= 1 && num <= NAV_ITEMS.length) {
          e.preventDefault();
          setActiveModule(NAV_ITEMS[num - 1].key);
        }
        // ? key for help overlay
        if (e.key === '?') {
          e.preventDefault();
          setShowHelpOverlay((p) => !p);
          return;
        }
        // F key for fullscreen toggle
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          handleFullscreen();
          return;
        }
        if (e.key === 'Escape') {
          setCommandPaletteOpen(false);
          setAvatarOpen(false);
          setFabOpen(false);
          setShowHelpOverlay(false);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen, setActiveModule, handleFullscreen]);

  // Simulation engine
  useEffect(() => {
    if (!simulationRunning) return;
    const motoInterval = setInterval(() => updateMotoPositions(), 8000);
    const statusInterval = setInterval(() => simulateStatusChange(), 15000);
    const orderInterval = setInterval(() => simulateNewOrder(), 60000);
    const deliveryInterval = setInterval(() => simulateDelivery(), 120000);

    return () => {
      clearInterval(motoInterval);
      clearInterval(statusInterval);
      clearInterval(orderInterval);
      clearInterval(deliveryInterval);
    };
  }, [simulationRunning, updateMotoPositions, simulateStatusChange, simulateNewOrder, simulateDelivery]);

  const highAlerts = alerts.filter((a) => a.severidad === 'alta').length;

  const renderModule = () => {
    switch (activeModule) {
      case 'overview': return <ModuleOverview isDark={isDark} />;
      case 'pedidos': return <ModulePedidos />;
      case 'flota': return <ModuleFlota isDark={isDark} />;
      case 'repartidores': return <ModuleRepartidores />;
      case 'despacho': return <ModuleDespacho />;
      case 'finanzas': return <ModuleFinanzas />;
      case 'clientes': return <ModuleClientes />;
      case 'reportes': return <ModuleReportes />;
      case 'incidencias': return <ModuleIncidencias />;
      case 'config': return <ModuleConfig />;
      case 'marketing': return <ModuleMarketing />;
      case 'comunicaciones': return <ModuleComunicaciones />;
      case 'superadmin': return <ModuleSuperAdmin />;
      default: return <ModuleOverview isDark={isDark} />;
    }
  };

  // FAB speed dial actions
  const fabActions = [
    { icon: Package, label: 'Nueva orden', color: '#FF6600', action: () => { setActiveModule('pedidos'); setFabOpen(false); } },
    { icon: Zap, label: 'Despacho', color: '#8B5CF6', action: () => { setActiveModule('despacho'); setFabOpen(false); } },
    { icon: BarChart3, label: 'Finanzas', color: '#16A34A', action: () => { setActiveModule('finanzas'); setFabOpen(false); } },
    { icon: Search, label: 'Buscar (⌘K)', color: '#3B82F6', action: () => { setCommandPaletteOpen(true); setFabOpen(false); } },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--lf-bg-base)' }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: 'var(--lf-surface)', borderBottom: '1px solid var(--lf-border)',
        zIndex: 100,
      }}>
        {/* Left: Logo + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: 'var(--lf-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 14, color: '#fff',
            }}>LF</div>
            <span className="font-serif" style={{ fontSize: 20, color: 'var(--lf-text-main)', letterSpacing: '-0.02em' }}>LOGIFAST</span>
          </div>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--lf-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Dashboard</span>
            <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>›</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-main)' }}>{MODULE_LABELS[activeModule]}</span>
          </div>
        </div>

        {/* Center: Desktop tabs */}
        <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="lf-dash-desktop-nav">
          {DESKTOP_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveModule(item.key)}
                title={`${item.label} (${item.shortcut})`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: isActive ? 'var(--lf-accent-soft)' : 'transparent',
                  color: isActive ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
                  transition: 'all 0.2s', position: 'relative',
                }}
              >
                <Icon size={15} />
                <span className="lf-nav-label">{item.label}</span>
              </button>
            );
          })}
          {/* More dropdown */}
          <div ref={moreRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMoreMenuOpen((p) => !p)}
              className={`lf-more-btn ${moreMenuOpen || MORE_NAV.some((n) => n.key === activeModule) ? 'lf-more-active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: MORE_NAV.some((n) => n.key === activeModule) ? 'var(--lf-accent-soft)' : 'transparent',
                color: MORE_NAV.some((n) => n.key === activeModule) ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
                transition: 'all 0.2s',
              }}
            >
              <MoreHorizontal size={15} />
              <span className="lf-nav-label">Más</span>
              <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: moreMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {moreMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  position: 'absolute', top: 44, right: 0, minWidth: 200,
                  background: 'var(--lf-surface)', border: '1px solid var(--lf-border)',
                  borderRadius: 12, boxShadow: 'var(--lf-shadow-lg)', overflow: 'hidden', zIndex: 200,
                }}
              >
                {MORE_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setActiveModule(item.key); setMoreMenuOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
                        border: 'none', background: isActive ? 'var(--lf-accent-soft)' : 'transparent',
                        cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--lf-accent)' : 'var(--lf-text-main)',
                        textAlign: 'left', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--lf-accent-soft)'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--lf-text-muted)', fontFamily: "'DM Mono', monospace" }}>{item.shortcut}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* En vivo indicator */}
          <div
            onClick={toggleSimulation}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8,
              background: simulationRunning ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
              border: `1px solid ${simulationRunning ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div className={simulationRunning ? 'lf-live-pulse' : ''} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: simulationRunning ? 'var(--lf-success)' : 'var(--lf-danger)',
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: simulationRunning ? 'var(--lf-success)' : 'var(--lf-danger)',
            }}>En vivo</span>
          </div>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Command Palette trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            style={{
              height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--lf-border)',
              background: 'var(--lf-surface)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 6, color: 'var(--lf-text-muted)',
              fontSize: 12, transition: 'all 0.2s',
            }}
          >
            <Search size={14} />
            <span style={{ fontSize: 12, opacity: 0.6 }}>Buscar...</span>
            <kbd style={{ padding: '1px 5px', borderRadius: 4, border: '1px solid var(--lf-border)', fontSize: 10, fontFamily: 'inherit', background: 'var(--lf-bg-base)' }}>⌘K</kbd>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={handleFullscreen}
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid var(--lf-border)',
              background: 'var(--lf-surface)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--lf-text-muted)',
            }}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid var(--lf-border)',
              background: 'var(--lf-surface)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--lf-text-muted)',
            }}
            aria-label="Cambiar tema"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Avatar */}
          <div ref={avatarRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setAvatarOpen((p) => !p)}
              style={{
                width: 36, height: 36, borderRadius: 8, border: '1px solid var(--lf-border)',
                background: 'var(--lf-primary-soft)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 12,
                color: 'var(--lf-primary)',
              }}
            >AD</button>
            {avatarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  position: 'absolute', top: 44, right: 0, minWidth: 200,
                  background: 'var(--lf-surface)', border: '1px solid var(--lf-border)',
                  borderRadius: 12, boxShadow: 'var(--lf-shadow-lg)', overflow: 'hidden', zIndex: 200,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lf-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Admin Demo</div>
                  <div style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>admin@logifast.com</div>
                </div>
                <button
                  onClick={() => { setAvatarOpen(false); onLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px',
                    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13,
                    color: 'var(--lf-danger)', textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--lf-accent-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {isModuleLoading ? (
            <SkeletonLoader key={`skeleton-${activeModule}`} variant={skeletonVariant} />
          ) : (
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}
            >
              {renderModule()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Speed Dial */}
        <div ref={fabRef} style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 50 }} className="lf-fab-container">
          {/* Speed dial items */}
          <AnimatePresence>
            {fabOpen && fabActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.4, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.4, y: 20 }}
                  transition={{ duration: 0.15, delay: fabOpen ? i * 0.04 : 0 }}
                  style={{
                    position: 'absolute', bottom: 60 + i * 52, right: 4,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--lf-text-main)', whiteSpace: 'nowrap',
                    padding: '4px 10px', borderRadius: 6, background: 'var(--lf-surface)',
                    border: '1px solid var(--lf-border)', boxShadow: 'var(--lf-shadow-md)',
                  }}>{action.label}</span>
                  <button
                    onClick={action.action}
                    className="lf-fab-action"
                    style={{
                      width: 44, height: 44, borderRadius: '50%', border: 'none',
                      background: action.color, color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 12px ${action.color}44`,
                      transition: 'transform 0.15s',
                    }}
                  >
                    <Icon size={18} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Main FAB button */}
          <button
            onClick={() => setFabOpen((p) => !p)}
            className="lf-fab-main"
            style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none',
              background: fabOpen ? 'var(--lf-danger)' : 'var(--lf-accent)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: fabOpen ? '0 4px 16px rgba(220,38,38,0.4)' : '0 4px 16px rgba(255,102,0,0.4)',
              transition: 'all 0.2s', transform: fabOpen ? 'rotate(45deg)' : 'rotate(0)',
            }}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* ═══ BOTTOM NAV (mobile) ═══ */}
      <nav className="lf-dash-bottom-nav" style={{
        height: 64, flexShrink: 0, display: 'none', alignItems: 'center', justifyContent: 'space-around',
        background: 'var(--lf-surface)', borderTop: '1px solid var(--lf-border)',
        padding: '0 4px', position: 'relative',
      }}>
        {MOBILE_NAV.map((navKey) => {
          if (navKey === 'more') {
            const isMoreActive = MORE_NAV.some((n) => n.key === activeModule);
            return (
              <button
                key="more"
                onClick={() => setMobileMoreOpen((p) => !p)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: isMoreActive ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
                  fontSize: 9, fontWeight: 600, padding: '4px 6px',
                }}
              >
                <MoreHorizontal size={18} />
                <span>Más</span>
              </button>
            );
          }
          const item = NAV_ITEMS.find((n) => n.key === navKey);
          if (!item) return null;
          const Icon = item.icon;
          const isActive = activeModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setActiveModule(item.key); setMobileMoreOpen(false); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: isActive ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
                fontSize: 9, fontWeight: 600, padding: '4px 6px',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Mobile More submenu */}
        <AnimatePresence>
          {mobileMoreOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              style={{
                position: 'absolute', bottom: 68, left: 8, right: 8,
                background: 'var(--lf-surface)', border: '1px solid var(--lf-border)',
                borderRadius: 12, boxShadow: 'var(--lf-shadow-lg)', overflow: 'hidden', zIndex: 200,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
              }}
            >
              {MORE_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setActiveModule(item.key); setMobileMoreOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
                      border: 'none', background: isActive ? 'var(--lf-accent-soft)' : 'transparent',
                      cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--lf-accent)' : 'var(--lf-text-main)',
                      textAlign: 'left', transition: 'background 0.15s',
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Command Palette */}
      <CommandPalette />

      {/* ═══ KEYBOARD SHORTCUTS HELP OVERLAY ═══ */}
      <AnimatePresence>
        {showHelpOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowHelpOverlay(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--lf-surface)', border: '1px solid var(--lf-border)',
                borderRadius: 16, padding: '32px 36px', maxWidth: 520, width: '90%',
                boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#002A5C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 14, color: '#fff',
                }}>LF</div>
                <div>
                  <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--lf-text-main)', margin: 0 }}>Atajos de teclado</h2>
                  <p style={{ fontSize: 12, color: 'var(--lf-text-muted)', margin: '2px 0 0' }}>LOGIFAST Dashboard</p>
                </div>
              </div>

              {/* Shortcuts list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Module navigation */}
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lf-text-muted)', padding: '8px 0 4px' }}>Navegación de módulos</div>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={14} style={{ color: 'var(--lf-text-muted)' }} />
                        <span style={{ fontSize: 13, color: 'var(--lf-text-main)' }}>{item.label}</span>
                      </div>
                      <kbd style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: 12,
                        fontFamily: "'DM Mono', monospace", fontWeight: 600,
                        background: 'var(--lf-bg-base)', border: '1px solid var(--lf-border)',
                        color: '#002A5C', minWidth: 24, textAlign: 'center',
                      }}>{item.shortcut}</kbd>
                    </div>
                  );
                })}

                {/* General shortcuts */}
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lf-text-muted)', padding: '12px 0 4px' }}>General</div>
                {[
                  { keys: '⌘K', label: 'Paleta de comandos', desc: 'Buscar y ejecutar acciones' },
                  { keys: '?', label: 'Ayuda de atajos', desc: 'Mostrar esta ventana' },
                  { keys: 'F', label: 'Pantalla completa', desc: 'Alternar modo fullscreen' },
                  { keys: 'Esc', label: 'Cerrar', desc: 'Cerrar diálogos y overlays' },
                ].map((s) => (
                  <div key={s.keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--lf-text-main)' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>{s.desc}</div>
                    </div>
                    <kbd style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 12,
                      fontFamily: "'DM Mono', monospace", fontWeight: 600,
                      background: '#002A5C', border: 'none',
                      color: '#FF6600', minWidth: 24, textAlign: 'center',
                    }}>{s.keys}</kbd>
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--lf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Presiona</span>
                <kbd style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 12,
                  fontFamily: "'DM Mono', monospace", fontWeight: 600,
                  background: 'var(--lf-bg-base)', border: '1px solid var(--lf-border)',
                  color: '#002A5C',
                }}>Esc</kbd>
                <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>o</span>
                <kbd style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 12,
                  fontFamily: "'DM Mono', monospace", fontWeight: 600,
                  background: 'var(--lf-bg-base)', border: '1px solid var(--lf-border)',
                  color: '#002A5C',
                }}>?</kbd>
                <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>para cerrar</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive styles */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .lf-nav-label { display: none; }
        }
        @media (max-width: 768px) {
          .lf-dash-desktop-nav { display: none !important; }
          .lf-dash-bottom-nav { display: flex !important; }
          .lf-fab-container { bottom: 80px !important; }
          .lf-skeleton-side-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
