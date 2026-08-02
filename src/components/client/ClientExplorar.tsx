'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  Clock,
  ChevronRight,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Filter,
  Check,
  Tag,
  Sparkles,
} from '@/components/icons';
import { useMarketplaceStore, CATEGORIAS, type Tienda, type Producto } from '@/lib/marketplace-store';
import type { ClientModuleKey } from '@/lib/store';

export interface ClientExplorarProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: ClientModuleKey) => void;
  onOpenTracking?: (id: string) => void;
  onOpenChat?: (id: string) => void;
}

export default function ClientExplorar({ isDark, userName, onNavigate }: ClientExplorarProps) {
  const tiendas = useMarketplaceStore((s) => s.tiendas);
  const productos = useMarketplaceStore((s) => s.productos);
  const addToCart = useMarketplaceStore((s) => s.addToCart);

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('todos');
  const [selectedTienda, setSelectedTienda] = useState<Tienda | null>(null);

  // Filtered stores
  const filteredTiendas = useMemo(() => {
    return tiendas.filter((t) => {
      const matchCat = selectedCat === 'todos' || t.categoria === selectedCat;
      const matchQuery =
        !query ||
        t.nombre.toLowerCase().includes(query.toLowerCase()) ||
        t.descripcion.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [tiendas, selectedCat, query]);

  // Store products
  const tiendaProductos = useMemo(() => {
    if (!selectedTienda) return [];
    return productos.filter((p) => p.tiendaId === selectedTienda.id);
  }, [productos, selectedTienda]);

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">

      {/* 🍏 APPLE SEARCH & TITLE */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Explorar Tiendas
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Descubre comercios locales, restaurantes y servicios express cerca de ti.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar hamburguesas, farmacias, tiendas..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* iOS Segmented Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCat('todos')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
              selectedCat === 'todos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800'
            }`}
          >
            Todos
          </button>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                selectedCat === cat.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🍏 TIENDAS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTiendas.map((tienda) => (
          <motion.div
            key={tienda.id}
            whileHover={{ y: -4 }}
            onClick={() => setSelectedTienda(tienda)}
            className="rounded-[28px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 group"
          >
            <div className="h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl relative">
              {tienda.nombre}
              <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" /> {tienda.calificacion || 4.9}
              </span>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {tienda.nombre}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                  {tienda.descripcion}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {tienda.tiempoEstimado || '20-30'} min
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  Envío C$ {tienda.costoEnvio || 35}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🍏 STORE DETAIL SHEET (BOTTOM DRAWER) */}
      <AnimatePresence>
        {selectedTienda && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                    {selectedTienda.nombre}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedTienda.descripcion}</p>
                </div>
                <button
                  onClick={() => setSelectedTienda(null)}
                  className="p-2 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Product List */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-400">Menú & Productos</h3>
                {tiendaProductos.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-8">No hay productos cargados en esta tienda.</p>
                ) : (
                  tiendaProductos.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{p.nombre}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.descripcion}</p>
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 block pt-1">
                          C$ {p.precio.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(p, selectedTienda);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1 shadow-md shadow-blue-500/20 flex-shrink-0"
                      >
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Checkout Link */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">¿Listo para ordenar?</span>
                <button
                  onClick={() => {
                    setSelectedTienda(null);
                    onNavigate('carrito');
                  }}
                  className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-2"
                >
                  <ShoppingCart size={16} /> Ver Carrito y Pagar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
