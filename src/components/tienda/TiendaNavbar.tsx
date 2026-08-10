'use client';

import React from 'react';
import {
  ShoppingBag,
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
  const modulos: { id: TiendaModulo; label: string; icon: React.ReactNode }[] = [
    { id: 'kds', label: 'Monitor KDS (Pedidos)', icon: <Clock size={16} /> },
    { id: 'inventario', label: 'Inventario & Catálogo', icon: <Package size={16} /> },
    { id: 'kardex', label: 'Kardex Movimientos', icon: <SlidersHorizontal size={16} /> },
    { id: 'pos', label: 'Punto de Venta (POS)', icon: <CreditCard size={16} /> },
    { id: 'facturacion', label: 'Facturación & DGI', icon: <FileText size={16} /> },
    { id: 'reportes', label: 'Reportes Excel', icon: <BarChart3 size={16} /> },
    { id: 'configuracion', label: 'Perfil de Tienda', icon: <Settings size={16} /> },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        width: '100%',
        background: isDark ? 'rgba(18, 18, 24, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0066FF, #00C853)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
            }}
          >
            <Store size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: 'var(--text)' }}>
              {tiendaNombre || 'Mi Tienda'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                LogiFast Partner
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: tiendaEstado === 'activo' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                  color: tiendaEstado === 'activo' ? '#34C759' : '#FF9500',
                }}
              >
                {tiendaEstado === 'activo' ? 'Abierta' : 'Pausada'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs in Navbar */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
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
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: active
                    ? isDark
                      ? 'rgba(0, 102, 255, 0.2)'
                      : 'rgba(0, 102, 255, 0.1)'
                    : 'transparent',
                  color: active ? '#0066FF' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions (Theme & Logout) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleTheme}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
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
              padding: '0 12px',
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(255, 69, 58, 0.3)',
              background: 'rgba(255, 69, 58, 0.08)',
              color: '#FF453A',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
