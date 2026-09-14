// components/ui/LiveOrderProgressBar.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Bike, MapPin, CheckCircle, Navigation, ChevronRight, X } from 'lucide-react';

export interface LiveOrderProgressBarProps {
  ordenId: string;
  estado: string; // 'buscando' | 'en_camino' | 'recogido' | 'cerca' | 'entregado' | string
  origen: string;
  destino: string;
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
  // Mapear estado a progreso porcentual y etiqueta
  const { progreso, etapa, color, icono: IconoEtapa, descripcion } = React.useMemo(() => {
    const est = (estado || '').toLowerCase();
    if (est.includes('entregad') || est === 'completado') {
      return {
        progreso: 100,
        etapa: 'Entregado',
        color: '#10B981',
        icono: CheckCircle,
        descripcion: '¡Tu pedido ha sido entregado!',
      };
    }
    if (est.includes('cerca') || est.includes('llegando') || est === 'en_camino_entregar') {
      return {
        progreso: 88,
        etapa: 'Repartidor cerca',
        color: '#007AFF',
        icono: Bike,
        descripcion: repartidorNombre ? `${repartidorNombre} está a pocas cuadras` : 'A menos de 500 metros',
      };
    }
    if (est.includes('recogid') || est.includes('transito') || est === 'recogido') {
      return {
        progreso: 65,
        etapa: 'En ruta a entrega',
        color: '#FF5722',
        icono: Navigation,
        descripcion: 'Paquete en tránsito hacia tu dirección',
      };
    }
    if (est.includes('camino') || est.includes('aceptad') || est === 'en_camino_recoger') {
      return {
        progreso: 38,
        etapa: 'En camino a recogida',
        color: '#F59E0B',
        icono: Bike,
        descripcion: repartidorNombre ? `${repartidorNombre} va hacia el punto` : 'Repartidor asignado',
      };
    }
    // Buscando / Pendiente
    return {
      progreso: 18,
      etapa: 'Asignando repartidor',
      color: '#8B5CF6',
      icono: Package,
      descripcion: 'Buscando el repartidor más cercano...',
    };
  }, [estado, repartidorNombre]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        style={{
          position: 'fixed',
          bottom: 'calc(76px + env(safe-area-inset-bottom, 16px))',
          left: 16,
          right: 16,
          maxWidth: 480,
          margin: '0 auto',
          zIndex: 990,
          pointerEvents: 'auto',
        }}
      >
        <div
          onClick={() => onOpenTracking(ordenId)}
          style={{
            position: 'relative',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 20,
            padding: '14px 16px',
            boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.06)',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          {/* Barra de progreso superior integrada con gradiente fluido */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
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
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {/* Icono con pulso en vivo */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${color}20`,
                  border: `1px solid ${color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: color,
                }}
              >
                <IconoEtapa size={20} />
              </div>
              {progreso < 100 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 0 2px #0F172A',
                  }}
                />
              )}
            </div>

            {/* Contenido descriptivo */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: '-0.2px',
                  }}
                >
                  {etapa}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: color,
                    background: `${color}1A`,
                    padding: '1px 6px',
                    borderRadius: 6,
                  }}
                >
                  {progreso}%
                </span>
                {tiempoEstimadoMin > 0 && progreso < 100 && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>
                    ~{tiempoEstimadoMin} min
                  </span>
                )}
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {descripcion}
              </p>
            </div>

            {/* Botón de acción flecha */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'rgba(255, 255, 255, 0.4)',
                flexShrink: 0,
              }}
            >
              <ChevronRight size={18} />
              {onDismiss && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    color: 'rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
