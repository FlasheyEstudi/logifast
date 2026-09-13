'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { initCapacitorAndroid } from '@/lib/capacitor-android';
import { RoleLoader } from '@/components/ui/loaders';
import AuthRedesign from '@/components/auth/AuthRedesign';
import { useConfigStore, aplicarTema } from '@/store/configStore';
import { toggleThemeWithTransition } from '@/lib/theme-transition';
import { ChevronRight, ChevronLeft, Bike, Navigation, MessageSquare } from 'lucide-react';

const RepartidorApp = dynamic(() => import('@/components/repartidor/RepartidorApp'), {
  ssr: false,
  loading: () => <RoleLoader role="repartidor" />,
});

export const DRIVER_SLIDES = [
  {
    title: 'Despacho Inteligente en Vivo',
    subtitle: 'Recibe solicitudes continuas de envío optimizadas según tu cercanía y disponibilidad.',
    widgetType: 'driver_dispatch',
  },
  {
    title: 'Navegación GPS y Rutas Óptimas',
    subtitle: 'Rutas guiadas giro a giro con cálculo de tráfico en tiempo real para llegar más rápido.',
    widgetType: 'driver_nav',
  },
  {
    title: 'Ganancias Claras y Retiros Diarios',
    subtitle: 'Visualiza tus ingresos por cada entrega, conserva el 100% de tus propinas y retira cuando quieras.',
    widgetType: 'driver_wallet',
  },
];

