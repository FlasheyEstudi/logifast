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
    <div className="space-y-4 py-1">

      {/* 🍏 APPLE HEALTH / ACTIVITY STYLE WIDGETS GRID */}
      <div className="grid grid-cols-2 gap-3">
        {/* Ganancias Hoy Widget */}
        <div className="p-4 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] space-y-1 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10B981]">Ganancias Hoy</span>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-white">
            C$ {(statsHoy?.ganancias || perfil?.totalGanancias || 1250).toFixed(0)}
          </h2>
          <p className="text-[11px] text-[#10B981] font-semibold">+15% vs ayer ↗</p>
        </div>

        {/* Entregas Exitosas Widget */}
        <div className="p-4 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] space-y-1 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3B82F6]">Entregas Exitosas</span>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-white">
            {statsHoy?.entregas || perfil?.totalEntregas || 8}
          </h2>
          <p className="text-[11px] text-[#8E8E93] font-medium">100% de cumplimiento</p>
        </div>
      </div>

      {/* Full-width Calificación Rider Widget */}
      <div className="p-4 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F59E0B]">Desempeño & Rating</span>
          <div className="flex items-center gap-2">
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-white">
              {(perfil?.calificacion || 4.98).toFixed(2)}
            </h2>
            <Star size={20} className="text-[#F59E0B] fill-[#F59E0B]" />
          </div>
          <p className="text-[11px] text-[#8E8E93]">Excelente servicio de repartidor</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center font-bold text-lg">
          🏅
        </div>
      </div>

      {/* 🍏 TRIP HISTORY LIST */}
      <div className="space-y-3 pt-2">
        <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-extrabold tracking-tight text-[#F5F5F7]">
          Historial de Viajes Recientes
        </h3>

        <div className="space-y-2.5">
          {serviciosHoy.length === 0 ? (
            <div className="p-8 text-center rounded-[14px] bg-[#1C1C24] border border-white/[0.08] text-[#8E8E93] text-xs">
              No tienes viajes registrados hoy.
            </div>
          ) : (
            serviciosHoy.map((trip) => (
              <div
                key={trip.id}
                className="p-3.5 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Entrega #{trip.id.substring(0, 8)}</h4>
                    <p className="text-[11px] text-[#8E8E93]">{trip.destino}</p>
                    <span className="text-[10px] text-[#48484A] block">{trip.hora}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-extrabold text-sm text-[#10B981] block">
                    + C$ {trip.ganancia.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-[#8E8E93]">Completado</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
