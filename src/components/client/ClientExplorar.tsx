'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Heart, Star, Clock, MapPin, Truck,
  ChevronRight, X, ShoppingBag, Check, Utensils, Store, Pill,
  Gift, ShoppingCart, Smartphone, Dumbbell, Map, CheckCircle,
} from 'lucide-react';
import { useMarketplaceStore, type Tienda, type TiendaCategoria, CATEGORIAS } from '@/lib/marketplace-store';
import { useStore } from '@/lib/store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientExplorarProps {
  isDark: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const DIA_MAP: Record<number, string> = {
  0: 'dom',
  1: 'lun',
  2: 'mar',
  3: 'mie',
  4: 'jue',
  5: 'vie',
  6: 'sab',
};

function isOpenNow(horario: Record<string, { abre: string; cierra: string }>): boolean {
  const now = new Date();
  const diaKey = DIA_MAP[now.getDay()];
  const h = horario[diaKey];
  if (!h || !h.abre || !h.cierra) return false;
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const [abH, abM] = h.abre.split(':').map(Number);
  const [ciH, ciM] = h.cierra.split(':').map(Number);
  const abreMin = abH * 60 + abM;
  const cierraMin = ciH * 60 + ciM;
  return currentMin >= abreMin && currentMin <= cierraMin;
}

function categoriaLabel(key: TiendaCategoria): string {
  const found = CATEGORIAS.find((c) => c.key === key);
  return found ? found.label : key;
}

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  utensils: Utensils,
  store: Store,
  pill: Pill,
  gift: Gift,
  'shopping-cart': ShoppingCart,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
};

function CategoryIcon({ name, size = 20, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} style={style} />;
}

const FILTROS_SECUNDARIOS = [
  { key: 'cerca', label: 'Cerca de mi', icon: MapPin },
  { key: 'calificados', label: 'Mejor calificados', icon: Star },
  { key: 'envio_gratis', label: 'Envio gratis', icon: Truck },
  { key: 'abierto', label: 'Abierto ahora', icon: Clock },
  { key: 'promo', label: 'Con promo', icon: ShoppingBag },
] as const;

/* ═══════════════════════════════════════════════
   HAPTIC
   ═══════════════════════════════════════════════ */

function haptic(ms = 10) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

