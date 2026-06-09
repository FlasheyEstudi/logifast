'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── SVG Icons ─── */
const IconEnvelope = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
);
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);
const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconMoto = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" /><path d="M5 18h3l3-6h4l2 6h2" /><path d="M11 6l2 6" /></svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
const IconWrench = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
);
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

/* ─── Toast type ─── */
type ToastVariant = 'success' | 'error' | 'default';
interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving?: boolean;
}

/* ─── Role data ─── */
const rolesData = [
  {
    id: 'cliente',
    tab: 'Cliente',
    title: 'Solicita y rastrea',
    desc: 'Pide un envío en segundos, obtén tu cotización al instante y sigue cada movimiento de tu paquete en tiempo real.',
    features: ['Autocompletado de direcciones', 'Cotización instantánea', 'GPS en tiempo real', 'Historial completo'],
    mockupBlocks: [
      { h: 48, cls: 'lf-mockup-block-navy', w: '60%' },
      { h: 32, cls: 'lf-mockup-block-accent', w: '80%' },
      { h: 24, cls: 'lf-mockup-block-muted', w: '50%' },
      { h: 64, cls: 'lf-mockup-block-navy', w: '100%' },
      { h: 24, cls: 'lf-mockup-block-muted', w: '40%' },
      { h: 40, cls: 'lf-mockup-block-accent', w: '70%' },
    ],
  },
  {
    id: 'repartidor',
    tab: 'Repartidor',
    title: 'Entrega con confianza',
    desc: 'Recibe asignaciones automáticas, navega rutas optimizadas y registra cada entrega sin fricción.',
    features: ['Asignación automática', 'Contador de kilómetros', 'Mapa de ruta', 'Reporte de incidencias'],
    mockupBlocks: [
      { h: 64, cls: 'lf-mockup-block-accent', w: '100%' },
      { h: 32, cls: 'lf-mockup-block-muted', w: '45%' },
      { h: 32, cls: 'lf-mockup-block-muted', w: '45%' },
      { h: 48, cls: 'lf-mockup-block-navy', w: '80%' },
      { h: 24, cls: 'lf-mockup-block-accent', w: '60%' },
      { h: 32, cls: 'lf-mockup-block-muted', w: '90%' },
    ],
  },
  {
    id: 'admin',
    tab: 'Administrador',
    title: 'Control total',
    desc: 'Visualiza toda la flota, gestiona pedidos y reasigna recursos con un dashboard operativo en tiempo real.',
    features: ['Mapa de flota en vivo', 'Gestión de pedidos', 'Reasignación inteligente', 'Reportes operativos'],
    mockupBlocks: [
      { h: 80, cls: 'lf-mockup-block-navy', w: '100%' },
      { h: 32, cls: 'lf-mockup-block-accent', w: '30%' },
      { h: 32, cls: 'lf-mockup-block-accent', w: '30%' },
      { h: 32, cls: 'lf-mockup-block-accent', w: '30%' },
      { h: 48, cls: 'lf-mockup-block-muted', w: '60%' },
      { h: 24, cls: 'lf-mockup-block-navy', w: '80%' },
    ],
  },
  {
    id: 'ingeniero',
    tab: 'Ingeniero',
    title: 'Mantiene la flota',
    desc: 'Monitorea el estado de cada moto, gestiona inventario de repuestos y programa mantenimientos preventivos.',
    features: ['Alertas por kilometraje', 'Inventario de repuestos', 'Mantenimiento programado', 'Detección de anomalías'],
    mockupBlocks: [
      { h: 40, cls: 'lf-mockup-block-accent', w: '50%' },
      { h: 40, cls: 'lf-mockup-block-muted', w: '45%' },
      { h: 64, cls: 'lf-mockup-block-navy', w: '100%' },
      { h: 24, cls: 'lf-mockup-block-accent', w: '40%' },
      { h: 24, cls: 'lf-mockup-block-muted', w: '55%' },
      { h: 48, cls: 'lf-mockup-block-navy', w: '70%' },
    ],
  },
];

