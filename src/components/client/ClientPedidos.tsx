'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  MessageCircle,
  Navigation,
  RefreshCw,
  Search,
  Bike,
} from '@/components/icons';
import { useStore, type Order, type ClientModuleKey } from '@/lib/store';

export interface ClientPedidosProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: ClientModuleKey) => void;
  onOpenTracking?: (id: string) => void;
  onOpenChat?: (id: string) => void;
}

export default function ClientPedidos({ isDark, onNavigate }: ClientPedidosProps) {
  const orders = useStore((s) => s.orders);
  const setTrackingOrder = useStore((s) => s.setTrackingOrder);
  const setChatOrderId = useStore((s) => s.setChatOrderId);

  const [tab, setTab] = useState<'activos' | 'historial'>('activos');

  const ordenesFiltradas = useMemo(() => {
    if (tab === 'activos') {
      return orders.filter((o) => o.estado !== 'entregado' && o.estado !== 'incidencia');
    }
    return orders.filter((o) => o.estado === 'entregado' || o.estado === 'incidencia');
  }, [orders, tab]);

  return (
    <div className="space-y-6 py-2 max-w-4xl mx-auto">

      {/* 🍏 TITLE & CUPERTINO SEGMENTED CONTROL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Mis Pedidos & Envíos
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Historial de viajes y seguimiento en tiempo real.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1 self-start sm:self-auto">
          <button
            onClick={() => setTab('activos')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'activos'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            En Curso
          </button>
          <button
            onClick={() => setTab('historial')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'historial'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Completados
          </button>
        </div>
      </div>

      {/* 🍏 ORDERS LIST */}
      <div className="space-y-4">
        {ordenesFiltradas.length === 0 ? (
          <div className="p-12 text-center rounded-[32px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <Package size={32} />
            </div>
            <h3 className="font-extrabold text-base text-zinc-800 dark:text-zinc-200">No hay pedidos en esta sección</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Cuando solicites un servicio de entrega o realices una compra en tienda aparecerá aquí.
            </p>
          </div>
        ) : (
          ordenesFiltradas.map((orden) => (
            <motion.div
              key={orden.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-[28px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    <Bike size={20} />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-zinc-900 dark:text-white block">
                      Orden #{orden.id.substring(0, 8)}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium">{orden.fecha}</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    orden.estado === 'entregado'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                  }`}
                >
                  {orden.estado.toUpperCase()}
                </span>
              </div>

              {/* Route */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-zinc-500 font-medium">Origen:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{orden.origen}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-zinc-500 font-medium">Destino:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{orden.destino}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  C$ {orden.monto.toFixed(2)}
                </span>

                {orden.estado !== 'entregado' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setChatOrderId(orden.id);
                        onNavigate('chat');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-1"
                    >
                      <MessageCircle size={14} /> Chat
                    </button>
                    <button
                      onClick={() => {
                        setTrackingOrder(orden.id);
                        onNavigate('tracking');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center gap-1"
                    >
                      <Navigation size={14} /> Rastrear Mapa
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
}
