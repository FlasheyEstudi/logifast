'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dashboard from './dashboard';
import ClientDashboard from './client-dashboard';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useConfigStore, aplicarTema } from '@/store/configStore';
import { sileo } from "sileo";
import { Transition, Dialog } from '@headlessui/react';

const RepartidorApp = dynamic(() => import('@/components/repartidor/RepartidorApp'), { ssr: false });
const IngenieroApp = dynamic(() => import('@/components/ingeniero/IngenieroApp'), { ssr: false });

/* ═══════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════ */

const IconEnvelope = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);
const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconCheckLg = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--exito)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);
const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
);
const IconMoto = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M5 18h3l3-6h4l2 6h2"/><path d="M11 6l2 6"/></svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const IconWrench = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const IconCheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--exito)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const IconXCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--peligro)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);
const IconAlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);
const IconPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const IconCheckSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

/* ═══════════════════════════════════════════════════════
   TOAST TYPES
   ═══════════════════════════════════════════════════════ */

type ToastVariant = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id: number;
  title: string;
  desc?: string;
  variant: ToastVariant;
  leaving?: boolean;
}

/* ═══════════════════════════════════════════════════════
   DEMO CREDENTIALS
   ═══════════════════════════════════════════════════════ */

const demoCredentials: Record<string, { email: string; password: string; name: string }> = {
  cliente: { email: 'cliente@logifast.com', password: '123456', name: 'María López' },
  repartidor: { email: 'repartidor@logifast.com', password: '123456', name: 'Carlos Mendoza' },
  admin: { email: 'admin@logifast.com', password: '123456', name: 'Administrador' },
  ingeniero: { email: 'ingeniero@logifast.com', password: '123456', name: 'Ingeniero Demo' },
};

/* ═══════════════════════════════════════════════════════
   LOGO COMPONENT
   ═══════════════════════════════════════════════════════ */