/* ─── Feature data ─── */
const featuresData = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Rastreo GPS',
    desc: 'Sigue cada envío en tiempo real con posición exacta, ETA actualizado y notificaciones de progreso.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Alertas mantenimiento',
    desc: 'Recibe alertas automáticas cuando una moto necesita servicio basado en kilometraje y desgaste.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Cotización automática',
    desc: 'Obtén precios instantáneos basados en distancia, zona y tipo de envío. Sin esperas, sin sorpresas.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
      </svg>
    ),
    title: 'Dashboard operativo',
    desc: 'Vista consolidada de la flota, entregas activas y métricas clave para decisiones rápidas.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: 'Inventario repuestos',
    desc: 'Control total de piezas y repuestos con stock mínimo, alertas de reorden y trazabilidad.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Reportes y análisis',
    desc: 'Datos accionables sobre rendimiento, tiempos de entrega y eficiencia de la flota.',
  },
];

/* ─── Theme toggle icon (outside component) ─── */
const ThemeIcon = ({ isDark }: { isDark: boolean }) =>
  isDark ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

/* ─── Demo credentials ─── */
const demoCredentials: Record<string, { email: string; password: string }> = {
  cliente: { email: 'cliente@logifast.com', password: '123456' },
  repartidor: { email: 'repartidor@logifast.com', password: '123456' },
  admin: { email: 'admin@logifast.com', password: '123456' },
  ingeniero: { email: 'ingeniero@logifast.com', password: '123456' },
};

