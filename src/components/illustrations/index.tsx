'use client';

import React from 'react';

/**
 * Ilustraciones SVG reutilizables para landing, empty states y onboarding.
 * Paleta: #FF5722 primario, #FF8A65 secundario, var(--text) texto, var(--border) neutral.
 */

interface IllustrationProps {
  size?: number;
  className?: string;
}

/** Moto repartidor en movimiento con paquete. */
export function DeliveryMotoIllustration({ size = 200, className = '' }: IllustrationProps) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 240 180" fill="none" className={className}>
      {/* Ground Shadow */}
      <ellipse cx="120" cy="155" rx="85" ry="8" fill="rgba(27,27,47,0.12)" />
      
      {/* Dynamic Speed Lines */}
      <g stroke="url(#speed-line-grad)" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <line x1="20" y1="95" x2="60" y2="95">
          <animate attributeName="x1" values="10;30;10" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="x2" values="50;70;50" dur="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="15" y1="115" x2="45" y2="115">
          <animate attributeName="x1" values="5;20;5" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
          <animate attributeName="x2" values="35;50;35" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
        </line>
        <line x1="30" y1="75" x2="65" y2="75">
          <animate attributeName="x1" values="20;35;20" dur="1s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="x2" values="55;70;55" dur="1s" begin="0.6s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Scooter Group */}
      <g>
        {/* Rear Wheel & Motor */}
        <g>
          <circle cx="65" cy="125" r="22" fill="var(--text)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="65" cy="125" r="14" fill="#FFE0B2" stroke="#FF5722" strokeWidth="2" />
          <circle cx="65" cy="125" r="6" fill="var(--text)" />
          {/* Wheel spokes rotation */}
          <g style={{ transformOrigin: '65px 125px' }}>
            <animateTransform attributeName="transform" type="rotate" from="0 65 125" to="360 65 125" dur="1.5s" repeatCount="indefinite" />
            <line x1="65" y1="105" x2="65" y2="145" stroke="#FF8A65" strokeWidth="2" />
            <line x1="45" y1="125" x2="85" y2="125" stroke="#FF8A65" strokeWidth="2" />
          </g>
        </g>

        {/* Front Wheel & Suspension Fork */}
        <g>
          <circle cx="175" cy="125" r="22" fill="var(--text)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="175" cy="125" r="14" fill="#FFE0B2" stroke="#FF5722" strokeWidth="2" />
          <circle cx="175" cy="125" r="6" fill="var(--text)" />
          <g style={{ transformOrigin: '175px 125px' }}>
            <animateTransform attributeName="transform" type="rotate" from="0 175 125" to="360 175 125" dur="1.5s" repeatCount="indefinite" />
            <line x1="175" y1="105" x2="175" y2="145" stroke="#FF8A65" strokeWidth="2" />
            <line x1="155" y1="125" x2="195" y2="125" stroke="#FF8A65" strokeWidth="2" />
          </g>
          {/* Suspension Fork */}
          <path d="M175 125 L160 70" stroke="var(--text)" strokeWidth="4" strokeLinecap="round" />
          <path d="M160 70 L158 60" stroke="#FF5722" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Main Scooter Body - Sleek curved paths */}
        <path d="M65 125 L90 125 L115 120 L150 115 L162 70 L115 70 L95 85 L75 90 Z" fill="url(#body-gradient)" />
        <path d="M115 120 L152 115 L160 70 L140 70 L125 90 L110 90 Z" fill="url(#secondary-body-gradient)" />
        
        {/* Footboard */}
        <path d="M90 122 L145 117 L143 113 L93 118 Z" fill="var(--text)" />

        {/* Front Fairing & Windshield */}
        <path d="M160 70 L168 50 L172 40 L166 40 L158 55 Z" fill="rgba(255,255,255,0.4)" stroke="#FF8A65" strokeWidth="1" />
        <path d="M156 75 L166 65 L162 55 L150 72 Z" fill="#FF5722" />
        {/* Headlight */}
        <polygon points="163,63 170,62 168,67" fill="#FFF" />
        <path d="M170 62 L195 65 L190 75 L168 67 Z" fill="url(#headlight-glow)" opacity="0.3" />

        {/* Handlebars */}
        <path d="M160 58 L155 48 L142 48" stroke="var(--text)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="142" cy="48" r="3.5" fill="#FF5722" />

        {/* Seat / Saddle */}
        <path d="M90 88 C95 82, 105 82, 115 84 C120 85, 125 88, 128 88 L126 94 C120 94, 98 94, 90 88 Z" fill="var(--text)" />

        {/* Premium Thermal Delivery Box */}
        <g>
          {/* Box Shadow */}
          <rect x="52" y="47" width="46" height="42" rx="6" fill="rgba(0,0,0,0.15)" />
          {/* Main Box */}
          <rect x="50" y="45" width="46" height="42" rx="6" fill="#FF5722" stroke="var(--text)" strokeWidth="2.5" />
          {/* Reflector stripe */}
          <rect x="50" y="65" width="46" height="8" fill="#FFF" opacity="0.9" />
          <rect x="50" y="65" width="46" height="8" fill="#FFB300" opacity="0.3" />
          {/* Fastener Straps */}
          <path d="M60 45 L60 87" stroke="var(--text)" strokeWidth="2" />
          <path d="M86 45 L86 87" stroke="var(--text)" strokeWidth="2" />
          {/* Handle */}
          <path d="M66 45 Q73 38 80 45" stroke="var(--text)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="body-gradient" x1="65" y1="85" x2="160" y2="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5722" />
          <stop offset="50%" stopColor="#FF7043" />
          <stop offset="100%" stopColor="#FF8A65" />
        </linearGradient>
        <linearGradient id="secondary-body-gradient" x1="110" y1="70" x2="152" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--text)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--text)" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="speed-line-grad" x1="10" y1="95" x2="70" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5722" stopOpacity="0" />
          <stop offset="100%" stopColor="#FF5722" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="headlight-glow" x1="163" y1="65" x2="195" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFE0B2" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Mapa con pines y rutas. */
