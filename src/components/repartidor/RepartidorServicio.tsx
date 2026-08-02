'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike,
  MapPin,
  CheckCircle,
  Phone,
  MessageCircle,
  AlertTriangle,
  Navigation,
  ShieldCheck,
  Package,
  Clock,
  Sparkles,
} from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';

interface RepartidorServicioProps {
  isDark: boolean;
}

export default function RepartidorServicio({ isDark }: RepartidorServicioProps) {
  const conectado = useRepartidorStore((s) => s.conectado);
  const ordenActiva = useRepartidorStore((s) => s.ordenActiva);
  const llegarRecogida = useRepartidorStore((s) => s.llegarRecogida);
  const recogerPaquete = useRepartidorStore((s) => s.recogerPaquete);
  const llegarEntrega = useRepartidorStore((s) => s.llegarEntrega);
  const confirmarEntrega = useRepartidorStore((s) => s.confirmarEntrega);

  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const handleStepAction = () => {
    if (!ordenActiva) return;
    // Advance state depending on current store flow
    recogerPaquete();
  };

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">

      {/* 🍏 DRIVER MAP & DISPATCH CONSOLE */}
      <div className="relative rounded-[32px] overflow-hidden bg-zinc-900 border border-zinc-800 h-[480px] shadow-2xl flex items-end p-6">
        
        {/* Leaflet Simulated Vector Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />

        {/* Live Route Graphic Indicator */}
        <div className="absolute top-6 left-6 z-10 p-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Navegación GPS Activa
          </div>
          <p className="text-[11px] text-zinc-400">Zona Metropolitana, Managua</p>
        </div>

        {/* Active Order Dynamic Sheet inside console */}
        {ordenActiva ? (
          <div className="relative z-10 w-full p-6 rounded-[28px] bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                  Orden Activa #{ordenActiva.id.substring(0, 8)}
                </span>
                <h2 className="text-lg font-extrabold text-white">{ordenActiva.tiendaNombre || 'Cliente Directo'}</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                EN RUTA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
                <span className="text-zinc-500 block mb-1">Punto Recogida</span>
                <p className="font-bold text-zinc-200 truncate">{ordenActiva.origen}</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
                <span className="text-zinc-500 block mb-1">Punto Entrega</span>
                <p className="font-bold text-zinc-200 truncate">{ordenActiva.destino}</p>
              </div>
            </div>

            {/* Step Action Button */}
            <button
              onClick={() => setShowPinModal(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs hover:opacity-90 active:scale-98 transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              Completar Estado de Entrega 🔑
            </button>
          </div>
        ) : (
          <div className="relative z-10 w-full p-8 rounded-[28px] bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
              <Bike size={28} />
            </div>
            <h3 className="font-extrabold text-base text-white">Esperando Nuevas Órdenes</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {conectado
                ? 'Estás conectado a la red de despacho. Te notificaremos en cuanto haya un pedido disponible.'
                : 'Mantente disponible activando el interruptor de conexión.'}
            </p>
          </div>
        )}
      </div>

      {/* CONFIRMATION PIN MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-zinc-900 rounded-[32px] p-6 shadow-2xl space-y-4 border border-zinc-800 text-center"
            >
              <h3 className="font-extrabold text-lg text-white">PIN de Confirmación</h3>
              <p className="text-xs text-zinc-400">Solicita al cliente su PIN de 4 dígitos para completar la entrega.</p>
              
              <input
                type="text"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1 2 3 4"
                className="w-full text-center tracking-widest text-2xl py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    confirmarEntrega();
                  }}
                  className="w-1/2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Finalizar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
