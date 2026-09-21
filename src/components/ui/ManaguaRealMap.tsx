'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bike, ArrowRight } from 'lucide-react';

export default function ManaguaRealMap({ isDark }: { isDark: boolean }) {
  const [activeTab, setActiveTab] = useState<'trafico' | 'rutas' | 'cobertura'>('rutas');
  const [selectedPin, setSelectedPin] = useState<string | null>('moto-04');

  // Colores temáticos
  const mapBg = isDark ? '#080A12' : '#EAEFF8';
  const waterColor = isDark ? '#07162A' : '#BED8FA';
  const waterStroke = isDark ? '#007AFF' : '#60A5FA';
  const parkColor = isDark ? '#0B1A14' : '#D1E7DD';
  const roadMajor = isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)';
  const roadSecondary = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.65)';
  const roadHighway = isDark ? 'rgba(0, 122, 255, 0.45)' : 'rgba(0, 102, 255, 0.4)';
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#8E8E93' : '#6E6E73';
  const labelColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(28, 28, 30, 0.6)';

  return (
    <div style={{
      width: '100%',
      borderRadius: '24px 26px 22px 20px',
      overflow: 'hidden',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 102, 255, 0.15)',
      background: mapBg,
      position: 'relative',
      boxShadow: isDark ? 'inset 0 1px 2px rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.5)' : 'inset 0 1px 2px rgba(255,255,255,0.9), 0 20px 40px rgba(0,102,255,0.08)',
    }}>
      {/* ─── BARRA SUPERIOR DE TELEMETRÍA Y CONTROLES ─── */}
      <div style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        background: isDark ? 'rgba(10, 12, 20, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 10px #00C853' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: textColor, letterSpacing: '0.04em' }}>
              MANAGUA METRO • 14 UNIDADES ACTIVAS
            </span>
          </div>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: subColor, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 6 }}>
            12.1364° N, 86.2514° W
          </span>
        </div>

        {/* Filtros de visualización */}
        <div style={{ display: 'flex', gap: 4, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', padding: 3, borderRadius: 10 }}>
          {(['rutas', 'trafico', 'cobertura'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#007AFF' : 'transparent',
                color: activeTab === tab ? '#FFFFFF' : subColor,
                border: 'none',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'rutas' ? 'Rutas en vivo' : tab === 'trafico' ? 'Tráfico fluido' : 'Zonas de cobertura'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── LIENZO SVG: MAPA VECTORIAL DE MANAGUA REAL ─── */}
      <div style={{ position: 'relative', height: 360, width: '100%', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 900 480"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="lake-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={waterColor} />
              <stop offset="100%" stopColor={isDark ? '#040D1A' : '#99C4FA'} />
            </linearGradient>
            <radialGradient id="tiscapa-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00C853" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00C853" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="route-pulse-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#007AFF" />
              <stop offset="60%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#00C853" />
            </linearGradient>
            <filter id="blip-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. LAGO XOLOTLÁN (Costa norte de Managua) */}
          <path
            d="M0,0 L900,0 L900,105 C780,120 650,90 520,110 C380,132 240,95 120,115 C60,125 0,110 0,110 Z"
            fill="url(#lake-gradient)"
            stroke={waterStroke}
            strokeWidth="1.5"
            opacity="0.85"
          />
          <text x="450" y="55" fill={isDark ? 'rgba(0, 162, 255, 0.4)' : 'rgba(0, 80, 180, 0.5)'} fontSize="13" fontWeight="800" letterSpacing="0.2em" textAnchor="middle">
            LAGO XOLOTLÁN (LAGO DE MANAGUA)
          </text>
          <text x="210" y="95" fill={isDark ? 'rgba(0, 162, 255, 0.3)' : 'rgba(0, 80, 180, 0.4)'} fontSize="9" fontWeight="700">
            Malecón / Puerto Salvador Allende
          </text>

          {/* 2. LAGUNA DE TISCAPA (Centro de Managua) */}
          <ellipse cx="440" cy="235" rx="36" ry="24" fill={waterColor} stroke={waterStroke} strokeWidth="2" />
          <ellipse cx="440" cy="235" rx="55" ry="38" fill="url(#tiscapa-glow)" />
          <text x="440" y="240" fill={labelColor} fontSize="9" fontWeight="800" textAnchor="middle">
            Tiscapa
          </text>

          {/* 3. LAGUNA DE ASOSOSCA (Oeste) */}
          <ellipse cx="140" cy="210" rx="24" ry="18" fill={waterColor} stroke={waterStroke} strokeWidth="1.5" />
          <text x="140" y="214" fill={labelColor} fontSize="8" fontWeight="700" textAnchor="middle">
            Asososca
          </text>

          {/* 4. RED VIAL PRINCIPAL DE MANAGUA */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* CARRETERA NORTE (Paralela al lago) */}
            <path d="M0,135 C200,128 450,135 650,140 L900,145" stroke={roadMajor} strokeWidth="7" fill="none" />
            <path d="M0,135 C200,128 450,135 650,140 L900,145" stroke={roadHighway} strokeWidth="4" fill="none" />

            {/* PISTA JUAN PABLO II (Transversal este-oeste conectando rotondas) */}
            <path d="M120,320 C240,290 380,295 510,290 C660,285 780,260 900,250" stroke={roadMajor} strokeWidth="7" fill="none" />
            <path d="M120,320 C240,290 380,295 510,290 C660,285 780,260 900,250" stroke={roadHighway} strokeWidth="4" fill="none" />

            {/* CARRETERA A MASAYA (Diagonal hacia el sureste) */}
            <path d="M440,235 L510,290 L610,360 L720,430 L800,480" stroke={roadMajor} strokeWidth="8" fill="none" />
            <path d="M440,235 L510,290 L610,360 L720,430 L800,480" stroke="#FF6B00" strokeWidth="4.5" fill="none" opacity="0.9" />

            {/* PISTA SUBURBANA (Anillo Sur: UNAN / Villa Fontana) */}
            <path d="M220,440 C380,410 520,415 650,430 L800,450" stroke={roadMajor} strokeWidth="6" fill="none" />

            {/* PISTA DE LA RESISTENCIA (Bolonia - Metrocentro) */}
            <path d="M320,180 C360,230 440,235 510,290" stroke={roadSecondary} strokeWidth="4" fill="none" />

            {/* CALLES SECUNDARIAS DE LOS ROBLES Y ALTAMIRA */}
            <path d="M510,290 L590,260 L680,290" stroke={roadSecondary} strokeWidth="3" fill="none" />
            <path d="M540,320 L630,300 L660,350" stroke={roadSecondary} strokeWidth="2.5" fill="none" />
            <path d="M470,330 L550,370 L610,360" stroke={roadSecondary} strokeWidth="2.5" fill="none" />
            <path d="M380,295 L400,370 L480,400" stroke={roadSecondary} strokeWidth="3" fill="none" />
            <path d="M260,220 L320,310 L380,380" stroke={roadSecondary} strokeWidth="3" fill="none" />
            <path d="M650,140 L660,230 L650,285" stroke={roadSecondary} strokeWidth="3.5" fill="none" />
            <path d="M750,142 L740,265 L720,430" stroke={roadSecondary} strokeWidth="4" fill="none" />
          </g>

          {/* 5. ROTONDAS CLAVE DE MANAGUA */}
          {/* Rotonda Metrocentro / Rubén Darío */}
          <circle cx="510" cy="290" r="11" fill={isDark ? '#1C2237' : '#FFFFFF'} stroke="#007AFF" strokeWidth="3" />
          <circle cx="510" cy="290" r="4" fill="#007AFF" />

          {/* Rotonda Jean Paul Genie */}
          <circle cx="610" cy="360" r="10" fill={isDark ? '#1C2237' : '#FFFFFF'} stroke="#FF6B00" strokeWidth="3" />
          <circle cx="610" cy="360" r="3.5" fill="#FF6B00" />

          {/* Rotonda El Periodista */}
          <circle cx="330" cy="298" r="8" fill={isDark ? '#1C2237' : '#FFFFFF'} stroke="#007AFF" strokeWidth="2" />

          {/* Rotonda Cristo Rey */}
          <circle cx="630" cy="265" r="8" fill={isDark ? '#1C2237' : '#FFFFFF'} stroke="#007AFF" strokeWidth="2" />

          {/* 6. ETIQUETAS DE ZONAS REALES DE MANAGUA */}
          <g fill={labelColor} fontSize="10" fontWeight="800" fontFamily="sans-serif">
            <text x="525" y="280">Metrocentro</text>
            <text x="625" y="360">Jean Paul Genie</text>
            <text x="535" y="325" fill="#007AFF">Los Robles</text>
            <text x="635" y="325">Altamira</text>
            <text x="350" y="245">Bolonia</text>
            <text x="510" y="415">Villa Fontana</text>
            <text x="730" y="415">Las Colinas</text>
            <text x="665" y="195">Bello Horizonte</text>
            <text x="760" y="130">Hacia Aeropuerto</text>
          </g>

          {/* 7. RUTA ACTIVA EN VIVO: BURGER BOSS ➔ LOS ROBLES */}
          {activeTab === 'rutas' && (
            <g>
              <path
                d="M510,290 C530,295 560,310 575,325"
                stroke="url(#route-pulse-grad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="6 4"
                fill="none"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="0.9s" repeatCount="indefinite" />
              </path>

              {/* Pin Tienda (Burger Boss) */}
              <g transform="translate(510, 290)">
                <circle cx="0" cy="0" r="14" fill="rgba(0,122,255,0.2)" />
                <circle cx="0" cy="0" r="5" fill="#007AFF" stroke="#FFF" strokeWidth="1.5" />
              </g>

              {/* Pin Destino Cliente (Los Robles) */}
              <g transform="translate(575, 325)">
                <circle cx="0" cy="0" r="16" fill="rgba(0,200,83,0.25)">
                  <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="0" r="6" fill="#00C853" stroke="#FFF" strokeWidth="2" />
              </g>
            </g>
          )}

          {/* 8. MOTORIZADOS EN MOVIMIENTO CONTINUO */}
          {/* MOTO 04 (Carretera a Masaya) */}
          <g transform="translate(565, 330)" onClick={() => setSelectedPin('moto-04')} style={{ cursor: 'pointer' }}>
            <circle cx="0" cy="0" r="12" fill="rgba(0,229,255,0.25)" filter="url(#blip-glow)">
              <animate attributeName="r" values="10;18;10" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="7" fill="#00E5FF" stroke="#FFFFFF" strokeWidth="2" />
            {/* Tag flotante */}
            <rect x="10" y="-18" width="80" height="20" rx="6" fill={isDark ? '#0F1322' : '#FFFFFF'} stroke="#00E5FF" strokeWidth="1" />
            <text x="16" y="-5" fill={isDark ? '#FFFFFF' : '#1C1C1E'} fontSize="9" fontWeight="800" fontFamily="monospace">
              MOTO-04 (32km/h)
            </text>
          </g>

          {/* MOTO 09 (Pista Juan Pablo II) */}
          <g transform="translate(390, 295)" onClick={() => setSelectedPin('moto-09')} style={{ cursor: 'pointer' }}>
            <circle cx="0" cy="0" r="10" fill="rgba(0,200,83,0.2)" />
            <circle cx="0" cy="0" r="6" fill="#00C853" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="10" y="-16" width="70" height="18" rx="5" fill={isDark ? '#0F1322' : '#FFFFFF'} stroke="#00C853" strokeWidth="1" />
            <text x="15" y="-4" fill={isDark ? '#FFFFFF' : '#1C1C1E'} fontSize="8.5" fontWeight="800" fontFamily="monospace">
              MOTO-09 (En ruta)
            </text>
          </g>

          {/* MOTO 12 (Carretera Norte) */}
          <g transform="translate(320, 133)" onClick={() => setSelectedPin('moto-12')} style={{ cursor: 'pointer' }}>
            <circle cx="0" cy="0" r="6" fill="#007AFF" stroke="#FFFFFF" strokeWidth="1.5" />
            <rect x="10" y="-14" width="60" height="16" rx="4" fill={isDark ? '#0F1322' : '#FFFFFF'} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <text x="14" y="-3" fill={subColor} fontSize="8" fontWeight="700" fontFamily="monospace">
              MOTO-12
            </text>
          </g>

          {/* MOTO 07 (Jean Paul Genie) */}
          <g transform="translate(680, 410)" style={{ cursor: 'pointer' }}>
            <circle cx="0" cy="0" r="6" fill="#FF9800" stroke="#FFFFFF" strokeWidth="1.5" />
            <rect x="10" y="-14" width="64" height="16" rx="4" fill={isDark ? '#0F1322' : '#FFFFFF'} stroke="#FF9800" strokeWidth="0.8" />
            <text x="14" y="-3" fill={isDark ? '#FFFFFF' : '#1C1C1E'} fontSize="8" fontWeight="700" fontFamily="monospace">
              MOTO-07 (Cerca)
            </text>
          </g>

          {/* Zonas de Cobertura Overlay */}
          {activeTab === 'cobertura' && (
            <circle cx="510" cy="290" r="180" fill="rgba(0,122,255,0.08)" stroke="#007AFF" strokeWidth="1.5" strokeDasharray="6 6" />
          )}
        </svg>

        {/* ─── TARJETA HUD DETALLE DEL PEDIDO ACTIVO ─── */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 14,
          right: 14,
          background: isDark ? 'rgba(12, 14, 24, 0.92)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(24px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 102, 255, 0.2)',
          borderRadius: 16,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0, 102, 255, 0.15)', border: '1px solid rgba(0,102,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={18} color="#007AFF" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: textColor }}>
                Despacho #LF-9021 • Carlos M. en Honda Wave
              </div>
              <div style={{ fontSize: 10, color: subColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Burger Boss (Metrocentro)</span>
                <ArrowRight size={11} style={{ opacity: 0.7 }} />
                <span style={{ color: '#00C853', fontWeight: 700 }}>Los Robles (Etapa II)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#007AFF', fontFamily: 'monospace' }}>
                ETA: 8 MIN
              </div>
              <div style={{ fontSize: 10, color: subColor }}>Distancia: 2.1 km</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 8px #00C853' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
