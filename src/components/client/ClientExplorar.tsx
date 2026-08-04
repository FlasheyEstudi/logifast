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
    <div
      className="w-full min-h-screen pb-32 space-y-6 px-2 sm:px-5 pt-3"
      style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
    >
      {/* ── Search Bar & Filter (Luxury Spacing) ── */}
      <div className="w-full flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar tiendas, restaurantes o supermercados..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExplorarSearch(e.target.value);
            }}
            className="w-full pl-12 pr-4 py-4.5 rounded-[28px] text-sm text-white placeholder-slate-400 outline-none transition-all font-sans"
            style={{
              background: 'rgba(30, 41, 59, 0.88)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setExplorarSearch('');
              }}
              className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Pill Bar ── */}
      <div className="w-full overflow-x-auto no-scrollbar flex gap-3 pb-1">
        <button
          onClick={() => setExplorarCategoria('todos')}
          className={`px-5 py-3.5 rounded-[22px] text-xs font-extrabold transition-all flex items-center gap-2 flex-shrink-0 border ${
            explorarCategoria === 'todos'
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/40'
              : 'bg-slate-800/80 border-white/14 text-slate-400 hover:text-slate-200'
          }`}
          style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
        >
          <Sparkles size={16} />
          Todos
        </button>

        {CATEGORIAS.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setExplorarCategoria(cat.key)}
            className={`px-5 py-3.5 rounded-[22px] text-xs font-extrabold transition-all flex items-center gap-2 flex-shrink-0 border ${
              explorarCategoria === cat.key
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/40'
                : 'bg-slate-800/80 border-white/14 text-slate-400 hover:text-slate-200'
            }`}
            style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2.5">
        {[
          { key: 'todos', label: 'Todas las tiendas' },
          { key: 'promo', label: 'En Promoción' },
          { key: 'favoritos', label: 'Mis Favoritos' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              activeFilter === f.key
                ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                : 'bg-slate-800/60 border-white/10 text-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── High-End Stores Cards Grid (Generous p-6 Spacing) ── */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                className="w-full rounded-[34px] p-5 sm:p-6 space-y-4 cursor-pointer transition-all duration-300 relative overflow-hidden group"
                style={{
                  background: 'rgba(30, 41, 59, 0.88)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  boxShadow: '0 20px 44px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                {/* Store Banner */}
                <div
                  className="w-full h-40 rounded-2xl flex items-center justify-center font-extrabold text-3xl text-white relative shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform"
                  style={{
                    background: tienda.logoColor || 'linear-gradient(135deg, #007AFF, #0056B3)',
                    fontFamily: "var(--font-syne), 'Syne', sans-serif",
                  }}
                >
                  {tienda.logoIniciales || 'LG'}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoritoTienda(tienda.id);
                    }}
                    className="absolute top-3.5 right-3.5 p-2.5 rounded-full bg-slate-900/70 text-white backdrop-blur-md border border-white/20 shadow-md active:scale-90 transition-transform"
                  >
                    <Heart size={18} fill={isFav ? '#FF3B30' : 'none'} color={isFav ? '#FF3B30' : '#FFFFFF'} />
                  </button>

                  {/* Badges */}
                  <div className="absolute bottom-3.5 left-3.5 flex gap-2">
                    {tienda.badges.map((b) => (
                      <span
                        key={b}
                        className="px-3 py-1 rounded-xl bg-emerald-500/90 text-white font-extrabold text-[10px] uppercase shadow-md"
                        style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-extrabold text-white flex items-center gap-1.5 group-hover:text-blue-400 transition-colors"
                      style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
                    >
                      {tienda.nombre}
                      {tienda.verificado && <CheckCircle size={17} className="text-blue-400 fill-blue-400/20" />}
                    </h3>
                    <div
                      className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/25"
                      style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                    >
                      <Star size={13} fill="currentColor" /> {tienda.calificacion}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-sans line-clamp-1">{tienda.descripcion}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10 font-sans">
                    <span className="flex items-center gap-1.5">
                      <Clock size={15} /> {tienda.tiempoEntrega}
                    </span>
                    <span
                      className="flex items-center gap-1 text-emerald-400 font-bold"
                      style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                    >
                      <Bike size={15} /> Envío C$ {tienda.costoEnvio}
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