export function MapIllustration({ size = 200, className = '' }: IllustrationProps) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 200 180" fill="none" className={className}>
      {/* Fondo mapa */}
      <rect width="200" height="180" rx="12" fill="#E8F5E9" />
      {/* Calles */}
      <g stroke="#A5D6A7" strokeWidth="6" strokeLinecap="round" fill="none">
        <line x1="0" y1="40" x2="200" y2="40" />
        <line x1="0" y1="100" x2="200" y2="100" />
        <line x1="0" y1="140" x2="200" y2="140" />
        <line x1="50" y1="0" x2="50" y2="180" />
        <line x1="130" y1="0" x2="130" y2="180" />
      </g>
      {/* Ruta */}
      <path
        d="M30 150 Q50 120 80 100 Q110 80 140 60 Q170 40 180 30"
        stroke="#FF5722"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="6 4"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
      </path>
      {/* Pin origen */}
      <g>
        <circle cx="30" cy="150" r="8" fill="#4CAF50" />
        <circle cx="30" cy="150" r="14" fill="none" stroke="#4CAF50" strokeWidth="2" opacity="0.4">
          <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
      {/* Pin destino */}
      <g>
        <path d="M180 20 L180 30 L185 35 L195 25 L195 15 L185 15 Z" fill="#FF5722" />
        <circle cx="190" cy="20" r="3" fill="white" />
      </g>
      {/* Moto en movimiento */}
      <g>
        <animateMotion
          path="M30 150 Q50 120 80 100 Q110 80 140 60 Q170 40 180 30"
          dur="4s"
          repeatCount="indefinite"
        />
        <circle r="8" fill="var(--text)" />
        <circle r="4" fill="#FF5722" />
      </g>
    </svg>
  );
}

