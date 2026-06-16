'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  MapPin,
  Clock,
  Megaphone,
  Tag,
  Star,
  Bell,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Plus,
  Navigation,
  MessageCircle,
  ShoppingBag,
  Store,
  Zap,
  Utensils,
  Pill,
  Gift,
  ShoppingCart,
  Smartphone,
  Dumbbell,
  Send,
  Flame,
} from 'lucide-react';
import { useStore, type Order, type Banner, type FeedItem } from '@/lib/store';
import { useMarketplaceStore, CATEGORIAS, MOCK_TIENDAS, MOCK_PRODUCTOS } from '@/lib/marketplace-store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientInicioProps {
  isDark: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const CLIENT_NAME = 'María López';

function statusColor(estado: string) {
  switch (estado) {
    case 'pendiente': return 'var(--warning, #FFB300)';
    case 'encamino': return 'var(--info, #2979FF)';
    case 'recogido': return 'var(--info, #2979FF)';
    case 'entregado': return 'var(--exito, #00C853)';
    case 'incidencia': return 'var(--peligro, #FF1744)';
    default: return 'var(--text-muted, #999)';
  }
}

function statusLabel(estado: string) {
  switch (estado) {
    case 'pendiente': return 'Pendiente';
    case 'encamino': return 'En camino';
    case 'recogido': return 'Recogido';
    case 'entregado': return 'Entregado';
    case 'incidencia': return 'Incidencia';
    default: return estado;
  }
}

function compraStatusColor(estado: string) {
  switch (estado) {
    case 'recibido': return '#FFB300';
    case 'preparando': return '#FF9800';
    case 'listo': return '#2196F3';
    case 'en_camino': return '#2979FF';
    case 'entregado': return '#00C853';
    default: return '#999';
  }
}

function compraStatusLabel(estado: string) {
  switch (estado) {
    case 'recibido': return 'Recibido';
    case 'preparando': return 'Preparando';
    case 'listo': return 'Listo';
    case 'en_camino': return 'En camino';
    case 'entregado': return 'Entregado';
    default: return estado;
  }
}

function relativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

function feedIcon(tipo: string) {
  switch (tipo) {
    case 'anuncio': return Megaphone;
    case 'promocion': return Tag;
    case 'novedad': return Star;
    case 'recordatorio': return Clock;
    case 'encuesta': return Plus;
    default: return Bell;
  }
}

function feedBadge(tipo: string) {
  switch (tipo) {
    case 'promocion': return { label: 'Promo', bg: 'var(--primario, #FF5722)', color: '#fff' };
    case 'novedad': return { label: 'Nuevo', bg: 'var(--info, #2979FF)', color: '#fff' };
    case 'anuncio': return { label: 'Aviso', bg: 'var(--text-muted, #999)', color: '#fff' };
    case 'recordatorio': return { label: 'Aviso', bg: 'var(--text-muted, #999)', color: '#fff' };
    default: return { label: 'Info', bg: 'var(--text-muted, #999)', color: '#fff' };
  }
}

/* ─── Category icon map ─── */
const CATEGORY_ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  utensils: Utensils,
  store: Store,
  pill: Pill,
  gift: Gift,
  'shopping-cart': ShoppingCart,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
};

function CategoryIcon({ name, size = 24 }: { name: string; size?: number }) {
  const Comp = CATEGORY_ICON_MAP[name];
  if (!Comp) return null;
  return <Comp size={size} />;
}

