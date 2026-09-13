'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { initCapacitorAndroid } from '@/lib/capacitor-android';
import { RoleLoader } from '@/components/ui/loaders';
import AuthRedesign from '@/components/auth/AuthRedesign';

const RepartidorApp = dynamic(() => import('@/components/repartidor/RepartidorApp'), {
  ssr: false,
  loading: () => <RoleLoader role="repartidor" />,
});

import { Bike, Compass, Wallet } from 'lucide-react';

const DRIVER_SLIDES = [
  {
    title: 'Conduce y Gana con tu Moto',
    desc: 'Horarios 100% libres. Conéctate cuando quieras y recibe solicitudes de envío continuas.',
    badge: 'Ingresos Libres',
    icon: Bike,
    color: '#007AFF',
  },
  {
    title: 'Navegación GPS Integrada',
    desc: 'Rutas automáticas calculadas con Waze y Google Maps para llegar siempre más rápido.',
    badge: 'Ruta Óptima',
    icon: Compass,
    color: '#34C759',
  },
  {
    title: 'Pagos Seguros y Transparencia',
    desc: 'Visualiza tus ganancias por cada entrega y cobra tus fondos acumulados a tu billetera.',
    badge: 'Ganancia Diaria',
    icon: Wallet,
    color: '#FF9500',
  },
];

export default function RepartidorAppPage() {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isDark, setIsDark] = useState(true);

  // Onboarding que solo se muestra 1 vez
  const [welcomeDone, setWelcomeDone] = useState<boolean>(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // 1. Inicializar plugins nativos de Android para Repartidores (Background GPS, Channels, BackButton)
    initCapacitorAndroid({
      hasOpenModal: () => false,
      closeActiveModal: () => {},
    });

    // 2. Comprobar si ya vio la bienvenida única
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

  // Si ya está autenticado como repartidor, renderizar la app completa del repartidor
  if (sessionUser) {
    return (
      <RepartidorApp
        isDark={isDark}
        toggleTheme={() => setIsDark((prev) => !prev)}
        onLogout={handleLogout}
      />
    );
  }

  // Si es la PRIMERA VEZ que abre la app de conductor, mostrar la bienvenida móvil de repartidor
  if (!welcomeDone) {
    return (
      <div className="fixed inset-0 bg-[#0B0E14] text-white flex flex-col justify-between overflow-hidden font-sans">
        {/* Ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#007AFF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-[#34C759]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0055D4] flex items-center justify-center font-black text-white text-sm shadow-lg shadow-[#007AFF]/30">
              DR
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">LogiFast</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Driver / Repartidor</span>
            </div>
          </div>
          <button
            onClick={handleStartLogin}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700"
          >
            Saltar
          </button>
        </div>

        {/* Carousel de Bienvenida de Conductor */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center text-center space-y-4 max-w-xs"
            >
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl transition-all"
                style={{
                  background: `color-mix(in srgb, ${DRIVER_SLIDES[slideIndex].color} 18%, #131822)`,
                  border: `1.5px solid ${DRIVER_SLIDES[slideIndex].color}40`,
                }}
              >
                {React.createElement(DRIVER_SLIDES[slideIndex].icon, {
                  size: 44,
                  strokeWidth: 2,
                  style: { color: DRIVER_SLIDES[slideIndex].color },
                })}
              </div>

              <span
                className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: `${DRIVER_SLIDES[slideIndex].color}20`,
                  color: DRIVER_SLIDES[slideIndex].color,
                }}
              >
                {DRIVER_SLIDES[slideIndex].badge}
              </span>

              <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                {DRIVER_SLIDES[slideIndex].title}
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {DRIVER_SLIDES[slideIndex].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex items-center gap-2 mt-8">
            {DRIVER_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === i ? 'w-6 bg-[#007AFF]' : 'w-1.5 bg-slate-700'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="relative z-10 p-6 space-y-3 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/90 to-transparent">
          <button
            onClick={handleStartRegister}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0055D4] hover:from-[#0066FF] hover:to-[#0044B0] text-white font-bold text-sm shadow-xl shadow-[#007AFF]/30 active:scale-98 transition-all"
          >
            Registrarme como Conductor
          </button>

          <button
            onClick={handleStartLogin}
            className="w-full py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 active:scale-98 transition-all"
          >
            Ya soy repartidor — Iniciar Turno
          </button>

          <p className="text-[10px] text-center text-slate-400 pt-1">
            Rastreo en segundo plano activo únicamente durante entregas en curso
          </p>
        </div>
      </div>
    );
  }

  // Pantalla directa de Auth para Repartidores (Login / Registro completo sin la landing page web)
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
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