/** Paquete con escudo de seguridad. */
export function SecurePackageIllustration({ size = 200, className = '' }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}>
      <ellipse cx="100" cy="180" rx="70" ry="6" fill="rgba(0,0,0,0.08)" />
      {/* Caja */}
      <g>
        <path d="M50 80 L100 60 L150 80 L150 140 L100 160 L50 140 Z" fill="#FFB74D" stroke="var(--text)" strokeWidth="2" />
        <path d="M50 80 L100 100 L150 80" stroke="var(--text)" strokeWidth="2" fill="none" />
        <path d="M100 100 L100 160" stroke="var(--text)" strokeWidth="2" />
        {/* Cinta */}
        <path d="M70 70 L70 145" stroke="#FF5722" strokeWidth="4" />
        <path d="M130 70 L130 145" stroke="#FF5722" strokeWidth="4" />
      </g>
      {/* Escudo */}
      <g>
        <path d="M90 30 L100 25 L110 30 L110 50 Q110 60 100 65 Q90 60 90 50 Z" fill="#4CAF50" stroke="var(--text)" strokeWidth="2" />
        <path d="M96 42 L99 46 L104 38" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

/** Cliente recibiendo paquete. */
export function ReceivePackageIllustration({ size = 200, className = '' }: IllustrationProps) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 200 170" fill="none" className={className}>
      <ellipse cx="100" cy="160" rx="80" ry="6" fill="rgba(0,0,0,0.08)" />
      {/* Cliente */}
      <g>
        {/* Cuerpo */}
        <path d="M70 80 Q70 70 80 70 L100 70 Q110 70 110 80 L110 130 L70 130 Z" fill="#2196F3" />
        {/* Cabeza */}
        <circle cx="90" cy="55" r="15" fill="#FFE0B2" stroke="var(--text)" strokeWidth="2" />
        {/* Pelo */}
        <path d="M75 50 Q80 38 90 38 Q100 38 105 50 L105 60 Q95 55 85 55 Q80 55 75 60 Z" fill="#5D4037" />
        {/* Brazos recibiendo */}
        <path d="M105 85 L130 75" stroke="#FFE0B2" strokeWidth="8" strokeLinecap="round" />
        <path d="M110 95 L135 85" stroke="#FFE0B2" strokeWidth="8" strokeLinecap="round" />
      </g>
      {/* Paquete flotando */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -4; 0 0" dur="2s" repeatCount="indefinite" />
        <rect x="130" y="50" width="40" height="35" rx="4" fill="#FFB74D" stroke="var(--text)" strokeWidth="2" />
        <line x1="130" y1="62" x2="170" y2="62" stroke="var(--text)" strokeWidth="1.5" />
        <line x1="150" y1="50" x2="150" y2="85" stroke="var(--text)" strokeWidth="1.5" />
        {/* Brillo */}
        <line x1="135" y1="55" x2="140" y2="55" stroke="white" strokeWidth="2" opacity="0.6" />
      </g>
      {/* Estrellas de emoción */}
      <g fill="#FFB300">
        <path d="M150 30 L153 36 L159 37 L155 41 L156 47 L150 44 L144 47 L145 41 L141 37 L147 36 Z">
          <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}

