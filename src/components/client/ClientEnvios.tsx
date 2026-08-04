'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Clock,
  User,
  ChevronDown,
  AlertTriangle,
  Search,
  Download,
  ArrowRight,
  CheckCircle,
  XCircle,
  Bike,
  Navigation,
  MessageCircle,
  Phone,
  Banknote,
  CreditCard,
  Zap,
} from '@/components/icons';
import dynamic from 'next/dynamic';
import { useStore, type Order } from '@/lib/store';

const RepartidorMap = dynamic(() => import('../repartidor/RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-2xl bg-slate-800/70 animate-pulse flex items-center justify-center text-slate-400 text-xs font-mono">
      Cargando mapa GPS en vivo...
    </div>
  ),
});

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

interface ClientEnviosProps {
  isDark?: boolean;
  userName?: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

interface ReportModalState {
  open: boolean;
  orderId: string;
  reason: string;
  description: string;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'rgba(255, 149, 0, 0.15)', text: '#FF9500', label: 'Buscando repartidor' },
  encamino: { bg: 'rgba(0, 122, 255, 0.15)', text: '#007AFF', label: 'En camino' },
  recogido: { bg: 'rgba(175, 82, 222, 0.15)', text: '#AF52DE', label: 'Paquete recogido' },
  entregado: { bg: 'rgba(52, 199, 89, 0.15)', text: '#34C759', label: 'Entregado' },
  incidencia: { bg: 'rgba(255, 59, 48, 0.15)', text: '#FF3B30', label: 'Incidencia' },
};

function shorten(text: string, max = 26) {
  if (!text) return '—';
  if (text.length <= max) return text;
  return text.substring(0, max - 3) + '...';
}

