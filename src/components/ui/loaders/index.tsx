'use client';

import React from 'react';

/**
 * Spinner con logo LOGIFAST animado (moto estilizada).
 * Usa el primario #FF5722 y rotación suave.
 */
export function LogoSpinner({ size = 64 }: { size?: number }) {
  return (
    <div className="lf-logo-spinner" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Anillo exterior girando */}
        <circle
          cx="50" cy="50" r="44"
          stroke="url(#lf-spinner-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="60 220"
          fill="none"
          className="lf-spinner-ring"
        />
        {/* Moto estilizada en el centro */}
        <g className="lf-spinner-logo">
          <circle cx="32" cy="62" r="7" fill="#FF5722" />
          <circle cx="68" cy="62" r="7" fill="#FF5722" />
          <circle cx="32" cy="62" r="3" fill="#fff" />
          <circle cx="68" cy="62" r="3" fill="#fff" />
          <path
            d="M32 62 L42 48 L58 48 L68 62 L58 62 L52 54 L44 54 L40 62 Z"
            fill="#FF5722"
          />
          <path
            d="M48 48 L52 42 L56 48"
            stroke="#FF5722"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
        <defs>
          <linearGradient id="lf-spinner-grad" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#FF5722" />
            <stop offset="50%" stopColor="#FF8A65" />
            <stop offset="100%" stopColor="#FFB74D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Spinner simple con gradiente.
 */
export function GradientSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="lf-gradient-spinner" style={{ width: size, height: size }}>
      <svg viewBox="0 0 50 50">
        <circle
          cx="25" cy="25" r="20"
          stroke="rgba(255,87,34,0.15)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="25" cy="25" r="20"
          stroke="url(#lf-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="30 130"
          fill="none"
          className="lf-grad-ring"
        />
        <defs>
          <linearGradient id="lf-grad" x1="0" y1="0" x2="50" y2="50">
            <stop offset="0%" stopColor="#FF5722" />
            <stop offset="100%" stopColor="#FFB74D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Tres puntos pulsantes.
 */
export function PulseDots({ color = '#FF5722' }: { color?: string }) {
  return (
    <div className="lf-pulse-dots">
      <span style={{ background: color }} />
      <span style={{ background: color }} />
      <span style={{ background: color }} />
    </div>
  );
}

/**
 * Loader de moto en movimiento (ruedas girando + líneas de velocidad).
 */
export function MotoLoader({ size = 120 }: { size?: number }) {
  return (
    <div className="lf-moto-loader" style={{ width: size, height: size * 0.7 }}>
      <svg viewBox="0 0 120 80" fill="none">
        {/* Líneas de velocidad */}
        <g className="lf-speed-lines">
          <line x1="0" y1="40" x2="20" y2="40" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="5" y1="30" x2="22" y2="30" stroke="#FF5722" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <line x1="5" y1="50" x2="22" y2="50" stroke="#FF5722" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <line x1="0" y1="20" x2="15" y2="20" stroke="#FF5722" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          <line x1="0" y1="60" x2="15" y2="60" stroke="#FF5722" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
        </g>

        {/* Moto */}
        <g className="lf-moto-body">
          {/* Rueda trasera */}
          <circle cx="30" cy="55" r="12" fill="#1B1B2F" />
          <circle cx="30" cy="55" r="8" fill="#FF5722" className="lf-wheel-spin" style={{ transformOrigin: '30px 55px' }} />
          <circle cx="30" cy="55" r="3" fill="#fff" />

          {/* Rueda delantera */}
          <circle cx="90" cy="55" r="12" fill="#1B1B2F" />
          <circle cx="90" cy="55" r="8" fill="#FF5722" className="lf-wheel-spin" style={{ transformOrigin: '90px 55px' }} />
          <circle cx="90" cy="55" r="3" fill="#fff" />

          {/* Cuerpo moto */}
          <path d="M30 55 L48 35 L70 35 L82 55 L70 55 L62 42 L52 42 L42 55 Z" fill="#FF5722" />
          {/* Manillar */}
          <path d="M82 45 L92 30 L96 30" stroke="#1B1B2F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Asiento */}
          <path d="M50 35 L70 35 L68 32 L52 32 Z" fill="#1B1B2F" />
          {/* Casco repartidor */}
          <circle cx="78" cy="25" r="6" fill="#FF5722" />
          <path d="M72 25 Q78 18 84 25" stroke="#1B1B2F" strokeWidth="1.5" fill="none" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Skeleton shimmer para cards.
 */
export function ShimmerCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="lf-shimmer-card">
      <div className="lf-shimmer-avatar" />
      <div className="lf-shimmer-lines">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="lf-shimmer-line" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Pantalla de carga completa para transición entre roles.
 * Muestra logo + spinner + mensaje + barra de progreso.
 */
export function RoleLoader({ role, message }: { role: 'cliente' | 'repartidor' | 'admin' | 'ingeniero'; message?: string }) {
  const roleConfig = {
    cliente: {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
      label: 'Cliente',
      color: '#0066FF'
    },
    repartidor: {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l3 3M5.5 14L9 6h4l-2 8"/>
        </svg>
      ),
      label: 'Repartidor',
      color: '#00C853'
    },
    admin: {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      label: 'Administrador',
      color: '#7C3AED'
    },
    ingeniero: {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
      label: 'Ingeniero',
      color: '#FFB300'
    },
  };
  const cfg = roleConfig[role];
  const defaultMessage = `Cargando panel de ${cfg.label}...`;

  return (
    <div className="lf-role-loader" style={{ '--role-color': cfg.color } as React.CSSProperties}>
      <div className="lf-role-loader-content">
        <div className="lf-role-loader-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>{cfg.icon}</div>
        <LogoSpinner size={72} />
        <h2 className="lf-role-loader-title">{cfg.label}</h2>
        <p className="lf-role-loader-msg">{message || defaultMessage}</p>
        <div className="lf-role-loader-bar">
          <div className="lf-role-loader-bar-fill" />
        </div>
      </div>
    </div>
  );
}

/**
 * Spinner inline pequeño (para botones).
 */
export function MiniSpinner({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="lf-mini-spinner"
      style={{ color }}
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <path
        d="M12 2 A10 10 0 0 1 22 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
