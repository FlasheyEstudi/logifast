'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  ChevronRight,
  MoreHorizontal,
  X,
  CheckCircle2,
} from '@/components/icons';
import SlidingPillTabBar, { type SlidingTabItem } from '@/components/ui/SlidingPillTabBar';

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
  pos: 'Caja POS',
  inventario: 'Inventario',
  kardex: 'Kardex',
  facturacion: 'Facturación',
  reportes: 'Reportes',
  estadisticas: 'Métricas',
  configuracion: 'Ajustes',
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
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const modulosDesktop: { id: TiendaModulo; label: string; icon: typeof Clock }[] = [
    { id: 'kds', label: 'Monitor KDS', icon: Clock },
    { id: 'pos', label: 'Caja POS', icon: CreditCard },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'kardex', label: 'Kardex', icon: SlidersHorizontal },
    { id: 'facturacion', label: 'Facturación', icon: FileText },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'estadisticas', label: 'Métricas', icon: TrendingUp },
    { id: 'configuracion', label: 'Ajustes', icon: Settings },
  ];

  // Módulos secundarios para el Drawer "Más" en móvil
  const modulosSecundarios: {
    id: TiendaModulo;
    titulo: string;
    descripcion: string;
    icon: typeof FileText;
  }[] = [
    {
      id: 'facturacion',
      titulo: 'Facturación & DGI',
      descripcion: 'Régimen fiscal, serie de facturas y ticket térmico',
      icon: FileText,
    },
    {
      id: 'reportes',
      titulo: 'Reportes Excel',
      descripcion: 'Cierre de caja, ventas diarias y exportación contable',
      icon: BarChart3,
    },
    {
      id: 'estadisticas',
      titulo: 'Métricas & Rendimiento',
      descripcion: 'Gráficos de ventas, horas pico y top de productos',
      icon: TrendingUp,
    },
    {
      id: 'configuracion',
      titulo: 'Ajustes del Comercio',
      descripcion: 'Horarios semanales, logo, banner y tarifas de envío',
      icon: Settings,
    },
  ];

  // 5 pestañas táctiles móviles (Opción A: estilo Cliente/Repartidor)
  const mobileNavItems: SlidingTabItem[] = [
    { key: 'pos', label: 'Caja', icon: <CreditCard size={18} /> },
    { key: 'kds', label: 'KDS', icon: <Clock size={18} /> },
    { key: 'inventario', label: 'Stock', icon: <Package size={18} /> },
    { key: 'kardex', label: 'Kardex', icon: <SlidersHorizontal size={18} /> },
    { key: 'mas', label: 'Más', icon: <MoreHorizontal size={18} /> },
  ];

  // Determinar pestaña activa en la barra móvil
  const isSecondaryActive = ['facturacion', 'reportes', 'estadisticas', 'configuracion'].includes(moduloActivo);
  const activeMobileKey = isSecondaryActive ? 'mas' : moduloActivo;

  const handleMobileNavChange = (key: string) => {
    if (key === 'mas') {
      setMoreDrawerOpen(true);
    } else {
      setMoreDrawerOpen(false);
      onSelectModulo(key as TiendaModulo);
    }
  };

  const handleExitAction = onReturnToClient || onLogout;
  const isAbierta = tiendaEstado === 'activo';

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HEADER SUPERIOR (Opción B: Sobrio Back-Office / Administrador)
          ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 w-full bg-[var(--surface)] border-b border-[var(--border)] shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
          
          {/* Left: Identidad Tienda + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs border border-[var(--border)]">
                {tiendaImagenUrl ? (
                  <img
                    src={tiendaImagenUrl}
                    alt={tiendaNombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store size={16} />
                )}
                <span
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-[var(--surface)] ${
                    isAbierta ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  title={isAbierta ? 'En Línea' : 'Pausada'}
                />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[var(--text)] truncate font-syne leading-tight">
                  {tiendaNombre || 'Mi Tienda'}
                </span>
                <div className="flex items-center gap-1.5 leading-none mt-0.5">
                  <span className="text-[10px] text-[var(--text-muted)] capitalize truncate">
                    {tiendaCategoria}
                  </span>
                  <span className="lg:hidden text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {TIENDA_MODULO_LABELS[moduloActivo]}
                  </span>
                </div>
              </div>
            </div>

            {/* Separador vertical y Breadcrumb (visible en tablet/desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[var(--border)] text-xs">
              <span className="text-[var(--text-muted)] font-medium">Tienda</span>
              <ChevronRight size={13} className="text-[var(--text-muted)]" />
              <span className="font-bold text-[var(--text)]">
                {TIENDA_MODULO_LABELS[moduloActivo]}
              </span>
            </div>
          </div>

          {/* Center: Tabs de Navegación de Escritorio (Desktop lg+) */}
          <nav
            aria-label="Módulos de tienda"
            className="hidden lg:flex items-center gap-1 bg-[var(--bg-alt)] p-1 rounded-xl border border-[var(--border)]"
          >
            {modulosDesktop.map((m) => {
              const active = moduloActivo === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectModulo(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Indicador En Vivo + Tema + Salir */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Indicador En Vivo (Estilo Admin Dashboard) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>En vivo</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              aria-label={isDark ? 'Modo Claro' : 'Modo Oscuro'}
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-blue-600" />}
            </button>

            {/* Exit / Return button */}
            <button
              onClick={handleExitAction}
              className="h-9 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              title={onReturnToClient ? 'Volver a App Cliente' : 'Cerrar Sesión'}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{onReturnToClient ? 'Salir a Cliente' : 'Salir'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          NAVBAR MÓVIL FLOTANTE (Opción A: Celular Estilo Cliente / Repartidor)
          Ubicado al fondo de la pantalla con SlidingPillTabBar
          ══════════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-3 left-0 right-0 z-40 flex justify-center px-3 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md">
          <SlidingPillTabBar
            items={mobileNavItems}
            activeKey={activeMobileKey}
            onChange={handleMobileNavChange}
            isDark={isDark}
            accentColor="var(--primario)"
            ariaLabel="Navegación del portal de tienda"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM SHEET "MÁS" (Menú Administrativo Móvil)
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {moreDrawerOpen && (
          <div
            onClick={() => setMoreDrawerOpen(false)}
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[var(--surface)] rounded-t-[28px] p-5 border-t border-[var(--border)] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Handle indicator */}
              <div className="w-12 h-1.5 rounded-full bg-[var(--border)] mx-auto mb-1" />

              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--text)] font-syne">
                    Gestión & Administración
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Módulos complementarios para tu comercio
                  </p>
                </div>
                <button
                  onClick={() => setMoreDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-alt)] text-[var(--text-muted)] flex items-center justify-center active:scale-95 transition-all"
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Lista de módulos secundarios con tarjetas táctiles */}
              <div className="grid grid-cols-1 gap-2.5">
                {modulosSecundarios.map((item) => {
                  const Icon = item.icon;
                  const isSelected = moduloActivo === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectModulo(item.id);
                        setMoreDrawerOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-blue-600/50 bg-blue-600/10 ring-2 ring-blue-600/20'
                          : 'border-[var(--border)] bg-[var(--bg-alt)]/50 hover:bg-[var(--bg-alt)]'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                        }`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text)] font-syne truncate">
                            {item.titulo}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                          {item.descripcion}
                        </p>
                      </div>

                      <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Info de tienda en pie del drawer */}
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Estado actual: <strong className={isAbierta ? 'text-emerald-500' : 'text-amber-500'}>{isAbierta ? 'En Línea' : 'Pausada'}</strong></span>
                <span className="font-mono text-[11px]">LogiFast Tienda 2.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default TiendaNavbar;