/* ═══════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientInicio({ isDark, userName, onNavigate, onOpenTracking, onOpenChat }: ClientInicioProps) {
  const orders = useStore((s) => s.orders);
  const banners = useStore((s) => s.banners);
  const feedItems = useStore((s) => s.feedItems);
  const clientSearchQuery = useStore((s) => s.clientSearchQuery);
  const setClientSearchQuery = useStore((s) => s.setClientSearchQuery);
  const setSolicitudEnvio = useStore((s) => s.setSolicitudEnvio);
  const fidelizacion = useStore((s) => s.fidelizacion);

  /* ─── Marketplace store ─── */
  const ordenesCompra = useMarketplaceStore((s) => s.ordenesCompra);
  const productos = useMarketplaceStore((s) => s.productos);

  /* ─── Loyalty calculations ─── */
  const nivelThresholds = { bronce: 100, plata: 300, oro: 600, platino: 9999 };
  const nextLevelPoints = nivelThresholds[fidelizacion.nivel];
  const pointsToNext = Math.max(0, nextLevelPoints - fidelizacion.puntos);

  /* ─── Client orders ─── */
  const clientOrders = useMemo(
    () => orders.filter((o) => o.cliente === CLIENT_NAME || o.cliente === 'Maria Lopez' || o.cliente === 'María López'),
    [orders]
  );

  const activeOrder = useMemo(
    () =>
      clientOrders.find((o) =>
        ['pendiente', 'encamino', 'recogido'].includes(o.estado)
      ) ?? null,
    [clientOrders]
  );

  const recentCompleted = useMemo(
    () => clientOrders.filter((o) => o.estado === 'entregado'),
    [clientOrders]
  );

  const lastCompleted = useMemo(
    () => (recentCompleted.length > 0 ? recentCompleted[recentCompleted.length - 1] : null),
    [recentCompleted]
  );

  /* ─── Active purchase order ─── */
  const activeCompra = useMemo(
    () => ordenesCompra.find((oc) => oc.estado !== 'entregado') ?? null,
    [ordenesCompra]
  );

  /* ─── Popular products ─── */
  const popularProducts = useMemo(
    () => productos.filter((p) => p.esPopular).slice(0, 6),
    [productos]
  );

  /* ─── Stats ─── */
  const totalEnvios = clientOrders.length;
  const totalGastado = clientOrders.reduce((s, o) => s + o.monto, 0);
  const enviosEsteMes = useMemo(() => {
    const now = new Date();
    return clientOrders.filter((o) => {
      const d = new Date(o.fecha);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [clientOrders]);

  /* ─── Search ─── */
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredOrders = useMemo(() => {
    const q = clientSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return clientOrders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.destino.toLowerCase().includes(q) ||
        o.origen.toLowerCase().includes(q)
    );
  }, [clientSearchQuery, clientOrders]);

  /* ─── Banners ─── */
  const clientBanners = useMemo(
    () =>
      banners
        .filter(
          (b) =>
            b.estado === 'activo' &&
            (b.segmento === 'todos' || b.segmento.toLowerCase().includes('cliente'))
        )
        .sort((a, b) => a.posicion - b.posicion),
    [banners]
  );

  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clientBanners.length <= 1 || bannerPaused) return;
    bannerTimer.current = setInterval(() => {
      setBannerIdx((i) => (i + 1) % clientBanners.length);
    }, 5000);
    return () => {
      if (bannerTimer.current) clearInterval(bannerTimer.current);
    };
  }, [clientBanners.length, bannerPaused]);

  /* ─── Feed ─── */
  const clientFeed = useMemo(
    () =>
      feedItems
        .filter(
          (f) =>
            f.estado === 'activo' &&
            (f.segmento === 'todos' || f.segmento.toLowerCase().includes('cliente'))
        )
        .sort((a, b) => a.posicion - b.posicion),
    [feedItems]
  );

  const [feedVisible, setFeedVisible] = useState(5);

  /* ─── Show more feed ─── */
  const showMoreFeed = useCallback(() => {
    setFeedVisible((v) => Math.min(v + 5, clientFeed.length));
  }, [clientFeed.length]);

  /* ─── Banner CTA handler ─── */
  const handleBannerCTA = useCallback(
    (banner: Banner) => {
      if (banner.botonLink === 'solicitar') {
        onNavigate('solicitar');
      }
    },
    [onNavigate]
  );

  /* ─── Feed CTA handler ─── */
  const handleFeedCTA = useCallback(
    (item: FeedItem) => {
      if (item.botonLink === 'solicitar') {
        onNavigate('solicitar');
      }
    },
    [onNavigate]
  );

  /* ─── Re-send to same address ─── */
  const handleResend = useCallback(() => {
    if (lastCompleted) {
      setSolicitudEnvio({
        destino: lastCompleted.destino,
        destinoLat: lastCompleted.destinoLat,
        destinoLng: lastCompleted.destinoLng,
      });
    }
    onNavigate('solicitar');
  }, [lastCompleted, onNavigate, setSolicitudEnvio]);

  /* ─── Notification count ─── */
  const notifCount = useMemo(() => {
    let count = 0;
    if (activeOrder) count++;
    if (activeCompra) count++;
    return count;
  }, [activeOrder, activeCompra]);

  /* ─── Haptic feedback ─── */
  const haptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div className="w-full max-w-3xl mx-auto" style={{ position: 'relative' }}>
      {/* ─────────────────────────────────────────────
          1. HEADER DE UBICACION (64px, glassmorphism)
          ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: 'var(--lf-glass-bg)',
          backdropFilter: 'blur(var(--lf-glass-blur))',
          WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
          borderBottom: '1px solid var(--lf-glass-border)',
        }}
      >
        {/* Left: Location */}
        <div style={{ cursor: 'pointer' }}>
          <div style={{
            fontSize: 11,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}>
            Entregar en:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--text)',
            }}>
              Col. Los Robles
            </span>
            <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Right: Bell with badge */}
        <button
          onClick={() => onNavigate('pedidos')}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <Bell size={22} style={{ color: 'var(--text)' }} />
          {notifCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--peligro, #FF1744)',
              color: '#fff',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}>
              {notifCount}
            </span>
          )}
        </button>
      </motion.div>

      {/* ─────────────────────────────────────────────
          SCROLLABLE CONTENT
          ───────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 140px' }}>
        {/* ─────────────────────────────────────────────
            2. BUSCADOR (52px, glassmorphism pill)
            ───────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="relative"
          style={{ marginBottom: 20 }}
        >
          <div className="relative">
            <Search
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)', zIndex: 2 }}
            />
            <input
              type="text"
              placeholder="Buscar tiendas, productos, envios..."
              value={clientSearchQuery}
              onChange={(e) => setClientSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="w-full outline-none"
              style={{
                height: 52,
                background: 'var(--lf-glass-bg)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1.5px solid ${searchFocused ? 'var(--primario, #FF5722)' : 'var(--lf-glass-border)'}`,
                borderRadius: 28,
                padding: '14px 20px 14px 48px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: 'var(--text)',
                boxShadow: searchFocused
                  ? '0 0 0 3px rgba(255,87,34,0.12)'
                  : 'var(--lf-shadow-card)',
              }}
            />
          </div>
          {/* Search results dropdown */}
          <AnimatePresence>
            {clientSearchQuery.trim().length > 0 && searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 top-full mt-2 z-30 overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  boxShadow: 'var(--lf-shadow-float)',
                }}
              >
                {filteredOrders.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {filteredOrders.map((o) => (
                      <button
                        key={o.id}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-80"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onClick={() => {
                          setClientSearchQuery('');
                          onNavigate('envios');
                        }}
                      >
                        <Package size={18} style={{ color: 'var(--primario, #FF5722)', flexShrink: 0 }} />
                        <div className="min-w-0 flex-1">
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text)' }}>
                            {o.id}
                          </div>
                          <div className="truncate" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-secondary)' }}>
                            {o.origen} → {o.destino}
                          </div>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                          style={{ background: statusColor(o.estado) + '22', color: statusColor(o.estado) }}
                        >
                          {statusLabel(o.estado)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>
                    No se encontraron envios
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─────────────────────────────────────────────
            3. CARRUSEL DE BANNERS (180px)
            ───────────────────────────────────────────── */}
        {clientBanners.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            style={{ marginBottom: 24 }}
            onTouchStart={() => setBannerPaused(true)}
            onTouchEnd={() => setBannerPaused(false)}
            onMouseEnter={() => setBannerPaused(true)}
            onMouseLeave={() => setBannerPaused(false)}
          >
            {/* Horizontal scroll carousel */}
            <div
              ref={bannerScrollRef}
              className="lf-scrollbar"
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                paddingLeft: 0,
                paddingRight: 0,
                paddingBottom: 8,
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {clientBanners.map((banner, i) => (
                <div
                  key={banner.id}
                  style={{
                    minWidth: 'calc(100vw - 48px)',
                    maxWidth: 'calc(100vw - 48px)',
                    scrollSnapAlign: 'start',
                    borderRadius: 24,
                    minHeight: 170,
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (i === bannerIdx) handleBannerCTA(banner);
                    else setBannerIdx(i);
                  }}
                >
                  <BannerSlideCard
                    banner={banner}
                    isDark={isDark}
                    onCTA={handleBannerCTA}
                    isActive={i === bannerIdx}
                  />
                </div>
              ))}
            </div>

            {/* Progress bar (not dots) */}
            {clientBanners.length > 1 && (
              <div style={{ marginTop: 10, padding: '0 4px' }}>
                <div style={{
                  width: '100%',
                  height: 3,
                  borderRadius: 2,
                  background: 'var(--border)',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      background: 'var(--primario)',
                    }}
                    animate={{
                      width: `${((bannerIdx + 1) / clientBanners.length) * 100}%`,
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────
            4. QUICK ACTIONS DUAL (100px)
            ───────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}
        >
          {/* Enviar */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => { haptic(); onNavigate('solicitar'); }}
            style={{
              padding: 18,
              borderRadius: 20,
              minHeight: 100,
              background: 'linear-gradient(135deg, #FF5722, #FF8A65)',
              color: '#fff',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Send size={20} color="#fff" />
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff' }}>
              Enviar
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              Paquetes y documentos
            </div>
          </motion.div>

          {/* Comprar */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => { haptic(); onNavigate('explorar'); }}
            style={{
              padding: 18,
              borderRadius: 20,
              minHeight: 100,
              background: 'linear-gradient(135deg, #1B1B2F, #3949AB)',
              color: '#fff',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}>
              <ShoppingBag size={20} color="#fff" />
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff' }}>
              Comprar
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              Tiendas y productos locales
            </div>
          </motion.div>
        </motion.div>

        {/* ─────────────────────────────────────────────
            LOYALTY POINTS CARD
            ───────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2.5}
          style={{ marginBottom: 28 }}
        >
          <div style={{
            padding: '14px 16px',
            background: 'var(--surface)',
            borderRadius: 'var(--lf-card-radius, 22px)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--lf-shadow-card)',
          }}>
            <div style={{
              fontSize: 11,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              color: 'var(--text-muted)',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}>
              Puntos LOGIFAST
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--primario)',
              }}>
                {fidelizacion.puntos}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>puntos</span>
            </div>
            {/* Progress bar to next level */}
            <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: 'var(--bg-alt)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(90deg, var(--primario), var(--primario-hover))',
                width: `${Math.min(100, (fidelizacion.puntos / nextLevelPoints) * 100)}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {pointsToNext} puntos para tu proximo descuento
            </div>
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────
            5. CATEGORIAS (90px)
            ───────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          style={{ marginBottom: 28 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>
              Explora
            </h3>
            <button
              onClick={() => onNavigate('explorar')}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'var(--primario)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Ver todas
            </button>
          </div>
          <div
            className="lf-scrollbar"
            style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {CATEGORIAS.map(cat => (
              <motion.button
                key={cat.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptic(); onNavigate('explorar'); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 16px',
                  borderRadius: 16,
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  minWidth: 80,
                  flexShrink: 0,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primario)' }}>
                  <CategoryIcon name={cat.icon} size={24} />
                </span>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' as const, fontFamily: "'DM Sans', sans-serif" }}>
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────
            6. TIENDAS DESTACADAS
            ───────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          style={{ marginBottom: 28 }}
        >
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 12 }}>
            Populares cerca de ti
          </h3>
          <div
            className="lf-scrollbar"
            style={{
              display: 'flex',
              gap: 14,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              paddingBottom: 8,
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {MOCK_TIENDAS.filter(t => t.popular).map(tienda => (
              <motion.div
                key={tienda.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('explorar')}
                style={{
                  width: 220,
                  borderRadius: 'var(--lf-card-radius, 22px)',
                  overflow: 'hidden',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--lf-shadow-card)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  position: 'relative',
                }}
              >
                {/* Cover */}
                <div style={{
                  height: 120,
                  background: `linear-gradient(135deg, ${tienda.portadaColor}, ${tienda.logoColor})`,
                  position: 'relative',
                }}>
                  {/* Subtle pattern overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
                  }} />
                </div>
                {/* Logo */}
                <div style={{
                  position: 'absolute',
                  bottom: -18,
                  left: 14,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: tienda.logoColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid var(--surface)',
                  boxShadow: 'var(--lf-shadow-card)',
                }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: '#fff' }}>
                    {tienda.logoIniciales}
                  </span>
                </div>
                {/* Info */}
                <div style={{ padding: '24px 14px 14px' }}>
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'var(--text)',
                    marginBottom: 4,
                  }}>
                    {tienda.nombre}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexWrap: 'wrap' as const,
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <Star size={11} fill="var(--warning, #FFB300)" stroke="none" />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 12 }}>
                        {tienda.calificacion}
                      </span>
                    </span>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span>{tienda.tiempoEstimado}</span>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span>Envio C${tienda.costoEnvio}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─────────────────────────────────────────────
            7. PRODUCTOS POPULARES
            ───────────────────────────────────────────── */}
        {popularProducts.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            style={{ marginBottom: 28 }}
          >
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 12 }}>
              Lo mas pedido
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {popularProducts.map(product => {
                const tienda = MOCK_TIENDAS.find(t => t.id === product.tiendaId);
                return (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onNavigate('explorar')}
                    style={{
                      borderRadius: 20,
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: 'var(--lf-shadow-card)',
                    }}
                  >
                    {/* Image / Color block */}
                    <div style={{
                      height: 140,
                      background: product.imagenColor,
                      position: 'relative',
                    }}>
                      {/* Subtle pattern */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.2) 0%, transparent 60%)',
                      }} />
                      {/* + button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const tiendaData = MOCK_TIENDAS.find(t => t.id === product.tiendaId);
                          if (tiendaData) {
                            useMarketplaceStore.getState().addToCart(product, tiendaData);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'var(--primario)',
                          border: 'none',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(255,87,34,0.3)',
                        }}
                      >
                        <Plus size={18} />
                      </motion.button>
                    </div>
                    {/* Body */}
                    <div style={{ padding: 12 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {product.nombre}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontFamily: "'DM Sans', sans-serif",
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {tienda?.nombre}
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 16,
                        color: 'var(--text)',
                        marginTop: 4,
                      }}>
                        C${product.precio}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────
            ACTIVE SHIPMENT (inline, not floating)
            ───────────────────────────────────────────── */}
        {activeOrder && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
            className="relative overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--lf-card-radius, 22px)',
              padding: 20,
              cursor: 'pointer',
              boxShadow: 'var(--lf-shadow-card)',
              marginBottom: 16,
            }}
            onClick={() => onOpenTracking(activeOrder.id)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                Tu envio activo
              </span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: statusColor(activeOrder.estado) + '1A', color: statusColor(activeOrder.estado) }}
              >
                {statusLabel(activeOrder.estado)}
              </span>
            </div>

            {/* Order ID */}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-secondary)' }}>
              {activeOrder.id}
            </div>

            {/* Route */}
            <div className="flex items-center gap-2 mt-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text)' }}>
              <MapPin size={14} style={{ color: 'var(--primario, #FF5722)', flexShrink: 0 }} />
              <span className="truncate">De: {activeOrder.origen}</span>
              <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="truncate">A: {activeOrder.destino}</span>
            </div>

            {/* Rider */}
            {activeOrder.repartidor && (
              <div className="flex items-center gap-2.5 mt-3">
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--primario, #FF5722)',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {activeOrder.repartidorInitials}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text)' }}>
                  {activeOrder.repartidor}
                </span>
              </div>
            )}

            {/* ETA */}
            <div className="mt-3">
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--primario, #FF5722)' }}>
                Llega en ~15 min
              </span>
            </div>

            {/* Mini map placeholder */}
            <div className="mt-3 flex items-center justify-center" style={{
              height: 160,
              borderRadius: 14,
              background: 'var(--bg-alt)',
              border: '1px dashed var(--border)',
            }}>
              <div className="flex flex-col items-center gap-1.5">
                <MapPin size={20} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                  Mapa en tiempo real
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={(e) => { e.stopPropagation(); onOpenTracking(activeOrder.id); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--primario)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Navigation size={14} />
                Seguimiento
              </button>
              {activeOrder.repartidor && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenChat(activeOrder.id); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <MessageCircle size={14} />
                  Mensaje
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────
            ACTIVE PURCHASE CARD
            ───────────────────────────────────────────── */}
        {activeCompra && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6.5}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--lf-card-radius, 22px)',
              padding: 20,
              cursor: 'pointer',
              boxShadow: 'var(--lf-shadow-card)',
              marginBottom: 16,
            }}
            onClick={() => onNavigate('pedidos')}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} style={{ color: 'var(--primario, #FF5722)' }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                  Tu compra activa
                </span>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: compraStatusColor(activeCompra.estado) + '1A', color: compraStatusColor(activeCompra.estado) }}
              >
                {compraStatusLabel(activeCompra.estado)}
              </span>
            </div>

            {/* Store info */}
            <div className="flex items-center gap-3">
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: activeCompra.tiendaColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}>
                {activeCompra.tiendaLogo}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                  {activeCompra.tiendaNombre}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  {activeCompra.items.length} productos · C${activeCompra.total}
                </div>
              </div>
            </div>

            {/* Rider info */}
            <div className="flex items-center gap-2.5 mt-3">
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--primario, #FF5722)',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {activeCompra.repartidorInitials}
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text)' }}>
                {activeCompra.repartidorNombre}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: 'var(--bg-alt)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 2,
                background: compraStatusColor(activeCompra.estado),
                width: activeCompra.estado === 'recibido' ? '15%' : activeCompra.estado === 'preparando' ? '40%' : activeCompra.estado === 'listo' ? '65%' : activeCompra.estado === 'en_camino' ? '85%' : '100%',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────
            REORDER SECTION
            ───────────────────────────────────────────── */}
        {ordenesCompra.filter(oc => oc.estado === 'entregado').length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={7}
            style={{ marginBottom: 28 }}
          >
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 12 }}>
              Volver a pedir
            </h3>
            <div
              className="lf-scrollbar"
              style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {ordenesCompra.filter(oc => oc.estado === 'entregado').slice(0, 3).map(oc => (
                <motion.div
                  key={oc.id}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    minWidth: 220,
                    flexShrink: 0,
                    cursor: 'pointer',
                    boxShadow: 'var(--lf-shadow-card)',
                  }}
                  onClick={() => onNavigate('explorar')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: oc.tiendaColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                    }}>
                      {oc.tiendaLogo}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{oc.tiendaNombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{oc.items.length} productos · C${oc.total}</div>
                    </div>
                  </div>
                  <button style={{
                    padding: '6px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--primario)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Reordenar
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────
            CLIENT FEED
            ───────────────────────────────────────────── */}
        {clientFeed.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={8}
            style={{ marginBottom: 28 }}
          >
            <div className="space-y-3">
              {clientFeed.slice(0, feedVisible).map((item) => {
                const IconComp = feedIcon(item.tipo);
                const badge = feedBadge(item.tipo);
                return (
                  <div
                    key={item.id}
                    className="relative overflow-hidden"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--lf-card-radius, 22px)',
                      padding: 16,
                      boxShadow: 'var(--lf-shadow-card)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        }}
                      >
                        <IconComp size={18} style={{ color: 'var(--primario, #FF5722)' }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text)' }}>
                            {item.titulo}
                          </span>
                          <span
                            className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          {item.descripcion}
                        </p>

                        <div className="flex items-center gap-3 mt-2">
                          {item.botonTexto && (
                            <button
                              onClick={() => handleFeedCTA(item)}
                              className="flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
                              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--primario, #FF5722)' }}
                            >
                              {item.botonTexto}
                              <ChevronRight size={14} />
                            </button>
                          )}
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>
                            {relativeTime(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {clientFeed.length > feedVisible && (
                <button
                  onClick={showMoreFeed}
                  className="w-full py-3 rounded-xl text-center font-semibold transition-opacity hover:opacity-80"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: 'var(--primario, #FF5722)',
                    background: isDark ? 'rgba(255,87,34,0.08)' : 'rgba(255,87,34,0.05)',
                  }}
                >
                  Ver mas
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────
            RECENT SHIPMENT SHORTCUT
            ───────────────────────────────────────────── */}
        {!activeOrder && lastCompleted && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={9}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--lf-card-radius, 22px)',
              padding: 16,
              boxShadow: 'var(--lf-shadow-card)',
              marginBottom: 16,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                Tu ultimo envio
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(0,200,83,0.12)', color: 'var(--exito, #00C853)' }}
              >
                Entregado
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-secondary)' }}>
                {lastCompleted.id}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
              <span className="truncate" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-secondary)' }}>
                {lastCompleted.destino}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                {lastCompleted.fecha}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text)' }}>
                C$ {lastCompleted.monto}
              </span>
            </div>

            <button
              onClick={handleResend}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-80"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: 'var(--primario, #FF5722)',
                background: isDark ? 'rgba(255,87,34,0.12)' : 'rgba(255,87,34,0.08)',
              }}
            >
              <Plus size={15} />
              Volver a enviar a la misma direccion
            </button>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────
            STATS
            ───────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={10}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <StatBox value={totalEnvios} label="envios totales" isDark={isDark} />
          <StatBox value={`C$ ${totalGastado}`} label="gastados" isDark={isDark} />
          <StatBox value={enviosEsteMes} label="envios este mes" isDark={isDark} />
        </motion.div>
      </div>

      {/* ─────────────────────────────────────────────
          8. ENVIO ACTIVO (floating bar, glassmorphism)
          ───────────────────────────────────────────── */}
      {activeOrder && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
          onClick={() => onOpenTracking(activeOrder.id)}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--lf-bottom-nav-height, 72px) + var(--lf-safe-bottom, 0px) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 480,
            zIndex: 35,
            background: 'var(--lf-glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px 20px 20px 20px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            boxShadow: 'var(--lf-shadow-float)',
            border: '1px solid var(--lf-glass-border)',
          }}
        >
          {/* Pulsing blue dot */}
          <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--info, #2979FF)',
              position: 'absolute',
              top: 0,
              left: 0,
            }} />
            <motion.div
              animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--info, #2979FF)',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          </div>

          {/* Order info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}>
              {activeOrder.id} En camino
            </div>
          </div>

          {/* ETA */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--primario)',
            flexShrink: 0,
          }}>
            ~12 min
          </div>

          {/* Arrow */}
          <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

/* ─── Banner Slide Card (for horizontal carousel) ─── */
function BannerSlideCard({
  banner,
  isDark,
  onCTA,
  isActive,
}: {
  banner: Banner;
  isDark: boolean;
  onCTA: (b: Banner) => void;
  isActive: boolean;
}) {
  const bgStyle: React.CSSProperties = banner.gradiente
    ? {
        background: `linear-gradient(${banner.gradiente.direction}, ${banner.gradiente.from}, ${banner.gradiente.to})`,
      }
    : {
        background: banner.colorFondo,
      };

  if (banner.tipo === 'notificacion') {
    return (
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ ...bgStyle, borderRadius: 24, color: banner.colorTexto, minHeight: 170 }}
      >
        <Bell size={18} style={{ flexShrink: 0 }} />
        <span className="flex-1 font-medium" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          {banner.titulo}
        </span>
        {banner.botonTexto && (
          <button
            onClick={(e) => { e.stopPropagation(); onCTA(banner); }}
            className="shrink-0 px-3 py-1.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.2)', color: banner.colorTexto }}
          >
            {banner.botonTexto}
          </button>
        )}
      </div>
    );
  }

  /* promo_grande / tarjeta_compacta / slider — unified carousel style */
  return (
    <div
      className="relative overflow-hidden"
      style={{ ...bgStyle, borderRadius: 24, padding: 28, color: banner.colorTexto, minHeight: 170 }}
    >
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 24, color: '#fff' }}>
        {banner.titulo}
      </div>
      {banner.subtitulo && (
        <div className="mt-1.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
          {banner.subtitulo}
        </div>
      )}
      {banner.botonTexto && (
        <button
          onClick={(e) => { e.stopPropagation(); onCTA(banner); }}
          className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm transition-transform hover:scale-105"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            background: '#fff',
            color: 'var(--primario, #FF5722)',
          }}
        >
          {banner.botonTexto}
          <ArrowRight size={15} />
        </button>
      )}
      {/* Decorative elements */}
      <div
        className="absolute -right-10 -bottom-10 rounded-full pointer-events-none"
        style={{ width: 140, height: 140, background: 'rgba(255,255,255,0.06)' }}
      />
      <div
        className="absolute right-16 -top-8 rounded-full pointer-events-none"
        style={{ width: 100, height: 100, background: 'rgba(255,255,255,0.04)' }}
      />
    </div>
  );
}

/* ─── Stat Box ─── */
function StatBox({
  value,
  label,
  isDark,
}: {
  value: string | number;
  label: string;
  isDark: boolean;
}) {
  return (
    <div
      className="text-center py-3 px-2"
      style={{
        borderRadius: 16,
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </div>
      <div className="mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  );
}
