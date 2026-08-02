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
  const estadoRepartidor = useRepartidorStore((s) => s.estado);
  const recogerPaquete = useRepartidorStore((s) => s.recogerPaquete);
  const llegarEntrega = useRepartidorStore((s) => s.llegarEntrega);
  const confirmarEntrega = useRepartidorStore((s) => s.confirmarEntrega);

  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [showPinModal, setShowPinModal] = useState(false);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = value;
    setPinDigits(newDigits);

    // Auto-advance input focus
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleStepAction = () => {
    if (!ordenActiva) return;
    if (estadoRepartidor === 'RECOGIDO') {
      llegarEntrega();
    } else if (estadoRepartidor === 'EN_PUNTO_ENTREGA') {
      setShowPinModal(true);
    } else {
      recogerPaquete();
    }
  };

  return (
    <div className="space-y-4 py-1">

      {/* 🍏 DRIVER MAP & DISPATCH CONSOLE */}
      <div className="relative rounded-[20px] overflow-hidden bg-[#0A0A0E] border border-white/[0.08] h-[460px] shadow-2xl flex items-end p-4">
        
        {/* Leaflet Simulated Vector Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/50 to-transparent pointer-events-none" />

        {/* Live Route Graphic Indicator */}
        <div className="absolute top-4 left-4 z-10 p-3 rounded-[12px] bg-[#121217]/90 backdrop-blur-md border border-white/[0.08] space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#10B981]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            Navegación GPS Activa
          </div>
          <p className="text-[11px] text-[#8E8E93]">Zona Metropolitana, Managua</p>
        </div>

        {/* Active Order Dynamic Sheet inside console */}
        {ordenActiva ? (
          <div className="relative z-10 w-full p-4 rounded-[20px] bg-[#1C1C24]/95 backdrop-blur-2xl border border-white/[0.08] space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#10B981]">
                  Orden Activa #{ordenActiva.id.substring(0, 8)}
                </span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-extrabold text-white">{ordenActiva.tiendaNombre || 'Cliente Directo'}</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] text-xs font-bold border border-[#10B981]/20">
                {estadoRepartidor === 'RECOGIDO' ? 'RECOGIDO' : estadoRepartidor === 'EN_PUNTO_ENTREGA' ? 'EN DESTINO' : 'EN TIENDA'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-[12px] bg-black/40 border border-white/[0.06]">
                <span className="text-[#8E8E93] text-[10px] block mb-0.5">Recogida</span>
                <p className="font-bold text-white text-[11px] truncate">{ordenActiva.origen}</p>
              </div>
              <div className="p-2.5 rounded-[12px] bg-black/40 border border-white/[0.06]">
                <span className="text-[#8E8E93] text-[10px] block mb-0.5">Entrega</span>
                <p className="font-bold text-white text-[11px] truncate">{ordenActiva.destino}</p>
              </div>
            </div>

            {/* Step Action Button */}
            <button
              onClick={handleStepAction}
              className="w-full min-h-[48px] py-3 rounded-[12px] bg-[#10B981] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-xs hover:bg-[#059669] active:scale-[0.97] transition-all shadow-lg shadow-[#10B981]/25 flex items-center justify-center gap-2"
            >
              {estadoRepartidor === 'RECOGIDO'
                ? 'Llegué a Dirección de Entrega 📍'
                : estadoRepartidor === 'EN_PUNTO_ENTREGA'
                ? 'Completar Entrega (Ingresar PIN) 🔑'
                : 'Confirmar Paquete Recogido 📦'}
            </button>
          </div>
        ) : (
          <div className="relative z-10 w-full p-6 rounded-[20px] bg-[#1C1C24]/95 backdrop-blur-2xl border border-white/[0.08] text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#10B981] mx-auto flex items-center justify-center">
              <Bike size={24} />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-white">Esperando Nuevas Órdenes</h3>
            <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
              {conectado
                ? 'Estás conectado a la red de entregas. Te notificaremos en cuanto haya un pedido asignado.'
                : 'Mantente disponible activando el toggle de conexión arriba.'}
            </p>
          </div>
        )}
      </div>

      {/* 🔑 4-DIGIT PIN CONFIRMATION MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#1C1C24] rounded-[28px] p-6 shadow-2xl space-y-4 border border-white/[0.08] text-center"
            >
              <div className="w-14 h-14 rounded-full bg-[#10B981]/15 text-[#10B981] mx-auto flex items-center justify-center font-bold text-xl">
                🔑
              </div>

              <div className="space-y-1">
                <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-white">Confirmar Entrega</h3>
                <p className="text-xs text-[#8E8E93]">Solicita al cliente el PIN de 4 dígitos para completar la entrega.</p>
              </div>
              
              {/* 4 Large Digit Inputs (52x60px) */}
              <div className="flex justify-center gap-3 py-2">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`pin-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    className="w-[52px] h-[60px] text-center text-2xl font-extrabold font-mono rounded-[12px] bg-black border border-white/[0.12] text-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30 transition-all"
                  />
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 min-h-[48px] py-3 rounded-[12px] bg-white/10 text-[#8E8E93] font-bold text-xs hover:bg-white/15"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    confirmarEntrega();
                  }}
                  className="w-1/2 min-h-[48px] py-3 rounded-[12px] bg-[#10B981] text-white font-extrabold text-xs shadow-lg shadow-[#10B981]/25 hover:bg-[#059669]"
                >
                  Confirmar Entrega
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
