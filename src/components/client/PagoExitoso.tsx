'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Home, ArrowRight } from '@/components/icons';

interface PagoExitosoProps {
  orderId?: string;
  onClose: () => void;
  setClientActiveModule?: (module: any) => void;
}

export default function PagoExitoso({ orderId, onClose, setClientActiveModule }: PagoExitosoProps) {
  const orderNum = orderId || `LF-${Math.floor(Math.random() * 90000) + 10000}`;

  const handleIrAPedidos = () => {
    if (typeof setClientActiveModule === 'function') {
      setClientActiveModule('pedidos');
    }
    onClose();
  };

  const handleIrAInicio = () => {
    if (typeof setClientActiveModule === 'function') {
      setClientActiveModule('inicio');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B0E14] text-white flex flex-col items-center justify-center p-6 select-none overflow-y-auto antialiased">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-[#131822] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-6"
      >
        {/* Animated Checkmark Icon */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20"
          >
            <CheckCircle size={48} />
          </motion.div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF5722] flex items-center justify-center text-white text-xs font-bold shadow-md">
            ✓
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white">¡Pago Exitoso!</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-[260px] mx-auto font-medium">
            Tu pedido ha sido recibido y la tienda ya está preparándolo. Te avisaremos cuando salga el repartidor.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="w-full bg-[#1A202C] border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Número de Pedido</span>
            <span className="font-mono font-bold text-amber-400">#{orderNum}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Tiempo Estimado</span>
            <span className="font-semibold text-white">25 - 35 min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Estado</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
              CONFIRMADO
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-2">
          <button
            onClick={handleIrAPedidos}
            className="w-full h-13 py-3.5 px-5 bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#F4511E] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#FF5722]/30 active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            <Package size={18} />
            <span>Ver mis pedidos</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={handleIrAInicio}
            className="w-full h-12 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold text-sm active:scale-98 transition-all flex items-center justify-center space-x-2 border border-slate-700"
          >
            <Home size={18} />
            <span>Volver al inicio</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