export default function Home() {
  /* ─── Landing state ─── */
  const [activeRole, setActiveRole] = useState('cliente');
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const revealRef = useRef<HTMLElement>(null);

  /* ─── Auth state ─── */
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);

  /* ─── Form state ─── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState('cliente');
  const [regErrors, setRegErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  /* ─── Theme state ─── */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lf-theme') === 'dark';
    }
    return false;
  });

  /* ─── Toasts ─── */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 4000);
  }, []);

  /* ─── Apply theme on mount ─── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  }, []);

  /* ─── Navbar scroll effect ─── */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ─── Scroll reveal ─── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    const el = revealRef.current;
    if (el) el.querySelectorAll('.reveal').forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, [showAuth]);

  /* ─── Theme toggle ─── */
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
      localStorage.setItem('lf-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  /* ─── Smooth scroll to section ─── */
  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* ─── Open auth screen ─── */
  const openAuth = useCallback((mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
    document.body.style.overflow = 'hidden';
  }, []);

  /* ─── Close auth screen ─── */
  const closeAuth = useCallback(() => {
    setShowAuth(false);
    document.body.style.overflow = '';
    setLoginEmail('');
    setLoginPassword('');
    setLoginErrors({});
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirm('');
    setRegErrors({});
    setRegSuccess(false);
  }, []);

  /* ─── Switch auth mode with transition ─── */
  const switchAuthMode = useCallback((mode: 'login' | 'register') => {
    if (mode === authMode || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setAuthMode(mode);
      setIsTransitioning(false);
      setLoginErrors({});
      setRegErrors({});
    }, 200);
  }, [authMode, isTransitioning]);

  /* ─── Email validation ─── */
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ─── Password strength ─── */
  const getPasswordStrength = (pw: string): 'weak' | 'medium' | 'strong' | '' => {
    if (pw.length === 0) return '';
    if (pw.length < 4) return 'weak';
    if (pw.length < 8) return 'medium';
    return 'strong';
  };

  /* ─── Login submit ─── */
  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!loginEmail) errors.email = 'El correo es requerido';
    else if (!isValidEmail(loginEmail)) errors.email = 'Correo electrónico inválido';
    if (!loginPassword) errors.password = 'La contraseña es requerida';
    else if (loginPassword.length < 6) errors.password = 'Mínimo 6 caracteres';
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      addToast('Sesión iniciada correctamente', 'success');
    }, 1500);
  }, [loginEmail, loginPassword, addToast]);

  /* ─── Register submit ─── */
  const handleRegister = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string; password?: string; confirm?: string } = {};
    if (!regName.trim()) errors.name = 'El nombre es requerido';
    if (!regEmail) errors.email = 'El correo es requerido';
    else if (!isValidEmail(regEmail)) errors.email = 'Correo electrónico inválido';
    if (!regPassword) errors.password = 'La contraseña es requerida';
    else if (regPassword.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (!regConfirm) errors.confirm = 'Confirma tu contraseña';
    else if (regPassword !== regConfirm) errors.confirm = 'Las contraseñas no coinciden';
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setRegLoading(true);
    setTimeout(() => {
      setRegLoading(false);
      setRegSuccess(true);
    }, 1500);
  }, [regName, regEmail, regPassword, regConfirm]);

  /* ─── Demo quick login ─── */
  const handleDemoLogin = useCallback((role: string) => {
    const cred = demoCredentials[role];
    if (!cred) return;
    setLoginEmail(cred.email);
    setLoginPassword(cred.password);
    setLoginErrors({});
    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      addToast(`Sesión iniciada como ${role}`, 'success');
    }, 1200);
  }, [addToast]);

  /* ─── Real-time validation for register (computed, no effect) ─── */
  const regValidationErrors = (() => {
    const errors: { name?: string; email?: string; password?: string; confirm?: string } = {};
    if (regEmail && !isValidEmail(regEmail)) errors.email = 'Correo electrónico inválido';
    if (regPassword && regPassword.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (regConfirm && regPassword !== regConfirm) errors.confirm = 'Las contraseñas no coinciden';
    return errors;
  })();

  const passwordStrength = getPasswordStrength(regPassword);
  const displayRegErrors = { ...regValidationErrors, ...regErrors }; // submit errors override

  /* ═══════════════════════════════════════════════
     AUTH SCREEN
     ═══════════════════════════════════════════════ */
  if (showAuth) {
    return (
      <>
        <div className="lf-auth">
          {/* Left panel */}
          <div className="lf-auth-panel">
            <div className="lf-auth-panel-content">
              <div className="lf-auth-panel-logo">
                <div className="lf-auth-logo-mark">LF</div>
                <span className="lf-auth-logo-text font-serif">LOGIFAST</span>
              </div>
              <p className="lf-auth-panel-tagline">Tus Envíos Seguros y Rápidos</p>
              <div className="lf-auth-panel-divider" />
              <div className="lf-auth-panel-quote">
                <div className="lf-auth-panel-quote-mark">&ldquo;</div>
                <p className="lf-auth-panel-quote-text">
                  La plataforma más confiable para envíos urbanos en Managua
                </p>
              </div>
              <div className="lf-auth-panel-stats font-mono">
                <span className="lf-auth-panel-stat">12K+ envíos</span>
                <span className="lf-auth-panel-stat-sep">·</span>
                <span className="lf-auth-panel-stat">98% a tiempo</span>
                <span className="lf-auth-panel-stat-sep">·</span>
                <span className="lf-auth-panel-stat">45 motos</span>
              </div>
            </div>
            <button className="lf-auth-panel-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
              <ThemeIcon isDark={isDark} />
            </button>
          </div>

          {/* Right panel */}
          <div className="lf-auth-form-side">
            <div className="lf-auth-form-container">
              {/* Mobile logo */}
              <div className="lf-auth-mobile-logo">
                <div className="lf-auth-logo-mark">LF</div>
                <span className="lf-auth-logo-text font-serif">LOGIFAST</span>
              </div>

              {/* Back link */}
              <button className="lf-auth-back-link" onClick={closeAuth}>
                <IconArrowLeft /> Volver al inicio
              </button>

              {/* ─── LOGIN FORM ─── */}
              {authMode === 'login' && !isTransitioning && (
                <div className="lf-form-panel slide-in">
                  <h1 className="lf-auth-title font-serif">Bienvenido</h1>
                  <p className="lf-auth-subtitle">Ingresa tus credenciales para continuar</p>

                  <form onSubmit={handleLogin} noValidate>
                    <div className="lf-form-group">
                      <label className="lf-form-label">Correo electrónico</label>
                      <div className="lf-input-wrapper">
                        <span className="lf-input-icon"><IconEnvelope /></span>
                        <input
                          type="email"
                          className={`lf-form-input ${loginErrors.email ? 'error' : ''}`}
                          placeholder="tu@email.com"
                          value={loginEmail}
                          onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); }}
                        />
                      </div>
                      <div className="lf-form-error">{loginErrors.email || ''}</div>
                    </div>

                    <div className="lf-form-group">
                      <label className="lf-form-label">Contraseña</label>
                      <div className="lf-input-wrapper">
                        <span className="lf-input-icon"><IconLock /></span>
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          className={`lf-form-input ${loginErrors.password ? 'error' : ''}`}
                          placeholder="Tu contraseña"
                          value={loginPassword}
                          onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); }}
                          style={{ paddingRight: 48 }}
                        />
                        <button type="button" className="lf-input-eye" onClick={() => setShowLoginPassword((p) => !p)}>
                          {showLoginPassword ? <IconEyeOff /> : <IconEye />}
                        </button>
                      </div>
                      <div className="lf-form-error">{loginErrors.password || ''}</div>
                    </div>

                    <button type="button" className="lf-forgot-link">¿Olvidaste tu contraseña?</button>

                    <button type="submit" className="lf-auth-submit" disabled={loginLoading}>
                      {loginLoading ? (
                        <><span className="lf-spinner" /><span>Ingresando...</span></>
                      ) : (
                        'Iniciar sesión'
                      )}
                    </button>
                  </form>

                  <div className="lf-separator">
                    <div className="lf-separator-line" />
                    <span className="lf-separator-text">o</span>
                    <div className="lf-separator-line" />
                  </div>

                  <div className="lf-demo-pills">
                    {['Cliente', 'Repartidor', 'Admin', 'Ingeniero'].map((role) => (
                      <button key={role} className="lf-demo-pill" onClick={() => handleDemoLogin(role.toLowerCase())}>
                        {role}
                      </button>
                    ))}
                  </div>
                  <div className="lf-demo-label">Acceso rápido para demo</div>

                  <div className="lf-switch-link">
                    ¿No tienes cuenta?{' '}
                    <button className="lf-switch-link-btn" onClick={() => switchAuthMode('register')}>
                      Crear cuenta
                    </button>
                  </div>
                </div>
              )}

              {/* ─── REGISTER FORM ─── */}
              {authMode === 'register' && !isTransitioning && !regSuccess && (
                <div className="lf-form-panel slide-in">
                  <h1 className="lf-auth-title font-serif">Crear cuenta</h1>
                  <p className="lf-auth-subtitle">Completa los datos para registrarte</p>

                  <form onSubmit={handleRegister} noValidate>
                    <div className="lf-form-group">
                      <label className="lf-form-label">Nombre completo</label>
                      <div className="lf-input-wrapper">
                        <span className="lf-input-icon"><IconUser /></span>
                        <input
                          type="text"
                          className={`lf-form-input ${displayRegErrors.name ? 'error' : ''}`}
                          placeholder="Tu nombre"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                        />
                      </div>
                      <div className="lf-form-error">{displayRegErrors.name || ''}</div>
                    </div>

                    <div className="lf-form-group">
                      <label className="lf-form-label">Correo electrónico</label>
                      <div className="lf-input-wrapper">
                        <span className="lf-input-icon"><IconEnvelope /></span>
                        <input
                          type="email"
                          className={`lf-form-input ${displayRegErrors.email ? 'error' : ''}`}
                          placeholder="tu@email.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                      </div>
                      <div className="lf-form-error">{displayRegErrors.email || ''}</div>
                    </div>

                    <div className="lf-form-group">
                      <label className="lf-form-label">Contraseña</label>
                      <div className="lf-input-wrapper">
                        <span className="lf-input-icon"><IconLock /></span>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          className={`lf-form-input ${displayRegErrors.password ? 'error' : ''}`}
                          placeholder="Mínimo 6 caracteres"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          style={{ paddingRight: 48 }}
                        />
                        <button type="button" className="lf-input-eye" onClick={() => setShowRegPassword((p) => !p)}>
                          {showRegPassword ? <IconEyeOff /> : <IconEye />}
                        </button>
                      </div>
                      <div className="lf-strength-bar">
                        <div className={`lf-strength-bar-fill ${passwordStrength ? `lf-strength-${passwordStrength}` : ''}`} />
                      </div>
                      <div className="lf-form-error">{displayRegErrors.password || ''}</div>
                    </div>

                    <div className="lf-form-group">
                      <label className="lf-form-label">Confirmar contraseña</label>
                      <div className="lf-input-wrapper">
                        <span className="lf-input-icon"><IconLock /></span>
                        <input
                          type="password"
                          className={`lf-form-input ${displayRegErrors.confirm ? 'error' : ''}`}
                          placeholder="Repite tu contraseña"
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                        />
                      </div>
                      <div className="lf-form-error">{displayRegErrors.confirm || ''}</div>
                    </div>

                    <div className="lf-form-group">
                      <label className="lf-form-label">Tipo de cuenta</label>
                      <div className="lf-role-selector">
                        {[
                          { id: 'cliente', label: 'Cliente', icon: <IconPerson /> },
                          { id: 'repartidor', label: 'Repartidor', icon: <IconMoto /> },
                          { id: 'admin', label: 'Administrador', icon: <IconShield /> },
                          { id: 'ingeniero', label: 'Ingeniero', icon: <IconWrench /> },
                        ].map((role) => (
                          <div
                            key={role.id}
                            className={`lf-role-option ${regRole === role.id ? 'selected' : ''}`}
                            onClick={() => setRegRole(role.id)}
                          >
                            <div className="lf-role-option-icon">{role.icon}</div>
                            <span className="lf-role-option-label">{role.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="lf-auth-submit" disabled={regLoading}>
                      {regLoading ? (
                        <><span className="lf-spinner" /><span>Creando cuenta...</span></>
                      ) : (
                        'Crear cuenta'
                      )}
                    </button>
                  </form>

                  <div className="lf-switch-link" style={{ marginTop: 24 }}>
                    ¿Ya tienes cuenta?{' '}
                    <button className="lf-switch-link-btn" onClick={() => switchAuthMode('login')}>
                      Iniciar sesión
                    </button>
                  </div>
                </div>
              )}

              {/* ─── REGISTER SUCCESS ─── */}
              {authMode === 'register' && regSuccess && (
                <div className="lf-success-overlay">
                  <div className="lf-success-circle">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <h2 className="lf-success-title font-serif">Cuenta creada exitosamente</h2>
                  <p style={{ color: 'var(--lf-text-muted)', fontSize: 15 }}>Ya puedes iniciar sesión con tus credenciales</p>
                  <button className="lf-success-btn" onClick={() => { setRegSuccess(false); switchAuthMode('login'); }}>
                    Ir a iniciar sesión
                  </button>
                </div>
              )}
            </div>

            {/* Mobile theme toggle */}
            <button
              className="lf-theme-toggle"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              style={{ position: 'absolute', top: 24, right: 24 }}
            >
              <ThemeIcon isDark={isDark} />
            </button>
          </div>
        </div>

        {/* Toasts */}
        <div className="lf-toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`lf-toast ${t.variant} ${t.leaving ? 'leaving' : ''}`}>
              <span className="lf-toast-icon">
                {t.variant === 'success' && <IconCheck />}
                {t.variant === 'error' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                )}
                {t.variant === 'default' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lf-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                )}
              </span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════════
     LANDING PAGE
     ═══════════════════════════════════════════════ */
  return (
    <main className="grain-overlay" ref={revealRef}>
      {/* ═══ NAVBAR ═══ */}
      <nav className={`lf-navbar ${navScrolled ? 'scrolled' : ''}`}>
        <a href="#" className="lf-navbar-logo" onClick={(e) => { e.preventDefault(); scrollTo('hero'); }}>
          <div className="lf-logo-mark">LF</div>
          <span className="lf-logo-text font-serif">LOGIFAST</span>
        </a>

        <ul className="lf-nav-links">
          <li><a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollTo('como-funciona'); }}>Cómo funciona</a></li>
          <li><a href="#funciones" onClick={(e) => { e.preventDefault(); scrollTo('funciones'); }}>Funciones</a></li>
          <li><a href="#roles" onClick={(e) => { e.preventDefault(); scrollTo('roles'); }}>Roles</a></li>
          <li><a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto'); }}>Contacto</a></li>
        </ul>

        <div className="lf-nav-actions">
          <button className="lf-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
            <ThemeIcon isDark={isDark} />
          </button>
          <button className="lf-btn-primary nav-btn" onClick={() => openAuth('login')}>Iniciar sesión</button>
          <button className="lf-hamburger" onClick={() => setMobileMenuOpen((p) => !p)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className={`lf-mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollTo('como-funciona'); }}>Cómo funciona</a>
        <a href="#funciones" onClick={(e) => { e.preventDefault(); scrollTo('funciones'); }}>Funciones</a>
        <a href="#roles" onClick={(e) => { e.preventDefault(); scrollTo('roles'); }}>Roles</a>
        <a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto'); }}>Contacto</a>
        <button className="lf-btn-primary" style={{ marginTop: 16, width: 'fit-content' }} onClick={() => { setMobileMenuOpen(false); openAuth('login'); }}>Iniciar sesión</button>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="lf-hero" id="hero">
        <div className="lf-hero-inner">
          <div className="lf-hero-content">
            <div className="lf-badge reveal">
              <span className="lf-badge-dot" />
              Flota activa en Managua
            </div>
            <h1 className="lf-hero-title reveal reveal-delay-1">
              Tus envíos,{' '}
              <span className="accent-italic">seguros</span> y{' '}
              <span className="accent-italic">rápidos</span>
            </h1>
            <p className="lf-hero-subtitle reveal reveal-delay-2">
              Gestión logística con flota motociclista para envíos urbanos en Managua.
              Rastreo en tiempo real, cotización automática y entregas que llegan.
            </p>
            <div className="lf-hero-buttons reveal reveal-delay-3">
              <button className="lf-btn-primary" onClick={() => openAuth('register')}>
                Solicitar envío
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </button>
              <button className="lf-btn-outline">Ver demo</button>
            </div>
            <div className="lf-hero-stats reveal reveal-delay-4">
              <div className="lf-hero-stat">
                <span className="lf-hero-stat-number font-mono">12K+</span>
                <span className="lf-hero-stat-label">Envíos completados</span>
              </div>
              <div className="lf-hero-stat">
                <span className="lf-hero-stat-number font-mono">98%</span>
                <span className="lf-hero-stat-label">Entregas a tiempo</span>
              </div>
              <div className="lf-hero-stat">
                <span className="lf-hero-stat-number font-mono">45</span>
                <span className="lf-hero-stat-label">Motos en flota</span>
              </div>
            </div>
          </div>

          <div className="lf-hero-visual reveal reveal-delay-2">
            <div className="lf-float-card lf-float-card-1">
              <span className="lf-float-card-dot green" />
              <span className="lf-float-card-number font-mono">+24</span>
              <span className="lf-float-card-label">Entregado hoy</span>
            </div>
            <div className="lf-phone">
              <div className="lf-phone-notch" />
              <div className="lf-phone-header">
                <div>
                  <div className="lf-phone-header-title">Seguimiento</div>
                  <div className="lf-phone-header-order font-mono">Orden #LF-2847</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
              <div className="lf-phone-map">
                <div className="lf-phone-map-grid" />
                <div className="lf-phone-route">
                  <div className="lf-phone-route-line" />
                  <div className="lf-phone-route-line-2" />
                </div>
                <div className="lf-phone-pin lf-pin-pickup"><span>A</span></div>
                <div className="lf-phone-pin lf-pin-delivery"><span>B</span></div>
                <div className="lf-phone-pin lf-pin-rider"><span>🏍</span></div>
              </div>
              <div className="lf-phone-bottom">
                <div className="lf-phone-handle" />
                <div className="lf-phone-rider-info">
                  <div className="lf-phone-rider-avatar">CR</div>
                  <div>
                    <div className="lf-phone-rider-name">Carlos Rivera</div>
                    <div className="lf-phone-rider-vehicle">Honda Wave • Roja</div>
                  </div>
                </div>
                <div className="lf-phone-eta">
                  <div>
                    <div className="lf-phone-eta-label">Llegada estimada</div>
                    <div className="lf-phone-eta-time font-mono">12 min</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="lf-phone-eta-label">Hora</div>
                    <div className="lf-phone-eta-arrival font-mono">2:35 PM</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lf-float-card lf-float-card-2">
              <span className="lf-float-card-dot orange" />
              <span className="lf-float-card-number font-mono">8</span>
              <span className="lf-float-card-label">En ruta activas</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="lf-trust-bar reveal">
        <div className="lf-trust-label">Empresas que confían en nosotros</div>
        <div className="lf-trust-logos">
          <span className="lf-trust-logo">NicaCommerce</span>
          <span className="lf-trust-logo">TecnoManagua</span>
          <span className="lf-trust-logo">DelSur Market</span>
          <span className="lf-trust-logo">CasaNica</span>
          <span className="lf-trust-logo">FastCargo NI</span>
        </div>
      </section>

      {/* ═══ CÓMO FUNCIONA ═══ */}
      <section className="lf-how" id="como-funciona">
        <div className="lf-how-inner">
          <div className="lf-how-header">
            <div>
              <span className="lf-eyebrow reveal">Cómo funciona</span>
              <h2 className="lf-section-title reveal reveal-delay-1">De tu puerta a su destino</h2>
            </div>
            <p className="lf-how-desc reveal reveal-delay-2">
              Un proceso simple y transparente. Tú pides, nosotros nos encargamos del resto.
              Cada paso es rastreable para que siempre sepas dónde está tu envío.
            </p>
          </div>
          <div className="lf-steps">
            {[
              { num: '01', title: 'Solicita', desc: 'Ingresa el origen, destino y tipo de paquete. Cotización instantánea.' },
              { num: '02', title: 'Asignamos', desc: 'El sistema asigna el repartidor más cercano de forma automática.' },
              { num: '03', title: 'Rastrea', desc: 'Sigue tu envío en tiempo real con GPS y notificaciones.' },
              { num: '04', title: 'Entregado', desc: 'Confirmación con foto y firma. Comprobante digital al instante.' },
            ].map((step, i) => (
              <div className="lf-step reveal" key={step.num} style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="lf-step-number font-mono">{step.num}</div>
                <div className="lf-step-text">
                  <div className="lf-step-title">{step.title}</div>
                  <div className="lf-step-desc">{step.desc}</div>
                </div>
                {i < 3 && <div className="lf-step-line" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FUNCIONES ═══ */}
      <section className="lf-features" id="funciones">
        <div className="lf-features-inner">
          <div className="lf-features-header">
            <span className="lf-eyebrow reveal">Funciones</span>
            <h2 className="lf-section-title reveal reveal-delay-1">Todo lo que necesitas para operar</h2>
            <p className="reveal reveal-delay-2">Herramientas diseñadas para cada actor de la cadena logística, desde el cliente hasta el ingeniero de mantenimiento.</p>
          </div>
          <div className="lf-features-grid">
            {featuresData.map((f, i) => (
              <div className="lf-feature-card reveal" key={f.title} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="lf-feature-icon">{f.icon}</div>
                <div className="lf-feature-title">{f.title}</div>
                <div className="lf-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROLES ═══ */}
      <section className="lf-roles" id="roles">
        <div className="lf-roles-inner">
          <div className="lf-roles-header">
            <span className="lf-eyebrow reveal">Para cada rol</span>
            <h2 className="lf-section-title reveal reveal-delay-1">Una experiencia a tu medida</h2>
          </div>
          <div className="lf-roles-tabs reveal reveal-delay-2">
            {rolesData.map((r) => (
              <button key={r.id} className={`lf-role-tab ${activeRole === r.id ? 'active' : ''}`} onClick={() => setActiveRole(r.id)}>
                {r.tab}
              </button>
            ))}
          </div>
          <div className="lf-roles-preview reveal reveal-delay-3">
            <div className="lf-window-dots">
              <span className="lf-window-dot red" />
              <span className="lf-window-dot yellow" />
              <span className="lf-window-dot green" />
            </div>
            {rolesData.map((r) => (
              <div key={r.id} className={`lf-role-panel ${activeRole === r.id ? 'active' : ''}`}>
                <div className="lf-roles-content">
                  <div className="lf-roles-info">
                    <h3 className="lf-roles-info-title font-serif">{r.title}</h3>
                    <p className="lf-roles-info-desc">{r.desc}</p>
                    <ul className="lf-roles-features">
                      {r.features.map((f) => (
                        <li key={f}>
                          <span className="lf-check-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lf-roles-mockup">
                    {r.mockupBlocks.map((b, i) => (
                      <div key={i} className={`lf-mockup-block ${b.cls}`} style={{ height: b.h, width: b.w }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="lf-cta" id="contacto">
        <div className="lf-cta-inner">
          <h2 className="lf-cta-title font-serif reveal">Empieza a enviar hoy</h2>
          <p className="lf-cta-desc reveal reveal-delay-1">
            Únete a las empresas que ya confían en LOGIFAST para sus entregas urbanas.
            Sin contratos, sin complicaciones.
          </p>
          <button className="lf-cta-btn reveal reveal-delay-2" onClick={() => openAuth('register')}>
            Crear cuenta gratis
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="lf-footer">
        <div className="lf-footer-inner">
          <div className="lf-footer-grid">
            <div>
              <div className="lf-footer-brand-name font-serif">LOGIFAST</div>
              <p className="lf-footer-brand-desc">
                Sistema de gestión logística con flota motociclista para envíos urbanos en Managua, Nicaragua. Tus envíos seguros y rápidos.
              </p>
            </div>
            <div>
              <div className="lf-footer-col-title">Producto</div>
              <ul className="lf-footer-links">
                <li><a href="#">Rastreo GPS</a></li>
                <li><a href="#">Cotización</a></li>
                <li><a href="#">Dashboard</a></li>
                <li><a href="#">Reportes</a></li>
              </ul>
            </div>
            <div>
              <div className="lf-footer-col-title">Empresa</div>
              <ul className="lf-footer-links">
                <li><a href="#">Nosotros</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Carreras</a></li>
                <li><a href="#">Contacto</a></li>
              </ul>
            </div>
            <div>
              <div className="lf-footer-col-title">Legal</div>
              <ul className="lf-footer-links">
                <li><a href="#">Términos</a></li>
                <li><a href="#">Privacidad</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="lf-footer-bottom">
            <span>© 2025 LOGIFAST. Todos los derechos reservados.</span>
            <span>Managua, Nicaragua</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