/* ═══════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' },
  }),
};

const dropdownVariant = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } },
};

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientExplorar({ isDark, userName, onNavigate, onOpenTracking, onOpenChat }: ClientExplorarProps) {
  const {
    tiendas,
    productos,
    explorarCategoria,
    explorarFiltros,
    explorarSearch,
    favoritosTiendas,
    setExplorarCategoria,
    toggleExplorarFiltro,
    setExplorarSearch,
    setTiendaSeleccionada,
    toggleFavoritoTienda,
    isFavoritoTienda,
  } = useMarketplaceStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const [localSearch, setLocalSearch] = useState(explorarSearch);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [pressedCard, setPressedCard] = useState<string | null>(null);

  /* ─── Filtered tiendas ─── */
  const filteredTiendas = useMemo(() => {
    let result = tiendas.filter((t) => t.estado === 'activo');

    if (explorarCategoria !== 'todos') {
      result = result.filter((t) => t.categoria === explorarCategoria);
    }

    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q)
      );
    }

    if (explorarFiltros.includes('calificados')) {
      result = [...result].sort((a, b) => b.calificacion - a.calificacion);
    }
    if (explorarFiltros.includes('envio_gratis')) {
      result = result.filter((t) => t.costoEnvio <= 20);
    }
    if (explorarFiltros.includes('abierto')) {
      result = result.filter((t) => isOpenNow(t.horario));
    }
    if (explorarFiltros.includes('promo')) {
      result = result.filter((t) => t.badges.some((b) => b === 'Promo'));
    }
    if (explorarFiltros.includes('favoritos')) {
      result = result.filter((t) => isFavoritoTienda(t.id));
    }

    return result;
  }, [tiendas, explorarCategoria, localSearch, explorarFiltros, isFavoritoTienda]);

  /* ─── Search results: grouped ─── */
  const searchResults = useMemo(() => {
    if (!localSearch.trim()) return { tiendas: [] as Tienda[], productos: [] as typeof productos };
    const q = localSearch.trim().toLowerCase();
    const matchedTiendas = tiendas.filter(
      (t) =>
        t.estado === 'activo' &&
        (t.nombre.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q))
    );
    const matchedProductos = productos.filter(
      (p) =>
        p.disponible &&
        (p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q))
    );
    return { tiendas: matchedTiendas.slice(0, 5), productos: matchedProductos.slice(0, 5) };
  }, [localSearch, tiendas, productos]);

  const showDropdown = searchFocused && localSearch.trim().length > 0;

  /* ─── Handlers ─── */
  function handleSearchChange(val: string) {
    setLocalSearch(val);
    setExplorarSearch(val);
  }

  function handleClearSearch() {
    setLocalSearch('');
    setExplorarSearch('');
  }

  function handleTiendaClick(tiendaId: string) {
    setTiendaSeleccionada(tiendaId);
    onNavigate('explorar');
  }

  const handleCategoryTap = useCallback((key: TiendaCategoria | 'todos') => {
    haptic(10);
    setExplorarCategoria(key);
  }, [setExplorarCategoria]);

  const handleFilterTap = useCallback((key: string) => {
    haptic(10);
    toggleExplorarFiltro(key as typeof explorarFiltros[number]);
  }, [toggleExplorarFiltro]);

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* ─── 1. HEADER (glassmorphism, 56px, sticky) ─── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'var(--lf-glass-bg)',
          backdropFilter: 'blur(var(--lf-glass-blur))',
          WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
          borderBottom: '1px solid var(--lf-glass-border)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Explorar
          </h1>
        </div>
        <button
          onClick={() => { haptic(10); setShowFilterPanel(!showFilterPanel); }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: showFilterPanel ? 'var(--primario-soft)' : 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <SlidersHorizontal size={18} style={{ color: showFilterPanel ? 'var(--primario)' : 'var(--text-muted)' }} />
        </button>
      </div>

      {/* ─── Location text below header ─── */}
      <div style={{ padding: '8px 16px 0' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--text-muted)',
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <MapPin size={12} style={{ color: 'var(--primario)' }} />
          <span>Col. Los Robles</span>
          <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* ─── Filter panel (toggle) ─── */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', padding: '0 16px' }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                padding: '12px 0',
              }}
            >
              {FILTROS_SECUNDARIOS.map((f) => {
                const isActive = explorarFiltros.includes(f.key);
                const IconComp = f.icon;
                return (
                  <button
                    key={f.key}
                    onClick={() => handleFilterTap(f.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 16,
                      border: `1px solid ${isActive ? 'var(--primario)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      background: isActive ? 'var(--primario)' : 'var(--surface)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <IconComp size={13} />
                    {f.label}
                  </button>
                );
              })}
              {explorarFiltros.length > 0 && (
                <button
                  onClick={() => {
                    haptic(10);
                    explorarFiltros.forEach((f) => toggleExplorarFiltro(f));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    borderRadius: 16,
                    border: '1px solid var(--peligro)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: 'transparent',
                    color: 'var(--peligro)',
                    transition: 'all 0.2s',
                  }}
                >
                  <X size={13} />
                  Limpiar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. BUSCADOR (48px, glassmorphism pill) ─── */}
      <div style={{ position: 'relative', padding: '8px 16px 0', zIndex: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--lf-glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1.5px solid ${searchFocused ? 'var(--primario)' : 'var(--lf-glass-border)'}`,
            borderRadius: 28,
            height: 48,
            padding: '0 16px 0 44px',
            position: 'relative',
            transition: 'border-color 0.2s',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: searchFocused ? 'var(--primario)' : 'var(--text-muted)',
              transition: 'color 0.2s',
            }}
          />
          <input
            type="text"
            placeholder="Buscar tiendas o productos..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              fontFamily: "'DM Sans', sans-serif",
              color: 'var(--text)',
            }}
          />
          {localSearch && (
            <button
              onClick={handleClearSearch}
              style={{
                background: 'var(--bg-alt)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              variants={dropdownVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'absolute',
                top: '100%',
                left: 16,
                right: 16,
                zIndex: 50,
                marginTop: 6,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                boxShadow: 'var(--lf-shadow-float)',
                overflow: 'hidden',
                maxHeight: 360,
              }}
              className="lf-scrollbar"
            >
              {/* Tiendas section */}
              {searchResults.tiendas.length > 0 && (
                <div style={{ padding: '12px 14px 6px 14px' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Tiendas
                  </div>
                  {searchResults.tiendas.map((t) => (
                    <button
                      key={t.id}
                      onMouseDown={() => handleTiendaClick(t.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 10,
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: t.logoColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 700,
                            fontSize: 13,
                            color: '#fff',
                          }}
                        >
                          {t.logoIniciales}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text)',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {t.nombre}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {categoriaLabel(t.categoria)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Productos section */}
              {searchResults.productos.length > 0 && (
                <div style={{ padding: '6px 14px 12px 14px' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Productos
                  </div>
                  {searchResults.productos.map((p) => {
                    const tienda = tiendas.find((t) => t.id === p.tiendaId);
                    return (
                      <button
                        key={p.id}
                        onMouseDown={() => {
                          if (tienda) handleTiendaClick(tienda.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '8px 6px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: 10,
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: p.imagenColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ShoppingBag size={14} style={{ color: '#fff' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--text)',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {p.nombre}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {tienda?.nombre} · C${p.precio}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {searchResults.tiendas.length === 0 && searchResults.productos.length === 0 && (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    fontSize: 14,
                    color: 'var(--text-muted)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  No se encontraron resultados
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── 3. CATEGORIAS HORIZONTALES (sticky) ─── */}
      <div
        style={{
          position: 'sticky',
          top: 56,
          zIndex: 10,
          background: 'var(--lf-glass-bg)',
          backdropFilter: 'blur(var(--lf-glass-blur))',
          WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
          borderBottom: '1px solid var(--lf-glass-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '10px 16px',
            scrollbarWidth: 'none',
          }}
        >
          {/* "Todas" pill */}
          <button
            onClick={() => handleCategoryTap('todos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 16px',
              borderRadius: 'var(--lf-pill-radius, 100px)',
              border: `1.5px solid ${explorarCategoria === 'todos' ? 'var(--primario)' : 'var(--border)'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: 13,
              fontWeight: explorarCategoria === 'todos' ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif",
              background: explorarCategoria === 'todos' ? 'var(--primario-soft)' : 'transparent',
              color: explorarCategoria === 'todos' ? 'var(--primario)' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            Todas
          </button>

          {CATEGORIAS.map((cat) => {
            const isActive = explorarCategoria === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryTap(cat.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '8px 16px',
                  borderRadius: 'var(--lf-pill-radius, 100px)',
                  border: `1.5px solid ${isActive ? 'var(--primario)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  background: isActive ? 'var(--primario-soft)' : 'transparent',
                  color: isActive ? 'var(--primario)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                <CategoryIcon name={cat.icon} size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. FILTROS SECUNDARIOS (inline pills) ─── */}
      {!showFilterPanel && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '10px 16px 0',
            scrollbarWidth: 'none',
          }}
        >
          {FILTROS_SECUNDARIOS.map((f) => {
            const isActive = explorarFiltros.includes(f.key);
            const IconComp = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => handleFilterTap(f.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  borderRadius: 16,
                  border: `1px solid ${isActive ? 'var(--primario)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  background: isActive ? 'var(--primario)' : 'var(--surface)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                <IconComp size={12} />
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Results count ─── */}
      <div
        style={{
          padding: '12px 16px 0',
          fontSize: 13,
          color: 'var(--text-muted)',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--text)' }}>
            {filteredTiendas.length}
          </span>{' '}
          {filteredTiendas.length === 1 ? 'tienda' : 'tiendas'}
        </span>
        {explorarFiltros.length > 0 && !showFilterPanel && (
          <button
            onClick={() => {
              haptic(10);
              explorarFiltros.forEach((f) => toggleExplorarFiltro(f));
            }}
            style={{
              fontSize: 12,
              color: 'var(--primario)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ─── 5. LISTA DE TIENDAS — Horizontal cards ─── */}
      <div style={{ padding: '8px 0 120px' }}>
        <AnimatePresence mode="popLayout">
          {filteredTiendas.map((tienda, idx) => {
            const isFav = isFavoritoTienda(tienda.id);
            const isPressed = pressedCard === tienda.id;
            const hasPromo = tienda.badges.includes('Promo');

            return (
              <motion.div
                key={tienda.id}
                custom={idx}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                layout
                onClick={() => handleTiendaClick(tienda.id)}
                onMouseDown={() => setPressedCard(tienda.id)}
                onMouseUp={() => setPressedCard(null)}
                onMouseLeave={() => setPressedCard(null)}
                onTouchStart={() => setPressedCard(tienda.id)}
                onTouchEnd={() => setPressedCard(null)}
                style={{
                  display: 'flex',
                  margin: '0 16px 12px',
                  borderRadius: 'var(--lf-card-radius, 22px)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--lf-shadow-card)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transform: isPressed ? 'scale(0.98)' : 'scale(1)',
                  transition: 'transform 0.1s ease',
                }}
              >
                {/* ── Portada (izquierda, 100x100) ── */}
                <div
                  style={{
                    width: 100,
                    minWidth: 100,
                    height: 'auto',
                    minHeight: 120,
                    borderRadius: 'var(--lf-card-radius, 22px) 0 0 var(--lf-card-radius, 22px)',
                    background: tienda.logoColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Iniciales watermark */}
                  <span
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 28,
                      color: 'rgba(255,255,255,0.2)',
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      lineHeight: 1,
                    }}
                  >
                    {tienda.logoIniciales}
                  </span>

                  {/* Badge pill in top-left */}
                  {tienda.badges.length > 0 && (
                    <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {tienda.badges.map((b) => (
                        <span
                          key={b}
                          style={{
                            display: 'inline-block',
                            fontSize: 9,
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            padding: '2px 6px',
                            borderRadius: 6,
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            background: b === 'Promo'
                              ? 'rgba(0,200,83,0.85)'
                              : b === 'Nuevo'
                                ? 'rgba(41,121,255,0.85)'
                                : b === 'Popular'
                                  ? 'rgba(255,87,34,0.85)'
                                  : 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            lineHeight: 1.3,
                          }}
                        >
                          {b === 'Promo' ? 'PROMO' : b === 'Nuevo' ? 'NUEVO' : b === 'Popular' ? 'TOP' : b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Info (derecha, flex 1) ── */}
                <div style={{ flex: 1, padding: '14px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Fila 1: nombre + verificado */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--text)',
                        fontFamily: "'Syne', sans-serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tienda.nombre}
                    </span>
                    {tienda.verificado && (
                      <CheckCircle size={14} style={{ color: 'var(--info)', flexShrink: 0 }} />
                    )}
                  </div>

                  {/* Fila 2: categoria + Star + rating + pedidos */}
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{categoriaLabel(tienda.categoria)}</span>
                    <span style={{ color: 'var(--border)' }}>&middot;</span>
                    <Star size={12} fill="var(--warning)" stroke="none" />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>
                      {tienda.calificacion}
                    </span>
                    <span style={{ color: 'var(--border)' }}>&middot;</span>
                    <span>{tienda.totalPedidos} pedidos</span>
                  </div>

                  {/* Fila 3: Clock + tiempo + envio + pedido min */}
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Clock size={12} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{tienda.tiempoEstimado}</span>
                    <span style={{ color: 'var(--border)' }}>&middot;</span>
                    <Truck size={12} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>C${tienda.costoEnvio}</span>
                    <span style={{ color: 'var(--border)' }}>&middot;</span>
                    <span>Min. C${tienda.pedidoMinimo}</span>
                  </div>

                  {/* Fila 4: promo pill (si aplica) */}
                  {hasPromo && (
                    <div style={{ marginTop: 2 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'rgba(0,200,83,0.12)',
                          color: 'var(--exito)',
                        }}
                      >
                        <ShoppingBag size={10} />
                        20% OFF
                      </span>
                    </div>
                  )}

                  {/* Fila 5: Heart favorito */}
                  <div style={{ marginTop: 'auto', paddingTop: 2 }}>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic(10);
                        toggleFavoritoTienda(tienda.id);
                      }}
                      animate={isFav ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                      transition={isFav ? { duration: 0.35, ease: 'easeOut' } : {}}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isFav ? 'var(--peligro)' : 'var(--text-muted)',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Heart size={18} fill={isFav ? 'var(--peligro)' : 'none'} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* ─── EMPTY STATE ─── */}
        {filteredTiendas.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '48px 20px' }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'var(--bg-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Search size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text)',
                fontFamily: "'Syne', sans-serif",
                marginBottom: 6,
              }}
            >
              No hay tiendas disponibles
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Intenta cambiar los filtros o buscar algo diferente
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── 6. MAPA toggle (FAB) ─── */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--lf-bottom-nav-height, 72px) + 16px + env(safe-area-inset-bottom, 0px))',
          right: 16,
          zIndex: 20,
        }}
      >
        <button
          onClick={() => haptic(10)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--lf-shadow-float)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseDown={(e) => { (e.currentTarget.style.transform = 'scale(0.92)'); }}
          onMouseUp={(e) => { (e.currentTarget.style.transform = 'scale(1)'); }}
          onMouseLeave={(e) => { (e.currentTarget.style.transform = 'scale(1)'); }}
          onTouchStart={(e) => { (e.currentTarget.style.transform = 'scale(0.92)'); }}
          onTouchEnd={(e) => { (e.currentTarget.style.transform = 'scale(1)'); }}
        >
          <Map size={22} style={{ color: 'var(--text)' }} />
        </button>
      </div>
    </div>
  );
}
