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
    <div className="space-y-6 py-2">

      {/* 🍊 HERO WELCOME BANNER */}
      <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1C1C24] via-[#121217] to-black p-5 border border-white/[0.08] text-white shadow-xl space-y-4">
        {/* Subtle Accent Glow Aura */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#FF6B2C]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 text-[11px] font-bold text-[#FF6B2C]">
            <MapPin size={12} />
            <span>Managua, Nicaragua</span>
          </div>

          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold tracking-tight leading-tight">
              {greeting}, <span className="text-[#FF6B2C]">{userName.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-xs text-[#8E8E93] font-normal leading-relaxed mt-1">
              ¿Qué necesitas enviar o recibir hoy? Envíos express ultra-rápidos en minutos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => onNavigate('solicitar')}
              className="w-full min-h-[48px] py-3 rounded-[10px] bg-[#FF6B2C] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-xs shadow-lg shadow-[#FF6B2C]/30 hover:bg-[#FF8F50] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <Package size={16} />
              <span>Solicitar Envío</span>
            </button>
            <button
              onClick={() => onNavigate('explorar')}
              className="w-full min-h-[48px] py-3 rounded-[10px] bg-[#1C1C24] border border-white/[0.08] text-[#F5F5F7] font-['Plus_Jakarta_Sans'] font-bold text-xs hover:bg-[#2A2A36] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <Compass size={16} />
              <span>Explorar Tiendas</span>
            </button>
          </div>
        </div>
      </section>

      {/* 🍊 DYNAMIC ISLAND LIVE ACTIVITY CARD (ONLY VISIBLE IF ACTIVE ORDER EXISTS) */}
      <AnimatePresence>
        {activeOrder && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-[20px] bg-[#1C1C24] border border-white/[0.08] p-4 shadow-xl space-y-3"
          >
            {/* Top 3px gradient bar */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#FF6B2C] to-[#10B981]" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#10B981]">
                  EN VIVO
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-[#8E8E93]">
                #{activeOrder.id.substring(0, 8)}
              </span>
            </div>

            {/* Visual Route */}
            <div className="p-3 rounded-[10px] bg-black/40 border border-white/[0.06] space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B2C]" />
                <span className="text-[#8E8E93] text-[11px]">Origen:</span>
                <span className="font-bold text-[#F5F5F7] truncate text-[11px]">{activeOrder.origen}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-[#8E8E93] text-[11px]">Destino:</span>
                <span className="font-bold text-[#F5F5F7] truncate text-[11px]">{activeOrder.destino}</span>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF6B2C] to-[#10B981] h-full transition-all duration-500 rounded-full"
                style={{
                  width:
                    activeOrder.estado === 'pendiente'
                      ? '30%'
                      : activeOrder.estado === 'recogido'
                      ? '65%'
                      : activeOrder.estado === 'encamino'
                      ? '85%'
                      : '15%',
                }}
              />
            </div>

            {/* Rider Info & Actions Footer */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#FF6B2C]/20 text-[#FF6B2C] font-bold text-xs flex items-center justify-center">
                  🏍️
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#F5F5F7] block leading-none">Carlos M.</span>
                  <span className="text-[10px] text-[#8E8E93]">En ruta · 8 min ETA</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenChat(activeOrder.id)}
                  className="px-3 py-1.5 rounded-[8px] bg-white/10 text-white text-[11px] font-bold hover:bg-white/20 transition-colors flex items-center gap-1"
                >
                  <MessageCircle size={12} /> Chat
                </button>
                <button
                  onClick={() => onOpenTracking(activeOrder.id)}
                  className="px-3 py-1.5 rounded-[8px] bg-[#FF6B2C] text-white text-[11px] font-bold hover:bg-[#FF8F50] transition-colors shadow-md shadow-[#FF6B2C]/20 flex items-center gap-1"
                >
                  <Navigation size={12} /> Mapa
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 🍊 SERVICES GRID (2X2 WITH BACKGROUND DECORATIVE CIRCLES) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-tight text-[#F5F5F7]">
            Servicios Principales
          </h2>
          <button
            onClick={() => onNavigate('explorar')}
            className="text-xs font-bold text-[#FF6B2C] hover:underline flex items-center gap-0.5"
          >
            Ver todo <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Service 1: Envío Express (Orange) */}
          <button
            onClick={() => onNavigate('solicitar')}
            className="relative overflow-hidden p-4 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] text-left hover:scale-[1.02] active:scale-[0.97] transition-all duration-150 group shadow-sm"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-[#FF6B2C]/10 group-hover:scale-125 transition-transform" />
            <div className="w-10 h-10 rounded-[10px] bg-[#FF6B2C]/15 text-[#FF6B2C] flex items-center justify-center mb-2.5">
              <Package size={22} />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-white">Envío Express</h3>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">Paquetes en minutos</p>
          </button>

          {/* Service 2: Restaurantes (Amber) */}
          <button
            onClick={() => onNavigate('explorar')}
            className="relative overflow-hidden p-4 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] text-left hover:scale-[1.02] active:scale-[0.97] transition-all duration-150 group shadow-sm"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-[#F59E0B]/10 group-hover:scale-125 transition-transform" />
            <div className="w-10 h-10 rounded-[10px] bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center mb-2.5">
              <Utensils size={22} />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-white">Restaurantes</h3>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">Comida lista al instante</p>
          </button>

          {/* Service 3: Supermercado (Blue) */}
          <button
            onClick={() => onNavigate('explorar')}
            className="relative overflow-hidden p-4 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] text-left hover:scale-[1.02] active:scale-[0.97] transition-all duration-150 group shadow-sm"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-[#3B82F6]/10 group-hover:scale-125 transition-transform" />
            <div className="w-10 h-10 rounded-[10px] bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center mb-2.5">
              <ShoppingCart size={22} />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-white">Supermercado</h3>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">Víveres y productos</p>
          </button>

          {/* Service 4: Farmacia (Green) */}
          <button
            onClick={() => onNavigate('explorar')}
            className="relative overflow-hidden p-4 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] text-left hover:scale-[1.02] active:scale-[0.97] transition-all duration-150 group shadow-sm"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-[#10B981]/10 group-hover:scale-125 transition-transform" />
            <div className="w-10 h-10 rounded-[10px] bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mb-2.5">
              <Pill size={22} />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-white">Farmacia</h3>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">Medicinas y cuidado</p>
          </button>
        </div>
      </section>

      {/* 🍊 TOP TIENDAS DESTACADAS (HORIZONTAL SNAP CAROUSEL) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-tight text-[#F5F5F7]">
            Tiendas Destacadas
          </h2>
          <button
            onClick={() => onNavigate('explorar')}
            className="text-xs font-bold text-[#FF6B2C] hover:underline"
          >
            Ver todas
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {tiendas.slice(0, 4).map((tienda) => (
            <div
              key={tienda.id}
              onClick={() => onNavigate('explorar')}
              className="w-56 flex-shrink-0 snap-start rounded-[14px] bg-[#1C1C24] border border-white/[0.08] overflow-hidden cursor-pointer hover:border-[#FF6B2C]/40 transition-all duration-150 space-y-2 shadow-sm"
            >
              <div className="h-24 bg-gradient-to-r from-[#FF6B2C] to-[#FF8F50] flex items-center justify-center text-white font-['Plus_Jakarta_Sans'] font-extrabold text-base relative">
                {tienda.nombre}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-0.5">
                  <Star size={10} className="text-[#F59E0B] fill-[#F59E0B]" /> {tienda.calificacion || 4.9}
                </span>
              </div>

              <div className="p-3 space-y-1">
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-xs text-white truncate">{tienda.nombre}</h3>
                <p className="text-[11px] text-[#8E8E93] line-clamp-1">{tienda.descripcion}</p>
                <div className="flex items-center justify-between text-[10px] font-bold text-[#8E8E93] pt-1">
                  <span><Clock size={11} className="inline mr-1" />{tienda.tiempoEstimado || '25-35'} min</span>
                  <span className="text-[#FF6B2C]">Envío C$ {tienda.costoEnvio || 40}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
