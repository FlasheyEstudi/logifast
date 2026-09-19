'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  Package,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  Settings,
  CheckCircle,
  AlertTriangle,
  Bike,
  Tag,
  Heart,
  Gift,
  Megaphone,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  X,
} from '@/components/icons';
import { useStore, type ClientModuleKey } from '@/lib/store';
import type { ClientNotificacion } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { LogoSpinner } from '@/components/ui/loaders';
import { realtime, onRealtimeEvent } from '@/services/realtime';
import { reproducirSonido } from '@/services/audio';
import { aplicarTema } from '@/store/configStore';
import {
  inicializarNotificacionesNativas,
  solicitarPermisoNotificacionesManual,
  dispararNotificacionNativa,
  notificarPedidoListoParaRetiro,
  notificarProgresoEnvio,
} from '@/services/native-notifications';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { HAPTIC_PATTERNS } from '@/services/haptics';
import SlidingPillTabBar from '@/components/ui/SlidingPillTabBar';

/* ═══════════════════════════════════════════════
   APPLE LIQUID GLASS SKELETON (FALLBACK TRANSLÚCIDO SUTIL)
   ═══════════════════════════════════════════════ */
function AppleLiquidGlassSkeleton() {
  return (
    <div className="w-full space-y-4 p-4">
      <div className="w-full h-44 rounded-3xl bg-slate-200/50 dark:bg-white/[0.04] backdrop-blur-xl border border-black/5 dark:border-white/10" />
      <div className="grid grid-cols-4 gap-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-200/50 dark:bg-white/[0.04] backdrop-blur-xl border border-black/5 dark:border-white/10" />
            <div className="w-10 h-3 rounded-full bg-slate-200/50 dark:bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CORE MODULE IMPORTS (INSTANTÁNEOS, 0ms DE LATENCIA)
   ═══════════════════════════════════════════════ */
import ClientInicio from './ClientInicio';
import ClientSolicitar from './ClientSolicitar';
import ClientEnvios from './ClientEnvios';
import ClientPerfil from './ClientPerfil';
import ClientExplorar from './ClientExplorar';
import ClientPedidos from './ClientPedidos';
import ClientTienda from './ClientTienda';
import ClientCarrito from './ClientCarrito';
import ClientBusqueda from './ClientBusqueda';
import ClientAyuda from './ClientAyuda';
import ClientPuntos from './ClientPuntos';
import ClientMiTienda from './ClientMiTienda';
import ClientTracking from './ClientTracking';
import ConfiguracionView from './ConfiguracionView';
import FacturaView from './FacturaView';
import ClientChat from './ClientChat';
import ClientRating from './ClientRating';

/* ═══════════════════════════════════════════════
   SNACKBAR CONTEXT
   ═══════════════════════════════════════════════ */
interface SnackbarData {
  message: string;
  action?: string;
  onAction?: () => void;
}

const SnackbarContext = createContext<(data: SnackbarData | null) => void>(() => {});
export function useSnackbar() {
  return useContext(SnackbarContext);
}

/* ═══════════════════════════════════════════════
   PROPS INTERFACE
   ═══════════════════════════════════════════════ */
interface ClientShellProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  userName: string;
  initialModule?: ClientModuleKey;
}

/* ═══════════════════════════════════════════════
   HELPERS & ICON UTILS
   ═══════════════════════════════════════════════ */
function getInitials(name: string): string {
  const parts = (name || 'Usuario').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

function SignalIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 16 12" fill="currentColor">
      <rect x="0" y="9" width="3" height="3" rx="0.5" />
      <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
      <rect x="9" y="3" width="3" height="9" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.4" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 16 12" fill="currentColor">
      <circle cx="8" cy="9" r="1.5" />
      <path d="M4.93 6.47a4.36 4.36 0 016.14 0" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M2.1 3.64a7.8 7.8 0 0111.8 0" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="currentColor">
      <rect x="0" y="0.5" width="19" height="11" rx="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <rect x="1.5" y="2" width="14" height="8" rx="1" />
      <rect x="19.5" y="3.5" width="2" height="5" rx="0.8" opacity="0.4" />
    </svg>
  );
}

function getNotifIcon(tipo: ClientNotificacion['tipo']): { icon: React.ReactNode; color: string } {
  switch (tipo) {
    case 'orden_confirmada': return { icon: <CheckCircle size={18} />, color: 'var(--exito)' };
    case 'repartidor_asignado': return { icon: <User size={18} />, color: '#2979FF' };
    case 'repartidor_camino': return { icon: <Bike size={18} />, color: '#FF9800' };
    case 'paquete_recogido': return { icon: <Package size={18} />, color: '#2979FF' };
    case 'entrega_exitosa': return { icon: <CheckCircle size={20} />, color: 'var(--exito)' };
    case 'incidencia': return { icon: <AlertTriangle size={18} />, color: 'var(--peligro)' };
    case 'codigo_nuevo': return { icon: <Tag size={18} />, color: '#FF9800' };
    case 'te_extranamos': return { icon: <Heart size={18} />, color: '#E91E63' };
    default: return { icon: <Bell size={18} />, color: '#FF5722' };
  }
}

/* ═══════════════════════════════════════════════
   NAV CONFIG — iOS native tab bar (5 items)
   Inicio | Envíos | Pedidos | Billetera | Perfil
   ═══════════════════════════════════════════════ */
interface NavItem {
  key: ClientModuleKey;
  label: string;
  Icon: () => React.ReactElement;
}

/* ─── SVG inline icons — funciones (no JSX estático) para heredar color en móvil ─── */
function IcoInicio()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>; }
function IcoExplorar()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}><path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M9 12h1.5M9 8h6M9 16h4"/><circle cx="15" cy="14" r="2"/></svg>; }
function IcoEnvios()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}><path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>; }
function IcoPedidos()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>; }
function IcoBilletera() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="14.5" r="1.2" fill="currentColor" stroke="none"/></svg>; }
function IcoPerfil()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0116 0v1"/></svg>; }

function IcoTiendaReturn() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

const STORE_NAV_ITEMS: NavItem[] = [
  { key: 'tienda', label: 'Mi Tienda', Icon: IcoPerfil },
  { key: 'perfil', label: 'Modo Cliente', Icon: IcoTiendaReturn },
];

const NAV_ITEMS: NavItem[] = [
  { key: 'inicio',   label: 'Inicio',    Icon: IcoInicio },
  { key: 'explorar', label: 'Explorar',  Icon: IcoExplorar },
  { key: 'envios',   label: 'Envíos',    Icon: IcoEnvios },
  { key: 'pedidos',  label: 'Pedidos',   Icon: IcoPedidos },
  { key: 'puntos',   label: 'Billetera', Icon: IcoBilletera },
  { key: 'perfil',   label: 'Perfil',    Icon: IcoPerfil },
];

