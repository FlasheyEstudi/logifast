'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Package,
  ShoppingBag,
  MapPin,
  Store,
  Navigation,
  Clock,
  DollarSign,
  Route as RouteIcon,
  User,
  Check,
  AlertTriangle,
  Box,
  Bike,
  Hand,
  Flag,
  Star,
  Bell,
} from 'lucide-react';
import { useRepartidorStore, type ServicioHistorial } from '@/lib/repartidor-store';
import { StarRating } from './RepartidorPerfil';

/* ═══════════════════════════════════════════════
   TIMELINE STEPS
   ═══════════════════════════════════════════════ */

interface Step {
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { label: 'Orden asignada', icon: <Bell size={14} /> },
  { label: 'Orden aceptada', icon: <Check size={14} /> },
  { label: 'Camino a recogida', icon: <Navigation size={14} /> },
  { label: 'Paquete recogido', icon: <Hand size={14} /> },
  { label: 'Camino a entrega', icon: <Bike size={14} /> },
  { label: 'En punto de entrega', icon: <MapPin size={14} /> },
  { label: 'Entrega confirmada', icon: <Flag size={14} /> },
  { label: 'Servicio calificado', icon: <Star size={14} /> },
];

/* ═══════════════════════════════════════════════
   STYLIZED MINI MAP
   ═══════════════════════════════════════════════ */

