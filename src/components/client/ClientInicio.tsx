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
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useStore, type Order, type Banner, type FeedItem } from '@/lib/store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientInicioProps {
  isDark: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'perfil') => void;
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

function relativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
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

export default function ClientInicio({ isDark, userName, onNavigate }: ClientInicioProps) {
  const orders = useStore((s) => s.orders);
  const banners = useStore((s) => s.banners);
  const feedItems = useStore((s) => s.feedItems);
  const clientSearchQuery = useStore((s) => s.clientSearchQuery);
  const setClientSearchQuery = useStore((s) => s.setClientSearchQuery);
  const setSolicitudEnvio = useStore((s) => s.setSolicitudEnvio);

  /* ─── Client orders ─── */
  const clientOrders = useMemo(
    () => orders.filter((o) => o.cliente === CLIENT_NAME || o.cliente === 'Maria López'),
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

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-8 space-y-6">
      {/* ─── 1. PERSONALIZED GREETING ─── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2"
      >
        <div>
          <h1
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, color: 'var(--text)' }}
          >
            Hola, {userName}
          </h1>
          <p
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text-secondary)' }}
          >
            ¿Qué envío haremos hoy?
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full self-start sm:self-center"
          style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          <MapPin size={14} style={{ color: 'var(--primario, #FF5722)' }} />
          Managua · 28°C
        </div>
      </motion.div>

      {/* ─── 2. QUICK SEARCH ─── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="relative"
      >
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Buscar envío por ID, destino..."
            value={clientSearchQuery}
            onChange={(e) => setClientSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full outline-none transition-shadow"
            style={{
              background: 'var(--bg-alt)',
              border: `1.5px solid ${searchFocused ? 'var(--primario, #FF5722)' : 'var(--border)'}`,
              borderRadius: 16,
              padding: '16px 20px 16px 48px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              color: 'var(--text)',
              boxShadow: searchFocused
                ? '0 0 0 3px rgba(255,87,34,0.12)'
                : 'none',
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
              className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl overflow-hidden"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
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
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 13,
                            color: 'var(--text)',
                          }}
                        >
                          {o.id}
                        </div>
                        <div
                          className="truncate"
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {o.origen} → {o.destino}
                        </div>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                        style={{
                          background: statusColor(o.estado) + '22',
                          color: statusColor(o.estado),
                        }}
                      >
                        {statusLabel(o.estado)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className="px-4 py-6 text-center"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: 'var(--text-muted)',
                  }}
                >
                  No se encontraron envíos
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── 3. PROMOTIONAL BANNERS ─── */}
      {clientBanners.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          onMouseEnter={() => setBannerPaused(true)}
          onMouseLeave={() => setBannerPaused(false)}
        >
          <div className="relative overflow-hidden" style={{ borderRadius: 20 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={clientBanners[bannerIdx].id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <BannerCard
                  banner={clientBanners[bannerIdx]}
                  isDark={isDark}
                  onCTA={handleBannerCTA}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Dot indicators */}
          {clientBanners.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {clientBanners.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setBannerIdx(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === bannerIdx ? 20 : 8,
                    height: 8,
                    background:
                      i === bannerIdx
                        ? 'var(--primario, #FF5722)'
                        : isDark
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(0,0,0,0.12)',
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── 4. QUICK SEND ─── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
      >
        <button
          onClick={() => onNavigate('solicitar')}
          className="w-full text-left group relative overflow-hidden"
          style={{
            background: isDark
              ? 'rgba(255,87,34,0.85)'
              : 'var(--primario, #FF5722)',
            borderRadius: 20,
            padding: 24,
            border: isDark ? '1.5px solid rgba(255,255,255,0.1)' : 'none',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,87,34,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
              }}
            >
              <Package size={24} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#fff',
                }}
              >
                Solicita tu envío
              </div>
              <div
                className="mt-1"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Entrega rápida y segura a cualquier punto de Managua
              </div>
            </div>
            <div
              className="shrink-0 self-center flex items-center gap-1.5 px-5 py-3 rounded-xl font-bold transition-transform group-hover:scale-105"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                background: '#fff',
                color: 'var(--primario, #FF5722)',
              }}
            >
              Enviar ahora
              <ArrowRight size={16} />
            </div>
          </div>
          {/* Decorative circles */}
          <div
            className="absolute -right-8 -bottom-8 rounded-full pointer-events-none"
            style={{ width: 120, height: 120, background: 'rgba(255,255,255,0.06)' }}
          />
          <div
            className="absolute -right-4 -top-6 rounded-full pointer-events-none"
            style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.04)' }}
          />
        </button>
      </motion.div>

      {/* ─── 5. ACTIVE SHIPMENT ─── */}
      {activeOrder && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="relative overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 20,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--text)',
              }}
            >
              Tu envío activo
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: statusColor(activeOrder.estado) + '1A',
                color: statusColor(activeOrder.estado),
              }}
            >
              {statusLabel(activeOrder.estado)}
            </span>
          </div>

          {/* Order ID */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            {activeOrder.id}
          </div>

          {/* Route */}
          <div
            className="flex items-center gap-2 mt-2"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'var(--text)',
            }}
          >
            <MapPin size={14} style={{ color: 'var(--primario, #FF5722)', flexShrink: 0 }} />
            <span className="truncate">De: {activeOrder.origen}</span>
            <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="truncate">A: {activeOrder.destino}</span>
          </div>

          {/* Rider */}
          {activeOrder.repartidor && (
            <div className="flex items-center gap-2.5 mt-3">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--primario, #FF5722)',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {activeOrder.repartidorInitials}
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: 'var(--text)',
                }}
              >
                {activeOrder.repartidor}
              </span>
            </div>
          )}

          {/* ETA */}
          <div className="mt-3">
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: 'var(--primario, #FF5722)',
              }}
            >
              Llega en ~15 min
            </span>
          </div>

          {/* Mini map placeholder */}
          <div
            className="mt-3 flex items-center justify-center"
            style={{
              height: 160,
              borderRadius: 14,
              background: 'var(--bg-alt)',
              border: '1px dashed var(--border)',
            }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <MapPin size={20} style={{ color: 'var(--text-muted)' }} />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                Mapa en tiempo real
              </span>
            </div>
          </div>

          {/* Tracking button */}
          <button
            onClick={() => onNavigate('envios')}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl transition-opacity hover:opacity-85"
            style={{
              background: isDark ? 'rgba(255,87,34,0.12)' : 'rgba(255,87,34,0.08)',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--primario, #FF5722)',
            }}
          >
            Ver seguimiento completo
            <ChevronRight size={16} />
          </button>
        </motion.div>
      )}

      {/* ─── 6. CLIENT FEED ─── */}
      {clientFeed.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
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
                    borderRadius: 16,
                    padding: 16,
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
                        <span
                          className="font-semibold"
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 15,
                            color: 'var(--text)',
                          }}
                        >
                          {item.titulo}
                        </span>
                        <span
                          className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p
                        className="mt-0.5"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14,
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {item.descripcion}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        {item.botonTexto && (
                          <button
                            onClick={() => handleFeedCTA(item)}
                            className="flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: 13,
                              color: 'var(--primario, #FF5722)',
                            }}
                          >
                            {item.botonTexto}
                            <ChevronRight size={14} />
                          </button>
                        )}
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 12,
                            color: 'var(--text-muted)',
                          }}
                        >
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
                Ver más
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── 7. RECENT SHIPMENT SHORTCUT ─── */}
      {!activeOrder && lastCompleted && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={6}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text)',
              }}
            >
              Tu último envío
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(0,200,83,0.12)',
                color: 'var(--exito, #00C853)',
              }}
            >
              Entregado
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              {lastCompleted.id}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
            <span
              className="truncate"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              {lastCompleted.destino}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              {lastCompleted.fecha}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>·</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: 'var(--text)',
              }}
            >
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
            Volver a enviar a la misma dirección
          </button>
        </motion.div>
      )}

      {/* ─── 8. CLIENT STATS ─── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={7}
        className="grid grid-cols-3 gap-3 pt-2"
      >
        <StatBox value={totalEnvios} label="envíos totales" isDark={isDark} />
        <StatBox value={`C$ ${totalGastado}`} label="gastados" isDark={isDark} />
        <StatBox value={enviosEsteMes} label="envíos este mes" isDark={isDark} />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

/* ─── Banner Card ─── */
function BannerCard({
  banner,
  isDark,
  onCTA,
}: {
  banner: Banner;
  isDark: boolean;
  onCTA: (b: Banner) => void;
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
        style={{ ...bgStyle, borderRadius: 14, color: banner.colorTexto }}
      >
        <Bell size={18} style={{ flexShrink: 0 }} />
        <span
          className="flex-1 font-medium"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
        >
          {banner.titulo}
        </span>
        {banner.botonTexto && (
          <button
            onClick={() => onCTA(banner)}
            className="shrink-0 px-3 py-1.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.2)', color: banner.colorTexto }}
          >
            {banner.botonTexto}
          </button>
        )}
      </div>
    );
  }

  if (banner.tipo === 'tarjeta_compacta') {
    return (
      <div
        className="relative overflow-hidden"
        style={{ ...bgStyle, borderRadius: 16, padding: 20, color: banner.colorTexto }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          {banner.titulo}
        </div>
        {banner.subtitulo && (
          <div
            className="mt-1"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              opacity: 0.8,
            }}
          >
            {banner.subtitulo}
          </div>
        )}
        {banner.botonTexto && (
          <button
            onClick={() => onCTA(banner)}
            className="mt-3 flex items-center gap-1 font-semibold transition-opacity hover:opacity-90"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: banner.colorTexto,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            {banner.botonTexto}
            <ChevronRight size={14} />
          </button>
        )}
        <div
          className="absolute -right-6 -bottom-6 rounded-full pointer-events-none"
          style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.07)' }}
        />
      </div>
    );
  }

  if (banner.tipo === 'slider') {
    return (
      <div
        className="flex items-center gap-4"
        style={{ ...bgStyle, borderRadius: 16, padding: '16px 20px', color: banner.colorTexto }}
      >
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {banner.titulo}
          </div>
          {banner.subtitulo && (
            <div
              className="mt-0.5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                opacity: 0.8,
              }}
            >
              {banner.subtitulo}
            </div>
          )}
        </div>
        {banner.botonTexto && (
          <button
            onClick={() => onCTA(banner)}
            className="shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-transform hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.2)', color: banner.colorTexto }}
          >
            {banner.botonTexto}
          </button>
        )}
      </div>
    );
  }

  /* promo_grande (default) */
  return (
    <div
      className="relative overflow-hidden"
      style={{ ...bgStyle, borderRadius: 20, padding: 28, color: banner.colorTexto }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 22,
        }}
      >
        {banner.titulo}
      </div>
      {banner.subtitulo && (
        <div
          className="mt-1.5"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            opacity: 0.85,
          }}
        >
          {banner.subtitulo}
        </div>
      )}
      {banner.botonTexto && (
        <button
          onClick={() => onCTA(banner)}
          className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-105"
          style={{
            fontFamily: "'Syne', sans-serif",
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
      className="text-center py-3 px-2 rounded-xl"
      style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {value}
      </div>
      <div
        className="mt-0.5"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </div>
    </div>
  );
}
