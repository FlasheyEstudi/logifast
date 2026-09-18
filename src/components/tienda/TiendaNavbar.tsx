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
  TrendingUp,
} from '@/components/icons';

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
  kds: 'Monitor KDS',
  pos: 'Caja Registradora POS',
  inventario: 'Inventario & Catálogo',
  kardex: 'Kardex & Movimientos',
  facturacion: 'Facturación & DGI',
  reportes: 'Reportes Financieros',
  estadisticas: 'Métricas & Ventas',
  configuracion: 'Configuración Tienda',
};

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
  const modulos: { id: TiendaModulo; label: string; icon: typeof Clock }[] = [
    { id: 'kds', label: 'Monitor KDS', icon: Clock },
    { id: 'pos', label: 'Caja Registradora POS', icon: CreditCard },
    { id: 'inventario', label: 'Inventario & Catálogo', icon: Package },
    { id: 'kardex', label: 'Kardex & Movimientos', icon: SlidersHorizontal },
    { id: 'facturacion', label: 'Facturación & DGI', icon: FileText },
    { id: 'reportes', label: 'Reportes Financieros', icon: BarChart3 },
    { id: 'estadisticas', label: 'Métricas & Ventas', icon: TrendingUp },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const handleExitAction = onReturnToClient || onLogout;
  const isAbierta = tiendaEstado === 'activo';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        userSelect: 'none',
        background: 'var(--lf-surface, #ffffff)',
      }}
    >
      {/* ─── Cabecera de la Tienda (Identidad / Avatar) ─── */}
      <div
        style={{
          padding: '14px 12px',
          borderBottom: '1px solid var(--lf-border, rgba(60, 60, 67, 0.12))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--lf-accent, #007AFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
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
          {/* Indicador de Estado - CERO EMOJIS */}
          <span
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: isAbierta ? 'var(--lf-success, #34C759)' : 'var(--lf-warning, #FF9500)',
              border: '2px solid var(--lf-surface, #ffffff)',
            }}
            title={isAbierta ? 'Tienda Abierta' : 'Tienda Pausada'}
          />
        </div>

        <div className="hidden lg:flex" style={{ flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--lf-text-main, #1C1C1E)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: "var(--font-syne), 'Syne', sans-serif",
            }}
          >
            {tiendaNombre || 'Mi Tienda'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 6,
                background: isAbierta ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)',
                color: isAbierta ? 'var(--lf-success, #34C759)' : 'var(--lf-warning, #FF9500)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isAbierta ? 'Abierta' : 'Pausada'}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--lf-text-muted, #8E8E93)',
                textTransform: 'capitalize',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tiendaCategoria}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Lista Vertical de Navegación (8 Módulos) ─── */}
      <nav
        aria-label="Navegación vertical de la tienda"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
        className="no-scrollbar"
      >
        {modulos.map((item) => {
          const Icon = item.icon;
          const isActive = moduloActivo === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModulo(item.id)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 10px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--lf-accent-soft, rgba(0, 122, 255, 0.08))' : 'transparent',
                color: isActive ? 'var(--lf-accent, #007AFF)' : 'var(--lf-text-muted, #8E8E93)',
                transition: 'all 0.18s ease',
                width: '100%',
                minHeight: 44,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--lf-accent-soft, rgba(0, 122, 255, 0.04))';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive ? 'var(--lf-accent, #007AFF)' : 'transparent',
                  color: isActive ? '#ffffff' : 'inherit',
                  flexShrink: 0,
                  transition: 'background 0.18s ease, color 0.18s ease',
                }}
              >
                <Icon size={16} />
              </div>
              <span
                className="hidden lg:inline"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ─── Pie de Barra (Tema & Salir) ─── */}
      <div
        style={{
          padding: '10px 8px',
          borderTop: '1px solid var(--lf-border, rgba(60, 60, 67, 0.12))',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}
      >
        {/* Toggle Modo Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          aria-label={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 500,
            background: 'transparent',
            color: 'var(--lf-text-muted, #8E8E93)',
            transition: 'all 0.18s ease',
            width: '100%',
            minHeight: 44,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--lf-accent-soft, rgba(0, 122, 255, 0.04))')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lf-accent, #007AFF)',
              flexShrink: 0,
            }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </div>
          <span className="hidden lg:inline">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>

        {/* Salir / Retornar */}
        <button
          onClick={handleExitAction}
          title={onReturnToClient ? 'Volver a vista Cliente' : 'Cerrar sesión'}
          aria-label={onReturnToClient ? 'Volver a vista Cliente' : 'Cerrar sesión'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--lf-danger, #FF3B30)',
            transition: 'all 0.18s ease',
            width: '100%',
            minHeight: 44,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LogOut size={16} />
          </div>
          <span className="hidden lg:inline">{onReturnToClient ? 'Salir a Cliente' : 'Cerrar Sesión'}</span>
        </button>
      </div>
    </div>
  );
}

export default TiendaNavbar;
