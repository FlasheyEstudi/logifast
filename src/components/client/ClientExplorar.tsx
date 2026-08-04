'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Star,
  CheckCircle,
  Clock,
  Bike,
  Store,
  Tag,
  Utensils,
  Pill,
  ShoppingBag,
  Sparkles,
  Heart,
  X,
  Plus,
} from '@/components/icons';
import { useMarketplaceStore, CATEGORIAS, type TiendaCategoria } from '@/lib/marketplace-store';

interface ClientExplorarProps {
  isDark?: boolean;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'perfil') => void;
}

export default function ClientExplorar({ onNavigate }: ClientExplorarProps) {
  const {
    tiendas = [],
    productos = [],
    explorarCategoria,
    setExplorarCategoria,
    explorarSearch,
    setExplorarSearch,
    setTiendaSeleccionada,
    favoritosTiendas = [],
    toggleFavoritoTienda,
  } = useMarketplaceStore();

  const [searchQuery, setSearchQuery] = useState(explorarSearch || '');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'promo' | 'favoritos'>('todos');

  const filteredTiendas = useMemo(() => {
    return tiendas.filter((t) => {
      if (t.estado !== 'activo') return false;
      if (explorarCategoria !== 'todos' && t.categoria !== explorarCategoria) return false;
      if (activeFilter === 'promo' && !t.badges.includes('Promo')) return false;
      if (activeFilter === 'favoritos' && !favoritosTiendas.includes(t.id)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.nombre.toLowerCase().includes(q) ||
        t.descripcion.toLowerCase().includes(q)
      );
    });
  }, [tiendas, explorarCategoria, activeFilter, favoritosTiendas, searchQuery]);

  return (
    <div className="w-full min-h-screen pb-28 space-y-5 px-1 sm:px-4 pt-2">
      {/* ── Search Bar & Filter ── */}
      <div className="w-full flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar tiendas, restaurantes o supermercados..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExplorarSearch(e.target.value);
            }}
            className="w-full pl-11 pr-4 py-4 rounded-[24px] text-sm text-white placeholder-slate-400 outline-none transition-all font-sans"
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setExplorarSearch('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Pill Bar ── */}
      <div className="w-full overflow-x-auto no-scrollbar flex gap-2.5 pb-1">
        <button
          onClick={() => setExplorarCategoria('todos')}
          className={`px-4 py-3 rounded-[20px] text-xs font-extrabold transition-all flex items-center gap-2 flex-shrink-0 font-syne border ${
            explorarCategoria === 'todos'
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-800/80 border-white/12 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles size={16} />
          Todos
        </button>

        {CATEGORIAS.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setExplorarCategoria(cat.key)}
            className={`px-4 py-3 rounded-[20px] text-xs font-extrabold transition-all flex items-center gap-2 flex-shrink-0 font-syne border ${
              explorarCategoria === cat.key
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 border-white/12 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2">
        {[
          { key: 'todos', label: 'Todas las tiendas' },
          { key: 'promo', label: 'En Promoción' },
          { key: 'favoritos', label: 'Mis Favoritos' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeFilter === f.key
                ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                : 'bg-slate-800/60 border-white/10 text-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── High-End Stores Cards Grid ── */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4.5">
        {filteredTiendas.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs font-sans">
            No se encontraron tiendas disponibles con el filtro seleccionado.
          </div>
        ) : (
          filteredTiendas.map((tienda) => {
            const isFav = favoritosTiendas.includes(tienda.id);
            return (
              <motion.div
                key={tienda.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setTiendaSeleccionada(tienda.id);
                }}
                className="w-full rounded-[30px] p-4.5 space-y-3 cursor-pointer transition-all duration-300 relative overflow-hidden group"
                style={{
                  background: 'rgba(30, 41, 59, 0.85)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                {/* Store Banner */}
                <div
                  className="w-full h-36 rounded-2xl flex items-center justify-center font-extrabold text-3xl text-white relative shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform"
                  style={{ background: tienda.logoColor || 'linear-gradient(135deg, #007AFF, #0056B3)' }}
                >
                  {tienda.logoIniciales || 'LG'}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoritoTienda(tienda.id);
                    }}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-slate-900/60 text-white backdrop-blur-md border border-white/15 shadow-md active:scale-90 transition-transform"
                  >
                    <Heart size={16} fill={isFav ? '#FF3B30' : 'none'} color={isFav ? '#FF3B30' : '#FFFFFF'} />
                  </button>

                  {/* Badges */}
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {tienda.badges.map((b) => (
                      <span
                        key={b}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white font-mono font-extrabold text-[10px] uppercase shadow-md"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-white font-syne flex items-center gap-1.5 group-hover:text-blue-400 transition-colors">
                      {tienda.nombre}
                      {tienda.verificado && <CheckCircle size={16} className="text-blue-400 fill-blue-400/20" />}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20">
                      <Star size={12} fill="currentColor" /> {tienda.calificacion}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-sans line-clamp-1">{tienda.descripcion}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-white/10 font-sans">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {tienda.tiempoEntrega}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                      <Bike size={14} /> Envío C$ {tienda.costoEnvio}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
