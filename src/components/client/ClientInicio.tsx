'use client';

import { useState, useMemo } from 'react';
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
  Bike,
  Sparkles,
  ShieldCheck,
  Compass,
} from '@/components/icons';
import { useStore, type Order } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';

interface ClientInicioProps {
  isDark: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

export default function ClientInicio({
  isDark,
  userName,
  onNavigate,
  onOpenTracking,
  onOpenChat,
}: ClientInicioProps) {
  const orders = useStore((s) => s.orders);
  const tiendas = useMarketplaceStore((s) => s.tiendas);

  // Active delivery order (if any)
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.estado !== 'entregado' && o.estado !== 'incidencia');
  }, [orders]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  return (
    <div className="space-y-8 py-2 max-w-5xl mx-auto">

      {/* 🍏 APPLE HERO WELCOME BANNER */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 sm:p-10 text-white shadow-2xl shadow-blue-500/20">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Sparkles size={14} className="text-amber-300" />
              <span>Managua, Nicaragua</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {greeting}, {userName.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-blue-100 font-medium leading-relaxed">
              ¿Qué necesitas enviar o recibir hoy? Entregas ultra-rápidas a la puerta de tu hogar u oficina.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('solicitar')}
              className="px-6 py-3.5 rounded-2xl bg-white text-blue-600 font-bold text-sm shadow-xl hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
            >
              <Package size={18} />
              <span>Solicitar Envío</span>
            </button>
            <button
              onClick={() => onNavigate('explorar')}
              className="px-6 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-sm hover:bg-white/25 active:scale-95 transition-all duration-300 flex items-center gap-2"
            >
              <Compass size={18} />
              <span>Explorar Tiendas</span>
            </button>
          </div>
        </div>
      </section>

      {/* 🍏 DYNAMIC ISLAND LIVE ACTIVITY CARD (IF ACTIVE ORDER EXISTS) */}
      <AnimatePresence>
        {activeOrder && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-6 rounded-[28px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-blue-500/30 dark:border-blue-500/20 shadow-xl shadow-blue-500/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                </span>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white">
                    Pedido en Curso #{activeOrder.id.substring(0, 8)}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {activeOrder.origen} ➔ {activeOrder.destino}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                {activeOrder.estado.toUpperCase()}
              </span>
            </div>

            {/* Live Progress Bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                style={{
                  width:
                    activeOrder.estado === 'pendiente'
                      ? '25%'
                      : activeOrder.estado === 'recogido'
                      ? '60%'
                      : activeOrder.estado === 'encamino'
                      ? '85%'
                      : '10%',
                }}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                  🏍️
                </div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Repartidor asignado en ruta
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenChat(activeOrder.id)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle size={14} /> Chat
                </button>
                <button
                  onClick={() => onOpenTracking(activeOrder.id)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Navigation size={14} /> Ver Mapa
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 🍏 CATEGORIES GRID (APPLE GLASS TILES) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Servicios Principales
          </h2>
          <button
            onClick={() => onNavigate('explorar')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Ver todo <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('solicitar')}
            className="p-5 rounded-[24px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 text-left hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-lg group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Package size={26} />
            </div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Envío Express</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Puerta a puerta en min.</p>
          </button>

          <button
            onClick={() => onNavigate('explorar')}
            className="p-5 rounded-[24px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 text-left hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-lg group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Utensils size={26} />
            </div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Restaurantes</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Comida favorita lista</p>
          </button>

          <button
            onClick={() => onNavigate('explorar')}
            className="p-5 rounded-[24px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 text-left hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-lg group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShoppingCart size={26} />
            </div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Supermercado</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Víveres y del hogar</p>
          </button>

          <button
            onClick={() => onNavigate('explorar')}
            className="p-5 rounded-[24px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 text-left hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-lg group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Pill size={26} />
            </div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Farmacia</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Medicinas y cuidado</p>
          </button>
        </div>
      </section>

      {/* 🍏 TOP TIENDAS DESTACADAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Tiendas Destacadas
          </h2>
          <button
            onClick={() => onNavigate('explorar')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Explorar todas
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {tiendas.slice(0, 3).map((tienda) => (
            <div
              key={tienda.id}
              onClick={() => onNavigate('explorar')}
              className="rounded-[28px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg relative">
                {tienda.nombre}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" /> {tienda.calificacion || 4.9}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">{tienda.nombre}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{tienda.descripcion}</p>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {tienda.tiempoEstimado || '25-35'} min
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">Entrega C$ {tienda.costoEnvio || 40}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
