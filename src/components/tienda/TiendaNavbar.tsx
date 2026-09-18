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
    { id: 'kds', label: 'Monitor KDS', shortLabel: 'KDS', icon: <Clock size={18} /> },
    { id: 'pos', label: 'Caja POS', shortLabel: 'POS', icon: <CreditCard size={18} /> },
    { id: 'inventario', label: 'Inventario', shortLabel: 'Stock', icon: <Package size={18} /> },
    { id: 'kardex', label: 'Kardex', shortLabel: 'Kardex', icon: <SlidersHorizontal size={18} /> },
    { id: 'facturacion', label: 'Facturación', shortLabel: 'DGI', icon: <FileText size={18} /> },
    { id: 'reportes', label: 'Reportes', shortLabel: 'Excel', icon: <BarChart3 size={18} /> },
    { id: 'estadisticas', label: 'Estadísticas', shortLabel: 'Métricas', icon: <TrendingUp size={18} /> },
    { id: 'configuracion', label: 'Perfil', shortLabel: 'Perfil', icon: <Settings size={18} /> },
  ];

  const handleExitAction = onReturnToClient || onLogout;
  const isAbierta = tiendaEstado === 'activo';

  return (
    <>
      {/* ─── HEADER SUPERIOR INTEGRADO PRO (DESKTOP & MOBILE) ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/90 dark:bg-[#0d121c]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="w-full max-w-[1440px] h-full mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Identidad del Comercio (Izquierda) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              {tiendaImagenUrl ? (
                <img
                  src={tiendaImagenUrl}
                  alt={tiendaNombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={20} />
              )}
              {/* Badge de estado en el avatar */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#0d121c] ${
                  isAbierta ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={isAbierta ? 'Tienda Abierta' : 'Tienda Pausada'}
              />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate tracking-tight font-syne">
                  {tiendaNombre || 'Mi Tienda'}
                </h1>
                <span
                  className={`hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    isAbierta
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isAbierta ? 'Abierta' : 'Pausada'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate -mt-0.5">
                Panel Comercial · {tiendaCategoria}
              </span>
            </div>
          </div>

          {/* Navegación por Módulos en Desktop & Tablet (Centro) */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            {modulos.map((m) => {
              const active = moduloActivo === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectModulo(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}>
                    {m.icon}
                  </span>
                  <span>{m.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Acciones Rápidas (Derecha) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle Día / Noche */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800/60 transition-all cursor-pointer"
              title={isDark ? 'Modo Día' : 'Modo Noche'}
              aria-label="Cambiar tema"
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-blue-600" />}
            </button>

            {/* Salir / Volver a Cliente */}
            <button
              onClick={handleExitAction}
              className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              title={onReturnToClient ? 'Volver a vista Cliente' : 'Cerrar sesión'}
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">{onReturnToClient ? 'Salir a Cliente' : 'Salir'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── NAVEGACIÓN MÓVIL Y TABLET (DOCK INFERIOR RESPONSIVO) ─── */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
        <nav className="h-16 rounded-2xl bg-white/95 dark:bg-[#0d121c]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl shadow-black/15 flex items-center px-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between w-full min-w-max gap-1 px-1">
            {modulos.map((m) => {
              const active = moduloActivo === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectModulo(m.id)}
                  className={`flex flex-col items-center justify-center min-w-[58px] sm:min-w-[68px] py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-9 h-7 rounded-lg flex items-center justify-center transition-all ${
                      active
                        ? 'bg-blue-600/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {m.icon}
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] leading-tight mt-0.5 tracking-tight ${
                      active ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {m.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
