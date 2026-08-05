'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  CheckCircle,
  Clock,
  Bike,
  Store,
  Tag,
  Heart,
  X,
} from '@/components/icons';
import { useMarketplaceStore, CATEGORIAS } from '@/lib/marketplace-store';

interface ClientExplorarProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'perfil') => void;
  onOpenTracking?: (orderId: string) => void;
  onOpenChat?: (orderId: string) => void;
}

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 22px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--lf-input-radius, 16px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--lf-button-radius, 16px)',
  border: 'none',
  background: 'var(--primario)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

export default function ClientExplorar({ onNavigate }: ClientExplorarProps) {
  const {
    tiendas = [],
    explorarCategoria,
    setExplorarCategoria,
    explorarSearch,
    setExplorarSearch,
    setTiendaSeleccionada,
    favoritosTiendas = [],
    toggleFavoritoTienda,
  } = useMarketplaceStore();

  const [searchQuery, setSearchQuery] = useState(explorarSearch || '');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'promo' | 'favoritos'>('todos');

  const filteredTiendas = useMemo(() => {
    return tiendas.filter((t) => {
      if (t.estado !== 'activo') return false;
      if (explorarCategoria !== 'todos' && t.categoria !== explorarCategoria) return false;
      if (activeFilter === 'promo' && !t.badges.includes('Promo')) return false;
      if (activeFilter === 'favoritos' && !favoritosTiendas.some((f: any) => (f.tiendaId || f) === t.id)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.nombre.toLowerCase().includes(q) ||
        t.descripcion.toLowerCase().includes(q)
      );
    });
  }, [tiendas, explorarCategoria, activeFilter, favoritosTiendas, searchQuery]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        maxWidth: 600,
        margin: '0 auto',
        padding: '0 4px 120px 4px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── ENCABEZADO Y BÚSQUEDA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Explorar Tiendas
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Descubre restaurantes, mercados y comercios locales en Managua.
        </p>

        {/* Campo de búsqueda */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, comida o categoría..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExplorarSearch(e.target.value);
            }}
            style={{
              ...inputStyle,
              paddingLeft: 42,
              paddingRight: searchQuery ? 42 : 16,
              boxShadow: 'var(--lf-shadow-card)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setExplorarSearch('');
              }}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── SCROLL DE CATEGORÍAS ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <button
          onClick={() => setExplorarCategoria('todos')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--lf-pill-radius, 100px)',
            background: explorarCategoria === 'todos' ? 'var(--primario)' : 'var(--surface)',
            border: '1px solid var(--border)',
            color: explorarCategoria === 'todos' ? '#FFFFFF' : 'var(--text)',
            fontWeight: 600,
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: 'var(--lf-shadow-card)',
          }}
        >
          Todos
        </button>

        {CATEGORIAS.map((cat) => {
          const isSelected = explorarCategoria === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setExplorarCategoria(cat.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--lf-pill-radius, 100px)',
                background: isSelected ? 'var(--primario)' : 'var(--surface)',
                border: '1px solid var(--border)',
                color: isSelected ? '#FFFFFF' : 'var(--text)',
                fontWeight: 600,
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                boxShadow: 'var(--lf-shadow-card)',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── CHIPS DE FILTRO RÁPIDO ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveFilter('todos')}
          style={{
            padding: '6px 12px',
            borderRadius: 10,
            background: activeFilter === 'todos' ? 'var(--text)' : 'var(--bg-alt)',
            color: activeFilter === 'todos' ? 'var(--bg)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: 11,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Todos ({filteredTiendas.length})
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'promo' ? 'todos' : 'promo')}
          style={{
            padding: '6px 12px',
            borderRadius: 10,
            background: activeFilter === 'promo' ? '#FF9500' : 'rgba(255, 149, 0, 0.12)',
            color: activeFilter === 'promo' ? '#FFFFFF' : '#FF9500',
            fontWeight: 700,
            fontSize: 11,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Tag size={12} /> Promociones
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'favoritos' ? 'todos' : 'favoritos')}
          style={{
            padding: '6px 12px',
            borderRadius: 10,
            background: activeFilter === 'favoritos' ? '#FF3B30' : 'rgba(255, 59, 48, 0.12)',
            color: activeFilter === 'favoritos' ? '#FFFFFF' : '#FF3B30',
            fontWeight: 700,
            fontSize: 11,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Heart size={12} fill={activeFilter === 'favoritos' ? 'currentColor' : 'none'} /> Favoritos
        </button>
      </div>

      {/* ── GRID DE TIENDAS ── */}
      {filteredTiendas.length === 0 ? (
        <div style={{ ...sectionCard, padding: 36, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Store size={40} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: '0 0 4px 0' }}>
              No se encontraron tiendas
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Intenta cambiar los términos de búsqueda o limpiar los filtros.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setExplorarSearch('');
              setExplorarCategoria('todos');
              setActiveFilter('todos');
            }}
            style={{ ...btnPrimary, margin: '8px auto 0 auto' }}
          >
            Ver todas las tiendas
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filteredTiendas.map((tienda) => {
            const isFav = favoritosTiendas.some((f: any) => (f.tiendaId || f) === tienda.id);
            return (
              <motion.div
                key={tienda.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTiendaSeleccionada(tienda.id)}
                style={{
                  ...sectionCard,
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Banner de Tienda */}
                <div
                  style={{
                    height: 100,
                    background: tienda.logoColor || 'linear-gradient(135deg, var(--primario), #D84315)',
                    padding: 14,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'var(--surface)',
                        color: 'var(--primario)',
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--lf-shadow-card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {tienda.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          fontFamily: "'Syne', sans-serif",
                          color: '#FFFFFF',
                          margin: 0,
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      >
                        {tienda.nombre}
                      </h3>
                      <p
                        style={{
                          fontSize: 11,
                          color: 'rgba(255, 255, 255, 0.85)',
                          margin: 0,
                          textTransform: 'capitalize',
                        }}
                      >
                        {tienda.categoria}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoritoTienda(tienda.id);
                    }}
                    style={{
                      zIndex: 2,
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Heart size={16} fill={isFav ? '#FF3B30' : 'none'} color={isFav ? '#FF3B30' : '#FFFFFF'} />
                  </button>
                </div>

                {/* Contenido Info */}
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      margin: 0,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {tienda.descripcion}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border)',
                      paddingTop: 10,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          color: '#FF9500',
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <Star size={12} fill="currentColor" /> {(tienda.calificacion || 4.8).toFixed(1)}
                      </span>
                      <span style={{ color: 'var(--border)' }}>•</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {(tienda as any).tiempoEntrega || tienda.tiempoEstimado || '20 min'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--text)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      C$ {tienda.costoEnvio} envío
                    </span>
                  </div>

                  {/* Badges */}
                  {tienda.badges && tienda.badges.length > 0 && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {tienda.badges.map((b) => (
                        <span
                          key={b}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'var(--primario-soft)',
                            color: 'var(--primario)',
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
