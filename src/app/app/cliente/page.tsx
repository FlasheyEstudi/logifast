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

import { Package, ShoppingBag, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';

const CLIENT_SLIDES = [
  {
    title: 'Envíos Express en Minutos',
    desc: 'Envía paquetes, documentos o encomiendas con repartidores verificados en toda Nicaragua.',
    badge: 'Rápido & Seguro',
    icon: Package,
    gradient: 'from-orange-500/20 to-amber-500/10',
    border: 'border-orange-500/30',
    iconColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  {
    title: 'Tus Tiendas y Restaurantes',
    desc: 'Explora comida, farmacia y productos locales con entrega directa hasta tu puerta.',
    badge: 'Marketplace Local',
    icon: ShoppingBag,
    gradient: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  {
    title: 'Seguimiento GPS y PIN Seguro',
    desc: 'Observa a tu repartidor en tiempo real y recibe tu pedido mediante código PIN de seguridad.',
    badge: 'Rastreo en Vivo',
    icon: ShieldCheck,
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 180 : -180,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 320, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -180 : 180,
    opacity: 0,
    scale: 0.95,
    transition: {
      x: { type: 'spring', stiffness: 320, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
};

export default function ClienteAppPage() {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isDark, setIsDark] = useState(true);

  // Onboarding que solo se muestra 1 vez
  const [welcomeDone, setWelcomeDone] = useState<boolean>(true); // default true hasta chequear localStorage
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // 1. Inicializar plugins nativos de Android (StatusBar, SplashScreen, BackButton, GPS)
    initCapacitorAndroid({
      hasOpenModal: () => false,
      closeActiveModal: () => {},
    });

    // 2. Comprobar si ya vio la bienvenida única
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

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setSlideIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return CLIENT_SLIDES.length - 1;
      if (next >= CLIENT_SLIDES.length) return 0;
      return next;
    });
  };

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

  // Pantalla exclusiva de bienvenida móvil con Tailwind & Deslizamiento táctil horizontal
  if (!welcomeDone) {
    const currentSlide = CLIENT_SLIDES[slideIndex];
    const SlideIcon = currentSlide.icon;

    return (
      <div className="fixed inset-0 bg-[#07090E] text-white flex flex-col justify-between overflow-hidden font-sans select-none">
        {/* Luces ambientales en el fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-12 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Barra superior con logo oficial */}
        <header className="relative z-20 px-6 pt-12 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-sm">
              <img src="/logo.png" alt="LogiFast" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white block leading-none">LOGIFAST</span>
              <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Cliente Express</span>
            </div>
          </div>
          <button
            onClick={handleStartLogin}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 backdrop-blur-md transition-all"
          >
            Saltar
          </button>
        </header>

        {/* Contenedor central con soporte para arrastrar/deslizar a los lados (Swipe) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-2 overflow-hidden">
          <div className="w-full max-w-sm flex items-center justify-center min-h-[360px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={slideIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
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
                className="w-full p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col items-center text-center cursor-grab active:cursor-grabbing touch-pan-y"
              >
                {/* Ícono dinámico dentro de cápsula iluminada */}
                <div
                  className={`relative w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br ${currentSlide.gradient} border ${currentSlide.border} flex items-center justify-center shadow-xl shadow-black/40`}
                >
                  <div className="absolute inset-0 rounded-2xl bg-white/[0.02] backdrop-blur-md" />
                  <SlideIcon className={`relative z-10 w-11 h-11 ${currentSlide.iconColor}`} strokeWidth={2.2} />
                </div>

                {/* Badge temático */}
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${currentSlide.badgeBg} mb-3`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {currentSlide.badge}
                </span>

                {/* Título de la diapositiva */}
                <h2 className="text-xl font-black tracking-tight text-white leading-tight mb-2.5">
                  {currentSlide.title}
                </h2>

                {/* Descripción */}
                <p className="text-xs text-slate-400 leading-relaxed font-normal max-w-[260px]">
                  {currentSlide.desc}
                </p>

                {/* Pista sutil de gesto táctil */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-6">
                  <ChevronLeft className="w-3.5 h-3.5 animate-pulse text-slate-500" />
                  <span>Desliza para explorar</span>
                  <ChevronRight className="w-3.5 h-3.5 animate-pulse text-slate-500" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicadores de paginación interactivos (Dots / Pills) */}
          <div className="flex items-center gap-2 mt-5">
            {CLIENT_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > slideIndex ? 1 : -1);
                  setSlideIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === i ? 'w-7 bg-blue-500 shadow-md shadow-blue-500/50' : 'w-2 bg-slate-800'
                }`}
                aria-label={`Diapositiva ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Botones de acción principales inferiores */}
        <div className="relative z-20 p-6 space-y-3 bg-gradient-to-t from-[#07090E] via-[#07090E]/95 to-transparent">
          <button
            onClick={handleStartRegister}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Comenzar / Crear Cuenta</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleStartLogin}
            className="w-full py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 font-semibold text-sm border border-white/10 active:scale-[0.98] transition-all"
          >
            Ya tengo cuenta — Iniciar Sesión
          </button>

          <p className="text-[10px] text-center text-slate-500 pt-1">
            Al continuar aceptas nuestros Términos de Servicio y Privacidad
          </p>
        </div>
      </div>
    );
  }

  // Pantalla directa de Auth (Login / Registro completo sin la landing page web)
  return (
    <div className="min-h-screen bg-[#07090E] text-white">
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
