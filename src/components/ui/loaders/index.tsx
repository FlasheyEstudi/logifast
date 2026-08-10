'use client';

import React, { useState, useEffect } from 'react';

/**
 * Spinner con logo LOGIFAST animado (Logotipo de envío veloz de alto nivel).
 * Reemplaza la forma básica antigua por una geometría de escudo/alas veloces con gradiente dinámico.
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
          strokeDasharray="70 200"
          fill="none"
          className="lf-spinner-ring"
        />
        {/* Emblema estilizado de entrega veloz / rayo aerodinámico */}
        <g className="lf-spinner-logo">
          <path
            d="M36 28 L68 28 L52 48 L64 48 L32 74 L42 54 L30 54 Z"
            fill="url(#lf-icon-grad)"
            filter="drop-shadow(0px 2px 6px rgba(255, 87, 34, 0.4))"
          />
        </g>
        <defs>
          <linearGradient id="lf-spinner-grad" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#FF5722" />
            <stop offset="50%" stopColor="#34C759" />
            <stop offset="100%" stopColor="#FFB74D" />
          </linearGradient>
          <linearGradient id="lf-icon-grad" x1="30" y1="28" x2="68" y2="74">
            <stop offset="0%" stopColor="#FF7043" />
            <stop offset="100%" stopColor="#FF3D00" />
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
            <stop offset="100%" stopColor="#34C759" />
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
 * Loader de Scooter / Rider Cyber-Express de alta velocidad (Reemplaza la bicicleta antigua por un vehículo cyber ultra moderno).
 */