/** Tracking en tiempo real - teléfono con mapa. */
export function PhoneTrackingIllustration({ size = 200, className = '' }: IllustrationProps) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 160 220" fill="none" className={className}>
      {/* Teléfono */}
      <rect x="30" y="10" width="100" height="200" rx="18" fill="var(--text)" />
      <rect x="36" y="22" width="88" height="176" rx="6" fill="#E8F5E9" />
      {/* Notch */}
      <rect x="65" y="16" width="30" height="4" rx="2" fill="#000" />
      {/* Mapa dentro del teléfono */}
      <g stroke="#A5D6A7" strokeWidth="3" fill="none">
        <line x1="36" y1="60" x2="124" y2="60" />
        <line x1="36" y1="100" x2="124" y2="100" />
        <line x1="36" y1="140" x2="124" y2="140" />
        <line x1="60" y1="22" x2="60" y2="198" />
        <line x1="100" y1="22" x2="100" y2="198" />
      </g>
      {/* Ruta */}
      <path
        d="M50 180 Q70 140 80 100 Q90 60 110 40"
        stroke="#FF5722"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="4 3"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="0.8s" repeatCount="indefinite" />
      </path>
      {/* Pin destino */}
      <circle cx="110" cy="40" r="5" fill="#FF5722" />
      {/* Moto en ruta */}
      <g>
        <animateMotion
          path="M50 180 Q70 140 80 100 Q90 60 110 40"
          dur="3s"
          repeatCount="indefinite"
        />
        <circle r="6" fill="var(--text)" />
        <circle r="3" fill="#FF5722" />
      </g>
      {/* Botón */}
      <circle cx="80" cy="200" r="6" fill="#FF5722" />
    </svg>
  );
}

/** Estrellas de calificación. */
export function StarsIllustration({ size = 200, className = '' }: IllustrationProps) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 200 100" fill="none" className={className}>
      <g fill="#FFB300">
        {[
          { cx: 30, cy: 50, delay: '0s' },
          { cx: 70, cy: 50, delay: '0.15s' },
          { cx: 100, cy: 30, delay: '0.3s' },
          { cx: 130, cy: 50, delay: '0.45s' },
          { cx: 170, cy: 50, delay: '0.6s' },
        ].map((star, i) => (
          <path
            key={i}
            d={`M${star.cx} ${star.cy - 15} L${star.cx + 4.5} ${star.cy - 5} L${star.cx + 14} ${star.cy - 5} L${star.cx + 6.5} ${star.cy + 2} L${star.cx + 9} ${star.cy + 12} L${star.cx} ${star.cy + 5} L${star.cx - 9} ${star.cy + 12} L${star.cx - 6.5} ${star.cy + 2} L${star.cx - 14} ${star.cy - 5} L${star.cx - 4.5} ${star.cy - 5} Z`}
            transform={`translate(0, ${star.cy === 30 ? 0 : 0})`}
          >
            <animate attributeName="opacity" values="0;1;1;1" dur="1.5s" begin={star.delay} repeatCount="indefinite" />
            <animateTransform
              attributeName="transform"
              type="scale"
              values="0;1.2;1"
              dur="1s"
              begin={star.delay}
              repeatCount="indefinite"
              additive="sum"
            />
          </path>
        ))}
      </g>
    </svg>
  );
}

/** Reloj de velocidad. */
export function SpeedClockIllustration({ size = 200, className = '' }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className}>
      <ellipse cx="100" cy="180" rx="60" ry="6" fill="rgba(0,0,0,0.08)" />
      <circle cx="100" cy="100" r="60" fill="#FFE0B2" stroke="#FF5722" strokeWidth="3" />
      <circle cx="100" cy="100" r="50" fill="none" stroke="#FF5722" strokeWidth="1" strokeDasharray="3 4" />
      {/* Marcas horas */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = (100 + Math.sin(rad) * 50).toFixed(4);
        const y1 = (100 - Math.cos(rad) * 50).toFixed(4);
        const x2 = (100 + Math.sin(rad) * 55).toFixed(4);
        const y2 = (100 - Math.cos(rad) * 55).toFixed(4);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text)" strokeWidth="2" />;
      })}
      {/* Manecillas */}
      <line x1="100" y1="100" x2="100" y2="65" stroke="var(--text)" strokeWidth="3" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="6s" repeatCount="indefinite" />
      </line>
      <line x1="100" y1="100" x2="130" y2="100" stroke="#FF5722" strokeWidth="2" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="2s" repeatCount="indefinite" />
      </line>
      <circle cx="100" cy="100" r="4" fill="var(--text)" />
      {/* Rayo de velocidad */}
      <path d="M85 70 L95 90 L85 95 L100 120 L95 100 L105 95 Z" fill="#FFB300" />
    </svg>
  );
}