export function AppleDriverSlideWidget({ type, isDark }: { type: string; isDark: boolean }) {
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)';
  const border = isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.8)';
  const innerShadow = isDark
    ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 14px 36px rgba(0,0,0,0.35)'
    : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), 0 12px 30px rgba(0,102,255,0.06)';
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#8E8E93' : '#6E6E73';

  if (type === 'driver_dispatch') {
    return (
      <div style={{ width: '100%', background: cardBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border, borderRadius: 22, padding: 18, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: innerShadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, color: '#00C853' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 12px #00C853' }} />
            SOLICITUD DISPONIBLE • ETA 8 MIN
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#00C853' }}>C$ 160.00</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0, 200, 83, 0.15)', border: '1px solid rgba(0,200,83,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,200,83,0.2)' }}>
            <Bike size={22} className="text-[#00C853]" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>Burger Boss ➔ Las Colinas</div>
            <div style={{ fontSize: 11, color: subColor }}>Distancia: 2.8 km • Pago en Efectivo</div>
          </div>
        </div>
        <div style={{ height: 6, background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '85%', background: 'linear-gradient(90deg, #007AFF, #00C853)', borderRadius: 10, boxShadow: '0 0 10px rgba(0,200,83,0.5)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: subColor, fontWeight: 700 }}>
          <span>Restaurante</span>
          <span style={{ color: '#00C853' }}>Ruta Optimizada</span>
          <span>Entrega al Cliente</span>
        </div>
      </div>
    );
  }

  if (type === 'driver_nav') {
    return (
      <div style={{ width: '100%', background: cardBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border, borderRadius: 22, padding: 18, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: innerShadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: textColor }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#007AFF', boxShadow: '0 0 10px #007AFF' }} />
            GPS Activo • Tráfico Fluido
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#007AFF', background: 'rgba(0, 122, 255, 0.15)', border: '1px solid rgba(0,122,255,0.25)', padding: '3px 10px', borderRadius: 100 }}>34 km/h</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '12px 14px', fontSize: 12, border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 11, color: subColor, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <Navigation size={13} className="text-[#007AFF]" /> En 200m a la der.
          </span>
          <span style={{ flex: 1, borderTop: '1px dashed #007AFF', margin: '0 10px' }} />
          <span style={{ color: '#007AFF', display: 'flex', alignItems: 'center', filter: 'drop-shadow(0 0 6px rgba(0,122,255,0.6))' }}>
            <Bike size={16} />
          </span>
          <span style={{ flex: 1, borderTop: '1px dashed rgba(0,122,255,0.3)', margin: '0 10px' }} />
          <span style={{ fontSize: 11, color: subColor, fontWeight: 600 }}>
            Pista Suburbana
          </span>
        </div>
        <div style={{ fontSize: 12, color: textColor, background: 'rgba(0, 122, 255, 0.12)', border: '1px solid rgba(0,122,255,0.2)', padding: '10px 14px', borderRadius: 14, borderLeft: '4px solid #007AFF', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={14} className="text-[#007AFF] flex-shrink-0" />
          <span style={{ fontWeight: 500, fontSize: 11 }}>Cliente: "Portón blanco frente al minisúper"</span>
        </div>
      </div>
    );
  }

  // driver_wallet
  return (
    <div style={{ width: '100%', background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,200,83,0.18) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(0,200,83,0.1) 100%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border, borderRadius: 22, padding: 18, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: innerShadow }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#00C853' }}>BILLETERA CONDUCTOR LOGIFAST</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, letterSpacing: -0.5, color: textColor }}>C$ 1,480.00</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#00C853' }}>Hoy • 6 entregas</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '8px 12px', fontSize: 11 }}>
        <span style={{ color: subColor, fontWeight: 600 }}>Tarifas de envío</span>
        <span style={{ fontWeight: 700, color: textColor }}>C$ 1,280.00</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '8px 12px', fontSize: 11 }}>
        <span style={{ color: subColor, fontWeight: 600 }}>Propinas recibidas (100%)</span>
        <span style={{ fontWeight: 700, color: '#00C853' }}>+ C$ 200.00</span>
      </div>
      <div style={{ fontSize: 11, color: '#00C853', fontWeight: 700 }}>✓ Fondos disponibles para retiro inmediato a banco</div>
    </div>
  );
}

export default function RepartidorAppPage() {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Sincronización con el tema global del sistema (Día / Noche)
  const tema = useConfigStore((s) => s.tema);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    aplicarTema(useConfigStore.getState().tema);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    aplicarTema(tema);
  }, [tema]);

  const isDark =
    tema === 'dark' ||
    (tema === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = useCallback((event?: any) => {
    toggleThemeWithTransition(event);
  }, []);

  // Onboarding que solo se muestra 1 vez
  const [welcomeDone, setWelcomeDone] = useState<boolean>(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // 1. Inicializar plugins nativos de Android para Repartidores (Background GPS, Channels, BackButton)
    initCapacitorAndroid({
      hasOpenModal: () => false,
      closeActiveModal: () => {},
    });

    // 2. Comprobar si ya vio la bienvenida de conductor única
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('lf_driver_welcome_done');
      setWelcomeDone(seen === 'true');
    }

    // 3. Verificar si ya hay una sesión activa de repartidor
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user && (data.user.role === 'repartidor' || data.user.role === 'admin')) {
          setSessionUser(data.user);
        }
      })
      .catch(() => null)
      .finally(() => setCheckingSession(false));
  }, []);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setSlideIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return DRIVER_SLIDES.length - 1;
      if (next >= DRIVER_SLIDES.length) return 0;
      return next;
    });
  };

  const handleStartRegister = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lf_driver_welcome_done', 'true');
    }
    setWelcomeDone(true);
    setAuthMode('register');
  };

  const handleStartLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lf_driver_welcome_done', 'true');
    }
    setWelcomeDone(true);
    setAuthMode('login');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setSessionUser(null);
    setAuthMode('login');
  };

  if (checkingSession) {
    return <RoleLoader role="repartidor" />;
  }

  // Si ya está autenticado, renderizar la app del repartidor
  if (sessionUser) {
    return (
      <RepartidorApp
        isDark={isDark}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    );
  }

  // Tokens de diseño Apple Liquid Glass oficiales
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#98989D' : '#636366';
  const specularBorder = isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(255, 255, 255, 0.85)';
  const glassCardBg = isDark ? 'rgba(20, 20, 28, 0.72)' : 'rgba(255, 255, 255, 0.82)';
  const glassShadow = isDark
    ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.16), 0 24px 60px rgba(0,0,0,0.5)'
    : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), 0 20px 50px rgba(0,200,83,0.07)';

  // Pantalla exclusiva de bienvenida móvil de Repartidores
  if (!welcomeDone) {
    const slide = DRIVER_SLIDES[slideIndex];

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: isDark ? '#000000' : '#F2F2F7',
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        userSelect: 'none',
      }}>
        {/* Luces ambientales en el fondo */}
        <div style={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 200, 83, 0.22) 0%, transparent 70%)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: -30,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.16) 0%, transparent 70%)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }} />

        {/* ─── ISLA FLOTANTE DE CRISTAL LÍQUIDO (HEADER) ─── */}
        <header style={{
          position: 'relative',
          zIndex: 100,
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingLeft: 16,
          paddingRight: 16,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <nav style={{
            width: '100%',
            maxWidth: 440,
            height: 52,
            borderRadius: 100,
            background: isDark ? 'rgba(14, 14, 20, 0.82)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
            border: specularBorder,
            boxShadow: isDark
              ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), 0 12px 36px rgba(0, 0, 0, 0.55)'
              : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.98), 0 12px 32px rgba(0, 200, 83, 0.1)',
            padding: '0 8px 0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo.png" alt="LogiFast" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
              <div>
                <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: textColor, display: 'block', lineHeight: 1 }}>LOGIFAST</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#00C853', letterSpacing: '0.08em', textTransform: 'uppercase' }}>DRIVER</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartLogin}
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: specularBorder,
                color: textColor,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 16px',
                borderRadius: 100,
              }}
            >
              Saltar
            </motion.button>
          </nav>
        </header>

        {/* ─── CARRUSEL CENTRAL CRISTALINO CON WIDGET REAL Y GESTO SWIPE ─── */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 18px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 400,
            padding: 22,
            borderRadius: 30,
            background: glassCardBg,
            backdropFilter: 'blur(40px) saturate(190%)',
            WebkitBackdropFilter: 'blur(40px) saturate(190%)',
            border: specularBorder,
            boxShadow: glassShadow,
            textAlign: 'center',
            position: 'relative',
            boxSizing: 'border-box',
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(e, { offset, velocity }) => {
                  if (offset.x < -35 || velocity.x < -300) {
                    paginate(1);
                  } else if (offset.x > 35 || velocity.x > 300) {
                    paginate(-1);
                  }
                }}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'grab', touchAction: 'pan-y' }}
              >
                {/* Widget interactivo oficial del Repartidor */}
                <div style={{ width: '100%', marginBottom: 18 }}>
                  <AppleDriverSlideWidget type={slide.widgetType} isDark={isDark} />
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: textColor, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {slide.title}
                </h2>
                <p style={{ fontSize: 13, color: subColor, margin: '0 0 16px', lineHeight: 1.5, maxWidth: 300 }}>
                  {slide.subtitle}
                </p>

                {/* Pista de deslizamiento táctil */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor, fontSize: 11, fontWeight: 600 }}>
                  <ChevronLeft size={14} />
                  <span>Desliza para explorar</span>
                  <ChevronRight size={14} />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Indicadores de Píldora tipo iOS */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 18 }}>
              {DRIVER_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > slideIndex ? 1 : -1);
                    setSlideIndex(i);
                  }}
                  style={{
                    width: i === slideIndex ? 26 : 7,
                    height: 6,
                    borderRadius: 100,
                    background: i === slideIndex ? '#00C853' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'),
                    boxShadow: i === slideIndex ? '0 0 10px rgba(0,200,83,0.6)' : 'none',
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

        {/* ─── BOTONES DE ACCIÓN DE ALTO NIVEL PARA REPARTIDOR ─── */}
        <div style={{
          position: 'relative',
          zIndex: 100,
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 12px))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          background: isDark
            ? 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 60%, #000000 100%)'
            : 'linear-gradient(180deg, transparent 0%, rgba(242,242,247,0.9) 60%, #F2F2F7 100%)',
        }}>
          <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleStartRegister}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 100,
                background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 6px 20px rgba(0,200,83,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>Unirme como Repartidor / Registro</span>
              <ChevronRight size={18} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleStartLogin}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 100,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                border: specularBorder,
                color: textColor,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Ya soy Conductor — Iniciar Sesión
            </motion.button>

            <p style={{ fontSize: 11, textAlign: 'center', color: subColor, margin: '4px 0 0' }}>
              Rastreo en segundo plano activo únicamente durante entregas en curso
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla directa de Auth para Repartidores con rol preconfigurado
  return (
    <div
      className={`min-h-screen ${isDark ? 'dark' : 'light'}`}
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        backgroundColor: isDark ? '#08080C' : '#F5F5F9',
        color: isDark ? '#FFFFFF' : '#1C1C1E',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <AuthRedesign
        currentView={authMode}
        fixedRole="repartidor"
        onBackToWelcome={() => setWelcomeDone(false)}
        onLoginSuccess={(role, name) => {
          setSessionUser({ name, role });
        }}
      />
    </div>
  );
}