/* ─── iOS Large Title map (header) ─── */
const IOS_TITLE_MAP: Record<ClientModuleKey, string> = {
  inicio: 'Inicio',
  solicitar: 'Nuevo Envío',
  envios: 'Mis Envíos',
  explorar: 'Explorar',
  pedidos: 'Mis Pedidos',
  perfil: 'Perfil',
  ayuda: 'Ayuda',
  puntos: 'Billetera',
  tienda: 'Mi Tienda',
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

/* ─── Formato relativo para el centro de notificaciones ─── */
function tiempoRelativo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString('es-NI', { day: 'numeric', month: 'short' });
}

/* Icono por tipo de notificación (sistema de diseño: iconos, nunca emoji) */
const ICONO_POR_TIPO: Record<string, typeof Bell> = {
  promocion: Gift,
  marketing: Megaphone,
  sistema: Bell,
  codigo_nuevo: Tag,
  orden_confirmada: Package,
  repartidor_asignado: Bike,
  repartidor_camino: Bike,
  paquete_recogido: Package,
  entrega_exitosa: CheckCircle,
  incidencia: AlertTriangle,
  te_extranamos: Heart,
};

export default function ClientShell({ isDark, toggleTheme, onLogout, userName, initialModule }: ClientShellProps) {
  const {
    clientActiveModule,
    clientModuleFade,
    setClientActiveModule,
    clientNotificaciones,
    clientNotifOpen,
    setClientNotifOpen,
    markClientNotifRead,
    markAllClientNotifRead,
    setClientNotificaciones,
    agregarNotificacionCliente,
    trackingOrderId,
    chatOpen,
    ratingModalOpen,
    setTrackingOrder,
    setChatOpen,
    setChatOrderId,
    setRatingModalOpen,
    setRatingOrderId,
    fetchOrders,
    orders,
  } = useStore();

  const { tiendaSeleccionada, carritoOpen, setCarritoOpen, setTiendaSeleccionada, getCartItemCount, fetchTiendas, fetchOrdenesCompra, fetchFavoritos, fetchCarrito, ordenesCompra } = useMarketplaceStore();

  /* ─── Prompt de Permisos de Notificación (pre-permiso explicativo) ─── */
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permisoBloqueado, setPermisoBloqueado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    // Ya se le explicó antes: no volver a insistir en cada arranque.
    const yaExplicado =
      typeof window !== 'undefined' && localStorage.getItem('lf_notif_prompt_done') === 'true';

    // Solo VERIFICA el permiso (no lo pide): el diálogo del sistema se lanza
    // únicamente cuando el usuario toca "Activar" en la pantalla explicativa.
    inicializarNotificacionesNativas()
      .then((granted) => {
        if (cancelado || granted || yaExplicado) return;
        const permiso =
          typeof window !== 'undefined' && 'Notification' in window
            ? Notification.permission
            : 'default';
        if (permiso === 'default') {
          setShowPermissionPrompt(true);
        } else if (permiso === 'denied') {
          setPermisoBloqueado(true);
        }
      })
      .catch(() => null);

    return () => {
      cancelado = true;
    };
  }, []);

  const handleActivarNotificaciones = async () => {
    const granted = await solicitarPermisoNotificacionesManual();
    try {
      localStorage.setItem('lf_notif_prompt_done', 'true');
    } catch {}
    setShowPermissionPrompt(false);
    if (granted) {
      // Notificación de prueba: el usuario comprueba en el acto que suenan.
      dispararNotificacionNativa({
        titulo: '¡Notificaciones activadas!',
        cuerpo: 'Así te avisaremos: tu pedido en camino, el repartidor en tu puerta y las promociones.',
        tipoAlerta: 'exito',
        canalId: 'logifast_estado',
        mostrarBannerInApp: false,
      });
    } else {
      setPermisoBloqueado(true);
    }
  };

  const handleAhoraNo = () => {
    try {
      localStorage.setItem('lf_notif_prompt_done', 'true');
    } catch {}
    setShowPermissionPrompt(false);
  };

  /* ─── Centro de notificaciones: carga real desde la API ─── */
  useEffect(() => {
    let cancelado = false;

    const cargar = () => {
      fetch('/api/notificaciones-push', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelado || !data?.notificaciones) return;
          setClientNotificaciones(
            data.notificaciones.map((n: any) => ({
              id: n.id,
              tipo: n.tipo || 'sistema',
              titulo: n.titulo,
              descripcion: n.contenido,
              leida: !!n.leida,
              relacionadoId: n.entidadId || undefined,
              timestamp: n.createdAt || new Date().toISOString(),
            }))
          );
        })
        .catch(() => null);
    };

    cargar();
    // Reintento al volver del segundo plano (la PWA/APK puede quedar suspendida)
    const onVisible = () => { if (document.visibilityState === 'visible') cargar(); };
    document.addEventListener('visibilitychange', onVisible);

    // Avisos en vivo del administrador (campañas, promociones, difusiones)
    const off = onRealtimeEvent('notificacion:push', (data: any) => {
      const titulo = data?.titulo || 'LogiFast';
      const descripcion = data?.contenido || '';
      agregarNotificacionCliente({
        id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tipo: data?.tipo || 'sistema',
        titulo,
        descripcion,
        leida: false,
        relacionadoId: data?.entidadId || undefined,
        timestamp: new Date().toISOString(),
      });

      // Notificación nativa real en el celular (bandeja de Android)
      dispararNotificacionNativa({
        titulo,
        cuerpo: descripcion,
        tipoAlerta: data?.tipo === 'promocion' || data?.tipo === 'marketing' ? 'orden' : 'mensaje',
        extra: data?.entidadId ? { ordenId: data.entidadId, entidadId: data.entidadId } : undefined,
      }).catch(() => null);

      reproducirSonido('mensaje');
      cargar();
    });

    return () => {
      cancelado = true;
      document.removeEventListener('visibilitychange', onVisible);
      off();
    };
  }, [setClientNotificaciones, agregarNotificacionCliente]);

  /* ─── Deep link desde una notificación nativa (tap en la bandeja de Android) ─── */
  useEffect(() => {
    const onAbrir = (e: Event) => {
      const detalle = (e as CustomEvent).detail as { vista?: string; ordenId?: string };
      if (!detalle?.ordenId) return;
      if (detalle.vista === 'chat') {
        setChatOrderId(detalle.ordenId);
        setChatOpen(true);
      } else {
        setTrackingOrder(detalle.ordenId);
      }
    };
    window.addEventListener('logifast:abrir', onAbrir as EventListener);
    return () => window.removeEventListener('logifast:abrir', onAbrir as EventListener);
  }, [setChatOpen, setChatOrderId, setTrackingOrder]);

  const abrirNotificaciones = useCallback(() => {
    const abriendo = !clientNotifOpen;
    setClientNotifOpen(abriendo);
    if (abriendo && clientNotificaciones.some((n) => !n.leida)) {
      markAllClientNotifRead();
      fetch('/api/notificaciones-push', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => null);
    }
  }, [clientNotifOpen, clientNotificaciones, setClientNotifOpen, markAllClientNotifRead]);

  /* ─── Detección de Orden Activa para Barra de Progreso en Tiempo Real ─── */
  const activeOrder = useMemo(() => {
    const uncompletedEnvio = (orders || []).find(
      (o: any) => o.estado !== 'entregado' && (o.estado as string) !== 'cancelado' && o.status !== 'entregado' && o.status !== 'cancelado'
    );
    if (uncompletedEnvio) {
      const ordAny = uncompletedEnvio as any;
      const rawRep = ordAny.repartidor;
      const repNombre =
        typeof rawRep === 'object' && rawRep !== null
          ? (rawRep.nombre || rawRep.name)
          : (typeof rawRep === 'string' && rawRep.trim() !== '' ? rawRep : (ordAny.repartidorNombre || undefined));
      return {
        id: uncompletedEnvio.id,
        estado: ordAny.estado || ordAny.status || 'pendiente',
        origen: uncompletedEnvio.origen,
        destino: uncompletedEnvio.destino,
        repartidorNombre: repNombre,
        tiempoEstimadoMin: ordAny.tiempoEstimado || 12,
      };
    }

    const uncompletedCompra = (ordenesCompra || []).find(
      (o: any) => o.estado !== 'entregado' && (o.estado as string) !== 'cancelado'
    );
    if (uncompletedCompra) {
      const c = uncompletedCompra as any;
      const rawRep = c.repartidor;
      const repNombre =
        typeof rawRep === 'object' && rawRep !== null
          ? (rawRep.nombre || rawRep.name)
          : (typeof rawRep === 'string' && rawRep.trim() !== '' ? rawRep : (c.repartidorNombre || undefined));
      return {
        id: c.id,
        estado: c.estado || 'recibido',
        origen: c.tienda?.nombre || c.tiendaNombre || 'Comercio',
        destino: c.direccionEntrega || 'Tu dirección',
        repartidorNombre: repNombre,
        tiempoEstimadoMin: c.tiempoEstimado || 15,
      };
    }

    return null;
  }, [orders, ordenesCompra]);

  /* ─── Notificaciones NATIVAS del sistema por cambios de estado del pedido.
         Se ven con el celular bloqueado o en la bandeja de notificaciones;
         no se muestra nada dentro de la app. Sin emojis (texto limpio). ─── */
  const ultimoEstadoNotifRef = useRef<string>('');
  const [subview, setSubview] = useState<'configuracion' | 'factura' | null>(null);
  useEffect(() => {
    if (!activeOrder?.id) return;
    const etiquetas: Record<string, { titulo: string; cuerpo: string }> = {
      preparando: { titulo: 'Tu pedido está en preparación', cuerpo: 'La tienda ya está preparando tu pedido.' },
      preparada: { titulo: 'Tu pedido está listo', cuerpo: 'La tienda terminó de preparar tu pedido.' },
      en_camino: { titulo: 'Tu repartidor va en camino', cuerpo: 'El repartidor va en camino a tu dirección.' },
      recogido: { titulo: 'Tu pedido fue recogido', cuerpo: 'El repartidor ya recogió tu pedido.' },
      entregado: { titulo: 'Tu pedido fue entregado', cuerpo: 'Tu pedido fue entregado correctamente.' },
      cancelado: { titulo: 'Tu pedido fue cancelado', cuerpo: 'Tu pedido fue cancelado.' },
      incidencia: { titulo: 'Incidencia con tu pedido', cuerpo: 'Se reportó una incidencia con tu pedido.' },
    };
    const off = onRealtimeEvent('orden:estado:update', (d: { ordenId?: string; id?: string; estado?: string }) => {
      const oid = d?.ordenId || d?.id;
      if (!oid || String(oid) !== String(activeOrder.id) || !d?.estado) return;
      const estado = String(d.estado).toLowerCase();
      if (ultimoEstadoNotifRef.current === estado) return;
      ultimoEstadoNotifRef.current = estado;
      const et = etiquetas[estado];
      if (!et) return;
      dispararNotificacionNativa({
        titulo: et.titulo,
        cuerpo: et.cuerpo,
        canalId: 'logifast_estado',
        categoriaAcciones: 'ORDEN_ESTADO',
        tipoAlerta: estado === 'incidencia' || estado === 'cancelado' ? 'alerta' : estado === 'entregado' ? 'exito' : 'orden',
        mostrarBannerInApp: false,
      }).catch(() => null);
    });
    return off;
  }, [activeOrder?.id]);

  useEffect(() => {
    if (activeOrder?.id) {
      realtime.clienteTrackingUnirse(String(activeOrder.id));
    }
  }, [activeOrder?.id]);

  /* ─── Detección de "Pedido Listo para Retiro" (Comercios y Marketplace) ─── */
  const lastEstadosCompraRef = useRef<Record<string, string>>({});
  useEffect(() => {
    (ordenesCompra || []).forEach((oc) => {
      const prev = lastEstadosCompraRef.current[oc.id];
      if (prev && prev !== 'listo' && oc.estado === 'listo') {
        notificarPedidoListoParaRetiro({
          ordenId: oc.id,
          tiendaNombre: oc.tiendaNombre || (oc as any).tienda?.nombre || 'El comercio',
          esPickUpCliente: (oc as any).metodoEntrega === 'retiro',
        }).catch(() => null);
      }
      lastEstadosCompraRef.current[oc.id] = oc.estado;
    });
  }, [ordenesCompra]);

  /* ─── Sync Dynamic URL Hash & Soporte para Gesto Atrás Móvil (popstate) ─── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inicializar estado del historial si es la primera carga
    if (!window.history.state || window.history.state.type !== 'client_module') {
      window.history.replaceState({ type: 'client_module', module: clientActiveModule }, '', `/cliente/${clientActiveModule}`);
    }

    const handlePopState = (e: PopStateEvent) => {
      // 1. Si hay sub-vistas / modales abiertos, el gesto atrás los cierra primero
      const mState = useMarketplaceStore.getState();
      const sState = useStore.getState();

      if (mState.carritoOpen) {
        mState.setCarritoOpen(false);
        return;
      }
      if (mState.tiendaSeleccionada) {
        mState.setTiendaSeleccionada(null);
        return;
      }
      if (sState.trackingOrderId) {
        sState.setTrackingOrder(null);
        return;
      }
      if (sState.chatOpen) {
        sState.setChatOpen(false);
        return;
      }
      if (sState.ratingModalOpen) {
        sState.setRatingModalOpen(false);
        return;
      }
      if (sState.clientNotifOpen) {
        sState.setClientNotifOpen(false);
        return;
      }

      // 2. Si es cambio de módulo por navegación de historial
      if (e.state && e.state.type === 'client_module' && e.state.module) {
        setClientActiveModule(e.state.module);
        if (e.state.module !== 'explorar') {
          mState.setTiendaSeleccionada(null);
        }
      } else {
        // Si retrocede al inicio
        if (clientActiveModule !== 'inicio') {
          setClientActiveModule('inicio');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [clientActiveModule, setClientActiveModule]);

  /* ─── Módulo inicial desde la ruta real (/cliente/<mod>) o hash antiguo ─── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mod: ClientModuleKey | undefined = initialModule;
    if (!mod) {
      const seg = window.location.pathname.split('/').filter(Boolean);
      if (seg[0] === 'cliente' && seg[1]) mod = seg[1] as ClientModuleKey;
    }
    if (!mod && window.location.hash.startsWith('#/cliente/')) {
      mod = window.location.hash.replace('#/cliente/', '') as ClientModuleKey;
    }
    if (mod && mod !== 'inicio') setClientActiveModule(mod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialModule, setClientActiveModule]);

  /* ─── Receptor de Ubicación Compartida Externa (WhatsApp, Telegram, Google Maps) ─── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const navegarASolicitar = () => {
      const mState = useMarketplaceStore.getState();
      const sState = useStore.getState();

      if (mState.carritoOpen) mState.setCarritoOpen(false);
      if (mState.tiendaSeleccionada) mState.setTiendaSeleccionada(null);
      if (sState.trackingOrderId) sState.setTrackingOrder(null);
      if (sState.chatOpen) sState.setChatOpen(false);
      if (sState.ratingModalOpen) sState.setRatingModalOpen(false);
      if (sState.clientNotifOpen) sState.setClientNotifOpen(false);

      setClientActiveModule('solicitar');
    };

    // Registrar manejador directo accesible desde MainActivity (WebView evaluateJavascript)
    (window as any).__LOGIFAST_HANDLE_SHARED__ = (text: string) => {
      navegarASolicitar();
      window.dispatchEvent(new CustomEvent('logifast:sharedLocation', { detail: { text } }));
    };

    const handleSharedEvent = () => {
      navegarASolicitar();
    };

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/cliente/')) {
        const mod = hash.replace('#/cliente/', '') as ClientModuleKey;
        if (mod && mod !== clientActiveModule) {
          if (mod === 'solicitar') {
            navegarASolicitar();
          } else {
            setClientActiveModule(mod);
          }
        }
      }
    };

    window.addEventListener('logifast:sharedLocation', handleSharedEvent);
    window.addEventListener('hashchange', handleHashChange);

    try {
      const pending =
        (window as any).__LOGIFAST_SHARED_LOCATION__ ||
        sessionStorage.getItem('logifast_shared_location');
      if (pending) {
        navegarASolicitar();
      }
    } catch {}

    return () => {
      window.removeEventListener('logifast:sharedLocation', handleSharedEvent);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [clientActiveModule, setClientActiveModule]);

  /* ─── Cargar datos del backend al montar y sincronizar en segundo plano ─── */
  useEffect(() => {
    fetchTiendas();
    fetchOrdenesCompra();
    fetchFavoritos();
    fetchCarrito();
    fetchOrders(); // P1: cargar envíos del cliente desde la BD

    // Sync en segundo plano cada 3 segundos sin recargar pantalla
    const pollInterval = setInterval(() => {
      fetchOrdenesCompra();
      fetchOrders();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [fetchTiendas, fetchOrdenesCompra, fetchFavoritos, fetchCarrito, fetchOrders]);

  /* ─── THEME SYNC — Asegura que el modo oscuro aplique a todo el DOM y CSS vars ─── */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    aplicarTema(isDark ? 'dark' : 'light');
  }, [isDark]);

  /* ─── SPLASH STATE (solo una vez por sesión para fluidez total) ─── */
  const [showSplash, setShowSplash] = useState(false);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const alreadyShown = sessionStorage.getItem('client_splash_shown');
        if (!alreadyShown) {
          sessionStorage.setItem('client_splash_shown', 'true');
          setShowSplash(true);
        }
      } catch {}
    }
  }, []);

  /* ─── SNACKBAR STATE ─── */
  const [snackbar, setSnackbar] = useState<SnackbarData | null>(null);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = (clientNotificaciones || []).filter((n) => !n.leida).length;
  const initials = getInitials(userName);

  /* ─── Active orders count for Pedidos badge (envíos + compras no entregadas) ─── */
  const activeOrdersCount =
    (orders || []).filter((o) => !['entregado', 'incidencia'].includes(o.estado)).length +
    (ordenesCompra || []).filter((o) => o.estado !== 'entregado').length;

  /* ─── iOS Large Title for current module ─── */
  const iosTitle = IOS_TITLE_MAP[clientActiveModule] || 'Logifast';

  /* ─── SPLASH TIMER (rápido y no bloqueante) ─── */
  useEffect(() => {
    if (!showSplash) return;
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 600);
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [showSplash]);

  /* ─── SNACKBAR AUTO-DISMISS ─── */
  const showSnackbar = useCallback((data: SnackbarData | null) => {
    if (snackbarTimerRef.current) clearTimeout(snackbarTimerRef.current);
    setSnackbar(data);
    if (data) {
      snackbarTimerRef.current = setTimeout(() => {
        setSnackbar(null);
      }, 4000);
    }
  }, []);

  /* ─── REALTIME CHAT & ORDER TRACKING ROOMS ─── */
  useEffect(() => {
    const activeOrderIds = [
      ...(orders || []).filter((o) => !['entregado', 'incidencia'].includes(o.estado)).map((o) => o.id),
      ...(ordenesCompra || []).filter((o) => o.estado !== 'entregado').map((o) => o.id),
    ];
    activeOrderIds.forEach((id) => {
      if (id) realtime.clienteTrackingUnirse(id);
    });
  }, [orders, ordenesCompra]);

  /* ─── ALERTA SONORA Y HÁPTICA POR CAMBIO DE ESTADO DE LA ORDEN ACTIVA ─── */
  const prevActiveOrderStateRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeOrder) {
      prevActiveOrderStateRef.current = null;
      return;
    }
    const currentEstado = String(activeOrder.estado || '').toLowerCase().trim();
    const prev = prevActiveOrderStateRef.current;

    if (prev !== null && prev !== currentEstado) {
      // Cambio de estado detectado: emitir alerta sonora específica y vibración
      if (currentEstado.includes('entregad')) {
        reproducirSonido('orden_entregada', 100);
        HAPTIC_PATTERNS.success();
      } else if (currentEstado.includes('puerta') || currentEstado.includes('llegad') || currentEstado.includes('cerca')) {
        reproducirSonido('nueva_orden', 100);
        HAPTIC_PATTERNS.llegadaPuerta();
      } else if (currentEstado.includes('recogid') || currentEstado.includes('camino')) {
        reproducirSonido('ruta_optimizada', 90);
        HAPTIC_PATTERNS.medium();
      } else if (currentEstado.includes('asigna') || currentEstado.includes('acepta')) {
        reproducirSonido('orden_aceptada', 90);
        HAPTIC_PATTERNS.medium();
      } else {
        reproducirSonido('notificacion', 85);
        HAPTIC_PATTERNS.light();
      }

      notificarProgresoEnvio({
        ordenId: String(activeOrder.id),
        porcentaje: currentEstado.includes('entregad') ? 100 : currentEstado.includes('puerta') ? 95 : currentEstado.includes('camino') ? 75 : 40,
        etapaTexto: activeOrder.repartidorNombre ? `${activeOrder.repartidorNombre} actualizó tu entrega` : 'Actualización de tu pedido',
        subtitulo: `Estado: ${activeOrder.estado}`,
      }).catch(() => null);
    }

    prevActiveOrderStateRef.current = currentEstado;
  }, [activeOrder?.id, activeOrder?.estado, activeOrder?.repartidorNombre]);

  useEffect(() => {
    const cleanupChat = onRealtimeEvent('chat:mensaje:nuevo', (msg) => {
      if (!msg) return;
      const isFromAdmin = msg.emisor === 'admin' || msg.emisorId === 'admin' || msg.esAdmin;
      const isFromRider = msg.emisor === 'repartidor';

      if (isFromAdmin || isFromRider) {
        reproducirSonido('mensaje', 90);
        HAPTIC_PATTERNS.mensaje();
        const isChatCurrentlyOpen = useStore.getState().chatOpen;
        const currentChatOrderId = useStore.getState().chatOrderId;
        if (!isChatCurrentlyOpen || (msg.ordenId && currentChatOrderId !== msg.ordenId)) {
          showSnackbar({
            message: isFromAdmin
              ? `Soporte LOGIFAST: "${(msg.contenido || '').slice(0, 40)}${(msg.contenido || '').length > 40 ? '...' : ''}"`
              : `Mensaje de tu repartidor: "${(msg.contenido || '').slice(0, 40)}${(msg.contenido || '').length > 40 ? '...' : ''}"`,
            action: 'Responder',
            onAction: () => {
              if (msg.ordenId) setChatOrderId(msg.ordenId);
              setChatOpen(true);
            },
          });
        }
      }
    });

    // Eventos realtime de actualización inmediata de órdenes
    const cleanupOrdenUpdate = onRealtimeEvent('orden:estado:update', (data) => {
      if (data?.id) {
        const orderIdStr = String(data.id);
        const nuevoEstado = data.estado || 'aceptado';
        const repNom = data.repartidor?.nombre || data.repartidor?.user?.name || data.repartidorNombre;
        const linkedIds = Array.isArray(data.linkedCompraIds) ? data.linkedCompraIds.map(String) : [];

        useStore.setState((state) => ({
          orders: (state.orders || []).map((o) =>
            String(o.id) === orderIdStr || linkedIds.includes(String(o.id))
              ? {
                  ...o,
                  estado: nuevoEstado,
                  repartidor: repNom || o.repartidor,
                  repartidorNombre: repNom || (o as any).repartidorNombre,
                }
              : o
          ),
        }));

        useMarketplaceStore.setState((state) => ({
          ordenesCompra: (state.ordenesCompra || []).map((oc) =>
            String(oc.id) === orderIdStr || linkedIds.includes(String(oc.id))
              ? {
                  ...oc,
                  estado: nuevoEstado === 'aceptado' ? 'en_camino' : nuevoEstado,
                  repartidorNombre: repNom || oc.repartidorNombre,
                }
              : oc
          ),
        }));
      }
      fetchOrders();
      fetchOrdenesCompra();
    });
    const cleanupRiderUpdate = onRealtimeEvent('repartidor:estado:update', () => {
      fetchOrders();
      fetchOrdenesCompra();
    });

    return () => {
      cleanupChat();
      cleanupOrdenUpdate();
      cleanupRiderUpdate();
    };
  }, [showSnackbar, setChatOrderId, setChatOpen, fetchOrders, fetchOrdenesCompra]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Close dropdowns on escape */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setClientNotifOpen(false);
        setAvatarOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [setClientNotifOpen]);



  const handleNav = useCallback(
    (mod: ClientModuleKey, pushHistory = true) => {
      // Subvistas de perfil (sin recarga de página): configuración y factura
      if ((mod as string) === 'configuracion' || (mod as string) === 'factura') {
        setSubview(mod as 'configuracion' | 'factura');
        return;
      }
      if (mod === clientActiveModule) return;

      if (pushHistory && typeof window !== 'undefined') {
        window.history.pushState({ type: 'client_module', module: mod }, '', `/cliente/${mod}`);
      }

      setClientActiveModule(mod);
      setTrackingOrder(null);
      if (mod !== 'explorar') {
        setTiendaSeleccionada(null);
      }
    },
    [clientActiveModule, setClientActiveModule, setTrackingOrder, setTiendaSeleccionada]
  );

  const handleOpenTracking = useCallback(
    (orderId: string) => {
      setTrackingOrder(orderId);
    },
    [setTrackingOrder]
  );

  const handleCloseTracking = useCallback(
    () => setTrackingOrder(null),
    [setTrackingOrder]
  );

  const handleOpenChat = useCallback(
    (orderId: string) => {
      setChatOrderId(orderId);
      setChatOpen(true);
    },
    [setChatOrderId, setChatOpen]
  );

  const handleOpenRating = useCallback(
    (orderId: string) => {
      setRatingOrderId(orderId);
      setRatingModalOpen(true);
    },
    [setRatingOrderId, setRatingModalOpen]
  );

  /* ─── NAVEGACIÓN Y KEEP-ALIVE DE PESTAÑAS (TRANSICIONES INSTANTÁNEAS 0ms) ─── */
  const CORE_CLIENT_TABS: ClientModuleKey[] = ['inicio', 'solicitar', 'explorar', 'envios', 'pedidos', 'puntos', 'perfil'];
  const [visitedTabs, setVisitedTabs] = useState<Set<ClientModuleKey>>(() => new Set(['inicio', clientActiveModule]));

  useEffect(() => {
    if (CORE_CLIENT_TABS.includes(clientActiveModule)) {
      setVisitedTabs((prev) => {
        if (prev.has(clientActiveModule)) return prev;
        const next = new Set(prev);
        next.add(clientActiveModule);
        return next;
      });
    }
  }, [clientActiveModule]);

  // Refrescar órdenes discretamente en segundo plano al cambiar a envíos o pedidos
  useEffect(() => {
    if (clientActiveModule === 'envios') {
      fetchOrders();
    } else if (clientActiveModule === 'pedidos') {
      fetchOrdenesCompra();
    }
  }, [clientActiveModule, fetchOrders, fetchOrdenesCompra]);

  const renderCoreTab = (key: ClientModuleKey) => {
    const moduleProps = {
      isDark,
      userName,
      onNavigate: handleNav,
      onOpenTracking: handleOpenTracking,
      onOpenChat: handleOpenChat,
      onOpenRating: handleOpenRating,
    };
    const perfilProps = { ...moduleProps, onLogout };
    switch (key) {
      case 'inicio':
        return <ClientInicio {...moduleProps} />;
      case 'solicitar':
        return <ClientSolicitar {...moduleProps} />;
      case 'explorar':
        return <ClientExplorar {...moduleProps} />;
      case 'envios':
        return <ClientEnvios {...moduleProps} />;
      case 'pedidos':
        return <ClientPedidos {...moduleProps} />;
      case 'puntos':
        return <ClientPuntos isDark={isDark} onNavigate={handleNav} />;
      case 'perfil':
        return <ClientPerfil {...perfilProps} />;
      default:
        return null;
    }
  };

  const renderSubModule = (key: ClientModuleKey) => {
    switch (key) {
      case 'tienda':
        return (
          <ClientMiTienda
            isDark={isDark}
            toggleTheme={toggleTheme}
            onReturnToClient={() => setClientActiveModule('perfil')}
          />
        );
      case 'ayuda':
        return <ClientAyuda isDark={isDark} onClose={() => setClientActiveModule('perfil')} />;
      case 'puntos':
        return <ClientPuntos isDark={isDark} onClose={() => setClientActiveModule('perfil')} />;
      default:
        return null;
    }
  };

  if (clientActiveModule === 'tienda') {
    return (
      <SnackbarContext.Provider value={showSnackbar}>
        <div
          className={`lf-tienda-fullscreen w-full h-screen h-[100dvh] overflow-hidden ${isDark ? 'dark' : 'light'}`}
          data-theme={isDark ? 'dark' : 'light'}
          style={{
            position: 'fixed',
            inset: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9990,
            width: '100vw',
            maxWidth: '100vw',
            minWidth: '100vw',
            height: '100dvh',
            overflow: 'hidden',
          }}
        >
          <ClientMiTienda
            isDark={isDark}
            toggleTheme={toggleTheme}
            onReturnToClient={() => setClientActiveModule('perfil')}
          />
        </div>
      </SnackbarContext.Provider>
    );
  }

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      <div
        className={`cliente-app lf-ios-app ${isDark ? 'dark' : 'light'}`}
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
        {/* ═══════ SPLASH SCREEN — iOS native ═══════ */}
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: splashFading ? 0 : 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="lf-ios-splash"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'var(--ios-bg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              style={{
                width: 76,
                height: 76,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #007AFF, #0056B3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 12px 36px rgba(255, 87, 34, 0.28)',
              }}
            >
              <Bike size={34} />
            </motion.div>
            {/* Brand text */}
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.2, 0, 0, 1] }}
              style={{
                fontFamily: 'var(--ios-font)',
                fontWeight: 700,
                fontSize: 22,
                color: 'var(--ios-text-primary)',
                marginTop: 20,
                letterSpacing: '-0.02em',
              }}
            >
              LOGIFAST
            </motion.span>
          </motion.div>
        )}

        {/* ═══════ NATIVE STATUS BAR (mobile) ═══════ */}
        <div
          className="lf-status-bar"
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
          {/* Left: Time */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--md-on-surface)',
              lineHeight: 1,
            }}
          >
            9:41
          </span>
          {/* Right: Signal + Wifi + Battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--md-on-surface)' }}>
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* ═══════ ANDROID GESTURE BAR (mobile) ═══════ */}
        <div
          className="lf-gesture-bar"
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
              background: 'var(--md-on-surface-variant)',
              opacity: 0.3,
            }}
          />
        </div>

        {/* ═══════ HEADER FLOTANTE CÁPSULA PREMIUM (CLIENTE) ═══════ */}
        <header
            style={{
              position: 'fixed',
              top: 'calc(env(safe-area-inset-top, 10px) + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9980,
              width: 'calc(100vw - 28px)',
              maxWidth: 680,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 8px 7px 18px',
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
            {/* Left: título del módulo */}
            <span style={{ fontSize: 14, fontWeight: 800, color: isDark ? '#FFFFFF' : '#1C1C1E', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
              {iosTitle}
            </span>

            {/* Right: acciones en cápsula compacta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 100, padding: '4px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)' }}>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', color: isDark ? '#FFD60A' : '#FF9500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              >
                {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
              </button>

              {/* Bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { abrirNotificaciones(); setAvatarOpen(false); }}
                  aria-label="Notificaciones"
                  style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: clientNotifOpen ? 'var(--primario)' : 'transparent', color: clientNotifOpen ? '#fff' : isDark ? '#98989D' : '#636366', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.2s' }}
                >
                  <Bell size={16} strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 1, right: 1, width: 13, height: 13, borderRadius: '50%', background: 'var(--peligro)', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Cart */}
              <button
                onClick={() => setCarritoOpen(true)}
                aria-label="Carrito"
                style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: carritoOpen ? 'var(--primario)' : 'transparent', color: carritoOpen ? '#fff' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.2s' }}
              >
                <ShoppingBag size={16} strokeWidth={1.8} />
                {getCartItemCount() > 0 && (
                  <span style={{ position: 'absolute', top: 0, right: 0, minWidth: 13, height: 13, borderRadius: 7, padding: '0 3px', background: 'var(--peligro)', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    {getCartItemCount() > 9 ? '9+' : getCartItemCount()}
                  </span>
                )}
              </button>
            </div>
          </header>
        {/* ─── CONTENT AREA (Navegación controlada exclusivamente por TabBar) ─── */}
        <main
          style={{
            flex: 1,
            paddingTop: 'calc(58px + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(var(--ios-tabbar-height) + var(--ios-tabbar-safe) + 16px)',
            minHeight: '100vh',
            backgroundColor: 'var(--ios-bg)',
            maxWidth: 600,
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            transition: 'padding 0.3s ease, background-color 0.3s ease',
          }}
          className="lf-client-content-padded lf-ios-content"
        >
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto',
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 4,
              paddingBottom: 16,
            }}
            className="lf-client-inner-pad"
          >
            {/* ─── PESTAÑAS PRINCIPALES CON KEEP-ALIVE (0ms DE LATENCIA, SIN SKELETONS) ─── */}
            {Array.from(visitedTabs).map((tabKey) => {
              const isCurrent = clientActiveModule === tabKey;
              return (
                <div
                  key={tabKey}
                  style={{
                    display: isCurrent ? 'block' : 'none',
                    width: '100%',
                  }}
                  className={isCurrent ? 'lf-screen-fade-in' : ''}
                >
                  {renderCoreTab(tabKey)}
                </div>
              );
            })}

            {/* ─── SUBMÓDULOS SECUNDARIOS (Tienda, Ayuda, Puntos) ─── */}
            {!CORE_CLIENT_TABS.includes(clientActiveModule) && (
              <div className="lf-screen-fade-in" style={{ width: '100%' }}>
                {renderSubModule(clientActiveModule)}
              </div>
            )}
          </div>
        </main>

        {/* Subvistas de perfil: Configuración y Factura (dentro de la app, sin recargar) */}
        <AnimatePresence>
          {subview === 'configuracion' && (
            <motion.div
              key="configuracion"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              style={{ position: 'fixed', inset: 0, zIndex: 9996, backgroundColor: 'var(--bg)', color: 'var(--text)', overflowY: 'auto' }}
            >
              <ConfiguracionView
                onClose={() => setSubview(null)}
                onLogout={onLogout}
                onVerFactura={() => setSubview('factura')}
              />
            </motion.div>
          )}
          {subview === 'factura' && (
            <motion.div
              key="factura"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              style={{ position: 'fixed', inset: 0, zIndex: 9996, backgroundColor: 'var(--bg)', color: 'var(--text)', overflowY: 'auto' }}
            >
              <FacturaView onClose={() => setSubview(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ NAVBAR FLOTANTE CÁPSULA PREMIUM (CLIENTE) ═══════ */}
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
          <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 460 }}>
            <SlidingPillTabBar
              items={NAV_ITEMS.map((it) => ({
                key: it.key,
                label: it.label,
                icon: <it.Icon />,
                badge: it.key === 'pedidos' ? activeOrdersCount : undefined,
              }))}
              activeKey={clientActiveModule}
              onChange={(key) => handleNav(key as ClientModuleKey)}
              isDark={isDark}
              accentColor="var(--primario)"
              ariaLabel="Navegación principal de cliente"
            />
          </div>
        </div>

        {/* ═══════ iOS SNACKBAR ═══════ */}
        <AnimatePresence>
          {snackbar && (
            <motion.div
              key="snackbar"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="lf-snackbar visible lf-ios-snackbar"
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
                justifyContent: 'space-between',
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

        {/* ─── FULL-SCREEN SUBPAGES (100% Pantalla Completa — No Bottom Sheets) ─── */}
        <AnimatePresence>
          {trackingOrderId && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9995,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Seguimiento de envío"
            >
              <ErrorBoundary nombre="Seguimiento de Envío">
                <ClientTracking
                  isDark={isDark}
                  onBack={handleCloseTracking}
                  onOpenChat={handleOpenChat}
                  onRate={handleOpenRating}
                />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9996,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Chat con repartidor"
            >
              <ClientChat
                isDark={isDark}
                onClose={() => setChatOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ratingModalOpen && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9997,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Calificar servicio"
            >
              <ClientRating
                isDark={isDark}
                onClose={() => setRatingModalOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tienda Profile Full Page */}
        <AnimatePresence>
          {tiendaSeleccionada && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9990,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Detalle de tienda"
            >
              <ClientTienda
                isDark={isDark}
                tiendaId={tiendaSeleccionada}
                onBack={() => setTiendaSeleccionada(null)}
                onOpenCart={() => setCarritoOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Overlay (Full Screen Page) */}
        <AnimatePresence>
          {carritoOpen && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Carrito de compras"
            >
              <ClientCarrito
                isOpen={true}
                onClose={() => setCarritoOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Modal / Panel de Notificaciones (Ancho, Centrado y Totalmente Legible) ─── */}
        <AnimatePresence>
          {clientNotifOpen && (
            <>
              {/* Backdrop para cerrar al tocar fuera */}
              <motion.div
                key="client-notif-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setClientNotifOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                  zIndex: 9996,
                }}
              />

              {/* Panel flotante de notificaciones */}
              <motion.div
                key="client-notif-panel"
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="lf-notif-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Notificaciones"
                style={{
                  position: 'fixed',
                  top: 'calc(env(safe-area-inset-top, 10px) + 64px)',
                  left: 14,
                  right: 14,
                  maxWidth: 420,
                  margin: '0 auto',
                  maxHeight: 'min(75vh, 520px)',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 22,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                  zIndex: 9997,
                  overflow: 'hidden',
                }}
              >
                {/* Header del Panel */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface)',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}>
                      Notificaciones
                    </span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: 10,
                          background: 'var(--peligro)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {clientNotificaciones.length > 0 && (
                      <button
                        onClick={() => {
                          markAllClientNotifRead();
                          fetch('/api/notificaciones-push', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({}),
                          }).catch(() => null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primario)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          padding: '4px 6px',
                        }}
                      >
                        Marcar todas
                      </button>
                    )}
                    <button
                      onClick={() => setClientNotifOpen(false)}
                      aria-label="Cerrar notificaciones"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: 'none',
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Lista de Notificaciones */}
                <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {clientNotificaciones.length === 0 ? (
                    <div style={{ padding: '38px 24px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: 'var(--primario-soft)',
                          color: 'var(--primario)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                        }}
                      >
                        <Bell size={24} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                        Sin notificaciones
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, maxWidth: 260, margin: '6px auto 0' }}>
                        Aquí llegarán tus pedidos, promociones y avisos importantes de LogiFast.
                      </div>
                    </div>
                  ) : (
                    clientNotificaciones.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markClientNotifRead(n.id);
                          fetch('/api/notificaciones-push', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: n.id }),
                          }).catch(() => null);
                          if (
                            n.relacionadoId &&
                            (n.tipo === 'orden_confirmada' ||
                              n.tipo === 'repartidor_asignado' ||
                              n.tipo === 'repartidor_camino' ||
                              n.tipo === 'paquete_recogido')
                          ) {
                            setTrackingOrder(n.relacionadoId);
                            setClientNotifOpen(false);
                          }
                        }}
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: '13px 18px',
                          borderBottom: '1px solid var(--border)',
                          background: n.leida ? 'transparent' : 'var(--primario-soft)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: n.leida ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'var(--primario)',
                            color: n.leida ? 'var(--primario)' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {(() => {
                            const IconoNotif = ICONO_POR_TIPO[n.tipo] || Bell;
                            return <IconoNotif size={16} />;
                          })()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                            {n.titulo}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                            {n.descripcion}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                            {tiempoRelativo(n.timestamp)}
                          </div>
                        </div>
                        {!n.leida && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'var(--primario)',
                              flexShrink: 0,
                              marginTop: 8,
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── Pre-permiso de Notificaciones (explicar ANTES del diálogo del sistema) ─── */}
        <AnimatePresence>
          {showPermissionPrompt && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleAhoraNo}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 9998,
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                role="dialog"
                aria-modal="true"
                aria-label="Activar notificaciones"
                style={{
                  position: 'fixed',
                  left: 12,
                  right: 12,
                  bottom: 'calc(env(safe-area-inset-bottom, 12px) + 12px)',
                  maxWidth: 460,
                  margin: '0 auto',
                  zIndex: 9999,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 24,
                  padding: '22px 20px 18px',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    margin: '0 auto 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primario), #8B5CF6)',
                    color: '#fff',
                    boxShadow: '0 10px 26px rgba(0,102,255,0.32)',
                  }}
                >
                  <Bell size={26} />
                </div>

                <h3
                  style={{
                    margin: '0 0 6px',
                    textAlign: 'center',
                    fontSize: 19,
                    fontWeight: 800,
                    fontFamily: "'Syne', sans-serif",
                    color: 'var(--text)',
                  }}
                >
                  Activá las notificaciones
                </h3>
                <p
                  style={{
                    margin: '0 0 16px',
                    textAlign: 'center',
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Son alertas del sistema, no se ven dentro de la app. Te avisamos solo de lo importante:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 18 }}>
                  {[
                    { Icono: Bike, titulo: 'Tu pedido en camino', detalle: 'Cuando el repartidor ya salió hacia vos.' },
                    { Icono: Bell, titulo: 'El repartidor está en tu puerta', detalle: 'Con sonido y vibración, aunque tengas el celular bloqueado.' },
                    { Icono: Gift, titulo: 'Promociones y cupones', detalle: 'Descuentos y avisos que te envía LogiFast.' },
                  ].map((fila) => (
                    <div key={fila.titulo} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                      <span style={{ display: 'flex', alignItems: 'center', color: 'var(--primario)', flexShrink: 0, marginTop: 3 }}>
                        <fila.Icono size={18} />
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fila.titulo}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>{fila.detalle}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleActivarNotificaciones}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 16,
                    border: 'none',
                    background: 'var(--primario)',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: "'Syne', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 10px 24px rgba(0,102,255,0.3)',
                  }}
                >
                  Activar notificaciones
                </button>

                <button
                  type="button"
                  onClick={handleAhoraNo}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '12px 16px',
                    borderRadius: 16,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Ahora no
                </button>

                <p
                  style={{
                    margin: '10px 0 0',
                    textAlign: 'center',
                    fontSize: 10.5,
                    lineHeight: 1.45,
                    color: 'var(--text-muted)',
                  }}
                >
                  Podés cambiarlo cuando quieras desde tu perfil.
                </p>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── Permiso bloqueado: cómo reactivarlas ─── */}
        <AnimatePresence>
          {permisoBloqueado && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              style={{
                position: 'fixed',
                top: 'calc(env(safe-area-inset-top, 10px) + 68px)',
                left: 16,
                right: 16,
                maxWidth: 440,
                margin: '0 auto',
                zIndex: 9997,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 10px 26px rgba(0,0,0,0.22)',
              }}
            >
              <Bell size={16} style={{ color: 'var(--warning, #FFB300)', flexShrink: 0 }} />
              <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--text-secondary)', flex: 1 }}>
                Las notificaciones están bloqueadas. Activalas en{' '}
                <strong style={{ color: 'var(--text)' }}>Ajustes › Apps › LogiFast › Notificaciones</strong>.
              </div>
              <button
                type="button"
                onClick={() => setPermisoBloqueado(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── RESPONSIVE STYLES (iOS native) ─── */}
        <style>{`
          /* ─── Status bar & gesture bar: mobile simulation only ─── */
          .lf-status-bar,
          .lf-gesture-bar {
            display: flex !important;
          }
          @media (min-width: 1024px) {
            .lf-status-bar,
            .lf-gesture-bar {
              display: none !important;
            }
          }
          @media (pointer: coarse) {
            .lf-status-bar,
            .lf-gesture-bar {
              display: none !important;
            }
          }

          /* iOS app container — solid iOS background, no theme flash */
          .lf-ios-app {
            background: var(--ios-bg) !important;
            color: var(--ios-text-primary) !important;
          }

          /* iOS tab bar — visible at ALL widths (single source of truth) */
          .lf-ios-tabbar.lf-client-bottom-nav {
            display: flex !important;
            -webkit-overflow-scrolling: touch;
          }

          /* Wider horizontal padding on desktop */
          @media (min-width: 1024px) {
            .lf-client-inner-pad {
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
            .lf-ios-large-title-wrap {
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
            /* Snackbar centered on desktop */
            .lf-snackbar,
            .lf-ios-snackbar {
              max-width: 480px;
              left: 50% !important;
              right: auto !important;
              transform: translateX(-50%);
            }
          }

          /* Header offset for status bar on mobile */
          @media (max-width: 1023px) {
            .lf-header-bar.lf-ios-header {
              top: calc(env(safe-area-inset-top, 10px) + 8px) !important;
            }
            .lf-client-content-padded.lf-ios-content {
              padding-top: calc(58px + env(safe-area-inset-top, 0px)) !important;
            }
          }
          @media (max-width: 1023px) and (pointer: coarse) {
            .lf-header-bar.lf-ios-header {
              top: calc(env(safe-area-inset-top, 10px) + 8px) !important;
            }
            .lf-client-content-padded.lf-ios-content {
              padding-top: calc(58px + env(safe-area-inset-top, 0px)) !important;
            }
          }

          /* iOS sheet — wrapper applies bottom-sheet styling (border-radius, padding,
             safe-area) as required; inner modal components retain their own positioning */
          .lf-ios-sheet {
            will-change: transform, opacity;
          }

          /* ─── Splash keyframes (fallback) ─── */
          @keyframes lf-splash-logo {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes lf-splash-text {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* ─── Keep-alive screen transition (instantáneo 0ms) ─── */
          @keyframes lfScreenFadeIn {
            from {
              opacity: 0.85;
              transform: scale(0.995);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .lf-screen-fade-in {
            animation: lfScreenFadeIn 0.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
      </div>
    </SnackbarContext.Provider>
  );
}
