'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  Wallet,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Shield,
  HelpCircle,
  CreditCard,
  Plus,
  CheckCircle,
  X,
  Sparkles,
} from '@/components/icons';

interface ClientPerfilProps {
  isDark: boolean;
  userName: string;
  onLogout: () => void;
  onNavigate: (mod: 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil' | 'puntos' | 'ayuda') => void;
}

export default function ClientPerfil({ isDark, userName, onLogout, onNavigate }: ClientPerfilProps) {
  const [balance, setBalance] = useState(450.0);
  const [showRecargaModal, setShowRecargaModal] = useState(false);
  const [recargaMonto, setRecargaMonto] = useState('200');

  const handleRecargar = () => {
    const val = parseFloat(recargaMonto);
    if (!isNaN(val) && val > 0) {
      setBalance((b) => b + val);
      setShowRecargaModal(false);
    }
  };

  return (
    <div className="space-y-6 py-2 max-w-3xl mx-auto">

      {/* 🍏 USER HERO CARD */}
      <section className="p-6 sm:p-8 rounded-[32px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">{userName}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">cliente.vip@logifast.com</p>
            <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
              <Sparkles size={11} /> Miembro VIP Gold
            </span>
          </div>
        </div>

        {/* Quick Balance Wallet Pill */}
        <div className="text-right">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Saldo Billetera</span>
          <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
            C$ {balance.toFixed(2)}
          </span>
          <button
            onClick={() => setShowRecargaModal(true)}
            className="mt-1 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1 ml-auto shadow-md shadow-blue-500/20"
          >
            <Plus size={12} /> Recargar
          </button>
        </div>
      </section>

      {/* 🍏 GROUPED iOS SETTINGS CARDS */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-2">Configuración de Cuenta</h3>

        <div className="rounded-[28px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 shadow-sm">
          
          <button
            onClick={() => onNavigate('puntos')}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Wallet size={18} />
              </div>
              <div>
                <span className="font-bold text-xs text-zinc-900 dark:text-white block">Mi Billetera & Puntos</span>
                <span className="text-[10px] text-zinc-400">Ver saldo, cupones y puntos acumulados</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-400" />
          </button>

          <button
            onClick={() => onNavigate('pedidos')}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <span className="font-bold text-xs text-zinc-900 dark:text-white block">Mis Direcciones Guardadas</span>
                <span className="text-[10px] text-zinc-400">Administra tus puntos de entrega habituales</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-400" />
          </button>

          <button
            onClick={() => onNavigate('ayuda')}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <HelpCircle size={18} />
              </div>
              <div>
                <span className="font-bold text-xs text-zinc-900 dark:text-white block">Centro de Ayuda & Soporte</span>
                <span className="text-[10px] text-zinc-400">Preguntas frecuentes y atención al cliente</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-400" />
          </button>

        </div>
      </div>

      {/* Logout Card */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-extrabold text-xs hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Cerrar Sesión Segura
        </button>
      </div>

      {/* RECARGA MODAL */}
      <AnimatePresence>
        {showRecargaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-2xl space-y-4 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Recargar Billetera</h3>
                <button onClick={() => setShowRecargaModal(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Monto a Recargar (C$)</label>
                <input
                  type="number"
                  value={recargaMonto}
                  onChange={(e) => setRecargaMonto(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleRecargar}
                className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
              >
                Confirmar Recarga
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
