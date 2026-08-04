'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sileo } from 'sileo';
import { useConfigStore } from '@/store/configStore';
import { MiniSpinner } from '@/components/ui/loaders';

type View = 'landing' | 'login' | 'register';

interface AuthRedesignProps {
  onLoginSuccess: (role: string, name: string) => void;
  currentView?: View;
}

const Icon = {
  Mail: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="3"/>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
        filter: 'drop-shadow(0 4px 12px rgba(0,102,255,0.5))',
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
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#FFFFFF' : 'var(--text)';
  const subColor = isDark ? '#86868B' : 'var(--text-secondary)';

  if (type === 'order_widget') {
    return (
      <div style={{ width: '100%', background: cardBg, border, borderRadius: 20, padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#00C853' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 8px #00C853' }} />
            EN CAMINO • ETA 12 MIN
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: textColor }}>C$ 240.00</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0, 102, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.FoodBag />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>Burger Boss — Combo Doble</div>
            <div style={{ fontSize: 11, color: subColor }}>Repartidor: Carlos M. (Honda Wave #LF-04)</div>
          </div>
        </div>
        <div style={{ height: 4, background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '75%', background: 'linear-gradient(90deg, #0066FF, #00C853)', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: subColor, fontWeight: 600 }}>
          <span>Tienda</span>
          <span>En camino</span>
          <span>Entregado</span>
        </div>
      </div>
    );
  }

  if (type === 'map_widget') {
    return (
      <div style={{ width: '100%', background: cardBg, border, borderRadius: 20, padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: textColor }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0066FF' }} />
            Motorizado a 1.2 km
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0066FF', background: 'rgba(0, 102, 255, 0.15)', padding: '2px 8px', borderRadius: 100 }}>28 km/h</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)', borderRadius: 12, padding: '10px 14px', fontSize: 12, border }}>
          <span style={{ fontSize: 11, color: subColor, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon.MapPin /> Burger Boss
          </span>
          <span style={{ flex: 1, borderTop: '1px dashed #0066FF', margin: '0 10px' }} />
          <span style={{ color: '#0066FF', display: 'flex', alignItems: 'center' }}>
            <Icon.Bike />
          </span>
          <span style={{ flex: 1, borderTop: '1px dashed rgba(0,102,255,0.3)', margin: '0 10px' }} />
          <span style={{ fontSize: 11, color: subColor, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon.Home /> Los Robles
          </span>
        </div>
        <div style={{ fontSize: 12, color: textColor, background: 'rgba(0, 102, 255, 0.12)', padding: '8px 12px', borderRadius: 10, borderLeft: '3px solid #0066FF', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon.Message />
          <span>Carlos: "¡Ya voy llegando a la entrada principal!"</span>
        </div>
      </div>
    );
  }

  if (type === 'wallet_widget') {
    return (
      <div style={{ width: '100%', background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,102,255,0.15))' : 'linear-gradient(135deg, rgba(0,102,255,0.08), rgba(0,102,255,0.03))', border, borderRadius: 20, padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#0066FF' }}>LOGIFAST PAY</div>
        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, color: textColor, margin: '6px 0' }}>•••• •••• •••• 4920</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, color: subColor }}>TITULAR</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: textColor }}>MARÍA LÓPEZ</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: textColor }}>VISA</div>
        </div>
        <div style={{ fontSize: 11, color: '#00C853', fontWeight: 600 }}>✓ Pago de C$ 180.00 verificado sin comisiones</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: cardBg, border, borderRadius: 20, padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', gap: 4, color: '#FFB300' }}>
        {[...Array(5)].map((_, i) => <Icon.Star key={i} size={18} fill="#FFB300" />)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: textColor }}>5.0 Excelente Servicio</div>
      <div style={{ fontSize: 12, color: subColor, fontStyle: 'italic' }}>
        "El servicio llegó súper rápido a Los Robles y el empaque impecable. ¡10/10!"
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: textColor, marginTop: 4 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0066FF', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ML</div>
        <span>María L. • Cliente Verificado</span>
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

  // Auto-advance carrusel (CONSERVACIÓN MANDATORIA DE LÓGICA)
  useEffect(() => {
    if (view !== 'landing') return;
    const interval = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [view]);

  const bg = isDark ? '#0A0A0C' : 'var(--bg)';
  const textColor = isDark ? '#F5F5F7' : 'var(--text)';

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      color: textColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "DM Sans", sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background 0.3s ease, color 0.3s ease',
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -100, left: '15%', width: 500, height: 500, background: isDark ? 'radial-gradient(circle, rgba(0, 102, 255, 0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0, 102, 255, 0.08) 0%, transparent 70%)', filter: 'blur(140px)' }} />
        <div style={{ position: 'absolute', top: '35%', right: -80, width: 450, height: 450, background: isDark ? 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%)', filter: 'blur(140px)' }} />
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
  const textColor = isDark ? '#FFFFFF' : 'var(--text)';
  const subColor = isDark ? '#86868B' : 'var(--text-secondary)';
  const navBg = isDark ? 'rgba(10, 10, 12, 0.85)' : 'rgba(250, 248, 245, 0.88)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)';

  return (
    <div>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: navBg,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: border,
        padding: '14px 20px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon.Logo size={36} />
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: textColor }}>LOGIFAST</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={toggleTheme}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                color: isDark ? '#FFB300' : '#0066FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              title={isDark ? 'Cambiar a Modo Día (Claro)' : 'Cambiar a Modo Noche (Oscuro)'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Icon.Sun /> : <Icon.Moon />}
            </button>

            <button
              onClick={onLogin}
              style={{ background: 'transparent', border: 'none', color: textColor, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 14px' }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={onRegister}
              style={{ background: '#0066FF', color: '#FFFFFF', border: 'none', padding: '9px 20px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,102,255,0.4)' }}
            >
              Registrarse
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', display: 'flex', padding: 4 }}
            >
              {mobileMenuOpen ? <Icon.Close /> : <Icon.Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{ padding: '16px 0', borderTop: border, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a href="#ecosistema" onClick={() => setMobileMenuOpen(false)} style={{ color: textColor, textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Plataforma</a>
            <a href="#aliados" onClick={() => setMobileMenuOpen(false)} style={{ color: textColor, textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Aliados</a>
          </div>
        )}
      </header>

      <section style={{ padding: '48px 20px 70px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,102,255,0.12)', border: '1px solid rgba(0,102,255,0.3)', color: '#0066FF', padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, width: 'fit-content' }}>
              <Icon.Sparkles />
              <span>Logística & Marketplace Pro v2.0</span>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 5.5vw, 54px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.04em', color: textColor, margin: 0 }}>
              Envíos ultrarrápidos y compras en Managua.
            </h1>

            <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.5, color: subColor, margin: 0, maxWidth: 480 }}>
              La red que integra clientes, comercios, motorizados en tiempo real y gestión de flota mecánica en una sola experiencia fluida.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
              <button
                onClick={onRegister}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0066FF', color: 'white', border: 'none', padding: '16px 30px', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,102,255,0.4)' }}
              >
                <span>Comenzar gratis</span>
                <Icon.ArrowRight />
              </button>
              <button
                onClick={onLogin}
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: textColor, border: border, padding: '16px 26px', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(20px)' }}
              >
                Explorar Demo
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, paddingTop: 20, borderTop: border }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: textColor }}>2.5k+</div>
                <div style={{ fontSize: 11, color: subColor }}>Envíos completados</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: textColor }}>15 min</div>
                <div style={{ fontSize: 11, color: subColor }}>Tiempo promedio</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: textColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>4.9</span>
                  <Icon.Star size={18} fill="#FFB300" />
                </div>
                <div style={{ fontSize: 11, color: subColor }}>Calificación</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: 440,
              padding: 24,
              borderRadius: 32,
              background: isDark ? 'rgba(22, 22, 29, 0.85)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: border,
              boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div style={{ width: '100%', marginBottom: 20 }}>
                    <AppleSlideWidget type={slide.widgetType} isDark={isDark} />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: textColor, margin: '0 0 6px' }}>{slide.title}</h2>
                  <p style={{ fontSize: 14, color: subColor, margin: '0 0 20px', lineHeight: 1.45 }}>{slide.subtitle}</p>
                </motion.div>
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    style={{
                      width: i === currentSlide ? 24 : 8,
                      height: 8,
                      borderRadius: 100,
                      background: i === currentSlide ? '#0066FF' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="aliados" style={{ padding: '48px 20px', borderTop: border, borderBottom: border, background: isDark ? 'rgba(15,15,20,0.5)' : 'rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0066FF', letterSpacing: '0.1em', marginBottom: 6 }}>ALIADOS ESTRATÉGICOS</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, color: textColor, margin: '0 0 28px' }}>Comercios Verificados en Managua</h2>
          <div style={{ overflow: 'hidden', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PARTNERS.map((partner, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)', border: border, minWidth: 180 }}>
                <img src={partner.src} alt={partner.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{partner.name}</div>
                  <div style={{ fontSize: 11, color: subColor }}>{partner.sector}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ecosistema" style={{ padding: '70px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0066FF', letterSpacing: '0.1em' }}>ECOSISTEMA UNIFICADO</span>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 700, color: textColor, margin: '6px 0 0' }}>Diseñado para máxima velocidad y control</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div style={{ background: isDark ? 'rgba(22, 22, 29, 0.7)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(30px)', border: border, borderRadius: 24, padding: 28 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0066FF', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>MARKETPLACE</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: textColor, margin: '0 0 8px' }}>Comida y Productos</h3>
            <p style={{ fontSize: 14, color: subColor, margin: 0, lineHeight: 1.5 }}>Compra directamente de comercios verificados con entrega directa a tu ubicación.</p>
          </div>

          <div style={{ background: isDark ? 'rgba(22, 22, 29, 0.7)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(30px)', border: border, borderRadius: 24, padding: 28 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0066FF', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>WEBSOCKET GPS</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: textColor, margin: '0 0 8px' }}>Rastreo Satelital</h3>
            <p style={{ fontSize: 14, color: subColor, margin: 0, lineHeight: 1.5 }}>Sigue el avance de la moto sobre el mapa en tiempo real con latencia de 12ms.</p>
          </div>

          <div style={{ background: isDark ? 'rgba(22, 22, 29, 0.7)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(30px)', border: border, borderRadius: 24, padding: 28 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0066FF', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>TALLER PRO</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: textColor, margin: '0 0 8px' }}>Ingeniería de Flota</h3>
            <p style={{ fontSize: 14, color: subColor, margin: 0, lineHeight: 1.5 }}>Alertas automáticas por kilometraje y consumo de repuestos para mecánicos.</p>
          </div>
        </div>
      </section>

      <footer style={{ padding: '40px 20px', background: isDark ? '#060608' : 'var(--bg-alt)', borderTop: border, textAlign: 'center', color: subColor, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <Icon.Logo size={28} />
          <span style={{ fontWeight: 700, color: textColor }}>LOGIFAST</span>
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

  const textColor = isDark ? '#FFFFFF' : 'var(--text)';
  const subColor = isDark ? '#86868B' : 'var(--text-secondary)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: subColor, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          <Icon.ArrowLeft />
          <span>Volver a la portada</span>
        </button>

        <button
          onClick={toggleTheme}
          style={{ width: 38, height: 38, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: border, color: isDark ? '#FFB300' : '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {isDark ? <Icon.Sun /> : <Icon.Moon />}
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: isDark ? 'rgba(22, 22, 29, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: border,
        borderRadius: 32,
        padding: '40px 28px',
        boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.1)',
        textAlign: 'center',
        marginTop: 40,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <Icon.Logo size={46} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: textColor, margin: '12px 0 4px' }}>Iniciar Sesión</h2>
          <p style={{ fontSize: 13, color: subColor, margin: 0 }}>Ingresa tus credenciales para acceder a LOGIFAST</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: textColor }}>Correo Electrónico</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, color: subColor }}><Icon.Mail /></span>
              <input
                type="email"
                placeholder="ejemplo@logifast.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', height: 48, borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: border, padding: '0 16px 0 42px', color: textColor, fontSize: 16, outline: 'none' }}
              />
            </div>
            {errors.email && <span style={{ fontSize: 11, color: '#FF453A' }}>{errors.email}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: textColor }}>Contraseña</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, color: subColor }}><Icon.Lock /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', height: 48, borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: border, padding: '0 42px 0 42px', color: textColor, fontSize: 16, outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, background: 'transparent', border: 'none', color: subColor, cursor: 'pointer' }}
              >
                {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
            {errors.password && <span style={{ fontSize: 11, color: '#FF453A' }}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 100, background: '#0066FF', color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, boxShadow: '0 4px 16px rgba(0,102,255,0.4)' }}
          >
            {loading ? <MiniSpinner size={18} color="white" /> : 'Ingresar a mi cuenta'}
            {!loading && <Icon.ArrowRight />}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '24px 0 16px' }}>
          <span style={{ fontSize: 11, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acceso Demo Instantáneo</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { role: 'cliente' as const, label: 'Cliente', icon: <Icon.User /> },
            { role: 'repartidor' as const, label: 'Repartidor', icon: <Icon.Bike /> },
            { role: 'admin' as const, label: 'Admin', icon: <Icon.Shield /> },
            { role: 'ingeniero' as const, label: 'Ingeniero', icon: <Icon.Store /> },
          ].map((d) => (
            <button
              key={d.role}
              onClick={() => demoLogin(d.role)}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: border, color: textColor, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: subColor, marginTop: 24 }}>
          ¿No tienes cuenta?{' '}
          <button type="button" onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#0066FF', fontWeight: 600, cursor: 'pointer' }}>Regístrate gratis</button>
        </p>
      </div>
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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    role: 'cliente' as 'cliente' | 'repartidor',
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const textColor = isDark ? '#FFFFFF' : 'var(--text)';
  const subColor = isDark ? '#86868B' : 'var(--text-secondary)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)';

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!form.email) errs.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Correo inválido';
    if (!form.password) errs.password = 'La contraseña es obligatoria';
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirm) errs.confirm = 'Las contraseñas no coinciden';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.role) errs.role = 'Selecciona un rol';
    if (!form.terms) errs.terms = 'Debes aceptar los términos';
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
          role: form.role,
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.ok) {
        sileo.error({ title: data.error || 'Error al registrar la cuenta' });
        return;
      }

      sileo.success({ title: `¡Cuenta creada, ${data.user.name}!`, description: 'Bienvenido a LOGIFAST' });
      onLoginSuccess(data.user.role, data.user.name);
    } catch {
      setLoading(false);
      sileo.error({ title: 'Error de conexión con el servidor' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: subColor, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          <Icon.ArrowLeft />
          <span>Volver a la portada</span>
        </button>

        <button
          onClick={toggleTheme}
          style={{ width: 38, height: 38, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: border, color: isDark ? '#FFB300' : '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {isDark ? <Icon.Sun /> : <Icon.Moon />}
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: isDark ? 'rgba(22, 22, 29, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: border,
        borderRadius: 32,
        padding: '40px 28px',
        boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.1)',
        textAlign: 'center',
        marginTop: 40,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <Icon.Logo size={46} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: textColor, margin: '12px 0 4px' }}>{step === 1 ? 'Crear mi Cuenta' : 'Tipo de Cuenta'}</h2>
          <p style={{ fontSize: 13, color: subColor, margin: 0 }}>{step === 1 ? 'Completa tus datos personales' : 'Selecciona tu perfil en LOGIFAST'}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); if (validateStep1()) setStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: textColor }}>Nombre Completo</label>
              <input
                type="text"
                placeholder="María López"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', height: 46, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: border, padding: '0 14px', color: textColor, fontSize: 16, outline: 'none', marginTop: 4 }}
              />
              {errors.name && <span style={{ fontSize: 11, color: '#FF453A' }}>{errors.name}</span>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: textColor }}>Correo Electrónico</label>
              <input
                type="email"
                placeholder="nombre@empresa.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', height: 46, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: border, padding: '0 14px', color: textColor, fontSize: 16, outline: 'none', marginTop: 4 }}
              />
              {errors.email && <span style={{ fontSize: 11, color: '#FF453A' }}>{errors.email}</span>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: textColor }}>Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ width: '100%', height: 46, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: border, padding: '0 14px', color: textColor, fontSize: 16, outline: 'none', marginTop: 4 }}
              />
              {errors.password && <span style={{ fontSize: 11, color: '#FF453A' }}>{errors.password}</span>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: textColor }}>Confirmar Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                style={{ width: '100%', height: 46, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: border, padding: '0 14px', color: textColor, fontSize: 16, outline: 'none', marginTop: 4 }}
              />
              {errors.confirm && <span style={{ fontSize: 11, color: '#FF453A' }}>{errors.confirm}</span>}
            </div>

            <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 100, background: '#0066FF', color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, boxShadow: '0 4px 16px rgba(0,102,255,0.4)' }}>
              Siguiente paso <Icon.ArrowRight />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { value: 'cliente' as const, label: 'Cliente', desc: 'Pido envíos y productos', icon: <Icon.User /> },
                { value: 'repartidor' as const, label: 'Repartidor', icon: <Icon.Bike />, desc: 'Quiero realizar entregas' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 12px',
                    borderRadius: 16,
                    background: form.role === r.value ? 'rgba(0,102,255,0.15)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    border: form.role === r.value ? '1.5px solid #0066FF' : border,
                    color: textColor,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#0066FF', marginBottom: 4 }}>{r.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: subColor }}>{r.desc}</div>
                </button>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 8 }}>
              <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} style={{ accentColor: '#0066FF' }} />
              <span style={{ fontSize: 12, color: subColor }}>Acepto los <a href="#" style={{ color: '#0066FF' }}>Términos</a> y la <a href="#" style={{ color: '#0066FF' }}>Privacidad</a>.</span>
            </label>
            {errors.terms && <span style={{ fontSize: 11, color: '#FF453A' }}>{errors.terms}</span>}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px', height: 48, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: border, color: textColor, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <Icon.ArrowLeft /> Atrás
              </button>
              <button type="submit" disabled={loading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 100, background: '#0066FF', color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,102,255,0.4)' }}>
                {loading ? <MiniSpinner size={18} color="white" /> : 'Finalizar registro'} {!loading && <Icon.ArrowRight />}
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: subColor, marginTop: 24 }}>
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#0066FF', fontWeight: 600, cursor: 'pointer' }}>Inicia sesión</button>
        </p>
      </div>
    </div>
  );
}
