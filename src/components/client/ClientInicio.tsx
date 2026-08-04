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
  Shield,
  Zap,
  Gift,
  Plus,
  Compass,
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
    <div className="w-full min-h-screen pb-24 space-y-6 pt-1">
      {/* ── Active Order Tracker Widget (if any) ── */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full px-3"
          >
            <div
              onClick={() => onOpenTracking(activeOrders[0].id)}
              className="w-full p-4 rounded-3xl cursor-pointer flex items-center justify-between transition-transform active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(0,122,255,0.25) 0%, rgba(0,86,179,0.35) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 122, 255, 0.4)',
                boxShadow: '0 12px 32px rgba(0, 122, 255, 0.2)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/40">
                  <Bike size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 font-mono">
                      ORDEN EN VIVO #{activeOrders[0].id}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-sm font-bold text-slate-100 font-syne">
                    En camino a {activeOrders[0].destino}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-blue-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Banners Carousel ── */}
      <div className="w-full px-3">
        <div className="w-full h-44 sm:h-52 rounded-3xl overflow-hidden relative shadow-2xl border border-white/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBannerIdx}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent"
              style={{
                backgroundImage: banners[activeBannerIdx]?.imagenUrl
                  ? `linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.3)), url(${banners[activeBannerIdx].imagenUrl})`
                  : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-400 text-[10px] font-bold font-mono w-fit mb-2">
                PROMO DESTACADA
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-syne drop-shadow-md">
                {banners[activeBannerIdx]?.titulo || 'Envíos Rápidos en Managua'}
              </h2>
              <p className="text-xs text-slate-300 line-clamp-1">
                {banners[activeBannerIdx]?.descripcion || 'Pide tu mensajería o comida favorita con entrega en minutos.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBannerIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeBannerIdx ? 'w-6 bg-blue-500' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Action Tiles (Grid 2x2) ── */}
      <div className="w-full px-3 grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate('solicitar')}
          className="p-4 rounded-3xl text-left flex flex-col justify-between h-32 relative overflow-hidden group transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(0,86,179,0.3) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,122,255,0.3)',
          }}
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Bike size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-syne">Solicitar Envío</h3>
            <p className="text-xs text-blue-200">Mensajería exprés en moto</p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate('explorar')}
          className="p-4 rounded-3xl text-left flex flex-col justify-between h-32 relative overflow-hidden group transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(52,199,89,0.2) 0%, rgba(40,167,69,0.3) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(52,199,89,0.3)',
          }}
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Store size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-syne">Comprar Tiendas</h3>
            <p className="text-xs text-emerald-200">Restaurantes y supermercados</p>
          </div>
        </motion.button>
      </div>

      {/* ── Sponsored Ads Header ── */}
      <div className="w-full px-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-100 font-syne flex items-center gap-2">
          <Megaphone size={18} className="text-amber-400" />
          Negocios Patrocinados
        </h3>
        <button
          onClick={() => setAdModalOpen(true)}
          className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
        >
          Anunciar negocio <Plus size={14} />
        </button>
      </div>

      {/* ── Featured Stores Horizontal Scroll ── */}
      <div className="w-full overflow-x-auto no-scrollbar px-3 flex gap-3 pb-2">
        {featuredTiendas.map((tienda) => (
          <motion.div
            key={tienda.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setTiendaSeleccionada(tienda.id);
              onNavigate('explorar');
            }}
            className="flex-shrink-0 w-44 rounded-3xl p-3.5 space-y-3 cursor-pointer"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div
              className="w-full h-24 rounded-2xl flex items-center justify-center font-bold text-xl text-white relative shadow-inner"
              style={{ background: tienda.logoColor || 'linear-gradient(135deg, #007AFF, #0056B3)' }}
            >
              {tienda.logoIniciales || 'LG'}
              {tienda.verificado && (
                <CheckCircle size={16} className="absolute top-2 right-2 text-white fill-blue-500" />
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100 font-syne truncate">{tienda.nombre}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star size={12} fill="currentColor" /> {tienda.calificacion}
                </span>
                <span>•</span>
                <span>{tienda.tiempoEntrega}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Sponsor Modal ── */}
      <AnimatePresence>
        {adModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 space-y-4 text-slate-100 shadow-2xl">
              <h3 className="text-lg font-bold font-syne flex items-center gap-2 text-amber-400">
                <Megaphone size={20} /> Anunciar mi Negocio en Logifast
              </h3>
              <p className="text-xs text-slate-400">
                Aparece en las primeras posiciones y atrae a miles de clientes activos por solo <strong>C$ 350/mes</strong>.
              </p>

              {adSuccessMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-sm text-center">
                  {adSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleAdSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Nombre del negocio"
                    className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-xs text-slate-100 outline-none focus:border-blue-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Teléfono WhatsApp"
                    className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-xs text-slate-100 outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAdModalOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs"
                    >
                      Enviar Solicitud
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