export function MotoLoader({ size = 140 }: { size?: number }) {
  return (
    <div className="lf-moto-loader" style={{ width: size, height: size * 0.65 }}>
      <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cyber-body-grad" x1="20" y1="30" x2="130" y2="70">
            <stop offset="0%" stopColor="#FF5722" />
            <stop offset="70%" stopColor="#FF3D00" />
            <stop offset="100%" stopColor="#E64A19" />
          </linearGradient>
          <linearGradient id="cyber-neon-green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34C759" />
            <stop offset="100%" stopColor="#30B04A" />
          </linearGradient>
          <linearGradient id="headlight-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(52, 199, 89, 0.75)" />
            <stop offset="100%" stopColor="rgba(52, 199, 89, 0)" />
          </linearGradient>
        </defs>

        {/* Línea de pista/carretera con perspectiva */}
        <line x1="10" y1="85" x2="150" y2="85" stroke="#34C759" strokeWidth="2.5" strokeOpacity="0.4" className="lf-road-grid-line" />

        {/* Partículas de velocidad que pasan rápido */}
        <g className="lf-speed-particle">
          <line x1="150" y1="35" x2="120" y2="35" stroke="#FF8A65" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="140" y1="50" x2="105" y2="50" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <line x1="155" y1="65" x2="125" y2="65" stroke="#FF5722" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* Halo / Haz de luz del faro delantero */}
        <polygon
          points="115,54 158,40 158,68"
          fill="url(#headlight-beam)"
          className="lf-rider-headlight-beam"
        />

        {/* Grupo principal del Rider + Scooter (Sombra y Chasis con rebote continuo) */}
        <g className="lf-rider-bounce">
          {/* Sombra proyectada en el suelo */}
          <ellipse cx="75" cy="85" rx="45" ry="5" fill="rgba(0,0,0,0.3)" />

          {/* Rueda trasera Cyber-Neon */}
          <g transform="translate(38, 70)">
            <circle cx="0" cy="0" r="14" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
            <circle cx="0" cy="0" r="9" stroke="#FF5722" strokeWidth="2.5" fill="none" className="lf-cyber-wheel-spin" strokeDasharray="12 6" />
            <circle cx="0" cy="0" r="4" fill="#34C759" />
          </g>

          {/* Rueda delantera Cyber-Neon */}
          <g transform="translate(112, 70)">
            <circle cx="0" cy="0" r="14" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
            <circle cx="0" cy="0" r="9" stroke="#FF5722" strokeWidth="2.5" fill="none" className="lf-cyber-wheel-spin" strokeDasharray="12 6" />
            <circle cx="0" cy="0" r="4" fill="#34C759" />
          </g>

          {/* Chasis aerodinámico del Scooter Express */}
          <path
            d="M32 68 L48 48 L72 45 L98 52 L116 68 L96 72 L78 58 L54 60 L38 72 Z"
            fill="url(#cyber-body-grad)"
          />

          {/* Mochila Térmica de Repartidor LogiFast en la parte trasera */}
          <rect x="28" y="32" width="22" height="26" rx="4" fill="#1E293B" stroke="#FF5722" strokeWidth="2" />
          <path d="M33 45 L45 45" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="39" cy="38" r="2" fill="#FF9500" />

          {/* Cuerpo y Casco Cyber-Rider */}
          {/* Torso */}
          <path d="M52 48 L65 30 L80 34 L74 52 Z" fill="#0F172A" />
          {/* Brazo sujetando el manubrio */}
          <path d="M66 36 L94 44" stroke="#FF5722" strokeWidth="4" strokeLinecap="round" />
          {/* Casco aerodinámico con visera glowing */}
          <ellipse cx="72" cy="24" rx="10" ry="9" fill="#0F172A" stroke="#FF5722" strokeWidth="2" />
          {/* Visera Neón Green */}
          <path d="M72 20 Q82 20 81 27 Q74 28 72 24 Z" fill="url(#cyber-neon-green)" />
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
 * Loader de Radar GPS animado de ultra precisión para Repartidor.
 * Cuenta con scanner HUD giratorio, pings de satélite en tiempo real y tipografía de tablero digital.
 */
export function RepartidorRadarLoader({ message }: { message?: string }) {
  const [tickerIndex, setTickerIndex] = useState(0);

  const subMessages = [
    'Conectando GPS de Alta Precisión...',
    'Buscando Pedidos Activos en Tu Zona...',
    'Sincronizando Tablero LogiFast...',
    'Optimizando Ruta y Tráfico...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % subMessages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const displayMessage = message || subMessages[tickerIndex];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, #0F172A 0%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 24,
        zIndex: 60,
      }}
    >
      {/* Contenedor HUD del Radar */}
      <div
        style={{
          position: 'relative',
          width: 140,
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(52, 199, 89, 0.25)',
          boxShadow: '0 0 40px rgba(52, 199, 89, 0.15)',
        }}
      >
        {/* Anillos concéntricos de Radar */}
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px stroke rgba(255, 87, 34, 0.2)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', border: '1px stroke rgba(52, 199, 89, 0.3)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 48, borderRadius: '50%', border: '1px stroke rgba(255, 87, 34, 0.4)', pointerEvents: 'none' }} />

        {/* Anillos de expansión de pulso Radar */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid #34C759', pointerEvents: 'none' }} className="lf-ping-ring-1" />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid #FF5722', pointerEvents: 'none' }} className="lf-ping-ring-2" />

        {/* Haz de Luz Giratorio de Scanner Radar */}
        <div className="lf-radar-sweep-beam" />

        {/* Icono central de Cyber Rider / GPS Target */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,87,34,0.2) 0%, rgba(52,199,89,0.2) 100%)',
            border: '2px solid #34C759',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(52, 199, 89, 0.4)',
          }}
        >
          <MotoLoader size={60} />
        </div>
      </div>

      {/* Título y Mensajes de Estado del Sistema */}
      <div style={{ textAlign: 'center', maxWidth: 280 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(52, 199, 89, 0.1)',
            border: '1px solid rgba(52, 199, 89, 0.3)',
            marginBottom: 8,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 8px #34C759' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#34C759', letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            REPARTIDOR GPS HUD
          </span>
        </div>

        <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#FFFFFF', fontFamily: "'Syne', sans-serif", letterSpacing: 0.5 }}>
          LOGIFAST RIDER
        </h4>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 13,
            fontWeight: 600,
            color: '#94A3B8',
            minHeight: 20,
            transition: 'all 0.3s ease',
          }}
        >
          {displayMessage}
        </p>

        {/* Indicador de barra de estado en vivo */}
        <div
          style={{
            width: 140,
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            margin: '14px auto 0',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '45%',
              background: 'linear-gradient(90deg, #FF5722, #34C759)',
              borderRadius: 2,
              animation: 'lf-road-dash 1.2s ease-in-out infinite alternate',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Pantalla de carga completa para transición entre roles.
 * Muestra logo + spinner + mensaje + barra de progreso.
 */
export function RoleLoader({ role, message }: { role: 'cliente' | 'repartidor' | 'admin' | 'ingeniero'; message?: string }) {
  if (role === 'repartidor') {
    return (
      <div className="lf-role-loader" style={{ '--role-color': '#34C759' } as React.CSSProperties}>
        <div className="lf-role-loader-content" style={{ width: '100%', height: '100%' }}>
          <RepartidorRadarLoader message={message} />
        </div>
      </div>
    );
  }

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
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      label: 'Repartidor Express',
      color: '#34C759'
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
