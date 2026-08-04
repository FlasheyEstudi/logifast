'use client';

import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Package,
  PackagePlus,
  Navigation,
  Clock,
  Power,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Store,
  TrendingUp,
  Zap,
  Target,
  Phone,
  Compass,
} from '@/components/icons';
import { useRepartidorStore, type OrdenActiva } from '@/lib/repartidor-store';
import { obtenerRuta, obtenerRutaMultiples, rutaLineaRecta, geocodeAddress } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';
import { useBottomSheetGesture } from '@/hooks/useBottomSheetGesture';
import { HAPTIC_PATTERNS } from '@/services/haptics';

/* ═══════════════════════════════════════════════
   REAL LEAFLET / MAPLIBRE MAP (dynamic, ssr:false)
   ═══════════════════════════════════════════════ */

const RepartidorMap = dynamic(() => import('./RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--ios-bg-secondary, #E5E5EA)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ios-text-tertiary, #8E8E93)',
        fontSize: 14,
        fontFamily: 'var(--ios-font, sans-serif)',
      }}
    >
      Cargando mapa en vivo…
    </div>
  ),
});

/* ═══════════════════════════════════════════════
   ESTADO → COLOR MAPPING
   ═══════════════════════════════════════════════ */

const ESTADO_COLOR: Record<string, string> = {
  DESCONECTADO: '#8E8E93',
  EN_LINEA: '#007AFF',
  ORDEN_ASIGNADA: '#FF9500',
  EN_CAMINO_RECOGER: '#007AFF',
  EN_PUNTO_RECOGIDA: '#FF9500',
  RECOGIDO: '#AF52DE',
  EN_PUNTO_ENTREGA: '#34C759',
  INCIDENCIA: '#FF3B30',
};

/* ═══════════════════════════════════════════════
   MOCK ORDEN (for demo)
   ═══════════════════════════════════════════════ */
const MOCK_ORDENES: OrdenActiva[] = [];
let mockOrdenIndex = 0;

/* ═══════════════════════════════════════════════
   TIEMPO DISPLAY (1s timer)
   ═══════════════════════════════════════════════ */

