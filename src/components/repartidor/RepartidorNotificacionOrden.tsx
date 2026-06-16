'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Package,
  ShoppingBag,
  Store,
  Navigation,
  Clock,
  DollarSign,
  Box,
  User,
  Check,
  X,
  Vibrate,
  Volume2,
} from 'lucide-react';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { useRepartidorSnackbar } from './RepartidorShell';

/* ═══════════════════════════════════════════════
   CIRCULAR COUNTDOWN
   ═══════════════════════════════════════════════ */

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = seconds / total;
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);

  return (
    <div
      style={{
        position: 'relative',
        width: 72,
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="5"
        />
        <motion.circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {seconds}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROUTE VISUALIZATION
   ═══════════════════════════════════════════════ */

function RouteVisualization({ origen, destino }: { origen: string; destino: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: 14,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.18)',
        marginBottom: 16,
      }}
    >
      {/* Pickup */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--exito, #00C853)',
              border: '2px solid #fff',
              boxShadow: '0 0 0 2px var(--exito, #00C853)',
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>
            Recogida
          </div>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {origen}
          </div>
        </div>
      </div>
      {/* Dashed connector */}
      <div style={{ display: 'flex', paddingLeft: 5, height: 18 }}>
        <div
          style={{
            width: 2,
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.5) 50%, transparent 50%)',
            backgroundSize: '2px 8px',
            backgroundRepeat: 'repeat-y',
          }}
        />
      </div>
      {/* Delivery */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--warning, #FFB300)',
              border: '2px solid #fff',
              boxShadow: '0 0 0 2px var(--warning, #FFB300)',
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>
            Entrega
          </div>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {destino}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DETAIL ROW
   ═══════════════════════════════════════════════ */

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.12)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <span
        className="font-mono"
        style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}
      >
        {value}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorNotificacionOrden() {
  const { ordenAsignadaPendiente, tiempoAceptacion, aceptarOrden, rechazarOrden, timeoutOrden } =
    useRepartidorStore();
  const showSnackbar = useRepartidorSnackbar();
  // Initialize local countdown from store value (store resets to 30 on each new assignment).
  const [segundos, setSegundos] = useState(tiempoAceptacion);

  /* Countdown */
  useEffect(() => {
    const i = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          clearInterval(i);
          timeoutOrden();
          showSnackbar({ message: 'La orden expiró por timeout.' });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [timeoutOrden, showSnackbar]);

  /* Vibrate on mount (new order) */
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {
        /* ignore */
      }
    }
  }, []);

  if (!ordenAsignadaPendiente) return null;
  const orden = ordenAsignadaPendiente;
  const TipoIcon = orden.tipo === 'compra' ? ShoppingBag : Package;

  const handleAceptar = () => {
    aceptarOrden();
    showSnackbar({ message: `Orden ${orden.id} aceptada. Dirígete al punto de recogida.` });
  };

  const handleRechazar = () => {
    rechazarOrden();
    showSnackbar({ message: 'Orden rechazada.' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="order-notification visible lf-order-notification visible"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: 'calc(env(safe-area-inset-top, 24px) + 16px) 20px calc(env(safe-area-inset-bottom, 24px) + 20px)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
        }}
      >
        {/* Top: Bell + "Nueva orden" + Countdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={20} />
            </motion.div>
            <div>
              <div
                className="font-syne"
                style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}
              >
                Nueva orden
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <Volume2 size={11} />
                <Vibrate size={11} />
                Sonido y vibración activados
              </div>
            </div>
          </div>
          <CountdownRing seconds={segundos} total={30} />
        </div>

        {/* Pulsing card */}
        <motion.div
          animate={{ scale: [1, 1.015, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="order-notification-card lf-order-notification-card"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 24,
            padding: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          }}
        >
          {/* Order ID + Tipo badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <span
              className="font-mono"
              style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}
            >
              {orden.id}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 100,
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'capitalize',
              }}
            >
              <TipoIcon size={12} />
              {orden.tipo}
            </span>
          </div>

          {/* Route visualization */}
          <RouteVisualization origen={orden.origen} destino={orden.destino} />

          {/* Order details */}
          <div style={{ marginBottom: 8 }}>
            <DetailRow
              icon={<Navigation size={14} />}
              label="Distancia"
              value={`${orden.kmEstimados.toFixed(1)} km`}
            />
            <DetailRow
              icon={<Clock size={14} />}
              label="Tiempo estimado"
              value={`${orden.tiempoEstimado} min`}
            />
            <DetailRow
              icon={<DollarSign size={14} />}
              label="Ganancia"
              value={`C$${orden.ganancia}`}
            />
            <DetailRow
              icon={<Box size={14} />}
              label="Tamaño paquete"
              value={orden.tamano || '—'}
            />
            <DetailRow
              icon={<User size={14} />}
              label="Cliente"
              value={orden.cliente}
            />
            {orden.tiendaNombre && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Store size={14} />
                </span>
                <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Tienda</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  {orden.tiendaNombre}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 20 }} />

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAceptar}
            style={{
              width: '100%',
              minHeight: 56,
              borderRadius: 16,
              border: 'none',
              background: '#FFFFFF',
              color: 'var(--primario)',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <Check size={20} />
            Aceptar orden
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleRechazar}
            style={{
              width: '100%',
              minHeight: 52,
              borderRadius: 16,
              border: '1.5px solid rgba(255,255,255,0.4)',
              background: 'transparent',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <X size={18} />
            Rechazar
          </motion.button>
        </div>

        <p
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          Si no respondes, la orden se reasignará automáticamente.
        </p>
      </div>
    </motion.div>
  );
}
