'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { initCapacitorAndroid } from '@/lib/capacitor-android';
import { RoleLoader } from '@/components/ui/loaders';
import AuthRedesign from '@/components/auth/AuthRedesign';

const ClientDashboard = dynamic(() => import('@/app/client-dashboard'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" />,
});

const CLIENT_SLIDES = [
  {
    title: 'Envíos Express en Minutos',
    desc: 'Envía paquetes, documentos o encomiendas con repartidores verificados en toda Nicaragua.',
    badge: 'Rápido & Seguro',
    icon: '📦',
    color: '#FF5722',
  },
  {
    title: 'Tus Tiendas y Restaurantes',
    desc: 'Explora comida, farmacia y productos locales con entrega directa hasta tu puerta.',
    badge: 'Marketplace Local',
    icon: '🛍️',
    color: '#007AFF',
  },
  {
    title: 'Seguimiento GPS y PIN Seguro',
    desc: 'Observa a tu repartidor en tiempo real y recibe tu pedido mediante código PIN de seguridad.',
    badge: 'Rastreo en Vivo',
    icon: '📍',
    color: '#34C759',
  },
];

export default function ClienteAppPage() {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isDark, setIsDark] = useState(true);

  // Onboarding que solo se muestra 1 vez
  const [welcomeDone, setWelcomeDone] = useState<boolean>(true); // default true hasta chequear localStorage
  const [slideIndex, setSlideIndex] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // 1. Inicializar plugins nativos de Android (StatusBar, SplashScreen, BackButton)
    initCapacitorAndroid({
      hasOpenModal: () => false,
      closeActiveModal: () => {},
    });

    // 2. Comprobar si ya vio la bienvenida de bienvenida única
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('lf_client_welcome_done');
      setWelcomeDone(seen === 'true');
    }

    // 3. Verificar si ya hay una sesión activa de cliente
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user && (data.user.role === 'cliente' || data.user.role === 'admin')) {
          setSessionUser(data.user);
        }
      })
      .catch(() => null)
      .finally(() => setCheckingSession(false));
  }, []);

  const handleStartRegister = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lf_client_welcome_done', 'true');
    }
    setWelcomeDone(true);
    setAuthMode('register');
  };

  const handleStartLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lf_client_welcome_done', 'true');
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
    return <RoleLoader role="cliente" />;
  }

  // Si ya está autenticado, renderizar la app completa del cliente con todos sus módulos
  if (sessionUser) {
    return (
      <ClientDashboard
        isDark={isDark}
        toggleTheme={() => setIsDark((prev) => !prev)}
        onLogout={handleLogout}
        userName={sessionUser.name}
      />
    );
  }

  // Si es la PRIMERA VEZ que abre la app, mostrar la pantalla exclusiva de bienvenida móvil
  if (!welcomeDone) {
    return (
      <div className="fixed inset-0 bg-[#0B0E14] text-white flex flex-col justify-between overflow-hidden font-sans">
        {/* Ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5722]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-[#007AFF]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5722] to-[#FF7043] flex items-center justify-center font-black text-white text-sm shadow-lg shadow-[#FF5722]/30">
              LF
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">LogiFast</span>
              <span className="text-[10px] text-slate-400 font-medium">Cliente Express</span>
            </div>
          </div>
          <button
            onClick={handleStartLogin}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700"
          >
            Saltar
          </button>
        </div>

        {/* Carousel de Bienvenida */}
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
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
                style={{
                  background: `color-mix(in srgb, ${CLIENT_SLIDES[slideIndex].color} 18%, #131822)`,
                  border: `1.5px solid ${CLIENT_SLIDES[slideIndex].color}40`,
                }}
              >
                {CLIENT_SLIDES[slideIndex].icon}
              </div>

              <span
                className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: `${CLIENT_SLIDES[slideIndex].color}20`,
                  color: CLIENT_SLIDES[slideIndex].color,
                }}
              >
                {CLIENT_SLIDES[slideIndex].badge}
              </span>

              <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                {CLIENT_SLIDES[slideIndex].title}
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {CLIENT_SLIDES[slideIndex].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex items-center gap-2 mt-8">
            {CLIENT_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === i ? 'w-6 bg-[#FF5722]' : 'w-1.5 bg-slate-700'
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
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#F4511E] text-white font-bold text-sm shadow-xl shadow-[#FF5722]/30 active:scale-98 transition-all"
          >
            Comenzar / Crear Cuenta
          </button>

          <button
            onClick={handleStartLogin}
            className="w-full py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 active:scale-98 transition-all"
          >
            Ya tengo cuenta — Iniciar Sesión
          </button>

          <p className="text-[10px] text-center text-slate-400 pt-1">
            Al continuar aceptas nuestros Términos de Servicio y Privacidad
          </p>
        </div>
      </div>
    );
  }

  // Pantalla directa de Auth (Login / Registro completo sin la landing page web)
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <AuthRedesign
        currentView={authMode}
        fixedRole="cliente"
        onBackToWelcome={() => setWelcomeDone(false)}
        onLoginSuccess={(role, name) => {
          setSessionUser({ name, role });
        }}
      />
    </div>
  );
}
