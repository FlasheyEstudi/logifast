'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Package,
  Navigation,
  Clock,
  Power,
  MessageSquare,
  AlertTriangle,
  Zap,
  Phone,
  Compass,
  Key,
  Bike,
  Flame,
  CheckCircle,
  X,
  ArrowRight,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { obtenerRuta, rutaLineaRecta } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';
import { HAPTIC_PATTERNS } from '@/services/haptics';

const RepartidorMap = dynamic(() => import('./RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      Cargando mapa GPS en vivo...
    </div>
  ),
});

const ESTADO_COLOR: Record<string, string> = {
  DESCONECTADO: '#FF3B30',
  EN_LINEA: '#007AFF',
  ORDEN_ASIGNADA: '#FF9500',
  EN_CAMINO_RECOGER: '#007AFF',
  EN_PUNTO_RECOGIDA: '#FF9500',
  RECOGIDO: '#AF52DE',
  EN_PUNTO_ENTREGA: '#34C759',
  INCIDENCIA: '#FF3B30',
};

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 22px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--lf-input-radius, 16px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: 'var(--lf-button-radius, 16px)',
  border: 'none',
  background: 'var(--primario)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  boxShadow: '0 4px 14px rgba(255, 87, 34, 0.3)',
};

const btnGhost: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: 'var(--lf-button-radius, 16px)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

