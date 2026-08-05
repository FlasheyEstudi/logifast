'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  Search,
  Bike,
  Navigation,
  MessageCircle,
  X,
  Plus,
} from '@/components/icons';
import { useStore, type Order } from '@/lib/store';

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', label: 'Buscando repartidor' },
  encamino: { bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', label: 'En camino' },
  recogido: { bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400', label: 'Paquete recogido' },
  entregado: { bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', label: 'Entregado' },
  incidencia: { bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800', text: 'text-rose-600 dark:text-rose-400', label: 'Incidencia' },
};

interface ClientEnviosProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

interface ReportModalState {
  open: boolean;
  orderId: string;
  reason: string;
  description: string;
}

export default function ClientEnvios({
  onNavigate,
  onOpenTracking,
  onOpenChat,
}: ClientEnviosProps) {
  const { orders, clientEnvioTab, setClientEnvioTab, addToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'todos' | 'entregados' | 'incidencia'>('todos');
  const [reportModal, setReportModal] = useState<ReportModalState>({
    open: false,
    orderId: '',
    reason: 'retraso',
    description: '',
  });

  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido'
    );
  }, [orders]);

  const historicalOrders = useMemo(() => {
    return orders.filter(
      (o) => o.estado === 'entregado' || o.estado === 'incidencia'
    );
  }, [orders]);

  const filteredHistory = useMemo(() => {
    return historicalOrders.filter((o) => {
      if (filterState === 'entregados' && o.estado !== 'entregado') return false;
      if (filterState === 'incidencia' && o.estado !== 'incidencia') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.destino.toLowerCase().includes(q) ||
        o.origen.toLowerCase().includes(q)
      );
    });
  }, [historicalOrders, filterState, searchQuery]);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Reporte enviado a soporte. Te contactaremos pronto.', 'success');
    setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' });
  };

  return (
    <div className="w-full max-w-md mx-auto px-3.5 sm:px-4 py-3 space-y-4 pb-28 font-sans">
      {/* ── TOP HEADER & SEGMENTED TABS ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Mis Envíos
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestión de envíos express y pedidos activos
            </p>
          </div>
          <button
            onClick={() => onNavigate('solicitar')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus size={15} /> Nuevo Envío
          </button>
        </div>

        {/* Native Segmented Tab Control */}
        <div className="w-full p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 grid grid-cols-2 gap-1 text-xs font-semibold">
          <button
            onClick={() => setClientEnvioTab('activos')}
            className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              clientEnvioTab === 'activos'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>En Curso</span>
            {activeOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setClientEnvioTab('historial')}
            className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              clientEnvioTab === 'historial'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Historial ({historicalOrders.length})</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: ACTIVOS / EN CURSO ── */}
      {clientEnvioTab === 'activos' && (
        <div className="space-y-3">
          {activeOrders.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Bike size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No tienes envíos activos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  ¿Necesitas enviar un paquete o encargo rápido? Solicitá tu repartidor en segundos.
                </p>
              </div>
              <button
                onClick={() => onNavigate('solicitar')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                Solicitar Envío Express
              </button>
            </div>
          ) : (
            activeOrders.map((order) => {
              const badge = STATUS_BADGE[order.estado] || STATUS_BADGE['pendiente'];
              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        #{order.id.substring(0, 8)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      C$ {(order.monto || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Route Timeline */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Origen</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{order.origen}</p>
                      </div>
                    </div>

                    <div className="w-0.5 h-3 bg-slate-200 dark:bg-slate-700 ml-1" />

                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Destino</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{order.destino}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Info if assigned */}
                  {order.repartidor && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          {order.repartidor.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {order.repartidor}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Repartidor LogiFast • ★ 4.9
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenChat(order.id)}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                        title="Chat"
                      >
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onOpenTracking(order.id)}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Navigation size={14} /> Rastrear en Tiempo Real
                    </button>
                    <button
                      onClick={() => setReportModal({ open: true, orderId: order.id, reason: 'retraso', description: '' })}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
                      title="Reportar problema"
                    >
                      <AlertTriangle size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 2: HISTORIAL ── */}
      {clientEnvioTab === 'historial' && (
        <div className="space-y-3">
          {/* Filters & Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Buscar en historial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <button
              onClick={() => setFilterState(filterState === 'entregados' ? 'todos' : 'entregados')}
              className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterState === 'entregados'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Entregados
            </button>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <Package size={32} className="mx-auto text-slate-400" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                No hay envíos guardados en el historial
              </p>
            </div>
          ) : (
            filteredHistory.map((order) => {
              const badge = STATUS_BADGE[order.estado] || STATUS_BADGE['entregado'];
              return (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">#{order.id.substring(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      C$ {(order.monto || 0).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    {order.origen} → {order.destino}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{order.fecha || 'Hoy'}</span>
                    <button
                      onClick={() => onNavigate('solicitar')}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Volver a pedir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── MODAL REPORTAR PROBLEMA ── */}
      <AnimatePresence>
        {reportModal.open && (
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
                  Reportar Problema
                </h3>
                <button
                  onClick={() => setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Motivo
                  </label>
                  <select
                    value={reportModal.reason}
                    onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="retraso">Retraso en la entrega</option>
                    <option value="paquete_dañado">Paquete dañado</option>
                    <option value="cobro_incorrecto">Cobro o tarifa incorrecta</option>
                    <option value="conductor">Problema con el repartidor</option>
                    <option value="otro">Otro problema</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Comentarios adicionales
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Escribe detalles del inconveniente..."
                    value={reportModal.description}
                    onChange={(e) => setReportModal({ ...reportModal, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportModal({ open: false, orderId: '', reason: 'retraso', description: '' })}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                  >
                    Enviar Reporte
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
