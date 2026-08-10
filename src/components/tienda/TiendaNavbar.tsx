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
  tiendaCategoria?: string;
  tiendaImagenUrl?: string | null;
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
  tiendaCategoria = 'tienda',
  tiendaImagenUrl,
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

  const handleExitAction = onReturnToClient || onLogout;

  return (
    <>
      {/* ─── CÁPSULA FLOTANTE IZQUIERDA FIJA EN LA PARTE MÁS ALTA (Identidad Comercio) ─── */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: 16,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px 6px 8px',
          borderRadius: 9999,
          background: isDark ? 'rgba(15, 17, 26, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: isDark
            ? '0 12px 30px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(0, 0, 0, 0.08)',
          maxWidth: 'calc(60vw - 20px)',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9999,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0066FF, #00C853)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0, 102, 255, 0.35)',
            border: isDark ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid rgba(255, 255, 255, 0.9)',
          }}
        >
          {tiendaImagenUrl ? (
            <img
              src={tiendaImagenUrl}
              alt={tiendaNombre}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Store size={18} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              lineHeight: 1.1,
              color: isDark ? '#FFFFFF' : '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {tiendaNombre || 'Mi Tienda'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#0066FF',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {tiendaCategoria}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 9999,
                background: tiendaEstado === 'activo' ? 'rgba(52, 199, 89, 0.18)' : 'rgba(255, 149, 0, 0.18)',
                color: tiendaEstado === 'activo' ? '#34C759' : '#FF9500',
                whiteSpace: 'nowrap',
              }}
            >
              {tiendaEstado === 'activo' ? 'Abierta' : 'Pausada'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── CÁPSULAS FLOTANTES DERECHAS FIJAS EN LA PARTE MÁS ALTA (Acciones Independientes) ─── */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Cápsula Modo Día / Noche */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 14px',
            height: 38,
            borderRadius: 9999,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.12)',
            background: isDark ? 'rgba(15, 17, 26, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            color: isDark ? '#FFFFFF' : '#0F172A',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: isDark
              ? '0 10px 25px rgba(0, 0, 0, 0.4)'
              : '0 6px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease',
          }}
          title={isDark ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
        >
          {isDark ? <Sun size={15} style={{ color: '#FFCC00' }} /> : <Moon size={15} style={{ color: '#0066FF' }} />}
          <span className="hidden sm:inline">{isDark ? 'Modo Día' : 'Modo Noche'}</span>
        </button>

        {/* Cápsula Única Salir a Cliente / Salir */}
        <button
          onClick={handleExitAction}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 14px',
            height: 38,
            borderRadius: 9999,
            border: '1px solid rgba(255, 69, 58, 0.35)',
            background: isDark ? 'rgba(255, 69, 58, 0.18)' : 'rgba(255, 69, 58, 0.12)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            color: '#FF453A',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(255, 69, 58, 0.15)',
            transition: 'all 0.2s ease',
          }}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">{onReturnToClient ? 'Salir a Cliente' : 'Salir'}</span>
        </button>
      </div>

      {/* ─── DOCK FLOTANTE INFERIOR DE NAVEGACIÓN DEDICADO ─── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '96%',
          maxWidth: 680,
          height: 62,
          borderRadius: 9999,
          background: isDark ? 'rgba(15, 17, 26, 0.94)' : 'rgba(255, 255, 255, 0.96)',
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
          transition: 'all 0.3s ease',
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
                color: active ? '#0066FF' : isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B',
                cursor: 'pointer',
                padding: '4px 2px',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 9999,
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
