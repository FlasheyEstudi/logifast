'use client';

import React, { useState, useCallback, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Moon,
  Sun,
  TrendingUp,
  Clock,
  Bike,
  User,
  Package,
  FileText,
  AlertTriangle,
  MessageCircle,
  Power,
  ShieldCheck,
  CheckCircle,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';

/* ═══════════════════════════════════════════════
   DYNAMIC REPARTIDOR MODULE IMPORTS
   ═══════════════════════════════════════════════ */
const RepartidorServicio = dynamic(() => import('./RepartidorServicio'), { ssr: false });
const RepartidorHistorial = dynamic(() => import('./RepartidorHistorial'), { ssr: false });
const RepartidorPerfil = dynamic(() => import('./RepartidorPerfil'), { ssr: false });
const RepartidorNotificacionOrden = dynamic(() => import('./RepartidorNotificacionOrden'), { ssr: false });

interface SnackbarData {
  message: string;
  action?: string;
  onAction?: () => void;
}

const SnackbarContext = createContext<(data: SnackbarData | null) => void>(() => {});
export function useRepartidorSnackbar() {
  return useContext(SnackbarContext);
}

interface RepartidorShellProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  userName: string;
}

type RepartidorTabKey = 'servicio' | 'historial' | 'perfil';

const NAV_ITEMS: { key: RepartidorTabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'servicio', label: 'Servicio', icon: <Bike size={20} strokeWidth={2} /> },
  { key: 'historial', label: 'Historial', icon: <FileText size={20} strokeWidth={2} /> },
  { key: 'perfil', label: 'Perfil', icon: <User size={20} strokeWidth={2} /> },
];

export default function RepartidorShell({ isDark, toggleTheme, onLogout, userName }: RepartidorShellProps) {
  const conectado = useRepartidorStore((s) => s.conectado);
  const conectar = useRepartidorStore((s) => s.conectar);
  const desconectar = useRepartidorStore((s) => s.desconectar);
  const statsHoy = useRepartidorStore((s) => s.statsHoy);
  const perfil = useRepartidorStore((s) => s.perfil);

  const [activeTab, setActiveTab] = useState<RepartidorTabKey>('servicio');
  const [snackbar, setSnackbar] = useState<SnackbarData | null>(null);

  const toggleConexion = () => {
    if (conectado) desconectar();
    else conectar();
  };

  const showSnackbar = useCallback((data: SnackbarData | null) => {
    setSnackbar(data);
    if (data) {
      setTimeout(() => setSnackbar(null), 4000);
    }
  }, []);

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      {/* Centered Mobile Layout Container (max 480px) */}
      <div className="min-h-screen bg-[#000000] text-[#F5F5F7] font-['DM_Sans',sans-serif] selection:bg-[#10B981] selection:text-white flex justify-center">
        <div className="w-full max-w-[480px] min-h-screen bg-[#090D16] border-x border-white/5 relative flex flex-col pb-28 pt-16 shadow-2xl">

          {/* 🍏 DRIVER GLASS CONTROL HEADER */}
          <header className="sticky top-0 z-40 px-4 py-2.5 backdrop-blur-[40px] bg-black/60 border-b border-white/[0.08] flex items-center justify-between transition-all">
            
            {/* Status Connection Toggle Pill */}
            <button
              onClick={toggleConexion}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 ${
                conectado
                  ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-[#1C1C24] border-white/[0.08] text-[#8E8E93]'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {conectado && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    conectado ? 'bg-[#10B981]' : 'bg-[#8E8E93]'
                  }`}
                />
              </span>
              <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-[11px] tracking-wider uppercase">
                {conectado ? 'Disponible en ruta' : 'Desconectado'}
              </span>
            </button>

            {/* Quick Earnings Pill */}
            <div className="flex items-center gap-2 bg-[#1C1C24] border border-white/[0.08] rounded-full px-3 py-1 text-xs font-bold text-[#F5F5F7]">
              <span className="text-[#10B981]">
                C$ {(statsHoy?.ganancias || perfil?.totalGanancias || 1250).toFixed(0)} hoy
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
              title="Cerrar Sesión"
            >
              <Power size={16} />
            </button>

          </header>

          {/* 🍏 MAIN DRIVER CONSOLE */}
          <main className="px-4 py-3 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'servicio' && <RepartidorServicio isDark={isDark} />}
                {activeTab === 'historial' && <RepartidorHistorial isDark={isDark} />}
                {activeTab === 'perfil' && <RepartidorPerfil isDark={isDark} userName={userName} onLogout={onLogout} />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* 🍏 DRIVER GLASS DOCK (3 TABS: Servicio, Historial, Perfil) */}
          <nav className="fixed bottom-3 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
            <div className="pointer-events-auto max-w-[400px] w-full backdrop-blur-[50px] bg-[#121217]/90 border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.8)] rounded-full px-3 py-1.5 flex items-center justify-around">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`relative flex flex-col items-center justify-center px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 ${
                      isActive ? 'text-[#10B981]' : 'text-[#8E8E93] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {/* Active glowing green dot indicator above tab */}
                    {isActive && (
                      <motion.div
                        layoutId="activeDriverTabDot"
                        className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 mb-0.5">{item.icon}</span>
                    <span className="relative z-10 text-[10px] tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Incoming Order Toast Notification Overlay */}
          <RepartidorNotificacionOrden />

        </div>
      </div>
    </SnackbarContext.Provider>
  );
}
