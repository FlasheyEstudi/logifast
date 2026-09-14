'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Package, Navigation, Clock, Power, MessageSquare, AlertTriangle,
  Zap, Phone, Compass, Key, Bike, Flame, CheckCircle, X, ArrowRight,
  Layers, Maximize2, ChevronDown, ChevronUp, Eye, FileText, Check, Store,
  User, ShieldCheck, DollarSign,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { obtenerRuta, rutaLineaRecta } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';
import { iniciarRastreoFondo, forzarEnvioPosicionGps } from '@/services/background-tracking';
import { obtenerUbicacionActual } from '@/lib/native-geolocation';

import { RepartidorRadarLoader } from '@/components/ui/loaders';

const RepartidorMap = dynamic(() => import('./RepartidorMap'), {
  ssr: false,
  loading: () => <RepartidorRadarLoader message="Iniciando Mapa GPS en Vivo..." />,
});

const ESTADO_COLOR: Record<string, string> = {
  DESCONECTADO: '#FF3B30', EN_LINEA: '#34C759', ORDEN_ASIGNADA: '#FF9500',
  EN_CAMINO_RECOGER: '#007AFF', EN_PUNTO_RECOGIDA: '#FF9500',
  RECOGIDO: '#AF52DE', EN_PUNTO_ENTREGA: '#34C759', INCIDENCIA: '#FF3B30',
};

const ESTADO_LABEL: Record<string, string> = {
  DESCONECTADO: 'Desconectado', EN_LINEA: 'En Línea', ORDEN_ASIGNADA: 'Orden Asignada',
  EN_CAMINO_RECOGER: 'En camino', EN_PUNTO_RECOGIDA: 'En recogida',
  RECOGIDO: 'Paquete recogido', EN_PUNTO_ENTREGA: 'En entrega', INCIDENCIA: 'Incidencia',
};

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25)', padding: 18,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 16, border: '1px solid var(--border)',
  background: 'var(--bg-alt)', color: 'var(--text)', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '13px 20px', borderRadius: 100, border: 'none', background: 'var(--primario)',
  color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%', boxShadow: '0 4px 14px rgba(255,87,34,0.3)',
};

const btnGhost: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 100, border: '1px solid var(--border)',
  background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600,
  fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

