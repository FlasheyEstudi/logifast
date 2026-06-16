'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ShoppingBag, ArrowRight, Navigation, MessageCircle,
  RefreshCw, Star, Clock, MapPin, Truck, RotateCcw, Search, Copy,
} from 'lucide-react';
import { useStore, type Order } from '@/lib/store';
import { useMarketplaceStore, type OrdenCompra } from '@/lib/marketplace-store';

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

type TabKey = 'activos' | 'historial';
type HistoriaFilterKey = 'todos' | 'envios' | 'compras' | 'entregados' | 'cancelados';

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

/* ═══════════════════════════════════════════════
   SHARED CARD STYLE
   ═══════════════════════════════════════════════ */

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 22px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
};

/* ═══════════════════════════════════════════════
   STATUS BADGE COMPONENT
   ═══════════════════════════════════════════════ */

function StatusBadge({ label, color, estado }: { label: string; color?: string; estado?: string }) {
  const lfClass = (() => {
    if (!estado) return '';
    switch (estado) {
      case 'pendiente': return 'lf-badge-pendiente';
      case 'encamino':
      case 'en_camino': return 'lf-badge-en-camino';
      case 'recogido': return 'lf-badge-recogido';
      case 'recibido': return 'lf-badge-recibido';
      case 'preparando': return 'lf-badge-preparando';
      case 'listo': return 'lf-badge-listo';
      case 'entregado': return 'lf-badge-entregado';
      case 'incidencia': return 'lf-badge-incidencia';
      case 'programada': return 'lf-badge-programada';
      default: return '';
    }
  })();
  if (lfClass) {
    return (
      <span
        className={`lf-badge ${lfClass}`}
        style={{
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 'var(--lf-pill-radius, 100px)',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        color: color || 'var(--text)',
        background: 'var(--bg-alt)',
        letterSpacing: 0.2,
      }}
    >
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════
   ACTIVE ENVIO CARD
   ═══════════════════════════════════════════════ */

function ActiveEnvioCard({
  order,
  onOpenTracking,
  onOpenChat,
}: {
  order: Order;
  onOpenTracking: (orderId: string) => void;
  onOpenChat: (orderId: string) => void;
}) {
  const statusBg = ENVIO_STATUS_COLOR[order.estado] ?? 'var(--border)';
  const etaMin = useMemo(() => Math.floor(Math.random() * 12) + 8, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={cardStyle}
    >
      <div style={{ padding: 20 }}>
        {/* Row 1: Package icon + route + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--primario-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Package size={24} style={{ color: 'var(--primario)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                {order.id}
              </span>
              <StatusBadge label={envioStatusLabel(order.estado)} color={statusBg} estado={order.estado} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortenLocation(order.origen)}</span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortenLocation(order.destino)}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Rider + ETA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            padding: '10px 14px',
            borderRadius: 14,
            background: 'var(--bg-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primario-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--primario)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {order.repartidorInitials || '?'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                {order.repartidor || 'Sin asignar'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                Repartidor
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)', lineHeight: 1.1 }}>
              ~{etaMin}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
              minutos
            </div>
          </div>
        </div>

        {/* Row 3: Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={() => onOpenTracking(order.id)}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 'var(--lf-button-radius, 16px)',
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: 'var(--shadow-primario)',
            }}
          >
            <Navigation size={16} />
            Rastrear
          </button>
          {order.repartidor && (
            <button
              onClick={() => onOpenChat(order.id)}
              style={{
                padding: '12px 18px',
                borderRadius: 'var(--lf-button-radius, 16px)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 14,
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
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   ACTIVE COMPRA CARD
   ═══════════════════════════════════════════════ */

function ActiveCompraCard({
  oc,
  onOpenTracking,
}: {
  oc: OrdenCompra;
  onOpenTracking: (orderId: string) => void;
}) {
  const color = compraStatusColor(oc.estado);
  const etaMin = useMemo(() => Math.floor(Math.random() * 20) + 15, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={cardStyle}
    >
      <div style={{ padding: 20 }}>
        {/* Row 1: Tienda logo + nombre + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: oc.tiendaColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: '#fff',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {oc.tiendaLogo}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: 'var(--text)' }}>
                {oc.tiendaNombre}
              </span>
              <StatusBadge label={compraStatusLabel(oc.estado)} color={color} estado={oc.estado} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {oc.items.map(i => i.nombreProducto).join(', ')}
            </div>
          </div>
        </div>

        {/* Row 2: Rider + ETA + Total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            padding: '10px 14px',
            borderRadius: 14,
            background: 'var(--bg-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primario-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--primario)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {oc.repartidorInitials || '?'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                {oc.repartidorNombre || 'Sin asignar'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                Repartidor
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)', lineHeight: 1.1 }}>
              ~{etaMin}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
              minutos
            </div>
          </div>
        </div>

        {/* Row 3: Total + Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
            C$ {oc.total}
          </span>
          <button
            onClick={() => onOpenTracking(oc.id)}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--lf-button-radius, 16px)',
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: 'var(--shadow-primario)',
            }}
          >
            <Navigation size={16} />
            Rastrear
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   HISTORY ITEM — ENVIO (compact)
   ═══════════════════════════════════════════════ */

function HistoryEnvioItem({
  order,
  onNavigate,
  onOpenTracking,
}: {
  order: Order;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
  onOpenTracking: (orderId: string) => void;
}) {
  const badge = ENVIO_STATUS_BADGE[order.estado] ?? ENVIO_STATUS_BADGE.pendiente;
  const statusBg = ENVIO_STATUS_COLOR[order.estado] ?? 'var(--border)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={cardStyle}
    >
      <div style={{ padding: 16 }}>
        {/* Fila 1: ID + badge + fecha */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
              {order.id}
            </span>
            <StatusBadge label={badge.label} color={statusBg} estado={order.estado} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            {order.fecha}
          </span>
        </div>

        {/* Fila 2: destino + monto */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
            <MapPin size={14} style={{ color: 'var(--primario)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shortenLocation(order.destino)}
            </span>
          </div>
          <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
            C$ {order.monto}
          </span>
        </div>

        {/* Fila 3: repartidor + calificacion */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            padding: '6px 10px',
            borderRadius: 10,
            background: 'var(--bg-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
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
          {order.calificacion && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  style={{ color: i < order.calificacion! ? '#F59E0B' : 'var(--border)' }}
                  fill={i < order.calificacion! ? '#F59E0B' : 'none'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onNavigate('solicitar')}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RotateCcw size={13} />
            Reenviar
          </button>
          <button
            onClick={() => onOpenTracking(order.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Navigation size={13} />
            Ver detalle
          </button>
          {!order.calificacion && (
            <button
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: '#F59E0B',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginLeft: 'auto',
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

/* ═══════════════════════════════════════════════
   HISTORY ITEM — COMPRA (compact)
   ═══════════════════════════════════════════════ */

function CompraHistoryItem({
  oc,
  onNavigate,
}: {
  oc: OrdenCompra;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil') => void;
}) {
  const color = compraStatusColor(oc.estado);
  const itemCount = oc.items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={cardStyle}
    >
      <div style={{ padding: 16 }}>
        {/* Fila 1: ID + badge + fecha */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
              {oc.id}
            </span>
            <StatusBadge label={compraStatusLabel(oc.estado)} color={color} estado={oc.estado} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            {oc.fecha}
          </span>
        </div>

        {/* Fila 2: tienda + monto */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: oc.tiendaColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 10 }}>
                {oc.tiendaLogo}
              </span>
            </div>
            <span style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {oc.tiendaNombre}
            </span>
          </div>
          <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
            C$ {oc.total}
          </span>
        </div>

        {/* Fila 3: repartidor + calificacion */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            padding: '6px 10px',
            borderRadius: 10,
            background: 'var(--bg-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  style={{ color: i < oc.calificacion! ? '#F59E0B' : 'var(--border)' }}
                  fill={i < oc.calificacion! ? '#F59E0B' : 'none'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('explorar')}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RotateCcw size={13} />
            Reordenar
          </button>
          <button
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Reenviar
          </button>
          {!oc.calificacion && (
            <button
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: '#F59E0B',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginLeft: 'auto',
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

/* ═══════════════════════════════════════════════
   EMPTY STATES
   ═══════════════════════════════════════════════ */

function EmptyActive() {
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
      {/* SVG illustration */}
      <svg width="120" height="100" viewBox="0 0 140 110" fill="none">
        <rect x="30" y="40" width="80" height="55" rx="8" style={{ fill: 'var(--bg-alt)' }} stroke="var(--border)" strokeWidth="2" />
        <rect x="30" y="40" width="80" height="20" rx="8" style={{ fill: 'var(--primario-soft)' }} stroke="var(--primario)" strokeWidth="1.5" />
        <path d="M30 52 L70 32 L110 52" stroke="var(--primario)" strokeWidth="2" fill="none" />
        <motion.g animate={{ x: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <path d="M80 78 L98 78" stroke="var(--primario)" strokeWidth="3" strokeLinecap="round" />
          <path d="M93 71 L100 78 L93 85" stroke="var(--primario)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
        <circle cx="50" cy="70" r="4" style={{ fill: 'var(--border)' }} />
        <circle cx="90" cy="70" r="4" style={{ fill: 'var(--border)' }} />
      </svg>
      <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', marginTop: 20, marginBottom: 6 }}>
        Sin pedidos activos
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', maxWidth: 280 }}>
        Solicita un envio o haz una compra y aparecera aqui en tiempo real
      </p>
    </motion.div>
  );
}

function EmptyHistory() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px' }}>
      <Clock size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
        No se encontraron pedidos
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
  const [historiaFilter, setHistoriaFilter] = useState<HistoriaFilterKey>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Computed: envios ── */
  const clientOrders = useMemo(
    () => orders.filter((o) => o.cliente === 'Maria Lopez' || o.cliente === 'Maria Lopez' || o.cliente === userName),
    [orders, userName]
  );

  const activeEnvios = useMemo(
    () => clientOrders.filter((o) => o.estado === 'pendiente' || o.estado === 'encamino' || o.estado === 'recogido'),
    [clientOrders]
  );

  const historicalEnvios = useMemo(
    () => clientOrders.filter((o) => o.estado === 'entregado' || o.estado === 'incidencia'),
    [clientOrders]
  );

  /* ── Computed: compras ── */
  const activeCompras = useMemo(
    () => ordenesCompra.filter((oc) => oc.estado !== 'entregado'),
    [ordenesCompra]
  );

  const deliveredCompras = useMemo(
    () => ordenesCompra.filter((oc) => oc.estado === 'entregado'),
    [ordenesCompra]
  );

  /* ── Filtered history ── */
  const filteredHistory = useMemo(() => {
    const envios = historicalEnvios.map(o => ({ ...o, _type: 'envio' as const }));
    const compras = deliveredCompras.map(oc => ({ ...oc, _type: 'compra' as const }));

    if (historiaFilter === 'envios') return envios;
    if (historiaFilter === 'compras') return compras;
    if (historiaFilter === 'entregados') return [...envios.filter(e => e.estado === 'entregado'), ...compras.filter(c => c.estado === 'entregado')];
    if (historiaFilter === 'cancelados') return envios.filter(e => e.estado === 'incidencia');
    return [...envios, ...compras];
  }, [historicalEnvios, deliveredCompras, historiaFilter]);

  /* ── Counts ── */
  const activosCount = activeEnvios.length + activeCompras.length;

  /* ── Tab definition ── */
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'activos', label: 'Activos', count: activosCount },
    { key: 'historial', label: 'Historial', count: historicalEnvios.length + deliveredCompras.length },
  ];

  /* ── Filter pills ── */
  const filterPills: { key: HistoriaFilterKey; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'envios', label: 'Envios' },
    { key: 'compras', label: 'Compras' },
    { key: 'entregados', label: 'Entregados' },
    { key: 'cancelados', label: 'Cancelados' },
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

      {/* ── Tabs with sliding underline ── */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '12px 0',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: 'pointer',
                fontFamily: "'Syne', sans-serif",
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'color 0.2s ease',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    padding: '0 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    background: activeTab === tab.key ? 'var(--primario)' : 'var(--bg-alt)',
                    color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="pedidos-tab-underline"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '20%',
                    right: '20%',
                    height: 3,
                    borderRadius: 2,
                    background: 'var(--primario)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        {/* Base line */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--border)', zIndex: -1 }} />
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
            {/* Active Envios */}
            {activeEnvios.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Truck size={16} style={{ color: 'var(--primario)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}>
                    Envios activos
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
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'var(--primario)',
                      color: '#fff',
                    }}
                  >
                    {activeEnvios.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

            {/* Active Compras */}
            {activeCompras.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <ShoppingBag size={16} style={{ color: 'var(--primario)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}>
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
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'var(--primario)',
                      color: '#fff',
                    }}
                  >
                    {activeCompras.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <EmptyActive />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, padding: '0 16px' }}>
                  <button
                    onClick={() => onNavigate('solicitar')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 'var(--lf-button-radius, 16px)',
                      border: 'none',
                      background: 'var(--primario)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: 'var(--shadow-primario)',
                    }}
                  >
                    <Package size={16} />
                    Solicitar envio
                  </button>
                  <button
                    onClick={() => onNavigate('explorar')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 'var(--lf-button-radius, 16px)',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ShoppingBag size={16} />
                    Explorar tiendas
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TAB: HISTORIAL ═══ */}
        {activeTab === 'historial' && (
          <motion.div
            key="historial"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {filterPills.map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setHistoriaFilter(pill.key)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--lf-pill-radius, 100px)',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: historiaFilter === pill.key ? 'var(--primario)' : 'var(--bg-alt)',
                    color: historiaFilter === pill.key ? 'white' : 'var(--text-secondary)',
                    border: historiaFilter === pill.key ? '1px solid var(--primario)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: 0.2,
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
                  left: 14,
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
                  paddingLeft: 40,
                  paddingRight: 16,
                  paddingTop: 11,
                  paddingBottom: 11,
                  borderRadius: 'var(--lf-input-radius, 16px)',
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
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>
              {filteredHistory.length} pedido{filteredHistory.length !== 1 ? 's' : ''} en tu historial
            </p>

            {/* List */}
            {filteredHistory.length === 0 ? (
              <EmptyHistory />
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
                {filteredHistory.map((item) => {
                  if ('_type' in item && item._type === 'envio') {
                    const envio = item as Order & { _type: 'envio' };
                    return (
                      <HistoryEnvioItem
                        key={envio.id}
                        order={envio}
                        onNavigate={onNavigate}
                        onOpenTracking={onOpenTracking}
                      />
                    );
                  } else {
                    const compra = item as OrdenCompra & { _type: 'compra' };
                    return (
                      <CompraHistoryItem
                        key={compra.id}
                        oc={compra}
                        onNavigate={onNavigate}
                      />
                    );
                  }
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