function TiempoDisplay() {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  const texto = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return (
    <div
      className="font-mono"
      style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-text-primary)' }}
    >
      {texto}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   KM COUNTER (vertical slide)
   ═══════════════════════════════════════════════ */

function KmCounter({ value }: { value: number }) {
  const formatted = value.toFixed(2);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 4,
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', height: 36, overflow: 'hidden', minWidth: 90 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={formatted}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--ios-text-primary)',
              lineHeight: 1.2,
            }}
          >
            {formatted}
          </motion.div>
        </AnimatePresence>
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ios-text-tertiary)' }}>km</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorServicio() {
  const {
    estado,
    conectado,
    ordenActiva,
    ordenesActivas = [],
    seleccionarOrdenActiva,
    optimizarRutaAutomatica,
    lat,
    lng,
    kmRecorridos,
    eta,
    statsHoy,
    perfil,
    conectar,
    recibirOrdenAsignada,
    llegarRecogida,
    recogerPaquete,
    llegarEntrega,
    confirmarEntrega,
    toggleChat,
    toggleIncidencia,
    setPantalla,
  } = useRepartidorStore();

  const showSnackbar = useRepartidorSnackbar();

  /* Modal state for external map app selector */
  const [showNavSelector, setShowNavSelector] = useState(false);

  /* Real route polyline (OSRM, with straight-line fallback) */
  const [rutaCoordenadas, setRutaCoordenadas] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!ordenActiva) {
      setRutaCoordenadas([]);
      return;
    }

    let cancelled = false;

    if (ordenesActivas && ordenesActivas.length > 1) {
      const waypoints = [{ lat, lng }];
      ordenesActivas.forEach((ord) => {
        if (ord.origenLat !== 0 && ord.origenLng !== 0) {
          waypoints.push({ lat: ord.origenLat, lng: ord.origenLng });
        }
        if (ord.destinoLat !== 0 && ord.destinoLng !== 0) {
          waypoints.push({ lat: ord.destinoLat, lng: ord.destinoLng });
        }
      });

      obtenerRutaMultiples(waypoints)
        .then((res) => {
          if (cancelled) return;
          if (res.exito && res.coordenadas.length > 1) {
            setRutaCoordenadas(res.coordenadas);
          } else {
            setRutaCoordenadas(rutaLineaRecta({ lat, lng }, { lat: ordenActiva.destinoLat, lng: ordenActiva.destinoLng }));
          }
        })
        .catch(() => {
          if (cancelled) return;
          setRutaCoordenadas(rutaLineaRecta({ lat, lng }, { lat: ordenActiva.destinoLat, lng: ordenActiva.destinoLng }));
        });

      return () => { cancelled = true; };
    }

    const destino =
      estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA'
        ? { lat: ordenActiva.origenLat, lng: ordenActiva.origenLng }
        : { lat: ordenActiva.destinoLat, lng: ordenActiva.destinoLng };

    obtenerRuta({ lat, lng }, destino)
      .then((res) => {
        if (cancelled) return;
        if (res.exito && res.coordenadas.length > 1) {
          setRutaCoordenadas(res.coordenadas);
        } else {
          setRutaCoordenadas(rutaLineaRecta({ lat, lng }, destino));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRutaCoordenadas(rutaLineaRecta({ lat, lng }, destino));
      });

    return () => {
      cancelled = true;
    };
  }, [ordenActiva, ordenesActivas, estado, lat, lng]);

  /* Origen/destino positions for the map */
  const origenPos: [number, number] | undefined = ordenActiva
    ? (ordenActiva.origenLat !== 0 && ordenActiva.origenLng !== 0
        ? [ordenActiva.origenLat, ordenActiva.origenLng]
        : geocodeAddress(ordenActiva.origen, [12.1264, -86.2652]))
    : undefined;
  const destinoPos: [number, number] | undefined = ordenActiva
    ? (ordenActiva.destinoLat !== 0 && ordenActiva.destinoLng !== 0
        ? [ordenActiva.destinoLat, ordenActiva.destinoLng]
        : geocodeAddress(ordenActiva.destino, [12.1402, -86.2954]))
    : undefined;

  /* ─── Handlers ─── */
  const handleConectar = () => {
    if (!perfil.contratoAceptado) {
      showSnackbar({ message: 'Error: Debes firmar el contrato digital en tu Perfil antes de conectarte.' });
      HAPTIC_PATTERNS.error();
      return;
    }
    conectar();
    HAPTIC_PATTERNS.medium();
    showSnackbar({ message: 'Te has conectado. Esperando asignaciones.' });
  };

  const handleSimularOrden = () => {
    if (!MOCK_ORDENES || MOCK_ORDENES.length === 0) {
      showSnackbar({ message: 'No hay órdenes de prueba disponibles.' });
      return;
    }
    const orden = MOCK_ORDENES[mockOrdenIndex % MOCK_ORDENES.length];
    mockOrdenIndex += 1;
    recibirOrdenAsignada(orden);
    HAPTIC_PATTERNS.nuevaOrden();
  };

  const handleEmpezarViaje = () => {
    optimizarRutaAutomatica();
    useRepartidorStore.setState({ estado: 'EN_CAMINO_RECOGER', enServicio: true });
    HAPTIC_PATTERNS.success();
    showSnackbar({
      message: `🚀 ¡Viaje iniciado hacia la recogida!`,
    });
  };

  const handleLlegarRecogida = () => {
    llegarRecogida();
    HAPTIC_PATTERNS.medium();
    showSnackbar({ message: '📍 Llegaste al sitio de recogida. Verifica los paquetes.' });
  };

  const handleRecoger = () => {
    recogerPaquete();
    HAPTIC_PATTERNS.medium();
    showSnackbar({ message: '📦 Paquete verificado y recogido. ¡Viaje a entrega iniciado!' });
  };

  const handleLlegarEntrega = () => {
    llegarEntrega();
    HAPTIC_PATTERNS.medium();
    showSnackbar({ message: '📍 Llegaste donde el cliente. Solicita la entrega.' });
  };

  const handleConfirmarEntrega = () => {
    confirmarEntrega();
    HAPTIC_PATTERNS.success();
    showSnackbar({ message: '✅ Entrega confirmada con éxito. ¡Buen trabajo!', action: 'Ver historial' });
  };

  /* External Navigation Helpers */
  const currentNavTarget = useMemo<{ lat: number; lng: number; label: string } | null>(() => {
    if (!ordenActiva) return null;
    if (estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA') {
      return { lat: ordenActiva.origenLat, lng: ordenActiva.origenLng, label: ordenActiva.origen };
    }
    return { lat: ordenActiva.destinoLat, lng: ordenActiva.destinoLng, label: ordenActiva.destino };
  }, [ordenActiva, estado]);

  const openInGoogleMaps = () => {
    if (!currentNavTarget) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${currentNavTarget.lat},${currentNavTarget.lng}`,
      '_blank'
    );
    HAPTIC_PATTERNS.light();
    setShowNavSelector(false);
  };

  const openInWaze = () => {
    if (!currentNavTarget) return;
    window.open(
      `https://www.waze.com/ul?ll=${currentNavTarget.lat},${currentNavTarget.lng}&navigate=yes`,
      '_blank'
    );
    HAPTIC_PATTERNS.light();
    setShowNavSelector(false);
  };

  const openInAppleMaps = () => {
    if (!currentNavTarget) return;
    window.open(
      `https://maps.apple.com/?daddr=${currentNavTarget.lat},${currentNavTarget.lng}`,
      '_blank'
    );
    HAPTIC_PATTERNS.light();
    setShowNavSelector(false);
  };

  const handleLlamar = () => {
    if (!ordenActiva) return;
    const phone = ordenActiva.clienteTelefono || '88888888';
    window.open(`tel:${phone}`, '_self');
    HAPTIC_PATTERNS.light();
  };

  /* ═══════════════════════════════════════════════
     RENDER — STATE MACHINE
     ═══════════════════════════════════════════════ */

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--ios-bg, #F2F2F7)',
        fontFamily: 'var(--ios-font, sans-serif)',
      }}
    >
      {/* ═══════ MAP FULLSCREEN (100% HEIGHT) ═══════ */}
      <div className="lf-ios-map-fullscreen" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <RepartidorMap
          repartidorPos={[lat, lng]}
          origenPos={origenPos}
          destinoPos={destinoPos}
          rutaCoordenadas={rutaCoordenadas.length > 1 ? rutaCoordenadas : undefined}
          estado={estado}
          altura="100%"
          seguirRepartidor
        />
      </div>

      {/* ═══════ TOP FLOATING STATUS BAR ═══════ */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 12px) + 12px)',
          left: 16,
          right: 16,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderRadius: 100,
          background: 'color-mix(in srgb, var(--ios-bg-elevated, #1E293B) 92%, transparent)',
          backdropFilter: 'saturate(200%) blur(24px)',
          WebkitBackdropFilter: 'saturate(200%) blur(24px)',
          border: '1px solid color-mix(in srgb, var(--ios-blue, #0066FF) 30%, transparent)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--ios-text-primary, #F8FAFC)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: ESTADO_COLOR[estado] || '#007AFF',
              boxShadow: `0 0 8px ${ESTADO_COLOR[estado] || '#007AFF'}`,
            }}
          />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {estado.replace(/_/g, ' ')}
          </span>
        </div>

        {ordenActiva && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#34C759' }}>
              <Clock size={14} /> {eta} min
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#007AFF' }}>
              <Navigation size={14} /> {ordenActiva.kmEstimados.toFixed(1)} km
            </span>
          </div>
        )}
      </div>

      {/* ═══════ FLOATING CIRCULAR FAB ACTION BUTTONS (STACKED ON RIGHT) ═══════ */}
      {ordenActiva && (
        <div
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* FAB 1: GPS APP LAUNCHER (WAZE / GOOGLE MAPS) */}
          <button
            onClick={() => setShowNavSelector(true)}
            aria-label="Abrir aplicación de mapas externa"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 20px rgba(0, 122, 255, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'transform 0.15s ease',
            }}
          >
            <Compass size={24} />
          </button>

          {/* FAB 2: PHONE CALL */}
          <button
            onClick={handleLlamar}
            aria-label="Llamar al cliente o comercio"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 20px rgba(52, 199, 89, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'transform 0.15s ease',
            }}
          >
            <Phone size={22} />
          </button>

          {/* FAB 3: CHAT */}
          <button
            onClick={() => toggleChat(ordenActiva.id)}
            aria-label="Abrir chat del pedido"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #AF52DE 0%, #8E24AA 100%)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 20px rgba(175, 82, 222, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'transform 0.15s ease',
            }}
          >
            <MessageSquare size={22} />
          </button>

          {/* FAB 4: INCIDENCIA */}
          <button
            onClick={() => toggleIncidencia(true)}
            aria-label="Reportar incidencia"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF3B30 0%, #C0392B 100%)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 20px rgba(255, 59, 48, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'transform 0.15s ease',
            }}
          >
            <AlertTriangle size={22} />
          </button>
        </div>
      )}

      {/* ═══════ DESCONECTADO OVERLAY ═══════ */}
      {estado === 'DESCONECTADO' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 40,
          }}
        >
          <div
            className="lf-ios-card"
            style={{ maxWidth: 360, textAlign: 'center', padding: 28 }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'rgba(0, 122, 255, 0.15)',
                color: '#007AFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Power size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#F8FAFC' }}>
              Estás desconectado
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 24, lineHeight: 1.5 }}>
              Conéctate para empezar a recibir asignaciones de órdenes en tiempo real.
            </p>
            <button onClick={handleConectar} className="lf-ios-button">
              <Power size={20} />
              Conectarse
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════ EN_LINEA (WAITING OR ACCEPTED ORDERS) ═══════ */}
      {estado === 'EN_LINEA' && (
        <>
          {ordenesActivas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'absolute',
                top: '35%',
                left: 16,
                right: 16,
                padding: 24,
                borderRadius: 20,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                textAlign: 'center',
                zIndex: 30,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(0, 122, 255, 0.15)',
                  color: '#007AFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Zap size={28} />
              </motion.div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                En línea — Esperando asignaciones
              </h3>
              <p style={{ fontSize: 13, color: '#94A3B8' }}>
                Tu ubicación GPS se está transmitiendo en vivo a la flota.
              </p>
            </motion.div>
          ) : (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(var(--ios-tabbar-height) + 20px)',
                left: 16,
                right: 16,
                zIndex: 40,
              }}
            >
              <button
                onClick={handleEmpezarViaje}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(0, 122, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <Navigation size={22} />
                🚀 INICIAR VIAJE AL COMERCIO ({ordenesActivas.length})
              </button>
            </div>
          )}
        </>
      )}

      {/* ═══════ BOTTOM SHEET — DYNAMIC TRIP LIFECYCLE ═══════ */}
      {ordenActiva && estado !== 'EN_LINEA' && estado !== 'DESCONECTADO' && (
        <BottomSheet>
          {/* STEP 1: EN_CAMINO_RECOGER */}
          {estado === 'EN_CAMINO_RECOGER' && (
            <>
              <SheetHeader
                label="En camino al punto de recogida"
                color="#007AFF"
                icon={<Navigation size={18} />}
              />
              <OrdenMiniCard orden={ordenActiva} showRecogida />
              <button
                onClick={handleLlegarRecogida}
                className="lf-ios-button success"
                style={{ marginTop: 12, width: '100%', padding: '16px', fontSize: 16, fontWeight: 700 }}
              >
                <MapPin size={20} />
                📍 LLEGUÉ AL SITIO / COMERCIO
              </button>
            </>
          )}

          {/* STEP 2: EN_PUNTO_RECOGIDA */}
          {estado === 'EN_PUNTO_RECOGIDA' && (
            <>
              <SheetHeader
                label="En punto de recogida"
                color="#FF9500"
                icon={<Store size={18} />}
              />
              <OrdenMiniCard orden={ordenActiva} showRecogida />
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(255, 149, 0, 0.12)',
                  border: '1px solid rgba(255, 149, 0, 0.3)',
                  marginBottom: 12,
                  fontSize: 13,
                  color: '#F8FAFC',
                }}
              >
                📦 Revisa los productos del paquete antes de confirmar la recolección.
              </div>
              <button
                onClick={handleRecoger}
                className="lf-ios-button"
                style={{ marginTop: 8, width: '100%', padding: '16px', fontSize: 16, fontWeight: 700 }}
              >
                <Package size={20} />
                📦 CONFIRMAR RECOLECCIÓN / INICIAR ENTREGA
              </button>
            </>
          )}

          {/* STEP 3: RECOGIDO (EN CAMINO A ENTREGA) */}
          {estado === 'RECOGIDO' && (
            <>
              <SheetHeader
                label="En camino al cliente"
                color="#AF52DE"
                icon={<Navigation size={18} />}
              />
              <OrdenMiniCard orden={ordenActiva} showEntrega />
              <button
                onClick={handleLlegarEntrega}
                className="lf-ios-button success"
                style={{ marginTop: 12, width: '100%', padding: '16px', fontSize: 16, fontWeight: 700 }}
              >
                <MapPin size={20} />
                📍 LLEGUÉ DONDE EL CLIENTE
              </button>
            </>
          )}

          {/* STEP 4: EN_PUNTO_ENTREGA */}
          {estado === 'EN_PUNTO_ENTREGA' && (
            <>
              <SheetHeader
                label="En ubicación del cliente"
                color="#34C759"
                icon={<Target size={18} />}
              />
              <OrdenMiniCard orden={ordenActiva} showEntrega />
              <button
                onClick={handleConfirmarEntrega}
                className="lf-ios-button success"
                style={{ marginTop: 12, width: '100%', padding: '16px', fontSize: 16, fontWeight: 700 }}
              >
                <CheckCircle2 size={20} />
                ✅ CONFIRMAR Y ENTREGAR PEDIDO
              </button>
            </>
          )}
        </BottomSheet>
      )}

      {/* ═══════ MODAL: SELECTOR DE NAVEGACIÓN EXTERNA (WAZE / GOOGLE MAPS / APPLE MAPS) ═══════ */}
      <AnimatePresence>
        {showNavSelector && currentNavTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNavSelector(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 480,
                background: '#1E293B',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                🧭 Elegir Aplicación de Mapas
              </h3>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
                Navegar hacia: <strong style={{ color: '#F8FAFC' }}>{currentNavTarget.label}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Waze */}
                <button
                  onClick={openInWaze}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 14,
                    background: 'rgba(51, 204, 255, 0.12)',
                    border: '1px solid rgba(51, 204, 255, 0.3)',
                    color: '#F8FAFC',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 24 }}>🧭</span>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div>Waze Navigation</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                      Tráfico en tiempo real y alertas de radares
                    </div>
                  </div>
                </button>

                {/* Google Maps */}
                <button
                  onClick={openInGoogleMaps}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 14,
                    background: 'rgba(66, 133, 244, 0.12)',
                    border: '1px solid rgba(66, 133, 244, 0.3)',
                    color: '#F8FAFC',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 24 }}>🗺️</span>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div>Google Maps</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                      Rutas optimizadas giro a giro
                    </div>
                  </div>
                </button>

                {/* Apple Maps */}
                <button
                  onClick={openInAppleMaps}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#F8FAFC',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 24 }}>📱</span>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div>Apple Maps / Nativo</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                      Navegador predeterminado del sistema
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowNavSelector(false)}
                style={{
                  width: '100%',
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 12,
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REUSABLE UI BITS
   ═══════════════════════════════════════════════ */

function BottomSheet({ children }: { children: React.ReactNode }) {
  const SNAP_POINTS = [
    { id: 'min', height: 20 },
    { id: 'med', height: 50 },
    { id: 'max', height: 85 }
  ];

  const { sheetRef, currentSnap, isDragging, handlers } = useBottomSheetGesture({
    snapPoints: SNAP_POINTS,
    initialSnap: 'med'
  });

  return (
    <div
      ref={sheetRef}
      className={`repartidor-sheet lf-ios-rep-sheet ${isDragging ? 'dragging' : ''}`}
      style={{
        bottom: 'calc(var(--ios-tabbar-height) + var(--ios-tabbar-safe))',
        zIndex: 35,
      }}
      {...handlers}
    >
      <div className="sheet-handle-area">
        <div className="sheet-handle" />
      </div>
      <div className="sheet-scroll-content" style={{ paddingBottom: 20 }}>
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ label, color, icon }: { label: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
        {label}
      </h3>
    </div>
  );
}

function OrdenMiniCard({ orden, showRecogida, showEntrega }: { orden: OrdenActiva; showRecogida?: boolean; showEntrega?: boolean }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#007AFF' }}>
          #{orden.id}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
          {orden.cliente}
        </span>
      </div>

      {showRecogida && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#CBD5E1' }}>
          <MapPin size={16} color="#FF9500" />
          <span><strong>Origen:</strong> {orden.origen}</span>
        </div>
      )}

      {showEntrega && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#CBD5E1', marginTop: 4 }}>
          <Target size={16} color="#34C759" />
          <span><strong>Destino:</strong> {orden.destino}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>Ganancia</span>
        <span className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: '#34C759' }}>
          C${orden.ganancia.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
