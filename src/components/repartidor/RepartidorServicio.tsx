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
  ChevronUp,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { obtenerRuta, rutaLineaRecta } from '@/lib/osrm';
import { useRepartidorSnackbar } from './RepartidorShell';

const RepartidorMap = dynamic(() => import('./RepartidorMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono">
      Cargando mapa GPS en vivo...
    </div>
  ),
});

const ESTADO_LABEL: Record<string, string> = {
  DESCONECTADO: 'Desconectado',
  EN_LINEA: 'Esperando pedidos...',
  ORDEN_ASIGNADA: 'Nueva orden asignada',
  EN_CAMINO_RECOGER: 'Camino a punto de recogida',
  EN_PUNTO_RECOGIDA: 'En el establecimiento',
  RECOGIDO: 'Camino al cliente',
  EN_PUNTO_ENTREGA: 'En lugar de entrega',
  INCIDENCIA: 'Incidencia activa',
};

export default function RepartidorServicio() {
  const {
    estado,
    conectado,
    ordenActiva,
    lat,
    lng,
    eta,
    conectar,
    desconectar,
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

  const handleActionClick = () => {
    if (estado === 'EN_CAMINO_RECOGER') {
      llegarRecogida();
      if (showSnackbar) showSnackbar({ message: 'Has llegado a la ubicación de recogida' });
    } else if (estado === 'EN_PUNTO_RECOGIDA') {
      recogerPaquete();
      if (showSnackbar) showSnackbar({ message: 'Paquete confirmado. En camino a la entrega.' });
    } else if (estado === 'RECOGIDO') {
      llegarEntrega();
      if (showSnackbar) showSnackbar({ message: 'Has llegado a la dirección de entrega' });
    } else if (estado === 'EN_PUNTO_ENTREGA') {
      confirmarEntrega();
      if (showSnackbar) showSnackbar({ message: '¡Entrega finalizada con éxito!' });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-115px)] overflow-hidden font-sans">
      {/* Interactive Map View */}
      <RepartidorMap
        repartidorPos={[lat, lng]}
        origenPos={
          ordenActiva ? [ordenActiva.origenLat || 12.1264, ordenActiva.origenLng || -86.2652] : undefined
        }
        destinoPos={
          ordenActiva ? [ordenActiva.destinoLat || 12.1402, ordenActiva.destinoLng || -86.2954] : undefined
        }
        rutaCoordenadas={rutaCoordenadas}
        estado={estado}
        seguirRepartidor
      />

      {/* Floating Status Pill Top */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm">
        <div className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${conectado ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {ESTADO_LABEL[estado] || 'Servicio'}
            </span>
          </div>

          {eta > 0 && ordenActiva && (
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1">
              <Clock size={13} /> {eta} min
            </div>
          )}
        </div>
      </div>

      {/* Floating iOS Native Bottom Sheet Drawer */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md">
        {!conectado ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Power size={24} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Estás desconectado</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conéctate para recibir solicitudes de entrega en tiempo real.
              </p>
            </div>
            <button
              onClick={() => conectar()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Conectarse Ahora
            </button>
          </div>
        ) : !ordenActiva ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">Esperando nuevas órdenes</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mantén la app abierta. Las alertas sonoras y de pantalla te avisarán.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                  Orden Activa #{ordenActiva.id.substring(0, 8)}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {ordenActiva.origen}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  +C$ {ordenActiva.ganancia.toFixed(2)}
                </span>
                <p className="text-[10px] text-slate-400">Ganancia Neta</p>
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Entrega en</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{ordenActiva.destino}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleChat(ordenActiva.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquare size={14} /> Chat Cliente
              </button>
              <button
                onClick={() => toggleIncidencia()}
                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                title="Reportar Incidencia"
              >
                <AlertTriangle size={16} />
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleActionClick}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs shadow-md transition-all"
            >
              {estado === 'EN_CAMINO_RECOGER' && 'Llegué a Punto de Recogida'}
              {estado === 'EN_PUNTO_RECOGIDA' && 'Confirmar Paquete Recogido'}
              {estado === 'RECOGIDO' && 'Llegué a Dirección de Entrega'}
              {estado === 'EN_PUNTO_ENTREGA' && 'Confirmar Entrega Final'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
