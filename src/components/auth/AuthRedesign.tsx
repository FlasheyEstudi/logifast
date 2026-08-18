'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sileo } from 'sileo';
import { useConfigStore } from '@/store/configStore';
import { MiniSpinner } from '@/components/ui/loaders';
import { ImageUploader } from '@/components/ui/ImageUploader';

type View = 'landing' | 'login' | 'register';

interface AuthRedesignProps {
  onLoginSuccess: (role: string, name: string) => void;
  currentView?: View;
}

const Icon = {
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3.5"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="3.5"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Store: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l2-5h14l2 5M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18M9 13h6"/>
    </svg>
  ),
  Bike: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6h2l3 3M5.5 14L9 6h4l-2 8"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Wrench: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Home: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Message: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Headphones: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  ),
  Star: ({ size = 16, fill = "#FFB300" }: { size?: number; fill?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={fill} strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  FoodBag: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Logo: ({ size = 34 }: { size?: number }) => (
    <img
      src="/logo.png"
      alt="Logifast"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 6px 16px rgba(0,102,255,0.5))',
      }}
    />
  ),
};

const SLIDES = [
  {
    title: 'Pide. Rastrea. Recibe.',
    subtitle: 'Tu marketplace y servicio de envíos en Managua, en una sola app.',
    widgetType: 'order_widget',
  },
  {
    title: 'Rastreo en tiempo real',
    subtitle: 'Sigue a tu repartidor en el mapa con Socket.IO, chatea y recibe notificaciones.',
    widgetType: 'map_widget',
  },
  {
    title: 'Pagos seguros y flexibles',
    subtitle: 'Efectivo, transferencia o tarjeta. Tú eliges la forma de pago.',
    widgetType: 'wallet_widget',
  },
  {
    title: 'Califica tu experiencia',
    subtitle: 'Tu opinión retroalimenta y eleva la calidad de nuestra red logística.',
    widgetType: 'rating_widget',
  },
];

function AppleSlideWidget({ type, isDark }: { type: string; isDark: boolean }) {
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.8)';
  const innerShadow = isDark
    ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 14px 36px rgba(0,0,0,0.35)'
    : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), 0 12px 30px rgba(0,102,255,0.06)';
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#8E8E93' : '#6E6E73';

  if (type === 'order_widget') {
    return (
      <div style={{ width: '100%', background: cardBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border, borderRadius: 22, padding: 18, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: innerShadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, color: '#00C853' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 12px #00C853' }} />
            EN CAMINO • ETA 12 MIN
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: textColor }}>C$ 240.00</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0, 102, 255, 0.15)', border: '1px solid rgba(0,102,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,102,255,0.2)' }}>
            <Icon.FoodBag />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>Burger Boss — Combo Doble</div>
            <div style={{ fontSize: 11, color: subColor }}>Repartidor: Carlos M. (Honda Wave #LF-04)</div>
          </div>
        </div>
        <div style={{ height: 6, background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '75%', background: 'linear-gradient(90deg, #0066FF, #00C853)', borderRadius: 10, boxShadow: '0 0 10px rgba(0,200,83,0.5)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: subColor, fontWeight: 700 }}>
          <span>Tienda</span>
          <span style={{ color: '#0066FF' }}>En camino</span>
          <span>Entregado</span>
        </div>
      </div>
    );
  }

  if (type === 'map_widget') {
    return (
      <div style={{ width: '100%', background: cardBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border, borderRadius: 22, padding: 18, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: innerShadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: textColor }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0066FF', boxShadow: '0 0 10px #0066FF' }} />
            Motorizado a 1.2 km
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#0066FF', background: 'rgba(0, 102, 255, 0.15)', border: '1px solid rgba(0,102,255,0.25)', padding: '3px 10px', borderRadius: 100 }}>28 km/h</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '12px 14px', fontSize: 12, border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 11, color: subColor, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <Icon.MapPin /> Burger Boss
          </span>
          <span style={{ flex: 1, borderTop: '1px dashed #0066FF', margin: '0 10px' }} />
          <span style={{ color: '#0066FF', display: 'flex', alignItems: 'center', filter: 'drop-shadow(0 0 6px rgba(0,102,255,0.6))' }}>
            <Icon.Bike />
          </span>
          <span style={{ flex: 1, borderTop: '1px dashed rgba(0,102,255,0.3)', margin: '0 10px' }} />
          <span style={{ fontSize: 11, color: subColor, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <Icon.Home /> Los Robles
          </span>
        </div>
        <div style={{ fontSize: 12, color: textColor, background: 'rgba(0, 102, 255, 0.12)', border: '1px solid rgba(0,102,255,0.2)', padding: '10px 14px', borderRadius: 14, borderLeft: '4px solid #0066FF', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon.Message />
          <span style={{ fontWeight: 500 }}>Carlos: "¡Ya voy llegando a la entrada principal!"</span>
        </div>
      </div>
    );
  }

  if (type === 'wallet_widget') {
    return (
      <div style={{ width: '100%', background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,102,255,0.18) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(0,102,255,0.1) 100%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border, borderRadius: 22, padding: 18, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: innerShadow }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#0066FF' }}>LOGIFAST PAY</div>
        <div style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 800, letterSpacing: 2, color: textColor, margin: '4px 0' }}>•••• •••• •••• 4920</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, color: subColor, fontWeight: 700 }}>TITULAR</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: textColor }}>MARÍA LÓPEZ</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, fontStyle: 'italic', color: textColor }}>VISA</div>
        </div>
        <div style={{ fontSize: 11, color: '#00C853', fontWeight: 700 }}>✓ Pago de C$ 180.00 verificado sin comisiones</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: cardBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border, borderRadius: 22, padding: 18, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: innerShadow }}>
      <div style={{ display: 'flex', gap: 4, color: '#FFB300' }}>
        {[...Array(5)].map((_, i) => <Icon.Star key={i} size={18} fill="#FFB300" />)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: textColor }}>5.0 Excelente Servicio</div>
      <div style={{ fontSize: 12, color: subColor, fontStyle: 'italic', lineHeight: 1.5 }}>
        "El servicio llegó súper rápido a Los Robles y el empaque impecable. ¡10/10!"
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: textColor, marginTop: 4 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0066FF', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,102,255,0.4)' }}>ML</div>
        <span style={{ fontWeight: 600 }}>María L. • Cliente Verificado</span>
      </div>
    </div>
  );
}

