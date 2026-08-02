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
  Maximize2,
  Minimize2,
} from '@/components/icons';
import { useRepartidorStore, type OrdenActiva } from '@/lib/repartidor-store';
import { obtenerRuta, obtenerRutaMultiples, rutaLineaRecta, geocodeAddress } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';
import { useBottomSheetGesture } from '@/hooks/useBottomSheetGesture';
import { HAPTIC_PATTERNS } from '@/services/haptics';

/* ═══════════════════════════════════════════════
   REAL LEAFLET MAP (dynamic, ssr:false — Leaflet needs window)
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
      Cargando mapa…
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
  EN_PUNTO_RECOGIDA: '#FF3B30',
  RECOGIDO: '#AF52DE',
  EN_PUNTO_ENTREGA: '#AF52DE',
  INCIDENCIA: '#FF3B30',
};

/* ═══════════════════════════════════════════════
   MOCK ORDEN (for "Simular nueva orden" button)
   ═══════════════════════════════════════════════ */
const MOCK_ORDENES: OrdenActiva[] = [];
let mockOrdenIndex = 0;

/* ═══════════════════════════════════════════════
   TIEMPO DISPLAY (1s timer, keyed by ordenId)
   ═══════════════════════════════════════════════ */

function TiempoDisplay() {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, []);
  // Format mm:ss
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
  } = useRepartidorStore();

  const showSnackbar = useRepartidorSnackbar();

  /* ─── State for 100% Fullscreen Map mode ─── */
  const [mapaExpandido, setMapaExpandido] = useState(false);

  /* ─── Real route polyline (OSRM, with straight-line fallback) ─── */
  const [rutaCoordenadas, setRutaCoordenadas] = useState<[number, number][]>([]);

  useEffect(() => {
    // Only fetch a route when we have an active order and we're moving
    // towards either the pickup or the delivery point.
    if (!ordenActiva) {
      setRutaCoordenadas([]);
      return;
    }

    let cancelled = false;

    // Si lleva múltiples órdenes activas combinadas
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

    // Si lleva 1 sola orden
    const destino =
      estado === 'EN_CAMINO_RECOGER'
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

  /* Origen/destino positions for the map (only when we have an order) */
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

    // Calculate distance from current driver position to order pickup point
    const R = 6371; // Earth radius in km
    const dLat = ((orden.origenLat - lat) * Math.PI) / 180;
    const dLng = ((orden.origenLng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((orden.origenLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    if (dist > 2.0) {
      showSnackbar({
        message: `Pedido ${orden.id} bloqueado. Distancia de recogida: ${dist.toFixed(2)} km (Límite: 2 km).`
      });
      HAPTIC_PATTERNS.error();
      return;
    }

    recibirOrdenAsignada(orden);
    HAPTIC_PATTERNS.nuevaOrden();
  };

  const handleEmpezarViaje = () => {
    optimizarRutaAutomatica();
    useRepartidorStore.setState({ estado: 'EN_CAMINO_RECOGER', enServicio: true });
    HAPTIC_PATTERNS.success();
    showSnackbar({
      message: `🚀 ¡Viaje iniciado con ${ordenesActivas.length} orden(es) aceptada(s)!`,
    });
  };

  const handleLlegarRecogida = () => {
    llegarRecogida();
    HAPTIC_PATTERNS.medium();
    showSnackbar({ message: 'Has llegado al punto de recogida.' });
  };

  const handleRecoger = () => {
    recogerPaquete();
    HAPTIC_PATTERNS.medium();
    showSnackbar({ message: 'Paquete recogido. En camino a entrega.' });
  };

  const handleLlegarEntrega = () => {
    llegarEntrega();
    HAPTIC_PATTERNS.medium();
    showSnackbar({ message: 'Has llegado al punto de entrega.' });
  };

  const handleConfirmarEntrega = () => {
    confirmarEntrega();
    HAPTIC_PATTERNS.success();
    showSnackbar({ message: 'Entrega confirmada. Servicio completado.', action: 'Ver historial' });
  };

  /* ─── External navigation (Google Maps / Waze) — NUNCA sale automáticamente ─── */
  const openInGoogleMaps = (targetLat: number, targetLng: number) => {
    if (!targetLat || !targetLng) {
      showSnackbar({ message: 'Coordenadas no disponibles para abrir en Google Maps.' });
      HAPTIC_PATTERNS.error();
      return;
    }
    if (typeof window === 'undefined') return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`,
      '_blank',
      'noopener,noreferrer'
    );
    HAPTIC_PATTERNS.light();
  };

  const openInWaze = (targetLat: number, targetLng: number) => {
    if (!targetLat || !targetLng) {
      showSnackbar({ message: 'Coordenadas no disponibles para abrir en Waze.' });
      HAPTIC_PATTERNS.error();
      return;
    }
    if (typeof window === 'undefined') return;
    window.open(
      `https://www.waze.com/ul?ll=${targetLat},${targetLng}&navigate=yes`,
      '_blank',
      'noopener,noreferrer'
    );
    HAPTIC_PATTERNS.light();
  };

  /* ─── Navigation target for current step ─── */
  const navTarget = useMemo<{ lat: number; lng: number; label: string } | null>(() => {
    if (!ordenActiva) return null;
    if (estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA') {
      return { lat: ordenActiva.origenLat, lng: ordenActiva.origenLng, label: 'punto de recogida' };
    }
    if (estado === 'RECOGIDO' || estado === 'EN_PUNTO_ENTREGA') {
      return { lat: ordenActiva.destinoLat, lng: ordenActiva.destinoLng, label: 'punto de entrega' };
    }
    return null;
  }, [ordenActiva, estado]);

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
      {/* ═══════ MAP FULLSCREEN — `.lf-ios-map-fullscreen` ═══════ */}
      <div className="lf-ios-map-fullscreen">
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

      {/* ═══════ BOTÓN PANTALLA COMPLETA DEL MAPA (Top-Right) ═══════ */}
      <button
        onClick={() => {
          setMapaExpandido(!mapaExpandido);
          HAPTIC_PATTERNS.light();
        }}
        aria-label={mapaExpandido ? 'Restaurar vista' : 'Pantalla completa de mapa'}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 40,
          padding: '8px 14px',
          borderRadius: 100,
          background: mapaExpandido
            ? 'var(--ios-blue)'
            : 'color-mix(in srgb, var(--ios-bg-elevated) 90%, transparent)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          border: '0.5px solid var(--ios-separator)',
          color: mapaExpandido ? '#FFFFFF' : 'var(--ios-text-primary)',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'var(--ios-font)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: 'var(--ios-shadow-md)',
          transition: 'all 0.25s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {mapaExpandido ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        {mapaExpandido ? 'Restaurar vista' : 'Pantalla completa'}
      </button>

      {/* ═══════ Status chip (top-left) — iOS pill ═══════ */}
      {conectado && (
        <div
          className="lf-ios-pill active"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            padding: '6px 12px',
            borderRadius: 100,
            background: 'color-mix(in srgb, var(--ios-bg-elevated) 88%, transparent)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            border: '0.5px solid var(--ios-separator)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ios-text-primary)',
            fontFamily: 'var(--ios-font)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ESTADO_COLOR[estado],
              boxShadow: `0 0 8px ${ESTADO_COLOR[estado]}`,
            }}
          />
          {estado === 'EN_LINEA' && 'En línea'}
          {estado === 'EN_CAMINO_RECOGER' && 'Camino a recoger'}
          {estado === 'EN_PUNTO_RECOGIDA' && 'En recogida'}
          {estado === 'RECOGIDO' && 'En camino a entrega'}
          {estado === 'EN_PUNTO_ENTREGA' && 'En entrega'}
        </div>
      )}

      {/* ═══════ Multipedidos & Optimización de Ruta — iOS glass bar ═══════ */}
      {conectado && (ordenesActivas || []).length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: 16,
            right: 16,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 'var(--ios-radius-md, 14px)',
            background: 'color-mix(in srgb, var(--ios-bg-elevated) 92%, transparent)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            border: '0.5px solid var(--ios-separator)',
            boxShadow: 'var(--ios-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ios-blue)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--ios-font)',
              }}
            >
              Pedidos ({ordenesActivas.length}/3):
            </span>
            {ordenesActivas.map((ord, idx) => {
              const isSelected = ordenActiva?.id === ord.id;
              return (
                <button
                  key={ord.id}
                  onClick={() => seleccionarOrdenActiva(ord.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: isSelected ? 'var(--ios-blue)' : 'var(--ios-bg-secondary)',
                    color: isSelected ? '#FFF' : 'var(--ios-text-primary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--ios-font)',
                  }}
                >
                  #{idx + 1} {ord.id}
                </button>
              );
            })}
          </div>

          {ordenesActivas.length > 1 && (
            <button
              onClick={() => {
                optimizarRutaAutomatica();
                showSnackbar({ message: 'Ruta optimizada: ordenada por menor distancia.' });
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--ios-orange, #FF9500)',
                color: '#FFF',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
                fontFamily: 'var(--ios-font)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Zap size={12} />
              Optimizar
            </button>
          )}
        </div>
      )}

      {/* ═══════ FAB: Chat (top-right) when active order — iOS styled ═══════ */}
      {ordenActiva && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={() => toggleChat(ordenActiva.id)}
          aria-label="Chat con cliente"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            width: 48,
            height: 48,
            borderRadius: 14,
            border: 'none',
            background: 'var(--ios-bg-elevated, #FFFFFF)',
            color: 'var(--ios-blue, #007AFF)',
            boxShadow: 'var(--ios-shadow-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <MessageSquare size={22} />
        </motion.button>
      )}

      {/* ═══════ DESCONECTADO ═══════ */}
      {estado === 'DESCONECTADO' && !mapaExpandido && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'color-mix(in srgb, var(--ios-bg) 70%, transparent)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 5,
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
                background: 'color-mix(in srgb, var(--ios-blue) 12%, transparent)',
                color: 'var(--ios-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Power size={32} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--ios-font)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--ios-text-primary)',
                marginBottom: 8,
                letterSpacing: '-0.01em',
              }}
            >
              Estás desconectado
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--ios-text-secondary)',
                marginBottom: 24,
                lineHeight: 1.5,
                fontFamily: 'var(--ios-font)',
              }}
            >
              Conéctate para empezar a recibir asignaciones de órdenes en tu zona.
            </p>
            <button onClick={handleConectar} className="lf-ios-button">
              <Power size={20} />
              Conectarse
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════ EN_LINEA (waiting for assignment / accepted orders) ═══════ */}
      {estado === 'EN_LINEA' && !mapaExpandido && (
        <>
          {/* Glass card "Esperando asignación" — only when no accepted orders */}
          {ordenesActivas.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: '38%',
                left: 16,
                right: 16,
                transform: 'translateY(-50%)',
                padding: 20,
                borderRadius: 'var(--ios-radius-md, 14px)',
                background: 'color-mix(in srgb, var(--ios-bg-elevated) 92%, transparent)',
                backdropFilter: 'saturate(180%) blur(24px)',
                WebkitBackdropFilter: 'saturate(180%) blur(24px)',
                border: '0.5px solid var(--ios-separator)',
                boxShadow: 'var(--ios-shadow-md)',
                textAlign: 'center',
                zIndex: 5,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'color-mix(in srgb, var(--ios-blue) 14%, transparent)',
                  color: 'var(--ios-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Zap size={28} />
              </motion.div>
              <h3
                style={{
                  fontFamily: 'var(--ios-font)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ios-text-primary)',
                  marginBottom: 4,
                  letterSpacing: '-0.01em',
                }}
              >
                Esperando asignación
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--ios-text-secondary)',
                  fontFamily: 'var(--ios-font)',
                }}
              >
                Te notificaremos cuando llegue una nueva orden.
              </p>
            </motion.div>
          )}

          {/* ═══════ BOTÓN "EMPEZAR VIAJE" GRANDE, FIJO Y VISIBLE ═══════ */}
          {/* Aparece cuando hay 1, 2 o 3 servicios aceptados. */}
          {ordenesActivas.length > 0 && (
            <button
              onClick={handleEmpezarViaje}
              className="lf-ios-start-trip"
              aria-label={`Empezar viaje con ${ordenesActivas.length} orden(es)`}
            >
              <Navigation size={22} />
              🚀 EMPEZAR VIAJE ({ordenesActivas.length})
            </button>
          )}

          {/* ═══════ OFFERS SHEET Uber-style — `.lf-ios-offers-sheet` ═══════ */}
          <div className="lf-ios-offers-sheet">
            {/* Header: Servicios de hoy / Órdenes aceptadas */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--ios-font)',
                    fontSize: 17,
                    fontWeight: 600,
                    color: 'var(--ios-text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {ordenesActivas.length > 0
                    ? `Órdenes aceptadas (${ordenesActivas.length}/3)`
                    : 'Servicios de hoy'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ios-text-tertiary)',
                    fontFamily: 'var(--ios-font)',
                  }}
                >
                  {statsHoy.entregas} entrega{statsHoy.entregas === 1 ? '' : 's'} completada{statsHoy.entregas === 1 ? '' : 's'}
                </div>
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--ios-blue)',
                }}
              >
                {statsHoy.entregas}
              </div>
            </div>

            {/* ═══════ Offer cards (`.lf-ios-offer-card`) ═══════ */}
            {ordenesActivas.map((ord, idx) => {
              const isSelected = ordenActiva?.id === ord.id;
              return (
                <div
                  key={ord.id}
                  className="lf-ios-offer-card"
                  style={
                    isSelected
                      ? {
                          borderColor: 'var(--ios-blue)',
                          boxShadow: '0 0 0 1.5px var(--ios-blue)',
                        }
                      : undefined
                  }
                >
                  {/* Header: #id + tipo badge */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--ios-text-primary)',
                      }}
                    >
                      #{idx + 1} {ord.id}
                    </span>
                    {ord.tipo && (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 8,
                          background: 'var(--ios-bg-tertiary)',
                          color: 'var(--ios-text-secondary)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          fontFamily: 'var(--ios-font)',
                        }}
                      >
                        {ord.tipo}
                      </span>
                    )}
                  </div>

                  {/* 📍 Recogida */}
                  <div className="lf-ios-offer-row">
                    <MapPin size={18} style={{ color: 'var(--ios-green)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--ios-text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontFamily: 'var(--ios-font)',
                        }}
                      >
                        Recogida
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: 'var(--ios-text-primary)',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ord.origen}
                      </div>
                    </div>
                  </div>

                  {/* 🎯 Destino */}
                  <div className="lf-ios-offer-row">
                    <Target size={18} style={{ color: 'var(--ios-blue)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--ios-text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontFamily: 'var(--ios-font)',
                        }}
                      >
                        🎯 Destino
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: 'var(--ios-text-primary)',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ord.destino}
                      </div>
                    </div>
                  </div>

                  {/* 💰 Ganancia + 📏 Distancia */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0 4px',
                      borderTop: '0.5px solid var(--ios-separator)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>📏</span>
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--ios-text-secondary)',
                          fontFamily: 'var(--ios-font)',
                        }}
                      >
                        {ord.kmEstimados.toFixed(1)} km
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--ios-text-tertiary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontFamily: 'var(--ios-font)',
                        }}
                      >
                        Ganancia
                      </div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: 'var(--ios-green)',
                          letterSpacing: '-0.01em',
                          lineHeight: 1.1,
                        }}
                      >
                        C${ord.ganancia.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* ═══════ Offer actions — `.lf-ios-offer-actions` ═══════ */}
                  <div className="lf-ios-offer-actions">
                    <button
                      className="accept"
                      onClick={() => {
                        seleccionarOrdenActiva(ord.id);
                        HAPTIC_PATTERNS.light();
                        showSnackbar({ message: `Orden ${ord.id} seleccionada como activa.` });
                      }}
                    >
                      {isSelected ? 'Seleccionada' : 'Seleccionar'}
                    </button>
                    <button
                      className="reject"
                      onClick={() => {
                        HAPTIC_PATTERNS.light();
                        showSnackbar({
                          message: 'Una orden ya aceptada no se puede rechazar. Inicia el viaje para continuar.'
                        });
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty state hint */}
            {ordenesActivas.length === 0 && (
              <div
                style={{
                  padding: '20px 12px',
                  textAlign: 'center',
                  color: 'var(--ios-text-tertiary)',
                  fontSize: 13,
                  fontFamily: 'var(--ios-font)',
                }}
              >
                Aún no hay órdenes aceptadas. Toca <strong style={{ color: 'var(--ios-text-secondary)' }}>“Buscar órdenes cercanas”</strong> para recibir asignaciones.
              </div>
            )}

            {/* "Buscar Órdenes Cercanas" button — secondary iOS button */}
            <button
              onClick={handleSimularOrden}
              className="lf-ios-button secondary"
              style={{ marginTop: 8 }}
            >
              <PackagePlus size={20} />
              Buscar Órdenes Cercanas
            </button>

            <p
              style={{
                fontSize: 11,
                color: 'var(--ios-text-tertiary)',
                textAlign: 'center',
                marginTop: 8,
                fontFamily: 'var(--ios-font)',
              }}
            >
              Monitoreo activo de pedidos en tiempo real.
            </p>
          </div>
        </>
      )}

      {/* ═══════ EN_CAMINO_RECOGER ═══════ */}
      {estado === 'EN_CAMINO_RECOGER' && !mapaExpandido && ordenActiva && (
        <BottomSheet>
          <SheetHeader
            label="Camino al punto de recogida"
            color={ESTADO_COLOR[estado]}
            icon={<Navigation size={16} />}
          />
          <OrdenMiniCard orden={ordenActiva} showRecogida onOpenChat={() => toggleChat(ordenActiva.id)} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <StatPill icon={<Clock size={14} />} label="ETA" value={`${eta} min`} />
            <StatPill
              icon={<Navigation size={14} />}
              label="Distancia"
              value={`${ordenActiva.kmEstimados.toFixed(1)} km`}
            />
          </div>
          <NavButtons
            target={navTarget}
            onGoogleMaps={openInGoogleMaps}
            onWaze={openInWaze}
          />
          <button
            onClick={handleLlegarRecogida}
            className="lf-ios-button success"
            style={{ marginTop: 8 }}
          >
            <CheckCircle2 size={18} />
            Llegué a recogida
          </button>
        </BottomSheet>
      )}

      {/* ═══════ EN_PUNTO_RECOGIDA ═══════ */}
      {estado === 'EN_PUNTO_RECOGIDA' && !mapaExpandido && ordenActiva && (
        <BottomSheet>
          <SheetHeader
            label="En punto de recogida"
            color={ESTADO_COLOR[estado]}
            icon={<MapPin size={16} />}
          />
          <OrdenMiniCard orden={ordenActiva} showRecogida onOpenChat={() => toggleChat(ordenActiva.id)} />
          <div
            style={{
              padding: 12,
              borderRadius: 'var(--ios-radius-sm, 10px)',
              background: 'rgba(255, 149, 0, 0.10)',
              border: '0.5px solid rgba(255, 149, 0, 0.3)',
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--ios-text-secondary)',
              fontFamily: 'var(--ios-font)',
            }}
          >
            Verifica el paquete y confirma la recogida con el cliente.
          </div>
          <NavButtons
            target={navTarget}
            onGoogleMaps={openInGoogleMaps}
            onWaze={openInWaze}
          />
          <button
            onClick={handleRecoger}
            className="lf-ios-button"
            style={{ marginTop: 8 }}
          >
            {ordenActiva.tipo === 'compra' ? <Store size={18} /> : <Package size={18} />}
            {ordenActiva.tipo === 'compra'
              ? `Recoger pedido de ${ordenActiva.tiendaNombre || 'la tienda'}`
              : 'Recogí paquete'}
          </button>
        </BottomSheet>
      )}

      {/* ═══════ RECOGIDO (en camino a entrega) ═══════ */}
      {estado === 'RECOGIDO' && !mapaExpandido && ordenActiva && (
        <BottomSheet>
          <SheetHeader
            label="En camino a la entrega"
            color={ESTADO_COLOR[estado]}
            icon={<Navigation size={16} />}
          />
          {/* Km counter with vertical slide */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '0.5px solid var(--ios-separator)',
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--ios-text-tertiary)',
                  marginBottom: 2,
                  fontFamily: 'var(--ios-font)',
                }}
              >
                Recorrido
              </div>
              <KmCounter value={kmRecorridos} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--ios-text-tertiary)',
                  marginBottom: 2,
                  fontFamily: 'var(--ios-font)',
                }}
              >
                Tiempo
              </div>
              <TiempoDisplay key={ordenActiva?.id || 'none'} />
            </div>
          </div>
          {/* Progress bar */}
          <div
            className="lf-progress lf-progress-sm"
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--ios-bg-secondary)',
              overflow: 'hidden',
              marginBottom: 4,
            }}
          >
            <motion.div
              className="lf-progress-fill"
              animate={{
                width: `${Math.min(100, (kmRecorridos / Math.max(0.1, ordenActiva.kmEstimados)) * 100)}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', background: 'var(--ios-blue)' }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--ios-text-tertiary)',
              marginBottom: 12,
              fontFamily: 'var(--ios-font)',
            }}
          >
            <span>{kmRecorridos.toFixed(2)} km</span>
            <span>{ordenActiva.kmEstimados.toFixed(2)} km</span>
          </div>
          {/* ETA chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 'var(--ios-radius-sm, 10px)',
              background: 'rgba(0, 122, 255, 0.10)',
              marginBottom: 12,
            }}
          >
            <Clock size={16} color="var(--ios-blue)" />
            <span
              style={{
                fontSize: 13,
                color: 'var(--ios-text-secondary)',
                fontFamily: 'var(--ios-font)',
              }}
            >
              Llegada estimada en
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 14, fontWeight: 700, color: 'var(--ios-text-primary)' }}
            >
              {eta} min
            </span>
          </div>
          <NavButtons
            target={navTarget}
            onGoogleMaps={openInGoogleMaps}
            onWaze={openInWaze}
          />
          <button
            onClick={handleLlegarEntrega}
            className="lf-ios-button"
            style={{ marginTop: 8 }}
          >
            <CheckCircle2 size={18} />
            Llegué a entrega
          </button>
        </BottomSheet>
      )}

      {/* ═══════ EN_PUNTO_ENTREGA ═══════ */}
      {estado === 'EN_PUNTO_ENTREGA' && !mapaExpandido && ordenActiva && (
        <BottomSheet>
          <SheetHeader
            label="En punto de entrega"
            color={ESTADO_COLOR[estado]}
            icon={<MapPin size={16} />}
          />
          <OrdenMiniCard orden={ordenActiva} showEntrega onOpenChat={() => toggleChat(ordenActiva.id)} />
          <div
            style={{
              padding: 12,
              borderRadius: 'var(--ios-radius-sm, 10px)',
              background: 'rgba(52, 199, 89, 0.10)',
              border: '0.5px solid rgba(52, 199, 89, 0.3)',
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--ios-text-secondary)',
              fontFamily: 'var(--ios-font)',
            }}
          >
            Entrega el paquete a <strong style={{ color: 'var(--ios-text-primary)' }}>{ordenActiva.cliente}</strong> y confirma la entrega.
          </div>
          <NavButtons
            target={navTarget}
            onGoogleMaps={openInGoogleMaps}
            onWaze={openInWaze}
          />
          <button
            onClick={handleConfirmarEntrega}
            className="lf-ios-button success"
            style={{ marginTop: 8 }}
          >
            <CheckCircle2 size={18} />
            Entregué
          </button>
          <button
            onClick={() => toggleIncidencia(true)}
            className="lf-ios-button danger"
            style={{
              marginTop: 8,
              background: 'transparent',
              color: 'var(--ios-red)',
              border: '1px solid var(--ios-red)',
            }}
          >
            <AlertTriangle size={18} />
            Reportar incidencia
          </button>
        </BottomSheet>
      )}

      {/* ORDEN_ASIGNADA / INCIDENCIA: handiled by dedicated floating cards/modals without obscuring the interactive map */}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NAV BUTTONS — Google Maps / Waze (secondary)
   NUNCA se sale automáticamente — usa window.open()
   ═══════════════════════════════════════════════ */

function NavButtons({
  target,
  onGoogleMaps,
  onWaze,
}: {
  target: { lat: number; lng: number; label: string } | null;
  onGoogleMaps: (lat: number, lng: number) => void;
  onWaze: (lat: number, lng: number) => void;
}) {
  if (!target) return null;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <button
        onClick={() => onGoogleMaps(target.lat, target.lng)}
        aria-label={`Abrir ${target.label} en Google Maps`}
        style={{
          flex: 1,
          minHeight: 44,
          padding: '8px 12px',
          borderRadius: 'var(--ios-radius-sm, 10px)',
          border: '0.5px solid var(--ios-separator)',
          background: 'var(--ios-bg-secondary)',
          color: 'var(--ios-text-primary)',
          fontFamily: 'var(--ios-font)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 0.15s ease',
        }}
      >
        Google Maps
      </button>
      <button
        onClick={() => onWaze(target.lat, target.lng)}
        aria-label={`Abrir ${target.label} en Waze`}
        style={{
          flex: 1,
          minHeight: 44,
          padding: '8px 12px',
          borderRadius: 'var(--ios-radius-sm, 10px)',
          border: '0.5px solid var(--ios-separator)',
          background: 'var(--ios-bg-secondary)',
          color: 'var(--ios-text-primary)',
          fontFamily: 'var(--ios-font)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 0.15s ease',
        }}
      >
        🧭 Waze
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REUSABLE UI BITS
   ═══════════════════════════════════════════════ */

function BottomSheet({ children }: { children: React.ReactNode }) {
  const SNAP_POINTS = [
    { id: 'min', height: 16 },
    { id: 'med', height: 46 },
    { id: 'max', height: 80 }
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
        /* Sit above the iOS tab bar (avoids overlap) */
        bottom: 'calc(var(--ios-tabbar-height) + var(--ios-tabbar-safe))',
      }}
      {...handlers}
    >
      <div className="sheet-handle-area">
        <div className="sheet-handle" />
        <div className="sheet-snap-indicator">
          {SNAP_POINTS.map(snap => (
            <div
              key={snap.id}
              className={`sheet-snap-dot ${currentSnap === snap.id ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
      <div
        className="sheet-scroll-content"
        style={{
          /* Override default bottom padding — sheet is already above tab bar */
          paddingBottom: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SheetHeader({
  label,
  color,
  icon,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
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
      <h3
        style={{
          fontFamily: 'var(--ios-font)',
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--ios-text-primary)',
          letterSpacing: '-0.01em',
          margin: 0,
        }}
      >
        {label}
      </h3>
    </div>
  );
}

function OrdenMiniCard({
  orden,
  showRecogida,
  showEntrega,
  onOpenChat,
}: {
  orden: OrdenActiva;
  showRecogida?: boolean;
  showEntrega?: boolean;
  onOpenChat?: () => void;
}) {
  const targetLat = showEntrega ? orden.destinoLat : orden.origenLat;
  const targetLng = showEntrega ? orden.destinoLng : orden.origenLng;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetLat || 12.1365},${targetLng || -86.2514}`;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 'var(--ios-radius-md, 14px)',
        background: 'var(--ios-bg-secondary)',
        border: '0.5px solid var(--ios-separator)',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div>
          <span
            className="font-mono"
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--ios-text-primary)' }}
          >
            {orden.id}
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--ios-text-tertiary)',
              marginLeft: 8,
              fontFamily: 'var(--ios-font)',
            }}
          >
            {orden.cliente}
          </span>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 100,
            background:
              orden.tipo === 'compra'
                ? 'rgba(0, 122, 255, 0.12)'
                : 'rgba(175, 82, 222, 0.12)',
            color:
              orden.tipo === 'compra' ? 'var(--ios-blue)' : 'var(--ios-purple, #AF52DE)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'capitalize',
            fontFamily: 'var(--ios-font)',
          }}
        >
          {orden.tipo}
        </span>
      </div>

      {(showRecogida || (!showRecogida && !showEntrega)) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ios-green)', marginTop: 4, flexShrink: 0 }} />
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--ios-text-tertiary)',
                fontWeight: 700,
                textTransform: 'uppercase',
                fontFamily: 'var(--ios-font)',
              }}
            >
              Recoger en
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--ios-text-primary)',
                fontWeight: 500,
                lineHeight: 1.3,
                fontFamily: 'var(--ios-font)',
              }}
            >
              {orden.origen}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ios-blue)', marginTop: 4, flexShrink: 0 }} />
        <div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--ios-text-tertiary)',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'var(--ios-font)',
            }}
          >
            Entregar a
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--ios-text-primary)',
              fontWeight: 600,
              lineHeight: 1.3,
              fontFamily: 'var(--ios-font)',
            }}
          >
            {orden.destino}
          </div>
        </div>
      </div>

      {/* ─── 1-Tap Quick Action Buttons for Motorcycle Drivers ─── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingTop: 10,
          borderTop: '0.5px solid var(--ios-separator)',
        }}
      >
        {orden.clienteTelefono && (
          <a
            href={`tel:${orden.clienteTelefono}`}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 'var(--ios-radius-sm, 10px)',
              background: 'rgba(52, 199, 89, 0.12)',
              color: 'var(--ios-green)',
              fontWeight: 700,
              fontSize: 12,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: 'var(--ios-font)',
            }}
          >
            📞 Llamar
          </a>
        )}

        {onOpenChat && (
          <button
            onClick={onOpenChat}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 'var(--ios-radius-sm, 10px)',
              border: 'none',
              background: 'rgba(0, 122, 255, 0.12)',
              color: 'var(--ios-blue)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: 'var(--ios-font)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Chat
          </button>
        )}

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1.2,
            padding: '8px 10px',
            borderRadius: 'var(--ios-radius-sm, 10px)',
            background: 'var(--ios-blue)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 12,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontFamily: 'var(--ios-font)',
          }}
        >
          Navegar GPS
        </a>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '8px 10px',
        borderRadius: 'var(--ios-radius-sm, 10px)',
        background: 'var(--ios-bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: 'var(--ios-text-tertiary)',
          fontSize: 11,
          fontFamily: 'var(--ios-font)',
        }}
      >
        {icon}
        {label}
      </div>
      <div
        className="font-mono"
        style={{ fontSize: 14, fontWeight: 700, color: 'var(--ios-text-primary)' }}
      >
        {value}
      </div>
    </div>
  );
}

/* PrimaryButton — kept for backward-compat (no longer used by main render,
   but exported for any external consumer). */
function PrimaryButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="lf-ios-button"
    >
      {icon}
      {children}
    </motion.button>
  );
}
