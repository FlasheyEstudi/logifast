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
      {/* Header Superior Limpio con Cápsulas Independientes */}
      <header
        style={{
          position: 'sticky',
          top: 10,
          zIndex: 900,
          width: '96%',
          maxWidth: 1400,
          margin: '0 auto',
          height: 60,
          borderRadius: 999,
          background: isDark ? 'rgba(15, 17, 26, 0.88)' : 'rgba(255, 255, 255, 0.94)',
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
          transition: 'all 0.3s ease',
        }}
      >
        {/* Lado Izquierdo: Foto/Logo de Perfil + Nombre de la Tienda + Categoría + Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #0066FF, #00C853)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)',
              border: isDark ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            {tiendaImagenUrl ? (
              <img
                src={tiendaImagenUrl}
                alt={tiendaNombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Store size={20} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
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
                  padding: '1px 6px',
                  borderRadius: 999,
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

        {/* Lado Derecho: Cápsulas Independientes (Cápsula de Tema y Cápsula de Salida/Retorno) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Cápsula Modo Día / Noche */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 14px',
              height: 36,
              borderRadius: 999,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(241, 245, 249, 0.9)',
              color: isDark ? '#FFFFFF' : '#0F172A',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isDark ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s ease',
            }}
            title={isDark ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
          >
            {isDark ? <Sun size={15} style={{ color: '#FFCC00' }} /> : <Moon size={15} style={{ color: '#0066FF' }} />}
            <span className="hidden sm:inline">{isDark ? 'Modo Día' : 'Modo Noche'}</span>
          </button>

          {/* Cápsula Única de Salida / Retorno */}
          <button
            onClick={handleExitAction}
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
              transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">{onReturnToClient ? 'Salir a Cliente' : 'Salir'}</span>
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
