'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Share2,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  Home,
  Bike,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Star,
  Navigation,
} from 'lucide-react';
import { useStore, type TrackingStep, type RepartidorInfo, type Order } from '@/lib/store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientTrackingProps {
  isDark: boolean;
  onBack: () => void;
  onOpenChat: (orderId: string) => void;
  onRate: (orderId: string) => void;
}

/* ═══════════════════════════════════════════════
   MOCK REPARTIDORES INFO MAP
   ═══════════════════════════════════════════════ */

const REPARTIDOR_MAP: Record<string, RepartidorInfo> = {
  'CM': { id: 'r1', nombre: 'Carlos Mendoza', initials: 'CM', color: '#4CAF50', calificacion: 4.8, totalEntregas: 287, moto: 'Honda Wave 125', telefono: '+505 8888-1111', lat: 12.1120, lng: -86.2400 },
  'AT': { id: 'r2', nombre: 'Ana Torres', initials: 'AT', color: '#E91E63', calificacion: 4.9, totalEntregas: 312, moto: 'Yamaha NMAX', telefono: '+505 8888-2222', lat: 12.1080, lng: -86.2480 },
  'LR': { id: 'r3', nombre: 'Luis Ramos', initials: 'LR', color: '#2196F3', calificacion: 4.6, totalEntregas: 195, moto: 'Suzuki AX4', telefono: '+505 8888-3333', lat: 12.1200, lng: -86.2600 },
  'JP': { id: 'r4', nombre: 'Jorge Pérez', initials: 'JP', color: '#FF9800', calificacion: 4.7, totalEntregas: 256, moto: 'Honda PCX', telefono: '+505 8888-4444', lat: 12.0950, lng: -86.2300 },
  'RD': { id: 'r5', nombre: 'Rosa Díaz', initials: 'RD', color: '#9C27B0', calificacion: 4.5, totalEntregas: 143, moto: 'TVS Ntorq', telefono: '+505 8888-5555', lat: 12.1100, lng: -86.2350 },
  'MS': { id: 'r6', nombre: 'Miguel Sevilla', initials: 'MS', color: '#00BCD4', calificacion: 4.4, totalEntregas: 98, moto: 'Honda Click', telefono: '+505 8888-6666', lat: 12.1300, lng: -86.2700 },
};

