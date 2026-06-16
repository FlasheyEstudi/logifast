'use client';

import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import Dashboard from './dashboard';
import ClientDashboard from './client-dashboard';
import dynamic from 'next/dynamic';
import { useConfigStore, aplicarTema } from '@/store/configStore';

const RepartidorApp = dynamic(() => import('@/components/repartidor/RepartidorApp'), { ssr: false });

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
   COUNT-UP HOOK
   ═══════════════════════════════════════════════════════ */

function useCountUp(end: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let raf: number;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);
  return start ? value : 0;
}

/* ═══════════════════════════════════════════════════════
   LOGO COMPONENT
   ═══════════════════════════════════════════════════════ */

function Logo({ large, onClick }: { large?: boolean; onClick?: () => void }) {
  return (
    <div className={`lf-logo ${large ? 'lf-logo-lg' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="lf-logo-icon">
        <span className="lf-logo-icon-text">LF</span>
        <div className="lf-logo-icon-line" />
      </div>
      <div className="lf-logo-wordmark">
        <span className="lf-logo-logi">LOGI</span>
        <span className="lf-logo-fast">
          F
          <span className="lf-logo-fast-a">A</span>
          ST
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAT COMPONENT WITH COUNT-UP
   ═══════════════════════════════════════════════════════ */

function StatCounter({ value, suffix, label, started }: { value: number; suffix?: string; label: string; started: boolean }) {
  const count = useCountUp(value, 2200, started);
  const formatted = count.toLocaleString();
  return (
    <div className="lf-hero-stat">
      <span className="lf-hero-stat-number font-mono">{formatted}{suffix || ''}</span>
      <span className="lf-hero-stat-label">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   DASHBOARD ERROR BOUNDARY
   ═══════════════════════════════════════════════════════ */

interface DashboardErrorBoundaryProps {
  onGoHome: () => void;
  children: React.ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DashboardErrorBoundary extends Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Page Dashboard Error Boundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Error desconocido';
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: 'var(--bg, #FAF8F5)',
          fontFamily: "'DM Sans', sans-serif", padding: 24, gap: 20,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: 'rgba(220,38,38,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text, #1B1B2F)', margin: 0 }}>
            Error al cargar el Dashboard
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 420, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            Ocurrió un problema inesperado. Puedes reintentar o volver a la página principal.
          </p>
          <div style={{
            padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.12)', maxWidth: 500, width: '100%',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#DC2626',
            wordBreak: 'break-word' as const, overflow: 'auto', maxHeight: 120,
          }}>
            {errorMessage}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#FF5722', color: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 12px rgba(255,87,34,0.3)', transition: 'all 0.2s',
              }}
            >
              Reintentar
            </button>
            <button
              onClick={this.props.onGoHome}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid #e5e7eb',
                background: '#fff', color: '#1B1B2F',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
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
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function Home() {
  /* ─── View state ─── */
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [viewTransition, setViewTransition] = useState<'enter' | 'exit' | null>(null);
  const [loginRole, setLoginRole] = useState<string>('admin');
  const [loginUserName, setLoginUserName] = useState<string>('Administrador');

  /* ─── Landing state ─── */
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
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
  const [regRole, setRegRole] = useState('');
  const [regTerms, setRegTerms] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  /* ─── Theme ─── */
  // Theme is owned by the global configStore. We read `tema` here and derive
  // `isDark` so the landing-page UI can render the right sun/moon icon. The
  // actual data-theme attribute is applied by configStore.setTema + the
  // <ThemeProvider> in layout.tsx; the fallback useEffect below only fires
  // on first mount in case the store hasn't hydrated yet.
  const tema = useConfigStore((s) => s.tema);
  const isDark =
    tema === 'dark' ||
    (tema === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  /* ─── Toasts ─── */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((title: string, desc: string, variant: ToastVariant = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, title, desc, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 4000);
  }, []);

  /* ─── Apply theme (fallback in case configStore hasn't initialized yet) ─── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    aplicarTema(tema);
  }, [tema]);

  const toggleTheme = useCallback(() => {
    // Route through configStore so the choice persists + the data-theme
    // attribute is applied via the store's aplicarTema helper.
    useConfigStore.getState().setTema(isDark ? 'light' : 'dark');
  }, [isDark]);

  /* ─── Navbar scroll ─── */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ─── Scroll reveal ─── */
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

  /* ─── Stats visibility ─── */
  useEffect(() => {
    if (currentView !== 'landing') return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setStatsVisible(true); }),
      { threshold: 0.3 }
    );
    const el = document.getElementById('hero-stats');
    if (el) observer.observe(el);
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
    setTimeout(() => {
      setLoginLoading(false);
      setLoginRole(demoEntry[0]);
      setLoginUserName(demoEntry[1].name);
      addToast(`Bienvenido, ${demoEntry[1].name}`, 'Redirigiendo al dashboard...', 'success');
      setTimeout(() => setLoginRedirect(true), 1500);
      setTimeout(() => {
        setCurrentView('dashboard');
        document.body.style.overflow = '';
        setLoginRedirect(false);
      }, 3000);
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
      setTimeout(() => setLoginRedirect(true), 1500);
      setTimeout(() => {
        setCurrentView('dashboard');
        document.body.style.overflow = '';
        setLoginRedirect(false);
      }, 3000);
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
    setLoginErrors({});
    setLoginRole('admin');
    setLoginUserName('Administrador');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirm('');
    setRegErrors({});
    setRegSuccess(false);
    setRegRole('');
    setRegTerms(false);
    document.body.style.overflow = '';
  }, []);

  /* ─── Real-time validation for register ─── */
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
    return (
      <DashboardErrorBoundary onGoHome={() => setCurrentView('landing')}>
        <Dashboard isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} />
      </DashboardErrorBoundary>
    );
  }

  /* ═══════════════════════════════════════════════════════
     AUTH VIEWS (Login / Register)
     ═══════════════════════════════════════════════════════ */
  if (currentView === 'login' || currentView === 'register') {
    const isLogin = currentView === 'login';
    const isExiting = authTransition === 'exit';
    const isEntering = authTransition === 'enter';

    return (
      <>
        <div className="lf-auth-screen">
          {/* Login redirect overlay */}
          {loginRedirect && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 3000,
              background: 'var(--bg)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div className="lf-spinner" />
              <p className="lf-redirect-text">Redirigiendo al dashboard...</p>
            </div>
          )}

          <div className={`lf-auth-container ${!isLogin ? 'lf-auth-container-wide' : ''}`}
            style={{ opacity: isExiting ? 0 : 1, transform: isExiting ? 'translateX(-40px)' : isEntering ? 'translateX(0)' : 'none', transition: 'all 0.25s ease' }}>

            {/* Brand */}
            <div className="lf-auth-brand">
              <Logo large />
              <span className="lf-tagline">Tus Envíos Seguros y Rápidos</span>
            </div>

            {/* ─── LOGIN ─── */}
            {isLogin && !loginRedirect && (
              <div style={{ animation: isEntering ? 'slideLeft 0.25s ease' : 'none' }}>
                <h1 className="lf-auth-title font-syne">Bienvenido de nuevo</h1>
                <p className="lf-auth-subtitle">Ingresa tus credenciales para acceder al sistema</p>

                <form onSubmit={handleLogin} noValidate>
                  <div className="lf-form-group">
                    <label className="lf-form-label">Correo electrónico</label>
                    <div className="lf-input-wrapper">
                      <input
                        type="email"
                        className={`lf-form-input ${loginErrors.email ? 'error' : ''}`}
                        placeholder="tu@email.com"
                        value={loginEmail}
                        onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); }}
                      />
                      <span className="lf-input-icon"><IconEnvelope /></span>
                    </div>
                    <div className="lf-form-error">{loginErrors.email || ''}</div>
                  </div>

                  <div className="lf-form-group">
                    <label className="lf-form-label">Contraseña</label>
                    <div className="lf-input-wrapper">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        className={`lf-form-input ${loginErrors.password ? 'error' : ''}`}
                        placeholder="Tu contraseña"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); }}
                        style={{ paddingRight: 48 }}
                      />
                      <span className="lf-input-icon"><IconLock /></span>
                      <button type="button" className="lf-input-eye" onClick={() => setShowLoginPassword((p) => !p)}>
                        {showLoginPassword ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                    <div className="lf-form-error">{loginErrors.password || ''}</div>
                  </div>

                  <button type="button" className="lf-forgot-link">¿Olvidaste tu contraseña?</button>

                  <button type="submit" className="lf-auth-submit font-syne" disabled={loginLoading}>
                    {loginLoading ? (
                      <>Ingresando<span className="lf-loading-dots"><span className="lf-loading-dot" /><span className="lf-loading-dot" /><span className="lf-loading-dot" /></span></>
                    ) : 'Iniciar sesión'}
                  </button>
                </form>

                <div className="lf-separator">
                  <div className="lf-separator-line" />
                  <span className="lf-separator-text">o accede rápido con</span>
                  <div className="lf-separator-line" />
                </div>

                <div className="lf-demo-grid">
                  {[
                    { id: 'cliente', label: 'Cliente', icon: <IconPerson /> },
                    { id: 'repartidor', label: 'Repartidor', icon: <IconMoto /> },
                    { id: 'admin', label: 'Admin', icon: <IconShield /> },
                    { id: 'ingeniero', label: 'Ingeniero', icon: <IconWrench /> },
                  ].map((role) => (
                    <button key={role.id} className="lf-demo-btn" onClick={() => handleDemoLogin(role.id)}>
                      <span className="lf-demo-btn-icon">{role.icon}</span>
                      <span className="lf-demo-btn-text">{role.label}</span>
                    </button>
                  ))}
                </div>
                <div className="lf-demo-label">Acceso rápido para demo</div>

                <div className="lf-switch-link">
                  ¿No tienes cuenta?{' '}
                  <button className="lf-switch-link-btn" onClick={() => switchAuth('register')}>Crear cuenta</button>
                </div>

                <button className="lf-back-link" onClick={() => navigateTo('landing')}>
                  <IconArrowLeft /> Volver al inicio
                </button>
              </div>
            )}

            {/* ─── REGISTER ─── */}
            {!isLogin && !regSuccess && (
              <div style={{ animation: isEntering ? 'slideLeft 0.25s ease' : 'none' }}>
                <h1 className="lf-auth-title font-syne">Crea tu cuenta</h1>
                <p className="lf-auth-subtitle">Completa los datos para empezar a usar LOGIFAST</p>

                <form onSubmit={handleRegister} noValidate>
                  <div className="lf-form-group">
                    <label className="lf-form-label">Nombre completo</label>
                    <div className="lf-input-wrapper">
                      <input
                        type="text"
                        className={`lf-form-input ${displayRegErrors.name ? 'error' : ''}`}
                        placeholder="Tu nombre completo"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                      <span className="lf-input-icon"><IconUser /></span>
                    </div>
                    <div className="lf-form-error">{displayRegErrors.name || ''}</div>
                  </div>

                  <div className="lf-form-group">
                    <label className="lf-form-label">Correo electrónico</label>
                    <div className="lf-input-wrapper">
                      <input
                        type="email"
                        className={`lf-form-input ${displayRegErrors.email ? 'error' : ''}`}
                        placeholder="tu@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                      <span className="lf-input-icon"><IconEnvelope /></span>
                    </div>
                    <div className="lf-form-error">{displayRegErrors.email || ''}</div>
                  </div>

                  <div className="lf-form-group">
                    <label className="lf-form-label">Contraseña</label>
                    <div className="lf-input-wrapper">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        className={`lf-form-input ${displayRegErrors.password ? 'error' : ''}`}
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        style={{ paddingRight: 48 }}
                      />
                      <span className="lf-input-icon"><IconLock /></span>
                      <button type="button" className="lf-input-eye" onClick={() => setShowRegPassword((p) => !p)}>
                        {showRegPassword ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                    {regPassword && (
                      <div className="lf-strength-bar">
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
                    <div className="lf-form-error">{displayRegErrors.password || ''}</div>
                  </div>

                  <div className="lf-form-group">
                    <label className="lf-form-label">Confirmar contraseña</label>
                    <div className="lf-input-wrapper">
                      <input
                        type="password"
                        className={`lf-form-input ${displayRegErrors.confirm ? 'error' : ''}`}
                        placeholder="Repite tu contraseña"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                      />
                      <span className="lf-input-icon"><IconLock /></span>
                    </div>
                    <div className="lf-form-error">{displayRegErrors.confirm || ''}</div>
                  </div>

                  <div className="lf-form-group">
                    <label className="lf-form-label">Tipo de cuenta</label>
                    <div className="lf-role-grid">
                      {[
                        { id: 'cliente', label: 'Cliente', icon: <IconPerson /> },
                        { id: 'repartidor', label: 'Repartidor', icon: <IconMoto /> },
                        { id: 'admin', label: 'Administrador', icon: <IconShield /> },
                        { id: 'ingeniero', label: 'Ingeniero', icon: <IconWrench /> },
                      ].map((role) => (
                        <div
                          key={role.id}
                          className={`lf-role-card ${regRole === role.id ? 'selected' : ''}`}
                          onClick={() => { setRegRole(role.id); setRegErrors((p) => ({ ...p, role: '' })); }}
                        >
                          <div className="lf-role-card-check"><IconCheckSmall /></div>
                          <span className="lf-role-card-icon">{role.icon}</span>
                          <span className="lf-role-card-label">{role.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="lf-form-error">{displayRegErrors.role || ''}</div>
                  </div>

                  <div className="lf-terms">
                    <div
                      className={`lf-terms-checkbox ${regTerms ? 'checked' : ''}`}
                      onClick={() => { setRegTerms((p) => !p); setRegErrors((p) => ({ ...p, terms: '' })); }}
                    >
                      {regTerms && <IconCheckSmall />}
                    </div>
                    <span className="lf-terms-text">
                      Acepto los{' '}
                      <a href="#" className="lf-terms-link" onClick={(e) => e.preventDefault()}>Términos de Servicio</a>
                      {' '}y la{' '}
                      <a href="#" className="lf-terms-link" onClick={(e) => e.preventDefault()}>Política de Privacidad</a>
                    </span>
                  </div>
                  {displayRegErrors.terms && <div className="lf-form-error" style={{ marginTop: -12, marginBottom: 12 }}>{displayRegErrors.terms}</div>}

                  <button type="submit" className="lf-auth-submit font-syne" disabled={regLoading}>
                    {regLoading ? (
                      <>Creando cuenta<span className="lf-loading-dots"><span className="lf-loading-dot" /><span className="lf-loading-dot" /><span className="lf-loading-dot" /></span></>
                    ) : 'Crear cuenta'}
                  </button>
                </form>

                <div className="lf-switch-link">
                  ¿Ya tienes cuenta?{' '}
                  <button className="lf-switch-link-btn" onClick={() => switchAuth('login')}>Iniciar sesión</button>
                </div>

                <button className="lf-back-link" onClick={() => navigateTo('landing')}>
                  <IconArrowLeft /> Volver al inicio
                </button>
              </div>
            )}

            {/* ─── REGISTER SUCCESS ─── */}
            {!isLogin && regSuccess && (
              <div className="lf-success-screen">
                <div className="lf-success-circle">
                  <IconCheckLg />
                </div>
                <h2 className="lf-success-title font-syne">Cuenta creada</h2>
                <p className="lf-success-desc">Ya puedes iniciar sesión con tus credenciales</p>
                <button className="lf-auth-submit font-syne" style={{ maxWidth: 240 }} onClick={() => { setRegSuccess(false); switchAuth('login'); }}>
                  Ir a iniciar sesión
                </button>
              </div>
            )}
          </div>

          {/* Theme toggle in auth */}
          <button
            className="lf-theme-toggle"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </button>
        </div>

        {/* Toasts */}
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

  /* ═══════════════════════════════════════════════════════
     LANDING PAGE
     ═══════════════════════════════════════════════════════ */
  return (
    <main className="grain-overlay" ref={revealRef} style={{ opacity: viewTransition === 'exit' ? 0 : 1, transition: 'opacity 0.3s ease' }}>
      {/* ═══ NAVBAR ═══ */}
      <nav className={`lf-navbar ${navScrolled ? 'scrolled' : ''}`}>
        <Logo onClick={() => scrollTo('hero')} />

        <ul className="lf-nav-links">
          <li><a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollTo('como-funciona'); }}>Cómo funciona</a></li>
          <li><a href="#caracteristicas" onClick={(e) => { e.preventDefault(); scrollTo('caracteristicas'); }}>Servicios</a></li>
          <li><a href="#numeros" onClick={(e) => { e.preventDefault(); scrollTo('numeros'); }}>Precios</a></li>
          <li><a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto'); }}>Contacto</a></li>
        </ul>

        <div className="lf-nav-actions">
          <button className="lf-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
            {isDark ? <IconSun /> : <IconMoon />}
          </button>
          <button className="lf-btn-ghost nav-ghost" onClick={() => navigateTo('login')}>Iniciar sesión</button>
          <button className="lf-btn-primario" onClick={() => navigateTo('register')}>Empezar gratis</button>
          <button className={`lf-hamburger ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen((p) => !p)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className={`lf-mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollTo('como-funciona'); }}>Cómo funciona</a>
        <a href="#caracteristicas" onClick={(e) => { e.preventDefault(); scrollTo('caracteristicas'); }}>Servicios</a>
        <a href="#numeros" onClick={(e) => { e.preventDefault(); scrollTo('numeros'); }}>Precios</a>
        <a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto'); }}>Contacto</a>
        <button className="lf-btn-primario" style={{ marginTop: 24, width: 'fit-content' }} onClick={() => { setMobileMenuOpen(false); navigateTo('login'); }}>Iniciar sesión</button>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="lf-hero" id="hero">
        <div className="lf-hero-inner">
          <div className="lf-hero-badge reveal">
            <span className="lf-hero-badge-dot" />
            Operando en Managua, Nicaragua
          </div>

          <div className="lf-hero-title reveal reveal-delay-1">
            <span className="lf-hero-title-line lf-hero-title-light">Tus envíos</span>
            <span className="lf-hero-title-line lf-hero-title-bold">seguros y rápidos</span>
          </div>

          <div className="lf-hero-grid reveal reveal-delay-2">
            <p className="lf-hero-subtitle">
              Plataforma integral de gestión logística con flota motociclista. Solicita, rastrea y gestiona envíos urbanos con seguimiento en tiempo real, mantenimiento automático de flota y reportes operativos.
            </p>
            <div className="lf-hero-actions">
              <button className="lf-btn-hero-primary" onClick={() => navigateTo('register')}>
                Solicitar envío ahora
                <IconArrowRight />
              </button>
              <button className="lf-btn-hero-outline" onClick={() => scrollTo('como-funciona')}>
                <IconPlay /> Ver cómo funciona
              </button>
            </div>
          </div>

          <div className="lf-hero-stats reveal reveal-delay-3" id="hero-stats">
            <StatCounter value={12847} label="Envíos completados" started={statsVisible} />
            <StatCounter value={98} suffix=".2%" label="Entregas a tiempo" started={statsVisible} />
            <StatCounter value={45} label="Motos en flota activa" started={statsVisible} />
            <div className="lf-hero-stat">
              <span className="lf-hero-stat-number font-mono" style={{ letterSpacing: '-1px' }}>&lt; 25 min</span>
              <span className="lf-hero-stat-label">Tiempo promedio de entrega</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section className="lf-how" id="como-funciona">
        <div className="lf-how-inner">
          <div className="lf-how-header reveal">
            <span className="lf-eyebrow">Proceso</span>
            <h2 className="lf-section-title font-syne">De tu puerta a la suya. Sin fricción.</h2>
          </div>

          <div className="lf-steps">
            {[
              { num: '01', title: 'Solicita tu envío', desc: 'Ingresa dirección de recogida y entrega. El sistema calcula costo y distancia automáticamente.' },
              { num: '02', title: 'Asignamos un repartidor', desc: 'El repartidor más cercano y disponible recibe tu orden y se dirige al punto de recogida.' },
              { num: '03', title: 'Rastrea en tiempo real', desc: 'Sigue la ubicación de tu paquete en el mapa. Actualización cada 5 segundos.' },
              { num: '04', title: 'Entrega confirmada', desc: 'Recibes notificación al entregar, accedes al comprobante y a tu historial.' },
            ].map((step, i) => (
              <div key={step.num} className={`lf-step reveal reveal-delay-${i + 1}`}>
                <span className="lf-step-num font-syne">{step.num}</span>
                <div className="lf-step-content">
                  <h3 className="lf-step-title font-syne">{step.title}</h3>
                  <p className="lf-step-desc">{step.desc}</p>
                </div>
                {i < 3 && <div className="lf-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CARACTERÍSTICAS ═══ */}
      <section className="lf-features" id="caracteristicas">
        <div className="lf-features-inner">
          <div className="lf-features-header reveal">
            <span className="lf-eyebrow">Capacidades</span>
            <h2 className="lf-section-title font-syne">Todo lo que necesitas. Nada que sobre.</h2>
            <p>Plataforma diseñada para cada rol operativo, con herramientas que realmente se usan.</p>
          </div>

          <div className="lf-features-grid">
            {[
              { num: '01', title: 'Rastreo GPS en vivo', desc: 'Ubicación del repartidor actualizada cada 5 segundos con mapa interactivo y ruta calculada.' },
              { num: '02', title: 'Mantenimiento predictivo', desc: 'Alertas automáticas basadas en kilometraje. Prevención de fallas mecánicas antes de que ocurran.' },
              { num: '03', title: 'Multi-rol', desc: 'Interfaces optimizadas para cliente, repartidor, administrador e ingeniero. Cada uno ve lo que necesita.' },
              { num: '04', title: 'Cotización inteligente', desc: 'Cálculo automático de costos por distancia y zona. Pagos en efectivo o transferencia.' },
              { num: '05', title: 'Reportes operativos', desc: 'Ingresos, rendimiento por repartidor, análisis de zonas, detección de anomalías en costos.' },
              { num: '06', title: 'Inventario de repuestos', desc: 'Control de stock, alertas de bajo inventario, registro de compras y costos unitarios.' },
            ].map((feat, i) => (
              <div key={feat.num} className={`lf-feature-item reveal reveal-delay-${i + 1}`}>
                <span className="lf-feature-num font-mono">{feat.num}</span>
                <h3 className="lf-feature-title font-syne">{feat.title}</h3>
                <p className="lf-feature-desc">{feat.desc}</p>
                <div className="lf-feature-line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROLES ═══ */}
      <section className="lf-roles" id="roles">
        <div className="lf-roles-inner">
          <div className="lf-roles-header reveal">
            <span className="lf-eyebrow">Para cada rol</span>
            <h2 className="lf-section-title font-syne">Cuatro roles. Cuatro experiencias.</h2>
          </div>

          {/* CLIENTE — texto izq, mockup der */}
          <div className="lf-role-block reveal">
            <div className="lf-role-info">
              <h3 className="lf-role-info-title font-syne">Para clientes</h3>
              <p className="lf-role-info-desc">Solicita envíos en segundos, obtén cotización instantánea y sigue cada movimiento de tu paquete.</p>
              <ul className="lf-role-features">
                {['Autocompletado de direcciones', 'Cotización instantánea', 'GPS en tiempo real', 'Historial completo'].map((f) => (
                  <li key={f}><span className="lf-role-check"><IconCheck /></span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="lf-role-mockup">
              <div className="lf-mockup-bar lf-mockup-bar-navy" style={{ height: 36, width: '60%' }} />
              <div className="lf-mockup-map">
                <div className="lf-mockup-map-grid" />
                <div className="lf-mockup-map-route" />
                <div className="lf-mockup-map-pin green" />
                <div className="lf-mockup-map-pin orange" />
              </div>
              <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 20, width: '50%' }} />
            </div>
          </div>

          <div className="lf-role-separator" />

          {/* REPARTIDOR — mockup izq, texto der */}
          <div className="lf-role-block reverse reveal">
            <div className="lf-role-info">
              <h3 className="lf-role-info-title font-syne">Para repartidores</h3>
              <p className="lf-role-info-desc">Recibe asignaciones automáticas, navega rutas optimizadas y registra cada entrega sin fricción.</p>
              <ul className="lf-role-features">
                {['Asignación automática', 'Contador de kilómetros', 'Mapa de ruta', 'Reporte de incidencias'].map((f) => (
                  <li key={f}><span className="lf-role-check"><IconCheck /></span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="lf-role-mockup">
              <div className="lf-mockup-bar lf-mockup-bar-accent" style={{ height: 28, width: '70%' }} />
              <div className="lf-mockup-progress" style={{ marginTop: 8 }}>
                <div className="lf-mockup-progress-fill" style={{ width: '65%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 32, width: '48%' }} />
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 32, width: '48%' }} />
              </div>
              <div className="lf-mockup-bar lf-mockup-bar-navy" style={{ height: 48, width: '85%', marginTop: 8 }} />
              <div className="lf-mockup-bar lf-mockup-bar-accent" style={{ height: 24, width: '60%', marginTop: 8 }} />
            </div>
          </div>

          <div className="lf-role-separator" />

          {/* ADMIN — texto izq, mockup der */}
          <div className="lf-role-block reveal">
            <div className="lf-role-info">
              <h3 className="lf-role-info-title font-syne">Para administradores</h3>
              <p className="lf-role-info-desc">Visualiza toda la flota, gestiona pedidos y reasigna recursos con un dashboard operativo en tiempo real.</p>
              <ul className="lf-role-features">
                {['Mapa de flota en vivo', 'Gestión de pedidos', 'Reasignación inteligente', 'Reportes operativos'].map((f) => (
                  <li key={f}><span className="lf-role-check"><IconCheck /></span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="lf-role-mockup">
              <div className="lf-mockup-map" style={{ minHeight: 100 }}>
                <div className="lf-mockup-map-grid" />
                <div className="lf-mockup-map-route" />
                <div className="lf-mockup-map-pin green" />
                <div className="lf-mockup-map-pin orange" />
              </div>
              <div className="lf-mockup-chart">
                {[40, 65, 35, 80, 55, 70, 45, 90, 60, 75].map((h, i) => (
                  <div key={i} className="lf-mockup-chart-bar" style={{ height: `${h}%`, background: i % 2 === 0 ? 'var(--primario-soft)' : 'var(--border)' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 16, width: '30%' }} />
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 16, width: '30%' }} />
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 16, width: '30%' }} />
              </div>
            </div>
          </div>

          <div className="lf-role-separator" />

          {/* INGENIERO — mockup izq, texto der */}
          <div className="lf-role-block reverse reveal">
            <div className="lf-role-info">
              <h3 className="lf-role-info-title font-syne">Para ingenieros</h3>
              <p className="lf-role-info-desc">Monitorea el estado de cada moto, gestiona inventario de repuestos y programa mantenimientos preventivos.</p>
              <ul className="lf-role-features">
                {['Alertas por kilometraje', 'Inventario de repuestos', 'Mantenimiento programado', 'Detección de anomalías'].map((f) => (
                  <li key={f}><span className="lf-role-check"><IconCheck /></span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="lf-role-mockup">
              <div className="lf-mockup-alert" style={{ background: 'rgba(255,23,68,0.05)', border: '1px solid rgba(255,23,68,0.15)' }}>
                <span className="lf-mockup-alert-dot red" />
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 12, width: '60%' }} />
              </div>
              <div className="lf-mockup-alert" style={{ background: 'rgba(255,179,0,0.05)', border: '1px solid rgba(255,179,0,0.15)' }}>
                <span className="lf-mockup-alert-dot yellow" />
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 12, width: '50%' }} />
              </div>
              <div className="lf-mockup-alert" style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)' }}>
                <span className="lf-mockup-alert-dot green" />
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 12, width: '55%' }} />
              </div>
              <div className="lf-mockup-bar lf-mockup-bar-navy" style={{ height: 64, width: '100%', marginTop: 8 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="lf-mockup-bar lf-mockup-bar-accent" style={{ height: 20, width: '40%' }} />
                <div className="lf-mockup-bar lf-mockup-bar-muted" style={{ height: 20, width: '55%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ NÚMEROS ═══ */}
      <section className="lf-numeros" id="numeros">
        <div className="lf-numeros-inner">
          <div className="lf-numeros-grid reveal">
            {[
              { num: '12,847+', label: 'Envíos completados', desc: 'Desde nuestro lanzamiento' },
              { num: '45', label: 'Motos activas', desc: 'Flota en constante crecimiento' },
              { num: '98.2%', label: 'Entregas exitosas', desc: 'Compromiso con la calidad' },
              { num: '< 25 min', label: 'Tiempo promedio', desc: 'De solicitud a entrega' },
            ].map((item) => (
              <div key={item.label} className="lf-numeros-item">
                <span className="lf-numeros-number font-mono">{item.num}</span>
                <span className="lf-numeros-label">{item.label}</span>
                <span className="lf-numeros-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="lf-cta" id="contacto">
        <div className="lf-cta-inner reveal">
          <h2 className="lf-cta-title font-syne">Empieza a enviar hoy.</h2>
          <p className="lf-cta-desc">Únete a la plataforma de logística más eficiente de Managua. Configura tu cuenta en minutos.</p>
          <button className="lf-btn-cta" onClick={() => navigateTo('register')}>
            Crear cuenta gratis
            <IconArrowRight />
          </button>
          <p className="lf-cta-note">Sin tarjeta de crédito. Configura en 2 minutos.</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lf-footer">
        <div className="lf-footer-inner">
          <div className="lf-footer-grid">
            <div>
              <Logo />
              <p className="lf-footer-brand-tagline">Tus Envíos Seguros y Rápidos</p>
              <p className="lf-footer-brand-location">Managua, Nicaragua</p>
            </div>
            <div>
              <h4 className="lf-footer-col-title">Producto</h4>
              <ul className="lf-footer-links">
                <li><a href="#">Funciones</a></li>
                <li><a href="#">Precios</a></li>
                <li><a href="#">API</a></li>
                <li><a href="#">Estado</a></li>
              </ul>
            </div>
            <div>
              <h4 className="lf-footer-col-title">Empresa</h4>
              <ul className="lf-footer-links">
                <li><a href="#">Nosotros</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Contacto</a></li>
                <li><a href="#">Alianzas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="lf-footer-col-title">Legal</h4>
              <ul className="lf-footer-links">
                <li><a href="#">Privacidad</a></li>
                <li><a href="#">Términos</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="lf-footer-bottom">
            <span>LOGIFAST 2026</span>
            <span>Hecho con precisión</span>
          </div>
        </div>
      </footer>

      {/* Toasts */}
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
    </main>
  );
}
