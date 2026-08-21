'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dashboard from './dashboard';
import ClientDashboard from './client-dashboard';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useConfigStore, aplicarTema } from '@/store/configStore';
import { toggleThemeWithTransition } from '@/lib/theme-transition';
import { sileo } from "sileo";
import { Transition } from '@headlessui/react';
import { RoleLoader, MiniSpinner } from '@/components/ui/loaders';
import {
  DeliveryMotoIllustration,
  MapIllustration,
  SecurePackageIllustration,
  ReceivePackageIllustration,
  PhoneTrackingIllustration,
  StarsIllustration,
  SpeedClockIllustration,
  SocialNetworkIllustration,
} from '@/components/illustrations';
import AuthRedesign from '@/components/auth/AuthRedesign';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';

const RepartidorApp = dynamic(() => import('@/components/repartidor/RepartidorApp'), { ssr: false, loading: () => <RoleLoader role="repartidor" /> });
const IngenieroApp = dynamic(() => import('@/components/ingeniero/IngenieroApp'), { ssr: false, loading: () => <RoleLoader role="ingeniero" /> });
const TiendaApp = dynamic(() => import('@/components/tienda/TiendaApp'), { ssr: false, loading: () => <RoleLoader role="cliente" /> });

/* ═══════════════════════════════════════════════════════
   SVG HIGH-TECH ICONS
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
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const IconXCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);
const IconAlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
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
          width: large ? '56px' : '40px', 
          height: large ? '56px' : '40px',
          objectFit: 'contain'
        }} 
      />
      <div className="lf-logo-wordmark" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <span className="lf-logo-logi" style={{ color: darkText ? 'var(--surface)' : '#FFFFFF', fontWeight: 700, letterSpacing: '-0.5px' }}>LOGI</span>
        <span className="lf-logo-fast" style={{ color: '#0066FF', fontWeight: 700, letterSpacing: '-0.5px' }}>FAST</span>
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

  handleResetHome = () => {
    try {
      localStorage.removeItem('lf-session-view');
      localStorage.removeItem('lf-session-role');
      localStorage.removeItem('lf-session-name');
      window.location.hash = '';
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    this.props.onGoHome();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error ? this.state.error.message : 'Error desconocido';
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#030305',
          padding: 24, textAlign: 'center', fontFamily: "'DM Sans', sans-serif"
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>
            Algo salió mal al cargar el Módulo
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 450, margin: '0 auto 24px', fontSize: 15, lineHeight: 1.5 }}>
            Se produjo un fallo inesperado en la interfaz. Puedes reintentar cargar la vista o reiniciar la sesión para ingresar a otro rol.
          </p>
          <div style={{
            padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.2)', maxWidth: 500, width: '100%',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#FF1744',
            wordBreak: 'break-word', overflow: 'auto', maxHeight: 120, marginBottom: 16
          }}>
            {errorMessage}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#0066FF', color: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              Reintentar
            </button>
            <button
              onClick={this.handleResetHome}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#FFFFFF',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              Cambiar Rol / Inicio
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
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [regStep, setRegStep] = useState(1);

  /* ─── Navigation/Interface state ─── */
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const revealRef = useRef<HTMLElement>(null);

  /* ─── Auth state ─── */
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
  // New Nicaragua-specific fields
  const [regTelefono, setRegTelefono] = useState('');
  const [regMunicipio, setRegMunicipio] = useState('Managua');
  const [regVehiculoTipo, setRegVehiculoTipo] = useState('moto');
  const [regVehiculoMarca, setRegVehiculoMarca] = useState('');
  const [regVehiculoModelo, setRegVehiculoModelo] = useState('');
  const [regVehiculoAnio, setRegVehiculoAnio] = useState('');
  const [regVehiculoColor, setRegVehiculoColor] = useState('');
  const [regVehiculoPlaca, setRegVehiculoPlaca] = useState('');

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

  const getRoleFeatures = (role: string) => {
    switch (role) {
      case 'cliente': return {
        title: "Portal de Clientes",
        desc: "Accede al cotizador interactivo para estimar costos de envío inmediatos. Solicita motorizados express con asignación en tiempo real y descarga facturas fiscales automatizadas en formato PDF desde tu panel.",
        kpiLabel: "Simulación de Cotización",
        kpiVal: "C$ 75.00",
        kpiSub: "Tarifa base + 5km de recorrido"
      };
      case 'repartidor': return {
        title: "Panel de Riders",
        desc: "Visualiza tu mapa GPS activo en tiempo real. Gestiona la aceptación de órdenes basadas en tu proximidad física, visualiza la ruta óptima sugerida por satélite y lleva el control total de tus ganancias acumuladas.",
        kpiLabel: "Latencia GPS Activa",
        kpiVal: "12ms",
        kpiSub: "Conectado a nodo principal Managua"
      };
      case 'ingeniero': return {
        title: "Consola de Mantenimiento",
        desc: "Monitorea la flota en tiempo real. Asocia hojas de servicio mecánico a cada unidad, controla de forma automática el stock mínimo de repuestos críticos del taller y recibe alertas preventivas predictivas según el kilometraje.",
        kpiLabel: "Alertas de Taller",
        kpiVal: "3 Críticas",
        kpiSub: "Unidades requieren cambio de repuesto"
      };
      case 'admin': return {
        title: "Consola de Administración",
        desc: "Supervisa la totalidad de la red de despachos en tiempo real. Audita transacciones financieras y comisiones globales de la plataforma, y administra perfiles operativos junto a la resolución rápida de incidencias.",
        kpiLabel: "Entregas Exitosas Hoy",
        kpiVal: "98.7%",
        kpiSub: "412 despachos completados a tiempo"
      };
      default: return null;
    }
  };

  const getRolePuntosFuertes = (role: string) => {
    switch (role) {
      case 'cliente': return [
        "Tarifas sumamente competitivas calculadas al instante por volumen y distancia.",
        "Garantía de entrega express en toda la zona metropolitana de Managua.",
        "Soporte de incidencias y chat prioritario directo con el rider asignado."
      ];
      case 'repartidor': return [
        "Retiros rápidos de tus ganancias directamente a tu billetera digital.",
        "Mayor volumen de órdenes operativas gracias al ruteo continuo por GPS.",
        "Soporte técnico y auxilio en ruta activo las 24 horas del día."
      ];
      case 'ingeniero': return [
        "Previene averías críticas de taller con alertas automáticas de kilometraje.",
        "Monitoreo simplificado de repuestos con alertas automáticas de stock mínimo.",
        "Registro de hojas mecánicas totalmente digitalizado y enlazado a la moto."
      ];
      case 'admin': return [
        "Visualización satelital unificada de toda la flota en un mapa dinámico.",
        "Control granular de comisiones operativas, facturación y estados de caja.",
        "Acceso a analíticas avanzadas de rendimiento e incidencias en vivo."
      ];
      default: return [];
    }
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

  // Listen to hash changes and restore authenticated sessions from server
  useEffect(() => {
    // Verificar sesión activa en el servidor (/api/auth/me)
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          const user = data.user;
          setLoginRole(user.role);
          setLoginUserName(user.name || user.email);
          localStorage.setItem('lf-session-role', user.role);
          localStorage.setItem('lf-session-name', user.name || user.email);
          if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#/login') {
            setCurrentView('dashboard');
            window.location.hash = '#/dashboard';
          }
        }
      })
      .catch(() => null);

    const handleHashChange = () => {
      const hash = window.location.hash;
      const savedRole = typeof window !== 'undefined' ? localStorage.getItem('lf-session-role') : null;
      const savedName = typeof window !== 'undefined' ? localStorage.getItem('lf-session-name') : null;

      if (hash === '#/login' && !savedRole) {
        setCurrentView('login');
        setRegStep(1);
        document.body.style.overflow = 'hidden';
      } else if (hash === '#/register' && !savedRole) {
        setCurrentView('register');
        setRegStep(1);
        document.body.style.overflow = 'hidden';
      } else if (
        hash.startsWith('#/dashboard') ||
        hash.startsWith('#/cliente') ||
        hash.startsWith('#/repartidor') ||
        hash.startsWith('#/ingeniero') ||
        Boolean(savedRole)
      ) {
        if (savedRole) {
          setLoginRole(savedRole);
          if (savedName) setLoginUserName(savedName);
          setCurrentView('dashboard');
          document.body.style.overflow = '';
        } else {
          // Intentar verificar cookie del servidor si localStorage no tiene savedRole
          fetch('/api/auth/me')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data && data.user) {
                setLoginRole(data.user.role);
                setLoginUserName(data.user.name || data.user.email);
                localStorage.setItem('lf-session-role', data.user.role);
                localStorage.setItem('lf-session-name', data.user.name || data.user.email);
                setCurrentView('dashboard');
                document.body.style.overflow = '';
              } else {
                setCurrentView('landing');
                document.body.style.overflow = '';
              }
            })
            .catch(() => {
              setCurrentView('landing');
              document.body.style.overflow = '';
            });
        }
      } else {
        setCurrentView('landing');
        document.body.style.overflow = '';
      }
    };

    // Initial check on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const tema = useConfigStore((s) => s.tema);
  const isDark =
    mounted && (
      tema === 'dark' ||
      (tema === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

  /* ─── Toasts (solo sileo) ─── */
  const addToast = useCallback((title: string, desc: string, variant: ToastVariant = 'success') => {
    const msg = desc ? `${title}: ${desc}` : title;
    if (variant === 'success') {
      sileo.success({ title, description: desc || undefined });
    } else if (variant === 'error') {
      sileo.error({ title, description: desc || undefined });
    } else if (variant === 'warning') {
      sileo.warning({ title, description: desc || undefined });
    } else {
      sileo.info({ title, description: desc || undefined });
    }
  }, []);

  /* ─── Apply theme ─── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    aplicarTema(tema);
  }, [tema]);

  const toggleTheme = useCallback((event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }) => {
    toggleThemeWithTransition(event);
  }, []);

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
  const navigateTo = useCallback((view: 'landing' | 'login' | 'register') => {
    setViewTransition('exit');
    setTimeout(() => {
      if (view === 'login') {
        window.location.hash = '#/login';
      } else if (view === 'register') {
        window.location.hash = '#/register';
      } else {
        window.location.hash = '#/';
      }
      setViewTransition('enter');
      setTimeout(() => setViewTransition(null), 300);
    }, 300);
  }, []);
  const switchAuth = useCallback((mode: 'login' | 'register') => {
    if (mode === 'login') {
      window.location.hash = '#/login';
    } else {
      window.location.hash = '#/register';
    }
    setLoginErrors({});
    setRegErrors({});
  }, []);

  /* ─── Validation ─── */
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ─── Login ─── */
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!loginEmail) errors.email = 'El correo es obligatorio';
    else if (!isValidEmail(loginEmail)) errors.email = 'Ingresa un correo válido';
    if (!loginPassword) errors.password = 'La contraseña es obligatoria';
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        addToast('Error', data.error || 'Correo o contraseña incorrectos', 'error');
        setLoginLoading(false);
        return;
      }

      const role = data.user.role;
      const name = data.user.name;
      setLoginRole(role);
      setLoginUserName(name);

      if (typeof window !== 'undefined') {
        localStorage.setItem('lf-session-view', 'dashboard');
        localStorage.setItem('lf-session-role', role);
        localStorage.setItem('lf-session-name', name);
      }
      document.body.style.overflow = '';
      setLoginLoading(false);
      addToast(`Bienvenido, ${name}`, 'Ingresando al sistema...', 'success');
      setCurrentView('dashboard');
      window.location.hash = '#/dashboard';
    } catch (err) {
      console.error('[LOGIN]', err);
      addToast('Error', 'No se pudo conectar con el servidor', 'error');
      setLoginLoading(false);
    }
  }, [loginEmail, loginPassword, addToast]);

  /* ─── Demo quick login ─── */
  const handleDemoLogin = useCallback(async (role: string) => {
    const cred = demoCredentials[role];
    if (!cred) return;
    setLoginEmail(cred.email);
    setLoginPassword(cred.password);
    setLoginErrors({});
    setLoginRole(role);
    setLoginUserName(cred.name);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cred.email, password: cred.password }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        addToast('Error', data.error || 'No se pudo iniciar sesión demo', 'error');
        setLoginLoading(false);
        return;
      }

      const name = data.user.name;
      const userRole = data.user.role || role;
      setLoginRole(userRole);
      setLoginUserName(name);

      if (typeof window !== 'undefined') {
        localStorage.setItem('lf-session-view', 'dashboard');
        localStorage.setItem('lf-session-role', userRole);
        localStorage.setItem('lf-session-name', name);
      }
      document.body.style.overflow = '';
      setLoginLoading(false);
      addToast(`Bienvenido, ${name}`, 'Ingresando al sistema...', 'success');
      setCurrentView('dashboard');
      window.location.hash = '#/dashboard';
    } catch (err) {
      console.error('[DEMO_LOGIN]', err);
      addToast('Error', 'No se pudo conectar con el servidor', 'error');
      setLoginLoading(false);
    }
  }, [addToast]);

  /* ─── Register Step 1 Validate ─── */
  const handleRegStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.name = 'El nombre es obligatorio';
    if (!regEmail) errors.email = 'El correo es obligatorio';
    else if (!isValidEmail(regEmail)) errors.email = 'Ingresa un correo válido';
    if (!regPassword) errors.password = 'La contraseña es obligatoria';
    else if (regPassword.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (!regConfirm) errors.confirm = 'Confirma tu contraseña';
    else if (regPassword !== regConfirm) errors.confirm = 'Las contraseñas no coinciden';
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setRegStep(2);
  };

  /* ─── Register Final Submit ─── */
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!regRole) errors.role = 'Selecciona un tipo de cuenta';
    if (!regTerms) errors.terms = 'Debes aceptar los términos';
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setRegLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole === 'cliente' || regRole === 'repartidor' ? regRole : 'cliente',
          telefono: regTelefono || undefined,
          municipio: regMunicipio || undefined,
          ...(regRole === 'repartidor' ? {
            vehiculoTipo: regVehiculoTipo || undefined,
            vehiculoMarca: regVehiculoMarca || undefined,
            vehiculoModelo: regVehiculoModelo || undefined,
            vehiculoAnio: regVehiculoAnio ? Number(regVehiculoAnio) : undefined,
            vehiculoColor: regVehiculoColor || undefined,
            vehiculoPlaca: regVehiculoPlaca || undefined,
          } : {}),
        }),
      });
      const data = await res.json();
      setRegLoading(false);

      if (!res.ok || !data.ok) {
        addToast('Error', data.error || 'No se pudo registrar la cuenta', 'error');
        return;
      }
      const user = data.user;
      setLoginRole(user.role);
      setLoginUserName(user.name);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lf-session-view', 'dashboard');
        localStorage.setItem('lf-session-role', user.role);
        localStorage.setItem('lf-session-name', user.name);
      }
      document.body.style.overflow = '';
      addToast(`¡Bienvenido, ${user.name}!`, 'Cuenta creada con éxito', 'success');
      setCurrentView('dashboard');
      window.location.hash = '#/dashboard';
    } catch (err) {
      console.error('[REGISTER]', err);
      setRegLoading(false);
      addToast('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }, [regName, regEmail, regPassword, regRole, regTerms, regTelefono, regMunicipio, regVehiculoTipo, regVehiculoMarca, regVehiculoModelo, regVehiculoAnio, regVehiculoColor, regVehiculoPlaca, addToast]);

  /* ─── Logout ─── */
  const handleLogout = useCallback(async () => {
    setLoginEmail('');
    setLoginPassword('');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('[LOGOUT]', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lf-session-view');
      localStorage.removeItem('lf-session-role');
      localStorage.removeItem('lf-session-name');
      window.location.hash = '#/';
    }
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

  /* ═══════════════════════════════════════════════════════
     DASHBOARD VIEW DIRECT
     ═══════════════════════════════════════════════════════ */

  // Si está en landing/login/register → usar el nuevo AuthRedesign
  if (currentView === 'landing' || currentView === 'login' || currentView === 'register') {
    return (
      <AuthRedesign
        currentView={currentView}
        onLoginSuccess={(role, name) => {
          setLoginRole(role);
          setLoginUserName(name);
          if (typeof window !== 'undefined') {
            localStorage.setItem('lf-session-view', 'dashboard');
            localStorage.setItem('lf-session-role', role);
            localStorage.setItem('lf-session-name', name);
            window.location.hash = '#/dashboard';
          }
          setCurrentView('dashboard');
        }}
      />
    );
  }

  if (currentView === 'dashboard') {
    return (
      <DashboardErrorBoundary onGoHome={() => setCurrentView('landing')}>
        {loginRole === 'cliente' && (
          <ClientDashboard isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} userName={loginUserName} />
        )}
        {loginRole === 'repartidor' && (
          <RepartidorApp isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} />
        )}
        {loginRole === 'ingeniero' && (
          <IngenieroApp isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} userName={loginUserName} />
        )}
        {loginRole === 'tienda' && (
          <TiendaApp isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} userName={loginUserName} />
        )}
        {loginRole !== 'cliente' && loginRole !== 'repartidor' && loginRole !== 'ingeniero' && loginRole !== 'tienda' && (
          <Dashboard isDark={isDark} toggleTheme={toggleTheme} onLogout={handleLogout} />
        )}
      </DashboardErrorBoundary>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Radical Custom Styling for Floating Center Pill Navbar */
        .floating-pill-nav {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 900px;
          height: 64px;
          background: rgba(10, 11, 16, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          z-index: 1000;
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .floating-pill-nav.scrolled {
          top: 10px;
          height: 56px;
          background: rgba(6, 7, 10, 0.85);
          border-color: rgba(0, 102, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 102, 255, 0.1);
        }

        /* Responsive menu overrides for pill navbar */
        .pill-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
          list-style: none;
        }
        @media (max-width: 768px) {
          .pill-nav-links {
            display: none;
          }
        }

        /* High Tech Glow Background for Forms */
        .obsidian-input {
          background: transparent !important;
          border: none !important;
          border-bottom: 2px solid rgba(255,255,255,0.1) !important;
          border-radius: 0px !important;
          padding: 12px 12px 12px 36px !important;
          color: #FFFFFF !important;
          font-size: 16px !important; /* Prevents iOS auto-zoom */
          transition: all 0.3s ease !important;
        }
        .obsidian-input:focus {
          border-bottom-color: #0066FF !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .obsidian-input::placeholder {
          color: #555866 !important;
        }

        /* Minimalist auth labels */
        .obsidian-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        /* Dynamic keypads demo */
        .keypad-demo-btn {
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.01);
          border-radius: 16px;
          padding: 12px;
          text-align: left;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .keypad-demo-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          transform: translateY(-2px);
        }

        /* Theme variables fallback for landing page wrapper */
        .obsidian-landing {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }
      ` }} />

      {/* ═══════════════════════════════════════════════════════
         AUTH VIEWS (Radical Minimalist Full-Bleed OVERHAUL)
         ═══════════════════════════════════════════════════════ */}
      {(currentView === 'login' || currentView === 'register') && (
        <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden w-full font-sans">
          
          {/* Neon digital grid wireframe background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0E0F19_1px,transparent_1px),linear-gradient(to_bottom,#0E0F19_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.25] pointer-events-none" />
          
          {/* Animated color spot lights */}
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-[#0066FF]/8 blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-[#00C853]/4 blur-[130px] pointer-events-none" />

          {/* Centered Main Dashboard Board */}
          <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column (Huge Typography & HUD) - 5 cols */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
              <div className="cursor-pointer inline-flex justify-center lg:justify-start w-full lg:w-auto" onClick={() => navigateTo('landing')}>
                <Logo large />
              </div>
              
              <div className="hidden lg:block">
                <h1 className="font-syne text-4xl sm:text-5xl font-black text-white leading-none tracking-tighter uppercase mb-4">
                  {currentView === 'login' ? "Conexión de Flota" : "Registro de Operaciones"}
                </h1>
                <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                  {currentView === 'login' 
                    ? "Inicia sesión en la consola integrada. Gestiona envíos, monitorea rutas satelitales y coordina repuestos." 
                    : "Regístrate de forma segura y enlaza tu perfil de usuario al nodo logístico central."
                  }
                </p>
              </div>

              {/* Dynamic Workspace HUD Display */}
              <div className="hidden lg:flex flex-col gap-4 border border-white/10 rounded-2xl p-6 bg-white/[0.01] backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.06),transparent_70%)] pointer-events-none" />
                <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                  <span>TELEMETRY_LOG</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
                    ACTIVO
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {currentView === 'login' && (
                    <motion.div
                      key={`hud-features-${hoveredRole || loginRole}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3"
                    >
                      {(() => {
                        const activeRoleToShow = hoveredRole || loginRole;
                        const roleFeatures = getRoleFeatures(activeRoleToShow);
                        if (!roleFeatures) return null;
                        return (
                          <>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{roleFeatures.title}</span>
                            <p className="text-[11px] text-gray-400 leading-relaxed">{roleFeatures.desc}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-xl font-mono font-black text-[#0066FF]">{roleFeatures.kpiVal}</span>
                              <span className="text-[8.5px] text-gray-500 font-mono">{roleFeatures.kpiLabel}</span>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}

                  {currentView === 'register' && (
                    <motion.div
                      key={`hud-strengths-${regRole}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3"
                    >
                      {(() => {
                        const puntos = getRolePuntosFuertes(regRole);
                        return (
                          <>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Beneficios del Rol</span>
                            <ul className="flex flex-col gap-1.5">
                              {puntos.slice(0, 2).map((punto, i) => (
                                <li key={i} className="text-[11px] text-gray-400 flex items-start gap-2">
                                  <span className="text-[#00C853] font-bold">✓</span>
                                  <span>{punto}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column (Borderless Glass Form Panel) - 7 cols */}
            <div className="lg:col-span-7 bg-[var(--surface)]/90 border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-[var(--shadow-lg)] backdrop-blur-2xl">
              
              {/* Tab switching */}
              <div className="flex justify-between items-center border-b border-white/5 pb-5 mb-8">
                <div className="flex gap-4">
                  <button 
                    onClick={() => switchAuth('login')} 
                    className={`font-syne text-sm font-black uppercase tracking-wider pb-2 border-b-2 transition-all ${
                      currentView === 'login' ? 'border-[#0066FF] text-[var(--text)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button 
                    onClick={() => switchAuth('register')} 
                    className={`font-syne text-sm font-black uppercase tracking-wider pb-2 border-b-2 transition-all ${
                      currentView === 'register' ? 'border-[#0066FF] text-[var(--text)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    Crear Cuenta
                  </button>
                </div>
                
                {regStep === 2 && currentView === 'register' && (
                  <span className="text-[10px] font-mono text-gray-500">PASO 2 DE 2</span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {/* LOGIN PANEL */}
                {currentView === 'login' && (
                  <motion.div
                    key="login-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <form onSubmit={handleLogin} noValidate className="flex flex-col gap-5">
                      {/* Email input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="obsidian-label">Usuario / Correo</label>
                        <div className="relative group">
                          <input
                            type="email"
                            className="obsidian-input w-full transition-all focus:border-[#FF5722] focus:shadow-[0_0_0_3px_rgba(255,87,34,0.15)]"
                            placeholder="nombre@empresa.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            autoComplete="email"
                          />
                          <span className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-[#FF5722] transition-colors"><IconEnvelope /></span>
                        </div>
                        {loginErrors.email && <span className="text-[10px] text-error font-medium flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {loginErrors.email}
                        </span>}
                      </div>

                      {/* Password input */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <label className="obsidian-label">Contraseña</label>
                          <button type="button" className="text-[11px] text-[#FF5722] font-bold hover:underline transition-colors">
                            ¿Olvidaste la clave?
                          </button>
                        </div>
                        <div className="relative group">
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            className="obsidian-input w-full transition-all focus:border-[#FF5722] focus:shadow-[0_0_0_3px_rgba(255,87,34,0.15)]"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            autoComplete="current-password"
                          />
                          <span className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-[#FF5722] transition-colors"><IconLock /></span>
                          <button
                            type="button"
                            className="absolute right-3 top-3.5 text-gray-500 hover:text-[#FF5722] transition-colors p-1 rounded-md hover:bg-white/5"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            aria-label={showLoginPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showLoginPassword ? <IconEyeOff /> : <IconEye />}
                          </button>
                        </div>
                        {loginErrors.password && <span className="text-[10px] text-error font-medium flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {loginErrors.password}
                        </span>}
                      </div>

                      {/* Recordarme + estado */}
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors">
                          <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded border-gray-600 bg-transparent accent-[#FF5722]" />
                          <span>Mantener sesión activa</span>
                        </label>
                        <span className="text-gray-500 text-[10px]">🔒 Conexión segura</span>
                      </div>

                      <button type="submit" className="apple-btn-filled justify-center w-full mt-3 py-3.5 text-sm font-bold bg-gradient-to-r from-[#FF5722] to-[#FF8A65] shadow-lg shadow-[#FF5722]/30 hover:shadow-[#FF5722]/50 hover:-translate-y-0.5 transition-all" disabled={loginLoading}>
                        {loginLoading ? <MiniSpinner size={18} color="white" /> : 'Acceder al Sistema'}
                      </button>
                    </form>

                    {/* Quick Demo Access Grid */}
                    <div className="relative flex py-6 items-center">
                      <div className="flex-grow border-t border-white/5"></div>
                      <span className="flex-shrink mx-3 text-[8px] text-gray-500 font-mono tracking-widest uppercase">ACCESO DEMOSTRATIVO RÁPIDO</span>
                      <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { role: 'cliente', label: 'Cliente B2B', borderStyle: 'hover:border-[#00C853]/30', colorClass: 'text-[#00C853]' },
                        { role: 'repartidor', label: 'Rider GPS', borderStyle: 'hover:border-orange-500/30', colorClass: 'text-orange-500' },
                        { role: 'admin', label: 'Admin Hub', borderStyle: 'hover:border-[#0066FF]/30', colorClass: 'text-[#0066FF]' },
                        { role: 'ingeniero', label: 'Mecánico', borderStyle: 'hover:border-purple-500/30', colorClass: 'text-purple-500' }
                      ].map((item) => {
                        const isActive = loginRole === item.role;
                        return (
                          <button
                            key={item.role}
                            type="button"
                            className={`keypad-demo-btn border ${
                              isActive 
                                ? 'bg-[var(--primario-soft)] border-[#0066FF] text-[var(--text)]' 
                                : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)]'
                            } ${item.borderStyle}`}
                            onClick={() => handleDemoLogin(item.role)}
                            onMouseEnter={() => setHoveredRole(item.role)}
                            onMouseLeave={() => setHoveredRole(null)}
                          >
                            <span className="text-[11px] font-bold leading-tight">{item.label}</span>
                            <span className={`text-[8.5px] font-mono tracking-wider ${isActive ? 'text-success font-bold' : item.colorClass}`}>
                              {isActive ? '● CONECTADO' : 'INICIAR DEMO'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* REGISTER STEP 1 */}
                {currentView === 'register' && regStep === 1 && (
                  <motion.div
                    key="register-step-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <form onSubmit={handleRegStep1} noValidate className="flex flex-col gap-5">
                      {/* Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="obsidian-label">Nombre completo</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            className="obsidian-input w-full"
                            placeholder="Tu nombre y apellido"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                          />
                          <span className="absolute left-1 top-3.5 text-gray-500"><IconUser /></span>
                        </div>
                        {displayRegErrors.name && <span className="text-[10px] text-error font-medium">{displayRegErrors.name}</span>}
                      </div>

                      {/* Email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="obsidian-label">Correo electrónico</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            className="obsidian-input w-full"
                            placeholder="nombre@empresa.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                          />
                          <span className="absolute left-1 top-3.5 text-gray-500"><IconEnvelope /></span>
                        </div>
                        {displayRegErrors.email && <span className="text-[10px] text-error font-medium">{displayRegErrors.email}</span>}
                      </div>

                      {/* Teléfono + Municipio */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="obsidian-label">Teléfono</label>
                          <input
                            type="tel"
                            className="obsidian-input w-full"
                            placeholder="8888-1234"
                            value={regTelefono}
                            onChange={(e) => setRegTelefono(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="obsidian-label">Municipio</label>
                          <select
                            className="obsidian-input w-full"
                            value={regMunicipio}
                            onChange={(e) => setRegMunicipio(e.target.value)}
                          >
                            {['Managua','Masaya','Granada','León','Chinandega','Matagalpa','Estelí','Jinotega','Rivas','Juigalpa','Bluefields','Puerto Cabezas'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col gap-1.5">
                        <label className="obsidian-label">Contraseña</label>
                        <div className="relative">
                          <input 
                            type={showRegPassword ? 'text' : 'password'}
                            className="obsidian-input w-full"
                            placeholder="Mínimo 6 caracteres"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                          />
                          <span className="absolute left-1 top-3.5 text-gray-500"><IconLock /></span>
                          <button 
                            type="button" 
                            className="absolute right-2 top-3.5 text-gray-500 hover:text-white"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                          >
                            {showRegPassword ? <IconEyeOff /> : <IconEye />}
                          </button>
                        </div>
                        {displayRegErrors.password && <span className="text-[10px] text-error font-medium">{displayRegErrors.password}</span>}
                      </div>

                      {/* Confirm Password */}
                      <div className="flex flex-col gap-1.5">
                        <label className="obsidian-label">Confirmar Contraseña</label>
                        <div className="relative">
                          <input 
                            type="password" 
                            className="obsidian-input w-full"
                            placeholder="Repita la contraseña"
                            value={regConfirm}
                            onChange={(e) => setRegConfirm(e.target.value)}
                          />
                          <span className="absolute left-1 top-3.5 text-gray-500"><IconLock /></span>
                        </div>
                        {displayRegErrors.confirm && <span className="text-[10px] text-error font-medium">{displayRegErrors.confirm}</span>}
                      </div>

                      <button type="submit" className="apple-btn-filled justify-center w-full mt-4 py-3.5 text-sm font-bold bg-[#0066FF]">
                        Continuar al Paso 2
                        <IconArrowRight />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* REGISTER STEP 2 */}
                {currentView === 'register' && regStep === 2 && !regSuccess && (
                  <motion.div
                    key="register-step-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <form onSubmit={handleRegister} noValidate className="flex flex-col gap-6">
                      {/* Role selector con cards visuales */}
                      <div className="flex flex-col gap-3">
                        <label className="obsidian-label">¿Cómo quieres usar LOGIFAST?</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              value: 'cliente',
                              label: 'Cliente',
                              desc: 'Pedir envíos y comprar',
                              icon: (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              ),
                              color: '#FF5722',
                            },
                            {
                              value: 'repartidor',
                              label: 'Repartidor',
                              desc: 'Ganar entregando',
                              icon: (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="5.5" cy="17.5" r="3.5"/>
                                  <circle cx="18.5" cy="17.5" r="3.5"/>
                                  <path d="M15 6h2l3 3M5.5 14L9 6h4l-2 8"/>
                                </svg>
                              ),
                              color: '#4CAF50',
                            },
                          ].map((roleOption) => {
                            const isActive = regRole === roleOption.value;
                            return (
                              <button
                                key={roleOption.value}
                                type="button"
                                className={`group relative flex flex-col items-start gap-2 p-4 text-left border-2 rounded-2xl transition-all overflow-hidden ${
                                  isActive
                                    ? 'border-transparent text-white shadow-lg'
                                    : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/5'
                                }`}
                                style={isActive ? { background: `linear-gradient(135deg, ${roleOption.color}, ${roleOption.color}cc)`, boxShadow: `0 8px 24px ${roleOption.color}40` } : {}}
                                onClick={() => setRegRole(roleOption.value)}
                              >
                                <span
                                  className={`p-2 rounded-xl transition-all ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 group-hover:scale-110'}`}
                                  style={!isActive ? { color: roleOption.color } : {}}
                                >
                                  {roleOption.icon}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold leading-tight">{roleOption.label}</span>
                                  <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{roleOption.desc}</span>
                                </div>
                                {isActive && (
                                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          ¿Administrador o Mecánico? Estos roles requieren invitación del equipo LOGIFAST.
                        </p>
                      </div>

                      {/* Vehicle info for repartidores */}
                      {regRole === 'repartidor' && (
                        <div className="flex flex-col gap-3 border border-[var(--border)] rounded-2xl p-4">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tu vehículo</p>
                          {/* Tipo */}
                          <div className="grid grid-cols-3 gap-2">
                            {['moto','bicicleta','auto'].map(tipo => (
                              <button key={tipo} type="button"
                                className={`py-2 px-3 rounded-xl border text-[11px] font-bold capitalize transition-all ${
                                  regVehiculoTipo === tipo
                                    ? 'border-[#4CAF50] bg-[#4CAF50]/10 text-[#4CAF50]'
                                    : 'border-[var(--border)] text-gray-500 hover:border-white/20'
                                }`}
                                onClick={() => setRegVehiculoTipo(tipo)}
                              >{tipo}</button>
                            ))}
                          </div>
                          {regVehiculoTipo === 'moto' && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="obsidian-label">Marca</label>
                                  <select className="obsidian-input w-full" value={regVehiculoMarca} onChange={e => setRegVehiculoMarca(e.target.value)}>
                                    <option value="">Selecciona</option>
                                    {['Honda','Yamaha','Suzuki','TVS','Bajaj','KTM','Italika','Royal Enfield'].map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="obsidian-label">Modelo</label>
                                  <input className="obsidian-input w-full" placeholder="Wave 110, Nmax..." value={regVehiculoModelo} onChange={e => setRegVehiculoModelo(e.target.value)} />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="obsidian-label">Año</label>
                                  <input type="number" className="obsidian-input w-full" placeholder="2022" min="2000" max="2030" value={regVehiculoAnio} onChange={e => setRegVehiculoAnio(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="obsidian-label">Color</label>
                                  <input className="obsidian-input w-full" placeholder="Rojo" value={regVehiculoColor} onChange={e => setRegVehiculoColor(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="obsidian-label">Placa</label>
                                  <input className="obsidian-input w-full" placeholder="M-12345" value={regVehiculoPlaca} onChange={e => setRegVehiculoPlaca(e.target.value.toUpperCase())} />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Terms */}
                      <div className="flex items-start gap-3 bg-transparent border border-[var(--border)] p-4 rounded-2xl">
                        <input 
                          type="checkbox" 
                          id="regTerms"
                          className="checkbox checkbox-xs checkbox-primary mt-0.5 border-[var(--border)] bg-transparent"
                          checked={regTerms}
                          onChange={(e) => setRegTerms(e.target.checked)}
                        />
                        <label htmlFor="regTerms" className="text-[10.5px] text-gray-500 leading-normal">
                          Acepto las normativas y los términos de uso de la red operativa de LOGIFAST Managua.
                        </label>
                      </div>
                      {displayRegErrors.terms && <span className="text-[10px] text-error font-medium block">{displayRegErrors.terms}</span>}

                      {/* Control buttons */}
                      <div className="flex gap-3">
                        <button type="button" className="apple-btn-border flex-1 justify-center py-3.5" onClick={() => setRegStep(1)}>
                          Atrás
                        </button>
                        <button type="submit" className="apple-btn-filled flex-1 justify-center py-3.5 bg-gradient-to-r from-[#FF5722] to-[#FF8A65] shadow-lg shadow-[#FF5722]/30 hover:shadow-[#FF5722]/50 hover:-translate-y-0.5 transition-all" disabled={regLoading}>
                          {regLoading ? <MiniSpinner size={18} color="white" /> : 'Crear mi cuenta'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        </div>
      )}

      {/* REGISTER SUCCESS PANEL */}
      {currentView === 'register' && regSuccess && (
        <div className="relative flex flex-col justify-center items-center min-h-screen bg-[#030305] p-4 sm:p-6" style={{ minHeight: '100vh' }}>
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#00C853]/5 blur-[120px] pointer-events-none" />
          <div className="z-10 w-full max-w-md bg-[#0B0C11]/95 border border-emerald-500/20 rounded-3xl p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="bg-success/15 text-success w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(0,200,83,0.2)]">
              <IconCheckLg />
            </div>
            <h2 className="font-syne text-xl font-extrabold mb-1.5 text-white">Registro Completado</h2>
            <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto">Tu cuenta en la red operativa de flotas de LOGIFAST ha sido creada con éxito.</p>
            <button className="apple-btn-filled justify-center w-full" onClick={() => { setRegSuccess(false); switchAuth('login'); }}>
              Ingresar a la Consola
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         REDESIGNED LANDING PAGE (Luxury Obsidian Design)
         ═══════════════════════════════════════════════════════ */}
      {currentView === 'landing' && (
        <div className="obsidian-landing">
          <div className="ud-grid-background" />

          {/* ─── FLOATING CENTER PILL NAVBAR ─── */}
          <nav className={`floating-pill-nav ${navScrolled ? 'scrolled' : ''}`}>
            <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

            <ul className="pill-nav-links">
              <li><a href="#features" className="apple-nav-link">Características</a></li>
              <li><a href="#calculator" className="apple-nav-link">Tarifador</a></li>
              <li><a href="#how-it-works" className="apple-nav-link">Proceso</a></li>
              <li><a href="#allies" className="apple-nav-link">Aliados</a></li>
            </ul>

            <div className="flex items-center gap-3">
              <ThemeToggleButton isDark={isDark} size="sm" variant="circle" />

              <button className="apple-nav-btn-secondary text-white hidden sm:inline-flex" onClick={() => navigateTo('login')}>
                Ingresar
              </button>
              <button className="apple-nav-btn-primary hidden sm:inline-flex" style={{ background: '#0066FF', color: '#FFFFFF' }} onClick={() => navigateTo('register')}>
                Comenzar
              </button>

              {/* Mobile Hamburger */}
              <button 
                className="btn btn-circle btn-ghost btn-sm text-white lp-hamburger"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </nav>

          {/* Mobile menu drawer */}
          <Transition
            show={mobileMenuOpen}
            enter="transition-all duration-300 ease-out"
            enterFrom="opacity-0 translate-x-1/2"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-200 ease-in"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 translate-x-1/2"
          >
            <div className="apple-drawer-menu" style={{ background: 'var(--bg)' }}>
              <div>
                <div className="flex justify-between items-center">
                  <Logo onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                  <button className="btn btn-circle btn-ghost text-[var(--text)]" onClick={() => setMobileMenuOpen(false)}>
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
                <button className="apple-btn-border w-full py-3.5 text-[var(--text)]" onClick={() => { setMobileMenuOpen(false); navigateTo('login'); }}>
                  Ingresar
                </button>
                <button className="apple-btn-filled w-full py-3.5 justify-center bg-[#0066FF]" onClick={() => { setMobileMenuOpen(false); navigateTo('register'); }}>
                  Comenzar
                </button>
              </div>
            </div>
          </Transition>

          {/* ─── HERO SECTION ─── */}
          <section className="apple-hero-section relative">
            {/* Background blobs animados */}
            <div className="lf-landing-hero-bg">
              <div className="lf-landing-blob b1" />
              <div className="lf-landing-blob b2" />
              <div className="lf-landing-blob b3" />
            </div>

            <div className="relative z-10">
              <div className="apple-hero-badge" style={{ background: 'rgba(255,87,34,0.1)', color: '#FF5722', borderColor: 'rgba(255,87,34,0.2)' }}>
                <span className="w-2.5 h-2.5 bg-[#FF5722] rounded-full animate-pulse" />
                Red Inteligente de Distribución Express
              </div>

              <h1 className="apple-hero-title font-syne text-[var(--text)]">
                Envía, recibe y rastrea. <br />
                <span className="bg-gradient-to-r from-[#FF5722] via-[#FF8A65] to-[#FFB74D] bg-clip-text text-transparent">En minutos, no en horas.</span>
              </h1>

              <p className="apple-hero-subtitle text-gray-400">
                Conecta tu negocio a una consola inteligente de despachos en Managua. Optimiza hojas de ruta, automatiza tu facturación y controla el estado de tu taller preventivo en vivo.
              </p>

              <div className="apple-hero-actions">
                <button
                  className="lf-landing-btn-primary inline-flex items-center gap-2"
                  onClick={() => navigateTo('register')}
                >
                  Comenzar gratis
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
                <button
                  className="lf-landing-btn-secondary"
                  onClick={() => navigateTo('login')}
                >
                  Ver demo
                </button>
              </div>

              {/* Ilustración de moto repartidor */}
              <div className="flex justify-center my-12">
                <DeliveryMotoIllustration size={280} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 my-12 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="lf-landing-stat-num">2.5k+</div>
                  <div className="text-xs text-gray-500 mt-1">Envíos completados</div>
                </div>
                <div className="text-center">
                  <div className="lf-landing-stat-num">15min</div>
                  <div className="text-xs text-gray-500 mt-1">Tiempo promedio</div>
                </div>
                <div className="text-center">
                  <div className="lf-landing-stat-num">4.9★</div>
                  <div className="text-xs text-gray-500 mt-1">Calificación</div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── SECTION: CÓMO FUNCIONA ─── */}
          <section className="apple-section border-t border-[var(--border)]">
            <div className="apple-section-header">
              <span className="apple-section-tag" style={{ color: '#FF5722' }}>Cómo funciona</span>
              <h2 className="apple-section-title font-syne text-[var(--text)]">
                Tres pasos. Cero complicaciones.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="lf-landing-feature-card text-center">
                <div className="flex justify-center mb-4">
                  <ReceivePackageIllustration size={140} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">1. Solicita</h3>
                <p className="text-sm text-gray-400">Pide un envío o compra productos del marketplace en segundos.</p>
              </div>
              <div className="lf-landing-feature-card text-center">
                <div className="flex justify-center mb-4">
                  <MapIllustration size={140} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">2. Rastrea</h3>
                <p className="text-sm text-gray-400">Sigue al repartidor en tiempo real, chatea y recibe notificaciones.</p>
              </div>
              <div className="lf-landing-feature-card text-center">
                <div className="flex justify-center mb-4">
                  <SecurePackageIllustration size={140} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">3. Recibe</h3>
                <p className="text-sm text-gray-400">Tu paquete llega seguro. Califica al repartidor y repite.</p>
              </div>
            </div>
          </section>

            {/* Premium Mockup Widget */}
          <section className="apple-section border-t border-[var(--border)]">
            <div className="apple-section-header">
              <span className="apple-section-tag" style={{ color: '#FF5722' }}>Consola en vivo</span>
              <h2 className="apple-section-title font-syne text-[var(--text)]">
                Rastreo GPS satelital en tiempo real
              </h2>
              <p className="text-sm text-gray-400 max-w-xl">
                Visualiza tu flota activa, monitorea-position y recibe alertas instantáneas desde una sola pantalla.
              </p>
            </div>
            <div className="apple-mockup-frame border-[var(--border)] shadow-2xl">
              <div className="apple-mockup-screen flex flex-col justify-between p-5 bg-[var(--bg-alt)]">
                <div className="flex justify-between items-center text-[var(--text)]/90">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full animate-ping" />
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
          <section className="apple-section border-t border-[var(--border)]" id="features">
            <div className="apple-section-header">
              <span className="apple-section-tag" style={{ color: '#0066FF' }}>Roles & Herramientas</span>
              <h2 className="apple-section-title font-syne text-[var(--text)]">
                Una sola plataforma para cuatro perfiles operativos
              </h2>
            </div>

            <div className="apple-bento-grid">
              
              {/* Client Card */}
              <div className="apple-bento-card bg-[var(--surface)] border border-[var(--border)] hover:border-[#00C853]/30">
                <div className="apple-bento-icon" style={{ background: 'rgba(0,200,83,0.1)', color: '#00C853' }}>
                  <IconPerson />
                </div>
                <h3 className="apple-bento-title text-[var(--text)]">Portal de Clientes</h3>
                <p className="apple-bento-desc text-gray-400">
                  Solicita envíos express, cotiza tarifas dinámicas según distancia y volumen, y mantén un registro de facturas automatizado.
                </p>
                <div className="mt-auto pt-2">
                  <span className="text-[9px] font-bold text-[#00C853] bg-[#00C853]/10 px-2 py-0.5 rounded-full">Monitoreo en vivo</span>
                </div>
              </div>

              {/* Rider Card */}
              <div className="apple-bento-card bg-[var(--surface)] border border-[var(--border)] hover:border-[#0066FF]/30">
                <div className="apple-bento-icon" style={{ background: 'rgba(0,102,255,0.1)', color: '#0066FF' }}>
                  <IconMoto />
                </div>
                <h3 className="apple-bento-title text-[var(--text)]">Panel de Repartidores</h3>
                <p className="apple-bento-desc text-gray-400">
                  Asignación automática basada en proximidad GPS, indicaciones paso a paso y control de ganancias en tu billetera digital.
                </p>
                <div className="mt-auto pt-2">
                  <span className="text-[9px] font-bold text-[#0066FF] bg-[#0066FF]/10 px-2 py-0.5 rounded-full">Rutas satelitales</span>
                </div>
              </div>

              {/* Console Control Card */}
              <div className="apple-bento-card bg-[var(--surface)] border-[var(--border)] hover:border-gray-500/30">
                <div className="apple-bento-icon" style={{ background: 'rgba(255,255,255,0.05)', color: '#E2E8F0' }}>
                  <IconShield />
                </div>
                <h3 className="apple-bento-title text-[var(--text)]">Consola de Control</h3>
                <p className="apple-bento-desc text-gray-400">
                  Auditoría completa de entregas, analíticas de rendimiento financiero y herramientas para la resolución de contingencias.
                </p>
                <div className="mt-auto pt-2">
                  <span className="text-[9px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">Auditoría total</span>
                </div>
              </div>

              {/* /Engineers Card */}
              <div className="apple-bento-card col-4 bg-[var(--surface)] border-[var(--border)] hover:border-purple-500/30">
                <div className="apple-bento-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7' }}>
                  <IconWrench />
                </div>
                <h3 className="apple-bento-title text-[var(--text)]">Mantenimiento de Flota</h3>
                <p className="apple-bento-desc text-gray-400">
                  Módulo especializado para ingenieros y mecánicos. Controla el inventario de repuestos críticos, agenda mantenimientos preventivos y asocia hojas de trabajo a las motocicletas del equipo.
                </p>
                <div className="mt-auto pt-2 flex gap-2">
                  <span className="text-[9px] font-bold text-[#A855F7] bg-[#A855F7]/10 px-2.5 py-0.5 rounded-full">Alertas predictivas</span>
                  <span className="text-[9px] font-bold text-[#A855F7] bg-[#A855F7]/10 px-2.5 py-0.5 rounded-full">Ficha mecánica</span>
                </div>
              </div>

            </div>
          </section>

          {/* ─── INTERACTIVE COST CALCULATOR SECTION ─── */}
          <section className="apple-section border-t border-[var(--border)]" id="calculator">
            <div className="apple-section-header">
              <span className="apple-section-tag" style={{ color: '#0066FF' }}>Calculadora</span>
              <h2 className="apple-section-title font-syne text-[var(--text)]">Tarifas transparentes al instante</h2>
            </div>
            
            <div className="apple-calc-card bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-300">Distancia del envío</span>
                    <span className="text-[#0066FF] font-mono font-bold">{distance} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    value={distance} 
                    onChange={(e) => setDistance(parseInt(e.target.value))}
                    className="apple-range"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 mt-1.5">
                    <span>1 km</span>
                    <span>30 km (Límite Managua)</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold mb-2.5 text-gray-300">Peso estimado del paquete</span>
                  <div className="apple-btn-group">
                    {[
                      { value: 'ligero', label: 'Ligero (< 5 kg)' },
                      { value: 'medio', label: 'Medio (5-15 kg)' },
                      { value: 'pesado', label: 'Pesado (> 15 kg)' },
                    ].map((pkg) => (
                      <button
                        key={pkg.value}
                        type="button"
                        className={`apple-select-btn border-white/5 ${weight === pkg.value ? 'active bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]' : 'text-gray-400 bg-white/[0.01]'}`}
                        onClick={() => setWeight(pkg.value)}
                      >
                        {pkg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-5 flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Costo Estimado</span>
                  <span className="text-3xl font-extrabold font-mono text-[#0066FF]">C$ {calculatePrice()}</span>
                  <p className="text-[9.5px] text-gray-500 mt-1.5 text-center max-w-xs">
                    *El precio final puede variar ligeramente según condiciones climáticas excepcionales o congestión vial en tiempo real.
                  </p>
                  <button 
                    onClick={() => navigateTo('register')}
                    className="apple-btn-filled mt-4 w-full max-w-xs justify-center bg-[#0066FF]"
                  >
                    Solicitar envío ahora
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ─── PROCESS STEPS SECTION ─── */}
          <section className="apple-section border-t border-[var(--border)]" id="how-it-works">
            <div className="apple-section-header">
              <span className="apple-section-tag" style={{ color: '#0066FF' }}>Proceso</span>
              <h2 className="apple-section-title font-syne text-[var(--text)]">Cómo opera el sistema</h2>
            </div>
            
            <div className="apple-timeline">
              <div className="apple-timeline-step">
                <span className="apple-timeline-num" style={{ color: '#0066FF' }}>01</span>
                <h4 className="apple-timeline-title text-[var(--text)]">Solicitud</h4>
                <p className="apple-timeline-desc text-gray-400">Establece el origen y destino en el mapa inteligente.</p>
              </div>
              <div className="apple-timeline-step">
                <span className="apple-timeline-num" style={{ color: '#0066FF' }}>02</span>
                <h4 className="apple-timeline-title text-[var(--text)]">Asignación</h4>
                <p className="apple-timeline-desc text-gray-400">El algoritmo selecciona al motorizado óptimo cercano.</p>
              </div>
              <div className="apple-timeline-step">
                <span className="apple-timeline-num" style={{ color: '#0066FF' }}>03</span>
                <h4 className="apple-timeline-title text-[var(--text)]">Rastreo</h4>
                <p className="apple-timeline-desc text-gray-400">Sigue el avance en vivo con notificaciones activas.</p>
              </div>
              <div className="apple-timeline-step">
                <span className="apple-timeline-num" style={{ color: '#0066FF' }}>04</span>
                <h4 className="apple-timeline-title text-[var(--text)]">Entrega</h4>
                <p className="apple-timeline-desc text-gray-400">Tu paquete llega a salvo y calificas el servicio prestado.</p>
              </div>
            </div>
          </section>

          {/* ─── ALLIES LOGO GRID ─── */}
          <section className="apple-section border-t border-[var(--border)]" id="allies">
            <div className="text-center mb-10">
              <span className="apple-section-tag" style={{ color: '#0066FF' }}>Alianzas comerciales</span>
              <h2 className="apple-section-title font-syne text-[var(--text)]">Confían en nuestra red</h2>
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
                <div key={idx} className="apple-partner-logo border-[var(--border)] bg-[var(--surface)]" title={p.name}>
                  <img src={p.src} alt={p.name} className="h-9 object-contain grayscale opacity-60 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </section>

          {/* ─── CTA CONTACT SECTION ─── */}
          <section className="apple-section border-t border-[var(--border)]">
            <div className="apple-cta-card bg-gradient-to-r from-blue-950/20 to-slate-900/20 border border-[#0066FF]/20 shadow-2xl">
              <h2 className="apple-cta-title font-syne text-white">Transforma tus entregas hoy</h2>
              <p className="apple-cta-desc text-gray-400">
                Crea tu cuenta de negocio en minutos y obtén tus primeros envíos urbanos de cortesía en Managua.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button className="apple-btn-filled bg-[#0066FF] text-white hover:bg-[#0052CC]" onClick={() => navigateTo('register')}>
                  Comenzar ahora
                </button>
                <a href="mailto:soporte@logifast.com" className="apple-btn-border border-white/10 text-white hover:bg-white/5 px-8 py-3.5 text-sm font-semibold rounded-full no-underline inline-flex items-center">
                  Contactar soporte
                </a>
              </div>
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="border-t border-white/5 py-12 text-center text-gray-500 text-xs">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <p className="mb-2">Entregas inteligentes, rápidas y seguras en toda la ciudad.</p>
            <p className="text-gray-400">© {new Date().getFullYear()} LOGIFAST. Todos los derechos reservados.</p>
          </footer>
        </div>
      )}

      {/* Los toasts ahora se renderizan exclusivamente con sileo (layout.tsx) */}
    </>
  );
}
