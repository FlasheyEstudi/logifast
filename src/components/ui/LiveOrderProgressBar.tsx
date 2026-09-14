// components/ui/LiveOrderProgressBar.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Bike, CheckCircle, Navigation, ChevronRight, X } from 'lucide-react';

export interface LiveOrderProgressBarProps {
  ordenId: string;
  estado: string; // 'buscando' | 'en_camino' | 'recogido' | 'cerca' | 'entregado' | string
  origen?: string;
  destino?: string;
  repartidorNombre?: string;
  tiempoEstimadoMin?: number;
  onOpenTracking: (ordenId: string) => void;
  onDismiss?: () => void;
}

export default function LiveOrderProgressBar({
  ordenId,
  estado,
  origen,
  destino,
  repartidorNombre,
  tiempoEstimadoMin = 12,
  onOpenTracking,
  onDismiss,
}: LiveOrderProgressBarProps) {
  // Mapear estado a progreso porcentual, etiqueta y feedback visual sutil
  const { progreso, etapa, color, icono: IconoEtapa, subtitulo } = React.useMemo(() => {
    const est = (estado || '').toLowerCase().trim();
    const hasRepartidor = Boolean(
      repartidorNombre &&
      typeof repartidorNombre === 'string' &&
      repartidorNombre !== 'Sin asignar' &&
      repartidorNombre !== 'Pendiente' &&
      repartidorNombre.trim() !== ''
    );

    // 1. Entregado con éxito
    if (est.includes('entregad') || est === 'completado') {
      return {
        progreso: 100,
        etapa: 'Entregado',
        color: '#10B981',
        icono: CheckCircle,
        subtitulo: '¡Completado con éxito!',
      };
    }

    // 2. Repartidor en la puerta (<50m o llegado)
    if (est.includes('puerta') || est.includes('llegad') || est.includes('punto_entrega') || est.includes('50m') || est.includes('cerca')) {
      return {
        progreso: 92,
        etapa: 'En tu puerta',
        color: '#34C759',
        icono: Bike,
        subtitulo: hasRepartidor ? `${repartidorNombre} llegó (<50m)` : 'Llegó a tu ubicación',
      };
    }

    // 3. En camino a entregar / en ruta / en tránsito
    if (est.includes('transito') || est.includes('recogid') || est.includes('camino_entregar') || est.includes('en_ruta')) {
      return {
        progreso: 75,
        etapa: 'En camino',
        color: '#FF5722',
        icono: Navigation,
        subtitulo: hasRepartidor ? `${repartidorNombre} va en ruta hacia ti` : 'Paquete en tránsito',
      };
    }

    // 4. En local / recolectando / listo
    if (est.includes('punto_recogida') || est.includes('en_tienda') || est.includes('recogiendo') || est.includes('listo')) {
      return {
        progreso: 55,
        etapa: 'Recolectando',
        color: '#007AFF',
        icono: Package,
        subtitulo: hasRepartidor ? `${repartidorNombre} en el local` : 'Recolectando paquete',
      };
    }

    // 5. Repartidor asignado o en camino hacia el punto (O si ya hay nombre de repartidor)
    if (
      est.includes('camino_recoger') ||
      est.includes('encamino') ||
      est.includes('en_camino') ||
      est.includes('aceptad') ||
      est.includes('asigna') ||
      hasRepartidor
    ) {
      return {
        progreso: 35,
        etapa: hasRepartidor ? 'Repartidor asignado' : 'Repartidor en camino',
        color: '#F59E0B',
        icono: Bike,
        subtitulo: hasRepartidor ? `${repartidorNombre} va hacia el punto` : 'En camino a recoger',
      };
    }

    // 6. Preparando orden (tienda / comercio)
    if (est.includes('preparando') || est.includes('recibido')) {
      return {
        progreso: 25,
        etapa: 'Preparando',
        color: '#8B5CF6',
        icono: Package,
        subtitulo: 'Comercio preparando orden',
      };
    }

    // 7. Buscando repartidor / Pendiente
    return {
      progreso: 15,
      etapa: 'Buscando repartidor',
      color: '#8B5CF6',
      icono: Package,
      subtitulo: 'Asignando repartidor cercano...',
    };
  }, [estado, repartidorNombre]);

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: -40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -40, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        style={{
          position: 'fixed',
          top: 'calc(58px + env(safe-area-inset-top, 6px))',
          left: 12,
          right: 12,
          maxWidth: 420,
          margin: '0 auto',
          zIndex: 9980,
          pointerEvents: 'auto',
        }}
        aria-label="Progreso en vivo de orden"
      >
        <div
          onClick={() => onOpenTracking(ordenId)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenTracking(ordenId);
            }
          }}
          style={{
            position: 'relative',
            background: 'rgba(15, 23, 42, 0.90)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 9999,
            height: 42,
            padding: '0 8px 0 12px',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.06)',
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          {/* Micro barra de progreso inferior de 2px */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progreso}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${color}, #00E5FF)`,
                borderRadius: '0 2px 2px 0',
                boxShadow: `0 0 6px ${color}`,
              }}
            />
          </div>

          {/* Lado Izquierdo: Icono vivo + Etapa y detalles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            {/* Dot pulsante con icono */}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: `${color}26`,
                border: `1px solid ${color}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <IconoEtapa size={14} />
              {progreso < 100 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -1,
                    right: -1,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 4px ${color}`,
                  }}
                />
              )}
            </div>

            {/* Texto en una sola línea sutil y elegante */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: "'Syne', sans-serif",
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.2px',
                }}
              >
                {etapa}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>•</span>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subtitulo}
              </span>
            </div>
          </div>

          {/* Lado Derecho: Chip porcentaje + Flecha + Botón cerrar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {tiempoEstimadoMin > 0 && progreso < 100 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '2px 5px',
                }}
              >
                ~{tiempoEstimadoMin}m
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: color,
                background: `${color}20`,
                padding: '1px 6px',
                borderRadius: 9999,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {progreso}%
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                paddingLeft: 2,
              }}
            >
              <ChevronRight size={14} />
            </div>

            {onDismiss && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                aria-label="Ocultar barra de seguimiento"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  marginLeft: 2,
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
