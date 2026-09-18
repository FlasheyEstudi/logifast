'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
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
  children?: React.ReactNode;
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
  children,
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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  const modulosPrimarios: { id: TiendaModulo; label: string; icon: typeof Clock }[] = [
    { id: 'kds', label: 'Monitor KDS', icon: Clock },
    { id: 'pos', label: 'Caja POS', icon: CreditCard },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'kardex', label: 'Kardex', icon: SlidersHorizontal },
  ];

  // Módulos secundarios para el Dropdown "Más" en desktop/tablet y Menú Flotante en móvil
  const modulosSecundarios: {
    id: TiendaModulo;
    titulo: string;
    descripcion: string;
    descripcionCorta: string;
    icon: typeof FileText;
    tintClass: string;
  }[] = [
    {
      id: 'facturacion',
      titulo: 'Facturación & DGI',
      descripcion: 'Régimen fiscal, serie de facturas y ticket térmico',
      descripcionCorta: 'Fiscal & Tickets',
      icon: FileText,
      tintClass: 'bg-blue-500/15 text-blue-500 dark:text-blue-400',
    },
    {
      id: 'reportes',
      titulo: 'Reportes & Descargas',
      descripcion: 'Cierres de caja, ventas, Kardex y visor de reportes guardados',
      descripcionCorta: 'Reportes & Archivos',
      icon: BarChart3,
      tintClass: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
    },
    {
      id: 'estadisticas',
      titulo: 'Métricas & Rendimiento',
      descripcion: 'Gráficos de ventas, horas pico y top de productos',
      descripcionCorta: 'Ventas & Métricas',
      icon: TrendingUp,
      tintClass: 'bg-violet-500/15 text-violet-500 dark:text-violet-400',
    },
    {
      id: 'configuracion',
      titulo: 'Ajustes del Comercio',
      descripcion: 'Horarios semanales, logo, banner y tarifas de envío',
      descripcionCorta: 'Ajustes Tienda',
      icon: Settings,
      tintClass: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
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

  // Determinar si un submódulo secundario está activo
  const activeSecundario = modulosSecundarios.find((m) => m.id === moduloActivo);
  const isSecondaryActive = !!activeSecundario;
  const activeMobileKey = isSecondaryActive ? 'mas' : moduloActivo;

  const handleMobileNavChange = (key: string) => {
    if (key === 'mas') {
      setMoreDrawerOpen((prev) => !prev);
    } else {
      setMoreDrawerOpen(false);
      onSelectModulo(key as TiendaModulo);
    }
  };

  const handleExitAction = onReturnToClient || onLogout;
  const isAbierta = tiendaEstado === 'activo';

  return (
    <div className="lf-tienda-layout flex flex-col h-screen h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[var(--bg)] text-[var(--text)] font-sans transition-colors duration-200 selection:bg-primary/20 relative">
      {/* Resplandor ambiental de fondo estilo LogiFast 2.0 */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-64 bg-gradient-to-b from-[var(--primario)]/[0.04] to-transparent blur-3xl -z-10"
        aria-hidden="true"
      />

      {/* ══════════════════════════════════════════════════════════
          HEADER SUPERIOR FIJO (Sobrio Back-Office / Administrador)
          Sticky top: 0, z-index: 50, h-14, shrink-0, Full-Width Edge-to-Edge
          ══════════════════════════════════════════════════════════ */}
      <header
        className="lf-tienda-header sticky top-0 z-50 shrink-0 w-full bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-xs transition-colors"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="w-full px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
          
          {/* Left: Identidad Tienda + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar tienda sin borde duro */}
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-[var(--primario)] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
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
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--surface)] ${
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
                  <span className="md:hidden text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primario)]/10 text-[var(--primario)]">
                    {TIENDA_MODULO_LABELS[moduloActivo]}
                  </span>
                </div>
              </div>
            </div>

            {/* Breadcrumb sutil sin barras verticales bruscas */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 text-xs opacity-85">
              <span className="text-[var(--text-muted)] font-medium">Tienda</span>
              <ChevronRight size={13} className="text-[var(--text-muted)]" />
              <span className="font-bold text-[var(--text)]">
                {TIENDA_MODULO_LABELS[moduloActivo]}
              </span>
            </div>
          </div>

          {/* Center: Tabs de Navegación de Escritorio (Tablet & Desktop md+) */}
          <nav
            aria-label="Módulos de tienda"
            className="hidden md:flex items-center gap-1 bg-[var(--bg-alt)]/80 p-1 rounded-2xl"
          >
            {modulosPrimarios.map((m) => {
              const active = moduloActivo === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onSelectModulo(m.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                    active
                      ? 'bg-[var(--primario)] text-white shadow-xs font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/70'
                  }`}
                >
                  <Icon size={14} />
                  <span>{m.label}</span>
                </button>
              );
            })}

            {/* Dropdown "Más" para módulos complementarios */}
            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen((v) => !v)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                  isSecondaryActive
                    ? 'bg-[var(--primario)] text-white shadow-xs font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/70'
                }`}
              >
                <MoreHorizontal size={14} />
                <span>
                  {isSecondaryActive && activeSecundario
                    ? activeSecundario.titulo.split(' ')[0]
                    : 'Más'}
                </span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    moreMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-72 rounded-3xl bg-[var(--surface)]/95 shadow-xl p-2.5 z-50 backdrop-blur-2xl border border-[var(--border)]/40"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono mb-1 flex items-center justify-between opacity-80">
                      <span>Módulos de Gestión</span>
                      <span className="text-[10px] font-normal">4 opciones</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      {modulosSecundarios.map((m) => {
                        const Icon = m.icon;
                        const isActive = moduloActivo === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onSelectModulo(m.id);
                              setMoreMenuOpen(false);
                            }}
                            className={`flex items-start gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[var(--primario)]/10 text-[var(--primario)] font-bold'
                                : 'text-[var(--text)] hover:bg-[var(--bg-alt)]'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition-colors ${
                                isActive
                                  ? 'bg-[var(--primario)] text-white shadow-xs'
                                  : m.tintClass
                              }`}
                            >
                              <Icon size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold leading-tight truncate">
                                  {m.titulo}
                                </span>
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primario)] shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5 leading-normal">
                                {m.descripcion}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right: Indicador En Vivo + Tema + Salir (Sin bordes en iconos) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Indicador En Vivo */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>En vivo</span>
            </div>

            {/* Theme Toggle sin borde */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label={isDark ? 'Modo Claro' : 'Modo Oscuro'}
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-blue-600" />}
            </button>

            {/* Exit / Return button sin borde */}
            <button
              onClick={handleExitAction}
              className="h-9 px-3.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title={onReturnToClient ? 'Volver a App Cliente' : 'Cerrar Sesión'}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{onReturnToClient ? 'Salir a Cliente' : 'Salir'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          CONTENIDO CON SCROLL INDEPENDIENTE (FULL SCREEN TABLET/DESKTOP)
          Solo <main> hace scroll. El header y el footer NUNCA se mueven.
          ══════════════════════════════════════════════════════════ */}
      <main
        className="lf-tienda-main flex-1 overflow-y-auto w-full px-3 sm:px-6 py-4 pb-20 md:pb-6 focus:outline-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </main>

      {/* ══════════════════════════════════════════════════════════
          FOOTER MÓVIL STICKY (Abajo en Celular)
          Sticky bottom: 0, z-index: 50, shrink-0, 100% full-width
          ══════════════════════════════════════════════════════════ */}
      <footer
        className="lf-tienda-footer md:hidden sticky bottom-0 z-50 shrink-0 w-full bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] shadow-lg transition-colors flex items-center justify-center px-3"
        style={{
          paddingTop: '6px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
        }}
      >
        <div className="w-full max-w-md">
          <SlidingPillTabBar
            items={mobileNavItems}
            activeKey={activeMobileKey}
            onChange={handleMobileNavChange}
            isDark={isDark}
            accentColor="var(--primario)"
            ariaLabel="Navegación del portal de tienda"
          />
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════
          MENÚ FLOTANTE "MÁS" EN MÓVIL (Estilo Cápsula Flotante iOS)
          Alineado visualmente con la cápsula SlidingPillTabBar
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {moreDrawerOpen && (
          <>
            {/* Backdrop táctil para cerrar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMoreDrawerOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            />

            {/* Tarjeta Flotante Cápsula (Alineada directamente encima de la barra inferior) */}
            <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom,12px)+68px)] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.94 }}
                transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: isDark ? 'rgba(20, 22, 32, 0.92)' : 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(32px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(32px) saturate(190%)',
                  boxShadow: isDark
                    ? '0 20px 48px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.12)'
                    : '0 20px 48px rgba(0, 50, 150, 0.14), inset 0 1px 1.5px rgba(255, 255, 255, 0.9)',
                }}
                className="pointer-events-auto w-full max-w-sm rounded-[28px] p-4 flex flex-col gap-3"
              >
                {/* Header del menú flotante */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-syne text-[var(--text)] tracking-tight">
                      Módulos de Gestión
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--primario)]/10 text-[var(--primario)]">
                      Tienda
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMoreDrawerOpen(false)}
                    className="w-7 h-7 rounded-full bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                    aria-label="Cerrar menú"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Grid 2x2 de módulos complementarios (Diseño cápsula limpio sin bordes en iconos) */}
                <div className="grid grid-cols-2 gap-2">
                  {modulosSecundarios.map((item) => {
                    const Icon = item.icon;
                    const isSelected = moduloActivo === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectModulo(item.id);
                          setMoreDrawerOpen(false);
                        }}
                        style={{
                          background: isSelected
                            ? 'var(--primario)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                        }}
                        className={`p-3 rounded-2xl flex flex-col items-start gap-2.5 transition-all text-left cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'text-white shadow-md'
                            : 'text-[var(--text)] hover:bg-[var(--bg-alt)]'
                        }`}
                      >
                        {/* Icono sin borde: color suave o blanco si está activo */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : item.tintClass
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 w-full">
                          <span className={`text-xs font-bold font-syne block truncate leading-tight ${
                            isSelected ? 'text-white' : 'text-[var(--text)]'
                          }`}>
                            {item.titulo.split(' ')[0]}
                          </span>
                          <span className={`text-[10px] block truncate leading-tight mt-0.5 ${
                            isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'
                          }`}>
                            {item.descripcionCorta}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export const TiendaLayout = TiendaNavbar;
export default TiendaNavbar;