function MiniMap() {
  return (
    <div
      style={{
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, var(--md-surface-variant) 0%, var(--md-surface) 100%)',
        border: '1px solid var(--md-outline-variant)',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, var(--md-outline-variant) 1px, transparent 1px), linear-gradient(to bottom, var(--md-outline-variant) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.5,
        }}
      />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
        <motion.line
          x1="20%"
          y1="75%"
          x2="78%"
          y2="25%"
          stroke="var(--primario)"
          strokeWidth={3}
          strokeDasharray="6 5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      {/* Pickup */}
      <div style={{ position: 'absolute', left: '20%', top: '75%', transform: 'translate(-50%, -100%)' }}>
        <Store size={22} color="var(--exito, #00C853)" fill="var(--md-surface)" strokeWidth={2.4} />
      </div>
      {/* Delivery */}
      <div style={{ position: 'absolute', left: '78%', top: '25%', transform: 'translate(-50%, -100%)' }}>
        <MapPin size={24} color="var(--primario)" fill="var(--md-surface)" strokeWidth={2.4} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   INFO ROW
   ═══════════════════════════════════════════════ */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid var(--md-outline-variant)',
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'var(--md-surface-variant)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          textAlign: 'right',
          maxWidth: '60%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorDetalleServicio() {
  const { servicioDetalle, cerrarDetalle } = useRepartidorStore();

  if (!servicioDetalle) return null;
  const s: ServicioHistorial = servicioDetalle;
  const TipoIcon = s.tipo === 'compra' ? ShoppingBag : Package;
  const isEntregado = s.estado === 'entregado';

  // Steps completion: if entregado, all 8 done; if incidencia, only first 4 (up to "Paquete recogido")
  const completedCount = isEntregado ? 8 : 4;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9995,
        background: 'var(--bg)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding:
            'calc(env(safe-area-inset-top, 24px) + 16px) 16px calc(env(safe-area-inset-bottom, 24px) + 16px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <button
            onClick={cerrarDetalle}
            aria-label="Volver"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: 'none',
              background: 'var(--md-surface)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-elevation-1)',
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div
              className="font-syne"
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}
            >
              Detalle de servicio
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 12, color: 'var(--text-muted)' }}
            >
              {s.ordenId}
            </div>
          </div>
          <span
            className={`lf-badge ${isEntregado ? 'lf-badge-entregado' : 'lf-badge-incidencia'}`}
            style={{
              padding: '4px 10px',
              borderRadius: 100,
              background: isEntregado
                ? 'color-mix(in srgb, var(--exito, #00C853) 14%, transparent)'
                : 'color-mix(in srgb, var(--peligro, #FF1744) 14%, transparent)',
              color: isEntregado ? 'var(--exito, #00C853)' : 'var(--peligro, #FF1744)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {s.estado}
          </span>
        </div>

        {/* Mini map */}
        <div style={{ marginBottom: 12 }}>
          <MiniMap />
        </div>

        {/* Info card */}
        <div
          style={{
            padding: 16,
            borderRadius: 20,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline-variant)',
            marginBottom: 12,
          }}
        >
          {/* ID + Tipo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              paddingBottom: 12,
              borderBottom: '1px solid var(--md-outline-variant)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className={`lf-badge ${s.tipo === 'compra' ? 'lf-badge-en-camino' : 'lf-badge-preparando'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 100,
                  background:
                    s.tipo === 'compra'
                      ? 'var(--md-primary-container)'
                      : 'var(--md-secondary-container)',
                  color:
                    s.tipo === 'compra'
                      ? 'var(--md-on-primary-container)'
                      : 'var(--md-on-secondary-container)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                <TipoIcon size={11} />
                {s.tipo}
              </span>
            </div>
            <span
              className="font-mono"
              style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}
            >
              {s.id}
            </span>
          </div>

          <InfoRow icon={<User size={14} />} label="Cliente" value={s.cliente} />
          {s.tiendaNombre && (
            <InfoRow icon={<Store size={14} />} label="Tienda" value={s.tiendaNombre} />
          )}
          <InfoRow icon={<MapPin size={14} />} label="Origen" value={s.origen} />
          <InfoRow icon={<Flag size={14} />} label="Destino" value={s.destino} />
          <InfoRow icon={<Box size={14} />} label="Paquete" value={s.tipo === 'compra' ? 'Compra' : 'Envío'} />
          <InfoRow
            icon={<RouteIcon size={14} />}
            label="Km recorridos"
            value={`${s.kmRecorridos.toFixed(1)} km`}
          />
          <InfoRow
            icon={<DollarSign size={14} />}
            label="Ganancia"
            value={`C$${s.ganancia}`}
          />
          <InfoRow
            icon={<Clock size={14} />}
            label="Tiempo total"
            value={`${s.tiempoTotal} min`}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'var(--md-surface-variant)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={14} />
            </span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>Hora</span>
            <span
              className="font-mono"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
            >
              {s.hora}
            </span>
          </div>
        </div>

        {/* Incidencia info */}
        {s.estado === 'incidencia' && (
          <div
            style={{
              padding: 16,
              borderRadius: 20,
              background: 'color-mix(in srgb, var(--peligro, #FF1744) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--peligro, #FF1744) 25%, transparent)',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <AlertTriangle size={16} color="var(--peligro, #FF1744)" />
              <span
                className="font-syne"
                style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}
              >
                Incidencia reportada
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong style={{ color: 'var(--text)' }}>Tipo:</strong> {s.incidenciaTipo || '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              El servicio fue marcado como incidencia y notificado al administrador.
            </div>
          </div>
        )}

        {/* Rating */}
        {s.calificacion && (
          <div
            style={{
              padding: 16,
              borderRadius: 20,
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline-variant)',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontFamily: "'Syne', sans-serif",
                  lineHeight: 1,
                }}
              >
                {s.calificacion}.0
              </div>
              <div>
                <StarRating value={s.calificacion} size={18} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Calificación del cliente
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div
          style={{
            padding: 16,
            borderRadius: 20,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline-variant)',
            marginBottom: 12,
          }}
        >
          <div
            className="font-syne"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 12,
            }}
          >
            Línea de tiempo
          </div>
          <div>
            {STEPS.map((step, i) => {
              const isCompleted = i < completedCount;
              const isLast = i === STEPS.length - 1;
              const isCurrentIncidencia = !isEntregado && i === completedCount;
              return (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr',
                    gap: 10,
                    paddingBottom: isLast ? 0 : 14,
                    position: 'relative',
                  }}
                >
                  {/* Dot + connector */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: isCompleted
                          ? 'var(--exito, #00C853)'
                          : isCurrentIncidencia
                            ? 'var(--peligro, #FF1744)'
                            : 'var(--md-outline-variant)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      {isCompleted ? (
                        <Check size={12} />
                      ) : isCurrentIncidencia ? (
                        <AlertTriangle size={12} />
                      ) : (
                        step.icon
                      )}
                    </div>
                    {!isLast && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 22,
                          bottom: -14,
                          width: 2,
                          background: isCompleted
                            ? 'var(--exito, #00C853)'
                            : 'var(--md-outline-variant)',
                        }}
                      />
                    )}
                  </div>
                  {/* Label */}
                  <div
                    style={{
                      paddingTop: 2,
                      fontSize: 13,
                      fontWeight: isCompleted ? 600 : 500,
                      color: isCompleted ? 'var(--text)' : 'var(--text-muted)',
                    }}
                  >
                    {step.label}
                    {isCurrentIncidencia && (
                      <div style={{ fontSize: 11, color: 'var(--peligro, #FF1744)', marginTop: 2 }}>
                        Detenido por incidencia
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