const PARTNERS = [
  { src: '/logos/image1.png', name: 'Alquinicsa', sector: 'Distribución' },
  { src: '/logos/image2.png', name: 'Delicias del Mar', sector: 'Restaurantes' },
  { src: '/logos/image3.png', name: 'Burger Boss', sector: 'Comida Rápida' },
  { src: '/logos/image4.png', name: 'Salud y Vida', sector: 'Farmacias' },
  { src: '/logos/image5.png', name: 'Autosym', sector: 'Talleres' },
  { src: '/logo.png', name: 'Logifast', sector: 'Logística Express' },
];

export default function AuthRedesign({ onLoginSuccess, currentView = 'landing' }: AuthRedesignProps) {
  const [view, setView] = useState<View>(currentView);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tema = useConfigStore((s) => s.tema);
  const setTema = useConfigStore((s) => s.setTema);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (
    tema === 'dark' ||
    (tema === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const toggleTheme = () => {
    setTema(isDark ? 'light' : 'dark');
  };

  useEffect(() => {
    setView(currentView);
  }, [currentView]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const targetHash = view === 'login' ? '#/login' : view === 'register' ? '#/register' : '#/';
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, [view]);

  // Auto-advance carrusel interactivo cada 5s
  useEffect(() => {
    if (view !== 'landing') return;
    const interval = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [view]);

  const bg = isDark ? '#08080C' : '#F5F5F9';
  const textColor = isDark ? '#F5F5F7' : '#1C1C1E';

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      color: textColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "DM Sans", sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background 0.35s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Dynamic Liquid Glass Background Lighting */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute',
          top: -140,
          left: '10%',
          width: 580,
          height: 580,
          background: isDark
            ? 'radial-gradient(circle, rgba(0, 122, 255, 0.22) 0%, rgba(88, 86, 214, 0.12) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, rgba(88, 86, 214, 0.05) 50%, transparent 70%)',
          filter: 'blur(140px)',
        }} />
        <div style={{
          position: 'absolute',
          top: '36%',
          right: -100,
          width: 520,
          height: 520,
          background: isDark
            ? 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(255, 149, 0, 0.08) 60%, transparent 70%)'
            : 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(255, 149, 0, 0.04) 60%, transparent 70%)',
          filter: 'blur(150px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -80,
          left: '25%',
          width: 620,
          height: 620,
          background: isDark
            ? 'radial-gradient(circle, rgba(0, 200, 83, 0.14) 0%, rgba(0, 122, 255, 0.1) 60%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 200, 83, 0.06) 0%, rgba(0, 122, 255, 0.04) 60%, transparent 70%)',
          filter: 'blur(160px)',
        }} />
      </div>

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <LandingView
              currentSlide={currentSlide}
              setCurrentSlide={setCurrentSlide}
              onLogin={() => setView('login')}
              onRegister={() => setView('register')}
              isDark={isDark}
              toggleTheme={toggleTheme}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />
          </motion.div>
        )}
        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <LoginView
              onBack={() => setView('landing')}
              onLoginSuccess={onLoginSuccess}
              onSwitchToRegister={() => setView('register')}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />
          </motion.div>
        )}
        {view === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <RegisterView
              onBack={() => setView('landing')}
              onLoginSuccess={onLoginSuccess}
              onSwitchToLogin={() => setView('login')}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LandingView({
  currentSlide,
  setCurrentSlide,
  onLogin,
  onRegister,
  isDark,
  toggleTheme,
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  currentSlide: number;
  setCurrentSlide: (n: number) => void;
  onLogin: () => void;
  onRegister: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (b: boolean) => void;
}) {
  const slide = SLIDES[currentSlide];
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#98989D' : '#636366';
  
  // Real frosted glass tokens
  const navBg = isDark ? 'rgba(12, 12, 16, 0.72)' : 'rgba(255, 255, 255, 0.78)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)';
  const specularBorder = isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(255, 255, 255, 0.85)';
  const glassCardBg = isDark ? 'rgba(22, 22, 30, 0.68)' : 'rgba(255, 255, 255, 0.82)';
  const glassShadow = isDark
    ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.16), 0 24px 60px rgba(0,0,0,0.5)'
    : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), 0 20px 50px rgba(0,102,255,0.07)';

  return (
    <div>
      {/* Ultra-Refined Liquid Glass Floating Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: navBg,
        backdropFilter: 'blur(36px) saturate(190%)',
        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
        borderBottom: border,
        padding: '14px 24px',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon.Logo size={36} />
            <span style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-0.03em', color: textColor }}>LOGIFAST</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                border: specularBorder,
                color: isDark ? '#FFB300' : '#0066FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.2)' : 'inset 0 1px 1px rgba(255,255,255,0.9)',
                transition: 'all 0.25s ease',
              }}
              title={isDark ? 'Cambiar a Modo Día (Claro)' : 'Cambiar a Modo Noche (Oscuro)'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Icon.Sun /> : <Icon.Moon />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onLogin}
              style={{
                background: 'transparent',
                border: 'none',
                color: textColor,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '9px 18px',
                borderRadius: 100,
              }}
            >
              Iniciar sesión
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onRegister}
              style={{
                background: 'linear-gradient(180deg, #1A8CFF 0%, #0066FF 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '10px 24px',
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 6px 20px rgba(0,102,255,0.45)',
              }}
            >
              Registrarse
            </motion.button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 8 }}
            >
              {mobileMenuOpen ? <Icon.Close /> : <Icon.Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{ padding: '16px 0', borderTop: border, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a href="#ecosistema" onClick={() => setMobileMenuOpen(false)} style={{ color: textColor, textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Ecosistema</a>
            <a href="#aliados" onClick={() => setMobileMenuOpen(false)} style={{ color: textColor, textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Aliados</a>
            <a href="#cta" onClick={() => setMobileMenuOpen(false)} style={{ color: textColor, textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Contacto</a>
          </div>
        )}
      </header>

      {/* HERO SECTION CON CRISTAL LÍQUIDO */}
      <section style={{ padding: '56px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            
            {/* Pill Badge con resplandor líquido */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: isDark ? 'rgba(0, 102, 255, 0.15)' : 'rgba(0, 102, 255, 0.08)',
              border: isDark ? '1px solid rgba(0, 122, 255, 0.35)' : '1px solid rgba(0, 102, 255, 0.25)',
              color: '#007AFF',
              padding: '7px 20px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
              width: 'fit-content',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 16px rgba(0,102,255,0.2)',
              backdropFilter: 'blur(20px)',
            }}>
              <Icon.Sparkles />
              <span>Tecnología que mueve tu logística</span>
            </div>

            {/* Titular Principal Hero */}
            <h1 style={{ fontSize: 'clamp(38px, 6vw, 58px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', color: textColor, margin: 0 }}>
              El control total de tu logística
            </h1>

            {/* Subtítulo Hero */}
            <p style={{ fontSize: 'clamp(16px, 2.1vw, 18px)', lineHeight: 1.6, color: subColor, margin: 0, maxWidth: 540 }}>
              Automatiza tus envíos, asigna repartidores, monitorea cada entrega en tiempo real y administra toda tu operación desde una plataforma inteligente diseñada para hacer crecer tu negocio.
            </p>

            {/* Botones táctiles nativos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onRegister}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(180deg, #1A8CFF 0%, #0066FF 100%)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '16px 36px',
                  borderRadius: 100,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 10px 30px rgba(0,102,255,0.45)',
                }}
              >
                <span>Comenzar ahora</span>
                <Icon.ArrowRight />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onLogin}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                  color: textColor,
                  border: specularBorder,
                  padding: '16px 30px',
                  borderRadius: 100,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(24px)',
                  boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.1)' : 'inset 0 1px 1.5px rgba(255,255,255,0.9), 0 4px 14px rgba(0,0,0,0.04)',
                }}
              >
                Explorar Demo
              </motion.button>
            </div>

            {/* Quick Stats Grid con textura de vidrio */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14, paddingTop: 24, borderTop: border }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', padding: '12px 14px', borderRadius: 16, border: border, backdropFilter: 'blur(16px)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>2.5k+</div>
                <div style={{ fontSize: 11, color: subColor, fontWeight: 600, marginTop: 2 }}>Envíos realizados</div>
              </div>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', padding: '12px 14px', borderRadius: 16, border: border, backdropFilter: 'blur(16px)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>15 min</div>
                <div style={{ fontSize: 11, color: subColor, fontWeight: 600, marginTop: 2 }}>Tiempo promedio</div>
              </div>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', padding: '12px 14px', borderRadius: 16, border: border, backdropFilter: 'blur(16px)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: textColor, display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '-0.02em' }}>
                  <span>4.9</span>
                  <Icon.Star size={18} fill="#FFB300" />
                </div>
                <div style={{ fontSize: 11, color: subColor, fontWeight: 600, marginTop: 2 }}>Calificación</div>
              </div>
            </div>
          </div>

          {/* Carrusel Interactivo dentro de Marco Cristalino Realista */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: 470,
              padding: 28,
              borderRadius: 36,
              background: glassCardBg,
              backdropFilter: 'blur(40px) saturate(190%)',
              WebkitBackdropFilter: 'blur(40px) saturate(190%)',
              border: specularBorder,
              boxShadow: glassShadow,
              textAlign: 'center',
              position: 'relative',
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div style={{ width: '100%', marginBottom: 24 }}>
                    <AppleSlideWidget type={slide.widgetType} isDark={isDark} />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: textColor, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{slide.title}</h2>
                  <p style={{ fontSize: 14, color: subColor, margin: '0 0 22px', lineHeight: 1.5 }}>{slide.subtitle}</p>
                </motion.div>
              </AnimatePresence>

              {/* Indicadores de Píldora tipo iOS */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    style={{
                      width: i === currentSlide ? 28 : 8,
                      height: 7,
                      borderRadius: 100,
                      background: i === currentSlide ? '#007AFF' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'),
                      boxShadow: i === currentSlide ? '0 0 10px rgba(0,122,255,0.6)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN ALIADOS ESTRATÉGICOS */}
      <section id="aliados" style={{ padding: '54px 24px', borderTop: border, borderBottom: border, background: isDark ? 'rgba(12,12,18,0.45)' : 'rgba(255,255,255,0.4)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#007AFF', letterSpacing: '0.14em', marginBottom: 8 }}>ALIADOS ESTRATÉGICOS</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: textColor, margin: '0 0 32px', letterSpacing: '-0.02em' }}>Comercios Verificados en Managua</h2>
          <div style={{ overflow: 'hidden', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PARTNERS.map((partner, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, scale: 1.02 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 24px',
                  borderRadius: 22,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(20px)',
                  border: specularBorder,
                  minWidth: 190,
                  boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.3)' : 'inset 0 1px 1.5px rgba(255,255,255,0.9), 0 8px 20px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                }}
              >
                <img src={partner.src} alt={partner.name} style={{ width: 34, height: 34, objectFit: 'contain' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>{partner.name}</div>
                  <div style={{ fontSize: 11, color: subColor, fontWeight: 500 }}>{partner.sector}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN ECOSISTEMA (4 TARJETAS CON CRISTAL LÍQUIDO ESPECULAR) */}
      <section id="ecosistema" style={{ padding: '84px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#007AFF', letterSpacing: '0.14em' }}>ROLES Y HERRAMIENTAS</span>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 800, color: textColor, margin: '10px 0 0', letterSpacing: '-0.03em' }}>
            Todo tu ecosistema logístico en una sola plataforma.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {/* Card 1: Portal de Clientes */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            style={{
              background: glassCardBg,
              backdropFilter: 'blur(36px) saturate(190%)',
              WebkitBackdropFilter: 'blur(36px) saturate(190%)',
              border: specularBorder,
              borderRadius: 28,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: glassShadow,
              transition: 'all 0.25s ease',
            }}
          >
            <div>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(0, 122, 255, 0.14)', border: '1px solid rgba(0,122,255,0.3)', color: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(0,122,255,0.25)' }}>
                <Icon.User />
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: textColor, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Portal de Clientes</h3>
              <p style={{ fontSize: 14, color: subColor, margin: 0, lineHeight: 1.65 }}>
                Gestiona tus envíos desde un solo lugar. Cotiza al instante, programa entregas y consulta el estado de cada pedido con total transparencia.
              </p>
            </div>
            <div style={{ marginTop: 26, fontSize: 12, fontWeight: 800, color: '#00C853', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 10px #00C853' }} /> Monitoreo en vivo
            </div>
          </motion.div>

          {/* Card 2: Panel de Repartidores */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            style={{
              background: glassCardBg,
              backdropFilter: 'blur(36px) saturate(190%)',
              WebkitBackdropFilter: 'blur(36px) saturate(190%)',
              border: specularBorder,
              borderRadius: 28,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: glassShadow,
              transition: 'all 0.25s ease',
            }}
          >
            <div>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(0, 200, 83, 0.14)', border: '1px solid rgba(0,200,83,0.3)', color: '#00C853', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(0,200,83,0.25)' }}>
                <Icon.Bike />
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: textColor, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Panel de Repartidores</h3>
              <p style={{ fontSize: 14, color: subColor, margin: 0, lineHeight: 1.65 }}>
                Recibe pedidos cercanos, optimiza tus recorridos y administra tus ganancias desde una interfaz rápida, intuitiva y conectada en tiempo real.
              </p>
            </div>
            <div style={{ marginTop: 26, fontSize: 12, fontWeight: 800, color: '#007AFF', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#007AFF', boxShadow: '0 0 10px #007AFF' }} /> Rutas satelitales
            </div>
          </motion.div>

          {/* Card 3: Consola de Control */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            style={{
              background: glassCardBg,
              backdropFilter: 'blur(36px) saturate(190%)',
              WebkitBackdropFilter: 'blur(36px) saturate(190%)',
              border: specularBorder,
              borderRadius: 28,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: glassShadow,
              transition: 'all 0.25s ease',
            }}
          >
            <div>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(124, 58, 237, 0.14)', border: '1px solid rgba(124,58,237,0.3)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(124,58,237,0.25)' }}>
                <Icon.Shield />
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: textColor, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Consola de Control</h3>
              <p style={{ fontSize: 14, color: subColor, margin: 0, lineHeight: 1.65 }}>
                Supervisa toda la operación desde un solo panel. Controla pedidos, repartidores, indicadores y rendimiento operativo en tiempo real.
              </p>
            </div>
            <div style={{ marginTop: 26, fontSize: 12, fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7C3AED', boxShadow: '0 0 10px #7C3AED' }} /> Auditoría total
            </div>
          </motion.div>

          {/* Card 4: Gestión Inteligente de Flota */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            style={{
              background: glassCardBg,
              backdropFilter: 'blur(36px) saturate(190%)',
              WebkitBackdropFilter: 'blur(36px) saturate(190%)',
              border: specularBorder,
              borderRadius: 28,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: glassShadow,
              transition: 'all 0.25s ease',
            }}
          >
            <div>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(255, 149, 0, 0.14)', border: '1px solid rgba(255,149,0,0.3)', color: '#FF9500', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(255,149,0,0.25)' }}>
                <Icon.Wrench />
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: textColor, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Gestión Inteligente de Flota</h3>
              <p style={{ fontSize: 14, color: subColor, margin: 0, lineHeight: 1.65 }}>
                Programa mantenimientos preventivos, controla el estado de cada motocicleta y reduce tiempos de inactividad mediante alertas automáticas. Controla tu flota, supervisa mantenimientos y administra repuestos desde un solo lugar.
              </p>
            </div>
            <div style={{ marginTop: 26, fontSize: 12, fontWeight: 800, color: '#FF9500', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF9500', boxShadow: '0 0 10px #FF9500' }} /> Telemetría preventiva
            </div>
          </motion.div>
        </div>
      </section>

      {/* SUPER BANNER CTA CRISTALINO */}
      <section id="cta" style={{ padding: '40px 24px 96px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(0, 102, 255, 0.22) 0%, rgba(22, 22, 32, 0.85) 100%)'
            : 'linear-gradient(135deg, rgba(0, 102, 255, 0.12) 0%, rgba(255, 255, 255, 0.92) 100%)',
          backdropFilter: 'blur(40px) saturate(190%)',
          WebkitBackdropFilter: 'blur(40px) saturate(190%)',
          border: specularBorder,
          borderRadius: 36,
          padding: '58px 36px',
          textAlign: 'center',
          boxShadow: glassShadow,
        }}>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 800, color: textColor, margin: '0 0 16px', letterSpacing: '-0.03em' }}>
            Tecnología que mueve tu logística.
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: subColor, maxWidth: 660, margin: '0 auto 34px', lineHeight: 1.65 }}>
            Centraliza tus envíos, automatiza tus procesos y mantén el control de cada entrega desde una plataforma inteligente creada para impulsar el crecimiento de tu negocio.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onRegister}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(180deg, #1A8CFF 0%, #0066FF 100%)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '16px 40px',
                borderRadius: 100,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 10px 30px rgba(0,102,255,0.45)',
              }}
            >
              <span>Comenzar ahora</span>
              <Icon.ArrowRight />
            </motion.button>
            <motion.a
              whileTap={{ scale: 0.95 }}
              href="https://wa.me/50588888888?text=Hola%20LOGIFAST,%20deseo%20m%C3%A1s%20informaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                color: textColor,
                border: specularBorder,
                padding: '16px 32px',
                borderRadius: 100,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
                backdropFilter: 'blur(24px)',
                boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.1)' : 'inset 0 1px 1.5px rgba(255,255,255,0.9)',
              }}
            >
              <Icon.Headphones />
              <span>Contactar a soporte</span>
            </motion.a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 24px', background: isDark ? '#06060A' : '#EBEBF0', borderTop: border, textAlign: 'center', color: subColor, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <Icon.Logo size={28} />
          <span style={{ fontWeight: 800, color: textColor }}>LOGIFAST</span>
        </div>
        <p>© {new Date().getFullYear()} LOGIFAST Nicaragua. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

function LoginView({
  onBack,
  onLoginSuccess,
  onSwitchToRegister,
  isDark,
  toggleTheme,
}: {
  onBack: () => void;
  onLoginSuccess: (role: string, name: string) => void;
  onSwitchToRegister: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#98989D' : '#636366';
  const specularBorder = isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(255, 255, 255, 0.85)';
  const glassBg = isDark ? 'rgba(20, 20, 28, 0.78)' : 'rgba(255, 255, 255, 0.88)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.035)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Correo inválido';
    if (!password) errs.password = 'La contraseña es obligatoria';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.ok) {
        sileo.error({ title: data.error || 'Credenciales no válidas' });
        return;
      }

      sileo.success({ title: `¡Bienvenido, ${data.user.name}!`, description: 'Ingresando al sistema...' });
      onLoginSuccess(data.user.role, data.user.name);
    } catch {
      setLoading(false);
      sileo.error({ title: 'Error al conectar con el servidor' });
    }
  };

  const demoLogin = async (role: 'cliente' | 'repartidor' | 'admin' | 'ingeniero') => {
    const creds: Record<string, { email: string; password: string; name: string }> = {
      cliente: { email: 'cliente@logifast.com', password: '123456', name: 'María López' },
      repartidor: { email: 'repartidor@logifast.com', password: '123456', name: 'Carlos Martínez' },
      admin: { email: 'admin@logifast.com', password: '123456', name: 'Administrador' },
      ingeniero: { email: 'ingeniero@logifast.com', password: '123456', name: 'Ingeniero Demo' },
    };
    const cred = creds[role];
    setEmail(cred.email);
    setPassword(cred.password);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cred.email, password: cred.password }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.ok) {
        sileo.success({ title: `¡Sesión iniciada como ${cred.name}!` });
        onLoginSuccess(role, cred.name);
      } else {
        sileo.error({ title: 'Error en acceso demo' });
      }
    } catch {
      setLoading(false);
      sileo.error({ title: 'Error de conexión' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: subColor, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <Icon.ArrowLeft />
          <span>Volver a la portada</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleTheme}
          style={{ width: 42, height: 42, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', border: specularBorder, color: isDark ? '#FFB300' : '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {isDark ? <Icon.Sun /> : <Icon.Moon />}
        </motion.button>
      </div>

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 440,
          background: glassBg,
          backdropFilter: 'blur(40px) saturate(190%)',
          WebkitBackdropFilter: 'blur(40px) saturate(190%)',
          border: specularBorder,
          borderRadius: 36,
          padding: '44px 34px',
          boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.18), 0 30px 80px rgba(0,0,0,0.7)' : 'inset 0 1px 1.5px rgba(255,255,255,0.95), 0 20px 60px rgba(0,0,0,0.08)',
          textAlign: 'center',
          marginTop: 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <Icon.Logo size={52} />
          <h2 style={{ fontSize: 26, fontWeight: 800, color: textColor, margin: '14px 0 4px', letterSpacing: '-0.03em' }}>Iniciar Sesión</h2>
          <p style={{ fontSize: 13, color: subColor, margin: 0 }}>Ingresa tus credenciales para acceder a LOGIFAST</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Correo Electrónico</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 16, color: subColor }}><Icon.Mail /></span>
              <input
                type="email"
                placeholder="ejemplo@logifast.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 16px 0 46px', color: textColor, fontSize: 15, outline: 'none' }}
              />
            </div>
            {errors.email && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.email}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Contraseña</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 16, color: subColor }}><Icon.Lock /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 46px 0 46px', color: textColor, fontSize: 15, outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, background: 'transparent', border: 'none', color: subColor, cursor: 'pointer', display: 'flex', padding: 4 }}
              >
                {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
            {errors.password && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.password}</span>}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 50,
              borderRadius: 100,
              background: 'linear-gradient(180deg, #1A8CFF 0%, #0066FF 100%)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.25)',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: 8,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 24px rgba(0,102,255,0.45)',
            }}
          >
            {loading ? <MiniSpinner size={18} color="white" /> : 'Ingresar a mi cuenta'}
            {!loading && <Icon.ArrowRight />}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', margin: '28px 0 16px' }}>
          <span style={{ fontSize: 11, color: subColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Acceso Demo Instantáneo</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { role: 'cliente' as const, label: 'Cliente', icon: <Icon.User /> },
            { role: 'repartidor' as const, label: 'Repartidor', icon: <Icon.Bike /> },
            { role: 'admin' as const, label: 'Admin', icon: <Icon.Shield /> },
            { role: 'ingeniero' as const, label: 'Ingeniero', icon: <Icon.Store /> },
          ].map((d) => (
            <motion.button
              key={d.role}
              whileTap={{ scale: 0.94 }}
              onClick={() => demoLogin(d.role)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: 12,
                borderRadius: 16,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                border: specularBorder,
                color: textColor,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.1)' : 'inset 0 1px 1.5px rgba(255,255,255,0.9)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </motion.button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: subColor, marginTop: 28 }}>
          ¿No tienes cuenta?{' '}
          <button type="button" onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#007AFF', fontWeight: 800, cursor: 'pointer' }}>Regístrate gratis</button>
        </p>
      </motion.div>
    </div>
  );
}

