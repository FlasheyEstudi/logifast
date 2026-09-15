'use client';

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun, TrendingUp, Clock, Route as RouteIcon } from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { useGeolocation } from '@/hooks/useGeolocation';
import { realtime, onRealtimeEvent } from '@/services/realtime';
import { useConfigStore } from '@/store/configStore';
import { reproducirSiActivo, reproducirSonido } from '@/services/audio';
import { iniciarRastreoFondo, detenerRastreoFondo } from '@/services/background-tracking';
import { inicializarNotificacionesNativas, solicitarPermisoNotificacionesManual, dispararNotificacionNativa } from '@/services/native-notifications';
import { obtenerUbicacionActual } from '@/lib/native-geolocation';
import { HAPTIC_PATTERNS } from '@/services/haptics';
import { Bell, X } from 'lucide-react';

/* ═══════════════════════════════════════════════
   DYNAMIC MODULE IMPORTS — mantienen todos los overlays
   ═══════════════════════════════════════════════ */

const RepartidorServicio = dynamic(() => import('./RepartidorServicio'), { ssr: false });
const RepartidorHistorial = dynamic(() => import('./RepartidorHistorial'), { ssr: false });
const RepartidorPerfil = dynamic(() => import('./RepartidorPerfil'), { ssr: false });
const RepartidorNotificacionOrden = dynamic(() => import('./RepartidorNotificacionOrden'), { ssr: false });
const RepartidorChat = dynamic(() => import('./RepartidorChat'), { ssr: false });
const RepartidorIncidencia = dynamic(() => import('./RepartidorIncidencia'), { ssr: false });
const RepartidorDetalleServicio = dynamic(() => import('./RepartidorDetalleServicio'), { ssr: false });
import { aplicarTema } from '@/store/configStore';
import SlidingPillTabBar from '@/components/ui/SlidingPillTabBar';

/* ═══════════════════════════════════════════════
   SNACKBAR CONTEXT
   ═══════════════════════════════════════════════ */

interface SnackbarData {
  message: string;
  action?: string;
  onAction?: () => void;
}

const SnackbarContext = createContext<(data: SnackbarData | null) => void>(() => {});

export function useRepartidorSnackbar() {
  return useContext(SnackbarContext);
}

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface RepartidorShellProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  userName: string;
}

/* ═══════════════════════════════════════════════
   NAV CONFIG — iOS native 4-item tab bar
   En Servicio | Historial | Ganancias | Perfil
   ═══════════════════════════════════════════════ */

type RepartidorTabKey = 'servicio' | 'historial' | 'ganancias' | 'perfil';
type StorePantalla = 'servicio' | 'historial' | 'perfil';

const TAB_LABELS: Record<RepartidorTabKey, string> = {
  servicio: 'En Servicio',
  historial: 'Historial',
  ganancias: 'Ganancias',
  perfil: 'Perfil',
};

/* ─── SVG icons (24x24, stroke-width 1.8) para tab bar ─── */

function ServicioIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

function HistorialIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function GananciasIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PerfilIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0116 0v1" />
    </svg>
  );
}

const NAV_ITEMS: { key: RepartidorTabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'servicio', label: 'En Servicio', icon: <ServicioIcon /> },
  { key: 'historial', label: 'Mis Servicios', icon: <HistorialIcon /> },
  { key: 'ganancias', label: 'Ganancias', icon: <GananciasIcon /> },
  { key: 'perfil', label: 'Perfil', icon: <PerfilIcon /> },
];

/* ═══════════════════════════════════════════════
   STATUS BAR SVG ICONS (mantener simulación móvil)
   ═══════════════════════════════════════════════ */

function SignalIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="9" width="3" height="3" rx="0.5" />
      <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
      <rect x="9" y="3" width="3" height="9" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.3" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M8 10.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" fill="currentColor" stroke="none" transform="translate(0,-2)" />
      <path d="M4.93 8.47a4.36 4.36 0 016.14 0" strokeWidth="1.4" strokeLinecap="round" transform="translate(0,-1)" />
      <path d="M2.1 5.64a7.8 7.8 0 0111.8 0" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0.5" width="19" height="11" rx="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <rect x="1.5" y="2" width="14" height="8" rx="1" />
      <rect x="19.5" y="3.5" width="2" height="5" rx="0.8" opacity="0.4" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   GANANCIAS PANEL — inline (sin modificar store)
   Usa obtenerStats y perfil del store existente.
   ═══════════════════════════════════════════════ */

function GananciasPanel() {
  const { obtenerStats, perfil } = useRepartidorStore();
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const stats = obtenerStats(periodo);

  const promedio = stats.entregas > 0 ? stats.ganancias / stats.entregas : 0;

  return (
    <div style={{ padding: '8px 0 40px' }}>
      {/* Period selector — pills iOS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['hoy', 'semana', 'mes'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`lf-ios-pill${periodo === p ? ' active' : ''}`}
            style={{
              cursor: 'pointer',
              border: 'none',
              fontFamily: 'var(--ios-font)',
              textTransform: 'capitalize',
            }}
          >
            {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      {/* Big ganancias card */}
      <div
        className="lf-ios-card"
        style={{ textAlign: 'center', padding: '28px 16px' }}
      >
        <div
          style={{
            fontSize: 13,
            color: 'var(--ios-text-tertiary)',
            marginBottom: 6,
            fontFamily: 'var(--ios-font)',
          }}
        >
          Ganancias {periodo === 'hoy' ? 'de hoy' : periodo === 'semana' ? 'de la semana' : 'del mes'}
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: 'var(--ios-green)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          C${stats.ganancias.toFixed(2)}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ios-text-tertiary)',
            marginTop: 8,
            fontFamily: 'var(--ios-font)',
          }}
        >
          {stats.entregas} entrega{stats.entregas === 1 ? '' : 's'} completada{stats.entregas === 1 ? '' : 's'}
        </div>
      </div>

      {/* Stats grid */}
      <div className="lf-ios-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '0.5px solid var(--ios-separator)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ios-text-secondary)' }}>
            <RouteIcon size={18} />
            <span style={{ fontSize: 15, fontFamily: 'var(--ios-font)' }}>Kilómetros recorridos</span>
          </div>
          <span
            className="font-mono"
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-text-primary)' }}
          >
            {stats.km.toFixed(1)} km
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '0.5px solid var(--ios-separator)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ios-text-secondary)' }}>
            <Clock size={18} />
            <span style={{ fontSize: 15, fontFamily: 'var(--ios-font)' }}>Tiempo activo</span>
          </div>
          <span
            className="font-mono"
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-text-primary)' }}
          >
            {stats.tiempoActivo} min
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ios-text-secondary)' }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: 15, fontFamily: 'var(--ios-font)' }}>Promedio por entrega</span>
          </div>
          <span
            className="font-mono"
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-text-primary)' }}
          >
            C${promedio.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div
        className="lf-ios-card"
        style={{
          background: 'rgba(0, 122, 255, 0.08)',
          border: '0.5px solid rgba(0, 122, 255, 0.2)',
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: 'var(--ios-blue)',
            fontWeight: 600,
            marginBottom: 4,
            fontFamily: 'var(--ios-font)',
          }}
        >
          ¿Cómo se calculan tus ganancias?
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ios-text-secondary)',
            lineHeight: 1.5,
            fontFamily: 'var(--ios-font)',
          }}
        >
          Las ganancias incluyen todos los servicios completados en el período seleccionado.
          Las incidencias o cancelaciones no se contabilizan.
        </div>
      </div>

      {/* Saldo actual de billetera */}
      {typeof perfil?.saldo === 'number' && (
        <div className="lf-ios-card">
          <div
            style={{
              fontSize: 13,
              color: 'var(--ios-text-tertiary)',
              marginBottom: 6,
              fontFamily: 'var(--ios-font)',
            }}
          >
            Saldo actual en billetera
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--ios-text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            C${perfil.saldo.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorShell({ isDark, toggleTheme, onLogout, userName }: RepartidorShellProps) {
  const {
    pantallaActiva,
    setPantalla,
    conectado,
    ordenAsignadaPendiente,
    ordenesActivas = [],
    chatAbierto,
    incidenciaAbierta,
    servicioDetalle,
    simularMovimiento,
    perfil,
    actualizarPosicion,
    estado,
    conectar,
    desconectar,
  } = useRepartidorStore();

  const syncFromBackend = useRepartidorStore((s) => s.syncFromBackend);
  const actualizarPosicionAsync = useRepartidorStore((s) => s.actualizarPosicionAsync);

  /* Local state for "ganancias" tab — no store modification */
  const [gananciasActive, setGananciasActive] = useState(false);

  const activeTab: RepartidorTabKey = gananciasActive
    ? 'ganancias'
    : (pantallaActiva as RepartidorTabKey);

  const [snackbar, setSnackbar] = useState<SnackbarData | null>(null);
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clock, setClock] = useState('9:41');

  /* ─── SNACKBAR AUTO-DISMISS ─── */
  const showSnackbar = useCallback((data: SnackbarData | null) => {
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
    setSnackbar(data);
    if (data) {
      snackbarTimerRef.current = setTimeout(() => setSnackbar(null), 4000);
    }
  }, []);

  /* ─── Prompt de Permisos de Notificación para Repartidor ─── */
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    inicializarNotificacionesNativas().then((granted) => {
      if (!granted && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          setShowPermissionPrompt(true);
        }
      }
    }).catch(() => null);
  }, []);

  const handleActivarNotificaciones = async () => {
    const granted = await solicitarPermisoNotificacionesManual();
    setShowPermissionPrompt(false);
    if (granted) {
      dispararNotificacionNativa({
        titulo: '¡Alertas de Repartidor activadas!',
        cuerpo: 'Recibirás avisos de nuevas órdenes en tu zona.',
        canalId: 'logifast_urgente',
        tipoAlerta: 'exito',
      });
    }
  };

  /* ─── Sync inicial con backend (10s cuando la pestaña está visible) ─── */
  useEffect(() => {
    syncFromBackend();

    const handleVisibilityAndSync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncFromBackend();
      }
    };

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncFromBackend();
      }
    }, 10000);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityAndSync);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityAndSync);
      }
    };
  }, [syncFromBackend]);

  // Initialize browser geolocation — MANTENER watch: true
  const geo = useGeolocation({ watch: true });

  // Start/stop geolocation and background tracking depending on connected status
  const ordenId = useRepartidorStore((s) => s.ordenActiva?.id);
  const storeLat = useRepartidorStore((s) => s.lat);
  const storeLng = useRepartidorStore((s) => s.lng);
  const storeHeading = useRepartidorStore((s) => s.heading);
  const storeEstado = useRepartidorStore((s) => s.estado);

  // Obtener posición GPS fresca inmediata en el montaje de la app
  useEffect(() => {
    obtenerUbicacionActual({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 })
      .then((res) => {
        if (res.ok && typeof res.lat === 'number' && typeof res.lng === 'number') {
          actualizarPosicion(res.lat, res.lng);
        }
      })
      .catch(() => null);
  }, [actualizarPosicion]);

  // Mantener geolocalización activa para centrado de mapa en tiempo real
  useEffect(() => {
    geo.start();
  }, [geo.start]);

  // Iniciar/detener rastreo en segundo plano según estado de conexión
  useEffect(() => {
    if (conectado) {
      iniciarRastreoFondo(ordenId, storeEstado);
    } else {
      detenerRastreoFondo();
    }
    return () => {
      detenerRastreoFondo();
    };
  }, [conectado, ordenId, storeEstado]);

  // Connect/disconnect socket when driver goes online/offline
  useEffect(() => {
    if (conectado && perfil?.id) {
      realtime.repartidorConectar(perfil.id);
    } else {
      realtime.disconnect();
    }
  }, [conectado, perfil?.id]);

  // Update store coordinates on real GPS updates
  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null) {
      actualizarPosicion(geo.lat, geo.lng);
      if (conectado) {
        actualizarPosicionAsync(geo.lat, geo.lng);
      }
    }
  }, [conectado, geo.lat, geo.lng, actualizarPosicion, actualizarPosicionAsync]);

  // Emit driver coordinates to the server on any store coordinate changes (with ordenId)
  useEffect(() => {
    if (conectado) {
      realtime.repartidorPosicion(storeLat, storeLng, storeHeading, storeEstado, ordenId);
    }
  }, [conectado, storeLat, storeLng, storeHeading, storeEstado, ordenId]);

  // Emit state updates to client tracking room & join order room
  useEffect(() => {
    if (conectado && ordenId) {
      realtime.repartidorEstadoCambio(ordenId, storeEstado);
      realtime.clienteTrackingUnirse(ordenId);
    }
  }, [conectado, ordenId, storeEstado]);

  // Listen for realtime chat updates & new assigned orders
  useEffect(() => {
    if (!conectado) return;

    const cleanupChat = onRealtimeEvent('chat:mensaje:nuevo', (msg) => {
      if (!msg) return;
      const state = useRepartidorStore.getState();
      const yaExiste = state.mensajes.some((m) => m.id === msg.id);
      if (!yaExiste) {
        useRepartidorStore.setState({
          mensajes: [...state.mensajes, msg]
        });
      }
      const isFromAdmin = msg.emisor === 'admin' || msg.emisorId === 'admin' || msg.esAdmin;
      const isFromClient = msg.emisor === 'cliente';

      if (isFromAdmin || isFromClient) {
        reproducirSonido('mensaje', 90);
        HAPTIC_PATTERNS.light();
        if (!state.chatAbierto) {
          showSnackbar({
            message: isFromAdmin
              ? `Despacho Central (Admin): "${(msg.contenido || '').slice(0, 40)}${(msg.contenido || '').length > 40 ? '...' : ''}"`
              : `Mensaje de cliente: "${(msg.contenido || '').slice(0, 40)}${(msg.contenido || '').length > 40 ? '...' : ''}"`,
            action: 'Ver chat',
            onAction: () => state.toggleChat(msg.ordenId),
          });
        }
      }
    });

    const cleanupOrder = onRealtimeEvent('repartidor:orden:nueva', (orden) => {
      if (!orden) return;
      const state = useRepartidorStore.getState();
      const myProfileId = state.perfil.id;
      // Si la orden viene con repartidorId específico, validar que sea para este motorizado
      if (orden.repartidorId && myProfileId && orden.repartidorId !== myProfileId) {
        return;
      }
      if (!state.ordenActiva && !state.ordenAsignadaPendiente) {
        state.recibirOrdenAsignada(orden);
        HAPTIC_PATTERNS.nuevaOrden();
      }
    });

    const cleanupDisponible = onRealtimeEvent('repartidor:orden:disponible', (orden) => {
      if (!orden) return;
      const state = useRepartidorStore.getState();
      const yaExiste = (state.ofertasDisponibles || []).some((o) => o.id === orden.id);
      if (!yaExiste) {
        useRepartidorStore.setState({
          ofertasDisponibles: [orden, ...(state.ofertasDisponibles || [])],
        });
      }
    });

    const cleanupTomada = onRealtimeEvent('repartidor:orden:tomada', (data: { ordenId: string; repartidorId?: string }) => {
      if (!data?.ordenId) return;
      const state = useRepartidorStore.getState();
      const myProfileId = state.perfil.id;
      if (data.repartidorId && myProfileId && data.repartidorId === myProfileId) {
        return; // este repartidor la tomó, mantenerla
      }

      // Remover de ofertas disponibles
      const nuevasOfertas = (state.ofertasDisponibles || []).filter((o) => o.id !== data.ordenId);
      const update: any = { ofertasDisponibles: nuevasOfertas };

      // Si estaba en el modal pendiente de aceptación, cerrarlo
      if (state.ordenAsignadaPendiente?.id === data.ordenId) {
        update.ordenAsignadaPendiente = null;
        if (state.estado === 'ORDEN_ASIGNADA') {
          update.estado = 'EN_LINEA';
        }
      }
      useRepartidorStore.setState(update);
    });

    const cleanupMotoMantenimiento = onRealtimeEvent('repartidor:moto:mantenimiento_iniciado', (data: any) => {
      const state = useRepartidorStore.getState();
      state.syncFromBackend();
      reproducirSonido('error', 80);
      HAPTIC_PATTERNS.heavy();
      showSnackbar({
        message: data?.mensaje || 'Tu motocicleta ha ingresado al taller para mantenimiento.',
        action: 'Ver',
        onAction: () => {
          setPantalla('perfil');
          setGananciasActive(false);
        },
      });
    });

    const cleanupMotoCompletado = onRealtimeEvent('repartidor:moto:mantenimiento_completado', (data: any) => {
      const state = useRepartidorStore.getState();
      state.syncFromBackend();
      reproducirSonido('notificacion', 90);
      HAPTIC_PATTERNS.success();
      showSnackbar({
        message: data?.mensaje || '¡Tu moto está lista! Mantenimiento técnico completado.',
        action: 'Ver',
        onAction: () => {
          setPantalla('perfil');
          setGananciasActive(false);
        },
      });
    });

    const cleanupMotoUpdate = onRealtimeEvent('repartidor:moto:update', () => {
      useRepartidorStore.getState().syncFromBackend();
    });

    return () => {
      cleanupChat();
      cleanupOrder();
      cleanupDisponible();
      cleanupTomada();
      cleanupMotoMantenimiento();
      cleanupMotoCompletado();
      cleanupMotoUpdate();
    };
  }, [conectado, showSnackbar]);

  /* ─── SIMULATION LOOP (5s) — MANTENER ─── */
  useEffect(() => {
    if (!conectado) return;
    if (geo.lat !== null && !geo.error) return;

    const interval = setInterval(() => {
      simularMovimiento();
    }, 5000);
    return () => clearInterval(interval);
  }, [conectado, simularMovimiento, geo.lat, geo.error]);

  /* ─── CLOCK (10s) — MANTENER ─── */
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes();
      setClock(`${h}:${m.toString().padStart(2, '0')}`);
    };
    update();
    const i = setInterval(update, 10000);
    return () => clearInterval(i);
  }, []);

  /* ─── Sync Dynamic URL Hash & Soporte para Gesto Atrás Móvil (popstate) ─── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inicializar estado del historial si es la primera carga
    if (!window.history.state || window.history.state.type !== 'repartidor_tab') {
      window.history.replaceState({ type: 'repartidor_tab', tab: activeTab }, '', `#/repartidor/${activeTab}`);
    }

    const handlePopState = (e: PopStateEvent) => {
      const rState = useRepartidorStore.getState();

      // 1. Si hay sub-vistas / modales abiertos (Chat, Incidencia, Detalle, etc.), el gesto atrás los cierra primero
      if (rState.chatAbierto) {
        rState.toggleChat();
        return;
      }
      if (rState.incidenciaAbierta) {
        rState.toggleIncidencia(false);
        return;
      }
      if (rState.servicioDetalle) {
        rState.cerrarDetalle();
        return;
      }

      // 2. Si es cambio de tab por historial
      if (e.state && e.state.type === 'repartidor_tab' && e.state.tab) {
        const tab = e.state.tab as RepartidorTabKey;
        if (tab === 'ganancias') {
          setGananciasActive(true);
        } else {
          setGananciasActive(false);
          setPantalla(tab as StorePantalla);
        }
      } else {
        // Si retrocede a la raíz, ir a 'servicio'
        if (activeTab !== 'servicio') {
          setGananciasActive(false);
          setPantalla('servicio');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, setPantalla]);



  /* ─── handleNav — Con soporte de historial para gesto atrás ─── */
  const handleNav = useCallback(
    (tab: RepartidorTabKey, pushHistory = true) => {
      if (tab === activeTab) return;

      if (pushHistory && typeof window !== 'undefined') {
        window.history.pushState({ type: 'repartidor_tab', tab }, '', `#/repartidor/${tab}`);
      }

      if (tab === 'ganancias') {
        setGananciasActive(true);
      } else {
        setGananciasActive(false);
        setPantalla(tab as StorePantalla);
      }
    },
    [activeTab, setPantalla]
  );

  /* ─── Connection toggle from header pill — usa conectar/desconectar existentes ─── */
  const handleToggleConnection = useCallback(() => {
    if (conectado) {
      desconectar();
      HAPTIC_PATTERNS.medium();
      showSnackbar({ message: 'Te has desconectado.' });
    } else {
      if (!perfil?.contratoAceptado) {
        showSnackbar({
          message: 'Debes firmar el contrato digital en tu Perfil antes de conectarte.',
        });
        HAPTIC_PATTERNS.error();
        return;
      }
      conectar();
      HAPTIC_PATTERNS.medium();
      showSnackbar({ message: 'Te has conectado. Esperando asignaciones.' });
    }
  }, [conectado, conectar, desconectar, perfil, showSnackbar]);

  const renderScreen = () => {
    if (gananciasActive) {
      return <GananciasPanel />;
    }
    switch (pantallaActiva) {
      case 'servicio':
        return <RepartidorServicio />;
      case 'historial':
        return <RepartidorHistorial />;
      case 'perfil':
        return (
          <RepartidorPerfil
            isDark={isDark}
            toggleTheme={toggleTheme}
            onLogout={onLogout}
            userName={userName}
          />
        );
      default:
        return <RepartidorServicio />;
    }
  };

  const title = TAB_LABELS[activeTab];

  /* Servicios badge — ordenesActivas + pendiente de aceptación */
  const serviciosBadgeCount =
    (ordenesActivas?.length || 0) + (ordenAsignadaPendiente ? 1 : 0);

  /* Avatar initials */
  const avatarInitials =
    perfil?.initials || (userName ? userName.charAt(0).toUpperCase() : 'R');
  const avatarColor = perfil?.color || 'var(--ios-blue)';

  /* ─── THEME SYNC — Asegura que el modo oscuro aplique a todo el DOM y CSS vars ─── */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    aplicarTema(isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      <div
        className={`lf-ios-app lf-rep-shell ${isDark ? 'dark' : 'light'}`}
        data-theme={isDark ? 'dark' : 'light'}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: isDark ? '#000000' : '#F2F2F7',
          color: isDark ? '#FFFFFF' : '#1C1C1E',
          fontFamily: 'var(--ios-font)',
          transition: 'background-color 0.4s ease, color 0.3s ease',
        }}
      >
        {/* ═══════ NATIVE STATUS BAR (mobile simulation) ═══════ */}
        <div
          className="lf-rep-status-bar"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'max(24px, env(safe-area-inset-top, 24px))',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: 'transparent',
            pointerEvents: 'none',
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--ios-text-primary)',
              lineHeight: 1,
            }}
          >
            {clock}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ios-text-primary)' }}>
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* ═══════ ANDROID GESTURE BAR ═══════ */}
        <div
          className="lf-rep-gesture-bar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'max(20px, env(safe-area-inset-bottom, 20px))',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 120,
              height: 3,
              borderRadius: 2,
              background: 'var(--ios-text-tertiary)',
              opacity: 0.3,
            }}
          />
        </div>

        {/* ═══════ HEADER CÁPSULA PREMIUM REPARTIDOR ═══════ */}
        <header
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 10px) + 8px)',
            right: 16,
            zIndex: 9980,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 6px 5px 14px',
            borderRadius: 100,
            background: isDark ? 'rgba(20, 20, 28, 0.82)' : 'rgba(255, 255, 255, 0.86)',
            backdropFilter: 'blur(36px) saturate(190%)',
            WebkitBackdropFilter: 'blur(36px) saturate(190%)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: isDark
              ? 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.18), 0 8px 32px rgba(0,0,0,0.45)'
              : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), 0 8px 28px rgba(0, 102, 255, 0.08)',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Connection pill */}
          <button
            onClick={handleToggleConnection}
            aria-label={conectado ? 'Conectado — tocar para desconectar' : 'Desconectado — tocar para conectar'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 100, border: 'none',
              background: conectado ? 'rgba(52,199,89,0.18)' : 'rgba(255,59,48,0.18)',
              color: conectado ? '#34C759' : '#FF3B30',
              fontFamily: 'var(--ios-font)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: conectado ? '#34C759' : '#FF3B30', boxShadow: conectado ? '0 0 8px #34C759' : 'none' }} />
            {conectado ? 'En línea' : 'Desconectado'}
          </button>

          {/* Acciones en sub-cápsula */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 100, padding: '2px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)' }}>
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Claro' : 'Oscuro'}
              style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', color: isDark ? '#FFD60A' : '#FF9500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}
            >
              {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
            </button>
          </div>
        </header>

        {/* ═══════ CONTENT AREA (Navegación controlada exclusivamente por TabBar) ═══════ */}
        <main
          className="lf-rep-content lf-ios-content"
          style={{
            flex: 1,
            paddingTop: 'calc(96px + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(var(--ios-tabbar-height) + var(--ios-tabbar-safe))',
            minHeight: '100vh',
            backgroundColor: 'var(--ios-bg)',
            position: 'relative',
            transition: 'padding 0.3s ease, background-color 0.3s ease',
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0.7, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985, position: 'absolute', width: '100%' }}
              transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
              className={`lf-ios-screen-transition${activeTab === 'servicio' ? '' : ' lf-rep-pad'}`}
              style={
                activeTab === 'servicio'
                  ? {
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                    }
                  : {
                      position: 'relative',
                      width: '100%',
                      maxWidth: 960,
                      margin: '0 auto',
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 20,
                      paddingBottom: 20,
                    }
              }
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ═══════ NAVBAR FLOTANTE CÁPSULA PREMIUM (REPARTIDOR) ═══════ */}
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom, 16px) + 8px)',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 9990,
            padding: '0 12px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 420 }}>
            <SlidingPillTabBar
              items={NAV_ITEMS.map((it) => ({
                key: it.key,
                label: it.label,
                icon: it.icon,
                badge: it.key === 'servicio' ? serviciosBadgeCount : undefined,
              }))}
              activeKey={activeTab}
              onChange={(key) => handleNav(key as RepartidorTabKey)}
              isDark={isDark}
              accentColor="var(--ios-blue, var(--primario))"
              ariaLabel="Navegación principal repartidor"
            />
          </div>
        </div>

        {/* ═══════ iOS SNACKBAR ═══════ */}
        <AnimatePresence>
          {snackbar && (
            <motion.div
              key="rep-snackbar"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="lf-rep-snackbar lf-ios-snackbar"
              style={{
                position: 'fixed',
                bottom: 'calc(var(--ios-tabbar-height) + var(--ios-tabbar-safe) + 12px)',
                left: 16,
                right: 16,
                zIndex: 9998,
                background: 'var(--ios-bg-secondary)',
                color: 'var(--ios-text-primary)',
                borderRadius: 'var(--ios-radius-md)',
                padding: '14px 16px',
                boxShadow: 'var(--ios-shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontFamily: 'var(--ios-font)',
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>{snackbar.message}</span>
              {snackbar.action && (
                <button
                  onClick={() => {
                    snackbar.onAction?.();
                    setSnackbar(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--ios-blue)',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--ios-font)',
                    padding: '4px 8px',
                    borderRadius: 'var(--ios-radius-sm)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {snackbar.action}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ OVERLAYS — TODOS SE MANTIENEN ═══════ */}
        <AnimatePresence>
          {ordenAsignadaPendiente && <RepartidorNotificacionOrden />}
        </AnimatePresence>

        <AnimatePresence>{chatAbierto && <RepartidorChat />}</AnimatePresence>

        <AnimatePresence>{incidenciaAbierta && <RepartidorIncidencia />}</AnimatePresence>

        <AnimatePresence>{servicioDetalle && <RepartidorDetalleServicio />}</AnimatePresence>

        {/* ─── Banner de Permisos de Notificación (Heads-Up para Repartidor) ─── */}
        <AnimatePresence>
          {showPermissionPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              style={{
                position: 'fixed',
                top: 'calc(env(safe-area-inset-top, 10px) + 68px)',
                left: 16,
                right: 16,
                maxWidth: 440,
                margin: '0 auto',
                zIndex: 9999,
                background: 'rgba(0, 200, 83, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 18,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                color: '#FFFFFF',
                boxShadow: '0 12px 30px rgba(0, 200, 83, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell size={18} />
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                  <span style={{ fontWeight: 700, display: 'block', fontFamily: "'Syne', sans-serif" }}>Activa alertas de viaje</span>
                  <span style={{ opacity: 0.9, fontSize: 11 }}>Te alertaremos de nuevas órdenes para ganar dinero</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={handleActivarNotificaciones}
                  style={{
                    background: '#FFFFFF',
                    color: '#00A844',
                    border: 'none',
                    borderRadius: 10,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  Activar
                </button>
                <button
                  type="button"
                  onClick={() => setShowPermissionPrompt(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: 4,
                    opacity: 0.7,
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ RESPONSIVE STYLES ═══════ */}
        <style>{`
          .lf-rep-status-bar,
          .lf-rep-gesture-bar { display: flex !important; }

          /* iOS app container — solid iOS background, no theme flash */
          .lf-ios-app.lf-rep-shell {
            background: var(--ios-bg) !important;
            color: var(--ios-text-primary) !important;
          }

          /* iOS tab bar — visible at ALL widths (single source of truth) */
          .lf-ios-tabbar.lf-rep-bottom-nav {
            display: flex !important;
            -webkit-overflow-scrolling: touch;
          }

          /* Wider horizontal padding on desktop (only for non-servicio tabs,
             since servicio uses full-bleed absolute positioning for the map) */
          @media (min-width: 1024px) {
            .lf-rep-status-bar,
            .lf-rep-gesture-bar { display: none !important; }
            .lf-rep-large-title-wrap {
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
            .lf-rep-content.lf-ios-content > .lf-rep-pad {
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
            .lf-rep-snackbar,
            .lf-ios-snackbar {
              max-width: 480px;
              left: 50% !important;
              right: auto !important;
              transform: translateX(-50%);
            }
          }

          @media (pointer: coarse) {
            .lf-rep-status-bar,
            .lf-rep-gesture-bar { display: none !important; }
          }

          /* Header offset for status bar on mobile */
          @media (max-width: 1023px) {
            .lf-rep-header.lf-ios-header {
              top: max(24px, env(safe-area-inset-top, 24px)) !important;
            }
            .lf-rep-content.lf-ios-content {
              padding-top: calc(96px + max(24px, env(safe-area-inset-top, 24px))) !important;
            }
          }
          @media (max-width: 1023px) and (pointer: coarse) {
            .lf-rep-header.lf-ios-header {
              top: env(safe-area-inset-top, 0px) !important;
            }
            .lf-rep-content.lf-ios-content {
              padding-top: calc(96px + env(safe-area-inset-top, 0px)) !important;
            }
          }
        `}</style>
      </div>
    </SnackbarContext.Provider>
  );
}
