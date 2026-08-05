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
  MapPin,
  X,
  Wallet,
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
  userName = 'Cliente',
  onNavigate,
  onOpenTracking,
}: ClientInicioProps) {
  const { orders, banners = [] } = useStore();
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
    return orders.filter(
      (o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido'
    );
  }, [orders]);

  const featuredTiendas = useMemo(() => {
    return tiendas.slice(0, 6);
  }, [tiendas]);

  const handleAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdSuccessMsg('¡Solicitud enviada! Nuestro equipo comercial te contactará en breve.');
    setTimeout(() => {
      setAdSuccessMsg('');
      setAdModalOpen(false);
    }, 2500);
  };

  return (
    <div
      className="w-full max-w-md mx-auto px-3.5 sm:px-4 py-3 space-y-4 pb-28 font-sans"
      style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif" }}
    >
      {/* ── TOP NATIVE HEADER ── */}
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold tracking-tight">
            <MapPin size={13} className="text-blue-500" />
            <span>Managua, Nicaragua</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
            ¡Hola, {userName.split(' ')[0]}! 👋
          </h1>
        </div>

        <button
          onClick={() => onNavigate('puntos')}
          className="px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Gift size={15} className="text-amber-500" />
          <span>Puntos LogiFast</span>
        </button>
      </div>

      {/* ── SEARCH TRIGGER BAR ── */}
      <div
        onClick={() => onNavigate('explorar')}
        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2.5 text-slate-400 dark:text-slate-500 text-xs sm:text-sm cursor-pointer shadow-sm hover:border-blue-400 transition-all"
      >
        <Search size={17} className="text-slate-400" />
        <span className="flex-1 font-medium text-slate-500 dark:text-slate-400">
          ¿Qué deseas pedir o enviar hoy?
        </span>
        <span className="px-2 py-0.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
          Buscar
        </span>
      </div>

      {/* ── ACTIVE ORDER WIDGET ── */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => onOpenTracking(activeOrders[0].id)}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
                <Bike size={22} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                    Envío en curso • #{activeOrders[0].id.substring(0, 8)}
                  </p>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                  {activeOrders[0].destino}
                </h4>
                <p className="text-[11px] text-blue-100">
                  {activeOrders[0].repartidor ? `Repartidor: ${activeOrders[0].repartidor}` : 'Buscando repartidor cercano...'}
                </p>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronRight size={18} className="text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO BANNER CAROUSEL ── */}
      <div className="w-full rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 shadow-md p-4 text-white relative overflow-hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} /> Promoción Especial
          </span>
          <div className="flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBannerIdx(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  activeBannerIdx === idx ? 'w-5 bg-blue-500' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
            {banners[activeBannerIdx]?.titulo || 'Envíos Express & Compras Rápidas'}
          </h2>
          <p className="text-xs text-slate-300 line-clamp-2">
            {(banners[activeBannerIdx] as any)?.descripcion || 'Tu mensajería y delivery de confianza en toda Managua con cobertura total.'}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={() => onNavigate('solicitar')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all"
          >
            <span>Pedir Ahora</span>
            <ChevronRight size={14} />
          </button>
          <span className="text-[11px] text-slate-400 font-semibold">LogiFast Nicaragua</span>
        </div>
      </div>

      {/* ── QUICK ACTIONS GRID (4 COLUMNS) ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-0.5">
          Servicios Rápidos
        </h3>

        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          <button
            onClick={() => onNavigate('solicitar')}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 flex flex-col items-center justify-center text-center space-y-1.5 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Bike size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
              Solicitar Envío
            </span>
          </button>

          <button
            onClick={() => onNavigate('explorar')}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 flex flex-col items-center justify-center text-center space-y-1.5 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Store size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
              Tiendas
            </span>
          </button>

          <button
            onClick={() => onNavigate('envios')}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 flex flex-col items-center justify-center text-center space-y-1.5 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Package size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
              Mis Envíos
            </span>
          </button>

          <button
            onClick={() => onNavigate('puntos')}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 flex flex-col items-center justify-center text-center space-y-1.5 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Wallet size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
              Billetera
            </span>
          </button>
        </div>
      </div>

      {/* ── FEATURED STORES SECTION ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tiendas Destacadas
          </h3>
          <button
            onClick={() => onNavigate('explorar')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {featuredTiendas.map((tienda) => (
            <div
              key={tienda.id}
              onClick={() => setTiendaSeleccionada(tienda.id)}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md flex-shrink-0">
                {tienda.nombre.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                  {tienda.nombre}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate capitalize">
                  {tienda.categoria} • C$ {tienda.costoEnvio} envío
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5 font-medium">
                  <span className="text-amber-500 font-bold flex items-center gap-0.5">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {(tienda.calificacion || 4.8).toFixed(1)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Clock size={11} /> {(tienda as any).tiempoEntrega || tienda.tiempoEstimado || '20-30 min'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SPONSOR / BUSINESS AD BANNER ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
            Para Negocios
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-white">
            ¿Tienes una tienda o restaurante?
          </h4>
          <p className="text-[11px] text-slate-300">
            Regístrate en LogiFast y vende a miles de clientes.
          </p>
        </div>

        <button
          onClick={() => setAdModalOpen(true)}
          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
        >
          <Megaphone size={14} /> Anunciarme
        </button>
      </div>

      {/* ── MODAL ANUNCIAR NEGOCIO ── */}
      <AnimatePresence>
        {adModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Anuncia tu Negocio en LogiFast
                </h3>
                <button
                  onClick={() => setAdModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {adSuccessMsg ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle size={36} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {adSuccessMsg}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAdSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Negocio
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Taquería Los Comadres"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+505 8888-8888"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Categoría
                    </label>
                    <select className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none">
                      <option value="restaurante">Restaurante / Comida</option>
                      <option value="supermercado">Mercado / Licorería</option>
                      <option value="farmacia">Farmacia / Salud</option>
                      <option value="tienda">Tienda / Comercio</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAdModalOpen(false)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
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
