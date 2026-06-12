'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingBag, ChevronDown, ChevronUp, Search, Filter, Star, Clock, MapPin, Bike, Navigation, MessageCircle, AlertTriangle, RefreshCw, CheckCircle, XCircle, Truck, ArrowRight, RotateCcw } from 'lucide-react';
import { useStore, type Order } from '@/lib/store';
import { useMarketplaceStore, type OrdenCompra, CATEGORIAS } from '@/lib/marketplace-store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientPedidosProps {
  isDark: boolean;
  userName: string;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}

type TabKey = 'activos' | 'envios' | 'compras';
type EnvioFilterKey = 'todos' | 'entregados' | 'cancelados' | 'incidencia';

/* ═══════════════════════════════════════════════
   STATUS HELPERS — ENVIOS
   ═══════════════════════════════════════════════ */

const ENVIO_STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pendiente' },
  encamino: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', label: 'En camino' },
  recogido: { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-400', label: 'Recogido' },
  entregado: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-400', label: 'Entregado' },
  incidencia: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400', label: 'Incidencia' },
  programada: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', label: 'Programada' },
};

const ENVIO_STATUS_COLOR: Record<string, string> = {
  pendiente: 'var(--warning)',
  encamino: 'var(--info)',
  recogido: '#7C3AED',
  entregado: 'var(--exito)',
  incidencia: 'var(--peligro)',
  programada: 'var(--info)',
};

function envioStatusLabel(estado: string): string {
  return ENVIO_STATUS_BADGE[estado]?.label ?? estado;
}

function shortenLocation(loc: string): string {
  if (loc.length <= 28) return loc;
  return loc.substring(0, 25) + '...';
}

/* ═══════════════════════════════════════════════
   STATUS HELPERS — COMPRAS
   ═══════════════════════════════════════════════ */

const compraStatusColor = (estado: string): string => {
  switch (estado) {
    case 'recibido': return 'var(--info)';
    case 'preparando': return 'var(--warning)';
    case 'listo': return 'var(--info)';
    case 'en_camino': return 'var(--primario)';
    case 'entregado': return 'var(--exito)';
    default: return 'var(--text-muted)';
  }
};

const compraStatusLabel = (estado: string): string => {
  switch (estado) {
    case 'recibido': return 'Recibido';
    case 'preparando': return 'Preparando';
    case 'listo': return 'Listo';
    case 'en_camino': return 'En camino';
    case 'entregado': return 'Entregado';
    default: return estado;
  }
};

const COMPRA_STEPS = ['Recibido', 'Preparando', 'Listo', 'En camino', 'Entregado'];
const COMPRA_STEP_MAP: Record<string, number> = {
  recibido: 0,
  preparando: 1,
  listo: 2,
  en_camino: 3,
  entregado: 4,
};

