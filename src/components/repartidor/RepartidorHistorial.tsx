'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Calendar,
  DollarSign,
  FileText,
  ChevronRight,
  Bike,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';

interface RepartidorHistorialProps {
  isDark: boolean;
}

export default function RepartidorHistorial({ isDark }: RepartidorHistorialProps) {
  const serviciosHoy = useRepartidorStore((s) => s.serviciosHoy);
  const statsHoy = useRepartidorStore((s) => s.statsHoy);
  const perfil = useRepartidorStore((s) => s.perfil);

  return (
    <div className="space-y-6 py-2 max-w-4xl mx-auto">

      {/* 🍏 EARNINGS HERO WIDGETS (APPLE FITNESS STYLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-[28px] bg-zinc-900/90 border border-zinc-800 space-y-2 shadow-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Ganancias Hoy</span>
          <h2 className="text-3xl font-extrabold text-white">C$ {(statsHoy?.ganancias || perfil?.totalGanancias || 1250).toFixed(2)}</h2>
          <p className="text-xs text-zinc-500 font-medium">+15% respecto a ayer</p>
        </div>

        <div className="p-6 rounded-[28px] bg-zinc-900/90 border border-zinc-800 space-y-2 shadow-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Entregas Exitosas</span>
          <h2 className="text-3xl font-extrabold text-white">{statsHoy?.entregas || perfil?.totalEntregas || 8}</h2>
          <p className="text-xs text-zinc-500 font-medium">100% de cumplimiento</p>
        </div>

        <div className="p-6 rounded-[28px] bg-zinc-900/90 border border-zinc-800 space-y-2 shadow-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">Calificación Rider</span>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold text-white">{(perfil?.calificacion || 4.98).toFixed(2)}</h2>
            <Star size={20} className="text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xs text-zinc-500 font-medium">Basado en reseñas activas</p>
        </div>
      </div>

      {/* 🍏 TRIP HISTORY LIST */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold tracking-tight text-zinc-300">Historial de Viajes Recientes</h3>

        <div className="space-y-3">
          {serviciosHoy.length === 0 ? (
            <div className="p-12 text-center rounded-[28px] bg-zinc-900/60 border border-zinc-800 text-zinc-500 text-xs">
              No tienes viajes registrados hoy.
            </div>
          ) : (
            serviciosHoy.map((trip) => (
              <div
                key={trip.id}
                className="p-5 rounded-[24px] bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-4 shadow-sm hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Entrega #{trip.id.substring(0, 8)}</h4>
                    <p className="text-xs text-zinc-400">{trip.origen} ➔ {trip.destino}</p>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">{trip.hora}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-400 block">
                    + C$ {trip.ganancia.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">Completada</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