/** Conexión social / red. */
export function SocialNetworkIllustration({ size = 200, className = '' }: IllustrationProps) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 200 140" fill="none" className={className}>
      {/* Líneas conexión */}
      <g stroke="#FF5722" strokeWidth="2" strokeDasharray="3 3" opacity="0.5">
        <line x1="40" y1="70" x2="100" y2="40" />
        <line x1="40" y1="70" x2="100" y2="100" />
        <line x1="100" y1="40" x2="160" y2="70" />
        <line x1="100" y1="100" x2="160" y2="70" />
        <line x1="100" y1="40" x2="100" y2="100" />
      </g>
      {/* Nodos */}
      <g>
        <circle cx="40" cy="70" r="14" fill="#FF5722" />
        <circle cx="100" cy="40" r="12" fill="#4CAF50" />
        <circle cx="100" cy="100" r="12" fill="#2196F3" />
        <circle cx="160" cy="70" r="14" fill="#FFB300" />
        {/* Pulso */}
        <circle cx="40" cy="70" r="14" fill="none" stroke="#FF5722" strokeWidth="2">
          <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="160" cy="70" r="14" fill="none" stroke="#FFB300" strokeWidth="2">
          <animate attributeName="r" values="14;22;14" dur="2s" begin="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   HIGH-TIER PROFESSIONAL VECTOR ART (PASO 1, 2, 3 - CÓMO FUNCIONA)
   ═════════════════════════════════════════════════════════════════════════ */

