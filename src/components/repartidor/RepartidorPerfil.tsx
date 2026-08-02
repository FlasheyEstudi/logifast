'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bike,
  ShieldCheck,
  Wallet,
  Star,
  LogOut,
  ChevronRight,
  Plus,
  FileText,
  AlertTriangle,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';

interface RepartidorPerfilProps {
  isDark: boolean;
  userName: string;
  onLogout: () => void;
}

export default function RepartidorPerfil({ isDark, userName, onLogout }: RepartidorPerfilProps) {
  const perfil = useRepartidorStore((s) => s.perfil);
  const moto = useRepartidorStore((s) => s.moto);

  return (
    <div className="space-y-6 py-2 max-w-3xl mx-auto">

      {/* DRIVER HERO PROFILE */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-zinc-900/90 border border-zinc-800 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{userName}</h2>
            <p className="text-xs text-zinc-400 font-medium">Repartidor Oficial Logifast</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                Licencia Activa
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
                <Star size={10} className="fill-amber-400" /> {(perfil?.calificacion || 4.98).toFixed(2)}★
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Billetera Rider</span>
          <span className="text-lg font-extrabold text-emerald-400">
            C$ {(perfil?.saldo || 850).toFixed(2)}
          </span>
        </div>
      </div>

      {/* VEHICLE DETAILS */}
      <div className="p-6 rounded-[28px] bg-zinc-900/80 border border-zinc-800 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Información del Vehículo</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-zinc-500 block mb-1">Modelo Moto</span>
            <span className="font-bold text-white">{moto?.modelo || 'Yamaha YBR 125'}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-zinc-500 block mb-1">Número de Placa</span>
            <span className="font-bold text-white">{moto?.placa || 'M 148-920'}</span>
          </div>
        </div>
      </div>

      {/* LOGOUT */}
      <button
        onClick={onLogout}
        className="w-full py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold text-xs hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={16} /> Cerrar Sesión de Repartidor
      </button>

    </div>
  );
}
