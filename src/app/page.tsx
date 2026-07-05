'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dashboard from './dashboard';
import ClientDashboard from './client-dashboard';
import dynamic from 'next/dynamic';
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

function Logo({ large, onClick }: { large?: boolean; onClick?: () => void }) {
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
        <span className="lf-logo-logi" style={{ color: 'var(--text, #1B1B2F)', fontWeight: 800, letterSpacing: '-0.5px' }}>LOGI</span>
        <span className="lf-logo-fast" style={{ color: 'var(--primario, #FF5722)', fontWeight: 800, letterSpacing: '-0.5px' }}>FAST</span>
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
    setAuthTransition('exit');
    setTimeout(() => {
      setCurrentView(mode);
      setAuthTransition('enter');
      setLoginErrors({});
      setRegErrors({});
      setTimeout(() => setAuthTransition(null), 250);
    }, 200);
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

          {/* Role-specific Micro-Visuals */}
          <div className="mt-9 h-12 flex items-center justify-center">
            {loginRole === 'cliente' && (
              <span className="badge badge-soft badge-success uppercase tracking-widest text-xs font-semibold px-3 py-1">
                📦 Cargando Envío Express
              </span>
            )}

            {loginRole === 'repartidor' && (
              <div className="flex flex-col items-center gap-2">
                {/* Preline style progress bar */}
                <div className="relative w-28 h-1 bg-warning/20 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full w-10 bg-warning rounded-full"
                    style={{ animation: 'drive-moto 1.5s infinite linear' }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">Optimizando coordenadas GPS...</span>
              </div>
            )}

            {loginRole === 'admin' && (
              <div className="flex gap-1 h-6 items-end">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{
                    width: '3px',
                    height: `${6 + i * 4}px`,
                    background: 'var(--primario)',
                    borderRadius: '2px',
                    animation: `wave-grow 1s infinite alternate ${i * 0.12}s`,
                  }} />
                ))}
              </div>
            )}

            {loginRole === 'ingeniero' && (
              <div className="flex gap-3 items-center text-secondary font-semibold text-sm">
                <span style={{ animation: 'spin-gear 2.5s infinite linear' }} className="flex items-center"><IconWrench /></span>
                <span>Calibrando sensores de flota...</span>
              </div>
            )}
          </div>
        </div>
      </Transition>

      {/* ═══════════════════════════════════════════════════════
         AUTH VIEWS (Login / Register Redesigned with Flyon UI Component Classes)
         ═══════════════════════════════════════════════════════ */}
      {(currentView === 'login' || currentView === 'register') && (
        <div className="lp-auth-split" style={{ opacity: authTransition === 'exit' ? 0 : 1, transition: 'opacity 0.25s ease' }}>
          
          {/* Left Column (Banner/Sidebar) */}
          <div className="lp-auth-sidebar">
            <div className="lp-auth-sidebar-glow" />
            
            <div>
              <Logo large />
              <div style={{ marginTop: '60px' }}>
                <h2 className="lp-auth-sidebar-title font-syne">
                  Logística inteligente en tiempo real
                </h2>
                <p className="lp-auth-sidebar-text">
                  Entregas seguras en menos de 25 minutos, control operativo de flotas, mantenimiento predictivo y facturación inteligente.
                </p>
              </div>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>
              © {new Date().getFullYear()} LOGIFAST. Todos los derechos reservados.
            </div>
          </div>

          {/* Right Column (Form Panel) */}
          <div className="lp-auth-form-side">
            <div className="lp-auth-card" style={{ transform: authTransition === 'enter' ? 'translateY(10px)' : 'none', opacity: authTransition === 'enter' ? 0.9 : 1, transition: 'all 0.3s ease' }}>
              
              {/* Logo for mobile viewports */}
              <div className="lp-auth-logo-header">
                <Logo large />
                <span className="text-xs text-gray-500 font-medium">Plataforma Logística Inteligente</span>
              </div>

              {/* ─── LOGIN PANEL ─── */}
              {currentView === 'login' && (
                <div>
                  <h1 className="font-syne text-3xl font-extrabold mb-2 tracking-tight text-base-content">
                    Bienvenido de nuevo
                  </h1>
                  <p className="text-sm text-gray-500 mb-8">
                    Ingresa a tu cuenta para continuar operando.
                  </p>

                  <form onSubmit={handleLogin} noValidate className="flex flex-col gap-5">
                    
                    {/* Email Input */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">Correo electrónico</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          className={`input input-bordered input-primary w-full pl-10 ${loginErrors.email ? 'input-error' : ''}`}
                          placeholder="tu@email.com"
                          value={loginEmail}
                          onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); }}
                        />
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400"><IconEnvelope /></span>
                      </div>
                      {loginErrors.email && <span className="label-text-alt text-error mt-1">{loginErrors.email}</span>}
                    </div>

                    {/* Password Input */}
                    <div className="form-control w-full">
                      <div className="flex justify-between items-center">
                        <label className="label py-1">
                          <span className="label-text font-semibold">Contraseña</span>
                        </label>
                        <button type="button" className="text-xs text-primary font-semibold hover:underline">
                          ¿La olvidaste?
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          className={`input input-bordered input-primary w-full pl-10 pr-12 ${loginErrors.password ? 'input-error' : ''}`}
                          placeholder="Ingresa tu contraseña"
                          value={loginPassword}
                          onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); }}
                        />
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400"><IconLock /></span>
                        <button 
                          type="button" 
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowLoginPassword((p) => !p)}
                        >
                          {showLoginPassword ? <IconEyeOff /> : <IconEye />}
                        </button>
                      </div>
                      {loginErrors.password && <span className="label-text-alt text-error mt-1">{loginErrors.password}</span>}
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="btn btn-primary w-full font-syne mt-2" disabled={loginLoading}>
                      {loginLoading ? <span className="loading loading-spinner"></span> : 'Iniciar sesión'}
                    </button>
                  </form>

                  {/* Demo Access Section (FlyonUI divider & cards) */}
                  <div className="divider text-xs text-gray-400 my-8">Acceso rápido a roles demo</div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cliente', label: 'Cliente', icon: <IconPerson /> },
                      { id: 'repartidor', label: 'Repartidor', icon: <IconMoto /> },
                      { id: 'admin', label: 'Admin', icon: <IconShield /> },
                      { id: 'ingeniero', label: 'Ingeniero', icon: <IconWrench /> },
                    ].map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleDemoLogin(role.id)}
                        className="btn btn-outline btn-sm justify-start gap-3 h-11 border-gray-200 text-gray-700 dark:text-gray-300 dark:border-gray-700"
                      >
                        <span className="text-primary">{role.icon}</span>
                        <span className="font-semibold text-xs">{role.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-sm text-center mt-8">
                    ¿No tienes cuenta?{' '}
                    <button onClick={() => switchAuth('register')} className="text-primary font-bold hover:underline bg-none border-none cursor-pointer">
                      Regístrate aquí
                    </button>
                  </div>

                  <button 
                    onClick={() => navigateTo('landing')} 
                    className="btn btn-ghost btn-sm gap-2 mt-6 text-gray-500 hover:text-gray-700"
                  >
                    <IconArrowLeft /> Volver al portal
                  </button>
                </div>
              )}

              {/* ─── REGISTER PANEL ─── */}
              {currentView === 'register' && !regSuccess && (
                <div>
                  <h1 className="font-syne text-3xl font-extrabold mb-2 tracking-tight text-base-content">
                    Crea tu cuenta
                  </h1>
                  <p className="text-sm text-gray-500 mb-6">
                    Forma parte de la red de logística urbana líder.
                  </p>

                  <form onSubmit={handleRegister} noValidate className="flex flex-col gap-4">
                    
                    {/* Full Name */}
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-semibold">Nombre completo</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className={`input input-bordered input-primary w-full pl-10 ${displayRegErrors.name ? 'input-error' : ''}`}
                          placeholder="Tu nombre completo"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                        />
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400"><IconUser /></span>
                      </div>
                      {displayRegErrors.name && <span className="label-text-alt text-error mt-1">{displayRegErrors.name}</span>}
                    </div>

                    {/* Email */}
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-semibold">Correo electrónico</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          className={`input input-bordered input-primary w-full pl-10 ${displayRegErrors.email ? 'input-error' : ''}`}
                          placeholder="tu@email.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400"><IconEnvelope /></span>
                      </div>
                      {displayRegErrors.email && <span className="label-text-alt text-error mt-1">{displayRegErrors.email}</span>}
                    </div>

                    {/* Password */}
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-semibold">Contraseña</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          className={`input input-bordered input-primary w-full pl-10 pr-12 ${displayRegErrors.password ? 'input-error' : ''}`}
                          placeholder="Mínimo 6 caracteres"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400"><IconLock /></span>
                        <button 
                          type="button" 
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowRegPassword((p) => !p)}
                        >
                          {showRegPassword ? <IconEyeOff /> : <IconEye />}
                        </button>
                      </div>
                      
                      {regPassword && (
                        <div className="lf-strength-bar mt-2">
                          <div className="lf-strength-segments">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`lf-strength-segment ${i <= pwStrength.level ? `filled-${pwStrength.cls}` : ''}`}
                              />
                            ))}
                          </div>
                          {pwStrength.label && (
                            <span className={`lf-strength-text ${pwStrength.cls}`}>{pwStrength.label}</span>
                          )}
                        </div>
                      )}
                      {displayRegErrors.password && <span className="label-text-alt text-error mt-1">{displayRegErrors.password}</span>}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-semibold">Confirmar contraseña</span>
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          className={`input input-bordered input-primary w-full pl-10 ${displayRegErrors.confirm ? 'input-error' : ''}`}
                          placeholder="Repite tu contraseña"
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                        />
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400"><IconLock /></span>
                      </div>
                      {displayRegErrors.confirm && <span className="label-text-alt text-error mt-1">{displayRegErrors.confirm}</span>}
                    </div>

                    {/* Account Type (Grid Selector) */}
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text font-semibold">Tipo de cuenta</span>
                      </label>
                      <div className="register-role-grid">
                        {[
                          { id: 'cliente', label: 'Cliente', icon: <IconPerson /> },
                          { id: 'repartidor', label: 'Repartidor', icon: <IconMoto /> },
                          { id: 'admin', label: 'Admin', icon: <IconShield /> },
                          { id: 'ingeniero', label: 'Ingeniero', icon: <IconWrench /> },
                        ].map((role) => (
                          <div
                            key={role.id}
                            className={`register-role-card ${regRole === role.id ? 'selected' : ''}`}
                            onClick={() => { setRegRole(role.id); setRegErrors((p) => ({ ...p, role: '' })); }}
                          >
                            <div className="register-role-card-check"><IconCheckSmall /></div>
                            <span className="register-role-icon">{role.icon}</span>
                            <span className="register-role-label">{role.label}</span>
                          </div>
                        ))}
                      </div>
                      {displayRegErrors.role && <span className="label-text-alt text-error">{displayRegErrors.role}</span>}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="form-control mt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          className={`lf-terms-checkbox flex-shrink-0 mt-0.5 ${regTerms ? 'checked' : ''}`}
                          onClick={() => { setRegTerms((p) => !p); setRegErrors((p) => ({ ...p, terms: '' })); }}
                        >
                          {regTerms && <IconCheckSmall />}
                        </div>
                        <span className="text-xs leading-normal text-gray-500">
                          Acepto los{' '}
                          <a href="#" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); alert('LOGIFAST — USO LÍCITO:\n\n1. La plataforma solo podrá usarse para actividades lícitas.\n2. Se prohíbe el transporte de sustancias ilícitas o drogas.'); }}>
                            Términos de Uso Lícito
                          </a>
                          {' '}y la{' '}
                          <a href="#" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); alert('POLÍTICA DE PRIVACIDAD:\n\nTus datos de cuenta y localización se encriptan y se procesan en base a la normativa.'); }}>
                            Privacidad
                          </a>.
                        </span>
                      </label>
                      {displayRegErrors.terms && <span className="label-text-alt text-error mt-2">{displayRegErrors.terms}</span>}
                    </div>

                    {/* Submit Registration */}
                    <button type="submit" className="btn btn-primary w-full font-syne mt-4" disabled={regLoading}>
                      {regLoading ? <span className="loading loading-spinner"></span> : 'Crear cuenta'}
                    </button>
                  </form>

                  <div className="text-sm text-center mt-6">
                    ¿Ya tienes cuenta?{' '}
                    <button onClick={() => switchAuth('login')} className="text-primary font-bold hover:underline bg-none border-none cursor-pointer">
                      Inicia sesión
                    </button>
                  </div>

                  <button 
                    onClick={() => navigateTo('landing')} 
                    className="btn btn-ghost btn-sm gap-2 mt-6 text-gray-500 hover:text-gray-700"
                  >
                    <IconArrowLeft /> Volver al portal
                  </button>
                </div>
              )}

              {/* REGISTER SUCCESS PANEL */}
              {currentView === 'register' && regSuccess && (
                <div className="text-center p-4">
                  <div className="bg-success/10 text-success w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconCheckLg />
                  </div>
                  <h2 className="font-syne text-2xl font-extrabold mb-3 text-base-content">Cuenta creada</h2>
                  <p className="text-gray-500 mb-8">Tu registro ha sido exitoso. Ya puedes acceder al sistema.</p>
                  <button className="btn btn-primary w-full font-syne" onClick={() => { setRegSuccess(false); switchAuth('login'); }}>
                    Ir a iniciar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         REDESIGNED LANDING PAGE (With FlyonUI & Preline UI components)
         ═══════════════════════════════════════════════════════ */}
      {currentView === 'landing' && (
        <div className="ud-landing-wrapper">
          <div className="ud-grid-background" />
          <div className="lp-hero-glow-1" />
          <div className="lp-hero-glow-2" />

          {/* ─── HEADER / NAVBAR ─── */}
          <nav className={`lp-navbar ${navScrolled ? 'scrolled' : ''}`}>
            <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

            <ul className="flex list-none gap-8 font-syne text-sm font-semibold text-gray-500 dark:text-gray-400">
              <li><a href="#features" className="hover:text-primary transition-colors">Características</a></li>
              <li><a href="#calculator" className="hover:text-primary transition-colors">Calcular Tarifa</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">Proceso</a></li>
              <li><a href="#allies" className="hover:text-primary transition-colors">Aliados</a></li>
            </ul>

            <div className="flex items-center gap-4">
              <button 
                className="btn btn-circle btn-ghost text-base-content hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
                onClick={toggleTheme} 
                aria-label="Cambiar tema"
              >
                {isDark ? <IconSun /> : <IconMoon />}
              </button>
              
              <button className="btn btn-outline border-gray-300 text-base-content dark:border-gray-700 btn-md h-11" onClick={() => navigateTo('login')}>
                Ingresar
              </button>
              
              <button className="btn btn-primary btn-md h-11" onClick={() => navigateTo('register')}>
                Comenzar
              </button>
            </div>

            {/* Hamburger Button for Mobile */}
            <button 
              className="btn btn-circle btn-ghost text-base-content lp-hamburger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menu principal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </nav>

          {/* Mobile Sliding Drawer Menu */}
          <Transition
            show={mobileMenuOpen}
            enter="transition-all duration-300 ease-out"
            enterFrom="opacity-0 translate-x-full"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-200 ease-in"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 translate-x-full"
          >
            <div className="mobile-nav-drawer">
              <div>
                <div className="mobile-drawer-header">
                  <Logo onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                  <button className="btn btn-circle btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                    <IconX />
                  </button>
                </div>
                <ul className="mobile-drawer-links">
                  <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Características</a></li>
                  <li><a href="#calculator" onClick={() => setMobileMenuOpen(false)}>Calcular Tarifa</a></li>
                  <li><a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Proceso</a></li>
                  <li><a href="#allies" onClick={() => setMobileMenuOpen(false)}>Aliados</a></li>
                </ul>
              </div>
              <div className="mobile-drawer-actions">
                <button className="btn btn-outline w-full h-12" onClick={() => { setMobileMenuOpen(false); navigateTo('login'); }}>
                  Ingresar
                </button>
                <button className="btn btn-primary w-full h-12" onClick={() => { setMobileMenuOpen(false); navigateTo('register'); }}>
                  Comenzar
                </button>
              </div>
            </div>
          </Transition>

          {/* ─── HERO SECTION ─── */}
          <section className="lp-hero">
            <div className="lp-hero-grid">
              <div className="text-left">
                <div className="lp-hero-badge">
                  <span className="w-2 h-2 bg-primary rounded-full" style={{ animation: 'udPulse 1.2s infinite' }} />
                  Entrega Garantizada en 25 minutos en Managua
                </div>
                
                <h1 className="lp-hero-title">
                  Logística Urbana de <span>Siguiente Generación</span>
                </h1>
                
                <p className="lp-hero-subtitle">
                  Conectamos tu negocio con una red inteligente de entrega express. Controla tu facturación, optimiza rutas satelitales y monitorea mantenimientos en tiempo real desde una sola plataforma.
                </p>

                <div className="lp-hero-actions">
                  <button className="lp-btn-primary" onClick={() => navigateTo('register')}>
                    Crear Cuenta Gratis
                    <IconArrowRight />
                  </button>
                  <button className="lp-btn-outline" onClick={() => navigateTo('login')}>
                    Ver Demo de Roles
                  </button>
                </div>
              </div>

              {/* Radar mockup widget on the right */}
              <div className="radar-widget rounded-3xl p-6 bg-base-100 border border-gray-200/60 dark:border-gray-800/60 shadow-xl flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-success rounded-full" style={{ animation: 'udPulse 1s infinite' }} />
                    <span className="text-xs font-bold text-gray-500">Operaciones GPS Activas</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Motos en ruta: 45</span>
                </div>

                <div className="radar-screen relative h-72 bg-gray-950 rounded-2xl border border-blue-900/30 overflow-hidden flex items-center justify-center">
                  <div className="radar-sweep" />
                  <div className="radar-circle" style={{ width: '70px', height: '70px' }} />
                  <div className="radar-circle" style={{ width: '140px', height: '140px' }} />
                  <div className="radar-circle" style={{ width: '210px', height: '210px' }} />
                  
                  {/* Blinking Map Dots representing fleet */}
                  <div className="absolute top-1/4 left-1/3 w-2.5 h-2.5 bg-success rounded-full shadow-[0_0_10px_var(--exito)]" style={{ animation: 'udPulse 1.5s infinite' }} />
                  <div className="absolute bottom-1/3 right-1/3 w-2.5 h-2.5 bg-success rounded-full shadow-[0_0_10px_var(--exito)]" style={{ animation: 'udPulse 1.8s infinite' }} />
                  <div className="absolute top-1/2 right-1/4 w-2.5 h-2.5 bg-warning rounded-full shadow-[0_0_10px_#FF5722]" style={{ animation: 'udPulse 1.2s infinite' }} />
                  <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-primary rounded-full" />

                  <span className="absolute bottom-3 text-[9px] text-gray-500 font-mono tracking-wider">
                    COBERTURA DE ENTREGA MANAGUA
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── BENTO FEATURES SECTION ─── */}
          <section className="lp-section" id="features">
            <div className="lp-section-header">
              <span className="lp-section-tag">ROLES Y FUNCIONES</span>
              <h2 className="lp-section-title">
                Una plataforma, cuatro pilares operativos
              </h2>
            </div>

            <div className="lp-bento-grid">
              
              {/* Card 1: Cliente */}
              <div className="lp-bento-card">
                <div className="lp-bento-icon">
                  <IconPerson />
                </div>
                <h3 className="lp-bento-title">Portal de Clientes</h3>
                <p className="lp-bento-desc">
                  Solicita envíos urbanos al instante, consulta precios automáticos dinámicos según distancia, y gestiona tu historial de compras y facturación de forma automatizada.
                </p>
                
                {/* Mini client status widget */}
                <div className="lp-bento-preview flex flex-col gap-2 mt-4 rounded-xl p-4">
                  <div className="bento-mini-card">
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>ORDEN #1084</span>
                      <span className="text-success font-bold">● EN CAMINO</span>
                    </div>
                    <div className="font-syne text-xs mt-1 text-base-content">Bolonia → Altamira</div>
                    <div className="text-[10px] text-gray-400 mt-1">Llegada estimada: 12 min</div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px' }} className="flex gap-2 flex-wrap">
                  <span className="badge badge-soft badge-success text-[10px] font-bold px-3 py-1">Pagos Seguros</span>
                  <span className="badge badge-soft badge-success text-[10px] font-bold px-3 py-1">Monitoreo en vivo</span>
                </div>
              </div>

              {/* Card 2: Repartidores */}
              <div className="lp-bento-card">
                <div className="lp-bento-icon" style={{ background: 'var(--secundario-soft)', color: 'var(--secundario)' }}>
                  <IconMoto />
                </div>
                <h3 className="lp-bento-title">Panel de Repartidores</h3>
                <p className="lp-bento-desc">
                  Asignación inteligente de pedidos basada en geolocalización, optimización satelital de rutas y billetera virtual en tiempo real.
                </p>

                {/* Mini driver route navigation status */}
                <div className="lp-bento-preview flex flex-col gap-2 mt-4 rounded-xl p-4">
                  <div className="bento-mini-card">
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>NUEVA RUTA OPTIMIZADA</span>
                      <span className="text-primary font-mono font-bold">4.2 km</span>
                    </div>
                    <div className="font-syne text-xs mt-1 text-base-content">Evitar tráfico en Carr. Masaya</div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-warning rounded-full" style={{ width: '70%' }} />
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold">70%</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                  <span className="badge badge-soft badge-warning text-[10px] font-bold px-3 py-1">Ruta Óptima GPS</span>
                </div>
              </div>

              {/* Card 3: Admin */}
              <div className="lp-bento-card">
                <div className="lp-bento-icon">
                  <IconShield />
                </div>
                <h3 className="lp-bento-title">Consola de Control</h3>
                <p className="lp-bento-desc">
                  Auditoría completa de envíos, analíticas financieras, asignación manual de repartidores y monitoreo logístico absoluto de la ciudad.
                </p>

                {/* Mini financial metrics widget */}
                <div className="lp-bento-preview flex flex-col gap-2 mt-4 rounded-xl p-4">
                  <div className="bento-mini-card">
                    <div className="text-[10px] text-gray-400">INGRESOS DE HOY</div>
                    <div className="text-sm font-extrabold font-mono text-base-content mt-0.5">C$ 12,450.00</div>
                    <div className="flex gap-2 mt-1.5">
                      <div className="text-[9px] bg-success/15 text-success px-1.5 py-0.5 rounded font-bold">+18.2% vs ayer</div>
                      <div className="text-[9px] text-gray-400 font-semibold">142 envíos</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                  <span className="badge badge-soft badge-primary text-[10px] font-bold px-3 py-1">Control de Flota</span>
                </div>
              </div>

              {/* Card 4: Ingenieros */}
              <div className="lp-bento-card col-2">
                <div className="lp-bento-icon" style={{ color: '#8E44AD', background: 'rgba(142,68,173,0.1)' }}>
                  <IconWrench />
                </div>
                <h3 className="lp-bento-title">Mantenimiento de Flota</h3>
                <p className="lp-bento-desc">
                  Diseñado para ingenieros y mecánicos. Controla el inventario de repuestos, agenda alertas de mantenimientos preventivos y gestiona las solicitudes de reparaciones de cada motocicleta.
                </p>

                {/* Mini mechanical status metrics widget */}
                <div className="lp-bento-preview grid grid-cols-2 gap-3 mt-4 rounded-xl p-4">
                  <div className="bento-mini-card">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">MOTO M-004</div>
                    <div className="text-xs text-base-content mt-1 flex justify-between">
                      <span>Aceite Motor</span>
                      <span className="text-success font-bold">100%</span>
                    </div>
                    <div className="text-[9px] text-gray-400">Estado: Excelente</div>
                  </div>
                  <div className="bento-mini-card">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">MOTO M-009</div>
                    <div className="text-xs text-base-content mt-1 flex justify-between">
                      <span>Frenos Traseros</span>
                      <span className="text-error font-bold">20%</span>
                    </div>
                    <div className="text-[9px] text-error font-bold">⚠️ Reemplazo Crítico</div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px' }} className="flex gap-2 flex-wrap">
                  <span className="badge badge-soft badge-secondary text-[10px] font-bold px-3 py-1" style={{ color: '#8E44AD', background: 'rgba(142,68,173,0.1)' }}>Alertas Preventivas</span>
                  <span className="badge badge-soft badge-secondary text-[10px] font-bold px-3 py-1" style={{ color: '#8E44AD', background: 'rgba(142,68,173,0.1)' }}>Ficha Mecánica</span>
                </div>
              </div>

            </div>
          </section>

          {/* ─── INTERACTIVE COST CALCULATOR SECTION ─── */}
          <section className="lp-section" id="calculator">
            <div className="lp-section-header">
              <span className="lp-section-tag">Calculadora</span>
              <h2 className="lp-section-title">Calcula tu tarifa en tiempo real</h2>
            </div>
            
            <div className="ud-interactive-panel max-w-3xl mx-auto">
              <div className="ud-panel-header">
                <span className="font-syne font-bold text-sm text-base-content">Simulador de Envíos</span>
                <span className="badge badge-soft badge-primary text-[10px] font-bold">Tarifador Logifast</span>
              </div>
              <div className="ud-panel-body">
                <div className="ud-calc-widget">
                  <div className="ud-calc-controls">
                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span>Distancia del envío</span>
                        <span className="text-primary font-mono">{distance} km</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        value={distance} 
                        onChange={(e) => setDistance(parseInt(e.target.value))}
                        className="ud-range-slider"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>1 km (Cercano)</span>
                        <span>30 km (Límite municipal)</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-sm font-semibold mb-3 text-base-content">Peso estimado del paquete</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'ligero', label: 'Ligero (< 5 kg)' },
                          { value: 'medio', label: 'Medio (5-15 kg)' },
                          { value: 'pesado', label: 'Pesado (> 15 kg)' },
                        ].map((pkg) => (
                          <button
                            key={pkg.value}
                            type="button"
                            className={`ud-weight-btn text-xs ${weight === pkg.value ? 'active' : ''}`}
                            onClick={() => setWeight(pkg.value)}
                          >
                            {pkg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ud-calc-result">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-1">Costo Estimado</span>
                      <span className="ud-calc-price">C$ {calculatePrice()}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 leading-normal mt-4">
                      *Precio estimado incluye recargo base de operaciones. Sujeto a cambios según clima y tráfico.
                    </div>
                    <button 
                      onClick={() => navigateTo('register')}
                      className="btn btn-primary btn-sm w-full font-syne mt-4"
                    >
                      Enviar Ahora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── HOW IT WORKS TIMELINE SECTION ─── */}
          <section className="lp-section" id="how-it-works">
            <div className="lp-section-header">
              <span className="lp-section-tag">Proceso</span>
              <h2 className="lp-section-title">Cómo funciona Logifast</h2>
            </div>
            
            <div className="lp-timeline">
              <div className="lp-timeline-step">
                <span className="lp-timeline-number">01</span>
                <h4 className="lp-timeline-title">Solicita tu envío</h4>
                <p className="lp-timeline-desc">Ingresa el punto de recogida y entrega en nuestro portal de cliente interactivo.</p>
              </div>
              <div className="lp-timeline-step">
                <span className="lp-timeline-number">02</span>
                <h4 className="lp-timeline-title">Asignación automática</h4>
                <p className="lp-timeline-desc">El algoritmo selecciona al repartidor más cercano usando coordenadas GPS.</p>
              </div>
              <div className="lp-timeline-step">
                <span className="lp-timeline-number">03</span>
                <h4 className="lp-timeline-title">Rastreo en tiempo real</h4>
                <p className="lp-timeline-desc">Monitorea la ubicación exacta de tu pedido en el mapa satelital interactivo.</p>
              </div>
              <div className="lp-timeline-step">
                <span className="lp-timeline-number">04</span>
                <h4 className="lp-timeline-title">Entrega exitosa</h4>
                <p className="lp-timeline-desc">Recibe el paquete de forma segura y califica la experiencia del servicio.</p>
              </div>
            </div>
          </section>

          {/* ─── ALLIES CAROUSEL ─── */}
          <section className="lf-partners py-16 border-y border-gray-200/40 dark:border-gray-800/40" id="allies">
            <div className="lf-partners-inner max-w-7xl mx-auto px-10">
              <div className="text-center mb-10">
                <span className="badge badge-soft badge-primary text-xs font-bold tracking-widest px-3 py-1 uppercase mb-2">Aliados comerciales</span>
                <h2 className="font-syne text-3xl font-extrabold text-base-content mt-2">
                  Empresas que confían en nosotros
                </h2>
              </div>

              <div className="lf-marquee mt-8">
                <div className="lf-marquee-track">
                  {[...Array(2)].map((_, loopIdx) => (
                    <React.Fragment key={loopIdx}>
                      {[
                        { src: '/logos/image1.png', name: 'Alquinicsa', sector: 'Automotriz & Construcción' },
                        { src: '/logos/image2.png', name: 'Delicias del Mar', sector: 'Restaurante & Distribución' },
                        { src: '/logos/image3.png', name: 'Burger Boss', sector: 'Alimentos & Bebidas' },
                        { src: '/logos/image4.png', name: 'Salud y Vida', sector: 'Sector Farmacéutico' },
                        { src: '/logos/image5.png', name: 'Autosym', sector: 'Audio & Accesorios' },
                        { src: '/logo.png', name: 'Logifast Delivery', sector: 'Operaciones Activas' },
                      ].map((partner, partnerIdx) => (
                        <div key={`${loopIdx}-${partnerIdx}`} className="lf-marquee-item">
                          <img src={partner.src} alt={partner.name} className="lf-marquee-logo" />
                          <div className="lf-marquee-info">
                            <span className="lf-marquee-name">{partner.name}</span>
                            <span className="lf-marquee-sector">{partner.sector}</span>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ─── CTA CONTACT SECTION ─── */}
          <section className="py-24 max-w-7xl mx-auto px-10 text-center" id="contact">
            <div className="bg-gradient-to-br from-primary to-blue-950 rounded-3xl p-16 text-white relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,87,34,0.25),transparent_60%)] pointer-events-none" />
              
              <h2 className="font-syne text-4xl font-extrabold mb-4 relative z-10">
                ¿Listo para transformar tus entregas?
              </h2>
              <p className="max-w-xl mx-auto mb-10 text-blue-100/80 text-base leading-relaxed relative z-10">
                Únete hoy y obtén tus primeros 5 envíos urbanos gratis en Managua. Conecta tu comercio en minutos.
              </p>
              
              <div className="flex gap-4 justify-center flex-wrap relative z-10">
                <button className="btn btn-warning px-8 h-14 font-syne hover:bg-orange-600 text-white" onClick={() => navigateTo('register')}>
                  Comenzar Ahora
                </button>
                <a href="mailto:soporte@logifast.com" className="btn btn-outline border-white/30 text-white hover:bg-white/10 px-8 h-14 font-syne">
                  Contactar Soporte
                </a>
              </div>
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="bg-base-200 py-12 border-t border-gray-200/50 dark:border-gray-800/50 text-center text-gray-500 text-sm">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <p className="mb-2">Conectando Managua con envíos inteligentes, rápidos y 100% seguros.</p>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} LOGIFAST. Todos los derechos reservados.</p>
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
