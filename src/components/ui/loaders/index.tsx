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
 * Muestra logo.png + doble anillo orbital girando + badge en vivo + barra shimmer animada.
 */
export function RoleLoader({ role, message }: { role: 'cliente' | 'repartidor' | 'admin' | 'ingeniero'; message?: string }) {
  const roleConfig = {
    cliente: {
      label: 'LogiFast Cliente Express',
      tag: 'Conectando a Marketplace & Envíos',
      primaryColor: '#0066FF',
      secondaryColor: '#FF5722',
      glow: 'rgba(0, 102, 255, 0.35)',
    },
    repartidor: {
      label: 'LogiFast Rider Pro',
      tag: 'Calibrando Radar GPS & Sincronizando',
      primaryColor: '#34C759',
      secondaryColor: '#007AFF',
      glow: 'rgba(52, 199, 89, 0.35)',
    },
    admin: {
      label: 'Torre de Control LogiFast',
      tag: 'Acceso Seguro a Consola',
      primaryColor: '#7C3AED',
      secondaryColor: '#007AFF',
      glow: 'rgba(124, 58, 237, 0.35)',
    },
    ingeniero: {
      label: 'LogiFast Core Engine',
      tag: 'Telemetría & Servidores en Vivo',
      primaryColor: '#FFB300',
      secondaryColor: '#FF5722',
      glow: 'rgba(255, 179, 0, 0.35)',
    },
  };

  const cfg = roleConfig[role] || roleConfig.cliente;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#07090E] text-white select-none overflow-hidden font-sans">
      {/* Luces ambientales animadas en el fondo */}
      <div
        className="absolute w-[360px] h-[360px] rounded-full blur-[110px] pointer-events-none animate-pulse"
        style={{ background: cfg.glow, opacity: 0.25 }}
      />
      <div className="absolute -bottom-10 right-0 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      {/* Contenedor central flotante */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xs w-full">
        {/* Logo con Doble Anillo Orbital Neón Girando */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          {/* Anillo exterior orbitando a la derecha */}
          <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '4s' }} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={cfg.primaryColor}
              strokeWidth="2.5"
              strokeDasharray="40 180"
              strokeLinecap="round"
            />
          </svg>

          {/* Anillo interior orbitando a la izquierda */}
          <svg className="absolute inset-2 w-[96px] h-[96px] animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={cfg.secondaryColor}
              strokeWidth="2"
              strokeDasharray="30 160"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>

          {/* Logo oficial centrado con respiración y brillo */}
          <div className="relative w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-xl shadow-black/60 p-2.5">
            <img
              src="/logo.png"
              alt="LogiFast"
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(0,102,255,0.6)] animate-pulse"
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>

        {/* Badge de estado en vivo */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-md mb-3 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: cfg.primaryColor }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: cfg.primaryColor }} />
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
            {cfg.label}
          </span>
        </div>

        {/* Mensaje de carga */}
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight mb-1">
          {message || cfg.tag}
        </h3>
        <p className="text-[11px] text-slate-500 font-medium">
          Cargando módulos y servicios en tiempo real...
        </p>

        {/* Barra de progreso de alta tecnología (Shimmer continuo) */}
        <div className="w-44 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-5 relative border border-white/5">
          <div
            className="absolute top-0 bottom-0 rounded-full w-1/2 animate-[lf-shimmer_1.4s_ease-in-out_infinite]"
            style={{
              background: `linear-gradient(90deg, transparent, ${cfg.primaryColor}, ${cfg.secondaryColor}, transparent)`,
            }}
          />
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
