'use client';

import React from 'react';
import {
  Package,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Store,
  Clock,
  SlidersHorizontal,
} from '@/components/icons';

export type TiendaModulo =
  | 'kds'
  | 'inventario'
  | 'kardex'
  | 'pos'
  | 'facturacion'
  | 'reportes'
  | 'configuracion';

interface TiendaNavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  tiendaNombre: string;
  tiendaEstado: string;
  moduloActivo: TiendaModulo;
  onSelectModulo: (mod: TiendaModulo) => void;
}

export function TiendaNavbar({
  isDark,
  toggleTheme,
  onLogout,
  tiendaNombre,
  tiendaEstado,
  moduloActivo,
  onSelectModulo,
}: TiendaNavbarProps) {
  const modulos: { id: TiendaModulo; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'kds', label: 'Monitor KDS', shortLabel: 'KDS', icon: <Clock size={18} /> },
    { id: 'pos', label: 'Caja POS', shortLabel: 'POS', icon: <CreditCard size={18} /> },
    { id: 'inventario', label: 'Inventario', shortLabel: 'Stock', icon: <Package size={18} /> },
    { id: 'kardex', label: 'Kardex', shortLabel: 'Kardex', icon: <SlidersHorizontal size={18} /> },
    { id: 'facturacion', label: 'Facturación', shortLabel: 'DGI', icon: <FileText size={18} /> },
    { id: 'reportes', label: 'Reportes', shortLabel: 'Excel', icon: <BarChart3 size={18} /> },
    { id: 'configuracion', label: 'Perfil', shortLabel: 'Perfil', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Banner de Sugerencia para Pantallas Móviles */}
      <div
        className="md:hidden"
        style={{
          background: 'linear-gradient(90deg, #0066FF, #00C853)',
          color: '#FFFFFF',
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 700,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Store size={14} />
        <span>Modo Móvil Tienda. Usa una Tablet o PC para la mejor experiencia POS de impresión.</span>
      </div>

      {/* Floating Center Pill Header Navigation (Desktop & Tablet) */}
      <header
        style={{
          position: 'sticky',
          top: 12,
          zIndex: 1000,
          width: '95%',
          maxWidth: 1350,
          margin: '0 auto',
          height: 64,
          borderRadius: 999,
          background: isDark ? 'rgba(15, 17, 26, 0.85)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 102, 255, 0.1)'
            : '0 12px 30px rgba(0, 0, 0, 0.08)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0066FF, #00C853)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
            }}
          >
            <Store size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
              {tiendaNombre || 'Mi Tienda'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0066FF' }}>
                LOGIFAST PARTNER
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: tiendaEstado === 'activo' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                  color: tiendaEstado === 'activo' ? '#34C759' : '#FF9500',
                }}
              >
                {tiendaEstado === 'activo' ? 'Abierto' : 'Pausado'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Pill Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            padding: '4px 0',
          }}
          className="no-scrollbar"
        >
          {modulos.map((m) => {
            const active = moduloActivo === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModulo(m.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: active
                    ? '1px solid rgba(0, 102, 255, 0.5)'
                    : '1px solid transparent',
                  background: active
                    ? 'linear-gradient(135deg, rgba(0, 102, 255, 0.25), rgba(0, 200, 83, 0.15))'
                    : 'transparent',
                  color: active ? '#0066FF' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: active ? '0 4px 14px rgba(0, 102, 255, 0.2)' : 'none',
                }}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions (Theme & Logout) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={toggleTheme}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Cambiar Tema"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 14px',
              height: 36,
              borderRadius: 999,
              border: '1px solid rgba(255, 69, 58, 0.3)',
              background: 'rgba(255, 69, 58, 0.1)',
              color: '#FF453A',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Floating Bottom Navigation Bar for Mobile Devices */}
      <nav
        className="md:hidden"
        style={{
          position: 'fixed',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '94%',
          maxWidth: 480,
          height: 60,
          borderRadius: 999,
          background: isDark ? 'rgba(15, 17, 26, 0.92)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 102, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
        }}
      >
        {modulos.map((m) => {
          const active = moduloActivo === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectModulo(m.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                border: 'none',
                background: 'transparent',
                color: active ? '#0066FF' : 'var(--text-muted)',
                fontSize: 10,
                fontWeight: active ? 800 : 500,
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 12,
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: active ? 'rgba(0, 102, 255, 0.15)' : 'transparent',
                }}
              >
                {m.icon}
              </div>
              <span>{m.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
