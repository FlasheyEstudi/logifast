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

type RepartidorTabKey = 'servicio' | 'historial' | 'ganancias' | 'perfil';

const NAV_ITEMS: { key: RepartidorTabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'servicio', label: 'En Servicio', icon: <Bike size={22} strokeWidth={2} /> },
  { key: 'historial', label: 'Historial', icon: <FileText size={22} strokeWidth={2} /> },
  { key: 'ganancias', label: 'Ganancias', icon: <TrendingUp size={22} strokeWidth={2} /> },
  { key: 'perfil', label: 'Perfil', icon: <User size={22} strokeWidth={2} /> },
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
      <div className="min-h-screen bg-[#0D0D0E] text-zinc-100 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Inter',sans-serif] selection:bg-blue-500 selection:text-white pb-28 pt-20">

        {/* 🍏 APPLE DRIVER FLOATING CONTROL HEADER */}
        <header className="fixed top-0 inset-x-0 z-40 px-4 sm:px-8 py-3 backdrop-blur-2xl bg-zinc-950/80 border-b border-white/10 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            
            {/* Status Connection Toggle Button */}
            <button
              onClick={toggleConexion}
              className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 shadow-lg ${
                conectado
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <span className="relative flex h-3 w-3">
                {conectado && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    conectado ? 'bg-emerald-500' : 'bg-zinc-500'
                  }`}
                />
              </span>
              <span className="font-extrabold text-xs tracking-wider uppercase">
                {conectado ? 'DISPONIBLE EN RUTA' : 'DESCONECTADO'}
              </span>
            </button>

            {/* Quick Stats Pill */}
            <div className="hidden sm:flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-1.5 text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                💰 C$ {(statsHoy?.ganancias || perfil?.totalGanancias || 1250).toFixed(2)} hoy
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1.5 text-blue-400">
                📦 {statsHoy?.entregas || perfil?.totalEntregas || 8} Entregas
              </span>
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
                title="Cambiar Tema"
              >
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>

              <button
                onClick={onLogout}
                className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                title="Cerrar Sesión"
              >
                <Power size={18} />
              </button>
            </div>

          </div>
        </header>

        {/* 🍏 MAIN DRIVER CONSOLE */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6">
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
              {activeTab === 'ganancias' && <RepartidorHistorial isDark={isDark} />}
              {activeTab === 'perfil' && <RepartidorPerfil isDark={isDark} userName={userName} onLogout={onLogout} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 🍏 APPLE FLOATING DRIVER DOCK */}
        <nav className="fixed bottom-4 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto backdrop-blur-3xl bg-zinc-900/90 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] rounded-full px-3 py-2 flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`relative px-4 py-2.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all duration-300 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDriverDockTab"
                      className="absolute inset-0 bg-blue-600 rounded-full shadow-lg shadow-blue-500/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  {isActive && <span className="relative z-10">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Overlays / Incoming Order Toast */}
        <RepartidorNotificacionOrden />

      </div>
    </SnackbarContext.Provider>
  );
}