export default function ClientEnvios({
  userName,
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
    reason: '',
    description: '',
  });

  const clientOrders = orders.filter(
    (o) =>
      !userName ||
      !o.cliente ||
      o.cliente.toLowerCase() === userName.toLowerCase() ||
      o.cliente.includes('María') ||
      o.cliente.includes('Jean') ||
      true
  );

  const activeOrders = clientOrders.filter(
    (o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido'
  );

  const historicalOrders = clientOrders.filter(
    (o) => o.estado === 'entregado' || o.estado === 'incidencia'
  );

  const filteredHistory = historicalOrders.filter((o) => {
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

  const handleReportSubmit = () => {
    if (!reportModal.reason) return;
    addToast(`Reporte enviado para el envío ${reportModal.orderId}`, 'info');
    setReportModal({ open: false, orderId: '', reason: '', description: '' });
  };

  return (
    <div className="w-full px-1 sm:px-4 py-2 space-y-5">
      {/* ── Tabs Selector Edge-to-Edge ── */}
      <div
        className="flex p-1.5 rounded-2xl w-full"
        style={{
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <button
          onClick={() => setClientEnvioTab('activos')}
          className="flex-1 py-3 rounded-xl text-sm font-bold transition-all relative flex items-center justify-center gap-2"
          style={{
            color: clientEnvioTab === 'activos' ? '#007AFF' : '#94A3B8',
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {clientEnvioTab === 'activos' && (
            <motion.div
              layoutId="envio-tab-pill"
              className="absolute inset-0 rounded-xl"
              style={{ background: 'rgba(0, 122, 255, 0.18)', border: '1px solid rgba(0, 122, 255, 0.3)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Zap size={16} />
            En vivo ({activeOrders.length})
          </span>
        </button>

        <button
          onClick={() => setClientEnvioTab('historial')}
          className="flex-1 py-3 rounded-xl text-sm font-bold transition-all relative flex items-center justify-center gap-2"
          style={{
            color: clientEnvioTab === 'historial' ? '#007AFF' : '#94A3B8',
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {clientEnvioTab === 'historial' && (
            <motion.div
              layoutId="envio-tab-pill"
              className="absolute inset-0 rounded-xl"
              style={{ background: 'rgba(0, 122, 255, 0.18)', border: '1px solid rgba(0, 122, 255, 0.3)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Package size={16} />
            Historial ({historicalOrders.length})
          </span>
        </button>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {clientEnvioTab === 'activos' ? (
          <motion.div
            key="tab-activos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {activeOrders.length === 0 ? (
              <div
                className="w-full text-center py-16 px-6 rounded-3xl flex flex-col items-center justify-center"
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                  <Bike size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-syne mb-2">No tienes envíos activos en este momento</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  Solicita un mensajero exprés en tiempo real para enviar paquetes, documentos o encomiendas.
                </p>
                <button
                  onClick={() => onNavigate('solicitar')}
                  className="px-6 py-3.5 rounded-2xl font-bold text-sm text-white transition-transform active:scale-95 shadow-lg shadow-blue-500/25"
                  style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)', fontFamily: "'Syne', sans-serif" }}
                >
                  Solicitar Envió Ahora
                </button>
              </div>
            ) : (
              activeOrders.map((order) => {
                const badge = STATUS_BADGE[order.estado] || STATUS_BADGE.pendiente;
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full rounded-3xl p-4 sm:p-5 space-y-4 transition-all duration-200"
                    style={{
                      background: 'rgba(30, 41, 59, 0.85)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                    }}
                  >
                    {/* Header: ID + Status + ETA */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-bold">{order.id}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Llega en aprox.</span>
                        <span className="text-lg font-mono font-bold text-blue-400">~12 min</span>
                      </div>
                    </div>

                    {/* Route preview */}
                    <div className="space-y-2 text-sm text-slate-200 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-400 text-xs">Origen:</span>
                        <span className="font-medium truncate">{order.origen}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-400 text-xs">Destino:</span>
                        <span className="font-medium truncate">{order.destino}</span>
                      </div>
                    </div>

                    {/* GPS Map preview */}
                    <div className="w-full h-56 rounded-2xl overflow-hidden border border-white/10 relative">
                      <RepartidorMap
                        repartidorPos={[order.repartidorLat || 12.1364, order.repartidorLng || -86.2581]}
                        origenPos={[order.origenLat || 12.1264, order.origenLng || -86.2652]}
                        destinoPos={[order.destinoLat || 12.1402, order.destinoLng || -86.2954]}
                        estado={order.estado === 'encamino' ? 'EN_CAMINO_RECOGER' : order.estado === 'recogido' ? 'RECOGIDO' : 'ORDEN_ASIGNADA'}
                        altura="100%"
                        zoom={13}
                      />
                    </div>

                    {/* Rider info if assigned */}
                    {order.repartidor && (
                      <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                            {order.repartidorInitials || 'RP'}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-100 block">{order.repartidor}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Bike size={12} /> Moto Repartidor
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenChat(order.id)}
                            className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                            title="Chat"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button
                            onClick={() => (window.location.href = 'tel:22220000')}
                            className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                            title="Llamar"
                          >
                            <Phone size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bottom Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => onOpenTracking(order.id)}
                        className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <Navigation size={15} />
                        Seguimiento GPS
                      </button>
                      <button
                        onClick={() => setReportModal({ open: true, orderId: order.id, reason: '', description: '' })}
                        className="py-3 px-4 rounded-xl font-bold text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <AlertTriangle size={15} />
                        Reportar
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div
            key="tab-historial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por ID, origen o destino..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-white/10 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div className="flex gap-2">
                {[
                  { key: 'todos', label: 'Todos' },
                  { key: 'entregados', label: 'Entregados' },
                  { key: 'incidencia', label: 'Incidencias' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterState(f.key as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      filterState === f.key
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-sans">
                No se encontraron envíos en el historial.
              </div>
            ) : (
              filteredHistory.map((order) => {
                const isEntregado = order.estado === 'entregado';
                return (
                  <div
                    key={order.id}
                    className="w-full rounded-2xl p-4 space-y-3 bg-slate-800/80 border border-white/10"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isEntregado ? 'bg-emerald-400' : 'bg-red-500'
                          }`}
                        />
                        <span className="font-mono font-bold text-slate-300">{order.id}</span>
                      </div>
                      <span className="text-slate-400">{order.fecha}</span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-500 font-bold">De:</span> {order.origen}
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-500 font-bold">A:</span> {order.destino}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <span className="font-mono font-bold text-slate-200">C$ {order.monto.toFixed(2)}</span>
                      <button
                        onClick={() => onNavigate('solicitar')}
                        className="text-blue-400 font-bold hover:underline flex items-center gap-1"
                      >
                        Repetir envío <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Modal ── */}
      <AnimatePresence>
        {reportModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 space-y-4 text-slate-100 shadow-2xl"
            >
              <h3 className="text-lg font-bold font-syne flex items-center gap-2 text-red-400">
                <AlertTriangle size={20} /> Reportar Problema
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona la causa de la incidencia para el envío <span className="font-mono text-white">{reportModal.orderId}</span>.
              </p>

              <div className="space-y-2">
                {[
                  { value: 'repartidor_demorado', label: 'Repartidor demorado' },
                  { value: 'paquete_danado', label: 'Paquete dañado' },
                  { value: 'direccion_incorrecta', label: 'Dirección incorrecta' },
                  { value: 'otro', label: 'Otro motivo' },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReportModal((s) => ({ ...s, reason: r.value }))}
                    className={`w-full text-left p-3 rounded-xl text-xs font-semibold border transition-all ${
                      reportModal.reason === r.value
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Detalles adicionales (opcional)..."
                value={reportModal.description}
                onChange={(e) => setReportModal((s) => ({ ...s, description: e.target.value }))}
                className="w-full h-24 p-3 rounded-xl bg-slate-800 border border-white/10 text-xs text-slate-100 outline-none focus:border-blue-500"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReportModal({ open: false, orderId: '', reason: '', description: '' })}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={!reportModal.reason}
                  className="flex-1 py-3 rounded-xl bg-red-600 disabled:opacity-40 text-white font-bold text-xs hover:bg-red-500 transition-all shadow-md"
                >
                  Enviar Reporte
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