function getRepartidorInfo(initials: string): RepartidorInfo {
  return REPARTIDOR_MAP[initials] ?? {
    id: 'r0',
    nombre: 'Repartidor',
    initials: initials || 'RP',
    color: '#FF5722',
    calificacion: 4.5,
    totalEntregas: 100,
    moto: 'Moto estándar',
    telefono: '+505 0000-0000',
    lat: 12.1140,
    lng: -86.2400,
  };
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function statusBadge(estado: string): { label: string; color: string } {
  switch (estado) {
    case 'pendiente': return { label: 'Pendiente', color: 'var(--warning)' };
    case 'encamino': return { label: 'En camino', color: 'var(--info)' };
    case 'recogido': return { label: 'Recogido', color: 'var(--info)' };
    case 'entregado': return { label: 'Entregado', color: 'var(--exito)' };
    case 'incidencia': return { label: 'Incidencia', color: 'var(--peligro)' };
    case 'programada': return { label: 'Programada', color: 'var(--primario)' };
    default: return { label: estado, color: 'var(--text-muted)' };
  }
}

function getStepIcon(step: TrackingStep, index: number) {
  if (step.status === 'completed') {
    return <CheckCircle size={18} style={{ color: 'var(--exito)' }} />;
  }
  if (step.status === 'current') {
    return (
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '2.5px solid var(--primario)',
          background: 'var(--primario-soft)',
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: '2px solid var(--border)',
        background: 'transparent',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════
   CSS MAP COMPONENT (No Leaflet)
   ═══════════════════════════════════════════════ */

function VisualMap({
  isDark,
  order,
  currentStepIndex,
}: {
  isDark: boolean;
  order: Order | null;
  currentStepIndex: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [centered, setCentered] = useState(false);

  // Calculate rider position based on step progress (0 to 7)
  const progress = Math.min(currentStepIndex / 7, 1);

  // Pickup at left, destination at right, rider moves along path
  const pickupX = 15;
  const pickupY = 65;
  const destX = 82;
  const destY = 30;

  // Rider position interpolates along a curved path
  const riderX = pickupX + (destX - pickupX) * progress;
  const riderY = pickupY + (destY - pickupY) * progress - Math.sin(progress * Math.PI) * 15;

  // Control point for the SVG curve
  const ctrlX = (pickupX + destX) / 2;
  const ctrlY = Math.min(pickupY, destY) - 20;

  const bgGradient = isDark
    ? 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 40%, #162029 70%, #0A1628 100%)'
    : 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 30%, #80CBC4 60%, #B2DFDB 100%)';

  const roadColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const gridColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

  return (
    <div
      ref={mapRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: bgGradient,
        overflow: 'hidden',
      }}
    >
      {/* Grid pattern */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={gridColor} strokeWidth="1" />
          </pattern>
          <pattern id="mapRoads" width="120" height="80" patternUnits="userSpaceOnUse">
            <line x1="0" y1="40" x2="120" y2="40" stroke={roadColor} strokeWidth="12" />
            <line x1="60" y1="0" x2="60" y2="80" stroke={roadColor} strokeWidth="8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)" />
        <rect width="100%" height="100%" fill="url(#mapRoads)" />

        {/* Decorative "block" shapes */}
        {isDark ? (
          <>
            <rect x="5%" y="10%" width="25%" height="15%" rx="3" fill="rgba(255,255,255,0.02)" />
            <rect x="55%" y="50%" width="30%" height="12%" rx="3" fill="rgba(255,255,255,0.02)" />
            <rect x="35%" y="75%" width="20%" height="10%" rx="3" fill="rgba(255,255,255,0.015)" />
          </>
        ) : (
          <>
            <rect x="5%" y="10%" width="25%" height="15%" rx="3" fill="rgba(0,77,64,0.06)" />
            <rect x="55%" y="50%" width="30%" height="12%" rx="3" fill="rgba(0,77,64,0.06)" />
            <rect x="35%" y="75%" width="20%" height="10%" rx="3" fill="rgba(0,77,64,0.04)" />
          </>
        )}

        {/* Dotted path from pickup to destination */}
        <path
          d={`M ${pickupX}% ${pickupY}% Q ${ctrlX}% ${ctrlY}% ${destX}% ${destY}%`}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}
          strokeWidth="2"
          strokeDasharray="6 6"
        />

        {/* Completed portion of path */}
        {progress > 0 && (
          <path
            d={`M ${pickupX}% ${pickupY}% Q ${ctrlX}% ${ctrlY}% ${riderX}% ${riderY}%`}
            fill="none"
            stroke="var(--primario)"
            strokeWidth="2.5"
            strokeDasharray="none"
            opacity={0.7}
          />
        )}
      </svg>

      {/* Pickup Marker */}
      <div
        style={{
          position: 'absolute',
          left: `${pickupX}%`,
          top: `${pickupY}%`,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--exito)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,200,83,0.35)',
          }}
        >
          <Package size={18} color="#fff" />
        </div>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: isDark ? '#B2DFDB' : '#004D40',
            background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
            padding: '1px 6px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}
        >
          Recogida
        </span>
      </div>

      {/* Destination Marker */}
      <div
        style={{
          position: 'absolute',
          left: `${destX}%`,
          top: `${destY}%`,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#FF9800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255,152,0,0.35)',
          }}
        >
          <Home size={18} color="#fff" />
        </div>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: isDark ? '#FFE0B2' : '#E65100',
            background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
            padding: '1px 6px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}
        >
          Destino
        </span>
      </div>

      {/* Rider Marker */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          left: `${riderX}%`,
          top: `${riderY}%`,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 20,
        }}
      >
        {/* Pulse ring */}
        <div
          style={{
            position: 'absolute',
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid var(--primario)',
            opacity: 0.4,
            animation: 'pulse-ring 1.8s ease-out infinite',
          }}
        />
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid var(--primario)',
            boxShadow: '0 2px 12px rgba(255,87,34,0.3)',
          }}
        >
          <Bike size={20} style={{ color: 'var(--primario)' }} />
        </div>
      </motion.div>

      {/* ETA Pill near rider */}
      <div
        style={{
          position: 'absolute',
          left: `${Math.min(riderX + 8, 90)}%`,
          top: `${Math.max(riderY - 10, 5)}%`,
          transform: 'translate(0, -100%)',
          zIndex: 25,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            padding: '4px 10px',
            borderRadius: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Clock size={13} style={{ color: 'var(--primario)' }} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--primario)',
            }}
          >
            ~{useStore.getState().trackingETA} min
          </span>
        </div>
      </div>

      {/* Center on rider FAB */}
      <button
        onClick={() => setCentered((c) => !c)}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          zIndex: 30,
        }}
        aria-label="Centrar en repartidor"
      >
        <Target size={18} style={{ color: 'var(--primario)' }} />
      </button>

      {/* Back button */}
      <button
        onClick={() => useStore.getState().setTrackingOrder(null)}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 30,
        }}
        aria-label="Cerrar seguimiento"
      >
        <X size={18} style={{ color: isDark ? '#fff' : '#1B1B2F' }} />
      </button>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientTracking({ isDark, onBack, onOpenChat, onRate }: ClientTrackingProps) {
  const {
    trackingOrderId,
    trackingSteps,
    trackingETA,
    orders,
    advanceTrackingStep,
    updateTrackingETA,
  } = useStore();

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const etaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Find the current order
  const order = trackingOrderId
    ? orders.find((o) => o.id === trackingOrderId) ?? null
    : null;

  // Get repartidor info
  const repartidor = order ? getRepartidorInfo(order.repartidorInitials) : null;

  // Current step index
  const currentStepIdx = trackingSteps.findIndex((s) => s.status === 'current');
  const completedCount = trackingSteps.filter((s) => s.status === 'completed').length;
  const allCompleted = trackingSteps.every((s) => s.status === 'completed');
  const progressPct = allCompleted ? 100 : Math.round((completedCount / trackingSteps.length) * 100);

  // Simulation intervals
  useEffect(() => {
    if (allCompleted) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      advanceTrackingStep();
    }, 15000);

    etaIntervalRef.current = setInterval(() => {
      updateTrackingETA();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    };
  }, [allCompleted, advanceTrackingStep, updateTrackingETA]);

  // Copy tracking link
  const handleShare = useCallback(() => {
    const link = `${window.location.origin}/track/${trackingOrderId ?? ''}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [trackingOrderId]);

  // Status badge info
  const badge = order ? statusBadge(order.estado) : { label: '', color: '' };

  // Star rendering for rating
  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < full ? 'var(--primario)' : 'none'}
            stroke={i < full ? 'var(--primario)' : 'var(--border)'}
            strokeWidth={i < full ? 0 : 1.5}
            style={{ display: 'inline' }}
          />
        ))}
      </span>
    );
  };

  /* ─── DELIVERY CONFIRMED SCREEN ─── */
  if (allCompleted && order) {
    return (
      <div
        data-theme={isDark ? 'dark' : 'light'}
        style={{
          width: '100%',
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--exito)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(0,200,83,0.3)',
          }}
        >
          <CheckCircle size={44} color="#fff" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--exito)',
            margin: 0,
          }}
        >
          ¡Entregado!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: 'var(--text-secondary)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Tu paquete fue entregado exitosamente
        </motion.p>

        {/* Info row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          {[
            { icon: <Clock size={15} />, label: '14:52', sub: 'Hora' },
            { icon: <Bike size={15} />, label: repartidor?.nombre.split(' ')[0] ?? '—', sub: 'Repartidor' },
            { icon: <Navigation size={15} />, label: '3.2 km', sub: 'Distancia' },
            { icon: <Clock size={15} />, label: '18 min', sub: 'Tiempo total' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 14px',
                minWidth: 70,
              }}
            >
              <div style={{ color: 'var(--primario)', marginBottom: 2 }}>{item.icon}</div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {item.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</span>
            </div>
          ))}
        </motion.div>

        {/* Photo evidence placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{
            width: '100%',
            maxWidth: 280,
            height: 160,
            borderRadius: 12,
            border: '2px dashed var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 8,
            background: 'var(--bg-alt)',
          }}
        >
          <Package size={28} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>
            Foto de evidencia
          </span>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 12 }}
        >
          <button
            onClick={() => onRate(order.id)}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontFamily: "'Syne', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-primario)',
              transition: 'background 0.2s',
            }}
          >
            <Star size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Calificar servicio
          </button>
          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  /* ─── MAIN TRACKING LAYOUT ─── */
  return (
    <div
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
      className="md:!flex-row"
    >
      {/* ─── MAP AREA ─── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '50vh',
          flexShrink: 0,
        }}
        className="md:!h-full md:!w-[60%]"
      >
        <VisualMap
          isDark={isDark}
          order={order}
          currentStepIndex={currentStepIdx >= 0 ? currentStepIdx : 0}
        />
        {/* Back button overlaid on map */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 30,
          }}
          aria-label="Volver"
        >
          <X size={18} style={{ color: isDark ? '#fff' : '#1B1B2F' }} />
        </button>
      </div>

      {/* ─── BOTTOM SHEET ─── */}
      <div
        style={{
          flex: 1,
          background: 'var(--bg)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          marginTop: -20,
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden',
        }}
        className="md:!mt-0 md:!rounded-none md:!border-l md:!border-[var(--border)]"
      >
        {/* Handle bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 10,
            paddingBottom: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: 'var(--border)',
            }}
          />
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 32,
          }}
          className="lf-scrollbar"
        >
          {/* ─── ORDER HEADER ─── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                color: 'var(--text-muted)',
              }}
            >
              {order?.id ?? '—'}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: '#fff',
                background: badge.color,
              }}
            >
              {badge.label}
            </span>
          </div>

          {/* ─── ETA SECTION ─── */}
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'var(--text-muted)',
                margin: '0 0 4px 0',
              }}
            >
              {order?.estado === 'programada'
                ? 'Recogida programada para'
                : 'Tu paquete llega en'}
            </p>
            <AnimatePresence mode="wait">
              <motion.h2
                key={trackingETA}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: 'var(--primario)',
                  margin: '0 0 12px 0',
                }}
              >
                {order?.estado === 'programada'
                  ? order.hora
                  : `~${trackingETA} minutos`}
              </motion.h2>
            </AnimatePresence>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: 'var(--bg-alt)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: 3,
                  background: `linear-gradient(90deg, var(--primario), var(--primario-hover))`,
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 4,
                margin: '4px 0 0 0',
              }}
            >
              {progressPct}% completado
            </p>
          </div>

          {/* ─── 8-STEP TIMELINE ─── */}
          <div style={{ marginBottom: 24 }}>
            {trackingSteps.map((step, i) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  position: 'relative',
                  minHeight: 44,
                }}
              >
                {/* Left: Icon + connector */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 24,
                    flexShrink: 0,
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${step.id}-${step.status}`}
                      initial={step.status === 'completed' ? { scale: 0 } : { scale: 1 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                      }}
                    >
                      {getStepIcon(step, i)}
                    </motion.div>
                  </AnimatePresence>

                  {/* Connector line */}
                  {i < trackingSteps.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 20,
                        background: step.status === 'completed'
                          ? 'var(--primario)'
                          : 'transparent',
                        borderLeft: step.status !== 'completed'
                          ? '2px dashed var(--border)'
                          : 'none',
                      }}
                    />
                  )}
                </div>

                {/* Right: Step text + timestamp */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flex: 1,
                    paddingTop: 2,
                    paddingBottom: i < trackingSteps.length - 1 ? 0 : 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: step.status === 'current' ? 600 : step.status === 'completed' ? 500 : 400,
                      color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text)',
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {step.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ─── DRIVER INFO CARD ─── */}
          {repartidor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: repartidor.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {repartidor.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {repartidor.nombre}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    {repartidor.moto}
                  </p>
                </div>
              </div>

              {/* Rating row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                <Star size={14} style={{ color: '#FF9800' }} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}
                >
                  {repartidor.calificacion}
                </span>
                {renderStars(repartidor.calificacion)}
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginLeft: 4,
                  }}
                >
                  {repartidor.totalEntregas} entregas
                </span>
              </div>

              {/* Action pills */}
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`tel:${repartidor.telefono}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    color: 'var(--text)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <Phone size={15} style={{ color: 'var(--exito)' }} />
                  Llamar
                </a>
                <button
                  onClick={() => order && onOpenChat(order.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    color: 'var(--text)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <MessageCircle size={15} style={{ color: 'var(--info)' }} />
                  Mensaje
                </button>
                <button
                  onClick={handleShare}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    color: 'var(--text)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <Share2 size={15} style={{ color: 'var(--primario)' }} />
                  {copied ? '¡Copiado!' : 'Compartir'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── ORDER DETAILS (expandable) ─── */}
          {order && (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setDetailsExpanded((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 0',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Detalles del envío
                </span>
                {detailsExpanded ? (
                  <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
                )}
              </button>

              <AnimatePresence>
                {detailsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                        paddingTop: 4,
                        paddingBottom: 8,
                      }}
                    >
                      {[
                        { label: 'Descripción', value: order.descripcion || 'Paquete estándar' },
                        { label: 'Tamaño', value: 'Mediano (30×30×30cm)' },
                        { label: 'Fragil', value: 'No' },
                        { label: 'Instrucciones', value: 'Dejar en portería' },
                        {
                          label: 'Pago',
                          value: `${order.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'} — C$${order.monto}`,
                        },
                        { label: 'Código promo', value: '—' },
                      ].map((detail, i) => (
                        <div key={i}>
                          <p
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              margin: 0,
                            }}
                          >
                            {detail.label}
                          </p>
                          <p
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'var(--text)',
                              margin: '2px 0 0 0',
                            }}
                          >
                            {detail.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ─── ACTION BUTTONS ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '12px 0',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'transparent',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--peligro)',
                transition: 'background 0.2s',
              }}
            >
              <AlertTriangle size={15} />
              Reportar problema
            </button>
            {order && (order.estado === 'pendiente' || order.estado === 'programada') && (
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '12px 0',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: 'var(--peligro)',
                  transition: 'background 0.2s',
                }}
              >
                <X size={15} />
                Cancelar envío
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
