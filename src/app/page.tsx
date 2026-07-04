'use client';

import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import Dashboard from './dashboard';
import ClientDashboard from './client-dashboard';
import dynamic from 'next/dynamic';
import { useConfigStore, aplicarTema } from '@/store/configStore';
import { sileo } from "sileo";

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
const IconGlobe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const IconTrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);
const IconCheckSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ─── Unique Landing States ─── */
  const [calcDistance, setCalcDistance] = useState(5);
  const [calcWeight, setCalcWeight] = useState<'light' | 'medium' | 'heavy'>('light');
  const [activeRoleTab, setActiveRoleTab] = useState<'cliente' | 'repartidor' | 'admin' | 'ingeniero'>('cliente');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [scanProgress, setScanProgress] = useState(0);

  const startScan = useCallback(() => {
    if (scanStatus === 'scanning') return;
    setScanStatus('scanning');
    setScanProgress(0);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 5;
      if (prog >= 100) {
        clearInterval(interval);
        setScanProgress(100);
        setScanStatus('done');
      } else {
        setScanProgress(prog);
      }
    }, 50);
  }, [scanStatus]);
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

  /* ═══════════════════════════════════════════════════════
     AUTH VIEWS (Login / Register)
     ═══════════════════════════════════════════════════════ */
  if (currentView === 'login' || currentView === 'register') {
    const isLogin = currentView === 'login';
    const isExiting = authTransition === 'exit';
    const isEntering = authTransition === 'enter';

    return (
      <>
        <div className="lp-auth-split" style={{ opacity: isExiting ? 0 : 1, transition: 'opacity 0.25s ease' }}>
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

          {/* Sidebar */}
          <div className="lp-auth-sidebar">
            <div className="lp-auth-sidebar-glow" />
            <div>
              <Logo large />
              <div style={{ marginTop: 48 }}>
                <h2 className="lp-auth-sidebar-title">Logística inteligente para tu negocio</h2>
                <p className="lp-auth-sidebar-text">
                  Entregas garantizadas en menos de 25 minutos con control operativo, mantenimiento en tiempo real y facturación automatizada.
                </p>
              </div>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.6 }}>
              © 2026 LOGIFAST. Todos los derechos reservados.
            </div>
          </div>

          {/* Form container side */}
          <div className="lp-auth-form-side">
            <div className="lp-auth-card" style={{ transform: isEntering ? 'translateY(15px)' : 'none', opacity: isEntering ? 0.9 : 1, transition: 'all 0.4s ease' }}>
              
              {/* Logo for mobile screens only */}
              <div className="lp-auth-logo-header">
                <Logo large />
                <span className="lf-tagline" style={{ marginTop: 12, fontSize: '14px', color: 'var(--text-secondary)' }}>Tus Envíos Seguros y Rápidos</span>
              </div>

              {/* ─── LOGIN ─── */}
              {isLogin && !loginRedirect && (
                <div>
                  <h1 className="lf-auth-title font-syne" style={{ textAlign: 'left', fontSize: '32px' }}>Bienvenido de nuevo</h1>
                  <p className="lf-auth-subtitle" style={{ textAlign: 'left', marginBottom: 32 }}>Ingresa tus credenciales para acceder</p>

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

                    <button type="button" className="lf-forgot-link" style={{ marginBottom: 24, fontSize: '13px' }}>¿Olvidaste tu contraseña?</button>

                    <button type="submit" className="lf-auth-submit font-syne" disabled={loginLoading} style={{ background: 'var(--primario)', color: 'white', borderRadius: '12px', padding: '16px' }}>
                      {loginLoading ? (
                        <>Ingresando<span className="lf-loading-dots"><span className="lf-loading-dot" /><span className="lf-loading-dot" /><span className="lf-loading-dot" /></span></>
                      ) : 'Iniciar sesión'}
                    </button>
                  </form>

                  <div className="lf-separator" style={{ margin: '24px 0' }}>
                    <div className="lf-separator-line" />
                    <span className="lf-separator-text">Acceso rápido demo</span>
                    <div className="lf-separator-line" />
                  </div>

                  <div className="lf-demo-grid" style={{ gap: '10px' }}>
                    {[
                      { id: 'cliente', label: 'Cliente', icon: <IconPerson /> },
                      { id: 'repartidor', label: 'Repartidor', icon: <IconMoto /> },
                      { id: 'admin', label: 'Admin', icon: <IconShield /> },
                      { id: 'ingeniero', label: 'Ingeniero', icon: <IconWrench /> },
                    ].map((role) => (
                      <button key={role.id} className="lf-demo-btn" onClick={() => handleDemoLogin(role.id)} style={{ padding: '12px', borderRadius: '10px' }}>
                        <span className="lf-demo-btn-icon">{role.icon}</span>
                        <span className="lf-demo-btn-text">{role.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="lf-switch-link" style={{ marginTop: 24 }}>
                    ¿No tienes cuenta?{' '}
                    <button className="lf-switch-link-btn" onClick={() => switchAuth('register')}>Crear cuenta</button>
                  </div>

                  <button className="lf-back-link" onClick={() => navigateTo('landing')} style={{ marginTop: 24 }}>
                    <IconArrowLeft /> Volver al inicio
                  </button>
                </div>
              )}

              {/* ─── REGISTER ─── */}
              {!isLogin && !regSuccess && (
                <div>
                  <h1 className="lf-auth-title font-syne" style={{ textAlign: 'left', fontSize: '32px' }}>Crea tu cuenta</h1>
                  <p className="lf-auth-subtitle" style={{ textAlign: 'left', marginBottom: 32 }}>Completa los datos para comenzar</p>

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
                      <div className="lf-role-grid" style={{ gap: '8px' }}>
                        {[
                          { id: 'cliente', label: 'Cliente', icon: <IconPerson /> },
                          { id: 'repartidor', label: 'Repartidor', icon: <IconMoto /> },
                          { id: 'admin', label: 'Admin', icon: <IconShield /> },
                          { id: 'ingeniero', label: 'Ingeniero', icon: <IconWrench /> },
                        ].map((role) => (
                          <div
                            key={role.id}
                            className={`lf-role-card ${regRole === role.id ? 'selected' : ''}`}
                            onClick={() => { setRegRole(role.id); setRegErrors((p) => ({ ...p, role: '' })); }}
                            style={{ padding: '12px', borderRadius: '10px' }}
                          >
                            <div className="lf-role-card-check"><IconCheckSmall /></div>
                            <span className="lf-role-card-icon">{role.icon}</span>
                            <span className="lf-role-card-label" style={{ fontSize: '12px' }}>{role.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="lf-form-error">{displayRegErrors.role || ''}</div>
                    </div>

                    <div className="lf-terms" style={{ marginBottom: 20 }}>
                      <div
                        className={`lf-terms-checkbox ${regTerms ? 'checked' : ''}`}
                        onClick={() => { setRegTerms((p) => !p); setRegErrors((p) => ({ ...p, terms: '' })); }}
                      >
                        {regTerms && <IconCheckSmall />}
                      </div>
                      <span className="lf-terms-text" style={{ fontSize: '11.5px', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                        Acepto los{' '}
                        <a href="#" className="lf-terms-link" onClick={(e) => { e.preventDefault(); alert('LOGIFAST — DECLARACIÓN DE USO LÍCITO:\n\n1. La plataforma solo podrá utilizarse para actividades completamente legales.\n2. Está terminantemente prohibido el transporte de sustancias ilícitas, drogas, explosivos o cualquier objeto prohibido por la ley en Nicaragua.\n3. El usuario asume toda responsabilidad penal y civil por el contenido de sus envíos.'); }}>
                          Términos de Uso Lícito (Sin sustancias ilícitas)
                        </a>
                        {' '}y la{' '}
                        <a href="#" className="lf-terms-link" onClick={(e) => { e.preventDefault(); alert('POLÍTICA DE PRIVACIDAD:\n\nTus datos de geolocalización y cuenta son encriptados y procesados de acuerdo a la Ley de Protección de Datos Personales en Nicaragua.'); }}>
                          Privacidad
                        </a>
                      </span>
                    </div>
                    {displayRegErrors.terms && <div className="lf-form-error" style={{ marginTop: -12, marginBottom: 12 }}>{displayRegErrors.terms}</div>}

                    <button type="submit" className="lf-auth-submit font-syne" disabled={regLoading} style={{ background: 'var(--primario)', color: 'white', borderRadius: '12px', padding: '16px' }}>
                      {regLoading ? (
                        <>Creando cuenta<span className="lf-loading-dots"><span className="lf-loading-dot" /><span className="lf-loading-dot" /><span className="lf-loading-dot" /></span></>
                      ) : 'Crear cuenta'}
                    </button>
                  </form>

                  <div className="lf-switch-link" style={{ marginTop: 24 }}>
                    ¿Ya tienes cuenta?{' '}
                    <button className="lf-switch-link-btn" onClick={() => switchAuth('login')}>Iniciar sesión</button>
                  </div>

                  <button className="lf-back-link" onClick={() => navigateTo('landing')} style={{ marginTop: 24 }}>
                    <IconArrowLeft /> Volver al inicio
                  </button>
                </div>
              )}

              {/* ─── REGISTER SUCCESS ─── */}
              {!isLogin && regSuccess && (
                <div className="lf-success-screen">
                  <div className="lf-success-circle" style={{ background: 'rgba(0, 200, 83, 0.1)', color: 'var(--exito)' }}>
                    <IconCheckLg />
                  </div>
                  <h2 className="lf-success-title font-syne">Cuenta creada</h2>
                  <p className="lf-success-desc">Tu registro fue exitoso. Ya puedes acceder.</p>
                  <button className="lf-auth-submit font-syne" style={{ maxWidth: 240, background: 'var(--primario)', color: 'white' }} onClick={() => { setRegSuccess(false); switchAuth('login'); }}>
                    Ir a iniciar sesión
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Theme toggle */}
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
    <>
      {/* Premium Loading Splash Screen */}
      {mounted && (
        <div className={`lf-splash-screen ${!loading ? 'lf-splash-fadeout' : ''}`}>
          <div className="lf-splash-logo-container">
            <div className="lf-splash-spinner" />
            <img src="/logo.png" alt="Logifast Logo" className="lf-splash-logo" style={{ width: '96px', height: '96px' }} />
          </div>
          <div className="lf-splash-text" style={{ fontSize: '28px' }}>
            <span style={{ color: 'var(--text)' }}>LOGI</span>
            <span style={{ color: 'var(--primario)' }}>FAST</span>
          </div>
        </div>
      )}

      <main className="ud-landing-wrapper" ref={revealRef} style={{ opacity: viewTransition === 'exit' ? 0 : 1, transition: 'opacity 0.3s ease' }}>
        <div className="ud-grid-background" />

        {/* ═══ CONTROL ROOM TICKER BAR ═══ */}
        <div className="ud-ticker-bar">
          <div className="ud-ticker-item">
            <span className="ud-ticker-dot" />
            <span>OPERACIONES EN VIVO MANAGUA</span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>PEDIDOS ACTIVADOS: 142</span>
            <span>MOTOS OPERANDO: 45</span>
            <span>TALLER MOTO: 98% OK</span>
            <span>TIEMPO PROMEDIO: 23.4 MIN</span>
          </div>
          <div style={{ opacity: 0.6 }}>
            {new Date().toLocaleDateString('es-NI', { weekday: 'long', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
          </div>
        </div>

        {/* ═══ NAVBAR (Glassmorphic & Large Logo) ═══ */}
        <nav className={`lp-navbar ${navScrolled ? 'scrolled' : ''}`}>
          <Logo onClick={() => scrollTo('hero')} />

          <ul className="lf-nav-links">
            <li><a href="#calculadora" onClick={(e) => { e.preventDefault(); scrollTo('calculadora'); }}>Cotizar</a></li>
            <li><a href="#consola" onClick={(e) => { e.preventDefault(); scrollTo('consola'); }}>Consola Interactiva</a></li>
            <li><a href="#taller" onClick={(e) => { e.preventDefault(); scrollTo('taller'); }}>Gestión de Flota</a></li>
            <li><a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto'); }}>Contacto</a></li>
          </ul>

          <div className="lf-nav-actions">
            <button className="lf-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
              {isDark ? <IconSun /> : <IconMoon />}
            </button>
            <button className="lf-btn-ghost nav-ghost" onClick={() => navigateTo('login')}>Iniciar sesión</button>
            <button className="lp-btn-primary" onClick={() => navigateTo('register')} style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '14px' }}>Crear cuenta</button>
            <button className={`lf-hamburger ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen((p) => !p)} aria-label="Menú">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        {/* Mobile nav */}
        <div className={`lf-mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#calculadora" onClick={(e) => { e.preventDefault(); scrollTo('calculadora'); setMobileMenuOpen(false); }}>Cotizar</a>
          <a href="#consola" onClick={(e) => { e.preventDefault(); scrollTo('consola'); setMobileMenuOpen(false); }}>Consola Interactiva</a>
          <a href="#taller" onClick={(e) => { e.preventDefault(); scrollTo('taller'); setMobileMenuOpen(false); }}>Gestión de Flota</a>
          <a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto'); setMobileMenuOpen(false); }}>Contacto</a>
          <button className="lf-btn-primario" style={{ marginTop: 24, width: 'fit-content' }} onClick={() => { setMobileMenuOpen(false); navigateTo('login'); }}>Iniciar sesión</button>
        </div>

        {/* ═══ HERO SECTION (Obsidian Glass split layout) ═══ */}
        <section className="lp-hero" id="hero" style={{ paddingBottom: '40px' }}>
          <div className="lp-hero-glow-1" />
          <div className="lp-hero-glow-2" />
          
          <div className="lp-hero-grid">
            <div className="reveal" style={{ display: 'flex', flexDirection: 'column' }}>
               <div className="lp-hero-badge">
                 <span className="lf-hero-badge-dot" />
                 Envíos Express Seguros en Managua
               </div>
               
               <h1 className="lp-hero-title">
                 Tus envíos más <span>rápidos, seguros</span> y garantizados.
               </h1>
               
               <p className="lp-hero-subtitle">
                 En Logifast conectamos tu negocio con entregas express en minutos. Cotiza al instante, realiza seguimiento de tu paquete en tiempo real y disfruta de la mayor tranquilidad en cada envío.
               </p>
               
               <div className="lp-hero-actions">
                 <button className="lp-btn-primary" onClick={() => navigateTo('register')}>
                   Comenzar envíos gratis
                   <IconArrowRight />
                 </button>
                 <button className="lp-btn-outline" onClick={() => scrollTo('calculadora')}>
                   <IconPlay /> Cotizar mi envío
                 </button>
               </div>
             </div>

            {/* Simulated Radar widget */}
            <div className="reveal reveal-delay-2" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="lp-bento-card" style={{ padding: '28px', width: '100%', maxWidth: '440px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '28px', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--secundario)', borderRadius: '50%', display: 'inline-block', animation: 'udPulse 1s infinite' }} />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Monitoreo GPS en Vivo</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Repartidores Activos: 45</span>
                </div>

                {/* Radar Grid Animation */}
                <div style={{ height: '220px', background: '#020b18', borderRadius: '20px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                  {/* Radar sweep */}
                  <div style={{ position: 'absolute', width: '150%', height: '150%', background: 'conic-gradient(from 0deg, rgba(7, 100, 226, 0.15) 0deg, transparent 90deg)', animation: 'splashSpin 4s linear infinite', zIndex: 1 }} />
                  
                  {/* Radar circles */}
                  <div style={{ position: 'absolute', width: '70px', height: '70px', border: '1px dashed rgba(7, 100, 226, 0.25)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', width: '140px', height: '140px', border: '1px dashed rgba(7, 100, 226, 0.2)', borderRadius: '50%' }} />
                  
                  {/* Active Blips */}
                  <div style={{ position: 'absolute', top: '40px', left: '100px', width: '8px', height: '8px', background: 'var(--exito)', borderRadius: '50%', boxShadow: '0 0 10px var(--exito)', zIndex: 2 }} />
                  <div style={{ position: 'absolute', bottom: '60px', right: '120px', width: '8px', height: '8px', background: 'var(--exito)', borderRadius: '50%', boxShadow: '0 0 10px var(--exito)', zIndex: 2 }} />
                  <div style={{ position: 'absolute', top: '130px', right: '50px', width: '8px', height: '8px', background: 'var(--secundario)', borderRadius: '50%', boxShadow: '0 0 10px var(--secundario)', zIndex: 2 }} />

                  <div style={{ zIndex: 3, color: '#8da4c4', fontFamily: 'JetBrains Mono', fontSize: '10px', position: 'absolute', bottom: '12px' }}>
                    LOCALIZACIÓN EN TIEMPO REAL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ INTERACTIVE COTIZADOR WIDGET ═══ */}
        <section className="lp-section" id="calculadora" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
          <div className="lp-section-header reveal">
            <span className="lp-section-tag">Calculadora</span>
            <h2 className="lp-section-title">Cotizador Comercial de Envíos</h2>
            <p style={{ maxWidth: '600px', margin: '12px auto 0', color: 'var(--text-secondary)' }}>
              Ajusta la distancia y el tipo de paquete en tiempo real para ver el costo exacto del servicio.
            </p>
          </div>

          <div className="ud-interactive-panel reveal" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="ud-panel-header">
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>cotizacion_dinamica.json</span>
            </div>

            <div className="ud-panel-body">
              <div className="ud-calc-widget">
                <div className="ud-calc-controls">
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
                      <span>Distancia de Envío:</span>
                      <span style={{ color: 'var(--primario)' }}>{calcDistance} km</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" 
                      max="25" 
                      value={calcDistance} 
                      onChange={(e) => setCalcDistance(parseInt(e.target.value))}
                      className="ud-range-slider" 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Cercano (1 km)</span>
                      <span>Larga Distancia (25 km)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold', fontSize: '15px', display: 'block', marginBottom: '12px' }}>Tipo de Carga / Peso:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {[
                        { id: 'light', label: 'Documentos', desc: 'Hasta 1 kg' },
                        { id: 'medium', label: 'Paquete', desc: 'Hasta 5 kg' },
                        { id: 'heavy', label: 'Caja Grande', desc: 'Hasta 15 kg' },
                      ].map((item) => (
                        <button 
                          key={item.id}
                          className={`ud-weight-btn ${calcWeight === item.id ? 'active' : ''}`}
                          onClick={() => setCalcWeight(item.id as any)}
                        >
                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.label}</div>
                          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ud-calc-result">
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Costo Estimado</span>
                    <div className="ud-calc-price" style={{ margin: '12px 0' }}>
                      C$ {Math.round((70 + calcDistance * 18) * (calcWeight === 'light' ? 1.0 : calcWeight === 'medium' ? 1.25 : 1.5))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', margin: '16px 0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tiempo Estimado:</span>
                      <strong style={{ color: 'var(--text)' }}>{10 + calcDistance * 2} minutos</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Seguimiento GPS:</span>
                      <strong style={{ color: 'var(--exito)' }}>Incluido</strong>
                    </div>
                  </div>

                  <button className="lp-btn-primary" onClick={() => navigateTo('register')} style={{ width: '100%', justifyContent: 'center' }}>
                    Iniciar Envío
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ INTERACTIVE ROLE CONSOLE SHOWCASE ═══ */}
        <section className="lp-section" id="consola">
          <div className="lp-section-header reveal">
            <span className="lp-section-tag">Simulador</span>
            <h2 className="lp-section-title">Consola Operativa Interactiva</h2>
            <p style={{ maxWidth: '600px', margin: '12px auto 0', color: 'var(--text-secondary)' }}>
              Selecciona un rol para interactuar directamente con un fragmento de las capacidades operativas reales del sistema.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="ud-tabs-container reveal">
            {[
              { id: 'cliente', label: 'Portal Cliente', icon: <IconPerson /> },
              { id: 'repartidor', label: 'App Repartidor', icon: <IconMoto /> },
              { id: 'admin', label: 'Radar Administrador', icon: <IconShield /> },
              { id: 'ingeniero', label: 'Taller Mecánico', icon: <IconWrench /> },
            ].map((tab) => (
              <button 
                key={tab.id}
                className={`ud-tab-btn ${activeRoleTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveRoleTab(tab.id as any)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive display panel */}
          <div className="ud-interactive-panel reveal" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="ud-panel-header">
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                {activeRoleTab === 'cliente' && 'INTERFAZ: Crear Pedido Nuevo'}
                {activeRoleTab === 'repartidor' && 'INTERFAZ: Mapa de Ruta de Repartidor'}
                {activeRoleTab === 'admin' && 'INTERFAZ: Radar de Flota de Despacho'}
                {activeRoleTab === 'ingeniero' && 'INTERFAZ: Escáner de Diagnóstico de Taller'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--primario)', fontWeight: 'bold' }}>ESTADO: SIMULACIÓN ACTIVA</span>
            </div>

            <div className="ud-panel-body" style={{ minHeight: '340px' }}>
              
              {/* CLIENTE INTERACTIVE VIEW */}
              {activeRoleTab === 'cliente' && (
                <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Solicitud Rápida de Envío</h4>
                  <div className="lf-form-group" style={{ margin: 0 }}>
                    <label className="lf-form-label">Dirección de Recogida</label>
                    <input type="text" className="lf-form-input" defaultValue="Metrocentro, Managua" readOnly style={{ opacity: 0.8 }} />
                  </div>
                  <div className="lf-form-group" style={{ margin: 0 }}>
                    <label className="lf-form-label">Dirección de Destino</label>
                    <input type="text" className="lf-form-input" placeholder="Escribe el destino (ej: Galerías Santo Domingo)" defaultValue="Galerías Santo Domingo, Managua" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="lf-form-group" style={{ margin: 0 }}>
                      <label className="lf-form-label">Nombre de Contacto</label>
                      <input type="text" className="lf-form-input" defaultValue="María José Espinoza" readOnly style={{ opacity: 0.8 }} />
                    </div>
                    <div className="lf-form-group" style={{ margin: 0 }}>
                      <label className="lf-form-label">Teléfono</label>
                      <input type="text" className="lf-form-input" defaultValue="+505 8888-9999" readOnly style={{ opacity: 0.8 }} />
                    </div>
                  </div>
                  <button className="lp-btn-primary" onClick={() => navigateTo('register')} style={{ marginTop: '8px', alignSelf: 'start' }}>
                    Crear Orden de Prueba
                  </button>
                </div>
              )}

              {/* REPARTIDOR INTERACTIVE VIEW */}
              {activeRoleTab === 'repartidor' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>Orden #8452 - En Progreso</h4>
                    <div style={{ background: 'var(--bg-alt)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CLIENTE DESTINO:</div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px', margin: '4px 0' }}>Supermercados La Colonia</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Carr. Masaya km 8.5</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <span>Distancia Restante:</span>
                      <strong>1.8 km</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Tiempo Estimado de Ruta:</span>
                      <strong style={{ color: 'var(--primario)' }}>6 minutos</strong>
                    </div>
                    <button className="ud-weight-btn active" style={{ marginTop: '12px', border: '1px solid var(--peligro)', color: 'var(--peligro)', background: 'transparent' }} onClick={() => alert('Para reportar incidencias reales, accede a tu cuenta de Repartidor')}>
                      Reportar Retraso / Tráfico
                    </button>
                  </div>
                  <div style={{ background: '#020b18', borderRadius: '16px', border: '1px solid var(--border)', height: '240px', position: 'relative', overflow: 'hidden' }}>
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                      <path d="M 40,200 L 120,120 L 160,150 L 240,60" fill="none" stroke="var(--primario)" strokeWidth="3" />
                      <circle cx="40" cy="200" r="6" fill="var(--exito)" />
                      <circle cx="240" cy="60" r="6" fill="var(--peligro)" />
                    </svg>
                    <div style={{ position: 'absolute', top: '140px', left: '150px', width: '10px', height: '10px', background: '#ffffff', borderRadius: '50%', boxShadow: '0 0 8px #ffffff' }} />
                    <span style={{ position: 'absolute', top: '155px', left: '130px', fontSize: '9px', background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 'bold' }}>Tu Ubicación</span>
                  </div>
                </div>
              )}

              {/* ADMIN RADAR INTERACTIVE VIEW */}
              {activeRoleTab === 'admin' && (
                <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Repartidores Activos</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { name: 'Rider Carlos M.', status: 'En Ruta', color: 'var(--primario)' },
                        { name: 'Rider Jorge H.', status: 'Entregado', color: 'var(--exito)' },
                        { name: 'Rider Sofía L.', status: 'Taller', color: 'var(--warning)' },
                        { name: 'Rider Gabriel R.', status: 'Disponible', color: 'var(--exito)' },
                      ].map((rider, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-alt)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <span>{rider.name}</span>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: rider.color }}>{rider.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#020b18', borderRadius: '16px', border: '1px solid var(--border)', height: '240px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(var(--primario) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                    <div style={{ position: 'absolute', top: '60px', left: '80px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', background: 'var(--primario)', borderRadius: '50%', display: 'inline-block', animation: 'udPulse 1.5s infinite' }} />
                      <span style={{ fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>Rider Carlos</span>
                    </div>
                    <div style={{ position: 'absolute', top: '140px', right: '70px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', background: 'var(--exito)', borderRadius: '50%', display: 'inline-block', animation: 'udPulse 1.2s infinite' }} />
                      <span style={{ fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>Rider Gabriel</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '40px', left: '140px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', background: 'var(--warning)', borderRadius: '50%', display: 'inline-block' }} />
                      <span style={{ fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>Rider Sofía (Taller)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* INGENIERO MECHANICAL SCANNER INTERACTIVE VIEW */}
              {activeRoleTab === 'ingeniero' && (
                <div className="ud-scanner-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>Diagnóstico de Unidad</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      Monitorea las lecturas del computador a bordo de la flota de motocicletas para mantenimiento predictivo.
                    </p>
                    
                    <div>
                      <button 
                        className="lp-btn-primary" 
                        onClick={startScan}
                        disabled={scanStatus === 'scanning'}
                        style={{ background: scanStatus === 'scanning' ? 'var(--border)' : 'var(--primario)' }}
                      >
                        {scanStatus === 'idle' && 'Escanear Moto-02'}
                        {scanStatus === 'scanning' && 'Escaneando...'}
                        {scanStatus === 'done' && 'Volver a Escanear'}
                      </button>

                      {scanStatus === 'scanning' && (
                        <div>
                          <div className="ud-scan-bar">
                            <div className="ud-scan-bar-fill" style={{ width: `${scanProgress}%` }} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                            {scanProgress}% completado
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ud-scan-metrics">
                    <div className="ud-metric-box">
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Frenos Hidráulicos</span>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '6px', color: scanStatus === 'done' ? 'var(--exito)' : 'var(--text)' }}>
                        {scanStatus === 'done' ? '95% (Perfecto)' : 'Esperando...'}
                      </div>
                    </div>
                    <div className="ud-metric-box">
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Presión Neumáticos</span>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '6px', color: scanStatus === 'done' ? 'var(--exito)' : 'var(--text)' }}>
                        {scanStatus === 'done' ? '30 PSI (Normal)' : 'Esperando...'}
                      </div>
                    </div>
                    <div className="ud-metric-box">
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kilometraje acumulado</span>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '6px' }}>
                        {scanStatus === 'done' ? '2,341 km' : 'Esperando...'}
                      </div>
                    </div>
                    <div className="ud-metric-box">
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estado de Bujía</span>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '6px', color: scanStatus === 'done' ? 'var(--exito)' : 'var(--text)' }}>
                        {scanStatus === 'done' ? 'Excelente' : 'Esperando...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ═══ VENTAJAS COMERCIALES DE LOGIFAST ═══ */}
        <section className="lp-section" id="taller" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
          <div className="lp-section-header reveal">
            <span className="lp-section-tag">Ventajas</span>
            <h2 className="lp-section-title">¿Por qué elegir Logifast?</h2>
            <p style={{ maxWidth: '600px', margin: '12px auto 0', color: 'var(--text-secondary)' }}>
              Ofrecemos el mejor servicio de entregas express en Managua, diseñado para el éxito de tu negocio y la comodidad de tus envíos personales.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="lp-bento-card reveal">
              <div className="lp-bento-icon"><IconShield /></div>
              <h3 className="lp-bento-title">Entregas 100% Seguras</h3>
              <p className="lp-bento-desc">Cada paquete está protegido con los más estrictos estándares de seguridad y declaración legal, garantizando la total transparencia y protección de tus envíos.</p>
            </div>
            <div className="lp-bento-card reveal reveal-delay-1">
              <div className="lp-bento-icon"><IconClock /></div>
              <h3 className="lp-bento-title">Garantía de Tiempo</h3>
              <p className="lp-bento-desc">Nuestra flota comercial optimizada y monitoreada vía satélite en tiempo real asegura que tus paquetes lleguen a destino siempre a tiempo y sin retrasos.</p>
            </div>
            <div className="lp-bento-card reveal reveal-delay-2">
              <div className="lp-bento-icon"><IconTrendingUp /></div>
              <h3 className="lp-bento-title">Precios Claros y Justos</h3>
              <p className="lp-bento-desc">Cálculo de tarifas transparente sin cargos sorpresa. Cotiza al instante según la distancia exacta y paga el precio exacto sin recargos ocultos.</p>
            </div>
          </div>
        </section>

        {/* ═══ PARTNERS CLIENTES ACTIVOS ═══ */}
        <section className="lf-partners reveal">
          <div className="lf-partners-inner">
            <div className="lf-partners-header">
              <span className="lf-eyebrow">Confianza</span>
              <h2 className="lf-section-title font-syne" style={{ fontSize: '1.8rem', marginBottom: 8 }}>Empresas aliadas</h2>
            </div>
            <div className="lf-marquee">
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

        {/* ═══ CTA SECTION ═══ */}
        <section className="lf-cta" id="contacto">
          <div className="lf-cta-inner reveal">
            <h2 className="lf-cta-title font-syne">¿Listo para optimizar tu logística?</h2>
            <p className="lf-cta-desc">Crea tu cuenta comercial en minutos y accede a la consola de despacho de Logifast.</p>
            <button className="lp-btn-primary" onClick={() => navigateTo('register')} style={{ margin: '0 auto' }}>
              Registrarse Gratis
              <IconArrowRight />
            </button>
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
                </ul>
              </div>
              <div>
                <h4 className="lf-footer-col-title">Empresa</h4>
                <ul className="lf-footer-links">
                  <li><a href="#">Nosotros</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Contacto</a></li>
                </ul>
              </div>
              <div>
                <h4 className="lf-footer-col-title">Legal</h4>
                <ul className="lf-footer-links">
                  <li><a href="#">Privacidad</a></li>
                  <li><a href="#">Términos</a></li>
                </ul>
              </div>
            </div>
            <div className="lf-footer-bottom">
              <span>LOGIFAST 2026</span>
              <span>Operaciones de Precisión</span>
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
    </>
  );
}
