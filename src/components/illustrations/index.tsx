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