function RegisterView({
  onBack,
  onLoginSuccess,
  onSwitchToLogin,
  isDark,
  toggleTheme,
}: {
  onBack: () => void;
  onLoginSuccess: (role: string, name: string) => void;
  onSwitchToLogin: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    cedula: '',
    departamento: 'Managua',
    municipio: 'Managua',
    direccion: '',
    lat: 12.1365,
    lng: -86.2514,
    fotoUrl: '',
    role: 'cliente' as 'cliente' | 'repartidor',
    vehiculoTipo: 'moto',
    vehiculoMarca: '',
    vehiculoModelo: '',
    vehiculoAnio: 2024,
    vehiculoColor: '',
    vehiculoPlaca: '',
    zonaPreferida: 'Managua Centro',
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#98989D' : '#636366';
  const specularBorder = isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(255, 255, 255, 0.85)';
  const glassBg = isDark ? 'rgba(20, 20, 28, 0.78)' : 'rgba(255, 255, 255, 0.88)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.035)';

  const DEPARTAMENTOS = [
    'Managua', 'Masaya', 'León', 'Granada', 'Estelí', 'Chinandega',
    'Matagalpa', 'Carazo', 'Rivas', 'Chontales', 'Jinotega', 'Nueva Segovia',
  ];

  const MUNICIPIOS: Record<string, string[]> = {
    Managua: ['Managua', 'Ciudad Sandino', 'Tipitapa', 'Ticuantepe', 'Mateare', 'San Rafael del Sur'],
    Masaya: ['Masaya', 'Monimbó', 'Nindirí', 'Tisma', 'La Concepción', 'Catarina', 'Niquinohomo'],
    León: ['León', 'Nagarote', 'La Paz Centro', 'El Jícaral', 'Telica', 'Sutiaba'],
    Granada: ['Granada', 'Diriomo', 'Diriá', 'Nandaime'],
    Estelí: ['Estelí', 'Condega', 'Pueblo Nuevo', 'San Juan de Limay'],
    Chinandega: ['Chinandega', 'El Viejo', 'Corinto', 'Chichigalpa', 'Somotillo'],
    Matagalpa: ['Matagalpa', 'Sebaco', 'Sébaco', 'San Ramón', 'Matiguás'],
    Carazo: ['Jinotepe', 'Diriamba', 'San Marcos', 'Santa Teresa'],
    Rivas: ['Rivas', 'San Juan del Sur', 'Tola', 'Moyogalpa'],
    Chontales: ['Juigalpa', 'Acoyapa', 'Santo Tomás'],
    Jinotega: ['Jinotega', 'San Rafael del Norte', 'La Concordia'],
    'Nueva Segovia': ['Ocotal', 'Jalapa', 'Jícaro'],
  };

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      sileo.error({ title: 'Tu navegador no soporta geolocalización GPS' });
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setGpsCaptured(true);
        setGettingGps(false);
        sileo.success({
          title: 'GPS Capturado',
          description: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`,
        });
      },
      () => {
        setGettingGps(false);
        sileo.error({ title: 'Error al obtener la ubicación GPS' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) {
      errs.name = 'Escribe tu nombre completo (mínimo 3 letras)';
    }
    if (!form.email) errs.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Correo electrónico inválido';

    if (!form.password) errs.password = 'La contraseña es obligatoria';
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirm) errs.confirm = 'Las contraseñas no coinciden';

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!form.phone || cleanPhone.length < 8) {
      errs.phone = 'Teléfono nicaragüense obligatorio (8 dígitos)';
    }

    const cedulaRegex = /^\d{3}-?\d{6}-?\d{4}[A-Za-z]$/;
    const cleanCedula = (form.cedula || '').replace(/\s+/g, '');
    if (!cleanCedula || !cedulaRegex.test(cleanCedula)) {
      errs.cedula = 'Formato de cédula inválido (ej: 001-120495-0002E)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.fotoUrl) {
      errs.fotoUrl = 'La foto de perfil es obligatoria para verificar tu identidad';
    }
    if (!form.municipio) errs.municipio = 'Selecciona tu Municipio';
    if (!form.direccion.trim() || form.direccion.trim().length < 6) {
      errs.direccion = 'Escribe tu dirección física exacta y referencia';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.terms) errs.terms = 'Debes aceptar los Términos y Condiciones';

    if (form.role === 'repartidor') {
      if (['moto', 'auto'].includes(form.vehiculoTipo)) {
        if (!form.vehiculoMarca.trim()) errs.vehiculoMarca = 'Marca obligatoria';
        if (!form.vehiculoModelo.trim()) errs.vehiculoModelo = 'Modelo obligatorio';
        if (!form.vehiculoPlaca.trim()) errs.vehiculoPlaca = 'Placa oficial obligatoria (ej: M-123456)';
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          telefono: form.phone,
          cedula: form.cedula,
          departamento: form.departamento,
          municipio: form.municipio,
          direccion: form.direccion,
          lat: form.lat,
          lng: form.lng,
          fotoUrl: form.fotoUrl,
          role: form.role,
          vehiculoTipo: form.vehiculoTipo,
          vehiculoMarca: form.vehiculoMarca,
          vehiculoModelo: form.vehiculoModelo,
          vehiculoAnio: form.vehiculoAnio,
          vehiculoColor: form.vehiculoColor,
          vehiculoPlaca: form.vehiculoPlaca,
          zonaPreferida: form.zonaPreferida,
        }),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        setLoading(false);
        sileo.error({ title: 'Respuesta de servidor no válida. Intenta de nuevo.' });
        return;
      }
      setLoading(false);

      if (!res.ok || !data.ok) {
        sileo.error({ title: data.error || 'Error al registrar la cuenta' });
        return;
      }

      sileo.success({ title: `Bienvenido a LOGIFAST, ${data.user.name}`, description: 'Cuenta registrada exitosamente.' });
      onLoginSuccess(data.user.role, data.user.name);
    } catch {
      setLoading(false);
      sileo.error({ title: 'Error de conexión con el servidor' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: subColor, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <Icon.ArrowLeft />
          <span>Volver a la portada</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleTheme}
          style={{ width: 42, height: 42, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', border: specularBorder, color: isDark ? '#FFB300' : '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {isDark ? <Icon.Sun /> : <Icon.Moon />}
        </motion.button>
      </div>

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 500,
          background: glassBg,
          backdropFilter: 'blur(40px) saturate(190%)',
          WebkitBackdropFilter: 'blur(40px) saturate(190%)',
          border: specularBorder,
          borderRadius: 36,
          padding: '42px 34px',
          boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.18), 0 30px 80px rgba(0,0,0,0.7)' : 'inset 0 1px 1.5px rgba(255,255,255,0.95), 0 20px 60px rgba(0,0,0,0.08)',
          textAlign: 'center',
          marginTop: 40,
        }}
      >
        {/* Step Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
          <Icon.Logo size={46} />
          <h2 style={{ fontSize: 24, fontWeight: 800, color: textColor, margin: '12px 0 4px', letterSpacing: '-0.03em' }}>
            {step === 1 ? 'Paso 1: Identificación Legal' : step === 2 ? 'Paso 2: Foto de Perfil & GPS' : 'Paso 3: Perfil & Vehículo'}
          </h2>
          <p style={{ fontSize: 13, color: subColor, margin: 0 }}>
            {step === 1 ? 'Datos personales y cédula de Nicaragua' : step === 2 ? 'Fotografía verificada y ubicación GPS' : 'Selecciona tu rol y vehículo'}
          </p>

          {/* Dynamic iOS Pills Stepper */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: s === step ? 32 : 10,
                  height: 6,
                  borderRadius: 100,
                  background: s <= step ? '#007AFF' : (isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.15)'),
                  boxShadow: s === step ? '0 0 10px rgba(0,122,255,0.6)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* PASO 1 */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); if (validateStep1()) setStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Nombre Completo *</label>
              <input
                type="text"
                placeholder="María López Vanegas"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 16px', color: textColor, fontSize: 15, outline: 'none', marginTop: 4 }}
              />
              {errors.name && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.name}</span>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Correo Electrónico *</label>
              <input
                type="email"
                placeholder="maria@empresa.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 16px', color: textColor, fontSize: 15, outline: 'none', marginTop: 4 }}
              />
              {errors.email && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.email}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Teléfono Móvil *</label>
                <input
                  type="tel"
                  placeholder="8888-8888"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 16px', color: textColor, fontSize: 15, outline: 'none', marginTop: 4 }}
                />
                {errors.phone && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.phone}</span>}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Cédula NI *</label>
                <input
                  type="text"
                  placeholder="001-120495-0002E"
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value.toUpperCase() })}
                  style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 16px', color: textColor, fontSize: 14, outline: 'none', marginTop: 4 }}
                />
                {errors.cedula && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.cedula}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Contraseña *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 16px', color: textColor, fontSize: 15, outline: 'none', marginTop: 4 }}
                />
                {errors.password && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.password}</span>}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Confirmar Contraseña *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 16px', color: textColor, fontSize: 15, outline: 'none', marginTop: 4 }}
                />
                {errors.confirm && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.confirm}</span>}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 100, background: 'linear-gradient(180deg, #1A8CFF 0%, #0066FF 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 12, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 24px rgba(0,102,255,0.45)' }}
            >
              Siguiente: Foto & Ubicación <Icon.ArrowRight />
            </motion.button>
          </form>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); if (validateStep2()) setStep(3); }} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: textColor, display: 'block', marginBottom: 8 }}>
                Foto de Perfil Verificada * (Requerida)
              </label>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ImageUploader
                  categoria="perfil"
                  onUploaded={(url) => {
                    setForm((prev) => ({ ...prev, fotoUrl: url }));
                    setErrors((errs) => ({ ...errs, fotoUrl: '' }));
                  }}
                  label="Subir Foto de Perfil"
                  aspectRatio="square"
                  rounded="full"
                  previewUrl={form.fotoUrl || null}
                  className="w-24 h-24"
                />
              </div>
              {errors.fotoUrl && <span style={{ fontSize: 11, color: '#FF3B30', textAlign: 'center', display: 'block', marginTop: 4 }}>{errors.fotoUrl}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Departamento *</label>
                <select
                  value={form.departamento}
                  onChange={(e) => {
                    const dep = e.target.value;
                    const muns = MUNICIPIOS[dep] || [dep];
                    setForm({ ...form, departamento: dep, municipio: muns[0] });
                  }}
                  style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 14px', color: textColor, fontSize: 14, outline: 'none', marginTop: 4 }}
                >
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d} value={d} style={{ background: isDark ? '#1C1C24' : '#FFFFFF', color: textColor }}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Municipio *</label>
                <select
                  value={form.municipio}
                  onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                  style={{ width: '100%', height: 48, borderRadius: 14, background: inputBg, border: specularBorder, padding: '0 14px', color: textColor, fontSize: 14, outline: 'none', marginTop: 4 }}
                >
                  {(MUNICIPIOS[form.departamento] || [form.departamento]).map((m) => (
                    <option key={m} value={m} style={{ background: isDark ? '#1C1C24' : '#FFFFFF', color: textColor }}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Captura de Ubicación GPS con estilo satelital */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Dirección y Referencia Residencial *</label>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  type="button"
                  onClick={handleGetGps}
                  disabled={gettingGps}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: gpsCaptured ? 'rgba(76,175,80,0.18)' : 'rgba(0,122,255,0.15)',
                    border: gpsCaptured ? '1px solid #4CAF50' : '1px solid rgba(0,122,255,0.35)',
                    color: gpsCaptured ? '#4CAF50' : '#007AFF',
                    padding: '6px 14px',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: gpsCaptured ? '0 0 12px rgba(76,175,80,0.3)' : '0 0 10px rgba(0,122,255,0.2)',
                  }}
                >
                  <span>{gettingGps ? 'Capturando GPS...' : gpsCaptured ? 'GPS Confirmado' : 'Capturar GPS'}</span>
                </motion.button>
              </div>
              <textarea
                placeholder="De la Estatua de Montoya 1c abajo, 2c al sur, casa portón negro"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                rows={2}
                style={{ width: '100%', borderRadius: 14, background: inputBg, border: specularBorder, padding: '12px 16px', color: textColor, fontSize: 14, outline: 'none' }}
              />
              {errors.direccion && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.direccion}</span>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setStep(1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 22px', height: 50, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: specularBorder, color: textColor, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                <Icon.ArrowLeft /> Atrás
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 100, background: 'linear-gradient(180deg, #1A8CFF 0%, #0066FF 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 24px rgba(0,102,255,0.45)' }}
              >
                Siguiente: Seleccionar Perfil <Icon.ArrowRight />
              </motion.button>
            </div>
          </form>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { value: 'cliente' as const, label: 'Cliente', desc: 'Pido envíos y productos', icon: <Icon.User /> },
                { value: 'repartidor' as const, label: 'Repartidor', icon: <Icon.Bike />, desc: 'Realizo entregas con mi vehículo' },
              ].map((r) => (
                <motion.button
                  key={r.value}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '18px 14px',
                    borderRadius: 20,
                    background: form.role === r.value ? (isDark ? 'rgba(0,122,255,0.18)' : 'rgba(0,122,255,0.1)') : inputBg,
                    border: form.role === r.value ? '2px solid #007AFF' : specularBorder,
                    boxShadow: form.role === r.value ? '0 0 16px rgba(0,122,255,0.3)' : 'none',
                    color: textColor,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ color: '#007AFF', marginBottom: 6 }}>{r.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{r.desc}</div>
                </motion.button>
              ))}
            </div>

            {/* SECCIÓN REPARTIDOR */}
            {form.role === 'repartidor' && (
              <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)', padding: 18, borderRadius: 20, border: specularBorder, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#007AFF' }}>Registro Técnico del Vehículo</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textColor }}>Tipo de Vehículo *</label>
                    <select
                      value={form.vehiculoTipo}
                      onChange={(e) => setForm({ ...form, vehiculoTipo: e.target.value })}
                      style={{ width: '100%', height: 42, borderRadius: 12, background: inputBg, border: specularBorder, padding: '0 10px', color: textColor, fontSize: 13, outline: 'none' }}
                    >
                      <option value="moto" style={{ background: isDark ? '#1C1C24' : '#FFFFFF', color: textColor }}>Moto</option>
                      <option value="bicicleta" style={{ background: isDark ? '#1C1C24' : '#FFFFFF', color: textColor }}>Bicicleta</option>
                      <option value="auto" style={{ background: isDark ? '#1C1C24' : '#FFFFFF', color: textColor }}>Auto / Camioneta</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textColor }}>Placa Oficial *</label>
                    <input
                      type="text"
                      placeholder="M-123456"
                      value={form.vehiculoPlaca}
                      onChange={(e) => setForm({ ...form, vehiculoPlaca: e.target.value.toUpperCase() })}
                      style={{ width: '100%', height: 42, borderRadius: 12, background: inputBg, border: specularBorder, padding: '0 12px', color: textColor, fontSize: 13, outline: 'none' }}
                    />
                    {errors.vehiculoPlaca && <span style={{ fontSize: 10, color: '#FF3B30' }}>{errors.vehiculoPlaca}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textColor }}>Marca *</label>
                    <input
                      type="text"
                      placeholder="Honda/TVS"
                      value={form.vehiculoMarca}
                      onChange={(e) => setForm({ ...form, vehiculoMarca: e.target.value })}
                      style={{ width: '100%', height: 42, borderRadius: 12, background: inputBg, border: specularBorder, padding: '0 10px', color: textColor, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textColor }}>Modelo *</label>
                    <input
                      type="text"
                      placeholder="Wave 110"
                      value={form.vehiculoModelo}
                      onChange={(e) => setForm({ ...form, vehiculoModelo: e.target.value })}
                      style={{ width: '100%', height: 42, borderRadius: 12, background: inputBg, border: specularBorder, padding: '0 10px', color: textColor, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textColor }}>Año</label>
                    <input
                      type="number"
                      placeholder="2023"
                      value={form.vehiculoAnio}
                      onChange={(e) => setForm({ ...form, vehiculoAnio: Number(e.target.value) })}
                      style={{ width: '100%', height: 42, borderRadius: 12, background: inputBg, border: specularBorder, padding: '0 10px', color: textColor, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} style={{ accentColor: '#007AFF', width: 16, height: 16 }} />
              <span style={{ fontSize: 12, color: subColor }}>Acepto el <a href="#" style={{ color: '#007AFF', fontWeight: 600 }}>Contrato de Servicio</a> y la <a href="#" style={{ color: '#007AFF', fontWeight: 600 }}>Privacidad</a>.</span>
            </label>
            {errors.terms && <span style={{ fontSize: 11, color: '#FF3B30' }}>{errors.terms}</span>}

            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setStep(2)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 22px', height: 50, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: specularBorder, color: textColor, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                <Icon.ArrowLeft /> Atrás
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={loading}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 100, background: 'linear-gradient(180deg, #1A8CFF 0%, #0066FF 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 24px rgba(0,102,255,0.45)' }}
              >
                {loading ? <MiniSpinner size={18} color="white" /> : 'Finalizar Registro'} {!loading && <Icon.ArrowRight />}
              </motion.button>
            </div>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: subColor, marginTop: 26 }}>
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#007AFF', fontWeight: 800, cursor: 'pointer' }}>Inicia sesión</button>
        </p>
      </motion.div>
    </div>
  );
}
