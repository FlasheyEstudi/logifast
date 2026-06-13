'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, Phone, Star, Clock, MapPin,
  Truck, Plus, Minus, Check, ChevronRight, X, ShoppingBag,
  MessageCircle, Sparkles, Search, Navigation,
} from 'lucide-react';
import {
  useMarketplaceStore,
  type Tienda,
  type Producto,
  CATEGORIAS,
  MOCK_RESENAS,
} from '@/lib/marketplace-store';

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
  return found ? found.label : key;
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
    return { open: true, text: `Abierto hasta ${dayHorario.cierra}` };
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
  lun: 'Lunes', mar: 'Martes', mie: 'Miercoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sabado', dom: 'Domingo',
};

const DAY_ORDER = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

/* ═══════════════════════════════════════════════
   GEOMETRIC PATTERN OVERLAY
   ═══════════════════════════════════════════════ */

function GeometricPattern({ color }: { color: string }) {
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, opacity: 0.04 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={`geo-${color.replace('#', '')}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1.5" fill={color} />
          <path d="M0 20h40M20 0v40" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#geo-${color.replace('#', '')})`} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   STAR DISPLAY
   ═══════════════════════════════════════════════ */

function StarsDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={size} fill="#FFB300" color="#FFB300" strokeWidth={0} />
      ))}
      {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
        <Star key={`e${i}`} size={size} color="var(--border)" strokeWidth={1.5} />
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
  } = useMarketplaceStore();

  /* ─── Local state ─── */
  const [activeTab, setActiveTab] = useState<'menu' | 'info' | 'resenas'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [favAnimating, setFavAnimating] = useState(false);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
  const tabsRef = useRef<HTMLDivElement>(null);

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
    const dist = [0, 0, 0, 0, 0];
    tiendaResenas.forEach((r) => {
      if (r.estrellas >= 1 && r.estrellas <= 5) dist[r.estrellas - 1]++;
    });
    return dist;
  }, [tiendaResenas]);

  const cartItemCount = getCartItemCount();
  const isFavorite = tienda ? isFavoritoTienda(tienda.id) : false;

  /* ─── Promo code from store data ─── */
  const hasPromo = tienda?.badges?.includes('Promo');

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

      {/* ════════════════════════════════════════════
          1. PORTADA (200px)
          ════════════════════════════════════════════ */}
      <div style={{ position: 'relative', height: 200 }}>
        {/* Background color */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: tienda.portadaColor,
          }}
        />

        {/* Geometric pattern overlay */}
        <GeometricPattern color="#FFFFFF" />

        {/* Bottom gradient: transparent → rgba(0,0,0,0.3) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.3) 100%)',
          }}
        />

        {/* Back button - circle 36x36, glassmorphism */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: 48,
            left: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--lf-glass-bg)',
            backdropFilter: `blur(var(--lf-glass-blur))`,
            WebkitBackdropFilter: `blur(var(--lf-glass-blur))`,
            border: '1px solid var(--lf-glass-border)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Favorite button - circle 36x36, glassmorphism */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleToggleFavorite}
          style={{
            position: 'absolute',
            top: 48,
            right: 60,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--lf-glass-bg)',
            backdropFilter: `blur(var(--lf-glass-blur))`,
            WebkitBackdropFilter: `blur(var(--lf-glass-blur))`,
            border: '1px solid var(--lf-glass-border)',
            color: isFavorite ? 'var(--peligro)' : 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <Heart size={17} fill={isFavorite ? 'var(--peligro)' : 'none'} />
          {favAnimating && (
            <motion.span
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                position: 'absolute',
                width: 17,
                height: 17,
                borderRadius: '50%',
                background: 'var(--peligro)',
              }}
            />
          )}
        </motion.button>

        {/* Share button - circle 36x36, glassmorphism */}
        <button
          style={{
            position: 'absolute',
            top: 48,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--lf-glass-bg)',
            backdropFilter: `blur(var(--lf-glass-blur))`,
            WebkitBackdropFilter: `blur(var(--lf-glass-blur))`,
            border: '1px solid var(--lf-glass-border)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <Share2 size={17} />
        </button>
      </div>

      {/* ════════════════════════════════════════════
          2. LOGO + INFO (debajo de portada)
          ════════════════════════════════════════════ */}

      {/* Logo: 72x72, border-radius 22px, border 4px surface, top -32px left 20px */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        style={{
          position: 'relative',
          top: -32,
          left: 20,
          width: 72,
          height: 72,
          borderRadius: 22,
          background: tienda.logoColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          border: '4px solid var(--surface)',
          zIndex: 2,
        }}
      >
        {tienda.logoIniciales}
      </motion.div>

      {/* Name: Syne 24px bold, margin-top -8px, padding 0 20px */}
      <div style={{ padding: '0 20px', marginTop: -8 }}>
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

        {/* Badges: fila de pills debajo del nombre, gap 6px */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
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
          {tienda.popular && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(255, 87, 34, 0.08)',
                color: 'var(--primario)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Star size={10} fill="var(--primario)" color="var(--primario)" strokeWidth={0} /> Popular
            </span>
          )}
          {tienda.badges?.includes('Nuevo') && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(41, 121, 255, 0.08)',
                color: 'var(--info)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Sparkles size={10} /> Nuevo
            </span>
          )}
        </div>

        {/* Meta: Star + rating + punto + categoria + punto + pedidos totales */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          <Star size={14} fill="#FFB300" color="#FFB300" strokeWidth={0} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {tienda.calificacion}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-secondary)' }}>
            {categoriaLabel(tienda.categoria)}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>
            {tienda.totalPedidos} pedidos
          </span>
        </div>

        {/* Status: "Abierto hasta 9:00 PM" con punto verde pulsante / "Cerrado" con punto rojo */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: storeOpenInfo.open ? 'var(--exito)' : 'var(--peligro)',
              display: 'inline-block',
              animation: storeOpenInfo.open ? 'pulse-dot 2s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: storeOpenInfo.open ? 'var(--exito)' : 'var(--peligro)',
            }}
          >
            {storeOpenInfo.text}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          3. BARRA DE PROMO (si tiene)
          ════════════════════════════════════════════ */}
      {(hasPromo || tienda.badges?.includes('Popular')) && (
        <div
          style={{
            margin: '12px 20px 0 20px',
            padding: '10px 16px',
            borderRadius: 12,
            background: 'var(--primario-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-secondary)' }}>
            20% OFF con codigo <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>LOGI20</span>
          </span>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--primario)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Aplicar
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════
          4. ACCIONES RAPIDAS (4 pills en fila)
          ════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '16px 20px 0 20px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Hacer pedido (primario, relleno) */}
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            background: 'var(--primario)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-primario)',
          }}
        >
          <ShoppingBag size={15} />
          Hacer pedido
        </button>

        {/* Llamar (outline, Phone) */}
        <button
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1.5px solid var(--border)',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <Phone size={15} />
          Llamar
        </button>

        {/* Direccion (outline, MapPin) */}
        <button
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1.5px solid var(--border)',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <MapPin size={15} />
          Direccion
        </button>

        {/* Compartir (outline, Share2) */}
        <button
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1.5px solid var(--border)',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <Share2 size={15} />
          Compartir
        </button>
      </div>

      {/* ════════════════════════════════════════════
          5. TABS DE NAVEGACION (sticky)
          ════════════════════════════════════════════ */}
      <div
        ref={tabsRef}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--bg)',
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginTop: 16,
        }}
      >
        {(['menu', 'info', 'resenas'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const labels = { menu: 'Menu', info: 'Info', resenas: 'Resenas' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '14px 0 12px 0',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--primario)' : 'var(--text-muted)',
                fontFamily: isActive ? "'DM Sans', sans-serif" : "'DM Sans', sans-serif",
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.2s',
              }}
            >
              {labels[tab]}
              {/* Sliding underline indicator */}
              {isActive && (
                <motion.div
                  layoutId="tienda-tab-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '20%',
                    right: '20%',
                    height: 2.5,
                    borderRadius: 2,
                    background: 'var(--primario)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════
          6. TAB: MENU (PRODUCTOS)
          ════════════════════════════════════════════ */}
      <div style={{ padding: '0 20px 120px 20px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Buscador interno: pill pequena */}
              <div style={{ position: 'relative', marginTop: 12 }}>
                <input
                  type="text"
                  placeholder={`Buscar en ${tienda.nombre}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px 10px 40px',
                    borderRadius: 28,
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
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
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

              {/* NAV DE CATEGORIAS (sticky debajo de tabs) */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  overflowX: 'auto',
                  paddingBottom: 4,
                  marginBottom: 12,
                  marginTop: 12,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  position: 'sticky',
                  top: 49,
                  zIndex: 15,
                  background: 'var(--bg)',
                  paddingTop: 8,
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
                        border: 'none',
                        background: 'transparent',
                        color: isActive ? 'var(--primario)' : 'var(--text-secondary)',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        position: 'relative',
                        transition: 'color 0.2s',
                      }}
                    >
                      {cat}
                      {isActive && (
                        <motion.div
                          layoutId="cat-underline"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: '20%',
                            right: '20%',
                            height: 2,
                            borderRadius: 1,
                            background: 'var(--primario)',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* LISTA DE PRODUCTOS */}
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
                <div key={catName} style={{ marginBottom: 24 }}>
                  {/* Category header */}
                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: 'var(--text)',
                      marginBottom: 8,
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
                        {/* Info (flex 1) */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* nombre 15px bold */}
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
                          {/* desc 13px muted (2 lineas max) */}
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
                          {/* precio JetBrains Mono 16px bold + precio tachado si hay descuento */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginTop: 6,
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
                        </div>

                        {/* Imagen (derecha, 88x88): border-radius 16px, color de fondo */}
                        <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
                          <div
                            style={{
                              width: 88,
                              height: 88,
                              borderRadius: 16,
                              background: producto.imagenColor,
                            }}
                          />

                          {/* Boton "+": 32x32, var(--primario), border-radius 50% */}
                          {/* Si ya en carrito: control [-] [cantidad] [+] */}
                          {qtyInCart === 0 ? (
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleAddToCart(producto)}
                              style={{
                                position: 'absolute',
                                bottom: -6,
                                right: -6,
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
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              style={{
                                position: 'absolute',
                                bottom: -6,
                                right: -6,
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
                            </motion.div>
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

          {/* ════════════════════════════════════════════
              7. TAB: INFO
              ════════════════════════════════════════════ */}
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
                  borderRadius: 'var(--lf-card-radius)',
                  background: `linear-gradient(135deg, ${tienda.logoColor}22, ${tienda.portadaColor}22)`,
                  border: '1.5px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 16,
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
              <InfoRow icon={<MapPin size={16} style={{ color: 'var(--primario)' }} />} label="Direccion" value={tienda.direccion} />

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
                    borderRadius: 'var(--lf-card-radius)',
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
              <InfoRow icon={<Phone size={16} style={{ color: 'var(--primario)' }} />} label="Telefono" value={tienda.telefono} />

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
                  Descripcion
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
                  Politicas de pedido
                </div>
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--lf-card-radius)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  <PolicyRow
                    icon={<ShoppingBag size={16} style={{ color: 'var(--primario)' }} />}
                    label="Pedido minimo"
                    value={`C$${tienda.pedidoMinimo}`}
                  />
                  <PolicyRow
                    icon={<Truck size={16} style={{ color: 'var(--primario)' }} />}
                    label="Costo de envio"
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

          {/* ════════════════════════════════════════════
              8. TAB: RESENAS
              ════════════════════════════════════════════ */}
          {activeTab === 'resenas' && (
            <motion.div
              key="resenas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Calificacion promedio grande + distribucion */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: 24,
                  background: 'var(--surface)',
                  borderRadius: 'var(--lf-card-radius)',
                  border: '1px solid var(--border)',
                  marginTop: 16,
                  marginBottom: 16,
                  boxShadow: 'var(--lf-shadow-card)',
                }}
              >
                {/* Big rating */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
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
                    ({tiendaResenas.length} resenas)
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
                        <Star size={11} fill="#FFB300" color="#FFB300" strokeWidth={0} />
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
                    Aun no hay resenas para esta tienda
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

      {/* ════════════════════════════════════════════
          FLOATING CART BUTTON with badge count
          ════════════════════════════════════════════ */}
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
              bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 16px)',
              right: 20,
              height: 52,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: 28,
              background: 'var(--primario)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              boxShadow: 'var(--lf-shadow-float)',
              zIndex: 50,
            }}
          >
            <ShoppingBag size={20} />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Ver carrito
            </span>
            <span
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                background: 'rgba(255,255,255,0.25)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}
            >
              {cartItemCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Pulse dot animation keyframes */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
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
