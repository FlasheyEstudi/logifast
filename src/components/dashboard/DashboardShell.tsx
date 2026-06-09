'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutGrid, Package, Bike, Users, BarChart3, Settings,
  Sun, Moon, LogOut, Bell,
} from 'lucide-react';
import { useStore, type ModuleKey } from '@/lib/store';
import ModuleOverview from './ModuleOverview';
import ModulePedidos from './ModulePedidos';
import ModuleFlota from './ModuleFlota';
import ModuleRepartidores from './ModuleRepartidores';
import ModuleReportes from './ModuleReportes';
import ModuleConfig from './ModuleConfig';

const NAV_ITEMS: { key: ModuleKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'overview', label: 'Vista General', icon: LayoutGrid },
  { key: 'pedidos', label: 'Pedidos', icon: Package },
  { key: 'flota', label: 'Flota', icon: Bike },
  { key: 'repartidores', label: 'Repartidores', icon: Users },
  { key: 'reportes', label: 'Reportes', icon: BarChart3 },
  { key: 'config', label: 'Config', icon: Settings },
];

export default function DashboardShell({ isDark, toggleTheme, onLogout }: { isDark: boolean; toggleTheme: () => void; onLogout: () => void }) {
  const { activeModule, setActiveModule, moduleFade, alerts } = useStore();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const highAlerts = alerts.filter((a) => a.severidad === 'alta').length;

  const renderModule = () => {
    switch (activeModule) {
      case 'overview': return <ModuleOverview isDark={isDark} />;
      case 'pedidos': return <ModulePedidos />;
      case 'flota': return <ModuleFlota isDark={isDark} />;
      case 'repartidores': return <ModuleRepartidores />;
      case 'reportes': return <ModuleReportes />;
      case 'config': return <ModuleConfig />;
      default: return <ModuleOverview isDark={isDark} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--lf-bg-base)' }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: 'var(--lf-surface)', borderBottom: '1px solid var(--lf-border)',
        zIndex: 100,
      }}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: 'var(--lf-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 14, color: '#fff',
          }}>LF</div>
          <span className="font-serif" style={{ fontSize: 20, color: 'var(--lf-text-main)', letterSpacing: '-0.02em' }}>LOGIFAST</span>
        </div>

        {/* Center: Desktop tabs */}
        <nav style={{ display: 'flex', gap: 2 }} className="lf-dash-desktop-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveModule(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: isActive ? 'var(--lf-accent-soft)' : 'transparent',
                  color: isActive ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Notification bell */}
          <button style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid var(--lf-border)',
            background: 'var(--lf-surface)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', position: 'relative', color: 'var(--lf-text-muted)',
          }} onClick={() => setActiveModule('overview')}>
            <Bell size={16} />
            {highAlerts > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%',
                background: 'var(--lf-danger)',
              }} />
            )}
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
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
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
              <div style={{
                position: 'absolute', top: 44, right: 0, minWidth: 180,
                background: 'var(--lf-surface)', border: '1px solid var(--lf-border)',
                borderRadius: 12, boxShadow: 'var(--lf-shadow-lg)', overflow: 'hidden', zIndex: 200,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lf-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Admin Demo</div>
                  <div style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>admin@logifast.com</div>
                </div>
                <button
                  onClick={() => { setAvatarOpen(false); onLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px',
                    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13,
                    color: 'var(--lf-danger)', textAlign: 'left',
                  }}
                >
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {renderModule()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ BOTTOM NAV (mobile) ═══ */}
      <nav className="lf-dash-bottom-nav" style={{
        height: 64, flexShrink: 0, display: 'none', alignItems: 'center', justifyContent: 'space-around',
        background: 'var(--lf-surface)', borderTop: '1px solid var(--lf-border)',
        padding: '0 8px',
      }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveModule(item.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: isActive ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
                fontSize: 10, fontWeight: 600, padding: '4px 8px',
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Responsive styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .lf-dash-desktop-nav { display: none !important; }
          .lf-dash-bottom-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
