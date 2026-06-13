'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Heart, Star, Clock, MapPin, Truck, ChevronRight, X, ShoppingBag, Check, Utensils, Store, Pill, Gift, ShoppingCart, Smartphone, Dumbbell } from 'lucide-react';
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
  { key: 'envio_gratis', label: 'Envío gratis', icon: Truck },
  { key: 'abierto', label: 'Abierto ahora', icon: Clock },
  { key: 'promo', label: 'Con promo', icon: ShoppingBag },
  { key: 'favoritos', label: 'Favoritos', icon: Heart },
] as const;

/* ═══════════════════════════════════════════════
   BADGE STYLE
   ═══════════════════════════════════════════════ */

function badgeStyleFor(badge: string): React.CSSProperties {
  switch (badge) {
    case 'Popular':
      return {
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        padding: '1px 6px',
        borderRadius: 6,
        background: 'var(--primario-soft, rgba(255,87,34,0.12))',
        color: 'var(--primario, #FF5722)',
      };
    case 'Nuevo':
      return {
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        padding: '1px 6px',
        borderRadius: 6,
        background: 'var(--info, #2979FF)',
        color: '#fff',
      };
    case 'Promo':
      return {
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        padding: '1px 6px',
        borderRadius: 6,
        background: 'var(--exito, #00C853)',
        color: '#fff',
      };
    default:
      return {
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        padding: '1px 6px',
        borderRadius: 6,
        background: 'var(--surface, #f5f5f5)',
        color: 'var(--text-muted, #999)',
      };
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

  /* ─── Filtered tiendas ─── */
  const filteredTiendas = useMemo(() => {
    let result = tiendas.filter((t) => t.estado === 'activo');

    // Category filter
    if (explorarCategoria !== 'todos') {
      result = result.filter((t) => t.categoria === explorarCategoria);
    }

    // Search filter
    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q)
      );
    }

    // Secondary filters
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
    // 'cerca' = show all (simulated)

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

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div
      style={{
        padding: '20px 16px 100px 16px',
        maxWidth: 600,
        margin: '0 auto',
        minHeight: '100vh',
      }}
    >
      {/* ─── HEADER ─── */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Explorar
        </h1>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <MapPin size={14} style={{ color: 'var(--primario)' }} />
          <span>Entregar en: Col. Los Robles</span>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* ─── SEARCH BAR ─── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-alt)',
            border: `1.5px solid ${searchFocused ? 'var(--primario)' : 'var(--border)'}`,
            borderRadius: 16,
            padding: '12px 14px',
            transition: 'border-color 0.2s',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
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
                left: 0,
                right: 0,
                zIndex: 50,
                marginTop: 6,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
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

      {/* ─── CATEGORY PILLS ─── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 12,
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => setExplorarCategoria('todos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 14px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            background: explorarCategoria === 'todos' ? 'var(--primario)' : 'transparent',
            color: explorarCategoria === 'todos' ? '#fff' : 'var(--text-muted)',
            border: `1.5px solid ${explorarCategoria === 'todos' ? 'var(--primario)' : 'var(--border)'}`,
            transition: 'all 0.2s',
          }}
        >
          Todos
        </button>
        {CATEGORIAS.map((cat) => {
          const isActive = explorarCategoria === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setExplorarCategoria(cat.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 14px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                background: isActive ? 'var(--primario)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${isActive ? 'var(--primario)' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}
            >
              <CategoryIcon name={cat.icon} size={18} /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* ─── SECONDARY FILTERS ─── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 20,
          scrollbarWidth: 'none',
        }}
      >
        {FILTROS_SECUNDARIOS.map((f) => {
          const isActive = explorarFiltros.includes(f.key);
          const IconComp = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => toggleExplorarFiltro(f.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 16,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                background: isActive ? 'var(--primario-soft, rgba(255,87,34,0.1))' : 'transparent',
                color: isActive ? 'var(--primario)' : 'var(--text-muted)',
                border: `1px solid ${isActive ? 'var(--primario)' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}
            >
              <IconComp size={13} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ─── RESULTS COUNT ─── */}
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {filteredTiendas.length} {filteredTiendas.length === 1 ? 'tienda' : 'tiendas'}
        </span>
        {explorarFiltros.length > 0 && (
          <button
            onClick={() => explorarFiltros.forEach((f) => toggleExplorarFiltro(f))}
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

      {/* ─── STORE LIST ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {filteredTiendas.map((tienda, idx) => {
            const isFav = isFavoritoTienda(tienda.id);

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
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 16,
                  background: 'var(--surface)',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {/* Left: Logo square 80x80 */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 14,
                    background: tienda.logoColor,
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
                      fontSize: 20,
                      color: '#fff',
                    }}
                  >
                    {tienda.logoIniciales}
                  </span>
                </div>

                {/* Center: Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--text)',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {tienda.nombre}
                    </span>
                    {tienda.verificado && (
                      <Check size={14} style={{ color: 'var(--info)' }} />
                    )}
                    {tienda.badges.map((b) => (
                      <span key={b} style={badgeStyleFor(b)}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {categoriaLabel(tienda.categoria)} ·{' '}
                    <Star
                      size={11}
                      style={{ color: '#FF9800', display: 'inline', verticalAlign: 'middle' }}
                    />{' '}
                    {tienda.calificacion} · {tienda.totalPedidos} pedidos
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: "'DM Sans', sans-serif",
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} /> {tienda.tiempoEstimado}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Truck size={11} /> C${tienda.costoEnvio}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      Min. C${tienda.pedidoMinimo}
                    </span>
                  </div>
                </div>

                {/* Right: Heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoritoTienda(tienda.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isFav ? 'var(--peligro)' : 'var(--text-muted)',
                    padding: 4,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Heart size={20} fill={isFav ? 'var(--peligro)' : 'none'} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ─── EMPTY STATE ─── */}
      {filteredTiendas.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            padding: '48px 20px',
          }}
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
              fontFamily: "'DM Sans', sans-serif",
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
  );
}
