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
  onReturnToClient?: () => void;
  tiendaNombre: string;
  tiendaEstado: string;
  moduloActivo: TiendaModulo;
  onSelectModulo: (mod: TiendaModulo) => void;
}

export function TiendaNavbar({
  isDark,
  toggleTheme,
  onLogout,
  onReturnToClient,
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
      {/* Header Superior Limpio (Sin la lista saturada de botones) */}
      <header
        style={{
          position: 'sticky',
          top: 10,
          zIndex: 900,
          width: '96%',
          maxWidth: 1400,
          margin: '0 auto',
          height: 58,
          borderRadius: 999,
          background: isDark ? 'rgba(15, 17, 26, 0.88)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 12px 30px rgba(0, 0, 0, 0.4)'
            : '0 8px 24px rgba(0, 0, 0, 0.06)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Brand / Logo + Nombre + Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0066FF, #00C853)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.35)',
            }}
          >
            <Store size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1, color: 'var(--text)' }}>
              {tiendaNombre || 'Mi Tienda'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0066FF' }}>
                LogiFast Partner
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: tiendaEstado === 'activo' ? 'rgba(52, 199, 89, 0.18)' : 'rgba(255, 149, 0, 0.18)',
                  color: tiendaEstado === 'activo' ? '#34C759' : '#FF9500',
                }}
              >
                {tiendaEstado === 'activo' ? 'Abierta' : 'Pausada'}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones de Cabecera (Modo Cliente, Tema y Salir) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onReturnToClient && (
            <button
              onClick={onReturnToClient}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 12px',
                height: 34,
                borderRadius: 999,
                border: '1px solid rgba(0, 102, 255, 0.3)',
                background: 'rgba(0, 102, 255, 0.1)',
                color: '#0066FF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Modo Cliente</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            style={{
              width: 34,
              height: 34,
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
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              height: 34,
              borderRadius: 999,
              border: '1px solid rgba(255, 69, 58, 0.3)',
              background: 'rgba(255, 69, 58, 0.1)',
              color: '#FF453A',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Navbar Flotante Inferior Unificado (Ocupa 96% del Celular y 96-100% de Tablet) */}
      <nav
        style={{
          position: 'fixed',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '96%',
          maxWidth: 720,
          height: 62,
          borderRadius: 999,
          background: isDark ? 'rgba(15, 17, 26, 0.92)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: isDark
            ? '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(0, 102, 255, 0.2)'
            : '0 14px 32px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 6px',
          overflow: 'hidden',
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
                flex: 1,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                color: active ? '#0066FF' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 2px',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: active
                    ? isDark
                      ? 'rgba(0, 102, 255, 0.25)'
                      : 'rgba(0, 102, 255, 0.12)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {m.icon}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 800 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {m.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
