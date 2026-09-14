'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Share2,
  ChevronDown,
  MapPin,
  Package,
  Bike,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Star,
  Navigation,
  Check,
  ArrowDown,
  ArrowLeft,
  ChevronUp,
} from '@/components/icons';
import { useStore, type TrackingStep, type RepartidorInfo, type Order } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { realtime, onRealtimeEvent } from '@/services/realtime';
import { obtenerRuta, rutaLineaRecta, geocodeAddress } from '@/lib/osrm';
import { HAPTIC_PATTERNS } from '@/services/haptics';
import { dispararNotificacionNativa, inicializarNotificacionesNativas } from '@/services/native-notifications';

const RepartidorMap = dynamic(() => import('../repartidor/RepartidorMap'), { ssr: false });

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
   REPARTIDORES INFO MAP
   ═══════════════════════════════════════════════ */

function getRepartidorInfo(
  driverName?: string | null,
  initials?: string | null,
  realData?: {
    telefono?: string | null;
    calificacion?: number | null;
    totalEntregas?: number | null;
    fotoUrl?: string | null;
    color?: string | null;
  } | null
): RepartidorInfo | null {
  if (
    !driverName ||
    driverName === 'Sin asignar' ||
    driverName === 'Pendiente' ||
    driverName.trim() === ''
  ) {
    return null;
  }
  const cleanInitials =
    initials && initials !== 'RP' && initials !== 'SL'
      ? initials
      : driverName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'RP';

  return {
    id: 'rep-assigned',
    nombre: driverName,
    initials: cleanInitials,
    color: realData?.color || 'var(--primario, #007AFF)',
    calificacion: realData?.calificacion ?? 5.0,
    totalEntregas: realData?.totalEntregas ?? 0,
    moto: 'Moto LogiFast',
    telefono: realData?.telefono || '',
    lat: 12.114,
    lng: -86.24,
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

/* Map each tracking step to a specific Lucide icon */
const STEP_ICONS = [
  Check,       // s1: Orden creada
  Check,       // s2: Repartidor asignado
  Check,       // s3: En camino a recoger
  Bike,        // s4: Recogiendo paquete
  Package,     // s5: Paquete recogido
  Navigation,  // s6: En camino a destino
  MapPin,      // s7: En punto de entrega
  CheckCircle, // s8: Entregado
];

/* ═══════════════════════════════════════════════
   HAPTIC FEEDBACK
   ═══════════════════════════════════════════════ */

function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (style === 'heavy') HAPTIC_PATTERNS.heavy();
  else if (style === 'medium') HAPTIC_PATTERNS.medium();
  else HAPTIC_PATTERNS.light();
}

/* ═══════════════════════════════════════════════
   CSS MAP COMPONENT — A.5 Immersive Map
   ═══════════════════════════════════════════════ */

function VisualMap({
  isDark,
  order,
  currentStepIndex,
  eta,
}: {
  isDark: boolean;
  order: Order | null;
  currentStepIndex: number;
  eta: number;
}) {
  // Calculate rider position based on step progress (0 to 7)
  const progress = Math.min(currentStepIndex / 7, 1);

  // Pickup at left, destination at right, rider moves along path
  const pickupX = 15;
  const pickupY = 65;
  const destX = 82;
  const destY = 28;

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
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: bgGradient,
        overflow: 'hidden',
      }}
    >
      {/* Grid pattern + roads */}
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

        {/* Dashed path from pickup to destination */}
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

      {/* ─── Pickup Marker: circulo 20x20, var(--exito), borde blanco 3px ─── */}
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
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--exito)',
            border: '3px solid #fff',
            boxShadow: '0 2px 8px rgba(0,200,83,0.35)',
          }}
        />
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

      {/* ─── Destination Marker: High Clarity Delivery Drop-off ─── */}
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
          zIndex: 15,
        }}
      >
        {/* Soft beacon ring */}
        <span
          style={{
            position: 'absolute',
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.25)',
            top: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'lf-beacon-pulse 2.2s infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF453A 0%, #D70015 100%)',
            border: '3px solid #fff',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.5), 0 2px 4px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}
        >
          <MapPin size={15} strokeWidth={2.6} />
        </div>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10.5,
            fontWeight: 700,
            color: '#FFFFFF',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 69, 58, 0.4)',
            padding: '2px 8px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF453A' }} />
          Destino Entrega
        </span>
      </div>

      {/* ─── Rider Marker: circulo blanco 40x40, Bike SVG, borde var(--primario) 2px ─── */}
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
        {/* Pulsing ring — 2s loop */}
        <div
          className="lf-ring-pulse"
          style={{
            position: 'absolute',
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid var(--primario)',
            opacity: 0.4,
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
            border: '2px solid var(--primario)',
            boxShadow: '0 2px 12px rgba(255,87,34,0.3)',
          }}
        >
          <Bike size={20} style={{ color: 'var(--primario)' }} />
        </div>
      </motion.div>

      {/* ─── ETA Pill: glassmorphism near rider ─── */}
      <div
        style={{
          position: 'absolute',
          left: `${Math.min(riderX + 8, 85)}%`,
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
            background: 'var(--lf-glass-bg)',
            backdropFilter: 'blur(var(--lf-glass-blur))',
            WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
            border: '1px solid var(--lf-glass-border)',
            padding: '8px 14px',
            borderRadius: 14,
            boxShadow: 'var(--lf-shadow-float)',
          }}
        >
          <Clock size={14} style={{ color: 'var(--primario)' }} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--primario)',
            }}
          >
            ~{eta} min
          </span>
        </div>
      </div>

      {/* Center on rider FAB */}
      <button
        onClick={() => haptic('light')}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--lf-glass-bg)',
          backdropFilter: 'blur(var(--lf-glass-blur))',
          WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
          border: '1px solid var(--lf-glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'var(--lf-shadow-float)',
          zIndex: 30,
        }}
        aria-label="Centrar en repartidor"
      >
        <Target size={18} style={{ color: 'var(--primario)' }} />
      </button>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes lf-ring-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .lf-ring-pulse {
          animation: lf-ring-pulse 2s ease-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TIMELINE STEP COMPONENT — A.5 Spec
   ═══════════════════════════════════════════════ */

function TimelineStep({
  step,
  index,
  isLast,
  isDark,
}: {
  step: TrackingStep;
  index: number;
  isLast: boolean;
  isDark: boolean;
}) {
  const IconComponent = STEP_ICONS[index] ?? Check;
  const isCompleted = step.status === 'completed';
  const isCurrent = step.status === 'current';

  /* Dot: 28x28 circle */
  const dotStyle: React.CSSProperties = isCompleted
    ? {
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--exito)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }
    : isCurrent
    ? {
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '2px solid var(--primario)',
        background: 'var(--primario-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        animation: 'lf-step-pulse 2s ease-in-out infinite',
      }
    : {
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '2px solid var(--border)',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      };

  const iconColor = isCompleted ? '#fff' : isCurrent ? 'var(--primario)' : 'var(--text-muted)';

  /* Connector line: 2px width, 24px min-height */
  const lineStyle: React.CSSProperties = {
    width: 2,
    minHeight: 24,
    flex: 1,
    background: isCompleted ? 'var(--primario)' : 'var(--border)',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        position: 'relative',
      }}
    >
      {/* Left: dot + connector */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 28,
          flexShrink: 0,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${step.id}-${step.status}`}
            initial={isCompleted ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={dotStyle}
          >
            <IconComponent size={14} style={{ color: iconColor }} />
          </motion.div>
        </AnimatePresence>
        {!isLast && <div style={lineStyle} />}
      </div>

      {/* Right: text + timestamp */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flex: 1,
          paddingTop: 4,
          paddingBottom: isLast ? 0 : 8,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
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
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

type SheetSnap = 'minimized' | 'medium' | 'full';

export default function ClientTracking({ isDark, onBack, onOpenChat, onRate }: ClientTrackingProps) {
  const {
    trackingOrderId,
    trackingSteps,
    trackingETA,
    orders,
    advanceTrackingStep,
    updateTrackingETA,
  } = useStore();

  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('medium');
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [isExpandedMap, setIsExpandedMap] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const etaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [driverEstado, setDriverEstado] = useState<string>('DESCONECTADO');
  const [rutaCoords, setRutaCoords] = useState<[number, number][] | undefined>(undefined);
  const lastNotifiedEstadoRef = useRef<string>('');

  const notificarCambioEstado = useCallback((nuevoEstado: string) => {
    if (!nuevoEstado || lastNotifiedEstadoRef.current === nuevoEstado) return;
    const prev = lastNotifiedEstadoRef.current;
    lastNotifiedEstadoRef.current = nuevoEstado;

    if (!prev) return;

    let titulo = '';
    let cuerpo = '';
    let tipo: 'orden' | 'exito' = 'orden';

    if (nuevoEstado === 'EN_CAMINO_RECOGER') {
      titulo = 'Repartidor en camino';
      cuerpo = 'El repartidor se dirige al punto de recogida.';
    } else if (nuevoEstado === 'RECOGIDO') {
      titulo = 'Pedido recolectado';
      cuerpo = 'Tu paquete va en camino hacia tu dirección de entrega.';
    } else if (nuevoEstado === 'EN_CAMINO_ENTREGAR') {
      titulo = 'Repartidor cerca';
      cuerpo = 'Tu repartidor se encuentra a pocos minutos de tu ubicación.';
    } else if (nuevoEstado === 'ENTREGADO') {
      titulo = '¡Pedido entregado con éxito!';
      cuerpo = 'Tu orden ha sido completada. ¡Gracias por usar LogiFast!';
      tipo = 'exito';
    }

    if (titulo) {
      dispararNotificacionNativa({
        titulo,
        cuerpo,
        canalId: 'logifast_urgente',
        tipoAlerta: tipo,
        extra: { ordenId: trackingOrderId },
      }).catch(() => null);
    }
  }, [trackingOrderId]);

  // Sync client to order's tracking room & receive live driver positioning
  useEffect(() => {
    if (!trackingOrderId) return;
    inicializarNotificacionesNativas().catch(() => null);
    realtime.clienteTrackingUnirse(trackingOrderId);

    // Fetch tracking details directly from API
    const fetchTracking = () => {
      fetch(`/api/ordenes/${trackingOrderId}/tracking`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (data?.orden) {
            setBackendTracking(data);
            if (data.repartidorPos && data.repartidorPos.lat && data.repartidorPos.lng) {
              setDriverPos([data.repartidorPos.lat, data.repartidorPos.lng]);
            }
            if (data.driverEstado) {
              setDriverEstado(data.driverEstado);
              notificarCambioEstado(data.driverEstado);
            } else if (data.orden.estado) {
              const mapped = data.orden.estado === 'recogido'
                ? 'RECOGIDO'
                : (data.orden.estado === 'en_camino' || data.orden.estado === 'encamino' || data.orden.estado === 'aceptado')
                  ? 'EN_CAMINO_RECOGER'
                  : data.orden.estado === 'entregado'
                    ? 'ENTREGADO'
                    : 'ORDEN_ASIGNADA';
              setDriverEstado(mapped);
              notificarCambioEstado(mapped);
            }
          }
        })
        .catch(() => null);
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 3000);

    const cleanupPos = onRealtimeEvent('repartidor:posicion:update', (data) => {
      if (data?.lat && data?.lng) {
        setDriverPos([data.lat, data.lng]);
      }
      if (data?.estado) {
        setDriverEstado(data.estado);
      }
    });

    const cleanupEstado = onRealtimeEvent('repartidor:estado:update', (data) => {
      if (data?.estado) {
        setDriverEstado(data.estado);
        notificarCambioEstado(data.estado);
      }
      fetchTracking();
    });

    const cleanupOrdenUpdate = onRealtimeEvent('orden:estado:update', () => {
      fetchTracking();
    });

    return () => {
      clearInterval(interval);
      cleanupPos();
      cleanupEstado();
      cleanupOrdenUpdate();
    };
  }, [trackingOrderId]);

  const { ordenesCompra } = useMarketplaceStore();

  const currentOrdenCompra = useMemo(() => {
    if (!trackingOrderId) return null;
    return ordenesCompra.find((oc) => oc.id === trackingOrderId) ?? null;
  }, [trackingOrderId, ordenesCompra]);

  // Find current order (from orders, ordenesCompra, or backendTracking)
  const order: Order | null = useMemo(() => {
    if (!trackingOrderId) return null;
    const foundEnvio = orders.find((o) => o.id === trackingOrderId);
    if (foundEnvio) {
      const liveRepartidor = backendTracking?.repartidor?.nombre ?? foundEnvio.repartidor;
      const liveRepartidorTelefono = backendTracking?.repartidor?.telefono ?? (foundEnvio as any).repartidorTelefono;
      const liveRepartidorInitials = backendTracking?.repartidor?.initials ?? (backendTracking?.repartidor?.nombre ? backendTracking.repartidor.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : foundEnvio.repartidorInitials);
      const livePin = backendTracking?.orden?.codigoPin || (foundEnvio as any).codigoPin;
      const liveEstado = backendTracking?.orden?.estado || foundEnvio.estado;

      let oLat = (backendTracking?.orden?.origenLat && backendTracking.orden.origenLat !== 0) ? backendTracking.orden.origenLat : foundEnvio.origenLat;
      let oLng = (backendTracking?.orden?.origenLng && backendTracking.orden.origenLng !== 0) ? backendTracking.orden.origenLng : foundEnvio.origenLng;
      let dLat = (backendTracking?.orden?.destinoLat && backendTracking.orden.destinoLat !== 0) ? backendTracking.orden.destinoLat : foundEnvio.destinoLat;
      let dLng = (backendTracking?.orden?.destinoLng && backendTracking.orden.destinoLng !== 0) ? backendTracking.orden.destinoLng : foundEnvio.destinoLng;

      if ((!oLat || oLat === 0) && foundEnvio.origen) {
        const [gcLat, gcLng] = geocodeAddress(foundEnvio.origen);
        oLat = gcLat;
        oLng = gcLng;
      }
      if ((!dLat || dLat === 0) && foundEnvio.destino) {
        const [gcLat, gcLng] = geocodeAddress(foundEnvio.destino);
        dLat = gcLat;
        dLng = gcLng;
      }

      return {
        ...foundEnvio,
        origenLat: oLat,
        origenLng: oLng,
        destinoLat: dLat,
        destinoLng: dLng,
        tamano: (backendTracking?.orden as any)?.tamano || (foundEnvio as any).tamano || 'Estándar',
        fragil: (backendTracking?.orden as any)?.fragil ?? (foundEnvio as any).fragil ?? false,
        kmEstimados: backendTracking?.orden?.kmEstimados || (foundEnvio as any).kmEstimados,
        tiempoEstimado: backendTracking?.orden?.tiempoEstimado || (foundEnvio as any).tiempoEstimado,
        estado: liveEstado === 'entregado' ? 'entregado' : liveEstado === 'aceptado' || liveEstado === 'en_camino' || liveEstado === 'recogido' ? 'encamino' : foundEnvio.estado,
        repartidor: liveRepartidor,
        repartidorTelefono: liveRepartidorTelefono,
        repartidorInitials: liveRepartidorInitials,
        codigoPin: livePin,
      };
    }

    if (currentOrdenCompra) {
      const pinCode = backendTracking?.orden?.codigoPin || (currentOrdenCompra as any).codigoPin || '';
      let oLat = (currentOrdenCompra as any).origenLat || backendTracking?.orden?.origenLat;
      let oLng = (currentOrdenCompra as any).origenLng || backendTracking?.orden?.origenLng;
      let dLat = (currentOrdenCompra as any).destinoLat || backendTracking?.orden?.destinoLat;
      let dLng = (currentOrdenCompra as any).destinoLng || backendTracking?.orden?.destinoLng;

      const origenText = currentOrdenCompra.tiendaNombre || backendTracking?.orden?.origen || 'Tienda';
      const destinoText = currentOrdenCompra.direccionEntrega || backendTracking?.orden?.destino || '';

      if ((!oLat || oLat === 0) && origenText) {
        const [gcLat, gcLng] = geocodeAddress(origenText);
        oLat = gcLat;
        oLng = gcLng;
      }
      if ((!dLat || dLat === 0) && destinoText) {
        const [gcLat, gcLng] = geocodeAddress(destinoText);
        dLat = gcLat;
        dLng = gcLng;
      }

      const kmReal = backendTracking?.orden?.kmEstimados || (currentOrdenCompra as any).kmEstimados || 0;
      const tiempoReal = backendTracking?.orden?.tiempoEstimado || (currentOrdenCompra as any).tiempoEstimado || (kmReal > 0 ? Math.round(kmReal * 4 + 10) : 15);

      return {
        id: currentOrdenCompra.id,
        tipo: 'compra',
        origen: origenText,
        destino: destinoText,
        origenLat: oLat,
        origenLng: oLng,
        destinoLat: dLat,
        destinoLng: dLng,
        estado: currentOrdenCompra.estado === 'entregado' ? 'entregado' : 'encamino',
        monto: currentOrdenCompra.total,
        subtotal: (currentOrdenCompra as any).subtotal || backendTracking?.orden?.subtotal || currentOrdenCompra.total,
        costoEnvio: (currentOrdenCompra as any).costoEnvio || backendTracking?.orden?.costoEnvio || 0,
        descuento: (currentOrdenCompra as any).descuento || backendTracking?.orden?.descuento || 0,
        codigoPromo: (currentOrdenCompra as any).codigoUsado || backendTracking?.orden?.codigoUsado || '',
        ganancia: currentOrdenCompra.total * 0.2,
        kmEstimados: kmReal,
        tiempoEstimado: tiempoReal,
        cliente: (currentOrdenCompra as any).clienteNombre || backendTracking?.cliente?.nombre || 'Cliente',
        clienteTelefono: (currentOrdenCompra as any).clienteTelefono || backendTracking?.cliente?.telefono || '',
        descripcion: (currentOrdenCompra as any).instrucciones || ('Compra en ' + origenText),
        tamano: `${(currentOrdenCompra as any).items?.length || 1} producto(s)`,
        fragil: false,
        estadoPago: 'pagado',
        fecha: currentOrdenCompra.fecha,
        hora: currentOrdenCompra.hora || '12:00',
        timeline: [],
        repartidor: backendTracking?.repartidor?.nombre || currentOrdenCompra.repartidorNombre,
        repartidorTelefono: backendTracking?.repartidor?.telefono || (currentOrdenCompra as any).repartidorTelefono || '',
        repartidorInitials: backendTracking?.repartidor?.initials || (backendTracking?.repartidor?.nombre ? backendTracking.repartidor.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : currentOrdenCompra.repartidorInitials || 'RP'),
        metodoPago: currentOrdenCompra.metodoPago,
        codigoPin: pinCode,
        createdAt: currentOrdenCompra.fecha,
        items: (currentOrdenCompra as any).items || backendTracking?.orden?.items || [],
      };
    }

    if (backendTracking?.orden) {
      const bo = backendTracking.orden;
      let oLat = bo.origenLat;
      let oLng = bo.origenLng;
      let dLat = bo.destinoLat;
      let dLng = bo.destinoLng;
      if ((!oLat || oLat === 0) && bo.origen) {
        const [gcLat, gcLng] = geocodeAddress(bo.origen);
        oLat = gcLat;
        oLng = gcLng;
      }
      if ((!dLat || dLat === 0) && bo.destino) {
        const [gcLat, gcLng] = geocodeAddress(bo.destino);
        dLat = gcLat;
        dLng = gcLng;
      }
      const kmReal = bo.kmEstimados || 0;
      const tiempoReal = bo.tiempoEstimado || (kmReal > 0 ? Math.round(kmReal * 4 + 10) : 15);

      return {
        id: bo.id,
        tipo: backendTracking.tipo || 'compra',
        origen: bo.origen || 'Tienda Partner',
        destino: bo.destino || 'Dirección de Entrega',
        origenLat: oLat,
        origenLng: oLng,
        destinoLat: dLat,
        destinoLng: dLng,
        estado: bo.estado === 'entregado' ? 'entregado' : 'encamino',
        monto: bo.monto || bo.total || 0,
        subtotal: bo.subtotal || bo.total || 0,
        costoEnvio: bo.costoEnvio || 0,
        descuento: bo.descuento || 0,
        codigoPromo: bo.codigoUsado || '',
        ganancia: (bo.total || 0) * 0.2,
        kmEstimados: kmReal,
        tiempoEstimado: tiempoReal,
        cliente: backendTracking.cliente?.nombre || (bo as any).clienteNombre || 'Cliente',
        clienteTelefono: backendTracking.cliente?.telefono || (bo as any).clienteTelefono || '',
        descripcion: (bo as any).paquete || (bo as any).instrucciones || ('Pedido LogiFast #' + bo.id.slice(-5)),
        tamano: (bo as any).tamano || 'Estándar',
        fragil: (bo as any).fragil ?? false,
        estadoPago: 'pagado',
        fecha: bo.createdAt ? new Date(bo.createdAt).toLocaleDateString('es-NI') : 'Hoy',
        hora: bo.createdAt ? new Date(bo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00',
        timeline: [],
        repartidor: backendTracking.repartidor?.nombre || null,
        repartidorTelefono: backendTracking.repartidor?.telefono || '',
        repartidorInitials: backendTracking.repartidor?.initials || (backendTracking.repartidor?.nombre ? backendTracking.repartidor.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'RP'),
        metodoPago: bo.metodoPago || 'efectivo',
        codigoPin: bo.codigoPin || '',
        createdAt: bo.createdAt,
        items: bo.items || [],
      };
    }

    return null;
  }, [trackingOrderId, orders, currentOrdenCompra, backendTracking]);

  const orderPin = useMemo(() => {
    if (backendTracking?.orden?.codigoPin) return backendTracking.orden.codigoPin;
    if ((order as any)?.codigoPin) return (order as any).codigoPin;
    if ((currentOrdenCompra as any)?.codigoPin) return (currentOrdenCompra as any).codigoPin;
    return '';
  }, [order, backendTracking, currentOrdenCompra]);

  // Get repartidor info with real phone and backend metrics (null if not assigned yet)
  const repartidor = order
    ? getRepartidorInfo(order.repartidor, order.repartidorInitials, {
        telefono: backendTracking?.repartidor?.telefono || (order as any).repartidorTelefono || '',
        calificacion: backendTracking?.repartidor?.calificacion || 5.0,
        totalEntregas: backendTracking?.repartidor?.totalEntregas || 0,
        fotoUrl: backendTracking?.repartidor?.fotoUrl || null,
      })
    : null;

  // Fetch OSRM route dynamically: Driver to Destination (or to Pickup if not yet picked up)
  useEffect(() => {
    if (!order) return;
    const origLat = (order.origenLat && order.origenLat !== 0) ? order.origenLat : null;
    const origLng = (order.origenLng && order.origenLng !== 0) ? order.origenLng : null;
    const destLat = (order.destinoLat && order.destinoLat !== 0) ? order.destinoLat : null;
    const destLng = (order.destinoLng && order.destinoLng !== 0) ? order.destinoLng : null;

    if (!destLat || !destLng) return;

    const dest = { lat: destLat, lng: destLng };
    const orig = (origLat && origLng) ? { lat: origLat, lng: origLng } : dest;

    const isRecogido =
      order.estado === 'recogido' ||
      driverEstado === 'RECOGIDO' ||
      driverEstado === 'EN_CAMINO_ENTREGAR' ||
      driverEstado === 'EN_PUNTO_ENTREGA';

    const hasDriverGps = Boolean(driverPos && driverPos[0] !== 0 && driverPos[1] !== 0);

    // Punto de inicio: posición en tiempo real del repartidor (o el origen si aún no se conoce)
    const startPoint = hasDriverGps
      ? { lat: driverPos![0], lng: driverPos![1] }
      : orig;

    // Punto destino: hacia la casa del cliente (dest) si ya recogió, o hacia el origen (orig) si aún recolecta
    const targetPoint = isRecogido ? dest : (hasDriverGps ? orig : dest);

    if (startPoint.lat && startPoint.lng && targetPoint.lat && targetPoint.lng) {
      // Trazar línea directa inmediata como fallback instantáneo para que jamás esté vacío
      setRutaCoords(rutaLineaRecta(startPoint, targetPoint));

      obtenerRuta(startPoint, targetPoint)
        .then((res) => {
          if (res.exito && res.coordenadas && res.coordenadas.length > 1) {
            setRutaCoords(res.coordenadas);
          }
        })
        .catch(() => {
          setRutaCoords(rutaLineaRecta(startPoint, targetPoint));
        });
    }
  }, [
    order?.id,
    order?.estado,
    order?.origenLat,
    order?.origenLng,
    order?.destinoLat,
    order?.destinoLng,
    driverPos?.[0],
    driverPos?.[1],
    driverEstado,
  ]);

  // Current step index
  const currentStepIdx = trackingSteps.findIndex((s) => s.status === 'current');
  const completedCount = trackingSteps.filter((s) => s.status === 'completed').length;
  const allCompleted = trackingSteps.every((s) => s.status === 'completed');
  const progressPct = allCompleted ? 100 : Math.round((completedCount / trackingSteps.length) * 100);

  // Map driver status to client step index
  const mapDriverEstadoToStepIndex = useCallback((estado: string): number => {
    switch (estado) {
      case 'DESCONECTADO':
      case 'EN_LINEA':
        return 0;
      case 'ORDEN_ASIGNADA':
        return 1;
      case 'EN_CAMINO_RECOGER':
        return 2;
      case 'EN_PUNTO_RECOGIDA':
        return 3;
      case 'RECOGIDO':
        return 5; // Heading to destination
      case 'EN_PUNTO_ENTREGA':
        return 6; // Arrived at delivery
      default:
        return -1;
    }
  }, []);

  // Update client timeline based on driver's live state
  useEffect(() => {
    if (driverPos === null) return;
    
    const targetIdx = mapDriverEstadoToStepIndex(driverEstado);
    if (targetIdx >= 0) {
      const steps = [...trackingSteps];
      const now = new Date();
      const fmt = () => now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      
      for (let i = 0; i < steps.length; i++) {
        if (i < targetIdx) {
          steps[i] = { ...steps[i], status: 'completed' as const, timestamp: steps[i].timestamp || fmt() };
        } else if (i === targetIdx) {
          steps[i] = { ...steps[i], status: 'current' as const, timestamp: steps[i].timestamp || fmt() };
        } else {
          steps[i] = { ...steps[i], status: 'pending' as const, timestamp: '—' };
        }
      }
      useStore.setState({ trackingSteps: steps });
    }
  }, [driverPos, driverEstado, mapDriverEstadoToStepIndex]);

  // Handle final delivered state from DB status
  useEffect(() => {
    if (order?.estado === 'entregado') {
      const steps = trackingSteps.map((s) => ({ ...s, status: 'completed' as const }));
      useStore.setState({ trackingSteps: steps, trackingETA: 0 });
    }
  }, [order?.estado]);

  // Copy tracking link
  const handleShare = useCallback(() => {
    haptic('light');
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

  // Sheet height mapping
  const sheetHeights: Record<SheetSnap, string> = {
    minimized: '120px',
    medium: '50vh',
    full: '92vh',
  };

  const cycleSheet = () => {
    haptic('light');
    setSheetSnap((prev) => {
      if (prev === 'minimized') return 'medium';
      if (prev === 'medium') return 'full';
      return 'minimized';
    });
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
          Entregado!
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
            onClick={() => { haptic('medium'); onRate(order.id); }}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 'var(--lf-button-radius)',
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
            onClick={() => { haptic('light'); onBack(); }}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 'var(--lf-button-radius)',
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

  /* ─── MAIN TRACKING LAYOUT — A.5 Immersive ─── */
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
        position: 'relative',
      }}
      className="md:!flex-row"
    >
      {/* ═══════ MAP AREA — Fullscreen Subpage View ═══════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: isExpandedMap ? '100vh' : '65vh',
          flexShrink: 0,
          transition: 'height 0.3s ease',
          zIndex: isExpandedMap ? 100 : 1,
        }}
        className="md:!h-full md:!w-[60%]"
      >
        <RepartidorMap
          repartidorPos={driverPos && driverPos[0] !== 0 && driverPos[1] !== 0 ? driverPos : undefined}
          origenPos={order && order.origenLat && order.origenLng ? [order.origenLat, order.origenLng] : undefined}
          destinoPos={order && order.destinoLat && order.destinoLng ? [order.destinoLat, order.destinoLng] : undefined}
          rutaCoordenadas={rutaCoords}
          estado={driverEstado !== 'DESCONECTADO' ? driverEstado : (order?.estado === 'recogido' ? 'RECOGIDO' : 'EN_CAMINO_RECOGER')}
          altura="100%"
          seguirRepartidor={false}
          mostrarNavegacionDriver={false}
        />

        {/* ─── Top Left: Back Button ─── */}
        <button
          onClick={() => { haptic('light'); onBack(); }}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            height: 40,
            padding: '0 14px',
            borderRadius: 999,
            background: 'var(--lf-glass-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--lf-glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 30,
            fontSize: 13,
            fontWeight: 700,
            color: isDark ? '#fff' : 'var(--text)',
          }}
          aria-label="Volver atrás"
        >
          <ArrowLeft size={16} /> Volver
        </button>

        {/* ─── Top Right: Quick Actions Floating Panel ─── */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 30,
          }}
        >
          {/* Botón EXPANDIR MAPA */}
          <button
            onClick={() => { haptic('light'); setIsExpandedMap(!isExpandedMap); }}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              background: 'var(--lf-glass-bg)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--lf-glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: isDark ? '#fff' : '#111827',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            <Navigation size={14} color="var(--primario)" />
            {isExpandedMap ? 'Minimizar Mapa' : 'Expandir Mapa'}
          </button>

          {/* Botón MENSAJE DIRECTO */}
          {order && (
            <button
              onClick={() => { haptic('medium'); onOpenChat(order.id); }}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--primario)',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,102,255,0.4)',
              }}
              title="Enviar Mensaje"
            >
              <MessageCircle size={18} />
            </button>
          )}

          {/* Botón LLAMAR AL REPARTIDOR (solo cuando hay repartidor asignado) */}
          {repartidor && (
            <button
              onClick={() => {
                haptic('medium');
                window.open(`tel:${repartidor.telefono}`);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#16A34A',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(22,163,74,0.4)',
              }}
              title="Llamar al Repartidor"
            >
              <Phone size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ═══════ BOTTOM SHEET — 45% of screen ═══════ */}
      <motion.div
        animate={{ height: sheetHeights[sheetSnap] }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTopLeftRadius: 'var(--lf-sheet-radius)',
          borderTopRightRadius: 'var(--lf-sheet-radius)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          overflow: 'hidden',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
        }}
        className="md:!relative md:!bottom-auto md:!left-auto md:!right-auto md:!h-full md:!w-[40%] md:!rounded-none md:!border-l md:!border-[var(--border)] md:!shadow-none"
      >
        {/* Handle bar: 40px x 5px, var(--border), border-radius 3px, centered */}
        <button
          onClick={cycleSheet}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 10,
            paddingBottom: 8,
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
          aria-label="Cambiar tamano del panel"
        >
          <div
            style={{
              width: 40,
              height: 5,
              borderRadius: 3,
              background: 'var(--border)',
            }}
          />
        </button>

        {/* Scrollable content — only when not minimized */}
        <div
          style={{
            flex: 1,
            overflowY: sheetSnap === 'minimized' ? 'hidden' : 'auto',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 32,
          }}
          className="lf-scrollbar"
        >
          {/* ═══════ ETA — always visible ═══════ */}
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
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

            {/* Progress bar: height 4px, gradient var(--primario) */}
            <div
              style={{
                width: '100%',
                height: 4,
                borderRadius: 2,
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
                  borderRadius: 2,
                  background: `linear-gradient(90deg, var(--primario), var(--primario-hover))`,
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--text-muted)',
                margin: '4px 0 0 0',
              }}
            >
              {progressPct}% completado
            </p>
          </div>

          {/* PIN DE ENTREGA BANNER */}
          {orderPin && (
            <div
              style={{
                margin: '14px 0',
                padding: '12px 16px',
                borderRadius: 14,
                background: 'rgba(52,199,89,0.12)',
                border: '1.5px solid rgba(52,199,89,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                  Código PIN de entrega
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                  Entrégalo al repartidor al recibir
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#34C759', letterSpacing: 3 }}>
                {orderPin}
              </div>
            </div>
          )}

          {/* ─── Order ID + Status (when medium/full) ─── */}
          {sheetSnap !== 'minimized' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
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
                className={`lf-badge lf-badge-${(order?.estado ?? '').replace('encamino', 'en-camino')}`}
              >
                {badge.label}
              </span>
            </div>
          )}

          {/* ═══════ 8-STEP TIMELINE ═══════ */}
          {sheetSnap !== 'minimized' && (
            <div style={{ marginBottom: 24 }}>
              {trackingSteps.map((step, i) => (
                <TimelineStep
                  key={step.id}
                  step={step}
                  index={i}
                  isLast={i === trackingSteps.length - 1}
                  isDark={isDark}
                />
              ))}
            </div>
          )}

          {/* ═══════ BUSCANDO REPARTIDOR (PENDIENTE DE ASIGNACIÓN) ═══════ */}
          {sheetSnap !== 'minimized' && !repartidor && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'var(--surface)',
                border: '1px dashed var(--primario)',
                borderRadius: 18,
                padding: '20px 16px',
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(0, 102, 255, 0.12)',
                  color: 'var(--primario)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  position: 'relative',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    border: '2px solid var(--primario)',
                  }}
                />
                <Bike size={24} />
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 4,
                }}
              >
                Buscando repartidor cercano...
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}
              >
                Tu pedido fue publicado a la red. Te notificaremos en cuanto un repartidor acepte la asignación.
              </div>
            </motion.div>
          )}

          {/* ═══════ PIN DE CONFIRMACIÓN DE ENTREGA ═══════ */}
          {sheetSnap !== 'minimized' && order && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.12), rgba(0, 102, 255, 0.08))',
                border: '1px solid var(--primario)',
                borderRadius: 18,
                padding: '14px 18px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primario)', letterSpacing: 0.5 }}>
                  PIN de Confirmación de Entrega
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Dáselo a tu repartidor al recibir el paquete.
                </div>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '6px 14px',
                letterSpacing: 4,
              }}>
                {orderPin}
              </div>
            </motion.div>
          )}

          {/* ═══════ REPARTIDOR INFO CARD (SI YA FUE ASIGNADO) ═══════ */}
          {sheetSnap !== 'minimized' && repartidor && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {/* Avatar 52x52 */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: repartidor.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 20,
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
                  {/* Rating with Star icons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    <Star size={14} fill="var(--warning)" stroke="var(--warning)" strokeWidth={0} />
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
                </div>
              </div>

              {/* Action pills — 3 in a row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`tel:${repartidor.telefono}`}
                  onClick={() => haptic('light')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 0',
                    borderRadius: 'var(--lf-pill-radius)',
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
                  onClick={() => { haptic('light'); if (order) onOpenChat(order.id); }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 0',
                    borderRadius: 'var(--lf-pill-radius)',
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
                    borderRadius: 'var(--lf-pill-radius)',
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
                  {copied ? 'Copiado!' : 'Compartir'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════ DETALLES (expandible) ═══════ */}
          {sheetSnap !== 'minimized' && order && (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => { haptic('light'); setDetailsExpanded((v) => !v); }}
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
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: 'var(--text-muted)',
                  }}
                >
                  Ver detalles
                </span>
                {detailsExpanded ? (
                  <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
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
                        { label: 'Descripción', value: order.descripcion || (order.tipo === 'compra' ? 'Pedido en tienda' : 'Paquete estándar') },
                        { label: 'Detalles / Tamaño', value: (order as any).tamano || (order.tipo === 'compra' ? `${(order as any).items?.length || 1} producto(s)` : 'Estándar') },
                        { label: 'Frágil', value: (order as any).fragil ? 'Sí, manipular con cuidado' : 'No' },
                        { label: 'Instrucciones', value: (order as any).instrucciones || (order as any).notas || 'Entregar en dirección indicada' },
                        {
                          label: 'Pago',
                          value: `${order.metodoPago === 'efectivo' ? 'Efectivo contra entrega' : 'Transferencia / Digital'} — C$${order.monto}`,
                        },
                        { label: 'Código promo', value: (order as any).codigoPromo ? `${(order as any).codigoPromo} (-C$${(order as any).descuento || 0})` : '—' },
                        ...(orderPin ? [{ label: 'PIN de Entrega', value: `${orderPin} (Mostrar al repartidor)` }] : []),
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

          {/* ─── Action buttons ─── */}
          {sheetSnap !== 'minimized' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => haptic('medium')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '12px 0',
                  borderRadius: 'var(--lf-button-radius)',
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
                  onClick={() => haptic('heavy')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '12px 0',
                    borderRadius: 'var(--lf-button-radius)',
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
                  <ChevronDown size={15} />
                  Cancelar envio
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step pulse animation keyframes */}
        <style>{`
          @keyframes lf-step-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,87,34,0.3); }
            50% { box-shadow: 0 0 0 8px rgba(255,87,34,0); }
          }
        `}</style>
      </motion.div>
    </div>
  );
}
