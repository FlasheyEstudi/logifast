'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
  Bike,
  Navigation,
  MessageCircle,
} from 'lucide-react';
import { useStore, type Order } from '@/lib/store';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

interface ClientEnviosProps {
  isDark: boolean;
  userName: string;
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

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pendiente' },
  encamino: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', label: 'En camino' },
  recogido: { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-400', label: 'Recogido' },
  entregado: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-400', label: 'Entregado' },
  incidencia: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400', label: 'Incidencia' },
  programada: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', label: 'Programada' },
};

const STATUS_CIRCLE_COLOR: Record<string, string> = {
  pendiente: 'var(--warning)',
  encamino: 'var(--info)',
  recogido: '#7C3AED',
  entregado: 'var(--exito)',
  incidencia: 'var(--peligro)',
  programada: 'var(--info)',
};

const TIMELINE_STEPS = ['Orden creada', 'En camino', 'Recogida', 'Entregada'];

function getStepIndex(estado: string): number {
  const map: Record<string, number> = { pendiente: 0, encamino: 1, recogido: 2, entregado: 3 };
  return map[estado] ?? 0;
}

function getStatusFromStepIdx(idx: number): string {
  const map: Record<number, string> = { 0: 'pendiente', 1: 'encamino', 2: 'recogido', 3: 'entregado' };
  return map[idx] ?? 'pendiente';
}

function shortenLocation(loc: string): string {
  if (loc.length <= 28) return loc;
  return loc.substring(0, 25) + '...';
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function StatusBadge({ estado }: { estado: string }) {
  const s = STATUS_BADGE[estado] ?? STATUS_BADGE.pendiente;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function RiderAvatar({ initials, name, size = 'md' }: { initials: string; name: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-9 h-9 text-sm';
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sz} rounded-full flex items-center justify-center font-bold`}
        style={{ background: 'var(--primario-soft)', color: 'var(--primario)' }}
      >
        {initials || <User className="w-3 h-3" />}
      </div>
      <span className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--text)' }}>
        {name || 'Sin asignar'}
      </span>
    </div>
  );
}

/* ── Progress Timeline ──────────────────────── */

function ProgressTimeline({ estado }: { estado: string }) {
  const currentStep = getStepIndex(estado);

  return (
    <div className="w-full px-2 py-4">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-4 left-6 right-6 h-0.5" style={{ background: 'var(--border)' }} />

        {/* Completed line overlay */}
        {currentStep > 0 && (
          <motion.div
            className="absolute top-4 left-6 h-0.5"
            style={{ background: 'var(--primario)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}

        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentStep && estado !== 'pendiente' ? idx < currentStep : false;
          const isCurrent = idx === currentStep;
          const isPending = idx > currentStep;

          return (
            <div key={step} className="flex flex-col items-center z-10" style={{ flex: '1 0 0' }}>
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                style={{
                  borderColor: isCompleted || isCurrent ? 'var(--primario)' : 'var(--border)',
                  background: isCompleted ? 'var(--primario)' : isCurrent ? 'transparent' : 'var(--surface)',
                }}
                animate={isCurrent ? {
                  boxShadow: [
                    '0 0 0 0px rgba(255,87,34,0)',
                    '0 0 0 6px rgba(255,87,34,0.3)',
                    '0 0 0 0px rgba(255,87,34,0)',
                  ],
                } : {}}
                transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: idx * 0.15 }}
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Bike className="w-4 h-4" style={{ color: 'var(--primario)' }} />
                  </motion.div>
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--border)' }} />
                )}
              </motion.div>
              <span
                className="text-[10px] sm:text-xs mt-1.5 text-center leading-tight"
                style={{
                  color: isCompleted || isCurrent ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: isCurrent ? 700 : 400,
                }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Map Placeholder ────────────────────────── */

function MapPlaceholder() {
  return (
    <div
      className="w-full rounded-xl flex flex-col items-center justify-center gap-3"
      style={{
        height: 250,
        background: 'var(--bg-alt)',
        border: '1px dashed var(--border)',
      }}
    >
      <MapPin className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
        Mapa en tiempo real
      </span>
      <div className="flex items-center gap-1">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-3 h-3" style={{ color: 'var(--primario)' }} />
        </motion.div>
        <span className="text-xs" style={{ color: 'var(--primario)', fontFamily: 'JetBrains Mono' }}>
          Actualizando...
        </span>
      </div>
    </div>
  );
}

/* ── Empty State ────────────────────────────── */

function EmptyActiveState({ onNavigate }: { onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'perfil') => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6">
        {/* Package body */}
        <rect x="30" y="45" width="60" height="50" rx="6" style={{ fill: 'var(--bg-alt)' }} stroke="var(--border)" strokeWidth="2" />
        <rect x="30" y="45" width="60" height="18" rx="6" style={{ fill: 'var(--primario-soft)' }} stroke="var(--primario)" strokeWidth="1.5" />
        {/* Flap */}
        <path d="M30 55 L60 38 L90 55" stroke="var(--primario)" strokeWidth="2" fill="none" />
        {/* Arrow */}
        <motion.g
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M62 82 L78 82" stroke="var(--primario)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M73 76 L79 82 L73 88" stroke="var(--primario)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
        {/* Dots decoration */}
        <circle cx="20" cy="30" r="3" style={{ fill: 'var(--primario-soft)' }} />
        <circle cx="100" cy="35" r="2.5" style={{ fill: 'var(--primario-soft)' }} />
        <circle cx="15" cy="80" r="2" style={{ fill: 'var(--border)' }} />
      </svg>
      <h3
        className="text-xl font-bold mb-2"
        style={{ fontFamily: 'Syne', color: 'var(--text)' }}
      >
        No tienes envíos activos
      </h3>
      <p
        className="text-sm mb-6 text-center max-w-xs"
        style={{ color: 'var(--text-secondary)', fontFamily: 'DM Sans' }}
      >
        Solicita un envío y seguirá aquí en tiempo real
      </p>
      <button
        onClick={() => onNavigate('solicitar')}
        className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 active:scale-95"
        style={{ background: 'var(--primario)', fontFamily: 'DM Sans' }}
      >
        Solicitar envío
      </button>
    </motion.div>
  );
}

/* ── Report Problem Modal ───────────────────── */

function ReportModal({
  state,
  setState,
  onSubmit,
}: {
  state: ReportModalState;
  setState: React.Dispatch<React.SetStateAction<ReportModalState>>;
  onSubmit: () => void;
}) {
  if (!state.open) return null;

  const reasons = [
    { value: 'repartidor_no_llega', label: 'El repartidor no llega' },
    { value: 'direccion_incorrecta', label: 'Dirección incorrecta' },
    { value: 'otro', label: 'Otro' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={() => setState((s) => ({ ...s, open: false }))}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--peligro)', opacity: 0.15 }}>
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--peligro)' }} />
          </div>
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Syne', color: 'var(--text)' }}>
            ¿Qué pasó?
          </h3>
        </div>

        <div className="space-y-3 mb-4">
          {reasons.map((r) => (
            <button
              key={r.value}
              onClick={() => setState((s) => ({ ...s, reason: r.value }))}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: state.reason === r.value ? 'var(--primario-soft)' : 'var(--bg-alt)',
                color: state.reason === r.value ? 'var(--primario)' : 'var(--text)',
                border: state.reason === r.value ? '1.5px solid var(--primario)' : '1px solid var(--border)',
                fontFamily: 'DM Sans',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Describe el problema (opcional)..."
          value={state.description}
          onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none h-20 outline-none transition-all"
          style={{
            background: 'var(--bg-alt)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'DM Sans',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primario)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setState((s) => ({ ...s, open: false }))}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'var(--bg-alt)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              fontFamily: 'DM Sans',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={!state.reason}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{
              background: 'var(--peligro)',
              fontFamily: 'DM Sans',
            }}
          >
            Enviar reporte
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Active Order Card ──────────────────────── */

function ActiveOrderCard({
  order,
  eta,
  onReport,
  onOpenTracking,
  onOpenChat,
}: {
  order: Order;
  eta: number;
  onReport: (orderId: string) => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = STATUS_CIRCLE_COLOR[order.estado] ?? 'var(--border)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl overflow-hidden cursor-pointer transition-colors duration-200 hover:bg-[var(--bg-alt)]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      onClick={() => onOpenTracking(order.id)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <StatusBadge estado={order.estado} />
          <span
            className="text-xs font-bold"
            style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}
          >
            {order.id}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
          {order.fecha}
        </span>
      </div>

      {/* Route */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)', fontFamily: 'DM Sans' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--exito)' }} />
          <span>De: {order.origen}</span>
          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--primario)' }} />
          <span>A: {order.destino}</span>
        </div>
      </div>

      {/* Rider + ETA */}
      <div className="px-4 py-3 flex items-center justify-between">
        <RiderAvatar initials={order.repartidorInitials} name={order.repartidor ?? ''} />
        <div className="text-right">
          <div
            className="text-2xl font-bold"
            style={{ fontFamily: 'JetBrains Mono', color: 'var(--primario)' }}
          >
            ~{eta} min
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
            Llega en ~{eta} min
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="px-4 pb-3">
        <MapPlaceholder />
      </div>

      {/* Progress Timeline */}
      <div className="px-4 pb-4">
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-alt)' }}>
          <ProgressTimeline estado={order.estado} />
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--exito)' }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          En vivo · Actualizado hace {Math.floor((Date.now() - lastUpdate) / 1000)}s
        </span>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onOpenTracking(order.id); }}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--primario)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Navigation size={16} />
          Ver seguimiento
        </button>
        {order.repartidor && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenChat(order.id); }}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MessageCircle size={16} />
            Mensaje
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onReport(order.id); }}
          className="py-2.5 px-4 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{
            background: 'transparent',
            color: 'var(--peligro)',
            border: '1px solid var(--peligro)',
            fontFamily: 'DM Sans',
          }}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Reportar problema
        </button>
      </div>
    </motion.div>
  );
}

/* ── History Order Item ─────────────────────── */

function HistoryOrderItem({
  order,
  onNavigate,
  onDownload,
}: {
  order: Order;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'perfil') => void;
  onDownload: (orderId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div layout className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 transition-all hover:opacity-90"
        style={{ background: 'var(--surface)' }}
      >
        {/* Row 1: ID + status + date */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              {order.id}
            </span>
            <StatusBadge estado={order.estado} />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
            {order.fecha}
          </span>
        </div>

        {/* Row 2: Route */}
        <div className="flex items-center gap-1.5 text-sm mb-1.5" style={{ color: 'var(--text)', fontFamily: 'DM Sans' }}>
          <span>{shortenLocation(order.origen)}</span>
          <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span>{shortenLocation(order.destino)}</span>
        </div>

        {/* Row 3: Rider + amount + payment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiderAvatar initials={order.repartidorInitials} name={order.repartidor ?? ''} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            {order.metodoPago === 'efectivo' ? (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                💵
              </span>
            ) : (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                💳
              </span>
            )}
            <span className="text-sm font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text)' }}>
              C$ {order.monto}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              {/* Route traveled */}
              <div className="pt-3">
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                  Ruta recorrida
                </p>
                <p className="text-sm" style={{ color: 'var(--text)', fontFamily: 'DM Sans' }}>
                  {order.origen} → {order.destino}
                </p>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                  Timeline completo
                </p>
                {order.timeline.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 py-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: t.completado ? 'var(--primario)' : 'var(--border)' }}
                    />
                    <span className="text-sm flex-1" style={{ color: 'var(--text)', fontFamily: 'DM Sans' }}>
                      {t.step}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                      {t.hora}
                    </span>
                  </div>
                ))}
              </div>

              {/* Simulated metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-alt)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                    Km recorridos
                  </p>
                  <p className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text)' }}>
                    {((Math.abs(order.destinoLat - order.origenLat) + Math.abs(order.destinoLng - order.origenLng)) * 111 * 10).toFixed(1)} km
                  </p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-alt)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                    Tiempo total
                  </p>
                  <p className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text)' }}>
                    {order.timeline[3]?.completado && order.timeline[0]?.hora && order.timeline[3]?.hora
                      ? (() => {
                          const [h1, m1] = order.timeline[0].hora.split(':').map(Number);
                          const [h2, m2] = order.timeline[3].hora.split(':').map(Number);
                          const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                          return diff > 0 ? `${Math.floor(diff / 60)}h ${diff % 60}m` : `${diff}m`;
                        })()
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate('solicitar'); }}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'var(--primario)',
                    color: 'white',
                    fontFamily: 'DM Sans',
                  }}
                >
                  Volver a enviar a esta ruta
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(order.id); }}
                  className="py-2 px-3 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'var(--bg-alt)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    fontFamily: 'DM Sans',
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientEnvios({ isDark, userName, onNavigate, onOpenTracking, onOpenChat }: ClientEnviosProps) {
  const {
    orders,
    clientEnvioTab,
    setClientEnvioTab,
    clientEnvioFilter,
    setClientEnvioFilter,
    clientSearchQuery,
    setClientSearchQuery,
    simulateStatusChange,
    addToast,
  } = useStore();

  /* ── State ────────────────────── */
  const [reportModal, setReportModal] = useState<ReportModalState>({
    open: false,
    orderId: '',
    reason: '',
    description: '',
  });
  const [etaMap, setEtaMap] = useState<Record<string, number>>({});
  const [historyPage, setHistoryPage] = useState(1);
  const tickCountRef = useRef(0);

  /* ── Filter orders for current client ── */
  const clientOrders = orders.filter(
    (o) => o.cliente === 'María López' || o.cliente === 'Maria López'
  );

  const activeOrders = clientOrders.filter(
    (o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido'
  );

  const historicalOrders = clientOrders.filter(
    (o) => o.estado === 'entregado' || o.estado === 'incidencia'
  );

  /* ── Filtered history ── */
  const filteredHistory = historicalOrders.filter((o) => {
    if (clientEnvioFilter === 'entregados') return o.estado === 'entregado';
    if (clientEnvioFilter === 'cancelados') return o.estado === 'incidencia';
    if (clientEnvioFilter === 'incidencia') return o.estado === 'incidencia';
    return true;
  }).filter((o) => {
    if (!clientSearchQuery) return true;
    const q = clientSearchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.destino.toLowerCase().includes(q) ||
      o.origen.toLowerCase().includes(q)
    );
  });

  const paginatedHistory = filteredHistory.slice(0, historyPage * 10);

  /* ── Real-time simulation ── */
  useEffect(() => {
    const interval = setInterval(() => {
      tickCountRef.current += 1;

      setEtaMap((prev) => {
        const next = { ...prev };
        // Initialize ETAs for any new active orders not yet in the map
        activeOrders.forEach((o) => {
          if (!next[o.id]) {
            next[o.id] = Math.floor(Math.random() * 15) + 8;
          }
        });

        // Every 30 seconds (~6 ticks), reduce ETA by 1
        if (tickCountRef.current % 6 === 0) {
          activeOrders.forEach((o) => {
            if (next[o.id] && next[o.id] > 1) {
              next[o.id] -= 1;
            }
          });
        }

        // Slightly modify ETA for visual feedback (every tick)
        activeOrders.forEach((o) => {
          if (next[o.id]) {
            const jitter = Math.random() > 0.5 ? 1 : -1;
            next[o.id] = Math.max(1, next[o.id] + (Math.random() > 0.7 ? jitter : 0));
          }
        });

        return next;
      });

      // Occasionally advance timeline (every ~30 seconds = 6 ticks)
      if (tickCountRef.current % 6 === 0 && Math.random() > 0.4) {
        simulateStatusChange();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeOrders, simulateStatusChange]);

  /* ── Handlers ── */
  const handleReport = useCallback((orderId: string) => {
    setReportModal({ open: true, orderId, reason: '', description: '' });
  }, []);

  const handleReportSubmit = useCallback(() => {
    addToast(`Reporte enviado para ${reportModal.orderId}`, 'info');
    setReportModal({ open: false, orderId: '', reason: '', description: '' });
  }, [reportModal.orderId, addToast]);

  const handleDownload = useCallback((orderId: string) => {
    addToast(`Descargando comprobante de ${orderId}...`, 'info');
  }, [addToast]);

  /* ── Client metrics ── */
  const totalEnvios = clientOrders.length;
  const totalGastado = clientOrders.reduce((sum, o) => sum + o.monto, 0);
  const enviosEsteMes = clientOrders.filter((o) => o.fecha.startsWith('2026-06')).length;

  /* ── Filter pills ── */
  const filterPills = [
    { key: 'todos', label: 'Todos' },
    { key: 'entregados', label: 'Entregados' },
    { key: 'cancelados', label: 'Cancelados' },
    { key: 'incidencia', label: 'Con incidencia' },
  ];

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div className="w-full">
      {/* ── Tab Switcher ── */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--bg-alt)' }}>
        {(['activos', 'historial'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setClientEnvioTab(tab); setHistoryPage(1); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative"
            style={{
              fontFamily: 'DM Sans',
              color: clientEnvioTab === tab ? 'var(--primario)' : 'var(--text-muted)',
            }}
          >
            {clientEnvioTab === tab && (
              <motion.div
                layoutId="envio-tab-indicator"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {tab === 'activos' ? 'Activos' : 'Historial'}
              {tab === 'activos' && activeOrders.length > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: 'var(--primario)' }}
                >
                  {activeOrders.length}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {clientEnvioTab === 'activos' ? (
          <motion.div
            key="activos"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {activeOrders.length === 0 ? (
              <EmptyActiveState onNavigate={onNavigate} />
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <ActiveOrderCard
                    key={order.id}
                    order={order}
                    eta={etaMap[order.id] ?? 12}
                    onReport={handleReport}
                    onOpenTracking={onOpenTracking}
                    onOpenChat={onOpenChat}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="historial"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Client metrics */}
            <div className="flex items-center justify-center gap-6 mb-5">
              {[
                { value: totalEnvios, label: 'envíos totales' },
                { value: `C$ ${totalGastado.toLocaleString()}`, label: 'gastados' },
                { value: enviosEsteMes, label: 'envíos este mes' },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <div className="text-base font-bold" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                    {m.value}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {filterPills.map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => { setClientEnvioFilter(pill.key); setHistoryPage(1); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    fontFamily: 'DM Sans',
                    background: clientEnvioFilter === pill.key ? 'var(--primario)' : 'var(--bg-alt)',
                    color: clientEnvioFilter === pill.key ? 'white' : 'var(--text-secondary)',
                    border: clientEnvioFilter === pill.key ? '1px solid var(--primario)' : '1px solid var(--border)',
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por ID o destino..."
                value={clientSearchQuery}
                onChange={(e) => { setClientSearchQuery(e.target.value); setHistoryPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--bg-alt)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  fontFamily: 'DM Sans',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primario)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Counter */}
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
              {filteredHistory.length} envío{filteredHistory.length !== 1 ? 's' : ''} en tu historial
            </p>

            {/* Order list */}
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Package className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                  No se encontraron envíos
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {paginatedHistory.map((order) => (
                  <HistoryOrderItem
                    key={order.id}
                    order={order}
                    onNavigate={onNavigate}
                    onDownload={handleDownload}
                  />
                ))}
                {paginatedHistory.length < filteredHistory.length && (
                  <button
                    onClick={() => setHistoryPage((p) => p + 1)}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{
                      background: 'var(--bg-alt)',
                      color: 'var(--primario)',
                      border: '1px solid var(--border)',
                      fontFamily: 'DM Sans',
                    }}
                  >
                    Cargar más
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Problem Modal ── */}
      <AnimatePresence>
        {reportModal.open && (
          <ReportModal
            state={reportModal}
            setState={setReportModal}
            onSubmit={handleReportSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
