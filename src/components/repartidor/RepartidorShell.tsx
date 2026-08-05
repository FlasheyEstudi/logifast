'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { Moon, Sun, Bike } from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';
import { useGeolocation } from '@/hooks/useGeolocation';
import { onRealtimeEvent } from '@/services/realtime';
import { useConfigStore } from '@/store/configStore';
import { reproducirSiActivo } from '@/services/audio';

const RepartidorServicio = dynamic(() => import('./RepartidorServicio'), { ssr: false });
const RepartidorHistorial = dynamic(() => import('./RepartidorHistorial'), { ssr: false });
const RepartidorPerfil = dynamic(() => import('./RepartidorPerfil'), { ssr: false });
const RepartidorNotificacionOrden = dynamic(() => import('./RepartidorNotificacionOrden'), { ssr: false });
const RepartidorChat = dynamic(() => import('./RepartidorChat'), { ssr: false });
const RepartidorIncidencia = dynamic(() => import('./RepartidorIncidencia'), { ssr: false });
const RepartidorDetalleServicio = dynamic(() => import('./RepartidorDetalleServicio'), { ssr: false });

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

function ServicioIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

function HistorialIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function PerfilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function RepartidorShell({
  isDark,
  toggleTheme,
  onLogout,
  userName,
}: RepartidorShellProps) {
  const {
    pantallaActiva,
    setPantalla,
    conectado,
    conectar,
    desconectar,
    actualizarPosicion,
    ordenAsignadaPendiente,
    chatAbierto,
    incidenciaAbierta,
    servicioDetalle,
    recibirOrdenAsignada,
  } = useRepartidorStore();

  const { tema, setTema, sonidoActivo, volumenSonido, notificacionesSonido } = useConfigStore();
  const activeDark = tema === 'dark' || isDark;

  const [snackbar, setSnackbar] = useState<SnackbarData | null>(null);

  const geoState = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000,
  });

  useEffect(() => {
    if (geoState.lat !== null && geoState.lng !== null) {
      actualizarPosicion(geoState.lat, geoState.lng);
    }
  }, [geoState.lat, geoState.lng, actualizarPosicion]);

  useEffect(() => {
    const unsub = onRealtimeEvent('repartidor:orden:nueva', (data: any) => {
      if (conectado && data) {
        recibirOrdenAsignada({
          id: data.id || `ORD-${Date.now()}`,
          tipo: data.tipo || 'envio',
          cliente: data.cliente || 'Cliente LogiFast',
          clienteTelefono: data.clienteTelefono || '+505 8888 8888',
          origen: data.origen || 'Establecimiento',
          destino: data.destino || 'Dirección cliente',
          origenLat: data.origenLat || 12.1264,
          origenLng: data.origenLng || -86.2652,
          destinoLat: data.destinoLat || 12.1402,
          destinoLng: data.destinoLng || -86.2954,
          metodoPago: data.metodoPago || 'efectivo',
          monto: data.monto || 120.0,
          ganancia: data.ganancia || 85.0,
          kmEstimados: data.kmEstimados || 3.5,
          tiempoEstimado: data.tiempoEstimado || 20,
        });
        reproducirSiActivo('notificacion', {
          sonidoActivo,
          volumenSonido,
          notificacionesSonido,
        });
      }
    });
    return () => unsub();
  }, [conectado, recibirOrdenAsignada, sonidoActivo, volumenSonido, notificacionesSonido]);

  return (
    <SnackbarContext.Provider value={setSnackbar}>
      <div className={`w-full min-h-screen ${activeDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans flex flex-col`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              <Bike size={18} />
            </div>
            <div>
              <h1 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                LogiFast Repartidor
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {userName || 'Carlos Mendoza'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online / Offline Switch */}
            <button
              onClick={() => (conectado ? desconectar() : conectar())}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                conectado
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${conectado ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              <span>{conectado ? 'EN LÍNEA' : 'OFFLINE'}</span>
            </button>

            <button
              onClick={() => {
                setTema(activeDark ? 'light' : 'dark');
                toggleTheme();
              }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              aria-label="Cambiar tema"
            >
              {activeDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-md mx-auto relative overflow-x-hidden">
          {pantallaActiva === 'servicio' && <RepartidorServicio />}
          {pantallaActiva === 'historial' && <RepartidorHistorial />}
          {pantallaActiva === 'perfil' && <RepartidorPerfil onLogout={onLogout} userName={userName} />}
        </main>

        {/* Overlays / Modals */}
        <AnimatePresence>
          {ordenAsignadaPendiente && <RepartidorNotificacionOrden />}
          {chatAbierto && <RepartidorChat />}
          {incidenciaAbierta && <RepartidorIncidencia />}
          {servicioDetalle && <RepartidorDetalleServicio />}
        </AnimatePresence>

        {/* iOS Native Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 max-w-md mx-auto px-4 py-2 flex items-center justify-around shadow-lg">
          <button
            onClick={() => setPantalla('servicio')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              pantallaActiva === 'servicio'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <ServicioIcon />
            <span className="text-[10px]">Servicio</span>
          </button>

          <button
            onClick={() => setPantalla('historial')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              pantallaActiva === 'historial'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <HistorialIcon />
            <span className="text-[10px]">Historial</span>
          </button>

          <button
            onClick={() => setPantalla('perfil')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              pantallaActiva === 'perfil'
                ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <PerfilIcon />
            <span className="text-[10px]">Perfil</span>
          </button>
        </nav>
      </div>
    </SnackbarContext.Provider>
  );
}