/** Paso 1: Solicita - Interfaz isométrica premium, catálogo en vivo y orden instantánea */
export function HighTierSolicitaIllustration({ size = 180, className = '' }: IllustrationProps) {
  const uniqueId = 'ht-solicita';
  return (
    <svg width={size * 1.25} height={size} viewBox="0 0 250 200" fill="none" className={className} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${uniqueId}-phone-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2A2E3D" />
          <stop offset="100%" stopColor="#12141C" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-screen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A2035" />
          <stop offset="100%" stopColor="#0B0D17" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-accent`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-orange`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FF9E00" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id={`${uniqueId}-card-shadow`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Sombra ambiental inferior */}
      <ellipse cx="125" cy="184" rx="88" ry="12" fill="rgba(0,0,0,0.35)" />
      <ellipse cx="125" cy="184" rx="55" ry="7" fill="rgba(0,122,255,0.25)" filter="url(#glow)" />

      {/* Teléfono Isométrico / Tablet Glass */}
      <g transform="translate(18, 14)">
        {/* Chasis exterior con bisel specular */}
        <rect x="36" y="10" width="138" height="154" rx="26" fill="url(#ht-solicita-phone-body)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" filter="url(#ht-solicita-card-shadow)" />
        {/* Pantalla OLED */}
        <rect x="42" y="16" width="126" height="142" rx="20" fill="url(#ht-solicita-screen)" />

        {/* Dynamic Island / Header */}
        <rect x="88" y="22" width="34" height="6" rx="3" fill="#05060A" />
        <circle cx="114" cy="25" r="1.5" fill="#00E5FF" />

        {/* Barra superior de app */}
        <g transform="translate(50, 36)">
          <rect x="0" y="0" width="110" height="20" rx="8" fill="rgba(255,255,255,0.06)" />
          <circle cx="10" cy="10" r="4" fill="#00E5FF" />
          <rect x="20" y="7" width="46" height="6" rx="3" fill="rgba(255,255,255,0.7)" />
          <rect x="90" y="6" width="12" height="8" rx="4" fill="url(#ht-solicita-orange)" />
        </g>

        {/* Tarjeta de Producto 1 (Hamburguesa / Restaurante) */}
        <g transform="translate(50, 62)">
          <rect x="0" y="0" width="110" height="34" rx="10" fill="rgba(255,255,255,0.07)" stroke="rgba(0,122,255,0.35)" strokeWidth="1" />
          {/* Mini icono */}
          <rect x="8" y="6" width="22" height="22" rx="6" fill="url(#ht-solicita-orange)" />
          <circle cx="19" cy="17" r="5" fill="#FFF" opacity="0.9" />
          {/* Text lines */}
          <rect x="36" y="9" width="48" height="5" rx="2.5" fill="#FFFFFF" />
          <rect x="36" y="18" width="28" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
          {/* Price badge */}
          <rect x="76" y="17" width="26" height="11" rx="5" fill="rgba(0,229,255,0.15)" stroke="rgba(0,229,255,0.4)" strokeWidth="0.8" />
          <rect x="80" y="21" width="18" height="3" rx="1.5" fill="#00E5FF" />
        </g>

        {/* Tarjeta de Producto 2 (Farmacia / Paquete Express) */}
        <g transform="translate(50, 102)">
          <rect x="0" y="0" width="110" height="34" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <rect x="8" y="6" width="22" height="22" rx="6" fill="url(#ht-solicita-accent)" />
          <rect x="36" y="9" width="42" height="5" rx="2.5" fill="rgba(255,255,255,0.85)" />
          <rect x="36" y="18" width="22" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
          <rect x="76" y="17" width="26" height="11" rx="5" fill="rgba(0,200,83,0.15)" stroke="rgba(0,200,83,0.4)" strokeWidth="0.8" />
          <rect x="80" y="21" width="18" height="3" rx="1.5" fill="#00C853" />
        </g>
      </g>

      {/* Botón flotante interactivo de "SOLICITAR AHORA" en perspectiva 3D */}
      <g transform="translate(142, 108)" filter="url(#ht-solicita-card-shadow)">
        <rect x="0" y="0" width="86" height="32" rx="16" fill="url(#ht-solicita-accent)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
        {/* Pulsing beacon */}
        <circle cx="16" cy="16" r="6" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="10" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6">
          <animate attributeName="r" values="6;13;6" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
        </circle>
        {/* Texto estilizado */}
        <rect x="30" y="13" width="42" height="6" rx="3" fill="#FFFFFF" />
      </g>

      {/* Partículas de destello */}
      <circle cx="34" cy="40" r="2.5" fill="#00E5FF" opacity="0.8" />
      <circle cx="218" cy="70" r="3" fill="#FF9E00" opacity="0.8" />
      <circle cx="230" cy="154" r="2" fill="#007AFF" opacity="0.7" />
    </svg>
  );
}

