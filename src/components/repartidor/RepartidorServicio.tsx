'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  CheckCircle2,
  Zap,
  Phone,
  Compass,
  X,
  Key,
  ChevronUp,
  ChevronDown,
  Bike,
  ShieldAlert,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { obtenerRuta, obtenerRutaMultiples, rutaLineaRecta, geocodeAddress } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';
import { HAPTIC_PATTERNS } from '@/services/haptics';

const RepartidorMap = dynamic(() => import('./RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-mono">
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

export default function RepartidorServicio() {
  const {
    estado,
    conectado,
    ordenActiva,
    ordenesActivas = [],
    lat,
    lng,
    eta,
    statsHoy,
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

  const [showNavSelector, setShowNavSelector] = useState(false);
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
    showSnackbar({ message: 'Viaje iniciado hacia el punto de recogida.' });
  };

  const handleConfirmarPin = () => {
    if (pinInput.trim() === (ordenActiva?.codigoEntrega || '1234') || pinInput.trim() === '1234') {
      confirmarEntrega();
      setShowPinModal(false);
      setPinInput('');
      HAPTIC_PATTERNS.success();
      showSnackbar({ message: 'Entrega completada exitosamente.' });
    } else {
      setPinError(true);
      HAPTIC_PATTERNS.error();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans">
      {/* ── FULLSCREEN MAP ── */}
      <div className="absolute inset-0 z-0">
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

      {/* ── TOP STATUS CAPSULE ── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-full shadow-2xl">
        <span
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ background: ESTADO_COLOR[estado] || '#007AFF' }}
        />
        <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
          {estado.replace(/_/g, ' ')}
        </span>
        {ordenActiva && (
          <span className="text-xs font-mono text-blue-400 font-bold border-l border-white/20 pl-2">
            ETA ~{eta} min
          </span>
        )}
      </div>

      {/* ── FLOATING RIGHT FAB BUTTONS ── */}
      {ordenActiva && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          <button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ordenActiva.destinoLat || 12.14},${ordenActiva.destinoLng || -86.29}`, '_blank')}
            className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 border border-white/30 active:scale-95 transition-transform"
            title="Navegación GPS"
          >
            <Compass size={22} />
          </button>
          <button
            onClick={() => window.open(`tel:${ordenActiva.clienteTelefono || '88888888'}`, '_self')}
            className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border border-white/30 active:scale-95 transition-transform"
            title="Llamar"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => toggleChat(ordenActiva.id)}
            className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 border border-white/30 active:scale-95 transition-transform"
            title="Chat"
          >
            <MessageSquare size={20} />
          </button>
          <button
            onClick={() => toggleIncidencia(true)}
            className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 border border-white/30 active:scale-95 transition-transform"
            title="Reportar Incidencia"
          >
            <AlertTriangle size={20} />
          </button>
        </div>
      )}

      {/* ── BOTTOM FLOATING ACTION CONTAINER ── */}
      <div className="absolute bottom-20 left-3 right-3 z-30 max-w-lg mx-auto">
        {estado === 'DESCONECTADO' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl text-slate-100 flex items-center justify-between gap-4"
          >
            <div>
              <h4 className="text-base font-bold font-syne text-white">Estás Desconectado</h4>
              <p className="text-xs text-slate-400">Conéctate para recibir pedidos en vivo.</p>
            </div>
            <button
              onClick={handleToggleConnection}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
            >
              Conectarme
            </button>
          </motion.div>
        )}

        {estado === 'EN_LINEA' && !ordenActiva && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl text-slate-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Zap size={22} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-syne text-white">En línea — Buscando pedidos</h4>
                <p className="text-xs text-slate-400">Tu GPS transmite en tiempo real.</p>
              </div>
            </div>
            {ordenesActivas.length > 0 && (
              <button
                onClick={handleEmpezarViaje}
                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                <Navigation size={18} /> Iniciar Viaje ({ordenesActivas.length} asignados)
              </button>
            )}
          </motion.div>
        )}

        {/* ── ACTIVE TRIP LIFECYCLE ── */}
        {ordenActiva && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl text-slate-100 space-y-4"
          >
            {/* Step 1: EN_CAMINO_RECOGER */}
            {estado === 'EN_CAMINO_RECOGER' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="font-bold text-blue-400">PASO 1: RECOGIDA EN COMERCIO</span>
                  <span className="font-mono text-slate-400">#{ordenActiva.id}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-syne">{ordenActiva.origen}</h4>
                  <p className="text-xs text-slate-400">{ordenActiva.notasComercio || 'Retirar paquetes empaquetados'}</p>
                </div>
                <button
                  onClick={llegarRecogida}
                  className="w-full py-4 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <MapPin size={20} /> LLEGUÉ AL SITIO DE RECOGIDA
                </button>
              </div>
            )}

            {/* Step 2: EN_PUNTO_RECOGIDA */}
            {estado === 'EN_PUNTO_RECOGIDA' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="font-bold text-amber-400">PASO 2: VERIFICAR PRODUCTOS</span>
                  <span className="font-mono text-slate-400">#{ordenActiva.id}</span>
                </div>
                <div className="text-xs text-slate-300">
                  Verifica que la orden contenga todos los artículos especificados.
                </div>
                <button
                  onClick={recogerPaquete}
                  className="w-full py-4 rounded-2xl bg-purple-600 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Package size={20} /> CONFIRMAR PAQUETE RECOGIDO
                </button>
              </div>
            )}

            {/* Step 3: RECOGIDO / EN_PUNTO_ENTREGA */}
            {(estado === 'RECOGIDO' || estado === 'EN_PUNTO_ENTREGA') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="font-bold text-emerald-400">PASO 3: ENTREGA AL CLIENTE</span>
                  <span className="font-mono text-slate-400">#{ordenActiva.id}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-syne">{ordenActiva.destino}</h4>
                  <p className="text-xs text-slate-400">Cliente: {ordenActiva.cliente || 'Cliente registrado'}</p>
                </div>

                {estado === 'RECOGIDO' ? (
                  <button
                    onClick={llegarEntrega}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <MapPin size={20} /> LLEGUÉ AL DOMICILIO DEL CLIENTE
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="w-full py-4 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Key size={20} /> CONFIRMAR ENTREGA (CON PIN)
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── PIN CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-3xl p-6 text-center space-y-4 text-slate-100 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-bold font-syne">Ingresar PIN de Entrega</h3>
              <p className="text-xs text-slate-400">
                Pídele al cliente el PIN de 4 dígitos para completar la entrega. (PIN Demo: <span className="font-mono text-emerald-400 font-bold">1234</span>)
              </p>

              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="1234"
                className="w-full py-3 text-center text-2xl font-mono tracking-widest rounded-2xl bg-slate-800 border border-white/15 outline-none focus:border-emerald-500 text-white"
              />

              {pinError && <p className="text-xs text-red-400 font-bold">PIN incorrecto. Intenta con 1234.</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarPin}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
