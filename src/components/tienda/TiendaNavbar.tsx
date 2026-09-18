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
    { id: 'configuracion', label: 'Configuración Tienda', icon: Settings },
  ];

  const handleExitAction = onReturnToClient || onLogout;
  const isAbierta = tiendaEstado === 'activo';

  return (
    <nav
      aria-label="Dock de Navegación Vertical Estilo Mac"
      className="flex flex-col items-center py-2.5 px-2 rounded-full bg-white/85 dark:bg-[#0f111a]/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/60 transition-all duration-300"
    >
      {/* ─── Avatar de la Tienda en el Dock (Miniatura con Estado) ─── */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white/80 dark:border-white/20 mb-1 shrink-0">
        {tiendaImagenUrl ? (
          <img
            src={tiendaImagenUrl}
            alt={tiendaNombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <Store size={18} />
        )}
        {/* Indicador de Estado - Cero Emojis */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0f111a] ${
            isAbierta ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          title={isAbierta ? 'Tienda Abierta y Operativa' : 'Tienda Pausada'}
        />
      </div>

      {/* Separador de Cristal */}
      <div className="w-5 h-[1px] bg-black/10 dark:bg-white/10 my-1 shrink-0" />

      {/* ─── 8 Módulos Verticales con Tooltip Flotante Estilo macOS Dock ─── */}
      <div className="flex flex-col items-center gap-1.5 my-0.5">
        {modulos.map((m) => {
          const active = moduloActivo === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => onSelectModulo(m.id)}
              className={`relative group w-11 h-11 min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/35 scale-105'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              aria-label={m.label}
            >
              <Icon size={19} />

              {/* Tooltip flotante hacia la izquierda (estilo macOS Dock) */}
              <span className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 -translate-x-1 group-hover:translate-x-0 z-50">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Separador de Cristal */}
      <div className="w-5 h-[1px] bg-black/10 dark:bg-white/10 my-1 shrink-0" />

      {/* ─── Acciones de Pie del Dock (Tema y Salir) ─── */}
      <div className="flex flex-col items-center gap-1.5 mt-0.5">
        {/* Toggle Tema (Día / Noche) */}
        <button
          onClick={toggleTheme}
          className="relative group w-11 h-11 min-h-[44px] rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
          aria-label={isDark ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-600" />}
          <span className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 -translate-x-1 group-hover:translate-x-0 z-50">
            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </span>
        </button>

        {/* Salir / Retornar a Cliente */}
        <button
          onClick={handleExitAction}
          className="relative group w-11 h-11 min-h-[44px] rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
          aria-label={onReturnToClient ? 'Salir a Cliente' : 'Cerrar Sesión'}
        >
          <LogOut size={17} />
          <span className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 -translate-x-1 group-hover:translate-x-0 z-50">
            {onReturnToClient ? 'Salir a Cliente' : 'Cerrar Sesión'}
          </span>
        </button>
      </div>
    </nav>
  );
}

export default TiendaNavbar;
