'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Star, Gift, ArrowUpRight, TrendingUp } from 'lucide-react';

interface ClientPuntosProps {
  isDark?: boolean;
  onClose?: () => void;
}

export default function ClientPuntos({ onClose }: ClientPuntosProps) {
  const puntos = 2450;
  const nivel = 'Oro';
  const nextNivel = 'Platino';
  const puntosNext = 3000;
  const progreso = (puntos / puntosNext) * 100;

  const MOVIMIENTOS = [
    { tipo: 'ganado', desc: 'Envío #1024 completado', puntos: 120, fecha: 'Hace 2h' },
    { tipo: 'ganado', desc: 'Reseña de tienda', puntos: 50, fecha: 'Ayer' },
    { tipo: 'canjeado', desc: 'Descuento 10% envío', puntos: -200, fecha: 'Hace 3 días' },
    { tipo: 'ganado', desc: 'Referir amigo', puntos: 300, fecha: 'Hace 5 días' },
    { tipo: 'ganado', desc: 'Envío #1018 completado', puntos: 80, fecha: 'Hace 1 semana' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'var(--md-surface)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        color: 'var(--md-on-surface)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--md-outline-variant)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-on-surface-variant)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18 }}>Mis Puntos</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {/* Points card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FF5722, #FF8A65)',
            borderRadius: 22,
            padding: 24,
            color: '#FFFFFF',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4 }}>Tus puntos</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, lineHeight: 1.1, marginBottom: 12 }}>
            {puntos.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Star size={16} style={{ fill: '#FFD740', color: '#FFD740' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Nivel {nivel}</span>
          </div>
          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${progreso}%`, height: '100%', background: '#FFFFFF', borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>
            {puntosNext - puntos} pts para {nextNivel}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              borderRadius: 16,
              border: 'none',
              background: 'var(--md-primary-container)',
              color: 'var(--md-on-primary-container)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Gift size={18} />
            Canjear
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              borderRadius: 16,
              border: 'none',
              background: 'var(--md-surface-variant)',
              color: 'var(--md-on-surface)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <TrendingUp size={18} />
            Historial
          </button>
        </div>

        {/* Recent activity */}
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
          Actividad reciente
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MOVIMIENTOS.map((mov, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'var(--md-surface-variant)',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: mov.tipo === 'ganado'
                    ? 'color-mix(in srgb, var(--md-success) 12%, transparent)'
                    : 'color-mix(in srgb, var(--md-warning) 12%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: mov.tipo === 'ganado' ? 'var(--md-success)' : 'var(--md-warning)',
                }}
              >
                <ArrowUpRight size={18} style={{ transform: mov.tipo === 'canjeado' ? 'rotate(90deg)' : 'none' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {mov.desc}
                </div>
                <div style={{ fontSize: 12, color: 'var(--md-on-surface-variant)', marginTop: 1 }}>{mov.fecha}</div>
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  fontWeight: 600,
                  color: mov.tipo === 'ganado' ? 'var(--md-success)' : 'var(--md-warning)',
                  flexShrink: 0,
                }}
              >
                {mov.puntos > 0 ? '+' : ''}{mov.puntos}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
