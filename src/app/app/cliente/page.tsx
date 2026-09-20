'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { initCapacitorAndroid } from '@/lib/capacitor-android';
import { inicializarNotificacionesNativas } from '@/services/native-notifications';
import { realtime } from '@/services/realtime';
import { RoleLoader } from '@/components/ui/loaders';
import AuthRedesign, { SLIDES, AppleSlideWidget } from '@/components/auth/AuthRedesign';
import { useConfigStore, aplicarTema } from '@/store/configStore';
import { useStore } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { toggleThemeWithTransition } from '@/lib/theme-transition';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const ClientDashboard = dynamic(() => import('@/app/client-dashboard'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" />,
});

export default function ClienteAppPage() {
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
    mounted &&
    (tema === 'dark' ||
      (tema === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches));

  const toggleTheme = useCallback((event?: any) => {
    toggleThemeWithTransition(event);
  }, []);

  // Onboarding que solo se muestra 1 vez
  const [welcomeDone, setWelcomeDone] = useState<boolean>(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // El botón atrás de Android debe CERRAR la capa abierta antes de salir de la app.
    // Antes respondía `false` siempre: teniendo el carrito o el tracking abiertos, un
    // toque atrás no hacía nada y el siguiente salía de la aplicación.
    const cerrarCapaSuperior = (): boolean => {
      const m = useMarketplaceStore.getState();
      if (m.carritoOpen) {
        m.setCarritoOpen(false);
        return true;
      }
      if (m.tiendaSeleccionada) {
        m.setTiendaSeleccionada(null);
        return true;
      }
      if (m.productoDetalleId) {
        m.setProductoDetalleId(null);
        return true;
      }
      const s = useStore.getState();
      if (s.trackingOrderId) {
        s.setTrackingOrder(null);
        return true;
      }
      return false;
    };

    initCapacitorAndroid({
      hasOpenModal: () => {
        const m = useMarketplaceStore.getState();
        const s = useStore.getState();
        return !!(m.carritoOpen || m.tiendaSeleccionada || m.productoDetalleId || s.trackingOrderId);
      },
      closeActiveModal: () => {
        cerrarCapaSuperior();
      },
    });
    inicializarNotificacionesNativas().catch(() => null);

    // El onboarding pertenece al ACCESO, no al dispositivo: se recuerda solo dentro
    // de esta sesión de navegador para que, al cerrar sesión, la presentación vuelva
    // a mostrarse en lugar de saltar directo al formulario.
    if (typeof window !== 'undefined') {
      let visto: string | null = null;
      try { visto = sessionStorage.getItem('lf_client_welcome_done'); } catch { /* modo privado */ }
      setWelcomeDone(visto === 'true');
    }

    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user && (data.user.role === 'cliente' || data.user.role === 'admin')) {
          setSessionUser(data.user);
          // Unirse a la sala personal para recibir avisos dirigidos de administración
          realtime.usuarioConectar(data.user.id, data.user.role);
        }
      })
      .catch(() => null)
      .finally(() => setCheckingSession(false));
  }, []);

  /** Volver a la presentación desde el formulario, olvidando la marca de esta sesión. */
  const volverAlWelcome = useCallback(() => {
    if (typeof window !== 'undefined') {
      try { sessionStorage.removeItem('lf_client_welcome_done'); } catch { /* modo privado */ }
    }
    setWelcomeDone(false);
    setSlideIndex(0);
    setDirection(0);
  }, []);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setSlideIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return SLIDES.length - 1;
      if (next >= SLIDES.length) return 0;
      return next;
    });
  };

  const handleStartRegister = () => {
    if (typeof window !== 'undefined') {
      try { sessionStorage.setItem('lf_client_welcome_done', 'true'); } catch { /* modo privado */ }
    }
    setWelcomeDone(true);
    setAuthMode('register');
  };

  const handleStartLogin = () => {
    if (typeof window !== 'undefined') {
      try { sessionStorage.setItem('lf_client_welcome_done', 'true'); } catch { /* modo privado */ }
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

  if (!mounted || checkingSession) {
    return <RoleLoader role="cliente" />;
  }

  if (sessionUser) {
    return (
      <ClientDashboard
        isDark={isDark}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        userName={sessionUser.name}
      />
    );
  }

  // Tokens de cristal líquido del diseño oficial de LogiFast
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subColor = isDark ? '#98989D' : '#636366';
  const specularBorder = isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(255, 255, 255, 0.85)';
  const glassCardBg = isDark ? 'rgba(20, 20, 28, 0.72)' : 'rgba(255, 255, 255, 0.82)';
  const glassShadow = isDark
    ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.16), 0 24px 60px rgba(0,0,0,0.5)'
    : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), 0 20px 50px rgba(0,102,255,0.07)';

  if (!welcomeDone) {
    const slide = SLIDES[slideIndex];

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
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.22) 0%, transparent 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: -30,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 200, 83, 0.14) 0%, transparent 70%)',
          filter: 'blur(20px)',
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
              : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.98), 0 12px 32px rgba(0, 102, 255, 0.1)',
            padding: '0 8px 0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo.png" alt="LogiFast" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: textColor }}>LOGIFAST</span>
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
            borderRadius: '32px 30px 28px 24px',
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
                {/* Widget interactivo oficial de AuthRedesign */}
                <div style={{ width: '100%', marginBottom: 18 }}>
                  <AppleSlideWidget type={slide.widgetType} isDark={isDark} />
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
              {SLIDES.map((_, i) => (
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
                    background: i === slideIndex ? '#007AFF' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'),
                    boxShadow: i === slideIndex ? '0 0 10px rgba(0,122,255,0.6)' : 'none',
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

        {/* ─── BOTONES DE ACCIÓN DE ALTO NIVEL ─── */}
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
                background: 'linear-gradient(180deg, #1A8CFF 0%, #0066FF 100%)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 6px 20px rgba(0,102,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>Comenzar / Crear Cuenta</span>
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
              Ya tengo cuenta — Iniciar Sesión
            </motion.button>

            <p style={{ fontSize: 11, textAlign: 'center', color: subColor, margin: '4px 0 0' }}>
              Al continuar aceptas nuestros Términos de Servicio y Privacidad
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        fixedRole="cliente"
        onBackToWelcome={volverAlWelcome}
        onLoginSuccess={(role, name) => {
          setSessionUser({ name, role });
        }}
      />
    </div>
  );
}
