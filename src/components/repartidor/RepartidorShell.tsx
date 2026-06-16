'use client';

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Bike, ClipboardList, User } from 'lucide-react';
import { useRepartidorStore } from '@/lib/repartidor-store';

/* ═══════════════════════════════════════════════
   DYNAMIC MODULE IMPORTS
   ═══════════════════════════════════════════════ */

const RepartidorServicio = dynamic(() => import('./RepartidorServicio'), { ssr: false });
const RepartidorHistorial = dynamic(() => import('./RepartidorHistorial'), { ssr: false });
const RepartidorPerfil = dynamic(() => import('./RepartidorPerfil'), { ssr: false });
const RepartidorNotificacionOrden = dynamic(() => import('./RepartidorNotificacionOrden'), { ssr: false });
const RepartidorChat = dynamic(() => import('./RepartidorChat'), { ssr: false });
const RepartidorIncidencia = dynamic(() => import('./RepartidorIncidencia'), { ssr: false });
const RepartidorDetalleServicio = dynamic(() => import('./RepartidorDetalleServicio'), { ssr: false });

/* ═══════════════════════════════════════════════
   SNACKBAR CONTEXT
   ═══════════════════════════════════════════════ */

interface SnackbarData {
  message: string;
  action?: string;
  onAction?: () => void;
}

const SnackbarContext = createContext<(data: SnackbarData | null) => void>(() => {});

export function useRepartidorSnackbar() {
  return useContext(SnackbarContext);
}

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface RepartidorShellProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  userName: string;
}

/* ═══════════════════════════════════════════════
   NAV CONFIG
   ═══════════════════════════════════════════════ */

type RepartidorTab = 'servicio' | 'historial' | 'perfil';

const NAV_ITEMS: { key: RepartidorTab; label: string; icon: React.ReactNode }[] = [
  { key: 'servicio', label: 'Servicio', icon: <Bike size={22} /> },
  { key: 'historial', label: 'Historial', icon: <ClipboardList size={22} /> },
  { key: 'perfil', label: 'Perfil', icon: <User size={22} /> },
];

/* ═══════════════════════════════════════════════
   STATUS BAR SVG ICONS
   ═══════════════════════════════════════════════ */

function SignalIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="9" width="3" height="3" rx="0.5" />
      <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
      <rect x="9" y="3" width="3" height="9" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M8 10.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" fill="currentColor" stroke="none" transform="translate(0,-2)" />
      <path d="M4.93 8.47a4.36 4.36 0 016.14 0" strokeWidth="1.4" strokeLinecap="round" transform="translate(0,-1)" />
      <path d="M2.1 5.64a7.8 7.8 0 0111.8 0" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0.5" width="19" height="11" rx="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <rect x="1.5" y="2" width="14" height="8" rx="1" />
      <rect x="19.5" y="3.5" width="2" height="5" rx="0.8" opacity="0.4" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorShell({ isDark, toggleTheme, onLogout, userName }: RepartidorShellProps) {
  const {
    pantallaActiva,
    setPantalla,
    conectado,
    enServicio,
    ordenAsignadaPendiente,
    chatAbierto,
    incidenciaAbierta,
    servicioDetalle,
    simularMovimiento,
  } = useRepartidorStore();

  const [snackbar, setSnackbar] = useState<SnackbarData | null>(null);
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clock, setClock] = useState('9:41');

  /* ─── SIMULATION LOOP (5s) ─── */
  useEffect(() => {
    if (!conectado) return;
    const interval = setInterval(() => {
      simularMovimiento();
    }, 5000);
    return () => clearInterval(interval);
  }, [conectado, simularMovimiento]);

  /* ─── CLOCK (10s) ─── */
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes();
      setClock(`${h}:${m.toString().padStart(2, '0')}`);
    };
    update();
    const i = setInterval(update, 10000);
    return () => clearInterval(i);
  }, []);

  /* ─── SNACKBAR AUTO-DISMISS ─── */
  const showSnackbar = useCallback((data: SnackbarData | null) => {
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
    setSnackbar(data);
    if (data) {
      snackbarTimerRef.current = setTimeout(() => setSnackbar(null), 4000);
    }
  }, []);

  const handleNav = useCallback(
    (tab: RepartidorTab) => {
      setPantalla(tab);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          /* ignore */
        }
      }
    },
    [setPantalla]
  );

  const renderScreen = () => {
    switch (pantallaActiva) {
      case 'servicio':
        return <RepartidorServicio />;
      case 'historial':
        return <RepartidorHistorial />;
      case 'perfil':
        return (
          <RepartidorPerfil
            isDark={isDark}
            toggleTheme={toggleTheme}
            onLogout={onLogout}
            userName={userName}
          />
        );
      default:
        return <RepartidorServicio />;
    }
  };

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'background-color 0.4s ease, color 0.3s ease',
        }}
      >
        {/* ═══════ NATIVE STATUS BAR ═══════ */}
        <div
          className="lf-rep-status-bar"
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
          <span
            className="font-mono"
            style={{ fontSize: 14, fontWeight: 500, color: 'var(--md-on-surface)', lineHeight: 1 }}
          >
            {clock}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--md-on-surface)' }}>
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* ═══════ ANDROID GESTURE BAR ═══════ */}
        <div
          className="lf-rep-gesture-bar"
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

        {/* ═══════ CONTENT AREA ═══════ */}
        <main
          className="lf-rep-content"
          style={{
            flex: 1,
            paddingTop: 'calc(20px + max(24px, env(safe-area-inset-top, 24px)))',
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              margin: '0 auto',
              paddingLeft: 16,
              paddingRight: 16,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={pantallaActiva}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* ═══════ BOTTOM NAV — Material 3 Pill Indicator ═══════ */}
        <nav
          className="lf-rep-bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            background: 'var(--md-surface)',
            borderTop: '1px solid var(--md-outline-variant)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            transition: 'background-color 0.3s ease, border-color 0.3s ease',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pantallaActiva === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                  padding: '6px 0 8px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  transition: 'color 0.2s ease',
                  position: 'relative',
                  flex: 1,
                  maxWidth: 96,
                  minHeight: 56,
                }}
              >
                <span
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 32,
                    borderRadius: 16,
                    background: isActive ? 'var(--md-primary-container)' : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
                    transition: 'color 0.2s ease',
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ═══════ SNACKBAR ═══════ */}
        <AnimatePresence>
          {snackbar && (
            <motion.div
              key="rep-snackbar"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="lf-rep-snackbar"
              style={{
                position: 'fixed',
                bottom: 96,
                left: 16,
                right: 16,
                zIndex: 9998,
                background: 'var(--md-inverse-surface)',
                color: 'var(--md-inverse-on-surface)',
                borderRadius: 8,
                padding: '14px 16px',
                boxShadow: 'var(--md-elevation-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 400,
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
                    color: 'var(--md-inverse-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    padding: '4px 8px',
                    borderRadius: 4,
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

        {/* ═══════ OVERLAYS ═══════ */}
        <AnimatePresence>
          {ordenAsignadaPendiente && <RepartidorNotificacionOrden />}
        </AnimatePresence>

        <AnimatePresence>{chatAbierto && <RepartidorChat />}</AnimatePresence>

        <AnimatePresence>{incidenciaAbierta && <RepartidorIncidencia />}</AnimatePresence>

        <AnimatePresence>{servicioDetalle && <RepartidorDetalleServicio />}</AnimatePresence>

        {/* ═══════ RESPONSIVE STYLES ═══════ */}
        <style>{`
          .lf-rep-status-bar,
          .lf-rep-gesture-bar { display: flex !important; }
          @media (min-width: 1024px) {
            .lf-rep-status-bar,
            .lf-rep-gesture-bar { display: none !important; }
            .lf-rep-snackbar {
              max-width: 480px;
              left: 50% !important;
              right: auto !important;
              transform: translateX(-50%);
            }
          }
        `}</style>
      </div>
    </SnackbarContext.Provider>
  );
}
