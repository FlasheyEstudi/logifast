'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, Phone, Star, Clock, MapPin,
  Truck, Plus, Minus, Check, ChevronRight, X, ShoppingBag,
  MessageCircle, Sparkles, Search, MessageSquare, AlertCircle,
  Tag, Send, CheckCircle, Copy, Navigation, Compass,
} from '@/components/icons';
import {
  useMarketplaceStore,
  type Tienda,
  type Producto,
  type ResenaTienda,
  CATEGORIAS,
} from '@/lib/marketplace-store';
import { Map, MapMarker, MarkerPopup } from '@/components/ui/map';
import { PinTienda } from '@/components/ui/MapPins';
import { notify } from '@/lib/notify';

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
   HELPERS & CONSTANTS
   ═══════════════════════════════════════════════ */

function categoriaLabel(key: string): string {
  const found = CATEGORIAS.find((c) => c.key === key);
  return found ? found.label : key.charAt(0).toUpperCase() + key.slice(1);
}

function parseHorarioSeguro(horarioRaw: any): Record<string, { abre: string; cierra: string }> {
  if (typeof horarioRaw === 'object' && horarioRaw !== null) {
    return horarioRaw;
  }
  if (typeof horarioRaw === 'string') {
    try {
      const parsed = JSON.parse(horarioRaw);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {}
  }
  // Horario default de fallback comercial
  return {
    lun: { abre: '08:00', cierra: '20:00' },
    mar: { abre: '08:00', cierra: '20:00' },
    mie: { abre: '08:00', cierra: '20:00' },
    jue: { abre: '08:00', cierra: '20:00' },
    vie: { abre: '08:00', cierra: '21:00' },
    sab: { abre: '08:00', cierra: '21:00' },
    dom: { abre: '09:00', cierra: '19:00' },
  };
}

function isStoreOpen(horarioObj: any): { open: boolean; text: string } {
  const horario = parseHorarioSeguro(horarioObj);
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
  const abreMinutes = abreH * 60 + (abreM || 0);
  const cierraMinutes = cierraH * 60 + (cierraM || 0);

  if (currentMinutes >= abreMinutes && currentMinutes <= cierraMinutes) {
    return { open: true, text: `Abierto hoy hasta las ${dayHorario.cierra}` };
  }
  if (currentMinutes < abreMinutes) {
    return { open: false, text: `Abre hoy a las ${dayHorario.abre}` };
  }
  return { open: false, text: 'Cerrado por hoy' };
}

function formatHorarioDisplay(h: { abre: string; cierra: string }): string {
  if (!h || (!h.abre && !h.cierra)) return 'Cerrado';
  return `${h.abre} - ${h.cierra}`;
}

const DAY_LABELS: Record<string, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo',
};

const DAY_ORDER = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

/* ═══════════════════════════════════════════════
   STAR DISPLAY
   ═══════════════════════════════════════════════ */

function StarsDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: Math.min(5, full) }).map((_, i) => (
        <Star key={`f${i}`} size={size} fill="#FF9500" color="#FF9500" strokeWidth={0} />
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
    getCartItemCount,
    fetchTiendas,
    fetchProductosTienda,
    fetchResenasTienda,
    crearResenaAsync,
  } = useMarketplaceStore();

  /* ─── Local state ─── */
  const [activeTab, setActiveTab] = useState<'menu' | 'info' | 'resenas'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [favAnimating, setFavAnimating] = useState(false);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
  const [selectedProductPreview, setSelectedProductPreview] = useState<Producto | null>(null);
  const [modalResenaOpen, setModalResenaOpen] = useState(false);
  const [modalShareOpen, setModalShareOpen] = useState(false);
  const [modalContactOpen, setModalContactOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [nuevaCalificacion, setNuevaCalificacion] = useState(5);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [submittingResena, setSubmittingResena] = useState(false);
  const [previewQty, setPreviewQty] = useState(1);
  const [previewNotas, setPreviewNotas] = useState('');

  const tabsRef = useRef<HTMLDivElement>(null);

  /* ─── Cargar datos del backend ─── */
  useEffect(() => {
    fetchTiendas();
    if (tiendaId) {
      fetchProductosTienda(tiendaId);
      fetchResenasTienda(tiendaId);
    }
  }, [tiendaId, fetchTiendas, fetchProductosTienda, fetchResenasTienda]);

  /* ─── Derived data ─── */
  const tienda = useMemo(() => tiendas.find((t) => t.id === tiendaId), [tiendas, tiendaId]);

  const tiendaProductos = useMemo(
    () => productos.filter((p) => p.tiendaId === tiendaId && p.disponible),
    [productos, tiendaId]
  );

  const popularesProductos = useMemo(
    () => tiendaProductos.filter((p) => p.esPopular || p.esNuevo || (p.precioOriginal && p.precioOriginal > p.precio)),
    [tiendaProductos]
  );

  const tiendaResenas = useMemo(
    () => resenas.filter((r) => r.tiendaId === tiendaId),
    [resenas, tiendaId]
  );

  const productCategories = useMemo(() => {
    const cats = Array.from(new Set(tiendaProductos.map((p) => p.categoriaNombre || 'General')));
    return ['Todos', ...cats];
  }, [tiendaProductos]);

  const filteredProducts = useMemo(() => {
    let filtered = tiendaProductos;
    if (activeCategory !== 'Todos') {
      filtered = filtered.filter((p) => (p.categoriaNombre || 'General') === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.nombre.toLowerCase().includes(q) || (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [tiendaProductos, activeCategory, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Producto[]> = {};
    filteredProducts.forEach((p) => {
      const cat = p.categoriaNombre || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const averageRating = useMemo(() => {
    if (tiendaResenas.length === 0) return tienda?.calificacion ?? 5.0;
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

  // Teléfono formateado limpio para llamadas y WhatsApp
  const phoneInfo = useMemo(() => {
    if (!tienda) return { raw: '8888-0000', clean: '88880000', formatted: '+505 8888-0000' };
    const raw = tienda.telefono || '8888-0000';
    const clean = raw.replace(/\D/g, '') || '88880000';
    const formatted = clean.length === 8 ? `+505 ${clean.slice(0, 4)}-${clean.slice(4)}` : (raw.startsWith('+') ? raw : `+505 ${raw}`);
    return { raw, clean, formatted };
  }, [tienda]);

  // URL para compartir la tienda
  const storeShareUrl = useMemo(() => {
    if (!tienda) return '';
    return typeof window !== 'undefined'
      ? `${window.location.origin}/explorar?tienda=${tienda.id}`
      : `https://logifast.app/explorar?tienda=${tienda.id}`;
  }, [tienda]);

  /* ─── Handlers ─── */
  const handleAddToCart = (producto: Producto) => {
    if (!tienda) return;
    addToCart(producto, tienda);
    setAddedProductIds((prev) => new Set(prev).add(producto.id));
    notify.success(`¡"${producto.nombre}" agregado al carrito!`);
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
    if (!isFavorite) {
      notify.success(`¡${tienda.nombre} guardada en tus favoritos!`);
    } else {
      notify.info(`Eliminada de tus favoritos`);
    }
    setTimeout(() => setFavAnimating(false), 500);
  };

  const handleOpenShareModal = () => {
    setModalShareOpen(true);
  };

  const handleCopyShareLink = () => {
    if (!storeShareUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(storeShareUrl);
      setCopiedLink(true);
      notify.success('¡Enlace de la tienda copiado al portapapeles!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (!tienda || !storeShareUrl) return;
    const shareData = {
      title: `${tienda.nombre} en LogiFast`,
      text: `¡Pide en ${tienda.nombre} con entrega express en toda Managua por LogiFast!`,
      url: storeShareUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setModalShareOpen(false);
      } catch {}
    } else {
      handleCopyShareLink();
    }
  };

  const handleOpenGPS = (service: 'google' | 'waze' | 'apple' = 'google') => {
    if (!tienda) return;
    const lat = tienda.lat || 12.1149926;
    const lng = tienda.lng || -86.2361742;
    const label = encodeURIComponent(tienda.nombre);

    let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    if (service === 'waze') {
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    } else if (service === 'apple') {
      url = `https://maps.apple.com/?daddr=${lat},${lng}&q=${label}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyAddress = () => {
    if (!tienda?.direccion) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(tienda.direccion);
      setCopiedAddress(true);
      notify.success('¡Dirección de la tienda copiada!');
      setTimeout(() => setCopiedAddress(false), 2500);
    }
  };

  const handleCopyPhone = () => {
    if (!phoneInfo.formatted) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phoneInfo.formatted);
      setCopiedPhone(true);
      notify.success('¡Teléfono copiado al portapapeles!');
      setTimeout(() => setCopiedPhone(false), 2500);
    }
  };

  const handleSubmitResena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tienda) return;
    if (!nuevoComentario.trim()) {
      notify.error('Por favor escribe un comentario sobre tu experiencia');
      return;
    }
    setSubmittingResena(true);
    const res = await crearResenaAsync(tienda.id, nuevaCalificacion, nuevoComentario);
    setSubmittingResena(false);
    if (res.ok) {
      notify.success('¡Gracias por tu reseña! Ha sido publicada exitosamente.');
      setModalResenaOpen(false);
      setNuevoComentario('');
      setNuevaCalificacion(5);
    } else {
      notify.error(res.error || 'No se pudo enviar la reseña');
    }
  };

  const getCartItemForProduct = (productoId: string) => {
    return cartItems.find((ci) => ci.productoId === productoId);
  };

  /* ─── No store found ─── */
  if (!tienda) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'var(--text-muted)' }}>
          Tienda no encontrada o no disponible
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: 16,
            padding: '10px 24px',
            borderRadius: 12,
            background: 'var(--primario)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
          }}
        >
          Volver a Explorar
        </button>
      </div>
    );
  }

  const storeOpenInfo = isStoreOpen(tienda.horario);
  const parsedHorario = parseHorarioSeguro(tienda.horario);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--bg)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* ════════════════════════════════════════════
          1. PORTADA HERO (240px)
          ════════════════════════════════════════════ */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        {tienda.bannerUrl ? (
          <img
            src={tienda.bannerUrl}
            alt={`Portada de ${tienda.nombre}`}
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: tienda.portadaColor || tienda.logoColor || 'linear-gradient(135deg, var(--primario), #D84315)',
            }}
          />
        )}

        {/* Scrim degradado oscuro para legibilidad garantizada */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* Botón Atrás */}
        <button
          onClick={onBack}
          aria-label="Volver"
          style={{
            position: 'absolute',
            top: 20,
            left: 16,
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Botón Favorito con Micro-animación de Partículas */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleToggleFavorite}
          aria-label="Añadir a favoritos"
          style={{
            position: 'absolute',
            top: 20,
            right: 64,
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: isFavorite ? '#FF3B30' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <motion.div
            animate={favAnimating ? { scale: [1, 1.5, 0.85, 1.2, 1] } : {}}
            transition={{ duration: 0.45 }}
          >
            <Heart size={18} fill={isFavorite ? '#FF3B30' : 'none'} />
          </motion.div>
          {favAnimating && isFavorite && (
            <motion.div
              initial={{ scale: 0.5, opacity: 1, y: 0 }}
              animate={{ scale: 2.2, opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                color: '#FF3B30',
                pointerEvents: 'none',
              }}
            >
              <Heart size={18} fill="#FF3B30" color="#FF3B30" />
            </motion.div>
          )}
        </motion.button>

        {/* Botón Compartir */}
        <button
          onClick={handleOpenShareModal}
          aria-label="Compartir tienda"
          style={{
            position: 'absolute',
            top: 20,
            right: 16,
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <Share2 size={18} />
        </button>

        {/* Badge de Horario en Portada */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            padding: '6px 12px',
            borderRadius: 100,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 5,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: storeOpenInfo.open ? '#34C759' : '#FF3B30',
              boxShadow: storeOpenInfo.open ? '0 0 8px #34C759' : 'none',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif" }}>
            {storeOpenInfo.text}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          2. LOGO + INFORMACIÓN COMERCIAL
          ════════════════════════════════════════════ */}
      <div style={{ padding: '0 20px', position: 'relative' }}>
        {/* Logo Flotante */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          style={{
            position: 'relative',
            top: -40,
            width: 80,
            height: 80,
            borderRadius: 22,
            overflow: 'hidden',
            background: 'var(--surface)',
            color: 'var(--primario)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            border: '4px solid var(--surface)',
            marginBottom: -30,
          }}
        >
          {tienda.imagenUrl ? (
            <img
              src={tienda.imagenUrl}
              alt={`Logo de ${tienda.nombre}`}
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            tienda.logoIniciales || tienda.nombre.substring(0, 2).toUpperCase()
          )}
        </motion.div>

        {/* Nombre & Badges */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: 'var(--text)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {tienda.nombre}
            </h1>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 6 }}>
              {tienda.verificado && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(52, 199, 89, 0.12)',
                    color: '#34C759',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <Check size={12} /> Verificado
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
                    background: 'rgba(255, 149, 0, 0.12)',
                    color: '#FF9500',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <Sparkles size={11} /> Popular
                </span>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
              fontSize: 13,
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
            }}
          >
            <span
              onClick={() => setActiveTab('resenas')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: '#FF9500',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Star size={14} fill="#FF9500" strokeWidth={0} /> {averageRating.toFixed(1)}
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}>({tiendaResenas.length} reseñas)</span>
            </span>
            <span>•</span>
            <span style={{ textTransform: 'capitalize' }}>{categoriaLabel(tienda.categoria)}</span>
            <span>•</span>
            <span><Clock size={12} style={{ display: 'inline', marginRight: 3 }} /> {tienda.tiempoEstimado}</span>
            <span>•</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>C$ {tienda.costoEnvio} envío</span>
          </div>

          {tienda.descripcion && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 0 0', lineHeight: 1.4 }}>
              {tienda.descripcion}
            </p>
          )}
        </div>

        {/* ════════════════════════════════════════════
            3. ACCIONES RÁPIDAS
            ════════════════════════════════════════════ */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            paddingTop: 16,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <button
            onClick={() => setActiveTab('menu')}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              background: activeTab === 'menu' ? 'var(--primario)' : 'var(--surface)',
              color: activeTab === 'menu' ? '#fff' : 'var(--text)',
              border: activeTab === 'menu' ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <ShoppingBag size={14} /> Menú
          </button>

          <button
            onClick={() => setModalContactOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Phone size={14} style={{ color: 'var(--exito)' }} /> Llamar / Contacto
          </button>

          <button
            onClick={() => handleOpenGPS('google')}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Navigation size={14} style={{ color: 'var(--info)' }} /> Cómo llegar
          </button>

          <button
            onClick={() => setActiveTab('info')}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              background: activeTab === 'info' ? 'var(--primario)' : 'var(--surface)',
              color: activeTab === 'info' ? '#fff' : 'var(--text)',
              border: activeTab === 'info' ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={14} /> Horario & Info
          </button>

          <button
            onClick={() => setActiveTab('resenas')}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              background: activeTab === 'resenas' ? 'var(--primario)' : 'var(--surface)',
              color: activeTab === 'resenas' ? '#fff' : 'var(--text)',
              border: activeTab === 'resenas' ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <MessageSquare size={14} /> Reseñas
          </button>

          <button
            onClick={handleOpenShareModal}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Share2 size={14} style={{ color: 'var(--primario)' }} /> Compartir
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          4. TABS DE NAVEGACIÓN (Sticky)
          ════════════════════════════════════════════ */}
      <div
        ref={tabsRef}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'var(--bg)',
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginTop: 16,
          backdropFilter: 'blur(20px)',
        }}
      >
        {[
          { key: 'menu' as const, label: 'Menú & Productos' },
          { key: 'info' as const, label: 'Información & Horario' },
          { key: 'resenas' as const, label: `Reseñas (${tiendaResenas.length})` },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '14px 0 12px 0',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--primario)' : 'var(--text-muted)',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="tienda-tab-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '15%',
                    right: '15%',
                    height: 3,
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
          5. CONTENIDO DE TABS
          ════════════════════════════════════════════ */}
      <div style={{ padding: '0 20px 140px 20px' }}>
        <AnimatePresence mode="wait">
          {/* ─── TAB MENÚ & PRODUCTOS ─── */}
          {activeTab === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Buscador interno */}
              <div style={{ position: 'relative', marginTop: 14 }}>
                <input
                  type="text"
                  placeholder={`Buscar platillo o producto en ${tienda.nombre}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px 10px 38px',
                    borderRadius: 24,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <Search
                  size={16}
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
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* ─── CARRUSEL DE PRODUCTOS POPULARES / DESTACADOS ─── */}
              {popularesProductos.length > 0 && !searchQuery && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={16} style={{ color: 'var(--primario)' }} />
                      <h3 style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                        Lo Más Pedido & Destacados
                      </h3>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Desliza para ver más</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      overflowX: 'auto',
                      paddingBottom: 8,
                      scrollbarWidth: 'none',
                    }}
                  >
                    {popularesProductos.map((p) => {
                      const inCart = getCartItemForProduct(p.id);
                      return (
                        <motion.div
                          key={p.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedProductPreview(p)}
                          style={{
                            minWidth: 200,
                            maxWidth: 200,
                            borderRadius: 18,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: 'var(--lf-shadow-card)',
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ height: 110, position: 'relative', background: p.imagenColor || 'var(--surface)' }}>
                            {p.imagenUrl ? (
                              <img
                                src={p.imagenUrl}
                                alt={p.nombre}
                                crossOrigin="anonymous"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <ShoppingBag size={28} />
                              </div>
                            )}

                            {/* Badge de Popular o Descuento */}
                            <span
                              style={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: 'var(--primario)',
                                color: 'white',
                                fontSize: 10,
                                fontWeight: 800,
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              Popular
                            </span>
                          </div>

                          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.nombre}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3, height: 28, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {p.descripcion || 'Platillo especial del menú'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                                C$ {p.precio}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(p);
                                }}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: 'var(--primario)',
                                  color: '#fff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categorías Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  padding: '12px 0 6px 0',
                  scrollbarWidth: 'none',
                  position: 'sticky',
                  top: 48,
                  zIndex: 20,
                  background: 'var(--bg)',
                }}
              >
                {productCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1px solid var(--border)',
                      background: activeCategory === cat ? 'var(--primario)' : 'var(--surface)',
                      color: activeCategory === cat ? '#FFFFFF' : 'var(--text)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Lista Agrupada de Productos */}
              {Object.keys(groupedProducts).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No se encontraron productos en esta categoría</p>
                </div>
              ) : (
                Object.entries(groupedProducts).map(([catName, prods]) => (
                  <div key={catName} style={{ marginBottom: 24 }}>
                    <h3
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        color: 'var(--text)',
                        margin: '16px 0 10px 0',
                      }}
                    >
                      {catName}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {prods.map((producto) => {
                        const cartItem = getCartItemForProduct(producto.id);
                        const qtyInCart = cartItem ? cartItem.cantidad : 0;
                        const stockText = producto.stock !== null && producto.stock !== undefined
                          ? producto.stock <= 0
                            ? 'Agotado'
                            : producto.stock <= 5
                            ? `¡Solo ${producto.stock} disponibles!`
                            : `En stock (${producto.stock})`
                          : 'En stock';

                        return (
                          <div
                            key={producto.id}
                            onClick={() => setSelectedProductPreview(producto)}
                            style={{
                              display: 'flex',
                              gap: 14,
                              padding: 14,
                              borderRadius: 16,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              alignItems: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                                  {producto.nombre}
                                </span>
                              </div>

                              <p
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text-muted)',
                                  margin: '4px 0 8px 0',
                                  lineHeight: 1.3,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {producto.descripcion || 'Platillo preparado al momento con los mejores ingredientes.'}
                              </p>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 15,
                                    fontWeight: 800,
                                    color: 'var(--text)',
                                  }}
                                >
                                  C$ {producto.precio}
                                </span>

                                {producto.precioOriginal && (
                                  <span style={{ textDecoration: 'line-through', fontSize: 12, color: 'var(--text-muted)' }}>
                                    C$ {producto.precioOriginal}
                                  </span>
                                )}

                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: producto.stock !== null && producto.stock <= 0 ? 'rgba(255, 59, 48, 0.12)' : 'rgba(52, 199, 89, 0.12)',
                                    color: producto.stock !== null && producto.stock <= 0 ? '#FF3B30' : '#34C759',
                                  }}
                                >
                                  {stockText}
                                </span>
                              </div>
                            </div>

                            {/* Foto / Thumbnail & Botón + */}
                            <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0, borderRadius: 14, overflow: 'hidden', background: producto.imagenColor || 'var(--bg-alt)' }}>
                              {producto.imagenUrl ? (
                                <img
                                  src={producto.imagenUrl}
                                  alt={producto.nombre}
                                  crossOrigin="anonymous"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                  <ShoppingBag size={22} />
                                </div>
                              )}

                              {qtyInCart === 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(producto);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    right: 4,
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    background: 'var(--primario)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Plus size={14} />
                                </button>
                              ) : (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 2,
                                    left: 2,
                                    borderRadius: 12,
                                    background: 'var(--primario)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '2px 4px',
                                  }}
                                >
                                  <button
                                    onClick={() => cartItem && updateCartItemQty(cartItem.id, cartItem.cantidad - 1)}
                                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                                    {qtyInCart}
                                  </span>
                                  <button
                                    onClick={() => cartItem && updateCartItemQty(cartItem.id, cartItem.cantidad + 1)}
                                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ─── TAB INFORMACIÓN & HORARIOS ─── */}
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}
            >
              {/* Mapa de Ubicación con Acciones de Rutas */}
              <div
                style={{
                  width: '100%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--lf-shadow-card)',
                }}
              >
                <div style={{ width: '100%', height: 210, position: 'relative' }}>
                  <Map
                    center={[tienda.lng || -86.2361742, tienda.lat || 12.1149926]}
                    zoom={14.5}
                    className="w-full h-full"
                    dragPan={true}
                    scrollZoom={false}
                    doubleClickZoom={false}
                  >
                    <MapMarker longitude={tienda.lng || -86.2361742} latitude={tienda.lat || 12.1149926}>
                      <PinTienda nombre={tienda.nombre} logoColor={tienda.logoColor} fotoUrl={tienda.imagenUrl} />
                      <MarkerPopup>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", padding: 4 }}>
                          <strong>{tienda.nombre}</strong>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tienda.direccion}</div>
                        </div>
                      </MarkerPopup>
                    </MapMarker>
                  </Map>
                </div>

                {/* Acciones de Navegación GPS */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Compass size={16} style={{ color: 'var(--primario)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Navegar a la tienda</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleOpenGPS('google')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'var(--primario)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Navigation size={12} /> Google Maps
                    </button>
                    <button
                      onClick={() => handleOpenGPS('waze')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#33CCFF',
                        color: '#0F172A',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Waze
                    </button>
                  </div>
                </div>
              </div>

              {/* Dirección Física con Botón de Copiado */}
              <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primario-soft)', color: 'var(--primario)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Dirección Física
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2, lineHeight: 1.4 }}>
                      {tienda.direccion}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyAddress}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: copiedAddress ? 'rgba(52, 199, 89, 0.15)' : 'var(--bg-alt)',
                    border: `1px solid ${copiedAddress ? '#34C759' : 'var(--border)'}`,
                    color: copiedAddress ? '#34C759' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {copiedAddress ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedAddress ? 'Copiada' : 'Copiar'}</span>
                </button>
              </div>

              {/* Teléfono & Contacto Directo */}
              <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52, 199, 89, 0.12)', color: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Contacto Directo
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                      {phoneInfo.formatted}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setModalContactOpen(true)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: 'var(--primario)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Phone size={13} /> Contactar
                  </button>
                </div>
              </div>

              {/* Horario Semanal Completo */}
              <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} style={{ color: 'var(--primario)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase' }}>
                      Horarios de Atención
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: storeOpenInfo.open ? '#34C759' : '#EF4444',
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: storeOpenInfo.open ? 'rgba(52, 199, 89, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    }}
                  >
                    {storeOpenInfo.text}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DAY_ORDER.map((day) => {
                    const h = parsedHorario[day];
                    const isToday = day === ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][new Date().getDay()];
                    return (
                      <div
                        key={day}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: isToday ? 'var(--primario-soft)' : 'var(--bg-alt)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isToday ? 800 : 600,
                            color: isToday ? 'var(--primario)' : 'var(--text)',
                          }}
                        >
                          {DAY_LABELS[day]} {isToday && '(Hoy)'}
                        </span>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            fontWeight: isToday ? 700 : 500,
                            color: isToday ? 'var(--primario)' : 'var(--text-secondary)',
                          }}
                        >
                          {h ? formatHorarioDisplay(h) : '8:00 AM - 8:00 PM'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Políticas Comerciales */}
              <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pedido Mínimo</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>C$ {tienda.pedidoMinimo}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Costo de Envío</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>C$ {tienda.costoEnvio}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tiempo de Entrega</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{tienda.tiempoEstimado}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── TAB RESEÑAS & VALORACIONES ─── */}
          {activeTab === 'resenas' && (
            <motion.div
              key="resenas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}
            >
              {/* Header con Promedio y Botón de Escribir Reseña */}
              <div
                style={{
                  padding: 20,
                  borderRadius: 18,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                      {averageRating.toFixed(1)}
                    </div>
                    <StarsDisplay rating={averageRating} size={15} />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {tiendaResenas.length} valoraciones
                    </div>
                  </div>

                  {/* Barra de Distribución */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 140 }}>
                    {[5, 4, 3, 2, 1].map((s) => {
                      const count = ratingDistribution[s - 1];
                      const max = Math.max(...ratingDistribution, 1);
                      const pct = (count / max) * 100;
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                          <span style={{ width: 8 }}>{s}</span>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-alt)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#FF9500', borderRadius: 3 }} />
                          </div>
                          <span style={{ width: 14, textAlign: 'right' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setModalResenaOpen(true)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    background: 'var(--primario)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Star size={14} fill="#FFFFFF" /> Escribir Reseña
                </button>
              </div>

              {/* Lista de Reseñas */}
              {tiendaResenas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>Aún no hay reseñas para esta tienda. ¡Sé el primero en calificar!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tiendaResenas.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: r.clienteColor || '#0066FF',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {r.clienteInitials || r.clienteNombre.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                              {r.clienteNombre}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <StarsDisplay rating={r.estrellas} size={11} />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {r.fecha || 'Reciente'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(52, 199, 89, 0.1)', color: '#34C759' }}>
                          Compra verificada
                        </span>
                      </div>

                      {r.comentario && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          "{r.comentario}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════
          6. MODAL DE VISTA PREVIA / DETALLE PRODUCTO
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedProductPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 440,
                borderRadius: 24,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Cover Image */}
              <div style={{ height: 200, position: 'relative', background: selectedProductPreview.imagenColor || 'var(--bg-alt)' }}>
                {selectedProductPreview.imagenUrl ? (
                  <img
                    src={selectedProductPreview.imagenUrl}
                    alt={selectedProductPreview.nombre}
                    crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <ShoppingBag size={40} />
                  </div>
                )}
                <button
                  onClick={() => setSelectedProductPreview(null)}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Info & Notes */}
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primario)', textTransform: 'uppercase' }}>
                    {selectedProductPreview.categoriaNombre || 'General'}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: '4px 0' }}>
                    {selectedProductPreview.nombre}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {selectedProductPreview.descripcion || 'Preparado con ingredientes selectos y de la mejor calidad.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'var(--bg-alt)' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Precio unitario</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>
                      C$ {selectedProductPreview.precio}
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => setPreviewQty(Math.max(1, previewQty - 1))}
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 15 }}>
                      {previewQty}
                    </span>
                    <button
                      onClick={() => setPreviewQty(previewQty + 1)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={() => {
                    for (let i = 0; i < previewQty; i++) {
                      addToCart(selectedProductPreview, tienda);
                    }
                    notify.success(`¡${previewQty}x "${selectedProductPreview.nombre}" añadido al carrito!`);
                    setSelectedProductPreview(null);
                    setPreviewQty(1);
                  }}
                  style={{
                    width: '100%',
                    height: 46,
                    borderRadius: 14,
                    background: 'var(--primario)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <ShoppingBag size={18} />
                  <span>Añadir al Carrito • C$ {(selectedProductPreview.precio * previewQty).toFixed(2)}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          7. MODAL DE ESCRIBIR RESEÑA
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalResenaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 420,
                borderRadius: 22,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                  Calificar a {tienda.nombre}
                </h3>
                <button
                  onClick={() => setModalResenaOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitResena} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                    ¿Cómo calificarías tu experiencia?
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNuevaCalificacion(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          transform: star <= nuevaCalificacion ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s',
                        }}
                      >
                        <Star
                          size={28}
                          fill={star <= nuevaCalificacion ? '#FF9500' : 'none'}
                          color={star <= nuevaCalificacion ? '#FF9500' : 'var(--border)'}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 4 }}>
                    Tu Reseña o Comentario
                  </label>
                  <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Cuéntanos qué tal la comida, el tiempo de entrega o la atención..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 12,
                      background: 'var(--bg-alt)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setModalResenaOpen(false)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResena}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'var(--primario)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {submittingResena ? 'Publicando...' : 'Publicar Reseña'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          7.2 MODAL DE COMPARTIR EN ALTO NIVEL
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalShareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{
                width: '100%',
                maxWidth: 440,
                borderRadius: 24,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: 24,
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primario-soft)', color: 'var(--primario)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Share2 size={18} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                    Compartir Tienda
                  </h3>
                </div>
                <button
                  onClick={() => setModalShareOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Vista previa de la Tienda */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 16,
                  background: 'var(--bg-alt)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: tienda.logoColor || 'var(--primario)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {tienda.imagenUrl ? (
                    <img src={tienda.imagenUrl} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    tienda.logoIniciales || tienda.nombre.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tienda.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span>{categoriaLabel(tienda.categoria)}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#FF9500', fontWeight: 700 }}>
                      <Star size={12} fill="#FF9500" strokeWidth={0} /> {averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Opciones de Compartir en Alto Nivel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 1. WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Te recomiendo ${tienda.nombre} en LogiFast Nicaragua! Pide delivery express aquí: ${storeShareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: '#25D366',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Send size={18} />
                    <span>Compartir por WhatsApp</span>
                  </div>
                  <ChevronRight size={16} />
                </a>

                {/* 2. Copiar Enlace Directo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 6px 6px 14px',
                    borderRadius: 14,
                    background: 'var(--bg-alt)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {storeShareUrl}
                  </div>
                  <button
                    onClick={handleCopyShareLink}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: copiedLink ? 'rgba(52, 199, 89, 0.2)' : 'var(--surface)',
                      border: `1px solid ${copiedLink ? '#34C759' : 'var(--border)'}`,
                      color: copiedLink ? '#34C759' : 'var(--text)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      flexShrink: 0,
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 3. Compartir Nativo con Otras Aplicaciones */}
                {typeof navigator !== 'undefined' && (
                  <button
                    onClick={handleNativeShare}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 size={16} style={{ color: 'var(--primario)' }} />
                    <span>Más opciones de compartir</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          7.3 MODAL DE CONTACTO TELEFÓNICO / WHATSAPP
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalContactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{
                width: '100%',
                maxWidth: 440,
                borderRadius: 24,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: 24,
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(52, 199, 89, 0.15)', color: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                      Contactar a {tienda.nombre}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setModalContactOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} />
                <span>{storeOpenInfo.text}</span>
              </div>

              {/* Opciones de Llamada / Chat */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 1. Llamada Telefónica Directa */}
                <a
                  href={`tel:${phoneInfo.clean}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: 'var(--primario)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(255, 87, 34, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>Llamada Telefónica</div>
                      <div style={{ fontSize: 12, opacity: 0.9, fontFamily: "'JetBrains Mono', monospace" }}>{phoneInfo.formatted}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </a>

                {/* 2. WhatsApp Directo */}
                <a
                  href={`https://wa.me/505${phoneInfo.clean}?text=${encodeURIComponent(`Hola ${tienda.nombre}, vi su tienda en LogiFast y quisiera consultar información sobre sus productos.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: '#25D366',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>Chat por WhatsApp</div>
                      <div style={{ fontSize: 12, opacity: 0.9 }}>Atención personalizada</div>
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </a>

                {/* 3. Copiar Número */}
                <button
                  onClick={handleCopyPhone}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: copiedPhone ? 'rgba(52, 199, 89, 0.15)' : 'var(--bg-alt)',
                    color: copiedPhone ? '#34C759' : 'var(--text)',
                    border: `1px solid ${copiedPhone ? '#34C759' : 'var(--border)'}`,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {copiedPhone ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedPhone ? '¡Número copiado!' : `Copiar número (${phoneInfo.formatted})`}</span>
                </button>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                Para soporte con pedidos ya realizados, nuestro equipo de LogiFast está disponible 24/7.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════
          8. BOTÓN FLOTANTE DE CARRITO
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.button
            key="floating-cart"
            initial={{ scale: 0, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={onOpenCart}
            style={{
              position: 'fixed',
              bottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)',
              right: 20,
              left: 20,
              maxWidth: 420,
              margin: '0 auto',
              height: 52,
              padding: '0 20px',
              borderRadius: 26,
              background: 'var(--primario)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 12px 32px rgba(255, 87, 34, 0.4)',
              cursor: 'pointer',
              zIndex: 100,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.25)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cartItemCount}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                Ver tu Carrito
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
              <span>Ir al Checkout</span>
              <ChevronRight size={16} />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
