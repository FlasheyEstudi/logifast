'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  Clock,
  Store,
  Tag,
  Heart,
  X,
} from '@/components/icons';
import { useMarketplaceStore, CATEGORIAS } from '@/lib/marketplace-store';

interface ClientExplorarProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'perfil') => void;
  onOpenTracking?: (orderId: string) => void;
  onOpenChat?: (orderId: string) => void;
}

export default function ClientExplorar({ onNavigate }: ClientExplorarProps) {
  const {
    tiendas = [],
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
      if (activeFilter === 'promo' && (!t.badges || !t.badges.includes('Promo'))) return false;
      if (activeFilter === 'favoritos' && !favoritosTiendas.some((f) => f.tiendaId === t.id)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.nombre.toLowerCase().includes(q) ||
        t.descripcion.toLowerCase().includes(q)
      );
    });
  }, [tiendas, explorarCategoria, activeFilter, favoritosTiendas, searchQuery]);

  return (
    <div className="w-full max-w-md mx-auto px-3.5 sm:px-4 py-3 space-y-3.5 pb-28 font-sans">
      {/* ── TOP HEADER & SEARCH ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Explorar Tiendas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Descubre restaurantes, mercados y productos locales
            </p>
          </div>
        </div>

        {/* Search Bar Native */}
        <div className="w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Buscar por nombre, comida o categoría..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setExplorarSearch(e.target.value);
              }}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setExplorarSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CATEGORY PILLS HORIZONTAL SCROLL ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3.5 px-3.5 sm:-mx-4 sm:px-4">
        <button
          onClick={() => setExplorarCategoria('todos')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0 ${
            explorarCategoria === 'todos'
              ? 'bg-blue-600 text-white ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <span>Todos</span>
        </button>
        {CATEGORIAS.map((cat) => {
          const isSelected = explorarCategoria === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setExplorarCategoria(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── QUICK FILTER CHIPS ── */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveFilter('todos')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            activeFilter === 'todos'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          Todos ({filteredTiendas.length})
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'promo' ? 'todos' : 'promo')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
            activeFilter === 'promo'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
          }`}
        >
          <Tag size={12} /> Promociones
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'favoritos' ? 'todos' : 'favoritos')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
            activeFilter === 'favoritos'
              ? 'bg-rose-500 text-white'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
          }`}
        >
          <Heart size={12} fill={activeFilter === 'favoritos' ? 'currentColor' : 'none'} /> Favoritos
        </button>
      </div>

      {/* ── STORE LIST (NATIVE CARDS) ── */}
      {filteredTiendas.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Store size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No se encontraron resultados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Intenta cambiar la categoría o limpiar los filtros de búsqueda.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setExplorarSearch('');
              setExplorarCategoria('todos');
              setActiveFilter('todos');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm hover:bg-blue-700 transition-colors"
          >
            Ver todas las tiendas
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTiendas.map((tienda) => {
            const isFav = favoritosTiendas.some((f) => f.tiendaId === tienda.id);
            return (
              <motion.div
                key={tienda.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                onClick={() => {
                  setTiendaSeleccionada(tienda.id);
                }}
              >
                {/* Banner Image or Header Strip */}
                <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 relative flex items-end p-3 justify-between">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-base border border-slate-200/60 dark:border-slate-700">
                      {tienda.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white drop-shadow-sm">
                        {tienda.nombre}
                      </h3>
                      <p className="text-[11px] text-slate-200 drop-shadow-sm capitalize">
                        {tienda.categoria}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoritoTienda(tienda.id);
                    }}
                    className="relative z-10 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                    aria-label="Favorito"
                  >
                    <Heart size={16} fill={isFav ? '#FF3B30' : 'none'} color={isFav ? '#FF3B30' : '#FFFFFF'} />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {tienda.descripcion}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {(tienda.calificacion || 4.8).toFixed(1)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {tienda.tiempoEstimado || '20-30 min'}
                      </span>
                    </div>

                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      C$ {tienda.costoEnvio} envío
                    </span>
                  </div>

                  {/* Badges */}
                  {tienda.badges && tienda.badges.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {tienda.badges.map((b, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
