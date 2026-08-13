'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Package, Navigation, Clock, Power, MessageSquare, AlertTriangle,
  Zap, Phone, Compass, Key, Bike, Flame, CheckCircle, X, ArrowRight,
  Layers, Maximize2, ChevronDown, ChevronUp,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { obtenerRuta, rutaLineaRecta } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';
import { HAPTIC_PATTERNS } from '@/services/haptics';

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
    conectar, desconectar, optimizarRutaAutomatica, llegarRecogida, recogerPaquete,
    llegarEntrega, confirmarEntrega, toggleChat, toggleIncidencia,
    aceptarOfertaDirecta, rechazarOfertaDirecta,
  } = useRepartidorStore();

  const showSnackbar = useRepartidorSnackbar();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [rutaCoordenadas, setRutaCoordenadas] = useState<[number,number][]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mapMode, setMapMode] = useState<'normal'|'fullscreen'>('normal');
  const [mapTilt, setMapTilt] = useState(false);

  useEffect(() => {
    if (!ordenActiva) { setRutaCoordenadas([]); return; }
    let cancelled = false;
    const destino = estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA'
      ? { lat: ordenActiva.origenLat || 12.1264, lng: ordenActiva.origenLng || -86.2652 }
      : { lat: ordenActiva.destinoLat || 12.1402, lng: ordenActiva.destinoLng || -86.2954 };
    obtenerRuta({ lat, lng }, destino)
      .then(res => { if (cancelled) return; setRutaCoordenadas(res.exito && res.coordenadas.length > 1 ? res.coordenadas : rutaLineaRecta({ lat, lng }, destino)); })
      .catch(() => { if (cancelled) return; setRutaCoordenadas(rutaLineaRecta({ lat, lng }, destino)); });
    return () => { cancelled = true; };
  }, [ordenActiva, estado, lat, lng]);

  const origenPos: [number,number]|undefined = ordenActiva ? [ordenActiva.origenLat||12.1264, ordenActiva.origenLng||-86.2652] : undefined;
  const destinoPos: [number,number]|undefined = ordenActiva ? [ordenActiva.destinoLat||12.1402, ordenActiva.destinoLng||-86.2954] : undefined;

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
    // Si la orden tiene PIN específico, validarlo. De lo contrario, o si se ingresa 1234, permitir la entrega
    if (!targetPin || cleanInput === String(targetPin) || cleanInput === '1234') {
      confirmarEntrega();
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
      HAPTIC_PATTERNS.success();
      showSnackbar({ message: 'Entrega confirmada con éxito.' });
    } else {
      setPinError(true);
      HAPTIC_PATTERNS.error();
    }
  };

  const estadoColor = ESTADO_COLOR[estado] || '#007AFF';
  const estadoLabel = ESTADO_LABEL[estado] || estado;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* MAPA PANTALLA COMPLETA */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <RepartidorMap
          repartidorPos={[lat, lng]}
          origenPos={origenPos}
          destinoPos={destinoPos}
          rutaCoordenadas={rutaCoordenadas.length > 1 ? rutaCoordenadas : undefined}
          estado={estado}
          altura="100%"
          seguirRepartidor
          mostrarNavegacionDriver={true}
        />
      </div>

      {/* ── CÁPSULA SUPERIOR IZQUIERDA — Estado */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute', top: 70, left: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 100,
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${estadoColor}40`, boxShadow: `0 6px 20px rgba(0,0,0,0.3), 0 0 12px ${estadoColor}20`,
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: estadoColor, boxShadow: `0 0 10px ${estadoColor}` }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif", letterSpacing: 0.3 }}>
          {estadoLabel}
        </span>
        {ordenActiva && (
          <>
            <span style={{ width: 1, height: 12, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--primario)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              ETA ~{eta}min
            </span>
          </>
        )}
      </motion.div>

      {/* ── CÁPSULAS DERECHA — Acciones rápidas (solo con orden activa) */}
      {ordenActiva && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ position: 'absolute', right: 16, top: 70, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {/* Navegar */}
          <button
            onClick={() => {
              const headingToPickup = estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA';
              const targetLat = headingToPickup ? (ordenActiva.origenLat || 12.136) : (ordenActiva.destinoLat || 12.140);
              const targetLng = headingToPickup ? (ordenActiva.origenLng || -86.258) : (ordenActiva.destinoLng || -86.250);
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`, '_blank');
            }}
            style={{ width: 46, height: 46, borderRadius: '50%', background: '#007AFF', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,122,255,0.5)', cursor: 'pointer' }}
            title="Navegación GPS"
          ><Compass size={21} /></button>
          {/* Llamar */}
          {ordenActiva.clienteTelefono ? (
            <a
              href={`tel:${ordenActiva.clienteTelefono}`}
              style={{ width: 46, height: 46, borderRadius: '50%', background: '#34C759', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(52,199,89,0.5)', cursor: 'pointer', textDecoration: 'none' }}
              title={`Llamar al cliente (${ordenActiva.clienteTelefono})`}
            ><Phone size={20} /></a>
          ) : null}
          {/* Chat */}
          <button
            onClick={() => toggleChat(ordenActiva.id)}
            style={{ width: 46, height: 46, borderRadius: '50%', background: '#AF52DE', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(175,82,222,0.5)', cursor: 'pointer' }}
            title="Chat"
          ><MessageSquare size={20} /></button>
          {/* Incidencia */}
          <button
            onClick={() => toggleIncidencia(true)}
            style={{ width: 46, height: 46, borderRadius: '50%', background: '#FF3B30', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(255,59,48,0.5)', cursor: 'pointer' }}
            title="Reportar Incidencia"
          ><AlertTriangle size={20} /></button>
        </motion.div>
      )}

      {/* ── CONTROL 3D — cápsula inferior derecha (solo mapa) */}
      <div style={{ position: 'absolute', right: 16, bottom: drawerOpen ? 310 : 100, zIndex: 20 }}>
        <button
          onClick={() => setMapTilt(!mapTilt)}
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', color: mapTilt ? 'var(--primario)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
          title="Modo 3D"
        ><Layers size={16} /></button>
      </div>

      {/* ── HANDLE visible cuando drawer está cerrado */}
      {!drawerOpen && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setDrawerOpen(true)}
          style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100,
            background: 'color-mix(in srgb, var(--surface) 96%, transparent)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            color: 'var(--text)', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
          }}
        >
          <ChevronUp size={16} style={{ color: 'var(--primario)' }} />
          {ordenActiva ? `${ordenActiva.cliente} • Ver detalles` : 'Ver panel'}
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
            style={{ position: 'absolute', bottom: 80, left: 12, right: 12, zIndex: 30, maxWidth: 580, margin: '0 auto' }}
          >
            {/* DESCONECTADO */}
            {estado === 'DESCONECTADO' && (
              <div style={{ ...sectionCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,59,48,.15)', color: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Power size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>Estás Desconectado</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Conéctate para recibir envíos.</p>
                  </div>
                </div>
                <button onClick={handleToggleConnection} style={{ ...btnPrimary, width: 'auto', padding: '12px 22px', background: '#34C759', boxShadow: '0 4px 14px rgba(52,199,89,0.3)' }}>
                  Conectar
                </button>
              </div>
            )}

            {/* EN LÍNEA - CON OFERTA DIRECTA */}
            {estado === 'EN_LINEA' && !ordenActiva && (ordenAsignadaPendiente || ofertasDisponibles.length > 0) && (
              <div style={{ ...sectionCard, display: 'flex', flexDirection: 'column', gap: 12, border: '2px solid #34C759', background: 'rgba(52, 199, 89, 0.08)' }}>
                {(() => {
                  const oferta = ordenAsignadaPendiente || ofertasDisponibles[0];
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 10px #34C759' }} />
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>¡Oferta de Pedido Disponible!</span>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>
                          +C$ {(oferta.ganancia || oferta.monto || 0).toFixed(2)}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {oferta.tipo === 'compra' ? `Tienda: ${oferta.tiendaNombre || oferta.origen}` : `Cliente: ${oferta.cliente}`}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <div><strong>Recoger:</strong> {oferta.origen}</div>
                        <div><strong>Entregar:</strong> {oferta.destino}</div>
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
                          ACEPTAR PEDIDO AHORA
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* EN LÍNEA - SIN OFERTAS */}
            {estado === 'EN_LINEA' && !ordenActiva && !ordenAsignadaPendiente && ofertasDisponibles.length === 0 && (
              <div style={{ ...sectionCard, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 10px #34C759' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}>En Línea • Escaneando zona</span>
                  </div>
                  <button onClick={handleToggleConnection} style={{ background: 'none', border: 'none', color: '#FF3B30', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Salir</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[{ label: 'Ganancias hoy', val: `C$ ${(perfil.totalGanancias||0).toFixed(2)}`, color: '#34C759' }, { label: 'Entregas', val: `${perfil.totalEntregas||0} envíos`, color: 'var(--text)' }].map(s => (
                    <div key={s.label} style={{ padding: '10px 14px', borderRadius: 14, background: 'var(--bg-alt)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CON ORDEN */}
            {ordenActiva && (
              <div style={{ ...sectionCard, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Header: nombre + código + ganancia + botón colapsar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Botón colapsar — visible aquí */}
                    <button
                      onClick={() => setDrawerOpen(false)}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      title="Colapsar panel"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primario-soft)', color: 'var(--primario)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>#{ordenActiva.id.substring(0,8)}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{ordenActiva.cliente}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>+C$ {(ordenActiva.ganancia||ordenActiva.monto||0).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ordenActiva.kmEstimados||3.5}km • ~{ordenActiva.tiempoEstimado||15}min</div>
                  </div>
                </div>

                {/* Foto del paquete a llevar */}
                {ordenActiva.paqueteFotoUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                    <img src={ordenActiva.paqueteFotoUrl} alt="Foto del Paquete" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primario)', textTransform: 'uppercase' }}>Foto del Paquete a Entregar</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{ordenActiva.paquete || 'Objeto a transportar'}</span>
                    </div>
                  </div>
                )}

                {/* Ruta + Botones de Navegación GPS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[{ color: '#007AFF', label: 'Recogida', val: ordenActiva.origen, lat: ordenActiva.origenLat || 12.136, lng: ordenActiva.origenLng || -86.258 },
                    { color: '#34C759', label: 'Entrega', val: ordenActiva.destino, lat: ordenActiva.destinoLat || 12.140, lng: ordenActiva.destinoLng || -86.250 }].map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, minWidth: 0, flex: 1 }}>
                        <MapPin size={16} style={{ color: r.color, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{r.label}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{r.val}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                        <button
                          type="button"
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`, '_blank')}
                          style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#007AFF', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          title="Google Maps"
                        >
                          <Compass size={12} /> Maps
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(`https://waze.com/ul?ll=${r.lat},${r.lng}&navigate=yes`, '_blank')}
                          style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#33CCFF', color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          title="Waze"
                        >
                          <Navigation size={12} /> Waze
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botón de paso */}
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
              <input type="text" maxLength={4} placeholder="1234" value={pinInput}
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
    </div>
  );
}
