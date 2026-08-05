'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Clock,
  Check,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';

export default function RepartidorNotificacionOrden() {
  const {
    ordenAsignadaPendiente,
    tiempoAceptacion = 30,
    aceptarOrden,
    rechazarOrden,
  } = useRepartidorStore();

  if (!ordenAsignadaPendiente) return null;

  const pct = Math.max(0, tiempoAceptacion / 30);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 font-sans"
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.95 }}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 text-slate-900 dark:text-white"
      >
        {/* Top Header with Timer Pill */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center animate-bounce">
              <Bell size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Nueva Solicitud de Entrega
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                #{ordenAsignadaPendiente.id.substring(0, 8)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Clock size={13} /> {tiempoAceptacion}s
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
            style={{ width: `${pct * 100}%` }}
          />
        </div>

        {/* Payout Hero Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md text-center space-y-0.5">
          <p className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider">
            Ganancia Estimada del Envío
          </p>
          <p className="text-2xl font-black">
            C$ {ordenAsignadaPendiente.ganancia.toFixed(2)}
          </p>
        </div>

        {/* Route Details */}
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Punto de Recogida</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {ordenAsignadaPendiente.origen}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Punto de Entrega</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {ordenAsignadaPendiente.destino}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Distancia estimada: {ordenAsignadaPendiente.kmEstimados} km • Tiempo: {ordenAsignadaPendiente.tiempoEstimado} min
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => rechazarOrden()}
            className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs active:scale-95 transition-all"
          >
            Rechazar
          </button>
          <button
            onClick={() => aceptarOrden()}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> Aceptar Oferta
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
