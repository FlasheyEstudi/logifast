'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Search,
  ArrowRight,
  CheckCircle,
  Bike,
  Navigation,
  MessageCircle,
  Phone,
  Zap,
  X,
} from '@/components/icons';
import dynamic from 'next/dynamic';
import { useStore, type Order } from '@/lib/store';

const RepartidorMap = dynamic(() => import('../repartidor/RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-60 rounded-2xl bg-slate-900/80 animate-pulse flex items-center justify-center text-slate-400 text-xs font-mono">
      Cargando mapa GPS en vivo...
    </div>
  ),
});

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'rgba(255, 149, 0, 0.18)', text: '#FF9500', label: 'Buscando repartidor' },
  encamino: { bg: 'rgba(0, 122, 255, 0.18)', text: '#007AFF', label: 'En camino' },
  recogido: { bg: 'rgba(175, 82, 222, 0.18)', text: '#AF52DE', label: 'Paquete recogido' },
  entregado: { bg: 'rgba(52, 199, 89, 0.18)', text: '#34C759', label: 'Entregado' },
  incidencia: { bg: 'rgba(255, 59, 48, 0.18)', text: '#FF3B30', label: 'Incidencia' },
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
    <div
      className="w-full px-2 sm:px-5 py-3 space-y-7 pb-32"
      style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
    >
      {/* ── Luxury Glass Tab Switcher ── */}
      <div
        className="flex p-2 rounded-[28px] w-full"
        style={{
          background: 'rgba(30, 41, 59, 0.88)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
        }}
      >
        <button
          onClick={() => setClientEnvioTab('activos')}
          className="flex-1 py-4 rounded-[22px] text-xs font-extrabold transition-all relative flex items-center justify-center gap-2"
          style={{
            color: clientEnvioTab === 'activos' ? '#007AFF' : '#94A3B8',
            fontFamily: "var(--font-syne), 'Syne', sans-serif",
          }}
        >
          {clientEnvioTab === 'activos' && (
            <motion.div
              layoutId="envio-tab-pill"
              className="absolute inset-0 rounded-[22px]"
              style={{ background: 'rgba(0, 122, 255, 0.22)', border: '1px solid rgba(0, 122, 255, 0.45)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Zap size={17} />
            En vivo ({activeOrders.length})
          </span>
        </button>

        <button
          onClick={() => setClientEnvioTab('historial')}
          className="flex-1 py-4 rounded-[22px] text-xs font-extrabold transition-all relative flex items-center justify-center gap-2"
          style={{
            color: clientEnvioTab === 'historial' ? '#007AFF' : '#94A3B8',
            fontFamily: "var(--font-syne), 'Syne', sans-serif",
          }}
        >
          {clientEnvioTab === 'historial' && (
            <motion.div
              layoutId="envio-tab-pill"
              className="absolute inset-0 rounded-[22px]"
              style={{ background: 'rgba(0, 122, 255, 0.22)', border: '1px solid rgba(0, 122, 255, 0.45)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Package size={17} />
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
            className="space-y-6"
          >
            {activeOrders.length === 0 ? (
              <div
                className="w-full text-center py-16 px-7 rounded-[36px] flex flex-col items-center justify-center space-y-4"
                style={{
                  background: 'rgba(30, 41, 59, 0.88)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 20px 44px rgba(0,0,0,0.4)',
                }}
              >
                <div className="w-18 h-18 rounded-3xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-xl shadow-blue-500/30" style={{ width: 72, height: 72 }}>
                  <Bike size={36} />
                </div>
                <div>
                  <h3
                    className="text-xl font-extrabold text-white"
                    style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
                  >
                    Sin envíos en tránsito
                  </h3>
                  <p className="text-xs text-slate-400 font-sans max-w-sm mt-1">
                    Solicita un mensajero exprés en tiempo real para llevar tus paquetes.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('solicitar')}
                  className="px-7 py-4 rounded-2xl font-extrabold text-xs text-white transition-all active:scale-95 shadow-xl shadow-blue-600/40 uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
                    fontFamily: "var(--font-syne), 'Syne', sans-serif",
                  }}
                >
                  Solicitar Envío Ahora
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
                    className="w-full rounded-[36px] p-6 sm:p-7 space-y-5 transition-all duration-300"
                    style={{
                      background: 'rgba(30, 41, 59, 0.88)',
                      backdropFilter: 'blur(28px)',
                      WebkitBackdropFilter: 'blur(28px)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      boxShadow: '0 24px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="px-3.5 py-1.5 rounded-full text-xs font-extrabold"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                        <span
                          className="text-xs text-slate-400 font-bold"
                          style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                        >
                          {order.id}
                        </span>
                      </div>
                      <div className="text-right font-sans">
                        <span className="text-xs text-slate-400 block">Llega en aprox.</span>
                        <span
                          className="text-lg text-blue-400 font-bold"
                          style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                        >
                          ~12 min
                        </span>
                      </div>
                    </div>

                    {/* Route Preview */}
                    <div className="space-y-2.5 text-xs text-slate-200 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0 shadow-md shadow-emerald-400/40" />
                        <span className="font-bold text-slate-400">Origen:</span>
                        <span className="font-medium truncate">{order.origen}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 shadow-md shadow-blue-500/40" />
                        <span className="font-bold text-slate-400">Destino:</span>
                        <span className="font-medium truncate">{order.destino}</span>
                      </div>
                    </div>

                    {/* GPS Map preview */}
                    <div className="w-full h-60 rounded-2xl overflow-hidden border border-white/14 relative shadow-inner">
                      <RepartidorMap
                        repartidorPos={[(order as any).repartidorLat || 12.1364, (order as any).repartidorLng || -86.2581]}
                        origenPos={[order.origenLat || 12.1264, order.origenLng || -86.2652]}
                        destinoPos={[order.destinoLat || 12.1402, order.destinoLng || -86.2954]}
                        estado={order.estado === 'encamino' ? 'EN_CAMINO_RECOGER' : order.estado === 'recogido' ? 'RECOGIDO' : 'ORDEN_ASIGNADA'}
                        altura="100%"
                        zoom={13}
                      />
                    </div>

                    {/* Rider details */}
                    {order.repartidor && (
                      <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-white/12 backdrop-blur-md">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                            {order.repartidorInitials || 'RP'}
                          </div>
                          <div>
                            <span
                              className="text-sm font-extrabold text-white block"
                              style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
                            >
                              {order.repartidor}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-sans">
                              <Bike size={13} /> Moto Repartidor Logifast
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenChat(order.id)}
                            className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/35 hover:bg-blue-500/30 transition-all active:scale-90"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button
                            onClick={() => (window.location.href = 'tel:22220000')}
                            className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/30 transition-all active:scale-90"
                          >
                            <Phone size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => onOpenTracking(order.id)}
                        className="py-4 px-4 rounded-2xl font-extrabold text-xs text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/35 active:scale-95 uppercase tracking-wider"
                        style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
                      >
                        <Navigation size={17} />
                        Seguimiento GPS
                      </button>
                      <button
                        onClick={() => setReportModal({ open: true, orderId: order.id, reason: '', description: '' })}
                        className="py-4 px-4 rounded-2xl font-extrabold text-xs text-red-400 bg-red-500/10 border border-red-500/35 hover:bg-red-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 uppercase tracking-wider"
                        style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
                      >
                        <AlertTriangle size={17} />
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
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por ID, origen o destino..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-[28px] text-sm text-white placeholder-slate-400 outline-none transition-all font-sans"
                style={{
                  background: 'rgba(30, 41, 59, 0.88)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                }}
              />
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
                    className="w-full rounded-[28px] p-5 space-y-3 font-sans"
                    style={{
                      background: 'rgba(30, 41, 59, 0.88)',
                      backdropFilter: 'blur(28px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isEntregado ? 'bg-emerald-400' : 'bg-red-500'
                          }`}
                        />
                        <span
                          className="font-bold text-slate-300"
                          style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                        >
                          {order.id}
                        </span>
                      </div>
                      <span className="text-slate-400">{order.fecha}</span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400 font-bold">De:</span> {order.origen}
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400 font-bold">A:</span> {order.destino}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                      <span
                        className="font-bold text-white text-sm"
                        style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                      >
                        C$ {order.monto.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onNavigate('solicitar')}
                        className="text-blue-400 font-extrabold hover:underline flex items-center gap-1"
                        style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
                      >
                        Repetir envío <ArrowRight size={14} />
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-slate-900/95 border border-white/20 rounded-[34px] p-7 space-y-4 text-slate-100 shadow-2xl"
              style={{ backdropFilter: 'blur(32px)' }}
            >
              <h3
                className="text-lg font-extrabold flex items-center gap-2 text-red-400"
                style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
              >
                <AlertTriangle size={22} /> Reportar Problema
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Selecciona la causa de la incidencia para el envío{' '}
                <span
                  className="text-white font-bold"
                  style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace" }}
                >
                  {reportModal.orderId}
                </span>.
              </p>

              <div className="space-y-2.5 font-sans">
                {[
                  { value: 'repartidor_demorado', label: 'Repartidor demorado' },
                  { value: 'paquete_danado', label: 'Paquete dañado' },
                  { value: 'direccion_incorrecta', label: 'Dirección incorrecta' },
                  { value: 'otro', label: 'Otro motivo' },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReportModal((s) => ({ ...s, reason: r.value }))}
                    className={`w-full text-left p-4 rounded-2xl text-xs font-bold border transition-all ${
                      reportModal.reason === r.value
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-700'
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
                className="w-full h-26 p-4 rounded-2xl bg-slate-800/80 border border-white/12 text-xs text-slate-100 outline-none focus:border-blue-500 font-sans"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReportModal({ open: false, orderId: '', reason: '', description: '' })}
                  className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all font-sans"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={!reportModal.reason}
                  className="flex-1 py-4 rounded-2xl bg-red-600 disabled:opacity-40 text-white font-extrabold text-xs hover:bg-red-500 transition-all shadow-lg shadow-red-600/35 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-syne), 'Syne', sans-serif" }}
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
