'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Bike,
  Store,
  Package,
  Star,
  ChevronRight,
  TrendingUp,
  Megaphone,
  CheckCircle,
  Clock,
  Zap,
  Gift,
  Plus,
  Compass,
  Flame,
  ShieldCheck,
} from '@/components/icons';
import { useStore } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';

interface ClientInicioProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'pedidos' | 'perfil' | 'puntos') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

export default function ClientInicio({
  userName,
  onNavigate,
  onOpenTracking,
}: ClientInicioProps) {
  const { orders, banners = [], feed = [], addToast } = useStore();
  const { tiendas = [], setExplorarCategoria, setTiendaSeleccionada } = useMarketplaceStore();

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adSuccessMsg, setAdSuccessMsg] = useState('');

  /* Banner auto-scroll */
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido');
  }, [orders]);

  const featuredTiendas = useMemo(() => {
    return tiendas.slice(0, 6);
  }, [tiendas]);

  const handleAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdSuccessMsg('¡Solicitud enviada! Nuestro equipo se pondrá en contacto.');
    setTimeout(() => {
      setAdSuccessMsg('');
      setAdModalOpen(false);
    }, 2500);
  };

  return (
    <div
      className="w-full min-h-screen pb-32 space-y-7 px-2 sm:px-5 pt-3"
      style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
    >
      {/* ── Active Order Tracker Widget (Generous Spacing & High Glass) ── */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={() => onOpenTracking(activeOrders[0].id)}
            className="w-full p-6 sm:p-7 rounded-[32px] cursor-pointer flex items-center justify-between transition-all duration-300 active:scale-[0.98] group"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.28) 0%, rgba(0, 86, 179, 0.38) 100%)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(0, 122, 255, 0.45)',
              boxShadow: '0 24px 48px rgba(0, 122, 255, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            }}
          >
            <div className="flex items-center gap-4.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center font-bold shadow-xl shadow-blue-500/40">
                <Bike size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-extrabold text-blue-400 tracking-wider"
                    style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                  >
                    PEDIDO EN VIVO #{activeOrders[0].id}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p
                  className="text-lg font-extrabold text-white leading-tight mt-0.5"
                  style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
                >
                  En camino a {activeOrders[0].destino}
                </p>
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <ChevronRight size={24} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Luxury Hero Banners Carousel ── */}
      <div className="w-full">
        <div
          className="w-full h-52 sm:h-64 rounded-[36px] overflow-hidden relative shadow-2xl transition-all"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 28px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBannerIdx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 p-7 sm:p-8 flex flex-col justify-end"
              style={{
                backgroundImage: banners[activeBannerIdx]?.imagenUrl
                  ? `linear-gradient(to top, rgba(15,23,42,0.95) 15%, rgba(15,23,42,0.35) 100%), url(${banners[activeBannerIdx].imagenUrl})`
                  : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <span
                  className="px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-extrabold uppercase tracking-widest shadow-md"
                  style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                >
                  PROMO LOGIFAST
                </span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Flame size={15} fill="currentColor" /> Recomendado
                </span>
              </div>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-md"
                style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
              >
                {banners[activeBannerIdx]?.titulo || 'Envíos Express & Delivery Pro'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-sans line-clamp-1 mt-1">
                {banners[activeBannerIdx]?.descripcion || 'Entrega prioritaria de mensajería, comida y compras en Managua.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Banner Indicators */}
          <div className="absolute bottom-5 right-6 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBannerIdx(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === activeBannerIdx ? 'w-8 bg-blue-500 shadow-md shadow-blue-500/50' : 'w-2.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Action Cards (Glassmorphism 2x2 with p-6 Generous Padding) ── */}
      <div className="w-full grid grid-cols-2 gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('solicitar')}
          className="p-6 rounded-[32px] text-left flex flex-col justify-between h-40 relative overflow-hidden group transition-all duration-300 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.88) 0%, rgba(15, 23, 42, 0.96) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(0, 122, 255, 0.4)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/40" style={{ width: 52, height: 52 }}>
            <Bike size={28} />
          </div>
          <div>
            <h3
              className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors"
              style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
            >
              Solicitar Envío
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Mensajería en moto</p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('explorar')}
          className="p-6 rounded-[32px] text-left flex flex-col justify-between h-40 relative overflow-hidden group transition-all duration-300 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.88) 0%, rgba(15, 23, 42, 0.96) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(52, 199, 89, 0.4)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40" style={{ width: 52, height: 52 }}>
            <Store size={28} />
          </div>
          <div>
            <h3
              className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors"
              style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
            >
              Comprar Tiendas
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Comida y productos</p>
          </div>
        </motion.button>
      </div>

      {/* ── Sponsored Ads Header ── */}
      <div className="w-full flex items-center justify-between pt-3">
        <h3
          className="text-base font-extrabold text-white flex items-center gap-2"
          style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
        >
          <Megaphone size={20} className="text-amber-400" />
          Negocios Patrocinados
        </h3>
        <button
          onClick={() => setAdModalOpen(true)}
          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors font-sans"
        >
          Anunciar negocio <Plus size={14} />
        </button>
      </div>

      {/* ── Featured Stores Glass Carousel (p-5 generous padding) ── */}
      <div className="w-full overflow-x-auto no-scrollbar flex gap-4 pb-2">
        {featuredTiendas.map((tienda) => (
          <motion.div
            key={tienda.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setTiendaSeleccionada(tienda.id);
              onNavigate('explorar');
            }}
            className="flex-shrink-0 w-52 rounded-[32px] p-5 space-y-3.5 cursor-pointer group transition-all duration-300"
            style={{
              background: 'rgba(30, 41, 59, 0.88)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 20px 44px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="w-full h-32 rounded-2xl flex items-center justify-center font-extrabold text-3xl text-white relative shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform"
              style={{
                background: tienda.logoColor || 'linear-gradient(135deg, #007AFF, #0056B3)',
                fontFamily: "var(--font-syne), 'Syne', sans-serif",
              }}
            >
              {tienda.logoIniciales || 'LG'}
              {tienda.verificado && (
                <div className="absolute top-2.5 right-2.5 bg-blue-500 text-white rounded-full p-1 shadow-md">
                  <CheckCircle size={14} />
                </div>
              )}
            </div>

            <div>
              <h4
                className="text-sm font-extrabold text-white truncate group-hover:text-blue-400 transition-colors"
                style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
              >
                {tienda.nombre}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-sans">
                <span
                  className="flex items-center gap-1 text-amber-400 font-bold"
                  style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                >
                  <Star size={13} fill="currentColor" /> {tienda.calificacion}
                </span>
                <span>•</span>
                <span>{tienda.tiempoEntrega}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Sponsor Modal Glassmorphism ── */}
      <AnimatePresence>
        {adModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-slate-900/95 border border-white/20 rounded-[32px] p-7 space-y-4 text-slate-100 shadow-2xl"
              style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
            >
              <h3
                className="text-lg font-extrabold flex items-center gap-2 text-amber-400"
                style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
              >
                <Megaphone size={22} /> Anunciar mi Negocio en Logifast
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Aparece en las primeras posiciones y atrae a miles de clientes activos por solo <strong style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}>C$ 350/mes</strong>.
              </p>

              {adSuccessMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-sm text-center border border-emerald-500/30 font-sans">
                  {adSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleAdSubmit} className="space-y-3.5 font-sans">
                  <input
                    type="text"
                    required
                    placeholder="Nombre de tu negocio o restaurante"
                    className="w-full p-4 rounded-2xl bg-slate-800/80 border border-white/15 text-xs text-slate-100 outline-none focus:border-blue-500 transition-all font-sans"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Teléfono WhatsApp de contacto"
                    className="w-full p-4 rounded-2xl bg-slate-800/80 border border-white/15 text-xs text-slate-100 outline-none focus:border-blue-500 transition-all font-sans"
                  />
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAdModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30"
                    >
                      Enviar Solicitud
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
