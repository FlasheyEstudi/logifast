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
    <div className="space-y-4 py-1">

      {/* DRIVER HERO PROFILE CARD (WITH 3PX TOP GREEN GRADIENT BAR) */}
      <div className="relative overflow-hidden p-5 rounded-[20px] bg-[#1C1C24] border border-white/[0.08] shadow-xl space-y-4">
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#10B981] to-[#06B6D4]" />

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#10B981] to-[#06B6D4] text-white font-extrabold text-lg flex items-center justify-center ring-2 ring-[#10B981]/50 shadow-md">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-extrabold text-white">{userName}</h2>
              <p className="text-xs text-[#8E8E93]">Repartidor Oficial Logifast</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-[10px] font-bold border border-[#10B981]/20">
                  Licencia Activa
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-bold border border-[#F59E0B]/20 flex items-center gap-0.5">
                  <Star size={9} className="fill-[#F59E0B]" /> {(perfil?.calificacion || 4.98).toFixed(2)}★
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIDER WALLET CARD */}
      <div className="p-4 rounded-[14px] bg-[#1C1C24] border border-white/[0.08] flex items-center justify-between shadow-sm">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E8E93]">Billetera Rider</span>
          <span className="font-mono text-xl font-extrabold text-[#10B981] block">
            C$ {(perfil?.saldo || 850).toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => alert('Solicitud de retiro enviada a revisión.')}
          className="px-4 py-2 rounded-[10px] bg-[#10B981] text-white font-['Plus_Jakarta_Sans'] font-bold text-xs shadow-md hover:bg-[#059669] transition-colors"
        >
          Retirar Saldo
        </button>
      </div>

      {/* VEHICLE DETAILS (2-CARD GRID) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">Información del Vehículo</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-[14px] bg-[#1C1C24] border border-white/[0.08]">
            <span className="text-[#8E8E93] text-[10px] block mb-0.5">Modelo Moto</span>
            <span className="font-bold text-white text-xs">{moto?.modelo || 'Yamaha YBR 125'}</span>
          </div>
          <div className="p-3 rounded-[14px] bg-[#1C1C24] border border-white/[0.08]">
            <span className="text-[#8E8E93] text-[10px] block mb-0.5">Número de Placa</span>
            <span className="font-bold text-white text-xs">{moto?.placa || 'M 148-920'}</span>
          </div>
        </div>
      </div>

      {/* LOGOUT */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full min-h-[48px] py-3 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] font-bold text-xs hover:bg-[#EF4444]/20 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Cerrar Sesión de Repartidor
        </button>
      </div>

    </div>
  );
}