export default function RepartidorServicio() {
  const {
    estado, conectado, ordenActiva, ordenesActivas = [], ordenAsignadaPendiente, ofertasDisponibles = [], lat, lng, eta, perfil,
    conectar, desconectar, optimizarRutaAutomatica, seleccionarOrdenActiva, llegarRecogida, recogerPaquete,
    llegarEntrega, confirmarEntrega, toggleChat, toggleIncidencia,
    aceptarOfertaDirecta, rechazarOfertaDirecta, obtenerStats, verificarProductos,
  } = useRepartidorStore();

  const showSnackbar = useRepartidorSnackbar();

  const [periodoGanancias, setPeriodoGanancias] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const statsGanancias = obtenerStats(periodoGanancias);

  const [showPinModal, setShowPinModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [rutaCoordenadas, setRutaCoordenadas] = useState<[number,number][]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mapTilt, setMapTilt] = useState(false);

  // Asegurar que el mapa del repartidor capture su posición GPS satelital real al abrirse
  useEffect(() => {
    obtenerUbicacionActual({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 })
      .then((res) => {
        if (res.ok && typeof res.lat === 'number' && typeof res.lng === 'number') {
          useRepartidorStore.getState().actualizarPosicion(res.lat, res.lng);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!ordenActiva) { setRutaCoordenadas([]); return; }
    let cancelled = false;
    const hasOrigCoords = typeof ordenActiva.origenLat === 'number' && typeof ordenActiva.origenLng === 'number' && (ordenActiva.origenLat !== 0 || ordenActiva.origenLng !== 0);
    const hasDestCoords = typeof ordenActiva.destinoLat === 'number' && typeof ordenActiva.destinoLng === 'number' && (ordenActiva.destinoLat !== 0 || ordenActiva.destinoLng !== 0);

    const destino = (estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA')
      ? (hasOrigCoords ? { lat: ordenActiva.origenLat, lng: ordenActiva.origenLng } : null)
      : (hasDestCoords ? { lat: ordenActiva.destinoLat, lng: ordenActiva.destinoLng } : null);

    if (!destino) { setRutaCoordenadas([]); return; }
    obtenerRuta({ lat, lng }, destino)
      .then(res => { if (cancelled) return; setRutaCoordenadas(res.exito && res.coordenadas.length > 1 ? res.coordenadas : rutaLineaRecta({ lat, lng }, destino)); })
      .catch(() => { if (cancelled) return; setRutaCoordenadas(rutaLineaRecta({ lat, lng }, destino)); });
    return () => { cancelled = true; };
  }, [ordenActiva, estado, lat, lng]);

  const origenPos: [number, number] | undefined =
    ordenActiva && ordenActiva.origenLat && ordenActiva.origenLng
      ? [ordenActiva.origenLat, ordenActiva.origenLng]
      : undefined;
  const destinoPos: [number, number] | undefined =
    ordenActiva && ordenActiva.destinoLat && ordenActiva.destinoLng
      ? [ordenActiva.destinoLat, ordenActiva.destinoLng]
      : undefined;

  const handleToggleConnection = () => {
    if (conectado) {
      desconectar(); HAPTIC_PATTERNS.medium(); showSnackbar({ message: 'Te has desconectado.' });
    } else {
      if (!perfil.contratoAceptado) { showSnackbar({ message: 'Debes firmar el contrato en tu Perfil.' }); HAPTIC_PATTERNS.error(); return; }
      conectar(); HAPTIC_PATTERNS.medium(); showSnackbar({ message: 'Te has conectado en línea.' });
    }
  };

  const handleEmpezarViaje = () => {
    optimizarRutaAutomatica();
    useRepartidorStore.setState({ estado: 'EN_CAMINO_RECOGER', enServicio: true });
    HAPTIC_PATTERNS.success();
    showSnackbar({ message: 'Viaje iniciado hacia la recogida.' });
  };

  const handleConfirmarPin = () => {
    const targetPin = (ordenActiva as any)?.codigoPin || (ordenActiva as any)?.codigoEntrega;
    const cleanInput = pinInput.trim();
    if (!cleanInput || cleanInput.length < 4) {
      setPinError(true);
      HAPTIC_PATTERNS.error();
      return;
    }
    const realPin = targetPin ? String(targetPin).trim() : '';
    if (realPin && cleanInput === realPin) {
      confirmarEntrega();
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
      HAPTIC_PATTERNS.success();
      showSnackbar({ message: 'Entrega confirmada con éxito con PIN de seguridad.' });
    } else {
      setPinError(true);
      HAPTIC_PATTERNS.error();
    }
  };

  const handleNavegarDestino = (tipo: 'recogida' | 'entrega') => {
    if (!ordenActiva) return;
    const isPickup = tipo === 'recogida';
    const targetLat = isPickup ? ordenActiva.origenLat : ordenActiva.destinoLat;
    const targetLng = isPickup ? ordenActiva.origenLng : ordenActiva.destinoLng;
    const hasValidCoords = Boolean(targetLat && targetLng && targetLat !== 0 && targetLng !== 0);
    const label = isPickup ? (ordenActiva.tiendaNombre || ordenActiva.origen) : ordenActiva.destino;
    const destinationQuery = hasValidCoords ? `${targetLat},${targetLng}` : encodeURIComponent(label || 'Managua, Nicaragua');

    iniciarRastreoFondo(ordenActiva?.id, estado);
    forzarEnvioPosicionGps(ordenActiva?.id, estado);
    showSnackbar({ message: `GPS iniciado hacia ${isPickup ? 'Punto de Recogida' : 'Punto de Entrega'}.` });
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`, '_blank');
  };

  const handleNavegarWaze = (tipo: 'recogida' | 'entrega') => {
    if (!ordenActiva) return;
    const isPickup = tipo === 'recogida';
    const targetLat = isPickup ? ordenActiva.origenLat : ordenActiva.destinoLat;
    const targetLng = isPickup ? ordenActiva.origenLng : ordenActiva.destinoLng;
    const hasValidCoords = Boolean(targetLat && targetLng && targetLat !== 0 && targetLng !== 0);
    const label = isPickup ? (ordenActiva.tiendaNombre || ordenActiva.origen) : ordenActiva.destino;

    iniciarRastreoFondo(ordenActiva?.id, estado);
    forzarEnvioPosicionGps(ordenActiva?.id, estado);
    showSnackbar({ message: `Waze iniciado hacia ${isPickup ? 'Punto de Recogida' : 'Punto de Entrega'}.` });
    if (hasValidCoords) {
      window.open(`https://waze.com/ul?ll=${targetLat},${targetLng}&navigate=yes`, '_blank');
    } else {
      window.open(`https://waze.com/ul?q=${encodeURIComponent(label || 'Managua, Nicaragua')}&navigate=yes`, '_blank');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* MAPA PANTALLA COMPLETA */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <RepartidorMap
          repartidorPos={[lat, lng]}
          origenPos={origenPos}
          destinoPos={destinoPos}
          rutaCoordenadas={rutaCoordenadas.length > 1 ? rutaCoordenadas : undefined}
          ordenesActivas={ordenesActivas}
          ordenActivaId={ordenActiva?.id}
          onSelectOrden={seleccionarOrdenActiva}
          estado={estado}
          altura="100%"
          seguirRepartidor
          mostrarNavegacionDriver={true}
          controlsBottomOffset={
            drawerOpen
              ? ordenActiva
                ? 'calc(var(--ios-tabbar-height, 65px) + 240px)'
                : 'calc(var(--ios-tabbar-height, 65px) + 125px)'
              : 'calc(var(--ios-tabbar-height, 65px) + 25px)'
          }
        />
      </div>

      {/* ── BARRA DE RUTA MULTI-PEDIDOS OPTIMIZADA (3/3 PEDIDOS) ── */}
      {ordenesActivas && ordenesActivas.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: 118,
            left: 16,
            right: 16,
            maxWidth: 580,
            margin: '0 auto',
            zIndex: 25,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 16,
            padding: '8px 12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 8px #34C759' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#F8FAFC', fontFamily: "'Syne', sans-serif", letterSpacing: 0.3 }}>
                Ruta Optimizada ({ordenesActivas.length}/3 pedidos)
              </span>
            </div>
            <button
              onClick={() => {
                optimizarRutaAutomatica();
                showSnackbar({ message: 'Ruta reorganizada: mas cercana primero.' });
              }}
              style={{
                background: 'rgba(0, 122, 255, 0.25)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 100,
                padding: '3px 9px',
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Reoptimizar</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {ordenesActivas.map((ord, idx) => {
              const isSelected = ord.id === ordenActiva?.id;
              const km = ord.kmEstimados && ord.kmEstimados > 0 ? `${ord.kmEstimados.toFixed(1)}km` : '';
              return (
                <button
                  key={ord.id}
                  onClick={() => seleccionarOrdenActiva(ord.id)}
                  style={{
                    flex: '1 0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(0, 122, 255, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                    border: isSelected ? '1.5px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isSelected ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: isSelected ? 800 : 600,
                    transition: 'all 0.15s',
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: isSelected ? '#007AFF' : 'rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span>{ord.cliente?.split(' ')[0] || `Orden #${idx + 1}`}</span>
                  {km && (
                    <span style={{ color: isSelected ? '#67E8F9' : '#64748B', fontFamily: 'monospace', fontSize: 10 }}>
                      {km}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}


      {/* ── HANDLE visible cuando drawer está cerrado (colapsado a la izquierda) */}
      {!drawerOpen && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setDrawerOpen(true)}
          style={{
            position: 'absolute',
            bottom: 'calc(var(--ios-tabbar-height, 65px) + 20px)',
            left: 16,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 100,
            background: 'color-mix(in srgb, var(--surface) 96%, transparent)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            color: 'var(--text)',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          <ChevronUp size={16} style={{ color: 'var(--primario)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {estado === 'EN_LINEA' && !ordenActiva && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 6px #34C759', flexShrink: 0 }} />
            )}
            <span>
              {ordenActiva
                ? `${ordenActiva.cliente} • Ver detalles`
                : estado === 'EN_LINEA'
                ? 'En Línea • Buscando órdenes'
                : 'Ver panel'}
            </span>
          </span>
        </motion.button>
      )}

      {/* ── CARD DRAWER INFERIOR */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              position: 'absolute',
              bottom: 'calc(var(--ios-tabbar-height, 65px) + 16px)',
              left: 12,
              right: 12,
              zIndex: 30,
              maxWidth: 580,
              margin: '0 auto',
            }}
          >
            {/* DESCONECTADO */}
            {estado === 'DESCONECTADO' && (
              <div
                style={{
                  ...sectionCard,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  borderRadius: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF3B30', boxShadow: '0 0 8px #FF3B30' }} />
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                      Estás Desconectado
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      Conéctate para recibir solicitudes de viaje.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleConnection}
                  style={{
                    ...btnPrimary,
                    width: 'auto',
                    padding: '10px 20px',
                    background: '#34C759',
                    fontSize: 13,
                    boxShadow: '0 4px 14px rgba(52,199,89,0.3)',
                  }}
                >
                  Conectar
                </button>
              </div>
            )}

            {/* EN LÍNEA - CON BOLSA DE OFERTAS DISPONIBLES */}
            {estado === 'EN_LINEA' && !ordenActiva && (ordenAsignadaPendiente || ofertasDisponibles.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 10px #34C759' }} />
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}>
                      Ofertas Disponibles ({ordenAsignadaPendiente ? 1 : ofertasDisponibles.length})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Toca para aceptar</span>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      title="Colapsar panel"
                      style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>

                {(ordenAsignadaPendiente ? [ordenAsignadaPendiente] : ofertasDisponibles).map((oferta) => (
                  <div
                    key={oferta.id}
                    style={{
                      ...sectionCard,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      border: '2px solid #34C759',
                      background: 'rgba(52, 199, 89, 0.08)',
                      boxShadow: '0 8px 24px rgba(52, 199, 89, 0.15)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ padding: '3px 8px', borderRadius: 8, background: oferta.tipo === 'compra' ? 'var(--primario)' : 'var(--info)', color: '#FFFFFF', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                          {oferta.tipo === 'compra' ? 'Tienda' : 'Envío Express'}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                          {oferta.tipo === 'compra' ? (oferta.tiendaNombre || oferta.origen) : oferta.cliente}
                        </span>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>
                        +C$ {(oferta.ganancia || oferta.monto || 0).toFixed(2)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ color: 'var(--primario)', fontWeight: 800 }}>• Recogida:</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{oferta.origen}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ color: '#34C759', fontWeight: 800 }}>• Entrega:</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{oferta.destino}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => rechazarOfertaDirecta(oferta.id)}
                        style={{ ...btnGhost, flex: 1, color: '#FF3B30', borderColor: 'rgba(255,59,48,0.3)' }}
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => aceptarOfertaDirecta(oferta)}
                        style={{ ...btnPrimary, flex: 2, background: '#34C759', boxShadow: '0 4px 16px rgba(52,199,89,0.4)' }}
                      >
                        ACEPTAR PEDIDO
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EN LÍNEA - ESCANEANDO ZONA */}
            {estado === 'EN_LINEA' && !ordenActiva && !ordenAsignadaPendiente && ofertasDisponibles.length === 0 && (
              <div
                style={{
                  ...sectionCard,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderRadius: 20,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 10px #34C759', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      En Línea • Buscando órdenes
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Hoy: <strong style={{ color: '#34C759', fontFamily: "'JetBrains Mono', monospace" }}>C$ {statsGanancias.ganancias.toFixed(2)}</strong> ({statsGanancias.entregas} {statsGanancias.entregas === 1 ? 'entrega' : 'entregas'})
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={handleToggleConnection}
                    style={{
                      background: 'rgba(255, 59, 48, 0.12)',
                      color: '#FF3B30',
                      border: '1px solid rgba(255, 59, 48, 0.25)',
                      borderRadius: 100,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Pausar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    title="Minimizar panel para despejar el mapa"
                    aria-label="Minimizar panel"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ChevronDown size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* CON ORDEN ACTIVA */}
            {ordenActiva && (
              <div
                style={{
                  ...sectionCard,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderRadius: 22,
                  padding: '14px 16px',
                }}
              >
                {/* Header: Cliente + Ganancia + Botón Ver Detalle + Botón Colapsar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: ordenActiva.tipo === 'compra' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(175, 82, 222, 0.15)', color: ordenActiva.tipo === 'compra' ? '#007AFF' : '#AF52DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {ordenActiva.tipo === 'compra' ? <Store size={18} /> : <Package size={18} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ordenActiva.tipo === 'compra' && ordenActiva.tiendaNombre ? ordenActiva.tiendaNombre : ordenActiva.cliente}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: (estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA') ? '#007AFF' : '#34C759' }}>
                          {(estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA') ? 'Paso 1: Recogida' : 'Paso 2: Entrega'}
                        </span>
                        {ordenesActivas.length > 1 && <span>• Orden {ordenesActivas.findIndex((o) => o.id === ordenActiva.id) + 1}/{ordenesActivas.length}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {/* Botón Ver Detalle */}
                    <button
                      type="button"
                      onClick={() => setShowDetalleModal(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px', borderRadius: 100,
                        background: 'rgba(0, 122, 255, 0.12)', border: '1px solid rgba(0, 122, 255, 0.25)',
                        color: '#007AFF', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}
                      title="Ver información y productos del pedido"
                    >
                      <Eye size={13} />
                      <span>Detalle</span>
                    </button>

                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>
                      +C$ {(ordenActiva.ganancia || ordenActiva.monto || 0).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title="Minimizar panel"
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>
                </div>

                {/* ─── DESGLOSE DE LAS DOS UBICACIONES (PUNTO 1 Y PUNTO 2) ─── */}
                {(() => {
                  const isPickupLeg = estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA';
                  return (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 7,
                      background: 'var(--bg-alt)',
                      borderRadius: 14,
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                    }}>
                      {/* Punto 1: Recogida */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: isPickupLeg ? '#007AFF' : 'rgba(0, 122, 255, 0.2)',
                            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, flexShrink: 0
                          }}>
                            1
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: '#007AFF', textTransform: 'uppercase' }}>
                                {ordenActiva.tipo === 'compra' ? 'Tienda / Recogida' : 'Punto 1: Recogida'}
                              </span>
                              {isPickupLeg && (
                                <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(0, 122, 255, 0.18)', color: '#007AFF', padding: '1px 6px', borderRadius: 100 }}>
                                  ACTUAL
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ordenActiva.tipo === 'compra' && ordenActiva.tiendaNombre ? `${ordenActiva.tiendaNombre} — ${ordenActiva.origen}` : ordenActiva.origen}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavegarDestino('recogida')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 9px', borderRadius: 8,
                            background: isPickupLeg ? '#007AFF' : 'rgba(0, 122, 255, 0.12)',
                            color: isPickupLeg ? '#FFFFFF' : '#007AFF',
                            border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, flexShrink: 0,
                          }}
                          title="Navegar a Punto de Recogida"
                        >
                          <Compass size={13} />
                          <span>Ir a Recogida</span>
                        </button>
                      </div>

                      {/* Divisor conector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10 }}>
                        <div style={{ width: 2, height: 8, background: 'var(--border)' }} />
                      </div>

                      {/* Punto 2: Entrega */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: !isPickupLeg ? '#34C759' : 'rgba(52, 199, 89, 0.2)',
                            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, flexShrink: 0
                          }}>
                            2
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: '#34C759', textTransform: 'uppercase' }}>
                                Punto 2: Entrega ({ordenActiva.cliente})
                              </span>
                              {!isPickupLeg && (
                                <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(52, 199, 89, 0.18)', color: '#34C759', padding: '1px 6px', borderRadius: 100 }}>
                                  ACTUAL
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ordenActiva.destino}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavegarDestino('entrega')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 9px', borderRadius: 8,
                            background: !isPickupLeg ? '#34C759' : 'rgba(52, 199, 89, 0.12)',
                            color: !isPickupLeg ? '#FFFFFF' : '#34C759',
                            border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, flexShrink: 0,
                          }}
                          title="Navegar a Punto de Entrega"
                        >
                          <Compass size={13} />
                          <span>Ir a Entrega</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* TOOLBAR ERGONÓMICO DE ACCIONES (Detalle, Navegar GPS, Llamar, Chat, Ayuda) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {/* Detalle */}
                  <button
                    type="button"
                    onClick={() => setShowDetalleModal(true)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                      padding: '8px 4px', borderRadius: 12, background: 'rgba(0, 122, 255, 0.12)', border: '1px solid rgba(0, 122, 255, 0.25)',
                      color: '#007AFF', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    }}
                    title="Ver detalle del pedido"
                  >
                    <FileText size={16} />
                    <span>Detalle</span>
                  </button>

                  {/* Navegar a parada actual */}
                  <button
                    type="button"
                    onClick={() => {
                      const headingToPickup = estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA';
                      handleNavegarDestino(headingToPickup ? 'recogida' : 'entrega');
                    }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                      padding: '8px 4px', borderRadius: 12,
                      background: (estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA') ? 'rgba(0, 122, 255, 0.18)' : 'rgba(52, 199, 89, 0.18)',
                      border: (estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA') ? '1px solid rgba(0, 122, 255, 0.35)' : '1px solid rgba(52, 199, 89, 0.35)',
                      color: (estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA') ? '#007AFF' : '#34C759',
                      cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    }}
                    title="Navegar al paso actual en Google Maps"
                  >
                    <Compass size={16} />
                    <span>{(estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA') ? 'Nav. Rec.' : 'Nav. Entr.'}</span>
                  </button>

                  {/* Llamar */}
                  {ordenActiva.clienteTelefono ? (
                    <a
                      href={`tel:${ordenActiva.clienteTelefono}`}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                        padding: '8px 4px', borderRadius: 12, background: 'rgba(52, 199, 89, 0.12)', border: '1px solid rgba(52, 199, 89, 0.25)',
                        color: '#34C759', cursor: 'pointer', fontSize: 10, fontWeight: 700, textDecoration: 'none',
                      }}
                      title="Llamar al cliente"
                    >
                      <Phone size={16} />
                      <span>Llamar</span>
                    </a>
                  ) : (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                      padding: '8px 4px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)', opacity: 0.5, fontSize: 10, fontWeight: 700,
                    }}>
                      <Phone size={16} />
                      <span>Sin tel.</span>
                    </div>
                  )}

                  {/* Chat */}
                  <button
                    type="button"
                    onClick={() => toggleChat(ordenActiva.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                      padding: '8px 4px', borderRadius: 12, background: 'rgba(175, 82, 222, 0.12)', border: '1px solid rgba(175, 82, 222, 0.25)',
                      color: '#AF52DE', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    }}
                    title="Abrir chat"
                  >
                    <MessageSquare size={16} />
                    <span>Chat</span>
                  </button>

                  {/* Incidencia */}
                  <button
                    type="button"
                    onClick={() => toggleIncidencia(true)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                      padding: '8px 4px', borderRadius: 12, background: 'rgba(255, 59, 48, 0.12)', border: '1px solid rgba(255, 59, 48, 0.25)',
                      color: '#FF3B30', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                    }}
                    title="Reportar problema"
                  >
                    <AlertTriangle size={16} />
                    <span>Ayuda</span>
                  </button>
                </div>

                {/* Botón de paso principal */}
                <div>
                  {estado === 'ORDEN_ASIGNADA' && <button onClick={handleEmpezarViaje} style={btnPrimary}><Bike size={18} /> Iniciar Viaje a Recogida</button>}
                  {estado === 'EN_CAMINO_RECOGER' && <button onClick={llegarRecogida} style={{ ...btnPrimary, background: '#FF9500', boxShadow: '0 4px 14px rgba(255,149,0,0.3)' }}><MapPin size={18} /> Llegué al Punto de Recogida</button>}
                  {estado === 'EN_PUNTO_RECOGIDA' && <button onClick={recogerPaquete} style={{ ...btnPrimary, background: '#AF52DE', boxShadow: '0 4px 14px rgba(175,82,222,0.3)' }}><Package size={18} /> Confirmar Paquete Recogido</button>}
                  {estado === 'RECOGIDO' && <button onClick={llegarEntrega} style={{ ...btnPrimary, background: '#007AFF', boxShadow: '0 4px 14px rgba(0,122,255,0.3)' }}><Navigation size={18} /> Llegué al Punto de Entrega</button>}
                  {estado === 'EN_PUNTO_ENTREGA' && <button onClick={() => setShowPinModal(true)} style={{ ...btnPrimary, background: '#34C759', boxShadow: '0 4px 14px rgba(52,199,89,0.3)' }}><Key size={18} /> Ingresar PIN de Entrega</button>}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PIN */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 999999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: 380, borderRadius: 28, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>Confirmar PIN de Entrega</h3>
                <button onClick={() => setShowPinModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Solicita al cliente su PIN de 4 dígitos.</p>
              <input type="text" maxLength={4} placeholder="••••" value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 10, padding: '16px' }}
              />
              {pinError && <div style={{ fontSize: 12, color: '#FF3B30', fontWeight: 600, textAlign: 'center' }}>PIN incorrecto. Solicita al cliente su código de 4 dígitos.</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowPinModal(false)} style={{ ...btnGhost, flex: 1 }}>Cancelar</button>
                <button onClick={handleConfirmarPin} style={{ ...btnPrimary, flex: 1, background: '#34C759', boxShadow: '0 4px 14px rgba(52,199,89,0.3)' }}>Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DETALLE COMPLETO DEL ENVÍO / PEDIDO */}
      <AnimatePresence>
        {showDetalleModal && ordenActiva && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetalleModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '0 0 max(env(safe-area-inset-bottom, 0px), 10px) 0',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 520,
                maxHeight: '90vh',
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                borderRadius: '28px 28px 20px 20px',
                boxShadow: '0 -16px 48px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Handle bar superior estilo iOS */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
                <div style={{ width: 42, height: 5, borderRadius: 10, background: 'var(--border)' }} />
              </div>

              {/* Header del modal */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 20px 14px 20px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: ordenActiva.tipo === 'compra' ? 'rgba(255, 87, 34, 0.15)' : 'rgba(0, 122, 255, 0.15)',
                    color: ordenActiva.tipo === 'compra' ? 'var(--primario)' : '#007AFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {ordenActiva.tipo === 'compra' ? <Store size={20} /> : <Package size={20} />}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: "'Syne', sans-serif",
                      color: 'var(--text)',
                      margin: 0,
                      lineHeight: 1.2,
                    }}>
                      Detalle del {ordenActiva.tipo === 'compra' ? 'Pedido' : 'Envío'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                        #{ordenActiva.id.slice(-6).toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '1px 7px',
                        borderRadius: 100,
                        background: 'var(--bg-alt)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                      }}>
                        {ordenActiva.tipo === 'compra' ? 'Tienda / Compra' : 'Envío Express'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDetalleModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--bg-alt)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                {/* 1. Resumen Financiero y Estado */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  background: 'var(--bg-alt)',
                  padding: '12px 14px',
                  borderRadius: 18,
                  border: '1px solid var(--border)',
                }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>
                      Tu Ganancia Neta
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>
                      +C$ {(ordenActiva.ganancia || ordenActiva.monto || 0).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>
                      Cobro al Cliente
                    </span>
                    {ordenActiva.metodoPago === 'efectivo' ? (
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#FF9500', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DollarSign size={14} />
                        <span>Cobrar:</span>
                        <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>C$ {ordenActiva.monto.toFixed(2)}</strong>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#34C759', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={14} />
                        <span>Pagado digital</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. LAS DOS UBICACIONES CON NAVEGACIÓN INDEPENDIENTE (GOOGLE MAPS & WAZE) */}
                <div style={{
                  background: 'var(--bg-alt)',
                  borderRadius: 20,
                  padding: '14px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>
                      Ruta de 2 Paradas
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {ordenActiva.kmEstimados ? `${ordenActiva.kmEstimados} km` : ''} {ordenActiva.tiempoEstimado ? `• ~${ordenActiva.tiempoEstimado} min` : ''}
                    </span>
                  </div>

                  {/* PARADA 1: RECOGIDA */}
                  {(() => {
                    const isPickupLeg = estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA' || estado === 'ORDEN_ASIGNADA';
                    return (
                      <div style={{
                        borderRadius: 14,
                        padding: 12,
                        background: isPickupLeg ? 'rgba(0, 122, 255, 0.08)' : 'var(--surface)',
                        border: isPickupLeg ? '1.5px solid rgba(0, 122, 255, 0.4)' : '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: '#007AFF',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                              flexShrink: 0,
                              marginTop: 1,
                            }}>
                              1
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#007AFF', textTransform: 'uppercase' }}>
                                  {ordenActiva.tipo === 'compra' ? 'Punto 1: Tienda / Compra' : 'Punto 1: Recogida (Remitente)'}
                                </span>
                                {isPickupLeg && (
                                  <span style={{ fontSize: 9, fontWeight: 800, background: '#007AFF', color: '#fff', padding: '1px 6px', borderRadius: 100 }}>
                                    EN CURSO
                                  </span>
                                )}
                              </div>
                              {ordenActiva.tiendaNombre && (
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                                  {ordenActiva.tiendaNombre}
                                </div>
                              )}
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, wordBreak: 'break-word', lineHeight: 1.35 }}>
                                {ordenActiva.origen}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botones de navegación para la parada 1 */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleNavegarDestino('recogida')}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '8px 12px',
                              borderRadius: 10,
                              background: '#007AFF',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
                            }}
                          >
                            <Compass size={14} />
                            <span>Google Maps</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavegarWaze('recogida')}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '8px 12px',
                              borderRadius: 10,
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Navigation size={14} />
                            <span>Waze</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* PARADA 2: ENTREGA */}
                  {(() => {
                    const isDeliveryLeg = estado === 'RECOGIDO' || estado === 'EN_PUNTO_ENTREGA';
                    return (
                      <div style={{
                        borderRadius: 14,
                        padding: 12,
                        background: isDeliveryLeg ? 'rgba(52, 199, 89, 0.08)' : 'var(--surface)',
                        border: isDeliveryLeg ? '1.5px solid rgba(52, 199, 89, 0.4)' : '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: '#34C759',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                              flexShrink: 0,
                              marginTop: 1,
                            }}>
                              2
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#34C759', textTransform: 'uppercase' }}>
                                  Punto 2: Entrega (Cliente)
                                </span>
                                {isDeliveryLeg && (
                                  <span style={{ fontSize: 9, fontWeight: 800, background: '#34C759', color: '#fff', padding: '1px 6px', borderRadius: 100 }}>
                                    EN CURSO
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                                {ordenActiva.cliente}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, wordBreak: 'break-word', lineHeight: 1.35 }}>
                                {ordenActiva.destino}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botones de navegación para la parada 2 */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleNavegarDestino('entrega')}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '8px 12px',
                              borderRadius: 10,
                              background: '#34C759',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(52,199,89,0.3)',
                            }}
                          >
                            <Compass size={14} />
                            <span>Google Maps</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavegarWaze('entrega')}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '8px 12px',
                              borderRadius: 10,
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Navigation size={14} />
                            <span>Waze</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Contacto con el Cliente */}
                <div style={{
                  background: 'var(--bg-alt)',
                  borderRadius: 18,
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text)',
                      flexShrink: 0,
                    }}>
                      <User size={18} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ordenActiva.cliente}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {ordenActiva.clienteTelefono || 'Sin teléfono registrado'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {ordenActiva.clienteTelefono && (
                      <a
                        href={`tel:${ordenActiva.clienteTelefono}`}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(52, 199, 89, 0.15)',
                          border: '1px solid rgba(52, 199, 89, 0.3)',
                          color: '#34C759',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                        title="Llamar al cliente"
                      >
                        <Phone size={16} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        toggleChat(ordenActiva.id);
                        setShowDetalleModal(false);
                      }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'rgba(175, 82, 222, 0.15)',
                        border: '1px solid rgba(175, 82, 222, 0.3)',
                        color: '#AF52DE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Abrir chat con cliente"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>

                {/* 4. Checklist de Productos o Info del Paquete */}
                {ordenActiva.productos && ordenActiva.productos.length > 0 ? (
                  <div style={{
                    background: 'var(--bg-alt)',
                    borderRadius: 18,
                    padding: '14px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Checklist de Productos ({ordenActiva.productos.filter((p) => p.verificado).length}/{ordenActiva.productos.length})
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primario)' }}>
                        Toca para verificar
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ordenActiva.productos.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            verificarProductos(prod.id);
                            HAPTIC_PATTERNS.light();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: 12,
                            background: prod.verificado ? 'rgba(52, 199, 89, 0.1)' : 'var(--surface)',
                            border: prod.verificado ? '1px solid rgba(52, 199, 89, 0.3)' : '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                            <div style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: prod.verificado ? '#34C759' : 'transparent',
                              border: prod.verificado ? 'none' : '2px solid var(--text-muted)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {prod.verificado && <Check size={14} />}
                            </div>
                            <span style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: prod.verificado ? 'var(--text)' : 'var(--text-secondary)',
                              textDecoration: prod.verificado ? 'line-through' : 'none',
                              opacity: prod.verificado ? 0.75 : 1,
                            }}>
                              {prod.nombre}
                            </span>
                          </div>

                          <span style={{
                            fontSize: 12,
                            fontWeight: 800,
                            fontFamily: "'JetBrains Mono', monospace",
                            padding: '2px 8px',
                            borderRadius: 100,
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                          }}>
                            x{prod.cantidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--bg-alt)',
                    borderRadius: 18,
                    padding: '14px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Detalles del Paquete Express
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {ordenActiva.paquete || 'Paquete o sobre sellado'}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {ordenActiva.tamano && (
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                            {ordenActiva.tamano}
                          </span>
                        )}
                        {ordenActiva.fragil && (
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: 'rgba(255, 59, 48, 0.15)', border: '1px solid rgba(255, 59, 48, 0.3)', color: '#FF3B30', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={12} />
                            <span>Frágil</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {ordenActiva.paqueteFotoUrl && (
                      <div style={{ marginTop: 6, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img
                          src={ordenActiva.paqueteFotoUrl}
                          alt="Foto del paquete"
                          style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Código PIN de Seguridad */}
                <div style={{
                  background: 'rgba(52, 199, 89, 0.08)',
                  borderRadius: 18,
                  padding: '14px',
                  border: '1px solid rgba(52, 199, 89, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: '#34C759',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Key size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>
                        PIN de Entrega Requerido
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                        El cliente te facilitará su PIN de 4 dígitos al entregar
                      </div>
                    </div>
                  </div>

                  {(estado === 'RECOGIDO' || estado === 'EN_PUNTO_ENTREGA') && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDetalleModal(false);
                        setShowPinModal(true);
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 100,
                        background: '#34C759',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 10px rgba(52, 199, 89, 0.35)',
                      }}
                    >
                      Ingresar PIN
                    </button>
                  )}
                </div>
              </div>

              {/* Botón inferior de cerrar / volver al mapa */}
              <div style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
              }}>
                <button
                  type="button"
                  onClick={() => setShowDetalleModal(false)}
                  style={{
                    ...btnPrimary,
                    borderRadius: 14,
                    padding: '13px',
                  }}
                >
                  Volver al Mapa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
