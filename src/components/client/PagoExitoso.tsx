'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Package,
  Home,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Store,
  CreditCard,
  Tag,
  Clock,
  Navigation,
} from '@/components/icons';

export interface CompletedOrderData {
  id: string;
  codigoPin?: string;
  tiendaNombre?: string;
  direccionEntrega?: string;
  subtotal?: number;
  costoEnvio?: number;
  descuento?: number;
  total?: number;
  metodoPago?: string;
  kmEstimados?: number;
  tiempoEstimado?: number;
  items?: Array<{
    nombreProducto?: string;
    nombre?: string;
    cantidad: number;
    precioUnitario?: number;
    precio?: number;
  }>;
  createdAt?: string;
}

interface PagoExitosoProps {
  order?: CompletedOrderData | null;
  orderId?: string;
  onClose: () => void;
  onTrackOrder?: (orderId: string) => void;
  setClientActiveModule?: (module: any) => void;
}

export default function PagoExitoso({
  order,
  orderId,
  onClose,
  onTrackOrder,
  setClientActiveModule,
}: PagoExitosoProps) {
  const effectiveId = order?.id || orderId || `LF-${Math.floor(Math.random() * 90000) + 10000}`;
  const pin = order?.codigoPin || '';
  const subtotal = order?.subtotal ?? (order?.total ? Math.max(0, order.total - (order.costoEnvio || 35)) : 0);
  const envio = order?.costoEnvio ?? 35;
  const descuento = order?.descuento ?? 0;
  const total = order?.total ?? Math.max(0, subtotal + envio - descuento);
  const tienda = order?.tiendaNombre || 'Tienda Asociada';
  const direccion = order?.direccionEntrega || 'Dirección de Entrega';
  const km = order?.kmEstimados && order.kmEstimados > 0 ? order.kmEstimados.toFixed(1) : null;
  const tiempoMin = order?.tiempoEstimado && order.tiempoEstimado > 0 ? order.tiempoEstimado : (km ? Math.round(Number(km) * 4 + 10) : 25);

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

  const handleRastrear = () => {
    if (typeof onTrackOrder === 'function') {
      onTrackOrder(effectiveId);
    } else if (typeof setClientActiveModule === 'function') {
      setClientActiveModule('envios');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0B0E14]/90 backdrop-blur-md text-white flex flex-col items-center justify-center p-4 select-none overflow-y-auto antialiased">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md max-h-[92vh] bg-[#131822] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Checkmark animado */}
        <div className="relative pt-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20"
          >
            <CheckCircle size={38} />
          </motion.div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF5722] flex items-center justify-center text-white text-[11px] font-bold shadow-md">
            ✓
          </div>
        </div>

        {/* Encabezado */}
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-white">¡Pedido Confirmado con Éxito!</h2>
          <p className="text-xs text-slate-300 max-w-[320px] mx-auto font-medium">
            Tu orden está registrada. La tienda comenzará su preparación y se notificará a los repartidores.
          </p>
        </div>

        {/* CÓDIGO PIN DESTACADO */}
        {pin && (
          <div className="w-full bg-gradient-to-br from-amber-500/15 via-slate-900 to-amber-500/5 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col items-center space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold tracking-wider uppercase">
              <ShieldCheck size={14} />
              <span>PIN de Seguridad para Entrega</span>
            </div>
            <div className="text-3xl font-black font-mono tracking-widest text-amber-300">
              {pin}
            </div>
            <p className="text-[10px] text-slate-400">
              Dicta o muestra este código al repartidor al recibir tu pedido.
            </p>
          </div>
        )}

        {/* DETALLES DE LA ORDEN */}
        <div className="w-full bg-[#1A202C] border border-slate-800/80 rounded-2xl p-4 text-xs space-y-3 text-left">
          {/* Orden ID y Estado */}
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Orden</span>
            <span className="font-mono font-bold text-amber-400 text-xs">#{effectiveId.slice(-8)}</span>
          </div>

          {/* Tienda y Dirección */}
          <div className="space-y-1.5 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-200">
              <Store size={14} className="text-[#FF5722] flex-shrink-0" />
              <span className="font-semibold truncate">{tienda}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <MapPin size={14} className="text-emerald-400 flex-shrink-0" />
              <span className="truncate">{direccion}</span>
            </div>
          </div>

          {/* Distancia y Tiempo estimado */}
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock size={12} className="text-slate-400" /> Tiempo estimado
            </span>
            <span className="font-bold text-white">
              {km ? `${km} km • ` : ''}~{tiempoMin} min
            </span>
          </div>

          {/* Items comprados (si existen) */}
          {order?.items && order.items.length > 0 && (
            <div className="space-y-1 pb-2.5 border-b border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                Productos ({order.items.reduce((acc, it) => acc + (it.cantidad || 1), 0)})
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] text-slate-300">
                    <span className="truncate max-w-[220px]">
                      {it.cantidad}x {it.nombreProducto || it.nombre || 'Producto'}
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
                      C$ {((it.precioUnitario ?? it.precio ?? 0) * it.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DESGLOSE FINANCIERO EXACTO */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-300">C$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Costo de Envío Express</span>
              <span className="font-mono text-slate-300">C$ {envio.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-400 font-medium">
                <span className="flex items-center gap-1">
                  <Tag size={11} /> Descuento Cupón
                </span>
                <span className="font-mono">-C$ {descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-700/80 text-sm font-bold text-white">
              <span>Total Final</span>
              <span className="text-base font-mono text-[#FF5722]">C$ {total.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
              <CreditCard size={11} />
              <span>Método: {order?.metodoPago === 'transferencia' ? 'Transferencia' : 'Efectivo contra entrega'}</span>
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="w-full space-y-2 pt-1">
          <button
            onClick={handleRastrear}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#F4511E] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#FF5722]/25 active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            <Navigation size={16} />
            <span>Rastrear Pedido en Vivo</span>
            <ArrowRight size={16} />
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={handleIrAPedidos}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs active:scale-98 transition-all flex items-center justify-center space-x-1.5 border border-slate-700"
            >
              <Package size={14} />
              <span>Mis Pedidos</span>
            </button>
            <button
              onClick={handleIrAInicio}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs active:scale-98 transition-all flex items-center justify-center space-x-1.5 border border-slate-700"
            >
              <Home size={14} />
              <span>Inicio</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

