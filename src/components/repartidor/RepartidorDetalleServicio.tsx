'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Star,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { StarRating } from './RepartidorPerfil';
import RepartidorMiniMap from './RepartidorMiniMap';

export default function RepartidorDetalleServicio() {
  const { servicioDetalle, cerrarDetalle } = useRepartidorStore();

  if (!servicioDetalle) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-sm max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={cerrarDetalle}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detalle del Servicio
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                #{servicioDetalle.id.substring(0, 8)}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold capitalize">
            {servicioDetalle.estado}
          </span>
        </div>

        {/* Route Mini-Map */}
        <div className="h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
          <RepartidorMiniMap
            repartidorPos={[12.1300, -86.2500]}
            origenPos={[12.1264, -86.2652]}
            destinoPos={[12.1402, -86.2954]}
            estado="ENTREGADO"
          />
        </div>

        {/* Payout Breakdown */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-100 font-semibold">Ganancia del Servicio</span>
            <span className="text-xl font-black">C$ {servicioDetalle.ganancia.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-100 border-t border-white/20 pt-1.5">
            <span>Distancia: {servicioDetalle.kmRecorridos} km</span>
            <span>Tiempo: {servicioDetalle.tiempoTotal} min</span>
          </div>
        </div>

        {/* Route Info */}
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Punto de Recogida</p>
            <p className="font-bold text-slate-900 dark:text-white">{servicioDetalle.origen}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Punto de Entrega</p>
            <p className="font-bold text-slate-900 dark:text-white">{servicioDetalle.destino}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              Cliente: {servicioDetalle.cliente || 'Cliente LogiFast'}
            </p>
          </div>
        </div>

        {/* Rating if evaluated */}
        {servicioDetalle.calificacion && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Calificación del Cliente
            </span>
            <div className="flex items-center gap-1">
              <StarRating value={servicioDetalle.calificacion} />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {servicioDetalle.calificacion.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={cerrarDetalle}
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-sm transition-all"
        >
          Cerrar Detalle
        </button>
      </motion.div>
    </motion.div>
  );
}