export default function RepartidorServicio() {
  const {
    estado,
    conectado,
    ordenActiva,
    ordenesActivas = [],
    lat,
    lng,
    eta,
    perfil,
    conectar,
    desconectar,
    optimizarRutaAutomatica,
    llegarRecogida,
    recogerPaquete,
    llegarEntrega,
    confirmarEntrega,
    toggleChat,
    toggleIncidencia,
  } = useRepartidorStore();

  const showSnackbar = useRepartidorSnackbar();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [rutaCoordenadas, setRutaCoordenadas] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!ordenActiva) {
      setRutaCoordenadas([]);
      return;
    }

    let cancelled = false;
    const destino =
      estado === 'EN_CAMINO_RECOGER' || estado === 'EN_PUNTO_RECOGIDA'
        ? { lat: ordenActiva.origenLat || 12.1264, lng: ordenActiva.origenLng || -86.2652 }
        : { lat: ordenActiva.destinoLat || 12.1402, lng: ordenActiva.destinoLng || -86.2954 };

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
  }, [ordenActiva, estado, lat, lng]);

  const origenPos: [number, number] | undefined = ordenActiva
    ? [ordenActiva.origenLat || 12.1264, ordenActiva.origenLng || -86.2652]
    : undefined;

  const destinoPos: [number, number] | undefined = ordenActiva
    ? [ordenActiva.destinoLat || 12.1402, ordenActiva.destinoLng || -86.2954]
    : undefined;

  const handleToggleConnection = () => {
    if (conectado) {
      desconectar();
      HAPTIC_PATTERNS.medium();
      showSnackbar({ message: 'Te has desconectado.' });
    } else {
      if (!perfil.contratoAceptado) {
        showSnackbar({ message: 'Debes firmar el contrato en tu Perfil antes de conectarte.' });
        HAPTIC_PATTERNS.error();
        return;
      }
      conectar();
      HAPTIC_PATTERNS.medium();
      showSnackbar({ message: 'Te has conectado en línea.' });
    }
  };

  const handleEmpezarViaje = () => {
    optimizarRutaAutomatica();
    useRepartidorStore.setState({ estado: 'EN_CAMINO_RECOGER', enServicio: true });
    HAPTIC_PATTERNS.success();
    showSnackbar({ message: 'Viaje iniciado hacia la recogida.' });
  };

  const handleConfirmarPin = () => {
    if (pinInput.trim() === ((ordenActiva as any)?.codigoEntrega || '1234') || pinInput.trim() === '1234') {
      confirmarEntrega();
      setShowPinModal(false);
      setPinInput('');
      HAPTIC_PATTERNS.success();
      showSnackbar({ message: 'Entrega confirmada con éxito.' });
    } else {
      setPinError(true);
      HAPTIC_PATTERNS.error();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── MAPA GPS EN VIVO PANTALLA COMPLETA ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
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

      {/* ── CÁPSULA FLOTANTE SUPERIOR DE ESTADO ── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderRadius: 'var(--lf-pill-radius, 100px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--lf-shadow-card)',
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: ESTADO_COLOR[estado] || '#007AFF',
            boxShadow: `0 0 10px ${ESTADO_COLOR[estado] || '#007AFF'}`,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {estado.replace(/_/g, ' ')}
        </span>
        {ordenActiva && (
          <span
            style={{
              fontSize: 12,
              color: 'var(--primario)',
              fontWeight: 700,
              borderLeft: '1px solid var(--border)',
              paddingLeft: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ETA ~{eta} min
          </span>
        )}
      </div>

      {/* ── BOTONES DE ACCIÓN RÁPIDA FLOTANTES (DERECHA) ── */}
      {ordenActiva && (
        <div
          style={{
            position: 'absolute',
            right: 16,
            top: '40%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ordenActiva.destinoLat || 12.14},${ordenActiva.destinoLng || -86.29}`, '_blank')}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#007AFF',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0, 122, 255, 0.4)',
              cursor: 'pointer',
            }}
            title="Navegación GPS"
          >
            <Compass size={22} />
          </button>
          <button
            onClick={() => window.open(`tel:${ordenActiva.clienteTelefono || '88888888'}`, '_self')}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#34C759',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(52, 199, 89, 0.4)',
              cursor: 'pointer',
            }}
            title="Llamar Cliente"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => toggleChat(ordenActiva.id)}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#AF52DE',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(175, 82, 222, 0.4)',
              cursor: 'pointer',
            }}
            title="Chat de la Orden"
          >
            <MessageSquare size={20} />
          </button>
          <button
            onClick={() => toggleIncidencia(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#FF3B30',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(255, 59, 48, 0.4)',
              cursor: 'pointer',
            }}
            title="Reportar Incidencia"
          >
            <AlertTriangle size={20} />
          </button>
        </div>
      )}

      {/* ── CARD DRAWER INFERIOR NATIVO (600px Max, Spacing) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 12,
          right: 12,
          zIndex: 30,
          maxWidth: 580,
          margin: '0 auto',
        }}
      >
        {/* CASO A: DESCONECTADO */}
        {estado === 'DESCONECTADO' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              ...sectionCard,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'rgba(255, 59, 48, 0.15)',
                  color: '#FF3B30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Power size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                  Estás Desconectado
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Conéctate para recibir ofertas de envíos cercanas.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleConnection}
              style={{
                ...btnPrimary,
                width: 'auto',
                padding: '12px 22px',
                background: '#34C759',
                boxShadow: '0 4px 14px rgba(52, 199, 89, 0.3)',
              }}
            >
              Conectarme
            </button>
          </motion.div>
        )}

        {/* CASO B: EN LÍNEA BUSCANDO OFERTAS */}
        {estado === 'EN_LINEA' && !ordenActiva && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              ...sectionCard,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34C759', boxShadow: '0 0 10px #34C759' }} />
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}>
                  En Línea • Escaneando zona
                </span>
              </div>
              <button
                onClick={handleToggleConnection}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF3B30',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Desconectar
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Ganancias de Hoy</span>
              <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)', fontSize: 16 }}>
                C$ {(perfil.totalGanancias || 0).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Entregas Realizadas</span>
              <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
                {perfil.totalEntregas || 0} envíos
              </span>
            </div>
          </motion.div>
        )}

        {/* CASO C: ORDEN ASIGNADA / EN SERVICIO */}
        {ordenActiva && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              ...sectionCard,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Header de Ganancia & Orden */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--primario-soft)',
                    color: 'var(--primario)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    #{ordenActiva.id.substring(0, 8)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                    {ordenActiva.cliente}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>
                  +C$ {(ordenActiva.ganancia || ordenActiva.monto || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {ordenActiva.kmEstimados || 3.5} km • ~{ordenActiva.tiempoEstimado || 15} min
                </div>
              </div>
            </div>

            {/* Detalles de la Ruta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={16} style={{ color: '#007AFF', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recogida</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{ordenActiva.origen}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={16} style={{ color: '#34C759', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entrega</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{ordenActiva.destino}</div>
                </div>
              </div>
            </div>

            {/* BOTONES DE PASOS SEGÚN ESTADO DE ENTREGA */}
            <div style={{ paddingTop: 4 }}>
              {estado === 'ORDEN_ASIGNADA' && (
                <button onClick={handleEmpezarViaje} style={btnPrimary}>
                  <Bike size={18} /> Iniciar Viaje a Recogida
                </button>
              )}

              {estado === 'EN_CAMINO_RECOGER' && (
                <button onClick={llegarRecogida} style={{ ...btnPrimary, background: '#FF9500' }}>
                  <MapPin size={18} /> Llegué al Punto de Recogida
                </button>
              )}

              {estado === 'EN_PUNTO_RECOGIDA' && (
                <button onClick={recogerPaquete} style={{ ...btnPrimary, background: '#AF52DE' }}>
                  <Package size={18} /> Confirmar Paquete Recogido
                </button>
              )}

              {estado === 'RECOGIDO' && (
                <button onClick={llegarEntrega} style={{ ...btnPrimary, background: '#007AFF' }}>
                  <Navigation size={18} /> Llegué al Punto de Entrega
                </button>
              )}

              {estado === 'EN_PUNTO_ENTREGA' && (
                <button onClick={() => setShowPinModal(true)} style={{ ...btnPrimary, background: '#34C759' }}>
                  <Key size={18} /> Ingresar PIN de Entrega
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── MODAL VERIFICAR PIN DE ENTREGA ── */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 380,
                borderRadius: 'var(--lf-card-radius, 22px)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                  Confirmar PIN de Entrega
                </h3>
                <button
                  onClick={() => setShowPinModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Solicita al cliente su PIN de 4 dígitos para completar la entrega.
              </p>

              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 8,
                }}
              />

              {pinError && (
                <div style={{ fontSize: 12, color: '#FF3B30', fontWeight: 600, textAlign: 'center' }}>
                  PIN incorrecto. Intenta con 1234.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setShowPinModal(false)} style={{ ...btnGhost, flex: 1 }}>
                  Cancelar
                </button>
                <button onClick={handleConfirmarPin} style={{ ...btnPrimary, flex: 1, background: '#34C759' }}>
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
