'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  MapPin,
  Package,
  User,
  Bell,
  Bike,
  Clock,
  Navigation,
  Phone,
  MessageSquare,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  UserX,
  MoreHorizontal,
  ChevronUp,
  Star,
  Settings,
  Shield,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Route,
  Timer,
  DollarSign,
  Activity,
  LogOut,
  Sun,
  Moon,
  Hash,
  FileText,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type RepartidorScreen = 'idle' | 'new-order' | 'delivering' | 'history' | 'profile';
type DeliveryStep = 'to-pickup' | 'pick-up' | 'to-deliver' | 'at-delivery' | 'confirm';
type IncidentType = 'mechanical' | 'client-issue' | 'accident' | 'other';

interface MockService {
  id: string;
  origin: string;
  destination: string;
  time: string;
  earnings: string;
  distance: string;
  status: 'completed';
}

/* ═══════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════ */

const MOCK_REPARTIDOR = {
  name: 'Carlos Mendoza',
  initials: 'CM',
  rating: 4.8,
  totalDeliveries: 342,
  moto: 'Honda CB125 2023',
  plate: 'M-4521',
  phone: '+505 8812-3456',
};

const MOCK_COMPLETED_SERVICES: MockService[] = [
  { id: 'LF-1041', origin: 'Banco Central', destination: 'Hotel Princess', time: '09:12', earnings: 'C$85', distance: '4.2 km', status: 'completed' },
  { id: 'LF-1039', origin: 'Farmacia San Jose', destination: 'Col. Centroamerica', time: '08:45', earnings: 'C$65', distance: '3.1 km', status: 'completed' },
  { id: 'LF-1036', origin: 'TecniCompras', destination: 'Altamira', time: '08:20', earnings: 'C$120', distance: '6.8 km', status: 'completed' },
  { id: 'LF-1033', origin: 'Libreria Hispano', destination: 'UCA', time: '07:55', earnings: 'C$55', distance: '2.4 km', status: 'completed' },
  { id: 'LF-1030', origin: 'Supermercado La Union', destination: 'Col. Satelite', time: '07:30', earnings: 'C$95', distance: '5.5 km', status: 'completed' },
];

const MOCK_ORDER = {
  id: 'LF-1052',
  type: 'Paquete',
  origin: 'Metrocentro, Local B-12',
  destination: 'Col. Rubenia, Casa 45',
  distance: '7.2 km',
  estimatedTime: '18 min',
  earnings: 'C$145',
  packageSize: 'Mediano',
  clientName: 'Ana Rodriguez',
  clientPhone: '+505 8899-1122',
  instructions: 'Tocar timbre 2 veces, dejar en porton verde',
};

const TODAY_STATS = {
  deliveries: 5,
  km: 42,
  earnings: 850,
  activeTime: '3h 24m',
};

/* ═══════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════ */

interface RepartidorAppProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
}

/* ═══════════════════════════════════════════════════════
   PULSING RINGS COMPONENT
   ═══════════════════════════════════════════════════════ */

