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
  | 'inventario'
  | 'kardex'
  | 'pos'
  | 'facturacion'
  | 'reportes'
  | 'estadisticas'
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
    { id: 'kds', label: 'Monitor KDS', shortLabel: 'KDS', icon: <Clock size={19} /> },
    { id: 'pos', label: 'Caja Registradora POS', shortLabel: 'POS', icon: <CreditCard size={19} /> },
    { id: 'inventario', label: 'Inventario & Catálogo', shortLabel: 'Stock', icon: <Package size={19} /> },
    { id: 'kardex', label: 'Kardex & Movimientos', shortLabel: 'Kardex', icon: <SlidersHorizontal size={19} /> },
    { id: 'facturacion', label: 'Facturación & DGI', shortLabel: 'DGI', icon: <FileText size={19} /> },
    { id: 'reportes', label: 'Reportes Financieros', shortLabel: 'Excel', icon: <BarChart3 size={19} /> },
    { id: 'estadisticas', label: 'Métricas & Ventas', shortLabel: 'Métricas', icon: <TrendingUp size={19} /> },
    { id: 'configuracion', label: 'Configuración Tienda', shortLabel: 'Perfil', icon: <Settings size={19} /> },
  ];

  const handleExitAction = onReturnToClient || onLogout;
  const isAbierta = tiendaEstado === 'activo';

  return (
    <div className="flex flex-col h-full justify-between select-none">
      {/* ─── Encabezado de la Tienda (Identidad / Avatar) ─── */}
      <div className="p-2 sm:p-3 xl:p-4 border-b border-[var(--border)] flex flex-col items-center xl:items-start shrink-0">
        <div className="flex items-center gap-3 w-full justify-center xl:justify-start">
          {/* Avatar del Comercio */}
          <div className="relative shrink-0 w-10 h-10 xl:w-11 xl:h-11 rounded-xl overflow-hidden bg-[var(--primario)] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            {tiendaImagenUrl ? (
              <img
                src={tiendaImagenUrl}
                alt={tiendaNombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store size={20} />
            )}
            {/* Indicador de Estado (Verde / Ámbar) - Cero Emojis */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[var(--surface)] ${
                isAbierta ? 'bg-[var(--exito)]' : 'bg-[var(--warning)]'
              }`}
              title={isAbierta ? 'Tienda Abierta y Operativa' : 'Tienda Pausada'}
            />
          </div>

          {/* Información Expandida (Solo pantallas XL) */}
          <div className="hidden xl:flex flex-col min-w-0 flex-1">
            <h1 className="text-sm font-bold text-[var(--text)] truncate font-syne tracking-tight">
              {tiendaNombre || 'Mi Tienda'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isAbierta
                    ? 'bg-[var(--exito)]/10 text-[var(--exito)] border border-[var(--exito)]/20'
                    : 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20'
                }`}
              >
                {isAbierta ? 'Abierta' : 'Pausada'}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] capitalize truncate">
                {tiendaCategoria}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Lista Vertical de Módulos (Scrollable si pantalla pequeña) ─── */}
      <nav
        aria-label="Navegación de Tienda"
        className="flex-1 overflow-y-auto p-1.5 sm:p-2 xl:p-3 space-y-1 sm:space-y-1.5 no-scrollbar"
      >
        {modulos.map((m) => {
          const active = moduloActivo === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectModulo(m.id)}
              title={m.label}
              className={`w-full min-h-[44px] rounded-xl flex items-center transition-all duration-150 cursor-pointer ${
                active
                  ? 'bg-[var(--primario-soft)] text-[var(--primario)] font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]/60 font-medium'
              } justify-center xl:justify-start px-0 xl:px-3 gap-3`}
            >
              <span
                className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  active
                    ? 'bg-[var(--primario)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] group-hover:text-[var(--text)]'
                }`}
              >
                {m.icon}
              </span>
              <span className="hidden xl:inline text-xs font-semibold tracking-tight truncate">
                {m.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ─── Acciones Rápidas Inferiores (Tema & Salir) ─── */}
      <div className="p-1.5 sm:p-2 xl:p-3 border-t border-[var(--border)] flex flex-col gap-1 sm:gap-1.5 bg-[var(--surface)] shrink-0">
        {/* Toggle Modo Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          aria-label={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          className="w-full min-h-[44px] rounded-xl flex items-center justify-center xl:justify-start px-0 xl:px-3 gap-3 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]/60 transition-all cursor-pointer text-xs font-medium"
        >
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-[var(--primario)]">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </span>
          <span className="hidden xl:inline font-semibold">
            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </span>
        </button>

        {/* Salir / Volver a Cliente */}
        <button
          onClick={handleExitAction}
          title={onReturnToClient ? 'Volver a vista Cliente' : 'Cerrar sesión'}
          aria-label={onReturnToClient ? 'Volver a vista Cliente' : 'Cerrar sesión'}
          className="w-full min-h-[44px] rounded-xl flex items-center justify-center xl:justify-start px-0 xl:px-3 gap-3 text-[var(--peligro)] hover:bg-[var(--peligro)]/10 transition-all cursor-pointer text-xs font-semibold"
        >
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg">
            <LogOut size={18} />
          </span>
          <span className="hidden xl:inline truncate">
            {onReturnToClient ? 'Salir a Cliente' : 'Cerrar Sesión'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default TiendaNavbar;
