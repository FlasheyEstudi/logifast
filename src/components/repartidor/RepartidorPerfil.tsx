'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Bike,
  Route as RouteIcon,
  Clock,
  Wrench,
  AlertTriangle,
  ChevronDown,
  Vibrate,
  MapPin,
  Bell,
  Mail,
  HelpCircle,
  LogOut,
  TrendingUp,
  ChevronRight,
  Shield,
  Phone,
  FileText,
  User,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { TemaToggle } from '@/components/ui/TemaToggle';
import { SonidoToggle } from '@/components/ui/SonidoToggle';

export function StarRating({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.floor(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}
        />
      ))}
    </div>
  );
}

interface RepartidorPerfilProps {
  isDark?: boolean;
  toggleTheme?: () => void;
  onLogout: () => void;
  userName: string;
}

export default function RepartidorPerfil({ onLogout, userName }: RepartidorPerfilProps) {
  const { perfil, moto } = useRepartidorStore();
  const [autoOptimizar, setAutoOptimizar] = useState(true);

  return (
    <div className="w-full max-w-md mx-auto px-3.5 sm:px-4 py-3 space-y-4 pb-28 font-sans">
      {/* ── DRIVER PROFILE HEADER CARD ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md border border-white/20">
            {(userName || perfil.nombre || 'Carlos Mendoza').substring(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {userName || perfil.nombre || 'Carlos Mendoza'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Repartidor Oficial LogiFast
            </p>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={perfil.calificacion || 5.0} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {(perfil.calificacion || 5.0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Badge */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <Bike size={16} className="text-blue-500" />
            <span>{moto.modelo || 'Moto Honda Cargo 150'}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
            {moto.placa || 'M 123-456'}
          </span>
        </div>
      </div>

      {/* ── PERFORMANCE STATS ROW ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Puntualidad</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">98%</p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Aceptación</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">96%</p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Entregas</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {perfil.totalEntregas || 482}
          </p>
        </div>
      </div>

      {/* ── PREFERENCES & CONFIGURATION ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          Preferencias de la App
        </h3>

        {/* Theme Toggle Row */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Modo Oscuro / Claro
          </span>
          <TemaToggle />
        </div>

        {/* Sound Toggle Row */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Efectos de Sonido
          </span>
          <SonidoToggle />
        </div>

        {/* Route Optimization */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Optimización Automática de Ruta GPS
          </span>
          <input
            type="checkbox"
            checked={autoOptimizar}
            onChange={(e) => setAutoOptimizar(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ── DOCUMENTATION & SUPPORT ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
          Soporte y Cuenta
        </h3>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 cursor-pointer transition-colors text-xs font-medium">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Shield size={16} className="text-blue-500" />
            <span>Documentos de Conductor (Licencia y Seguro)</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold">
            Válido
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 cursor-pointer transition-colors text-xs font-medium">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <HelpCircle size={16} className="text-blue-500" />
            <span>Centro de Ayuda al Repartidor</span>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </div>
      </div>

      {/* ── LOGOUT BUTTON ── */}
      <button
        onClick={onLogout}
        className="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-bold text-xs shadow-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={16} /> Cerrar Sesión de Repartidor
      </button>
    </div>
  );
}