function getCompraStepIndex(estado: string): number {
  return COMPRA_STEP_MAP[estado] ?? 0;
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

/* ── Compra Progress Bar ────────────────────── */

function CompraProgressBar({ estado }: { estado: string }) {
  const currentStep = getCompraStepIndex(estado);
  const progress = currentStep / (COMPRA_STEPS.length - 1);

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          width: '100%',
          height: 4,
          borderRadius: 2,
          background: 'var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%',
            borderRadius: 2,
            background: compraStatusColor(estado),
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {COMPRA_STEPS.map((step, idx) => (
          <span
            key={step}
            style={{
              fontSize: 9,
              fontFamily: "'DM Sans', sans-serif",
              color: idx <= currentStep ? compraStatusColor(estado) : 'var(--text-muted)',
              fontWeight: idx === currentStep ? 600 : 400,
            }}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Active Envio Card (simplified) ────────── */

function ActiveEnvioCard({
  order,
  onOpenTracking,
  onOpenChat,
}: {
  order: Order;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}) {
  const badge = ENVIO_STATUS_BADGE[order.estado] ?? ENVIO_STATUS_BADGE.pendiente;
  const statusBg = ENVIO_STATUS_COLOR[order.estado] ?? 'var(--border)';

  const statusBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    background: `${statusBg}20`,
    color: statusBg,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div
        style={{
          padding: 16,
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Package size={20} style={{ color: 'var(--primario)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: 'var(--text)' }}>
                {order.id}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                {order.origen} → {order.destino}
              </div>
            </div>
          </div>
          <span style={statusBadgeStyle}>{envioStatusLabel(order.estado)}</span>
        </div>

        {/* ETA + rider info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--bg-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--primario-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--primario)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {order.repartidorInitials || '?'}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
              {order.repartidor || 'Sin asignar'}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)' }}>
              ~{Math.floor(Math.random() * 12) + 8} min
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onOpenTracking(order.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Navigation size={14} />
            Rastrear
          </button>
          {order.repartidor && (
            <button
              onClick={() => onOpenChat(order.id)}
              style={{
                padding: '8px 14px',
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
                gap: 5,
              }}
            >
              <MessageCircle size={14} />
              Mensaje
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Active Compra Card ────────────────────── */

function ActiveCompraCard({
  oc,
  onOpenTracking,
}: {
  oc: OrdenCompra;
  onOpenTracking: (orderId: string) => void;
}) {
  const color = compraStatusColor(oc.estado);

  const compraStatusBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    background: `${color}20`,
    color,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div
        style={{
          padding: 16,
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: oc.tiendaColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: '#fff',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {oc.tiendaLogo}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: 'var(--text)' }}>
                {oc.tiendaNombre}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {oc.items.map(i => i.nombreProducto).join(', ')}
              </div>
            </div>
          </div>
          <span style={compraStatusBadgeStyle}>{compraStatusLabel(oc.estado)}</span>
        </div>

        {/* Progress bar */}
        <CompraProgressBar estado={oc.estado} />

        {/* Repartidor + total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--bg-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--primario-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--primario)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {oc.repartidorInitials || '?'}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
              {oc.repartidorNombre || 'Sin asignar'}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
            C$ {oc.total}
          </span>
        </div>

        {/* Action button */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onOpenTracking(oc.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Navigation size={14} />
            Rastrear
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── History Envio Item (expandable) ────────── */

function HistoryEnvioItem({
  order,
  onNavigate,
  onOpenTracking,
}: {
  order: Order;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = ENVIO_STATUS_BADGE[order.estado] ?? ENVIO_STATUS_BADGE.pendiente;

  return (
    <motion.div
      layout
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 transition-all hover:opacity-90"
        style={{ background: 'var(--surface)' }}
      >
        {/* Row 1: ID + status + date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
              {order.id}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
            >
              {badge.label}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            {order.fecha}
          </span>
        </div>

        {/* Row 2: Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 6, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
          <span>{shortenLocation(order.origen)}</span>
          <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span>{shortenLocation(order.destino)}</span>
        </div>

        {/* Row 3: Rider + amount */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--primario-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--primario)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {order.repartidorInitials || '?'}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
              {order.repartidor || 'Sin asignar'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text)' }}>
              C$ {order.monto}
            </span>
            {expanded ? (
              <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
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
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
              {/* Route detail */}
              <div style={{ paddingTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  Ruta completa
                </p>
                <p style={{ fontSize: 13, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                  {order.origen} → {order.destino}
                </p>
              </div>

              {/* Timeline */}
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  Timeline
                </p>
                {order.timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '3px 0' }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: t.completado ? 'var(--primario)' : 'var(--border)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, flex: 1, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                      {t.step}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {t.hora}
                    </span>
                  </div>
                ))}
              </div>

              {/* Simulated metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <div style={{ borderRadius: 10, padding: 12, background: 'var(--bg-alt)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Km recorridos</p>
                  <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
                    {((Math.abs(order.destinoLat - order.origenLat) + Math.abs(order.destinoLng - order.origenLng)) * 111 * 10).toFixed(1)} km
                  </p>
                </div>
                <div style={{ borderRadius: 10, padding: 12, background: 'var(--bg-alt)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Tiempo total</p>
                  <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
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

              {/* Action button */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate('solicitar'); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--primario)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <RotateCcw size={13} />
                  Volver a enviar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Compra History Item ────────────────────── */

function CompraHistoryItem({
  oc,
  onNavigate,
}: {
  oc: OrdenCompra;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
}) {
  const color = compraStatusColor(oc.estado);
  const itemCount = oc.items.reduce((s, i) => s + i.cantidad, 0);

  const compraStatusBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    background: `${color}20`,
    color,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div
        style={{
          padding: 16,
          background: 'var(--surface)',
          borderRadius: 14,
          border: '1px solid var(--border)',
        }}
      >
        {/* Row 1: tienda logo + nombre + status badge + fecha + total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: oc.tiendaColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: '#fff',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {oc.tiendaLogo}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: 'var(--text)' }}>
                {oc.tiendaNombre}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                {oc.fecha} · {oc.hora}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={compraStatusBadgeStyle}>{compraStatusLabel(oc.estado)}</span>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
              C$ {oc.total}
            </span>
          </div>
        </div>

        {/* Row 2: resumen productos */}
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {itemCount} producto{itemCount !== 1 ? 's' : ''}: {oc.items.map(i => i.nombreProducto).join(', ')}
        </div>

        {/* Row 3: repartidor + calificacion */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'var(--bg-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--primario-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--primario)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {oc.repartidorInitials || '?'}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
              {oc.repartidorNombre || 'Sin asignar'}
            </span>
          </div>
          {oc.calificacion && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  style={{ color: i < oc.calificacion! ? '#F59E0B' : 'var(--border)' }}
                  fill={i < oc.calificacion! ? '#F59E0B' : 'none'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Row 4: action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onNavigate('explorar')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <RotateCcw size={13} />
            Reordenar
          </button>
          <button
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Ver detalle
          </button>
          {!oc.calificacion && (
            <button
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: '#F59E0B',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Star size={13} />
              Calificar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Empty States ────────────────────────────── */

function EmptyActiveEnvios() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
      }}
    >
      <svg width="100" height="100" viewBox="0 0 120 120" fill="none">
        <rect x="30" y="45" width="60" height="50" rx="6" style={{ fill: 'var(--bg-alt)' }} stroke="var(--border)" strokeWidth="2" />
        <rect x="30" y="45" width="60" height="18" rx="6" style={{ fill: 'var(--primario-soft)' }} stroke="var(--primario)" strokeWidth="1.5" />
        <path d="M30 55 L60 38 L90 55" stroke="var(--primario)" strokeWidth="2" fill="none" />
        <motion.g animate={{ x: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <path d="M62 82 L78 82" stroke="var(--primario)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M73 76 L79 82 L73 88" stroke="var(--primario)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
      </svg>
      <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', marginTop: 16, marginBottom: 6 }}>
        No tienes envíos activos
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', maxWidth: 280 }}>
        Solicita un envío y aparecerá aquí en tiempo real
      </p>
    </motion.div>
  );
}

function EmptyActiveCompras() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--bg-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <ShoppingBag size={36} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', marginBottom: 6 }}>
        No tienes compras activas
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', maxWidth: 280 }}>
        Explora tiendas y haz tu primera compra
      </p>
    </motion.div>
  );
}

function EmptyHistory({ type }: { type: 'envios' | 'compras' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px' }}>
      {type === 'envios' ? (
        <Package size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
      ) : (
        <ShoppingBag size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
      )}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
        No se encontraron {type === 'envios' ? 'envíos' : 'compras'}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientPedidos({ isDark, userName, onNavigate, onOpenTracking, onOpenChat }: ClientPedidosProps) {
  /* ── Store ── */
  const { orders } = useStore();
  const { ordenesCompra } = useMarketplaceStore();

  /* ── Local state ── */
  const [activeTab, setActiveTab] = useState<TabKey>('activos');
  const [envioFilter, setEnvioFilter] = useState<EnvioFilterKey>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Computed: envios ── */
  const clientOrders = useMemo(
    () => orders.filter((o) => o.cliente === 'María López' || o.cliente === 'Maria López'),
    [orders]
  );

  const activeEnvios = useMemo(
    () => clientOrders.filter((o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido'),
    [clientOrders]
  );

  const historicalEnvios = useMemo(
    () => clientOrders.filter((o) => o.estado === 'entregado' || o.estado === 'incidencia'),
    [clientOrders]
  );

  const filteredEnvios = useMemo(() => {
    let result = historicalEnvios;
    if (envioFilter === 'entregados') result = result.filter((o) => o.estado === 'entregado');
    else if (envioFilter === 'cancelados' || envioFilter === 'incidencia') result = result.filter((o) => o.estado === 'incidencia');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.destino.toLowerCase().includes(q) ||
          o.origen.toLowerCase().includes(q)
      );
    }
    return result;
  }, [historicalEnvios, envioFilter, searchQuery]);

  /* ── Computed: compras ── */
  const activeCompras = useMemo(
    () => ordenesCompra.filter((oc) => oc.estado !== 'entregado'),
    [ordenesCompra]
  );

  const deliveredCompras = useMemo(
    () => ordenesCompra.filter((oc) => oc.estado === 'entregado'),
    [ordenesCompra]
  );

  /* ── Tab counts ── */
  const activosCount = activeEnvios.length + activeCompras.length;
  const enviosCount = historicalEnvios.length;
  const comprasCount = deliveredCompras.length;

  /* ── Filter pills for envios tab ── */
  const envioFilterPills: { key: EnvioFilterKey; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'entregados', label: 'Entregados' },
    { key: 'cancelados', label: 'Cancelados' },
    { key: 'incidencia', label: 'Con incidencia' },
  ];

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div style={{ width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            color: 'var(--text)',
            margin: 0,
          }}
        >
          Mis Pedidos
        </h1>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          padding: 4,
          borderRadius: 14,
          background: 'var(--bg-alt)',
        }}
      >
        {([
          { key: 'activos' as TabKey, label: 'Activos', count: activosCount },
          { key: 'envios' as TabKey, label: 'Envíos', count: enviosCount },
          { key: 'compras' as TabKey, label: 'Compras', count: comprasCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              border: 'none',
              background: activeTab === tab.key ? 'var(--primario)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              position: 'relative',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  padding: '0 5px',
                  fontSize: 10,
                  fontWeight: 700,
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--primario)',
                  color: activeTab === tab.key ? '#fff' : '#fff',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {/* ═══ TAB: ACTIVOS ═══ */}
        {activeTab === 'activos' && (
          <motion.div
            key="activos"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Active Envios Section */}
            {activeEnvios.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Package size={16} style={{ color: 'var(--primario)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: 'var(--text)' }}>
                    Envíos activos
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      padding: '0 6px',
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'var(--primario)',
                      color: '#fff',
                    }}
                  >
                    {activeEnvios.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeEnvios.map((order) => (
                    <ActiveEnvioCard
                      key={order.id}
                      order={order}
                      onOpenTracking={onOpenTracking}
                      onOpenChat={onOpenChat}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active Compras Section */}
            {activeCompras.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <ShoppingBag size={16} style={{ color: 'var(--primario)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: 'var(--text)' }}>
                    Compras activas
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      padding: '0 6px',
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'var(--primario)',
                      color: '#fff',
                    }}
                  >
                    {activeCompras.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeCompras.map((oc) => (
                    <ActiveCompraCard
                      key={oc.id}
                      oc={oc}
                      onOpenTracking={onOpenTracking}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Both empty */}
            {activeEnvios.length === 0 && activeCompras.length === 0 && (
              <div>
                <EmptyActiveEnvios />
                <div style={{ borderBottom: '1px solid var(--border)', margin: '0 16px' }} />
                <EmptyActiveCompras />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, padding: '0 16px' }}>
                  <button
                    onClick={() => onNavigate('solicitar')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'var(--primario)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Solicitar envío
                  </button>
                  <button
                    onClick={() => onNavigate('explorar')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Explorar tiendas
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TAB: ENVIOS ═══ */}
        {activeTab === 'envios' && (
          <motion.div
            key="envios"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Metrics */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginBottom: 20,
              }}
            >
              {[
                {
                  value: clientOrders.length,
                  label: 'envíos totales',
                },
                {
                  value: `C$ ${clientOrders.reduce((s, o) => s + o.monto, 0).toLocaleString()}`,
                  label: 'gastados',
                },
                {
                  value: clientOrders.filter((o) => o.fecha.startsWith('2026-06')).length,
                  label: 'envíos este mes',
                },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {envioFilterPills.map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setEnvioFilter(pill.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: envioFilter === pill.key ? 'var(--primario)' : 'var(--bg-alt)',
                    color: envioFilter === pill.key ? 'white' : 'var(--text-secondary)',
                    border: envioFilter === pill.key ? '1px solid var(--primario)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Buscar por ID o destino..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 36,
                  paddingRight: 16,
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderRadius: 12,
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  background: 'var(--bg-alt)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primario)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Counter */}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
              {filteredEnvios.length} envío{filteredEnvios.length !== 1 ? 's' : ''} en tu historial
            </p>

            {/* Order list */}
            {filteredEnvios.length === 0 ? (
              <EmptyHistory type="envios" />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 600,
                  overflowY: 'auto',
                  paddingRight: 4,
                  scrollbarWidth: 'thin',
                }}
              >
                {filteredEnvios.map((order) => (
                  <HistoryEnvioItem
                    key={order.id}
                    order={order}
                    onNavigate={onNavigate}
                    onOpenTracking={onOpenTracking}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TAB: COMPRAS ═══ */}
        {activeTab === 'compras' && (
          <motion.div
            key="compras"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Metrics */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginBottom: 20,
              }}
            >
              {[
                {
                  value: deliveredCompras.length,
                  label: 'compras totales',
                },
                {
                  value: `C$ ${deliveredCompras.reduce((s, o) => s + o.total, 0).toLocaleString()}`,
                  label: 'gastados',
                },
                {
                  value: ordenesCompra.length,
                  label: 'pedidos totales',
                },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Counter */}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
              {deliveredCompras.length} compra{deliveredCompras.length !== 1 ? 's' : ''} completada{deliveredCompras.length !== 1 ? 's' : ''}
            </p>

            {/* Compras list */}
            {deliveredCompras.length === 0 ? (
              <EmptyHistory type="compras" />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 600,
                  overflowY: 'auto',
                  paddingRight: 4,
                  scrollbarWidth: 'thin',
                }}
              >
                {deliveredCompras.map((oc) => (
                  <CompraHistoryItem
                    key={oc.id}
                    oc={oc}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
