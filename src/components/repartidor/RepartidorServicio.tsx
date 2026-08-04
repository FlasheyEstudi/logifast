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
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { obtenerRuta, rutaLineaRecta } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';
import { HAPTIC_PATTERNS } from '@/services/haptics';

const RepartidorMap = dynamic(() => import('./RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono">
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
    if (pinInput.trim() === (ordenActiva?.codigoEntrega || '1234') || pinInput.trim() === '1234') {
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
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans">
      {/* ── FULLSCREEN GPS MAP ── */}
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

      {/* ── TOP LUXURY GLASS STATUS BAR ── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl transition-all"
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        <span
          className="w-3 h-3 rounded-full animate-pulse shadow-md"
          style={{ background: ESTADO_COLOR[estado] || '#007AFF', boxShadow: `0 0 12px ${ESTADO_COLOR[estado] || '#007AFF'}` }}
        />
        <span className="text-xs font-extrabold text-white uppercase tracking-wider font-syne">
          {estado.replace(/_/g, ' ')}
        </span>
        {ordenActiva && (
          <span className="text-xs font-mono text-blue-400 font-bold border-l border-white/20 pl-2.5">
            ETA ~{eta} min
          </span>
        )}
      </div>

      {/* ── LUXURY FLOATING FAB ACTION STACK (RIGHT) ── */}
      {ordenActiva && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3.5">
          <button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ordenActiva.destinoLat || 12.14},${ordenActiva.destinoLng || -86.29}`, '_blank')}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 border border-white/30 active:scale-90 transition-transform"
            style={{ width: 52, height: 52 }}
            title="Navegación GPS"
          >
            <Compass size={24} />
          </button>
          <button
            onClick={() => window.open(`tel:${ordenActiva.clienteTelefono || '88888888'}`, '_self')}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 border border-white/30 active:scale-90 transition-transform"
            style={{ width: 52, height: 52 }}
            title="Llamar"
          >
            <Phone size={22} />
          </button>
          <button
            onClick={() => toggleChat(ordenActiva.id)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-purple-500/40 border border-white/30 active:scale-90 transition-transform"
            style={{ width: 52, height: 52 }}
            title="Chat"
          >
            <MessageSquare size={22} />
          </button>
          <button
            onClick={() => toggleIncidencia(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-xl shadow-red-500/40 border border-white/30 active:scale-90 transition-transform"
            style={{ width: 52, height: 52 }}
            title="Reportar Incidencia"
          >
            <AlertTriangle size={22} />
          </button>
        </div>
      )}

      {/* ── LUXURY BOTTOM GLASS CONTAINER ── */}
      <div className="absolute bottom-20 left-3 right-3 z-30 max-w-lg mx-auto">
        {estado === 'DESCONECTADO' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[32px] text-slate-100 flex items-center justify-between gap-4"
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <div>
              <h4 className="text-lg font-extrabold font-syne text-white">Estás Desconectado</h4>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Conéctate para recibir pedidos en vivo en Managua.</p>
            </div>
            <button
              onClick={handleToggleConnection}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/40 active:scale-95 transition-all font-syne uppercase tracking-wider"
            >
              Conectarme
            </button>
          </motion.div>
        )}

        {estado === 'EN_LINEA' && !ordenActiva && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[32px] text-slate-100 space-y-4"
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shadow-md">
                <Zap size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-extrabold font-syne text-white">En línea — Buscando pedidos</h4>
                <p className="text-xs text-slate-400 font-sans">Tu posición GPS transmite en vivo a clientes de la zona.</p>
              </div>
            </div>
            {ordenesActivas.length > 0 && (
              <button
                onClick={handleEmpezarViaje}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/40 flex items-center justify-center gap-2 font-syne uppercase tracking-wider active:scale-95 transition-transform"
              >
                <Navigation size={20} /> Iniciar Viaje ({ordenesActivas.length} asignados)
              </button>
            )}
          </motion.div>
        )}

        {/* ── ACTIVE TRIP GLASS LIFECYCLE ── */}
        {ordenActiva && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[32px] text-slate-100 space-y-4"
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {/* Step 1: EN_CAMINO_RECOGER */}
            {estado === 'EN_CAMINO_RECOGER' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2.5 font-mono font-bold">
                  <span className="text-blue-400">PASO 1: RECOGIDA EN COMERCIO</span>
                  <span className="text-slate-400">#{ordenActiva.id}</span>
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white font-syne">{ordenActiva.origen}</h4>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">{ordenActiva.notasComercio || 'Retirar paquetes preparados'}</p>
                </div>
                <button
                  onClick={llegarRecogida}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider font-syne shadow-xl shadow-amber-500/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <MapPin size={20} /> LLEGUÉ AL SITIO DE RECOGIDA
                </button>
              </div>
            )}

            {/* Step 2: EN_PUNTO_RECOGIDA */}
            {estado === 'EN_PUNTO_RECOGIDA' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2.5 font-mono font-bold">
                  <span className="text-amber-400">PASO 2: VERIFICACIÓN DE PAQUETE</span>
                  <span className="text-slate-400">#{ordenActiva.id}</span>
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  Verifica que los paquetes coincidan con la factura de la orden.
                </p>
                <button
                  onClick={recogerPaquete}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider font-syne shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Package size={20} /> CONFIRMAR PAQUETE RECOGIDO
                </button>
              </div>
            )}

            {/* Step 3: RECOGIDO / EN_PUNTO_ENTREGA */}
            {(estado === 'RECOGIDO' || estado === 'EN_PUNTO_ENTREGA') && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2.5 font-mono font-bold">
                  <span className="text-emerald-400">PASO 3: ENTREGA AL CLIENTE</span>
                  <span className="text-slate-400">#{ordenActiva.id}</span>
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white font-syne">{ordenActiva.destino}</h4>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Cliente: {ordenActiva.cliente || 'Cliente registrado'}</p>
                </div>

                {estado === 'RECOGIDO' ? (
                  <button
                    onClick={llegarEntrega}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider font-syne shadow-xl shadow-blue-600/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <MapPin size={20} /> LLEGUÉ AL DOMICILIO DEL CLIENTE
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider font-syne shadow-xl shadow-emerald-500/40 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Key size={20} /> CONFIRMAR ENTREGA (CON PIN)
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── PIN MODAL ── */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-slate-900/95 border border-white/20 rounded-[32px] p-6 text-center space-y-4 text-slate-100 shadow-2xl"
              style={{ backdropFilter: 'blur(30px)' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-extrabold font-syne">Ingresar PIN de Entrega</h3>
              <p className="text-xs text-slate-400 font-sans">
                Pídele al cliente su PIN de 4 dígitos para completar la entrega. (PIN Demo: <span className="font-mono text-emerald-400 font-bold">1234</span>)
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
                className="w-full py-3.5 text-center text-2xl font-mono tracking-widest rounded-2xl bg-slate-800/80 border border-white/15 outline-none focus:border-emerald-500 text-white font-bold"
              />

              {pinError && <p className="text-xs text-red-400 font-bold font-sans">PIN incorrecto. Intenta con 1234.</p>}

              <div className="flex gap-3 pt-2 font-syne">
                <button
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-extrabold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarPin}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/40"
                >
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
