'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Share2, Phone, Star, Clock, MapPin, Truck, Plus, Minus, Check, ChevronRight, X, ShoppingBag, MessageCircle } from 'lucide-react';
import { useMarketplaceStore, type Tienda, type Producto, CATEGORIAS, MOCK_PRODUCTOS, MOCK_RESENAS } from '@/lib/marketplace-store';
import { useStore } from '@/lib/store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientTiendaProps {
  isDark: boolean;
  tiendaId: string;
  onBack: () => void;
  onOpenCart: () => void;
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function categoriaLabel(key: string): string {
  const found = CATEGORIAS.find((c) => c.key === key);
  return found ? `${found.icon} ${found.label}` : key;
}

function isStoreOpen(horario: Record<string, { abre: string; cierra: string }>): { open: boolean; text: string } {
  const days = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
  const now = new Date();
  const dayKey = days[now.getDay()];
  const dayHorario = horario[dayKey];
  if (!dayHorario || !dayHorario.abre || !dayHorario.cierra) {
    return { open: false, text: 'Cerrado hoy' };
  }
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [abreH, abreM] = dayHorario.abre.split(':').map(Number);
  const [cierraH, cierraM] = dayHorario.cierra.split(':').map(Number);
  const abreMinutes = abreH * 60 + abreM;
  const cierraMinutes = cierraH * 60 + cierraM;
  if (currentMinutes >= abreMinutes && currentMinutes <= cierraMinutes) {
    const cierraFormatted = dayHorario.cierra;
    return { open: true, text: `Abierto hasta ${cierraFormatted}` };
  }
  if (currentMinutes < abreMinutes) {
    return { open: false, text: `Abre a las ${dayHorario.abre}` };
  }
  return { open: false, text: 'Cerrado' };
}

function formatHorarioDisplay(h: { abre: string; cierra: string }): string {
  if (!h.abre && !h.cierra) return 'Cerrado';
  return `${h.abre} - ${h.cierra}`;
}

const DAY_LABELS: Record<string, string> = {
  lun: 'Lunes',
  mar: 'Martes',
  mie: 'Miércoles',
  jue: 'Jueves',
  vie: 'Viernes',
  sab: 'Sábado',
  dom: 'Domingo',
};

const DAY_ORDER = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

/* ═══════════════════════════════════════════════
   STAR DISPLAY
   ═══════════════════════════════════════════════ */

function StarsDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={size} fill="#FFB300" color="#FFB300" />
      ))}
      {hasHalf && (
        <span style={{ position: 'relative', width: size, height: size, display: 'inline-flex' }}>
          <Star size={size} color="var(--border)" style={{ position: 'absolute', left: 0 }} />
          <span style={{ position: 'absolute', left: 0, overflow: 'hidden', width: size / 2 }}>
            <Star size={size} fill="#FFB300" color="#FFB300" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={size} color="var(--border)" />
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientTienda({ isDark, tiendaId, onBack, onOpenCart }: ClientTiendaProps) {
  /* ─── Store ─── */
  const {
    tiendas,
    productos,
    resenas,
    cartItems,
    addToCart,
    toggleFavoritoTienda,
    isFavoritoTienda,
    updateCartItemQty,
    removeFromCart,
    getCartItemCount,
    getCartItemsByTienda,
  } = useMarketplaceStore();

  /* ─── Local state ─── */
  const [activeTab, setActiveTab] = useState<'productos' | 'info' | 'resenas'>('productos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [favAnimating, setFavAnimating] = useState(false);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());

  /* ─── Derived data ─── */
  const tienda = useMemo(() => tiendas.find((t) => t.id === tiendaId), [tiendas, tiendaId]);

  const tiendaProductos = useMemo(
    () => productos.filter((p) => p.tiendaId === tiendaId && p.disponible),
    [productos, tiendaId]
  );

  const tiendaResenas = useMemo(
    () => resenas.filter((r) => r.tiendaId === tiendaId),
    [resenas, tiendaId]
  );

  const productCategories = useMemo(() => {
    const cats = Array.from(new Set(tiendaProductos.map((p) => p.categoriaNombre)));
    return ['Todos', ...cats];
  }, [tiendaProductos]);

  const filteredProducts = useMemo(() => {
    let filtered = tiendaProductos;
    if (activeCategory !== 'Todos') {
      filtered = filtered.filter((p) => p.categoriaNombre === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [tiendaProductos, activeCategory, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Producto[]> = {};
    filteredProducts.forEach((p) => {
      if (!groups[p.categoriaNombre]) groups[p.categoriaNombre] = [];
      groups[p.categoriaNombre].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const averageRating = useMemo(() => {
    if (tiendaResenas.length === 0) return tienda?.calificacion ?? 0;
    const sum = tiendaResenas.reduce((s, r) => s + r.estrellas, 0);
    return sum / tiendaResenas.length;
  }, [tiendaResenas, tienda]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
    tiendaResenas.forEach((r) => {
      if (r.estrellas >= 1 && r.estrellas <= 5) dist[r.estrellas - 1]++;
    });
    return dist;
  }, [tiendaResenas]);

  const cartItemCount = getCartItemCount();
  const isFavorite = tienda ? isFavoritoTienda(tienda.id) : false;

  /* ─── Handlers ─── */
  const handleAddToCart = (producto: Producto) => {
    if (!tienda) return;
    addToCart(producto, tienda);
    setAddedProductIds((prev) => new Set(prev).add(producto.id));
    setTimeout(() => {
      setAddedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(producto.id);
        return next;
      });
    }, 1200);
  };

  const handleToggleFavorite = () => {
    if (!tienda) return;
    toggleFavoritoTienda(tienda.id);
    setFavAnimating(true);
    setTimeout(() => setFavAnimating(false), 400);
  };

  const getCartItemForProduct = (productoId: string) => {
    return cartItems.find((ci) => ci.productoId === productoId);
  };

  /* ─── No store found ─── */
  if (!tienda) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)' }}>
          Tienda no encontrada
        </p>
        <button
          onClick={onBack}
          style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, background: 'var(--primario)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
        >
          Volver
        </button>
      </div>
    );
  }

  const storeOpenInfo = isStoreOpen(tienda.horario);

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* ─── STORE HEADER ─── */}
      <div style={{ position: 'relative' }}>
        {/* Cover */}
        <div
          style={{
            height: 200,
            background: `linear-gradient(135deg, ${tienda.portadaColor}, ${tienda.logoColor})`,
            position: 'relative',
          }}
        >
          {/* Dark overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 100%)',
            }}
          />
          {/* Back button */}
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
            }}
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Logo circle overlapping */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          style={{
            position: 'absolute',
            top: 164,
            left: 20,
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: tienda.logoColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            border: '3px solid var(--surface)',
            zIndex: 2,
          }}
        >
          {tienda.logoIniciales}
        </motion.div>
      </div>

      {/* ─── Store Info Section ─── */}
      <div style={{ padding: '48px 20px 16px 20px' }}>
        {/* Name */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {tienda.nombre}
        </h1>

        {/* Category + rating + orders + time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            {categoriaLabel(tienda.categoria)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <StarsDisplay rating={tienda.calificacion} size={13} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: 'var(--text)', marginLeft: 2 }}>
              {tienda.calificacion}
            </span>
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>
            {tienda.totalPedidos} pedidos
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Clock size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>
              {tienda.tiempoEstimado}
            </span>
          </span>
        </div>

        {/* Badges */}
        {tienda.badges.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {tienda.verificado && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'rgba(0, 200, 83, 0.1)',
                  color: 'var(--exito)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Check size={11} /> Verificado
              </span>
            )}
            {tienda.badges.map((badge) => {
              let bgColor = 'var(--primario-soft)';
              let textColor = 'var(--primario)';
              if (badge === 'Popular') {
                bgColor = 'rgba(255, 87, 34, 0.08)';
                textColor = 'var(--primario)';
              } else if (badge === 'Nuevo') {
                bgColor = 'rgba(41, 121, 255, 0.08)';
                textColor = 'var(--info)';
              }
              return (
                <span
                  key={badge}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: bgColor,
                    color: textColor,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {badge === 'Popular' && <Star size={10} fill={textColor} color={textColor} />}
                  {badge === 'Nuevo' && <span style={{ fontSize: 10 }}>✨</span>}
                  {badge}
                </span>
              );
            })}
          </div>
        )}

        {/* Address + Distance */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
          }}
        >
          <MapPin size={14} style={{ color: 'var(--primario)', flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-secondary)' }}>
            {tienda.direccion}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--primario)', fontWeight: 600, marginLeft: 4 }}>
            1.2 km de ti
          </span>
        </div>

        {/* Horario */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            padding: '4px 10px',
            borderRadius: 8,
            background: storeOpenInfo.open ? 'rgba(0, 200, 83, 0.08)' : 'rgba(255, 23, 68, 0.08)',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: storeOpenInfo.open ? 'var(--exito)' : 'var(--peligro)',
            }}
          />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: storeOpenInfo.open ? 'var(--exito)' : 'var(--peligro)',
            }}
          >
            {storeOpenInfo.text}
          </span>
        </div>

        {/* Action buttons row */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 16,
          }}
        >
          {/* Hacer pedido */}
          <button
            onClick={() => setActiveTab('productos')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 14,
              background: 'var(--primario)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-primario)',
            }}
          >
            <ShoppingBag size={16} />
            Hacer pedido
          </button>

          {/* Favorito */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleToggleFavorite}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: isFavorite ? 'rgba(255, 23, 68, 0.1)' : 'var(--surface)',
              border: `1.5px solid ${isFavorite ? 'var(--peligro)' : 'var(--border)'}`,
              color: isFavorite ? 'var(--peligro)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Heart size={20} fill={isFavorite ? 'var(--peligro)' : 'none'} />
            {favAnimating && (
              <motion.span
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'absolute',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--peligro)',
                }}
              />
            )}
          </motion.button>

          {/* Compartir */}
          <button
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Share2 size={20} />
          </button>

          {/* Llamar */}
          <button
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Phone size={20} />
          </button>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '0 20px',
          marginTop: 8,
        }}
      >
        {(['productos', 'info', 'resenas'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const labels = { productos: 'Productos', info: 'Info', resenas: 'Reseñas' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                borderRadius: 24,
                border: 'none',
                background: isActive ? 'var(--primario)' : 'var(--surface)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 8px rgba(255,87,34,0.25)' : 'var(--shadow-sm)',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div style={{ padding: '16px 20px 120px 20px' }}>
        <AnimatePresence mode="wait">
          {/* ════════════ PRODUCTS TAB ════════════ */}
          {activeTab === 'productos' && (
            <motion.div
              key="productos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search */}
              <div
                style={{
                  position: 'relative',
                  marginBottom: 12,
                }}
              >
                <input
                  type="text"
                  placeholder={`Buscar en ${tienda.nombre}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 16px 11px 40px',
                    borderRadius: 12,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primario)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <SearchIcon
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category sticky tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  marginBottom: 8,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: 'var(--bg)',
                  paddingTop: 4,
                }}
              >
                {productCategories.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: '1.5px solid',
                        borderColor: isActive ? 'var(--primario)' : 'var(--border)',
                        background: isActive ? 'var(--primario-soft)' : 'var(--surface)',
                        color: isActive ? 'var(--primario)' : 'var(--text-secondary)',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Products grouped by category */}
              {Object.keys(groupedProducts).length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'var(--text-muted)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                  }}
                >
                  No se encontraron productos
                </div>
              )}

              {Object.entries(groupedProducts).map(([catName, prods]) => (
                <div key={catName} style={{ marginBottom: 20 }}>
                  {/* Category header */}
                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: 'var(--text)',
                      marginBottom: 4,
                    }}
                  >
                    {catName}
                  </h3>

                  {/* Product cards */}
                  {prods.map((producto) => {
                    const cartItem = getCartItemForProduct(producto.id);
                    const justAdded = addedProductIds.has(producto.id);
                    const qtyInCart = cartItem ? cartItem.cantidad : 0;

                    return (
                      <div
                        key={producto.id}
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: '12px 0',
                          borderBottom: '1px solid var(--border)',
                          alignItems: 'center',
                        }}
                      >
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: 'var(--text)',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {producto.nombre}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: 'var(--text-muted)',
                              marginTop: 2,
                              lineClamp: 2,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {producto.descripcion}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginTop: 4,
                            }}
                          >
                            {producto.precioOriginal && (
                              <span
                                style={{
                                  textDecoration: 'line-through',
                                  fontSize: 13,
                                  color: 'var(--text-muted)',
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                C${producto.precioOriginal}
                              </span>
                            )}
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 16,
                                fontWeight: 700,
                                color: producto.precioOriginal ? 'var(--primario)' : 'var(--text)',
                              }}
                            >
                              C${producto.precio}
                            </span>
                          </div>

                          {/* Product badges */}
                          <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                            {producto.esNuevo && (
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: 6,
                                  background: 'rgba(41, 121, 255, 0.08)',
                                  color: 'var(--info)',
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
                              >
                                Nuevo
                              </span>
                            )}
                            {producto.esPopular && (
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: 6,
                                  background: 'var(--primario-soft)',
                                  color: 'var(--primario)',
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
                              >
                                Popular
                              </span>
                            )}
                            {producto.stock !== null && producto.stock <= 5 && (
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: 6,
                                  background: 'rgba(255, 179, 0, 0.1)',
                                  color: 'var(--warning)',
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: 10,
                                  fontWeight: 700,
                                }}
                              >
                                Últimas unidades
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Image + Add button */}
                        <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                          <div
                            style={{
                              width: 90,
                              height: 90,
                              borderRadius: 14,
                              background: producto.imagenColor,
                            }}
                          />
                          {qtyInCart === 0 ? (
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleAddToCart(producto)}
                              style={{
                                position: 'absolute',
                                bottom: -8,
                                right: -8,
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'var(--primario)',
                                border: '2px solid var(--surface)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-md)',
                              }}
                            >
                              <Plus size={16} />
                            </motion.button>
                          ) : (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: -8,
                                right: -8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0,
                                borderRadius: 20,
                                background: 'var(--primario)',
                                border: '2px solid var(--surface)',
                                boxShadow: 'var(--shadow-md)',
                                overflow: 'hidden',
                              }}
                            >
                              <button
                                onClick={() => {
                                  if (cartItem) updateCartItemQty(cartItem.id, cartItem.cantidad - 1);
                                }}
                                style={{
                                  width: 28,
                                  height: 28,
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Minus size={13} />
                              </button>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: '#fff',
                                  minWidth: 20,
                                  textAlign: 'center',
                                }}
                              >
                                {qtyInCart}
                              </span>
                              <button
                                onClick={() => {
                                  if (cartItem) updateCartItemQty(cartItem.id, cartItem.cantidad + 1);
                                }}
                                style={{
                                  width: 28,
                                  height: 28,
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          )}
                          {/* Just added check animation */}
                          <AnimatePresence>
                            {justAdded && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: 'var(--exito)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: 'var(--shadow-sm)',
                                }}
                              >
                                <Check size={12} color="#fff" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}

          {/* ════════════ INFO TAB ════════════ */}
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Map placeholder */}
              <div
                style={{
                  width: '100%',
                  height: 160,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${tienda.logoColor}22, ${tienda.portadaColor}22)`,
                  border: '1.5px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <MapPin size={28} style={{ color: 'var(--primario)' }} />
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    padding: '0 24px',
                  }}
                >
                  {tienda.direccion}
                </span>
              </div>

              {/* Address */}
              <InfoRow icon={<MapPin size={16} style={{ color: 'var(--primario)' }} />} label="Dirección" value={tienda.direccion} />

              {/* Hours */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <Clock size={16} style={{ color: 'var(--primario)' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    Horario
                  </span>
                </div>
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  {DAY_ORDER.map((day, idx) => {
                    const h = tienda.horario[day];
                    const isToday = day === ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][new Date().getDay()];
                    return (
                      <div
                        key={day}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          background: isToday ? 'var(--primario-soft)' : 'transparent',
                          borderBottom: idx < DAY_ORDER.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: isToday ? 600 : 400,
                            color: isToday ? 'var(--primario)' : 'var(--text-secondary)',
                          }}
                        >
                          {DAY_LABELS[day]} {isToday && '(Hoy)'}
                        </span>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            fontWeight: isToday ? 600 : 400,
                            color: h && h.abre ? (isToday ? 'var(--primario)' : 'var(--text)') : 'var(--text-muted)',
                          }}
                        >
                          {h ? formatHorarioDisplay(h) : 'Cerrado'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phone */}
              <InfoRow icon={<Phone size={16} style={{ color: 'var(--primario)' }} />} label="Teléfono" value={tienda.telefono} />

              {/* Email */}
              <InfoRow
                icon={<MessageCircle size={16} style={{ color: 'var(--primario)' }} />}
                label="Email"
                value={tienda.email}
              />

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: 6,
                  }}
                >
                  Descripción
                </div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {tienda.descripcion}
                </p>
              </div>

              {/* Policies */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: 10,
                  }}
                >
                  Políticas de pedido
                </div>
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  <PolicyRow
                    icon={<ShoppingBag size={16} style={{ color: 'var(--primario)' }} />}
                    label="Pedido mínimo"
                    value={`C$${tienda.pedidoMinimo}`}
                  />
                  <PolicyRow
                    icon={<Truck size={16} style={{ color: 'var(--primario)' }} />}
                    label="Costo de envío"
                    value={`C$${tienda.costoEnvio}`}
                  />
                  <PolicyRow
                    icon={<Clock size={16} style={{ color: 'var(--primario)' }} />}
                    label="Tiempo estimado"
                    value={tienda.tiempoEstimado}
                  />
                </div>
              </div>

              {/* Coverage zones */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: 8,
                  }}
                >
                  Zonas de cobertura
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tienda.zonaCobertura.map((zona) => (
                    <span
                      key={zona}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: 'var(--primario-soft)',
                        color: 'var(--primario)',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {zona}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════ REVIEWS TAB ════════════ */}
          {activeTab === 'resenas' && (
            <motion.div
              key="resenas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Average rating */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 20,
                  background: 'var(--surface)',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  marginBottom: 16,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 48,
                      color: 'var(--text)',
                      lineHeight: 1,
                    }}
                  >
                    {averageRating.toFixed(1)}
                  </div>
                  <StarsDisplay rating={averageRating} size={16} />
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 4,
                    }}
                  >
                    ({tiendaResenas.length} reseñas)
                  </div>
                </div>

                {/* Distribution bars */}
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingDistribution[star - 1];
                    const maxCount = Math.max(...ratingDistribution, 1);
                    const pct = (count / maxCount) * 100;
                    return (
                      <div
                        key={star}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            width: 12,
                            textAlign: 'right',
                          }}
                        >
                          {star}
                        </span>
                        <Star size={11} fill="#FFB300" color="#FFB300" />
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            background: 'var(--border)',
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: (5 - star) * 0.08 }}
                            style={{
                              height: '100%',
                              borderRadius: 4,
                              background: star >= 4 ? 'var(--exito)' : star === 3 ? 'var(--warning)' : 'var(--peligro)',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            width: 20,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews list */}
              <div>
                {tiendaResenas.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: 'var(--text-muted)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                    }}
                  >
                    Aún no hay reseñas para esta tienda
                  </div>
                )}
                {tiendaResenas.map((resena, idx) => (
                  <motion.div
                    key={resena.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    style={{
                      padding: '14px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: `hsl(${resena.clienteNombre.charCodeAt(0) * 7 % 360}, 55%, 55%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {resena.clienteNombre.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--text)',
                            }}
                          >
                            {resena.clienteNombre}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              color: 'var(--text-muted)',
                            }}
                          >
                            {resena.fecha}
                          </span>
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <StarsDisplay rating={resena.estrellas} size={12} />
                        </div>
                      </div>
                    </div>
                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        margin: '8px 0 0 46px',
                      }}
                    >
                      {resena.comentario}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── FLOATING CART BUTTON ─── */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.button
            key="floating-cart"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={onOpenCart}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--primario)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-primario)',
              zIndex: 50,
            }}
          >
            <ShoppingBag size={24} />
            {/* Badge */}
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                background: 'var(--peligro)',
                color: '#fff',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                border: '2px solid var(--surface)',
              }}
            >
              {cartItemCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
      }}
    >
      {icon}
      <div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: 'var(--text)',
            fontWeight: 500,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function PolicyRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SearchIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