function Logo({ large, onClick, darkText }: { large?: boolean; onClick?: () => void; darkText?: boolean }) {
  return (
    <div 
      className={`lf-logo ${large ? 'lf-logo-lg' : ''}`} 
      onClick={onClick} 
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <img 
        src="/logo.png" 
        alt="Logifast Logo" 
        style={{ 
          width: large ? '44px' : '32px', 
          height: large ? '44px' : '32px',
          objectFit: 'contain'
        }} 
      />
      <div className="lf-logo-wordmark" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <span className="lf-logo-logi" style={{ color: darkText ? '#1A1A24' : '#FFFFFF', fontWeight: 800, letterSpacing: '-0.5px' }}>LOGI</span>
        <span className="lf-logo-fast" style={{ color: '#0066FF', fontWeight: 800, letterSpacing: '-0.5px' }}>FAST</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD ERROR BOUNDARY
   ═══════════════════════════════════════════════════════ */

class DashboardErrorBoundary extends React.Component<{ onGoHome: () => void; children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { onGoHome: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("DashboardErrorBoundary caught an error", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error ? this.state.error.message : 'Error desconocido';
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#fff',
          padding: 24, textAlign: 'center', fontFamily: "'DM Sans', sans-serif"
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1B1B2F', marginBottom: 12 }}>
            Algo salió mal al cargar el Dashboard
          </h2>
          <p style={{ color: '#5A5A72', maxWidth: 450, margin: '0 auto 24px', fontSize: 15, lineHeight: 1.5 }}>
            Se produjo un error inesperado en la interfaz. Puedes reintentar cargar la vista o volver al inicio del portal.
          </p>
          <div style={{
            padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.12)', maxWidth: 500, width: '100%',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#DC2626',
            wordBreak: 'break-word', overflow: 'auto', maxHeight: 120, marginBottom: 16
          }}>
            {errorMessage}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#FF5722', color: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              Reintentar
            </button>
            <button
              onClick={this.props.onGoHome}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid #e5e7eb',
                background: '#fff', color: '#1B1B2F',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══════════════════════════════════════════════════════
   MAIN HOME PORTAL COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function Home() {
  /* ─── View state ─── */
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [viewTransition, setViewTransition] = useState<'enter' | 'exit' | null>(null);
  const [loginRole, setLoginRole] = useState<string>('admin');
  const [loginUserName, setLoginUserName] = useState<string>('Administrador');

  /* ─── Navigation/Interface state ─── */
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const revealRef = useRef<HTMLElement>(null);

  /* ─── Auth state ─── */
  const [authTransition, setAuthTransition] = useState<'enter' | 'exit' | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState('cliente');
  const [regTerms, setRegTerms] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  /* ─── Price Calculator State ─── */
  const [distance, setDistance] = useState(5);
  const [weight, setWeight] = useState('ligero');

  const calculatePrice = () => {
    let base = 35; // base price in Cordobas
    let perKm = 8;
    if (weight === 'medio') {
      base += 20;
      perKm = 10;
    } else if (weight === 'pesado') {
      base += 50;
      perKm = 15;
    }
    return base + (distance * perKm);
  };

  /* ─── Theme ─── */
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const tema = useConfigStore((s) => s.tema);
  const isDark =
    mounted && (
      tema === 'dark' ||
      (tema === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

  /* ─── Toasts ─── */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((title: string, desc: string, variant: ToastVariant = 'success') => {
    const msg = desc ? `${title}: ${desc}` : title;
    if (variant === 'success') {
      sileo.success({ title: msg });
    } else if (variant === 'error') {
      sileo.error({ title: msg });
    } else if (variant === 'warning') {
      sileo.warning({ title: msg });
    } else {
      sileo.info({ title: msg });
    }

    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, title, desc, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 4000);
  }, []);

  /* ─── Apply theme ─── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    aplicarTema(tema);
  }, [tema]);

  const toggleTheme = useCallback(() => {
    useConfigStore.getState().setTema(isDark ? 'light' : 'dark');
  }, [isDark]);

  /* ─── Navbar scroll effect ─── */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ─── Scroll reveal effect ─── */
  useEffect(() => {
    if (currentView !== 'landing') return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    const el = revealRef.current;
    if (el) el.querySelectorAll('.reveal').forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, [currentView]);

  /* ─── Navigation helpers ─── */
  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const navigateTo = useCallback((view: 'landing' | 'login' | 'register') => {
    setViewTransition('exit');
    setTimeout(() => {
      setCurrentView(view);
      setViewTransition('enter');
      document.body.style.overflow = view === 'landing' ? '' : 'hidden';
      setTimeout(() => setViewTransition(null), 300);
    }, 300);
  }, []);
  const switchAuth = useCallback((mode: 'login' | 'register') => {
    setCurrentView(mode);
    setLoginErrors({});
    setRegErrors({});
  }, []);

  /* ─── Validation ─── */
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getPasswordStrength = (pw: string): { level: number; label: string; cls: string } => {
    if (!pw) return { level: 0, label: '', cls: '' };
    if (pw.length <= 3) return { level: 1, label: 'Débil', cls: 'weak' };
    if (pw.length <= 5) return { level: 2, label: 'Regular', cls: 'regular' };
    if (pw.length <= 7) return { level: 3, label: 'Buena', cls: 'buena' };
    return { level: 4, label: 'Fuerte', cls: 'fuerte' };
  };

  /* ─── Login ─── */
  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!loginEmail) errors.email = 'El correo es obligatorio';
    else if (!isValidEmail(loginEmail)) errors.email = 'Ingresa un correo válido';
    if (!loginPassword) errors.password = 'La contraseña es obligatoria';
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Check demo credentials
    const demoEntry = Object.entries(demoCredentials).find(([, v]) => v.email === loginEmail && v.password === loginPassword);
    if (!demoEntry) {
      addToast('Error', 'Correo o contraseña incorrectos', 'error');
      return;
    }

    setLoginLoading(true);
    setLoginRole(demoEntry[0]);
    setLoginUserName(demoEntry[1].name);

    setTimeout(() => {
      setLoginLoading(false);
      addToast(`Bienvenido, ${demoEntry[1].name}`, 'Redirigiendo al dashboard...', 'success');
      setTimeout(() => setLoginRedirect(true), 800);
      setTimeout(() => {
        setCurrentView('dashboard');
        document.body.style.overflow = '';
        setLoginRedirect(false);
      }, 3300);
    }, 1200);
  }, [loginEmail, loginPassword, addToast]);

  /* ─── Demo quick login ─── */
  const handleDemoLogin = useCallback((role: string) => {
    const cred = demoCredentials[role];
    if (!cred) return;
    setLoginEmail(cred.email);
    setLoginPassword(cred.password);
    setLoginErrors({});
    setLoginRole(role);
    setLoginUserName(cred.name);
    setLoginLoading(true);

    setTimeout(() => {
      setLoginLoading(false);
      addToast(`Bienvenido, ${cred.name}`, 'Redirigiendo al dashboard...', 'success');
      setTimeout(() => setLoginRedirect(true), 800);
      setTimeout(() => {
        setCurrentView('dashboard');
        document.body.style.overflow = '';
        setLoginRedirect(false);
      }, 3300);
    }, 1200);
  }, [addToast]);

  /* ─── Register ─── */
  const handleRegister = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.name = 'El nombre es obligatorio';
    if (!regEmail) errors.email = 'El correo es obligatorio';
    else if (!isValidEmail(regEmail)) errors.email = 'Ingresa un correo válido';
    if (!regPassword) errors.password = 'La contraseña es obligatoria';
    else if (regPassword.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (!regConfirm) errors.confirm = 'Confirma tu contraseña';
    else if (regPassword !== regConfirm) errors.confirm = 'Las contraseñas no coinciden';
    if (!regRole) errors.role = 'Selecciona un tipo de cuenta';
    if (!regTerms) errors.terms = 'Debes aceptar los términos';
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setRegLoading(true);
    setTimeout(() => {
      setRegLoading(false);
      setRegSuccess(true);
    }, 1500);
  }, [regName, regEmail, regPassword, regConfirm, regRole, regTerms]);

  /* ─── Logout ─── */
  const handleLogout = useCallback(() => {
    setCurrentView('landing');
    setLoginEmail('');
    setLoginPassword('');
    document.body.style.overflow = '';
    addToast('Sesión cerrada', 'Has cerrado sesión correctamente', 'info');
  }, [addToast]);

  /* ─── Validation helper execution ─── */
  const regValidationErrors = (() => {
    const errors: Record<string, string> = {};
    if (regEmail && regEmail.length > 5 && !isValidEmail(regEmail)) errors.email = 'Ingresa un correo válido';
    if (regConfirm && regPassword !== regConfirm) errors.confirm = 'Las contraseñas no coinciden';
    return errors;
  })();
  const displayRegErrors = { ...regValidationErrors, ...regErrors };
  const pwStrength = getPasswordStrength(regPassword);

  /* ═══════════════════════════════════════════════════════
     DASHBOARD VIEW
     ═══════════════════════════════════════════════════════ */
  if (currentView === 'dashboard') {
    if (loginRole === 'cliente') {
      return (
        <ClientDashboard isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} userName={loginUserName} />
      );
    }
    if (loginRole === 'repartidor') {
      return (
        <RepartidorApp isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} />
      );
    }
    if (loginRole === 'ingeniero') {
      return (
        <IngenieroApp onLogout={handleLogout} userName={loginUserName} />
      );
    }
    return (
      <DashboardErrorBoundary onGoHome={() => setCurrentView('landing')}>
        <Dashboard isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} />
      </DashboardErrorBoundary>
    );
  }

  return (
    <>
      {/* CSS overrides for styling alignment with FlyonUI / Preline UI */}
      <style dangerouslySetInnerHTML={{ __html: `
        .new-lp-wrapper {
          background-color: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        /* Mobile Hamburger & Nav Collapse */
        .lp-hamburger {
          display: none;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .lp-navbar ul {
            display: none !important;
          }
          .lp-navbar .flex.items-center.gap-4 {
            display: none !important;
          }
          .lp-hamburger {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }

        /* Mobile Nav Sliding Drawer */
        .mobile-nav-drawer {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(250, 248, 245, 0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex;
          flex-direction: column;
          padding: 24px 32px;
          justify-content: space-between;
        }
        [data-theme="dark"] .mobile-nav-drawer {
          background: rgba(10, 10, 15, 0.99);
        }

        .mobile-drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
        }

        .mobile-drawer-links {
          display: flex;
          flex-direction: column;
          gap: 28px;
          list-style: none;
          padding: 0;
          margin: 40px 0;
        }
        .mobile-drawer-links a {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: var(--text);
          text-decoration: none;
          transition: color 0.2s;
        }
        .mobile-drawer-links a:hover {
          color: var(--primario);
        }

        .mobile-drawer-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        /* Premium Bento Card Previews */
        .lp-bento-preview {
          background: rgba(245, 243, 240, 0.45) !important;
          border: 1px solid rgba(232, 228, 222, 0.7) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        [data-theme="dark"] .lp-bento-preview {
          background: rgba(26, 26, 36, 0.45) !important;
          border-color: rgba(42, 42, 56, 0.7) !important;
        }

        .bento-mini-card {
          background: var(--surface) !important;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: var(--shadow-sm);
          font-size: 12px;
          font-weight: 600;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Input glow on focus */
        .lp-auth-card input:focus {
          border-color: var(--primario) !important;
          box-shadow: 0 0 0 3px var(--primario-soft) !important;
          outline: none;
        }

        /* floating animations */
        .float-card {
          animation: floating 4s ease-in-out infinite;
        }
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        /* Marquee horizontal allies list (kept) */
        .lf-partners {
          padding: 60px 0;
          overflow: hidden;
          background: var(--bg-alt);
        }
        .lf-marquee {
          position: relative;
          width: 100%;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
        }
        .lf-marquee-track {
          display: flex;
          gap: 32px;
          width: max-content;
          animation: marquee 28s linear infinite;
        }
        .lf-marquee-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: var(--shadow-sm);
        }
        .lf-marquee-logo {
          height: 38px;
          width: auto;
          object-fit: contain;
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin-gear {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes hop-box {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(0.96); }
        }
        @keyframes radar-pulse {
          0% { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes drive-moto {
          0% { transform: translateX(-35px); }
          100% { transform: translateX(115px); }
        }
        @keyframes wave-grow {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      ` }} />

      {/* ═══════════════════════════════════════════════════════
         AUTH REDIRECT OVERLAY (Headless UI Transition + Flyon UI loading components)
         ═══════════════════════════════════════════════════════ */}
      <Transition
        show={loginRedirect}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: isDark ? '#080710' : '#FAF8F5',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          
          {/* Main Visual Animation Box */}
          <div className="relative flex items-center justify-center mb-9 w-44 h-44">
            
            {/* Dynamic Glow Pulsing Backplane */}
            <div 
              className="absolute w-36 h-36 rounded-full"
              style={{
                background: loginRole === 'cliente' ? 'radial-gradient(circle, rgba(0, 200, 83, 0.28) 0%, transparent 70%)'
                          : loginRole === 'repartidor' ? 'radial-gradient(circle, rgba(255, 87, 34, 0.28) 0%, transparent 70%)'
                          : loginRole === 'admin' ? 'radial-gradient(circle, rgba(7, 100, 226, 0.28) 0%, transparent 70%)'
                          : 'radial-gradient(circle, rgba(142, 68, 173, 0.28) 0%, transparent 70%)',
                animation: 'radar-pulse 2.2s infinite ease-out',
              }} 
            />

            {/* Flyon UI Loader Spinner Ring */}
            <span 
              className={`absolute loading loading-ring w-32 h-32 ${
                loginRole === 'cliente' ? 'text-success'
                : loginRole === 'repartidor' ? 'text-warning'
                : loginRole === 'admin' ? 'text-primary'
                : 'text-secondary'
              }`}
            />

            {/* Central Logo Container */}
            <div 
              className="relative z-10 p-4 rounded-full w-20 h-20 flex items-center justify-center"
              style={{
                background: isDark ? '#14131F' : '#FFFFFF',
                boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.08)',
                animation: 'hop-box 2.2s infinite ease-in-out',
              }}
            >
              <img src="/logo.png" alt="Logifast" className="w-12 h-12 object-contain" />
            </div>

            {/* Orbiting Mini Role Badge */}
            <div className={`absolute bottom-2.5 right-2.5 z-20 p-2 rounded-full shadow-md text-white flex items-center justify-center ${
              loginRole === 'cliente' ? 'bg-success'
              : loginRole === 'repartidor' ? 'bg-warning'
              : loginRole === 'admin' ? 'bg-primary'
              : 'bg-secondary'
            }`}>
              {loginRole === 'cliente' && <IconPerson />}
              {loginRole === 'repartidor' && <IconMoto />}
              {loginRole === 'admin' && <IconShield />}
              {loginRole === 'ingeniero' && <IconWrench />}
            </div>
          </div>

          {/* Heading */}
          <h3 className="font-syne text-2xl font-extrabold mb-2.5 tracking-tight" style={{ color: isDark ? '#FFFFFF' : '#1B1B2F' }}>
            {loginRole === 'cliente' && 'Acceso Cliente'}
            {loginRole === 'repartidor' && 'Conexión Repartidor'}
            {loginRole === 'admin' && 'Panel Administrador'}
            {loginRole === 'ingeniero' && 'Consola Técnica'}
          </h3>

          {/* Loader log indicator */}
          <p className="font-mono text-xs flex items-center gap-2 m-0" style={{ color: 'var(--text-secondary)' }}>
            <span 
              className={`inline-block w-2 h-2 rounded-full ${
                loginRole === 'cliente' ? 'bg-success'
                : loginRole === 'repartidor' ? 'bg-warning'
                : loginRole === 'admin' ? 'bg-primary'
                : 'bg-secondary'
              }`}
              style={{ animation: 'udPulse 1s infinite' }}
            />
            Conectando como {loginUserName}...
          </p>

          <div className="mt-8 flex items-center justify-center">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        </div>
      </Transition>

      {/* ═══════════════════════════════════════════════════════
         AUTH VIEWS (Apple-Inspired Premium Design)
         ═══════════════════════════════════════════════════════ */}
      {(currentView === 'login' || currentView === 'register') && (
        <div className="apple-auth-split relative overflow-hidden" style={{ opacity: 1, transition: 'opacity 0.25s ease' }}>
          
          {/* Left Column (Banner/Sidebar - Cyber Telemetry Command Center) */}
          <div className="apple-auth-sidebar flex flex-col justify-between p-10 bg-[#FAF9F6] border-r border-[#1D1D1F]/10 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,255,0.04),transparent_50%)]" />
            
            {/* Top Bar */}
            <div className="z-10 flex justify-between items-center">
              <Logo large darkText />
              <span className="text-[9px] font-mono bg-[#0066FF]/5 border border-[#0066FF]/15 px-2.5 py-1 rounded-md text-[#0066FF] font-bold tracking-widest flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,102,255,0.05)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-ping" />
                SYS_STATUS: ACTIVE
              </span>
            </div>
            
            {/* Middle Section (Command Console Graphics) */}
            <div className="z-10 my-auto flex flex-col gap-6">
              <div>
                <h2 className="font-syne text-[30px] font-black tracking-tight text-[#1A1A24] mb-2 leading-[1.12]">
                  La velocidad de tu negocio, sincronizada.
                </h2>
                <p className="text-xs text-[#525262] leading-relaxed max-w-sm">
                  Supervisa la red en tiempo real, asocia fichas mecánicas para mantenimiento de flota y audita transacciones de cobro.
                </p>
              </div>

              {/* Scrolling Telemetry Terminal Console */}
              <div className="relative w-full h-44 bg-[#0C0D12] rounded-xl border border-black/10 p-4 overflow-hidden group">
                <div className="absolute top-2 right-3 text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded pointer-events-none group-hover:hidden">
                  LIVE TELEMETRY FEED
                </div>
                <div className="absolute top-2 right-3 text-[8px] font-mono text-warning bg-warning/10 px-2 py-0.5 rounded pointer-events-none hidden group-hover:inline-block">
                  FEED IN PAUSE
                </div>

                <div className="w-full h-full overflow-hidden relative mt-1 select-none">
                  <div className="terminal-scroller text-[9px] font-mono text-emerald-500/80 tracking-wide leading-normal">
                    <p className="text-blue-400 font-bold">[SYS] BOOT: LOGIFAST Fleet Core v2026.7.1 initialized...</p>
                    <p>[SYS] NETWORK: Connected to GPS gateway server (Managua Node)...</p>
                    <p>[SYS] SECURE: SSL/TLS handshake completed. AES-256 encrypted session.</p>
                    <p className="text-yellow-400">[API] AUDIT: Dispatcher sync initiated (0ms latency)...</p>
                    <p className="text-gray-400">[RIDER] ACTIVE: Rider_34 (Juigalpa Route) is now online.</p>
                    <p>[RIDER] EN_ROUTE: Rider_09 (Managua Centro) dispatched for Order #9812.</p>
                    <p className="text-purple-400">[SYS] telemetry stream: 12.1154 N, 86.2731 W - Speed 42km/h</p>
                    <p className="text-blue-400 font-bold">[SYS] BOOT: LOGIFAST Fleet Core v2026.7.1 initialized...</p>
                    <p>[SYS] NETWORK: Connected to GPS gateway server (Managua Node)...</p>
                    <p>[SYS] SECURE: SSL/TLS handshake completed. AES-256 encrypted session.</p>
                    <p className="text-yellow-400">[API] AUDIT: Dispatcher sync initiated (0ms latency)...</p>
                    <p className="text-gray-400">[RIDER] ACTIVE: Rider_34 (Juigalpa Route) is now online.</p>
                    <p>[RIDER] EN_ROUTE: Rider_09 (Managua Centro) dispatched for Order #9812.</p>
                    <p className="text-purple-400">[SYS] telemetry stream: 12.1154 N, 86.2731 W - Speed 42km/h</p>
                  </div>
                </div>
              </div>

              {/* Mini Radar Graphic */}
              <div className="relative w-full h-36 bg-[#0C0D12] rounded-xl border border-black/10 overflow-hidden flex items-center justify-center">
                <div className="radar-sweep absolute" style={{ background: 'conic-gradient(from 0deg, rgba(0, 102, 255, 0.15) 0deg, rgba(0, 102, 255, 0) 120deg)' }} />
                <div className="radar-circle w-10 h-10 border border-[#0066FF]/10" />
                <div className="radar-circle w-20 h-20 border border-[#0066FF]/10" />
                <div className="radar-circle w-28 h-28 border border-[#0066FF]/10" />
                <div className="absolute top-8 left-1/3 w-1.5 h-1.5 bg-[#0066FF] rounded-full shadow-[0_0_6px_#0066FF]" style={{ animation: 'pulse-dot 1.4s infinite' }} />
                <div className="absolute bottom-10 right-1/4 w-1.5 h-1.5 bg-[#0066FF] rounded-full shadow-[0_0_6px_#0066FF]" style={{ animation: 'pulse-dot 2.2s infinite' }} />
                <span className="absolute bottom-2 left-3 text-[7.5px] font-mono text-gray-500">
                  METROPOLITAN GRID // ANTENNA 01
                </span>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="text-xs text-gray-600 z-10 font-mono flex justify-between items-center">
              <span>© {new Date().getFullYear()} LOGIFAST CO.</span>
              <span className="text-[10px] text-gray-500">SECURE SHELL v2.4</span>
            </div>
          </div>

          {/* Right Column (Form Panel with glowing ambient blobs background) */}
          <div className="apple-auth-form-side relative flex items-center justify-center bg-[#030304]">
            
            {/* Ambient blur blobs */}
            <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-indigo-500/5 blur-[140px] pointer-events-none" />
            
            <div className="apple-auth-card z-10" style={{ 
              background: 'rgba(10, 10, 15, 0.72)',
              backdropFilter: 'blur(32px) saturate(210%)',
              border: '1px solid rgba(0, 102, 255, 0.16)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 30px rgba(0, 102, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              transform: authTransition === 'enter' ? 'translateY(6px)' : 'none', 
              opacity: authTransition === 'enter' ? 0.92 : 1, 
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)' 
            }}>
              
              {/* Logo for mobile viewports */}
              <div className="flex flex-col items-center mb-6 md:hidden">
                <Logo large />
                <span className="text-[9px] font-mono text-[#0066FF] mt-1 tracking-wider uppercase animate-pulse">Operational Grid Connected</span>
              </div>

              {/* Hybrid Form Switching Tabs */}
              <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl mb-6">
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${currentView === 'login' ? 'bg-[#0066FF] text-white shadow-[0_4px_12px_rgba(0,102,255,0.35)]' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => switchAuth('login')}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${currentView === 'register' ? 'bg-[#0066FF] text-white shadow-[0_4px_12px_rgba(0,102,255,0.35)]' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => switchAuth('register')}
                >
                  Crear cuenta
                </button>
              </div>

              <AnimatePresence mode="wait">
                {/* ─── LOGIN PANEL ─── */}
                {currentView === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h1 className="font-syne text-xl font-extrabold mb-1 tracking-tight text-white">
                      Acceso de Operaciones
                    </h1>
                    <p className="text-xs text-gray-400 mb-5">
                      Ingresa a la consola integrada de flotas de LOGIFAST.
                    </p>

                    <form onSubmit={handleLogin} noValidate className="flex flex-col gap-3.5">
                      
                      {/* Email Input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-400">Usuario / Correo</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            className={`apple-input-field pl-9 bg-white/[0.04] border-white/10 hover:border-white/20 focus:border-[#0066FF] focus:bg-white/[0.06] focus:ring-1 focus:ring-[#0066FF]/30 text-white rounded-xl ${loginErrors.email ? 'border-error/50' : ''}`}
                            placeholder="nombre@empresa.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                          />
                          <span className="absolute left-3 top-3.5 text-gray-500"><IconEnvelope /></span>
                        </div>
                        {loginErrors.email && <span className="text-[10px] text-error font-medium">{loginErrors.email}</span>}
                      </div>

                      {/* Password Input */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-gray-400">Contraseña</label>
                          <button type="button" className="text-[11px] text-[#0066FF] font-semibold hover:underline">
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type={showLoginPassword ? 'text' : 'password'}
                            className={`apple-input-field pl-9 pr-9 bg-white/[0.04] border-white/10 hover:border-white/20 focus:border-[#0066FF] focus:bg-white/[0.06] focus:ring-1 focus:ring-[#0066FF]/30 text-white rounded-xl ${loginErrors.password ? 'border-error/50' : ''}`}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                          />
                          <span className="absolute left-3 top-3.5 text-gray-500"><IconLock /></span>
                          <button 
                            type="button" 
                            className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                          >
                            {showLoginPassword ? <IconEyeOff /> : <IconEye />}
                          </button>
                        </div>
                        {loginErrors.password && <span className="text-[10px] text-error font-medium">{loginErrors.password}</span>}
                      </div>

                      {/* Submit Button */}
                      <button type="submit" className="apple-btn-filled justify-center w-full mt-2 bg-gradient-to-r from-[#0052FF] to-[#0070F3] hover:from-[#0042E5] hover:to-[#0060E2] text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_14px_rgba(0,102,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,102,255,0.4)] transition-all duration-200 border-none" disabled={loginLoading}>
                        {loginLoading ? <span className="loading loading-spinner text-white"></span> : 'Acceder a la Consola'}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex py-4 items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink mx-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">ACCESO RÁPIDO DEMO</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    {/* Redesigned Demo Profile Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { role: 'cliente', label: 'Cliente', desc: 'Solicitar entregas', icon: <IconPerson />, glowColor: 'hover:shadow-[0_0_12px_rgba(0,102,255,0.2)] hover:border-[#0066FF]/30' },
                        { role: 'repartidor', label: 'Rider', desc: 'Rutas y GPS', icon: <IconMoto />, glowColor: 'hover:shadow-[0_0_12px_rgba(0,102,255,0.2)] hover:border-[#0066FF]/30' },
                        { role: 'admin', label: 'Administrador', desc: 'Control operacional', icon: <IconShield />, glowColor: 'hover:shadow-[0_0_12px_rgba(0,102,255,0.2)] hover:border-[#0066FF]/30' },
                        { role: 'ingeniero', label: 'Mecánico', desc: 'Flota y repuestos', icon: <IconWrench />, glowColor: 'hover:shadow-[0_0_12px_rgba(0,102,255,0.2)] hover:border-[#0066FF]/30' }
                      ].map((profile) => (
                        <button
                          key={profile.role}
                          type="button"
                          className={`flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-left transition-all ${profile.glowColor} hover:bg-white/[0.05]`}
                          onClick={() => handleDemoLogin(profile.role)}
                        >
                          <span className="p-2 rounded-lg bg-white/5 text-white/70">
                            {profile.icon}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-white leading-tight">{profile.label}</span>
                            <span className="text-[8.5px] text-gray-500 font-medium leading-none mt-0.5">{profile.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Back to Home Link */}
                    <button onClick={() => setCurrentView('landing')} className="flex items-center gap-1.5 mx-auto mt-6 text-xs text-gray-500 hover:text-white font-semibold transition-colors">
                      <IconArrowLeft /> Volver al portal
                    </button>
                  </motion.div>
                )}

                {/* ─── REGISTER PANEL ─── */}
                {currentView === 'register' && !regSuccess && (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h1 className="font-syne text-xl font-extrabold mb-1 tracking-tight text-white">
                      Crear Cuenta
                    </h1>
                    <p className="text-xs text-gray-400 mb-5">
                      Únete a la red y administra tus entregas express.
                    </p>

                    <form onSubmit={handleRegister} noValidate className="flex flex-col gap-3">
                      
                      {/* Name Input */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-semibold text-gray-400">Nombre completo</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            className={`apple-input-field pl-9 bg-white/[0.04] border-white/10 hover:border-white/20 focus:border-[#0066FF] focus:bg-white/[0.06] focus:ring-1 focus:ring-[#0066FF]/30 text-white rounded-xl ${displayRegErrors.name ? 'border-error/50' : ''}`}
                            placeholder="Tu nombre"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                          />
                          <span className="absolute left-3 top-3.5 text-gray-500"><IconUser /></span>
                        </div>
                        {displayRegErrors.name && <span className="text-[10px] text-error font-medium">{displayRegErrors.name}</span>}
                      </div>

                      {/* Email Input */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-semibold text-gray-400">Correo corporativo</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            className={`apple-input-field pl-9 bg-white/[0.04] border-white/10 hover:border-white/20 focus:border-[#0066FF] focus:bg-white/[0.06] focus:ring-1 focus:ring-[#0066FF]/30 text-white rounded-xl ${displayRegErrors.email ? 'border-error/50' : ''}`}
                            placeholder="nombre@empresa.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                          />
                          <span className="absolute left-3 top-3.5 text-gray-500"><IconEnvelope /></span>
                        </div>
                        {displayRegErrors.email && <span className="text-[10px] text-error font-medium">{displayRegErrors.email}</span>}
                      </div>

                      {/* Password Input */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-semibold text-gray-400">Contraseña</label>
                        <div className="relative">
                          <input 
                            type={showRegPassword ? 'text' : 'password'}
                            className={`apple-input-field pl-9 pr-9 bg-white/[0.04] border-white/10 hover:border-white/20 focus:border-[#0066FF] focus:bg-white/[0.06] focus:ring-1 focus:ring-[#0066FF]/30 text-white rounded-xl ${displayRegErrors.password ? 'border-error/50' : ''}`}
                            placeholder="Mínimo 6 caracteres"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                          />
                          <span className="absolute left-3 top-3.5 text-gray-500"><IconLock /></span>
                          <button 
                            type="button" 
                            className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                          >
                            {showRegPassword ? <IconEyeOff /> : <IconEye />}
                          </button>
                        </div>

                        {/* Interactive Password strength bar and checklist */}
                        {regPassword && (
                          <div className="mt-2 bg-black/20 p-2 rounded-lg border border-white/5">
                            <div className="lf-strength-bar">
                              <div className="lf-strength-segments">
                                {[1, 2, 3, 4].map((i) => (
                                  <div 
                                    key={i} 
                                    className={`lf-strength-segment ${
                                      i <= pwStrength.level 
                                        ? pwStrength.level === 1 ? 'bg-error'
                                          : pwStrength.level === 2 ? 'bg-warning'
                                          : pwStrength.level === 3 ? 'bg-info'
                                          : 'bg-success'
                                        : ''
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-[8.5px] font-mono mt-1 block" style={{ 
                                color: pwStrength.level === 1 ? 'var(--peligro)'
                                     : pwStrength.level === 2 ? 'var(--warning)'
                                     : pwStrength.level === 3 ? 'var(--info)'
                                     : 'var(--exito)'
                              }}>
                                INTEGRIDAD: {pwStrength.label}
                              </span>
                            </div>
                            
                            {/* Live Checklist */}
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5 pt-1.5 border-t border-white/5">
                              <div className="flex items-center gap-1.5 text-[8.5px]">
                                <span className={`w-1 h-1 rounded-full ${regPassword.length >= 6 ? 'bg-success' : 'bg-gray-600'}`} />
                                <span className={regPassword.length >= 6 ? 'text-success/90 font-medium' : 'text-gray-500'}>Mínimo 6 caracteres</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[8.5px]">
                                <span className={`w-1 h-1 rounded-full ${/\d/.test(regPassword) ? 'bg-success' : 'bg-gray-600'}`} />
                                <span className={/\d/.test(regPassword) ? 'text-success/90 font-medium' : 'text-gray-500'}>Tiene número</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[8.5px]">
                                <span className={`w-1 h-1 rounded-full ${/[A-Z]/.test(regPassword) ? 'bg-success' : 'bg-gray-600'}`} />
                                <span className={/[A-Z]/.test(regPassword) ? 'text-success/90 font-medium' : 'text-gray-500'}>Tiene mayúscula</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[8.5px]">
                                <span className={`w-1 h-1 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(regPassword) ? 'bg-success' : 'bg-gray-600'}`} />
                                <span className={/[!@#$%^&*(),.?":{}|<>]/.test(regPassword) ? 'text-success/90 font-medium' : 'text-gray-500'}>Tiene símbolo</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {displayRegErrors.password && <span className="text-[10px] text-error font-medium">{displayRegErrors.password}</span>}
                      </div>

                      {/* Confirm Password Input */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-semibold text-gray-400">Confirmar contraseña</label>
                        <div className="relative">
                          <input 
                            type="password" 
                            className={`apple-input-field pl-9 bg-white/[0.04] border-white/10 hover:border-white/20 focus:border-[#0066FF] focus:bg-white/[0.06] focus:ring-1 focus:ring-[#0066FF]/30 text-white rounded-xl ${displayRegErrors.confirm ? 'border-error/50' : ''}`}
                            placeholder="Repite tu contraseña"
                            value={regConfirm}
                            onChange={(e) => setRegConfirm(e.target.value)}
                          />
                          <span className="absolute left-3 top-3.5 text-gray-500"><IconLock /></span>
                        </div>
                        {displayRegErrors.confirm && <span className="text-[10px] text-error font-medium">{displayRegErrors.confirm}</span>}
                      </div>

                      {/* Redesigned 2x2 Role Selector Grid */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-400">Tipo de Cuenta</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'cliente', label: 'Cliente', desc: 'Realiza envíos', icon: <IconPerson /> },
                            { value: 'repartidor', label: 'Rider', desc: 'Entrega paquetes', icon: <IconMoto /> },
                            { value: 'admin', label: 'Admin', desc: 'Control operacional', icon: <IconShield /> },
                            { value: 'ingeniero', label: 'Mecánico', desc: 'Flota y repuestos', icon: <IconWrench /> }
                          ].map((roleOption) => (
                            <button
                              key={roleOption.value}
                              type="button"
                              className={`apple-select-btn flex items-start gap-2 p-2 text-left transition-all bg-white/[0.02] border-white/5 hover:bg-white/[0.04] ${regRole === roleOption.value ? 'active ring-1 ring-primary border-primary/50' : ''}`}
                              onClick={() => setRegRole(roleOption.value)}
                            >
                              <span className={`p-1.5 rounded-lg ${regRole === roleOption.value ? 'bg-[#0066FF]/10 text-[#0066FF]' : 'bg-white/5 text-gray-500'}`}>
                                {roleOption.icon}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-white leading-tight">{roleOption.label}</span>
                                <span className="text-[8px] text-gray-500 font-medium leading-none mt-0.5">{roleOption.desc}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        {displayRegErrors.role && <span className="text-[10px] text-error font-medium">{displayRegErrors.role}</span>}
                      </div>

                      {/* Terms Checkbox */}
                      <div className="flex items-start gap-2 mt-1.5">
                        <input 
                          type="checkbox" 
                          id="regTerms"
                          className="checkbox checkbox-xs checkbox-primary mt-0.5 border-white/20 bg-black/40"
                          checked={regTerms}
                          onChange={(e) => setRegTerms(e.target.checked)}
                        />
                        <label htmlFor="regTerms" className="text-[10.5px] text-gray-500 leading-normal">
                          Acepto los <span className="text-[#0066FF] hover:underline cursor-pointer font-bold">Términos de servicio</span> y la <span className="text-[#0066FF] hover:underline cursor-pointer font-bold">Política de privacidad</span>.
                        </label>
                      </div>
                      {displayRegErrors.terms && <span className="text-[10px] text-error font-medium block">{displayRegErrors.terms}</span>}

                      {/* Submit Button */}
                      <button type="submit" className="apple-btn-filled justify-center w-full mt-2 bg-gradient-to-r from-[#0052FF] to-[#0070F3] hover:from-[#0042E5] hover:to-[#0060E2] text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_14px_rgba(0,102,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,102,255,0.4)] transition-all duration-200 border-none" disabled={regLoading}>
                        {regLoading ? <span className="loading loading-spinner text-white"></span> : 'Crear Cuenta Operativa'}
                      </button>
                    </form>

                    {/* Back to Home Link */}
                    <button onClick={() => setCurrentView('landing')} className="flex items-center gap-1.5 mx-auto mt-6 text-xs text-gray-500 hover:text-white font-semibold transition-colors">
                      <IconArrowLeft /> Volver al portal
                    </button>
                  </motion.div>
                )}

                {/* REGISTER SUCCESS PANEL */}
                {currentView === 'register' && regSuccess && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22 }}
                    className="text-center py-6"
                  >
                    <div className="bg-success/15 text-success w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(0,200,83,0.2)]">
                      <IconCheckLg />
                    </div>
                    <h2 className="font-syne text-xl font-extrabold mb-1.5 text-white">Registro Completado</h2>
                    <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto">Tu cuenta en la red operativa de flotas de LOGIFAST ha sido creada con éxito.</p>
                    <button className="apple-btn-filled justify-center w-full bg-gradient-to-r from-[#0052FF] to-[#0070F3] text-white border-none shadow-[0_4px_12px_rgba(0,102,255,0.3)]" onClick={() => { setRegSuccess(false); switchAuth('login'); }}>
                      Ingresar a la Consola
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         REDESIGNED LANDING PAGE (Apple Worthy Design)
         ═══════════════════════════════════════════════════════ */}
      {currentView === 'landing' && (
        <div className="apple-landing-wrapper">
          <div className="ud-grid-background" />

          {/* ─── HEADER / NAVBAR ─── */}
          <nav className={`apple-navbar ${navScrolled ? 'scrolled' : ''}`}>
            <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

            <ul className="apple-nav-links">
              <li><a href="#features" className="apple-nav-link">Características</a></li>
              <li><a href="#calculator" className="apple-nav-link">Tarifador</a></li>
              <li><a href="#how-it-works" className="apple-nav-link">Proceso</a></li>
              <li><a href="#allies" className="apple-nav-link">Aliados</a></li>
            </ul>

            <div className="flex items-center gap-3">
              {/* Light/Dark Toggle */}
              <button 
                onClick={toggleTheme} 
                className="btn btn-circle btn-ghost btn-sm text-base-content"
                aria-label="Alternar tema"
              >
                {isDark ? <IconSun /> : <IconMoon />}
              </button>

              <button className="apple-nav-btn-secondary" onClick={() => navigateTo('login')}>
                Ingresar
              </button>
              <button className="apple-nav-btn-primary" onClick={() => navigateTo('register')}>
                Comenzar
              </button>

              {/* Mobile Drawer Hamburger */}
              <button 
                className="btn btn-circle btn-ghost btn-sm text-base-content apple-hamburger"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </nav>

          {/* Mobile Menu Drawer */}
          <Transition
            show={mobileMenuOpen}
            enter="transition-all duration-300 ease-out"
            enterFrom="opacity-0 translate-x-1/2"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-200 ease-in"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 translate-x-1/2"
          >
            <div className="apple-drawer-menu">
              <div>
                <div className="flex justify-between items-center">
                  <Logo onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                  <button className="btn btn-circle btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                    <IconX />
                  </button>
                </div>
                <ul className="apple-drawer-links">
                  <li><a href="#features" className="apple-drawer-link" onClick={() => setMobileMenuOpen(false)}>Características</a></li>
                  <li><a href="#calculator" className="apple-drawer-link" onClick={() => setMobileMenuOpen(false)}>Tarifador</a></li>
                  <li><a href="#how-it-works" className="apple-drawer-link" onClick={() => setMobileMenuOpen(false)}>Proceso</a></li>
                  <li><a href="#allies" className="apple-drawer-link" onClick={() => setMobileMenuOpen(false)}>Aliados</a></li>
                </ul>
              </div>
              <div className="flex flex-col gap-2.5">
                <button className="apple-btn-border w-full py-3.5" onClick={() => { setMobileMenuOpen(false); navigateTo('login'); }}>
                  Ingresar
                </button>
                <button className="apple-btn-filled w-full py-3.5 justify-center" onClick={() => { setMobileMenuOpen(false); navigateTo('register'); }}>
                  Comenzar
                </button>
              </div>
            </div>
          </Transition>

          {/* ─── HERO SECTION ─── */}
          <section className="apple-hero-section">
            <div className="apple-hero-badge">
              <span className="w-2.5 h-2.5 bg-primary rounded-full" style={{ animation: 'pulse-dot 1.2s infinite' }} />
              Logística Express Urbana en Managua
            </div>
            
            <h1 className="apple-hero-title font-syne">
              Velocidad Operativa. <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 bg-clip-text text-transparent">Sincronizada al segundo.</span>
            </h1>
            
            <p className="apple-hero-subtitle">
              Sincroniza tu negocio con una red inteligente de entrega express. Controla tu facturación, optimiza rutas satelitales y gestiona el mantenimiento preventivo de tu flota en tiempo real.
            </p>

            <div className="apple-hero-actions">
              <button className="apple-btn-filled" onClick={() => navigateTo('register')}>
                Comenzar gratis
                <IconArrowRight />
              </button>
              <button className="apple-btn-border" onClick={() => navigateTo('login')}>
                Probar Demo de Roles
              </button>
            </div>

            {/* Premium Mockup Widget */}
            <div className="apple-mockup-frame">
              <div className="apple-mockup-screen flex flex-col justify-between p-5">
                <div className="flex justify-between items-center text-white/90">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full" style={{ animation: 'pulse-dot 1s infinite' }} />
                    <span className="text-[10px] font-bold tracking-wider uppercase">Operaciones de Flota Activas</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-mono">Consola GPS Satelital</span>
                </div>

                {/* Radar Grid and sweep animation */}
                <div className="relative flex-grow flex items-center justify-center overflow-hidden my-3 bg-slate-950/40 border border-slate-900/60 rounded-xl">
                  <div className="radar-sweep" />
                  <div className="radar-circle w-20 h-20" />
                  <div className="radar-circle w-40 h-40" />
                  <div className="radar-circle w-60 h-60" />
                  
                  {/* Blinking points */}
                  <div className="absolute top-1/4 left-1/3 w-2.5 h-2.5 bg-success rounded-full shadow-[0_0_10px_#00c853]" style={{ animation: 'pulse-dot 1.4s infinite' }} />
                  <div className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-success rounded-full shadow-[0_0_10px_#00c853]" style={{ animation: 'pulse-dot 1.9s infinite' }} />
                  <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-warning rounded-full shadow-[0_0_10px_#ffb300]" style={{ animation: 'pulse-dot 1.1s infinite' }} />
                  
                  <span className="absolute bottom-3 text-[8.5px] text-slate-500 font-mono tracking-widest">
                    ZONA METROPOLITANA MANAGUA
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── BENTO FEATURES SECTION ─── */}
          <section className="apple-section border-t border-gray-100 dark:border-gray-900" id="features">
            <div className="apple-section-header">
              <span className="apple-section-tag">Roles & Herramientas</span>
              <h2 className="apple-section-title font-syne">
                Una plataforma integrada para cuatro perfiles operativos
              </h2>
            </div>

            <div className="apple-bento-grid">
              
              {/* Client Card */}
              <div className="apple-bento-card">
                <div className="apple-bento-icon">
                  <IconPerson />
                </div>
                <h3 className="apple-bento-title">Portal de Clientes</h3>
                <p className="apple-bento-desc">
                  Solicita envíos express, cotiza tarifas dinámicas según distancia y volumen, y mantén un registro de facturas automatizado.
                </p>
                <div className="mt-auto pt-2">
                  <span className="text-[9px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Monitoreo en vivo</span>
                </div>
              </div>

              {/* Rider Card */}
              <div className="apple-bento-card">
                <div className="apple-bento-icon">
                  <IconMoto />
                </div>
                <h3 className="apple-bento-title">Panel de Repartidores</h3>
                <p className="apple-bento-desc">
                  Asignación automática basada en proximidad GPS, indicaciones paso a paso y control de ganancias en tu billetera digital.
                </p>
                <div className="mt-auto pt-2">
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Rutas satelitales</span>
                </div>
              </div>

              {/* Console Control Card */}
              <div className="apple-bento-card">
                <div className="apple-bento-icon">
                  <IconShield />
                </div>
                <h3 className="apple-bento-title">Consola de Control</h3>
                <p className="apple-bento-desc">
                  Auditoría completa de entregas, analíticas de rendimiento financiero y herramientas para la resolución de contingencias.
                </p>
                <div className="mt-auto pt-2">
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-400/10 px-2 py-0.5 rounded-full">Auditoría total</span>
                </div>
              </div>

              {/* Engineers Card */}
              <div className="apple-bento-card col-4">
                <div className="apple-bento-icon">
                  <IconWrench />
                </div>
                <h3 className="apple-bento-title">Mantenimiento de Flota</h3>
                <p className="apple-bento-desc">
                  Módulo especializado para ingenieros y mecánicos. Controla el inventario de repuestos críticos, agenda mantenimientos preventivos y asocia hojas de trabajo a las motocicletas del equipo.
                </p>
                <div className="mt-auto pt-2 flex gap-2">
                  <span className="text-[9px] font-bold text-warning bg-warning/10 px-2.5 py-0.5 rounded-full">Alertas predictivas</span>
                  <span className="text-[9px] font-bold text-warning bg-warning/10 px-2.5 py-0.5 rounded-full">Ficha mecánica</span>
                </div>
              </div>

            </div>
          </section>

          {/* ─── INTERACTIVE COST CALCULATOR SECTION ─── */}
          <section className="apple-section border-t border-gray-100 dark:border-gray-900" id="calculator">
            <div className="apple-section-header">
              <span className="apple-section-tag">Calculadora</span>
              <h2 className="apple-section-title font-syne">Tarifas transparentes al instante</h2>
            </div>
            
            <div className="apple-calc-card">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span>Distancia del envío</span>
                    <span className="text-primary font-mono font-bold">{distance} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    value={distance} 
                    onChange={(e) => setDistance(parseInt(e.target.value))}
                    className="apple-range"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1.5">
                    <span>1 km</span>
                    <span>30 km (Límite Managua)</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold mb-2.5">Peso estimado del paquete</span>
                  <div className="apple-btn-group">
                    {[
                      { value: 'ligero', label: 'Ligero (< 5 kg)' },
                      { value: 'medio', label: 'Medio (5-15 kg)' },
                      { value: 'pesado', label: 'Pesado (> 15 kg)' },
                    ].map((pkg) => (
                      <button
                        key={pkg.value}
                        type="button"
                        className={`apple-select-btn ${weight === pkg.value ? 'active' : ''}`}
                        onClick={() => setWeight(pkg.value)}
                      >
                        {pkg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-5 flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Costo Estimado</span>
                  <span className="text-3xl font-extrabold font-mono text-primary">C$ {calculatePrice()}</span>
                  <p className="text-[9.5px] text-gray-400 mt-1.5 text-center max-w-xs">
                    *El precio final puede variar ligeramente según condiciones climáticas excepcionales o congestión vial en tiempo real.
                  </p>
                  <button 
                    onClick={() => navigateTo('register')}
                    className="apple-btn-filled mt-4 w-full max-w-xs justify-center"
                  >
                    Solicitar envío ahora
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ─── PROCESS STEPS SECTION ─── */}
          <section className="apple-section border-t border-gray-100 dark:border-gray-900" id="how-it-works">
            <div className="apple-section-header">
              <span className="apple-section-tag">Proceso</span>
              <h2 className="apple-section-title font-syne">Cómo opera el sistema</h2>
            </div>
            
            <div className="apple-timeline">
              <div className="apple-timeline-step">
                <span className="apple-timeline-num">01</span>
                <h4 className="apple-timeline-title">Solicitud</h4>
                <p className="apple-timeline-desc">Establece el origen y destino en el mapa inteligente.</p>
              </div>
              <div className="apple-timeline-step">
                <span className="apple-timeline-num">02</span>
                <h4 className="apple-timeline-title">Asignación</h4>
                <p className="apple-timeline-desc">El algoritmo selecciona al motorizado óptimo cercano.</p>
              </div>
              <div className="apple-timeline-step">
                <span className="apple-timeline-num">03</span>
                <h4 className="apple-timeline-title">Rastreo</h4>
                <p className="apple-timeline-desc">Sigue el avance en vivo con notificaciones activas.</p>
              </div>
              <div className="apple-timeline-step">
                <span className="apple-timeline-num">04</span>
                <h4 className="apple-timeline-title">Entrega</h4>
                <p className="apple-timeline-desc">Tu paquete llega a salvo y calificas el servicio prestado.</p>
              </div>
            </div>
          </section>

          {/* ─── ALLIES LOGO GRID ─── */}
          <section className="apple-section border-t border-gray-100 dark:border-gray-900" id="allies">
            <div className="text-center mb-10">
              <span className="apple-section-tag">Alianzas comerciales</span>
              <h2 className="apple-section-title font-syne">Confían en nuestra red</h2>
            </div>

            <div className="apple-partners-grid">
              {[
                { src: '/logos/image1.png', name: 'Alquinicsa' },
                { src: '/logos/image2.png', name: 'Delicias del Mar' },
                { src: '/logos/image3.png', name: 'Burger Boss' },
                { src: '/logos/image4.png', name: 'Salud y Vida' },
                { src: '/logos/image5.png', name: 'Autosym' },
                { src: '/logo.png', name: 'Logifast' },
              ].map((p, idx) => (
                <div key={idx} className="apple-partner-logo" title={p.name}>
                  <img src={p.src} alt={p.name} className="h-9 object-contain grayscale" />
                </div>
              ))}
            </div>
          </section>

          {/* ─── CTA CONTACT SECTION ─── */}
          <section className="apple-section border-t border-gray-100 dark:border-gray-900">
            <div className="apple-cta-card">
              <h2 className="apple-cta-title font-syne">Transforma tus entregas hoy</h2>
              <p className="apple-cta-desc">
                Crea tu cuenta de negocio en minutos y obtén tus primeros envíos urbanos de cortesía en Managua.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button className="apple-btn-filled bg-white text-black hover:bg-gray-100" onClick={() => navigateTo('register')}>
                  Comenzar ahora
                </button>
                <a href="mailto:soporte@logifast.com" className="apple-btn-border border-white/30 text-white hover:border-white hover:bg-white/10 px-8 py-3.5 text-sm font-semibold rounded-full no-underline inline-flex items-center">
                  Contactar soporte
                </a>
              </div>
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="border-t border-gray-100 dark:border-gray-900 py-12 text-center text-gray-500 text-xs">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <p className="mb-2">Entregas inteligentes, rápidas y seguras en toda la ciudad.</p>
            <p className="text-gray-400">© {new Date().getFullYear()} LOGIFAST. Todos los derechos reservados.</p>
          </footer>
        </div>
      )}

      {/* TOAST NOTIFICATION STACK */}
      <div className="lf-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`lf-toast ${t.variant} ${t.leaving ? 'leaving' : ''}`}>
            <span className="lf-toast-icon">
              {t.variant === 'success' && <IconCheckCircle />}
              {t.variant === 'error' && <IconXCircle />}
              {t.variant === 'warning' && <IconAlertTriangle />}
              {t.variant === 'info' && <IconInfo />}
            </span>
            <div className="lf-toast-content">
              <div className="lf-toast-title">{t.title}</div>
              {t.desc && <div className="lf-toast-desc">{t.desc}</div>}
            </div>
            <button className="lf-toast-close" onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
              <IconX />
            </button>
            <div className="lf-toast-progress" />
          </div>
        ))}
      </div>
    </>
  );
}