/** Paso 2: Rastrea - Holograma satelital, compás isométrico, ruta viva y motorizado en camino */
export function HighTierRastreaIllustration({ size = 180, className = '' }: IllustrationProps) {
  const uniqueId = 'ht-rastrea';
  return (
    <svg width={size * 1.25} height={size} viewBox="0 0 250 200" fill="none" className={className} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${uniqueId}-grid-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#007AFF" stopOpacity="0.32" />
          <stop offset="70%" stopColor="#007AFF" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uniqueId}-route`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="50%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#00C853" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-hud-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(24, 30, 48, 0.92)" />
          <stop offset="100%" stopColor="rgba(10, 12, 22, 0.95)" />
        </linearGradient>
        <filter id={`${uniqueId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Sombra de la plataforma */}
      <ellipse cx="125" cy="178" rx="92" ry="16" fill="rgba(0,0,0,0.38)" />

      {/* Plataforma Isométrica Satelital */}
      <g transform="translate(15, 20)">
        {/* Disco holográfico */}
        <ellipse cx="110" cy="130" rx="96" ry="42" fill="url(#ht-rastrea-grid-glow)" stroke="rgba(0,122,255,0.35)" strokeWidth="1.5" />
        <ellipse cx="110" cy="130" rx="68" ry="28" fill="none" stroke="rgba(0,229,255,0.25)" strokeWidth="1" strokeDasharray="5 5" />
        <ellipse cx="110" cy="130" rx="36" ry="15" fill="none" stroke="rgba(0,229,255,0.4)" strokeWidth="1.2" />

        {/* Red vial urbana proyectada en perspectiva */}
        <path d="M26 130 C60 115, 100 145, 150 120 C175 108, 195 116, 205 125" stroke="rgba(255,255,255,0.12)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M60 148 C90 128, 130 134, 168 140" stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M110 95 L110 165" stroke="rgba(255,255,255,0.06)" strokeWidth="3" strokeDasharray="4 4" fill="none" />

        {/* RUTA ACTIVA EN NEÓN (Pulsante y animada) */}
        <path
          d="M40 140 Q75 105, 110 125 T180 110"
          stroke="url(#ht-rastrea-route)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 6"
          fill="none"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1.2s" repeatCount="indefinite" />
        </path>

        {/* Punto A (Comercio / Salida) */}
        <g transform="translate(40, 140)">
          <circle cx="0" cy="0" r="8" fill="rgba(0,122,255,0.25)" />
          <circle cx="0" cy="0" r="4" fill="#007AFF" />
        </g>

        {/* Motorizado en ruta con cono de luz LED */}
        <g transform="translate(110, 125)">
          {/* Cono de iluminación delantero */}
          <polygon points="0,0 24,-10 24,10" fill="rgba(0,229,255,0.2)" opacity="0.7" />
          {/* Moto cápsula */}
          <circle cx="0" cy="0" r="9" fill="#00E5FF" stroke="#FFFFFF" strokeWidth="2" filter="url(#ht-rastrea-shadow)" />
          <circle cx="0" cy="0" r="3.5" fill="#0B0D17" />
          {/* Pulso radar satelital */}
          <circle cx="0" cy="0" r="14" fill="none" stroke="#00E5FF" strokeWidth="1.2" opacity="0.6">
            <animate attributeName="r" values="9;22;9" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Punto B (Destino Pin con Ondas) */}
        <g transform="translate(180, 110)">
          <ellipse cx="0" cy="2" rx="9" ry="4" fill="rgba(0,200,83,0.3)" />
          {/* Pin 3D */}
          <path d="M0 -22 C-7 -22 -11 -16 -11 -10 C-11 -3 0 2 0 2 C0 2 11 -3 11 -10 C11 -16 7 -22 0 -22 Z" fill="#00C853" stroke="#FFFFFF" strokeWidth="1.5" filter="url(#ht-rastrea-shadow)" />
          <circle cx="0" cy="-12" r="3.5" fill="#FFFFFF" />
        </g>

        {/* HUD Telemetry Card Flotante (ETA 12 MIN / GPS REAL) */}
        <g transform="translate(118, 12)" filter="url(#ht-rastrea-shadow)">
          <rect x="0" y="0" width="98" height="42" rx="12" fill="url(#ht-rastrea-hud-card)" stroke="rgba(0,229,255,0.35)" strokeWidth="1.2" />
          {/* Header pill */}
          <circle cx="12" cy="14" r="3.5" fill="#00C853" />
          <text x="20" y="17" fill="#00E5FF" fontSize="8.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="0.06em">EN CAMINO</text>
          {/* ETA */}
          <text x="12" y="32" fill="#FFFFFF" fontSize="12" fontWeight="800" fontFamily="monospace">ETA: 12 MIN</text>
        </g>
      </g>
    </svg>
  );
}

