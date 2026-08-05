'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Bike,
  Store,
  Star,
  ChevronRight,
  Megaphone,
  CheckCircle,
  Clock,
  Gift,
  Utensils,
  Pill,
  ShoppingBag,
  MapPin,
  Bell,
  X,
  MessageSquare,
} from '@/components/icons';
import { useStore } from '@/lib/store';
import { useMarketplaceStore, type TiendaCategoria } from '@/lib/marketplace-store';

interface ClientInicioProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'pedidos' | 'perfil' | 'puntos') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

export default function ClientInicio({
  userName = 'Usuario',
  onNavigate,
  onOpenTracking,
  onOpenChat,
}: ClientInicioProps) {
  const { orders = [], banners = [] } = useStore();
  const { tiendas = [], setExplorarCategoria, setTiendaSeleccionada } = useMarketplaceStore();

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adSuccessMsg, setAdSuccessMsg] = useState('');

  // Banner auto-scroll
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4000);
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
    setAdSuccessMsg('¡Solicitud enviada! Nuestro equipo comercial te contactará.');
    setTimeout(() => {
      setAdSuccessMsg('');
      setAdModalOpen(false);
    }, 2200);
  };

  const handleSelectCategoria = (cat: TiendaCategoria | 'solicitar' | 'puntos') => {
    if (cat === 'solicitar') {
      onNavigate('solicitar');
    } else if (cat === 'puntos') {
      onNavigate('puntos');
    } else {
      setExplorarCategoria(cat);
      onNavigate('explorar');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-3.5 sm:px-4 py-3 space-y-4 pb-28 font-sans">
      {/* ── TOP NATIVE APP BAR ── */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm border border-white/20">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <MapPin size={12} className="text-blue-500" />
              <span>Managua, Nicaragua</span>
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Hola, {userName.split(' ')[0]} 👋
            </h1>
          </div>
        </div>

        <button
          onClick={() => onNavigate('perfil')}
          className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Perfil y Notificaciones"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
        </button>
      </div>

      {/* ── SEARCH TRIGGER BAR ── */}
      <div
        onClick={() => onNavigate('explorar')}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 cursor-pointer shadow-sm active:scale-[0.99] transition-all"
      >
        <Search size={18} className="text-slate-400" />
        <span className="text-xs sm:text-sm font-medium flex-1">Buscar restaurantes, tiendas o envíos...</span>
        <div className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
          Explorar
        </div>
      </div>

      {/* ── ACTIVE ORDER TRACKER WIDGET ── */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                  {activeOrders[0].estado === 'pendiente' ? 'Buscando repartidor' : 'Envío en camino'}
                </span>
              </div>
              <span className="text-[11px] font-medium bg-white/20 px-2 py-0.5 rounded-full text-white">
                #{activeOrders[0].id.substring(0, 8)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Bike size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-100 line-clamp-1">
                    {activeOrders[0].origen} → {activeOrders[0].destino}
                  </p>
                  <p className="text-sm font-bold text-white">
                    ETA: 15-25 min • C$ {(activeOrders[0].monto || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenChat(activeOrders[0].id)}
                  className="p-2 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white"
                  title="Chat"
                >
                  <MessageSquare size={16} />
                </button>
                <button
                  onClick={() => onOpenTracking(activeOrders[0].id)}
                  className="px-3 py-1.5 rounded-lg bg-white text-blue-700 font-bold text-xs shadow-sm hover:bg-blue-50 active:scale-95 transition-all"
                >
                  Ver Mapa
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BANNER CAROUSEL ── */}
      {banners.length > 0 && (
        <div className="relative w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-slate-900 text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBannerIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 min-h-[120px]"
            >
              <div className="space-y-1 max-w-[65%]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles size={11} /> PROMO LOGIFAST
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {banners[activeBannerIdx]?.titulo || 'Envíos express en minutos'}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1">
                  Pide lo que quieras a tu puerta.
                </p>
                <button
                  onClick={() => onNavigate('explorar')}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  Ver ofertas <ChevronRight size={14} />
                </button>
              </div>

              <div className="w-16 h-16 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Gift size={32} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeBannerIdx ? 'w-5 bg-blue-400' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FAST CATEGORIES GRID (NATIVE 4-COLUMN) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Servicios Principales
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          <button
            onClick={() => handleSelectCategoria('solicitar')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 active:scale-95 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bike size={22} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Express
            </span>
          </button>

          <button
            onClick={() => handleSelectCategoria('comida')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 active:scale-95 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Utensils size={22} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Comida
            </span>
          </button>

          <button
            onClick={() => handleSelectCategoria('supermercado')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-95 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag size={22} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Súper
            </span>
          </button>

          <button
            onClick={() => handleSelectCategoria('farmacia')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 active:scale-95 transition-all text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Pill size={22} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Farmacia
            </span>
          </button>
        </div>
      </div>

      {/* ── TIENDAS DESTACADAS ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Tiendas Populares
          </h2>
          <button
            onClick={() => onNavigate('explorar')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            Ver todas <ChevronRight size={13} />
          </button>
        </div>

        <div className="space-y-2.5">
          {featuredTiendas.map((tienda) => (
            <div
              key={tienda.id}
              onClick={() => {
                setTiendaSeleccionada(tienda.id);
                onNavigate('explorar');
              }}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-3 active:scale-[0.99]"
            >
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg flex-shrink-0 border border-slate-200/60 dark:border-slate-700/50">
                {tienda.nombre.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {tienda.nombre}
                  </h3>
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md text-[11px] font-bold">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{(tienda.calificacion || 4.8).toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {tienda.descripcion}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={11} className="text-slate-400" /> {tienda.tiempoEstimado || '20-30 min'}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    C$ {tienda.costoEnvio} envío
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BANNER PUBLICITARIO / NEGOCIO ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-sm border border-slate-800 flex items-center justify-between gap-3">
        <div className="space-y-1 max-w-[70%]">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            <Megaphone size={12} /> LogiFast Business
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
            ¿Tienes una tienda o restaurante?
          </h4>
          <p className="text-[11px] text-slate-300">
            Vende en LogiFast y llega a miles de clientes.
          </p>
        </div>
        <button
          onClick={() => setAdModalOpen(true)}
          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex-shrink-0 active:scale-95 transition-all"
        >
          Unirme
        </button>
      </div>

      {/* ── MODAL SOLICITUD ANUNCIARSE ── */}
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Anuncia tu negocio
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
                  <CheckCircle size={40} className="mx-auto text-emerald-500" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
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
                      required
                      type="text"
                      placeholder="Ej. Taquería El Chavo"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+505 8888 8888"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAdModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
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
