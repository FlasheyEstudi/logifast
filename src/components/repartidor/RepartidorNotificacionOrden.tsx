'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, Navigation, Clock, CheckCircle, X } from '@/components/icons';
import { useRepartidorStore } from '@/lib/repartidor-store';

export default function RepartidorNotificacionOrden() {
  const ordenActiva = useRepartidorStore((s) => s.ordenActiva);
  const conectado = useRepartidorStore((s) => s.conectado);
  const aceptarOrden = useRepartidorStore((s) => s.aceptarOrden);
  const rechazarOrden = useRepartidorStore((s) => s.rechazarOrden);

  const [visible, setVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Trigger simulated incoming order notification if driver is connected and no active order
  useEffect(() => {
    if (conectado && !ordenActiva) {
      const timer = setTimeout(() => {
        setVisible(true);
        setTimeLeft(30);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [conectado, ordenActiva]);

  // Countdown timer (30s)
  useEffect(() => {
    if (!visible) return;
    if (timeLeft <= 0) {
      setVisible(false);
      rechazarOrden();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, timeLeft, rechazarOrden]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-4 inset-x-0 z-50 px-4 flex justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="pointer-events-auto w-full max-w-[400px] bg-[#1C1C24]/95 backdrop-blur-[40px] border border-white/[0.08] rounded-[24px] p-4 shadow-2xl space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
                <Bike size={18} />
              </div>
              <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-xs text-white">¡NUEVA ORDEN DISPONIBLE!</span>
            </div>

            {/* Countdown timer badge (30s) */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 font-mono text-xs font-extrabold text-[#10B981]">
              <Clock size={12} /> {timeLeft}s
            </div>
          </div>

          {/* Route & Earnings Summary */}
          <div className="p-3 rounded-[12px] bg-black/40 border border-white/[0.06] space-y-2 text-xs">
            <div className="flex justify-between items-center pb-1 border-b border-white/[0.06]">
              <span className="text-[#8E8E93] text-[11px]">Ganancia Estimada</span>
              <span className="font-mono font-extrabold text-sm text-[#10B981]">C$ 180.00</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B2C]" />
                <span className="text-[#8E8E93] text-[11px]">Burger Boss (Plaza Inter)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-[#8E8E93] text-[11px]">Los Robles, Casa #142</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setVisible(false);
                rechazarOrden();
              }}
              className="w-1/3 min-h-[48px] py-2.5 rounded-[12px] bg-white/10 text-[#8E8E93] font-bold text-xs hover:bg-white/15"
            >
              Rechazar
            </button>
            <button
              onClick={() => {
                setVisible(false);
                aceptarOrden();
              }}
              className="w-2/3 min-h-[48px] py-2.5 rounded-[12px] bg-[#10B981] text-white font-['Plus_Jakarta_Sans'] font-extrabold text-xs shadow-lg shadow-[#10B981]/25 hover:bg-[#059669] flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={16} /> Aceptar Orden
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