function PulsingRings() {
  return (
    <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 50 + i * 30,
            height: 50 + i * 30,
            borderRadius: '50%',
            border: `2px solid var(--exito)`,
            opacity: 0,
          }}
          animate={{
            scale: [1, 1.5],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
      <motion.div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--exito)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Bike size={28} color="#fff" />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   4-STEP PROGRESS BAR
   ═══════════════════════════════════════════════════════ */

function StepProgressBar({ currentStep }: { currentStep: DeliveryStep }) {
  const steps: { key: DeliveryStep; label: string }[] = [
    { key: 'to-pickup', label: 'Recoger' },
    { key: 'pick-up', label: 'Paquete' },
    { key: 'to-deliver', label: 'Entrega' },
    { key: 'at-delivery', label: 'Confirmar' },
  ];

  const stepOrder: DeliveryStep[] = ['to-pickup', 'pick-up', 'to-deliver', 'at-delivery'];
  const currentIdx = stepOrder.indexOf(currentStep);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
      {steps.map((step, idx) => {
        const isActive = idx <= currentIdx;
        const isCurrent = step.key === currentStep;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: isCurrent ? 28 : 22,
                  height: isCurrent ? 28 : 22,
                  borderRadius: '50%',
                  background: isActive ? 'var(--primario)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent ? '0 0 12px rgba(255,87,34,0.3)' : 'none',
                }}
              >
                {isActive && idx < currentIdx ? (
                  <Check size={12} color="#fff" strokeWidth={3} />
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {idx + 1}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, color: isCurrent ? 'var(--primario)' : 'var(--text-muted)', fontWeight: isCurrent ? 600 : 400, fontFamily: "'DM Sans', sans-serif" }}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: idx < currentIdx ? 'var(--primario)' : 'var(--border)',
                  margin: '0 2px',
                  marginBottom: 18,
                  borderRadius: 1,
                  transition: 'background 0.3s ease',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAP PLACEHOLDER
   ═══════════════════════════════════════════════════════ */

function MapPlaceholder({ variant }: { variant: 'idle' | 'delivering' }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: variant === 'idle'
          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 30%, #a5d6a7 60%, #81c784 100%)'
          : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 30%, #90caf9 60%, #64b5f6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid lines for map feel */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1B1B2F" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Road-like paths */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
        <path d="M 0 200 Q 150 180 300 250 T 600 200 T 900 280" fill="none" stroke="#1B1B2F" strokeWidth="8" strokeLinecap="round" />
        <path d="M 200 0 Q 250 150 180 300 T 280 600" fill="none" stroke="#1B1B2F" strokeWidth="6" strokeLinecap="round" />
        <path d="M 400 0 Q 350 200 450 400 T 380 700" fill="none" stroke="#1B1B2F" strokeWidth="5" strokeLinecap="round" />
      </svg>

      {/* Route markers for delivering */}
      {variant === 'delivering' && (
        <>
          <motion.div
            style={{ position: 'absolute', top: '30%', left: '20%' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--exito)', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
          </motion.div>
          <motion.div
            style={{ position: 'absolute', top: '55%', right: '25%' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primario)', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
          </motion.div>
          {/* Route line */}
          <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
            <path d="M 120 195 Q 250 300 350 350 T 580 390" fill="none" stroke="var(--primario)" strokeWidth="4" strokeDasharray="12 6" opacity="0.7" />
          </svg>
          {/* Current position dot */}
          <motion.div
            style={{ position: 'absolute', top: '38%', left: '35%' }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--info)', border: '3px solid #fff', boxShadow: '0 0 0 6px rgba(41,121,255,0.2), 0 2px 8px rgba(0,0,0,0.2)' }} />
          </motion.div>
        </>
      )}

      {/* Idle: location pin markers */}
      {variant === 'idle' && (
        <>
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--exito)', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
            </motion.div>
          </div>
          {/* Scattered markers */}
          {[
            { top: '25%', left: '30%' },
            { top: '60%', left: '65%' },
            { top: '70%', left: '20%' },
          ].map((pos, i) => (
            <div key={i} style={{ position: 'absolute', top: pos.top, left: pos.left }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)', opacity: 0.3 }} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function RepartidorApp({ isDark, toggleTheme, onLogout }: RepartidorAppProps) {
  /* ─── Screen state ─── */
  const [screen, setScreen] = useState<RepartidorScreen>('idle');
  const [isOnline, setIsOnline] = useState(true);
  const [deliveryStep, setDeliveryStep] = useState<DeliveryStep>('to-pickup');
  const [showIncident, setShowIncident] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentType | null>(null);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);

  /* ─── Timer for new order ─── */
  const [orderTimer, setOrderTimer] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ─── KM counter for delivery ─── */
  const [kmRemaining, setKmRemaining] = useState(7.2);
  const kmRef = useRef<NodeJS.Timeout | null>(null);

  /* ─── Simulate new order arriving after 5 seconds if idle and online ─── */
  const simulateOrderRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (screen === 'idle' && isOnline) {
      simulateOrderRef.current = setTimeout(() => {
        setScreen('new-order');
        setOrderTimer(30);
      }, 6000);
    }
    return () => {
      if (simulateOrderRef.current) clearTimeout(simulateOrderRef.current);
    };
  }, [screen, isOnline]);

  /* ─── Order countdown timer ─── */
  useEffect(() => {
    if (screen === 'new-order') {
      timerRef.current = setInterval(() => {
        setOrderTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setScreen('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen]);

  /* ─── KM countdown during delivery ─── */
  useEffect(() => {
    if (screen === 'delivering') {
      kmRef.current = setInterval(() => {
        setKmRemaining((prev) => {
          if (prev <= 0.1) return 0;
          return Math.round((prev - 0.1) * 10) / 10;
        });
      }, 3000);
    }
    return () => {
      if (kmRef.current) clearInterval(kmRef.current);
    };
  }, [screen]);

  /* KM is reset in handleNextStep when step changes */

  /* ─── Handlers ─── */
  const handleAcceptOrder = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScreen('delivering');
    setDeliveryStep('to-pickup');
    setKmRemaining(7.2);
  }, []);

  const handleRejectOrder = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScreen('idle');
  }, []);

  const handleNextStep = useCallback(() => {
    const steps: DeliveryStep[] = ['to-pickup', 'pick-up', 'to-deliver', 'at-delivery', 'confirm'];
    const idx = steps.indexOf(deliveryStep);
    if (idx < steps.length - 1) {
      const nextStep = steps[idx + 1];
      setDeliveryStep(nextStep);
      if (nextStep === 'to-pickup') setKmRemaining(7.2);
      else if (nextStep === 'to-deliver') setKmRemaining(4.8);
      else if (nextStep === 'at-delivery') setKmRemaining(1.2);
      else if (nextStep === 'confirm') setKmRemaining(0);
    } else {
      setScreen('idle');
      setDeliveryStep('to-pickup');
    }
  }, [deliveryStep]);

  const handleIncidentSubmit = useCallback(() => {
    setShowIncident(false);
    setSelectedIncident(null);
    setIncidentDescription('');
    setScreen('idle');
  }, []);

  const handleToggleOnline = useCallback(() => {
    setIsOnline((prev) => !prev);
    if (!isOnline) {
      setScreen('idle');
    }
  }, [isOnline]);

  /* ─── Step labels and button configs ─── */
  const stepLabels: Record<DeliveryStep, string> = {
    'to-pickup': 'Camino a recoger',
    'pick-up': 'Recoger paquete',
    'to-deliver': 'Iniciar entrega',
    'at-delivery': 'Llegue al punto de entrega',
    'confirm': 'Confirmar entrega',
  };

  const stepButtonLabels: Record<DeliveryStep, string> = {
    'to-pickup': 'Llegue al punto de recogida',
    'pick-up': 'Recoger paquete',
    'to-deliver': 'Iniciar entrega',
    'at-delivery': 'Llegue al punto de entrega',
    'confirm': 'Confirmar entrega',
  };

  const stepButtonColors: Record<DeliveryStep, { bg: string; shadow: string; text: string }> = {
    'to-pickup': { bg: 'var(--primario)', shadow: '0 6px 20px rgba(255,87,34,0.35)', text: '#fff' },
    'pick-up': { bg: 'var(--info)', shadow: '0 6px 20px rgba(41,121,255,0.35)', text: '#fff' },
    'to-deliver': { bg: 'var(--primario)', shadow: '0 6px 20px rgba(255,87,34,0.35)', text: '#fff' },
    'at-delivery': { bg: 'var(--primario)', shadow: '0 6px 20px rgba(255,87,34,0.35)', text: '#fff' },
    'confirm': { bg: 'var(--exito)', shadow: '0 8px 28px rgba(0,200,83,0.4)', text: '#fff' },
  };

  const stepBadgeColors: Record<DeliveryStep, string> = {
    'to-pickup': 'var(--primario)',
    'pick-up': 'var(--info)',
    'to-deliver': 'var(--primario)',
    'at-delivery': 'var(--primario)',
    'confirm': 'var(--exito)',
  };

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
      background: 'var(--bg)',
    }}>
      {/* ═══════════════════════════════════════════
          B.1 — ESTADO DE ESPERA (Idle)
          ═══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {screen === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
          >
            {/* Map Background */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <MapPlaceholder variant="idle" />
            </div>

            {/* Glassmorphism Header */}
            <div style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--lf-glass-bg)',
              backdropFilter: 'blur(var(--lf-glass-blur))',
              WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
              borderBottom: '1px solid var(--lf-glass-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="font-syne" style={{ fontSize: 18, fontWeight: 800, color: 'var(--primario)', letterSpacing: '-0.5px' }}>LOGIFAST</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, background: isOnline ? 'rgba(0,200,83,0.1)' : 'rgba(142,142,160,0.1)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? 'var(--exito)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: isOnline ? 'var(--exito)' : 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                    {isOnline ? 'En linea' : 'Desconectado'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Toggle switch */}
                <button
                  onClick={handleToggleOnline}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: isOnline ? 'var(--exito)' : 'var(--border)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.3s',
                    padding: 0,
                  }}
                >
                  <motion.div
                    animate={{ x: isOnline ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      position: 'absolute',
                      top: 2,
                    }}
                  />
                </button>
                {/* Notification bell */}
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', position: 'relative', padding: 4 }}
                >
                  <Bell size={20} />
                  <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: 'var(--peligro)', border: '2px solid var(--lf-glass-bg)' }} />
                </button>
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--primario)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {MOCK_REPARTIDOR.initials}
                </div>
              </div>
            </div>

            {/* Center Card - Glassmorphism */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 5, padding: 20 }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{
                  background: 'var(--lf-glass-bg)',
                  backdropFilter: 'blur(var(--lf-glass-blur))',
                  WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                  border: '1px solid var(--lf-glass-border)',
                  borderRadius: 'var(--lf-card-radius)',
                  boxShadow: 'var(--lf-shadow-float)',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  maxWidth: 320,
                }}
              >
                <PulsingRings />
                <span className="font-syne" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>
                  Esperando asignacion
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {isOnline ? 'Estas en linea y listo' : 'Estas desconectado'}
                </span>
                <div className="font-mono" style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: '8px 16px',
                  background: 'var(--primario-soft)',
                  borderRadius: 'var(--lf-pill-radius)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  <span>{TODAY_STATS.deliveries} entregas hoy</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span>{TODAY_STATS.km} km</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span>C${TODAY_STATS.earnings} ganados</span>
                </div>
              </motion.div>
            </div>

            {/* Bottom Sheet */}
            <motion.div
              style={{
                position: 'relative',
                zIndex: 10,
                background: 'var(--lf-glass-bg)',
                backdropFilter: 'blur(var(--lf-glass-blur))',
                WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                borderTop: '1px solid var(--lf-glass-border)',
                borderRadius: 'var(--lf-sheet-radius) var(--lf-sheet-radius) 0 0',
                boxShadow: 'var(--lf-shadow-sheet)',
                maxHeight: bottomSheetExpanded ? '70vh' : '45vh',
                overflow: 'hidden',
                transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
                <button
                  onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}
                >
                  <motion.div animate={{ rotate: bottomSheetExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronUp size={20} />
                  </motion.div>
                </button>
              </div>

              <div style={{ padding: '0 20px 20px', overflowY: 'auto', maxHeight: bottomSheetExpanded ? 'calc(70vh - 50px)' : 'calc(45vh - 50px)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span className="font-syne" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Servicios de hoy</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{MOCK_COMPLETED_SERVICES.length} servicios</span>
                </div>

                {/* Services list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {MOCK_COMPLETED_SERVICES.slice(0, bottomSheetExpanded ? 5 : 3).map((svc) => (
                    <div key={svc.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--surface)',
                      borderRadius: 'var(--lf-card-radius)',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primario)' }}>{svc.id}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{svc.time}</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {svc.origin} → {svc.destination}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{svc.distance}</span>
                        <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--exito)' }}>{svc.earnings}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2x2 Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Entregas', value: String(TODAY_STATS.deliveries), icon: <Package size={16} color="var(--primario)" /> },
                    { label: 'Km', value: String(TODAY_STATS.km), icon: <Navigation size={16} color="var(--info)" /> },
                    { label: 'Ganancias', value: `C$${TODAY_STATS.earnings}`, icon: <DollarSign size={16} color="var(--exito)" /> },
                    { label: 'Tiempo activo', value: TODAY_STATS.activeTime, icon: <Clock size={16} color="var(--warning)" /> },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      background: 'var(--surface)',
                      borderRadius: 'var(--lf-card-radius)',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--primario-soft)',
                      }}>
                        {stat.icon}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{stat.value}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════
            B.2 — NUEVA ORDEN (New Order)
            ═══════════════════════════════════════════ */}
        {screen === 'new-order' && (
          <motion.div
            key="new-order"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'linear-gradient(180deg, rgba(27,27,47,0.95) 0%, rgba(27,27,47,0.85) 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 20px 24px',
              overflowY: 'auto',
            }}
          >
            {/* Animated Package icon */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ marginBottom: 16 }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--primario)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
              }}>
                <Package size={28} color="#fff" />
              </div>
            </motion.div>

            <span className="font-syne" style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24, letterSpacing: '-0.5px' }}>
              Nueva orden
            </span>

            {/* Glass card with order details */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              style={{
                width: '100%',
                maxWidth: 400,
                background: 'var(--lf-glass-bg)',
                backdropFilter: 'blur(var(--lf-glass-blur))',
                WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                border: '1px solid var(--lf-glass-border)',
                borderRadius: 'var(--lf-card-radius)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Type badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--lf-pill-radius)',
                  background: 'var(--primario-soft)',
                  color: 'var(--primario)',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Package size={14} />
                  {MOCK_ORDER.type}
                </span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {MOCK_ORDER.id}
                </span>
              </div>

              {/* Route */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: 2 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--exito)' }} />
                    <div style={{ width: 2, height: 24, background: 'var(--border)' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primario)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Origen</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{MOCK_ORDER.origin}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Destino</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{MOCK_ORDER.destination}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data grid 2x2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Distancia', value: MOCK_ORDER.distance, icon: <Route size={14} color="var(--info)" /> },
                  { label: 'Tiempo', value: MOCK_ORDER.estimatedTime, icon: <Timer size={14} color="var(--warning)" /> },
                  { label: 'Ganancia', value: MOCK_ORDER.earnings, icon: <DollarSign size={14} color="var(--exito)" /> },
                  { label: 'Paquete', value: MOCK_ORDER.packageSize, icon: <Package size={14} color="var(--primario)" /> },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 12,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}>
                    {item.icon}
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>{item.label}</span>
                      <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Client info */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--info)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={16} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block' }}>{MOCK_ORDER.clientName}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{MOCK_ORDER.clientPhone}</span>
                </div>
                <Phone size={16} color="var(--info)" />
              </div>
            </motion.div>

            {/* Timer bar */}
            <div style={{ width: '100%', maxWidth: 400, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Tiempo para aceptar</span>
                <motion.span
                  className="font-mono"
                  key={orderTimer}
                  animate={{ scale: orderTimer <= 10 ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: orderTimer <= 10 ? 'var(--peligro)' : '#fff',
                  }}
                >
                  {orderTimer}s
                </motion.span>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${(orderTimer / 30) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    background: orderTimer <= 10 ? 'var(--peligro)' : 'var(--primario)',
                    transition: 'background 0.3s',
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ width: '100%', maxWidth: 400, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleAcceptOrder}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 'var(--lf-button-radius)',
                  border: 'none',
                  background: 'var(--primario)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255,87,34,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check size={20} />
                Aceptar orden
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleRejectOrder}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--lf-button-radius)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                }}
              >
                Rechazar
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════
            B.3 — FLUJO DE ENTREGA (Delivery Flow)
            ═══════════════════════════════════════════ */}
        {screen === 'delivering' && (
          <motion.div
            key="delivering"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
          >
            {/* Map area (60%) */}
            <div style={{ flex: 6, position: 'relative' }}>
              <MapPlaceholder variant="delivering" />
              {/* Top bar overlay */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '12px 16px',
                background: 'var(--lf-glass-bg)',
                backdropFilter: 'blur(var(--lf-glass-blur))',
                WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                borderBottom: '1px solid var(--lf-glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-syne" style={{ fontSize: 16, fontWeight: 800, color: 'var(--primario)' }}>LOGIFAST</span>
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--lf-pill-radius)',
                  background: `${stepBadgeColors[deliveryStep]}15`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Bike size={14} color={stepBadgeColors[deliveryStep]} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: stepBadgeColors[deliveryStep], fontFamily: "'DM Sans', sans-serif" }}>
                    {stepLabels[deliveryStep]}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom sheet (40%, expandable) */}
            <motion.div
              animate={{ height: bottomSheetExpanded ? '70%' : '40%' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'relative',
                zIndex: 10,
                background: 'var(--lf-glass-bg)',
                backdropFilter: 'blur(var(--lf-glass-blur))',
                WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                borderTop: '1px solid var(--lf-glass-border)',
                borderRadius: 'var(--lf-sheet-radius) var(--lf-sheet-radius) 0 0',
                boxShadow: 'var(--lf-shadow-sheet)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
                <button
                  onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}
                >
                  <motion.div animate={{ rotate: bottomSheetExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronUp size={20} />
                  </motion.div>
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
                {/* Step Progress Bar */}
                <div style={{ marginBottom: 16 }}>
                  <StepProgressBar currentStep={deliveryStep} />
                </div>

                {/* Order Info */}
                <div style={{
                  padding: 14,
                  borderRadius: 'var(--lf-card-radius)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--primario)' }}>{MOCK_ORDER.id}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paquete {MOCK_ORDER.packageSize}</span>
                  </div>

                  {/* Destination */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primario)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{MOCK_ORDER.destination}</span>
                  </div>

                  {/* Client info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: 'var(--primario-soft)' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--info)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User size={13} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'block' }}>{MOCK_ORDER.clientName}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{MOCK_ORDER.clientPhone}</span>
                    </div>
                    <Phone size={14} color="var(--info)" style={{ cursor: 'pointer' }} />
                    <MessageSquare size={14} color="var(--info)" style={{ cursor: 'pointer' }} />
                  </div>

                  {/* Instructions */}
                  {MOCK_ORDER.instructions && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <FileText size={12} color="var(--text-muted)" style={{ marginTop: 2 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{MOCK_ORDER.instructions}</span>
                    </div>
                  )}
                </div>

                {/* KM Counter */}
                <div style={{
                  padding: 14,
                  borderRadius: 'var(--lf-card-radius)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  marginBottom: 12,
                  textAlign: 'center',
                }}>
                  <motion.span
                    className="font-mono"
                    key={kmRemaining}
                    style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}
                  >
                    {kmRemaining.toFixed(1)} km
                  </motion.span>
                  <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--border)', marginTop: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 3,
                      background: 'var(--primario)',
                      width: `${Math.max(5, (kmRemaining / 7.2) * 100)}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Main Action Button */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleNextStep}
                  style={{
                    width: '100%',
                    padding: deliveryStep === 'confirm' ? '18px' : '15px',
                    borderRadius: 'var(--lf-button-radius)',
                    border: 'none',
                    background: stepButtonColors[deliveryStep].bg,
                    color: stepButtonColors[deliveryStep].text,
                    fontSize: deliveryStep === 'confirm' ? 17 : 15,
                    fontWeight: 700,
                    fontFamily: "'Syne', sans-serif",
                    cursor: 'pointer',
                    boxShadow: stepButtonColors[deliveryStep].shadow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {deliveryStep === 'confirm' && <Check size={20} />}
                  {stepButtonLabels[deliveryStep]}
                </motion.button>

                {/* Secondary: Report incident */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowIncident(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--lf-button-radius)',
                    border: '1px solid rgba(255,23,68,0.2)',
                    background: 'transparent',
                    color: 'var(--peligro)',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={14} />
                  Reportar incidencia
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════
            B.5 — HISTORIAL DEL DIA
            ═══════════════════════════════════════════ */}
        {screen === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--bg)',
              overflowY: 'auto',
              paddingBottom: 'calc(var(--lf-bottom-nav-height) + 24px)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 20px 0',
              background: 'var(--lf-glass-bg)',
              backdropFilter: 'blur(var(--lf-glass-blur))',
              WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
              borderBottom: '1px solid var(--lf-glass-border)',
              paddingBottom: 20,
            }}>
              <span className="font-syne" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', display: 'block' }}>Hoy</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            <div style={{ padding: '20px 16px' }}>
              {/* 4 KPIs in 2x2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Entregas', value: String(TODAY_STATS.deliveries), icon: <Package size={18} color="var(--primario)" />, bg: 'var(--primario-soft)' },
                  { label: 'Km', value: String(TODAY_STATS.km), icon: <Navigation size={18} color="var(--info)" />, bg: 'rgba(41,121,255,0.08)' },
                  { label: 'Ganancias', value: `C$${TODAY_STATS.earnings}`, icon: <DollarSign size={18} color="var(--exito)" />, bg: 'rgba(0,200,83,0.08)' },
                  { label: 'Tiempo activo', value: TODAY_STATS.activeTime, icon: <Clock size={18} color="var(--warning)" />, bg: 'rgba(255,179,0,0.08)' },
                ].map((kpi) => (
                  <motion.div
                    key={kpi.label}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: 16,
                      borderRadius: 'var(--lf-card-radius)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--lf-shadow-card)',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: kpi.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10,
                    }}>
                      {kpi.icon}
                    </div>
                    <span className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'block' }}>{kpi.value}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{kpi.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <span className="font-syne" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Servicios completados</span>

                {MOCK_COMPLETED_SERVICES.map((svc, idx) => (
                  <div key={svc.id} style={{ display: 'flex', gap: 12 }}>
                    {/* Timeline line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: 'var(--exito)',
                        border: '2px solid var(--surface)',
                        boxShadow: '0 0 0 2px var(--exito)',
                      }} />
                      {idx < MOCK_COMPLETED_SERVICES.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 40 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--lf-card-radius)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      marginBottom: idx < MOCK_COMPLETED_SERVICES.length - 1 ? 8 : 0,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primario)' }}>{svc.id}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{svc.time}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {svc.origin} → {svc.destination}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{svc.distance}</span>
                        <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--exito)' }}>{svc.earnings}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════
            B.6 — PERFIL DEL REPARTIDOR
            ═══════════════════════════════════════════ */}
        {screen === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--bg)',
              overflowY: 'auto',
              paddingBottom: 'calc(var(--lf-bottom-nav-height) + 24px)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '28px 20px 20px',
              background: 'var(--lf-glass-bg)',
              backdropFilter: 'blur(var(--lf-glass-blur))',
              WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
              borderBottom: '1px solid var(--lf-glass-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--primario)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: '#fff',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 4px 16px rgba(255,87,34,0.3)',
              }}>
                {MOCK_REPARTIDOR.initials}
              </div>
              <span className="font-syne" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{MOCK_REPARTIDOR.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--lf-pill-radius)',
                  background: 'var(--primario-soft)',
                  color: 'var(--primario)',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Bike size={12} />
                  Repartidor
                </span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--lf-pill-radius)',
                  background: 'rgba(0,200,83,0.08)',
                  color: 'var(--exito)',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Shield size={12} />
                  Verificado
                </span>
              </div>
            </div>

            <div style={{ padding: '20px 16px' }}>
              {/* Stats card */}
              <div style={{
                padding: 16,
                borderRadius: 'var(--lf-card-radius)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
                marginBottom: 12,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', display: 'block' }}>
                    {MOCK_REPARTIDOR.totalDeliveries}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Entregas</span>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                  <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', display: 'block' }}>
                    4.8
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Calificacion</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', display: 'block' }}>
                    98%
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>A tiempo</span>
                </div>
              </div>

              {/* Moto card */}
              <div style={{
                padding: 16,
                borderRadius: 'var(--lf-card-radius)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'var(--primario-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bike size={24} color="var(--primario)" />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'block' }}>{MOCK_REPARTIDOR.moto}</span>
                  <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Placa: {MOCK_REPARTIDOR.plate}</span>
                </div>
              </div>

              {/* Calificacion section */}
              <div style={{
                padding: 16,
                borderRadius: 'var(--lf-card-radius)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
                marginBottom: 12,
              }}>
                <span className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 10 }}>Calificacion</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{MOCK_REPARTIDOR.rating}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        fill={star <= Math.floor(MOCK_REPARTIDOR.rating) ? 'var(--warning)' : 'none'}
                        color={star <= Math.floor(MOCK_REPARTIDOR.rating) ? 'var(--warning)' : 'var(--border)'}
                      />
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Basado en {MOCK_REPARTIDOR.totalDeliveries} entregas</span>
              </div>

              {/* Configuracion toggles */}
              <div style={{
                padding: 16,
                borderRadius: 'var(--lf-card-radius)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
                marginBottom: 12,
              }}>
                <span className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 12 }}>Configuracion</span>
                {[
                  { label: 'Notificaciones push', icon: <Bell size={16} color="var(--text-secondary)" /> },
                  { label: 'Sonido de nueva orden', icon: <Activity size={16} color="var(--text-secondary)" /> },
                  { label: 'Modo oscuro', icon: isDark ? <Moon size={16} color="var(--text-secondary)" /> : <Sun size={16} color="var(--text-secondary)" /> },
                ].map((item, idx) => (
                  <div key={item.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: idx < 2 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.icon}
                      <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{item.label}</span>
                    </div>
                    {item.label === 'Modo oscuro' ? (
                      <button
                        onClick={toggleTheme}
                        style={{
                          width: 44, height: 24, borderRadius: 12,
                          background: isDark ? 'var(--primario)' : 'var(--border)',
                          border: 'none', cursor: 'pointer', position: 'relative', padding: 0,
                        }}
                      >
                        <motion.div
                          animate={{ x: isDark ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            position: 'absolute', top: 2,
                          }}
                        />
                      </button>
                    ) : (
                      <button
                        style={{
                          width: 44, height: 24, borderRadius: 12,
                          background: 'var(--exito)', border: 'none',
                          cursor: 'pointer', position: 'relative', padding: 0,
                        }}
                      >
                        <motion.div
                          animate={{ x: 20 }}
                          style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            position: 'absolute', top: 2,
                          }}
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Logout */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--lf-button-radius)',
                  border: '1px solid rgba(255,23,68,0.2)',
                  background: 'transparent',
                  color: 'var(--peligro)',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <LogOut size={16} />
                Cerrar sesion
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          B.4 — REPORTE DE INCIDENCIA (Bottom Sheet)
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {showIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'flex-end',
            }}
            onClick={() => setShowIncident(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxHeight: '75vh',
                background: 'var(--lf-glass-bg)',
                backdropFilter: 'blur(var(--lf-glass-blur))',
                WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                borderRadius: 'var(--lf-sheet-radius) var(--lf-sheet-radius) 0 0',
                boxShadow: 'var(--lf-shadow-sheet)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 20px 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(255,23,68,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AlertTriangle size={18} color="var(--peligro)" />
                  </div>
                  <span className="font-syne" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Reportar incidencia</span>
                </div>
                <button
                  onClick={() => setShowIncident(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto' }}>
                {/* Selectable options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {[
                    { key: 'mechanical' as IncidentType, label: 'Falla mecanica', icon: <Wrench size={18} /> },
                    { key: 'client-issue' as IncidentType, label: 'Problema con cliente', icon: <UserX size={18} /> },
                    { key: 'accident' as IncidentType, label: 'Accidente', icon: <AlertOctagon size={18} /> },
                    { key: 'other' as IncidentType, label: 'Otro', icon: <MoreHorizontal size={18} /> },
                  ].map((opt) => (
                    <motion.button
                      key={opt.key}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedIncident(opt.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px',
                        borderRadius: 'var(--lf-card-radius)',
                        border: `2px solid ${selectedIncident === opt.key ? 'var(--peligro)' : 'var(--border)'}`,
                        background: selectedIncident === opt.key ? 'rgba(255,23,68,0.05)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: selectedIncident === opt.key ? 'var(--peligro)' : 'var(--text)',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: selectedIncident === opt.key ? 'rgba(255,23,68,0.1)' : 'var(--primario-soft)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: selectedIncident === opt.key ? 'var(--peligro)' : 'var(--text-secondary)',
                      }}>
                        {opt.icon}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{opt.label}</span>
                      {selectedIncident === opt.key && (
                        <Check size={16} color="var(--peligro)" style={{ marginLeft: 'auto' }} />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Describe que paso"
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: '14px 16px',
                    borderRadius: 'var(--lf-input-radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    resize: 'none',
                    outline: 'none',
                  }}
                />

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleIncidentSubmit}
                  disabled={!selectedIncident}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--lf-button-radius)',
                    border: 'none',
                    background: selectedIncident ? 'var(--peligro)' : 'var(--border)',
                    color: selectedIncident ? '#fff' : 'var(--text-muted)',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Syne', sans-serif",
                    cursor: selectedIncident ? 'pointer' : 'not-allowed',
                    marginTop: 12,
                    boxShadow: selectedIncident ? '0 6px 20px rgba(255,23,68,0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={18} />
                  Enviar reporte
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          B.7 — NAVEGACION (Bottom Nav)
          ═══════════════════════════════════════════ */}
      {screen !== 'new-order' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: 'var(--lf-glass-bg)',
          backdropFilter: 'blur(var(--lf-glass-blur))',
          WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
          borderTop: '1px solid var(--lf-glass-border)',
          height: 'var(--lf-bottom-nav-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          paddingBottom: 'var(--lf-safe-bottom)',
        }}>
          {[
            {
              key: 'idle' as RepartidorScreen,
              label: 'Inicio',
              icon: <MapPin size={22} />,
              activeIcon: <MapPin size={22} strokeWidth={2.5} />,
            },
            {
              key: 'history' as RepartidorScreen,
              label: 'Servicios',
              icon: <Package size={22} />,
              activeIcon: <Package size={22} strokeWidth={2.5} />,
            },
            {
              key: 'profile' as RepartidorScreen,
              label: 'Perfil',
              icon: <User size={22} />,
              activeIcon: <User size={22} strokeWidth={2.5} />,
            },
          ].map((item) => {
            const isActive = screen === item.key || (screen === 'delivering' && item.key === 'idle');
            return (
              <motion.button
                key={item.key}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (screen === 'delivering') return; // Don't navigate during delivery
                  setScreen(item.key);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: screen === 'delivering' ? 'not-allowed' : 'pointer',
                  opacity: screen === 'delivering' && !isActive ? 0.4 : 1,
                  position: 'relative',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="repartidor-nav-indicator"
                    style={{
                      position: 'absolute',
                      top: -2,
                      width: 24,
                      height: 3,
                      borderRadius: 2,
                      background: 'var(--primario)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ color: isActive ? 'var(--primario)' : 'var(--text-muted)', display: 'flex' }}>
                  {isActive ? item.activeIcon : item.icon}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primario)' : 'var(--text-muted)',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