/** Paso 3: Recibe - Paquete blindado 3D, escudo holográfico de verificación y 5 estrellas */
export function HighTierRecibeIllustration({ size = 180, className = '' }: IllustrationProps) {
  const uniqueId = 'ht-recibe';
  return (
    <svg width={size * 1.25} height={size} viewBox="0 0 250 200" fill="none" className={className} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${uniqueId}-box-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFA000" />
          <stop offset="100%" stopColor="#FF6F00" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-box-left`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E65100" />
          <stop offset="100%" stopColor="#BF360C" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-box-right`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8F00" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-shield`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00E676" />
          <stop offset="100%" stopColor="#00A844" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-laser`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id={`${uniqueId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Sombra profunda inferior */}
      <ellipse cx="125" cy="180" rx="82" ry="14" fill="rgba(0,0,0,0.38)" />
      <ellipse cx="125" cy="180" rx="46" ry="8" fill="rgba(0,230,118,0.25)" filter="url(#glow)" />

      {/* Paquete Isométrico Ultra-Detallado */}
      <g transform="translate(125, 126)" filter="url(#ht-recibe-shadow)">
        {/* Cara Superior (Rombo isométrico) */}
        <polygon points="0,-48 56,-20 0,8 -56,-20" fill="url(#ht-recibe-box-top)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        {/* Cara Izquierda */}
        <polygon points="-56,-20 0,8 0,60 -56,32" fill="url(#ht-recibe-box-left)" />
        {/* Cara Derecha */}
        <polygon points="0,8 56,-20 56,32 0,60" fill="url(#ht-recibe-box-right)" />

        {/* Cinta de Precinto de Seguridad Holográfica */}
        <polygon points="-14,-41 0,-34 14,-41 0,-48" fill="#007AFF" opacity="0.9" />
        <polygon points="-14,-41 0,-34 0,8 -14,1" fill="#0066FF" opacity="0.9" />
        <polygon points="0,-34 14,-41 14,1 0,8" fill="#1A8CFF" opacity="0.9" />

        {/* Etiqueta Térmica con Código de Barras */}
        <polygon points="12,18 42,3 42,26 12,41" fill="#FFFFFF" opacity="0.95" />
        <line x1="16" y1="23" x2="38" y2="12" stroke="#12141C" strokeWidth="1.5" />
        <line x1="16" y1="27" x2="38" y2="16" stroke="#12141C" strokeWidth="2.5" />
        <line x1="16" y1="31" x2="32" y2="23" stroke="#12141C" strokeWidth="1.2" />

        {/* Escáner Láser que barre la caja verticalmente */}
        <line x1="-50" y1="2" x2="50" y2="2" stroke="url(#ht-recibe-laser)" strokeWidth="3">
          <animateTransform attributeName="transform" type="translate" values="0 -18; 0 34; 0 -18" dur="2.4s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Escudo Flotante de Garantía y Entrega Verificada */}
      <g transform="translate(125, 46)" filter="url(#ht-recibe-shadow)">
        <path
          d="M0 -28 L24 -16 L24 10 C24 24 12 36 0 42 C-12 36 -24 24 -24 10 L-24 -16 Z"
          fill="url(#ht-recibe-shield)"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        {/* Checkmark interior brillante */}
        <path
          d="M-8 6 L-2 12 L10 -2"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Floating Rating Badge con 5 Estrellas Doradas */}
      <g transform="translate(125, 102)" filter="url(#ht-recibe-shadow)">
        <rect x="-55" y="-12" width="110" height="24" rx="12" fill="rgba(18, 20, 32, 0.94)" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="1" />
        <g transform="translate(-42, -5)" fill="#FFD700">
          {[0, 18, 36, 54, 72].map((x, i) => (
            <polygon key={i} points={`${x+5},0 ${x+6.5},3.5 ${x+10},3.8 ${x+7.5},6.2 ${x+8.2},10 ${x+5},8 ${x+1.8},10 ${x+2.5},6.2 ${x},3.8 ${x+3.5},3.5`} />
          ))}
        </g>
      </g>

      {/* Destellos de éxito */}
      <circle cx="55" cy="50" r="2.5" fill="#00E676" opacity="0.8" />
      <circle cx="198" cy="62" r="3" fill="#FFD700" opacity="0.85" />
      <circle cx="214" cy="130" r="2" fill="#00E5FF" opacity="0.8" />
    </svg>
  );
}

