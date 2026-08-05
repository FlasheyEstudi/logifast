// components/ingeniero/IngenieroApp.tsx
'use client';

import React, { lazy, Suspense, useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useIngenieroStore } from '@/store/ingenieroStore';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { DashboardSkeleton, FlotaSkeleton, MantenimientosSkeleton, PerfilSkeleton } from './Skeletons';
import CrearMantenimiento from './CrearMantenimiento';
import Inventario from './Inventario';

const Dashboard = lazy(() => import('./Dashboard'));
const Flota = lazy(() => import('./Flota'));
const Mantenimientos = lazy(() => import('./Mantenimientos'));
const PerfilIngeniero = lazy(() => import('./PerfilIngeniero'));

type TabId = 'dashboard' | 'flota' | 'mantenimientos' | 'perfil';

const TABS = [
  { id: 'dashboard' as TabId, label: 'Dashboard' },
  { id: 'flota' as TabId, label: 'Flota' },
  { id: 'mantenimientos' as TabId, label: 'Mantenimientos' },
  { id: 'perfil' as TabId, label: 'Perfil' }
];

interface IngenieroAppProps {
  onLogout: () => void;
  userName: string;
  isDark: boolean;
  toggleTheme: () => void;
}

export default function IngenieroApp({ onLogout, userName, isDark, toggleTheme }: IngenieroAppProps) {
  const store = useIngenieroStore();
  const device = useDeviceInfo();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Cargar datos reales al montar
  useEffect(() => {
    store.cargarDatos();
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getTabIcon = (id: TabId, active: boolean) => {
    const color = active ? 'var(--lf-accent, #FF5722)' : 'currentColor';
    const sw = active ? 2.5 : 2;

    switch (id) {
      case 'dashboard':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}>
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        );
      case 'flota':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}>
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3.5-3.5 2-2.5L14 12h4l2 3.5"/>
          </svg>
        );
      case 'mantenimientos':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        );
      case 'perfil':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        );
    }
  };

  const getModuleLabel = (id: TabId) => {
    switch (id) {
      case 'dashboard': return 'Dashboard General';
      case 'flota': return 'Control de Flota';
      case 'mantenimientos': return 'Historial y Mantenimientos';
      case 'perfil': return 'Configuración de Perfil';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--lf-bg, #f8f9fa)' }}>
      
      {/* ═══ HEADER (Admin style) ═══ */}
      <header style={{
        height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: 'var(--lf-surface, #ffffff)', borderBottom: '1px solid var(--lf-border, #e5e7eb)',
        zIndex: 100,
      }}>
        {/* Left: Logo + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: 'var(--lf-accent, #FF5722)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 14, color: '#fff',
            }}>LF</div>
            <span className="font-serif" style={{ fontSize: 20, color: 'var(--lf-text-main, #1a1a2e)', letterSpacing: '-0.02em', fontWeight: 700 }}>LOGIFAST</span>
          </div>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--lf-border, #e5e7eb)' }}>
            <span style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)' }}>Mantenimiento</span>
            <span style={{ fontSize: 11, color: 'var(--lf-text-muted, #6B7280)' }}>›</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-main, #1a1a2e)' }}>
              {TABS.find(t => t.id === store.tabActiva)?.label || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Center: Desktop tabs */}
        <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="lf-dash-desktop-nav">
          {TABS.map((tab) => {
            const isActive = store.tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => store.setTabActiva(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: isActive ? 'var(--lf-accent-soft, rgba(255, 87, 34, 0.08))' : 'transparent',
                  color: isActive ? 'var(--lf-accent, #FF5722)' : 'var(--lf-text-muted, #6B7280)',
                  transition: 'all 0.2s', position: 'relative',
                }}
              >
                {getTabIcon(tab.id, isActive)}
                <span className="lf-nav-label" style={{ marginLeft: 4 }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid var(--lf-border, #e5e7eb)',
              background: 'var(--lf-surface, #ffffff)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--lf-text-muted, #6B7280)',
            }}
            aria-label="Cambiar tema"
          >
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {/* Avatar Dropdown */}
          <div ref={avatarRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              style={{
                width: 36, height: 36, borderRadius: 8, border: '1px solid var(--lf-border, #e5e7eb)',
                background: 'var(--lf-accent-soft, rgba(255, 87, 34, 0.08))', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 12,
                color: 'var(--lf-accent, #FF5722)',
              }}
            >
              {(userName || store.perfil?.nombre || 'Ingeniero').split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase()}
            </button>
            {avatarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  position: 'absolute', top: 44, right: 0, minWidth: 200,
                  background: 'var(--lf-surface, #ffffff)', border: '1px solid var(--lf-border, #e5e7eb)',
                  borderRadius: 12, boxShadow: 'var(--lf-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))', overflow: 'hidden', zIndex: 200,
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lf-border, #e5e7eb)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--lf-text-main, #1a1a2e)' }}>{userName || store.perfil?.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', marginTop: 2 }}>{store.perfil?.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--lf-accent, #FF5722)', marginTop: 6, fontWeight: 600 }}>{store.perfil?.rol}</div>
                </div>
                <button
                  onClick={() => { setAvatarOpen(false); onLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px',
                    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13,
                    color: 'var(--lf-danger, #FF1744)', textAlign: 'left', transition: 'background 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Cerrar sesión
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ CONTENT (Fades in like admin) ═══ */}
      <div className="ingeniero-content-wrapper" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={store.tabActiva}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%', overflowY: 'auto' }}
          >
            <div className="ingeniero-content">
              <ErrorBoundary nombre="Dashboard">
                <Suspense fallback={<DashboardSkeleton />}>
                  {store.tabActiva === 'dashboard' && <Dashboard />}
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary nombre="Flota">
                <Suspense fallback={<FlotaSkeleton />}>
                  {store.tabActiva === 'flota' && <Flota />}
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary nombre="Mantenimientos">
                <Suspense fallback={<MantenimientosSkeleton />}>
                  {store.tabActiva === 'mantenimientos' && <Mantenimientos />}
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary nombre="Perfil">
                <Suspense fallback={<PerfilSkeleton />}>
                  {store.tabActiva === 'perfil' && <PerfilIngeniero onLogout={onLogout} userName={userName} />}
                </Suspense>
              </ErrorBoundary>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ BOTTOM NAV (Mobile only) ═══ */}
      <nav className="lf-dash-bottom-nav" style={{
        height: 64, flexShrink: 0, display: 'none', alignItems: 'center', justifyContent: 'space-around',
        background: 'var(--lf-surface, #ffffff)', borderTop: '1px solid var(--lf-border, #e5e7eb)',
        padding: '0 4px', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100
      }}>
        {TABS.map((tab) => {
          const isActive = store.tabActiva === tab.id;
          const badge = tab.id === 'flota' && store.stats.alertasActivas > 0
            ? store.stats.alertasActivas
            : tab.id === 'mantenimientos' && store.stats.mantenimientosPendientes > 0
              ? store.stats.mantenimientosPendientes
              : null;

          return (
            <button
              key={tab.id}
              onClick={() => store.setTabActiva(tab.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: isActive ? 'var(--lf-accent, #FF5722)' : 'var(--lf-text-muted, #6B7280)',
                fontSize: 9, fontWeight: 600, padding: '4px 6px', position: 'relative'
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getTabIcon(tab.id, isActive)}
                {badge !== null && badge > 0 && (
                  <span className="ingeniero-nav-badge" style={{
                    position: 'absolute', top: -6, right: -10, minWidth: 16, height: 16,
                    borderRadius: '50%', background: 'var(--lf-error, #FF1744)', color: '#fff',
                    fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{badge}</span>
                )}
              </div>
              <span style={{ fontSize: 10, marginTop: 4 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Auxiliar Modals / Screens */}
      <CrearMantenimiento />
      <Inventario />

      {/* Responsive Styles (Same rules as admin dashboard) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .lf-nav-label { display: none; }
        }
        @media (max-width: 768px) {
          .lf-dash-desktop-nav { display: none !important; }
          .lf-dash-bottom-nav { display: flex !important; }
          .ingeniero-content-wrapper { padding-bottom: 64px !important; }
        }
      ` }} />
    </div>
  );
}
