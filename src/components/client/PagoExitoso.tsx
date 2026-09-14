'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Home,
  ShieldCheck,
  MapPin,
  Store,
  CreditCard,
  Banknote,
  Tag,
  Clock,
  Truck,
} from '@/components/icons';
import CheckAnimation from '@/components/ui/CheckAnimation';

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

const safeNum = (v: any, fallback = 0): number => {
  const n = Number(v);
  return !Number.isNaN(n) && Number.isFinite(n) ? n : fallback;
};

export default function PagoExitoso({
  order,
  orderId,
  onClose,
  onTrackOrder,
  setClientActiveModule,
}: PagoExitosoProps) {
  const effectiveId = order?.id || orderId || `LF-${Math.floor(Math.random() * 90000) + 10000}`;
  const pin = order?.codigoPin || '';
  const subtotal = safeNum(
    order?.subtotal,
    safeNum(order?.total) ? Math.max(0, safeNum(order?.total) - safeNum(order?.costoEnvio, 35)) : 0
  );
  const envio = safeNum(order?.costoEnvio, 35);
  const descuento = safeNum(order?.descuento, 0);
  const total = safeNum(order?.total, Math.max(0, subtotal + envio - descuento));
  const tienda = order?.tiendaNombre || 'Tienda Asociada';
  const direccion = order?.direccionEntrega || 'Dirección de Entrega';
  const km = order?.kmEstimados && order.kmEstimados > 0 ? order.kmEstimados.toFixed(1) : null;
  const tiempoMin =
    order?.tiempoEstimado && order.tiempoEstimado > 0
      ? order.tiempoEstimado
      : km
      ? Math.round(Number(km) * 4 + 10)
      : 25;

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
    <div className="fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto antialiased">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md max-h-[92vh] bg-white dark:bg-[#151B26] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center space-y-4 overflow-y-auto"
      >
        {/* Checkmark animado idéntico a Envío */}
        <CheckAnimation size={76} />

        {/* Encabezado */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold font-['Syne',sans-serif] text-emerald-500 tracking-tight">
            ¡Pedido confirmado!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-['DM_Sans',sans-serif]">
            Orden <span className="font-mono font-bold text-slate-900 dark:text-white">#{effectiveId.slice(-8)}</span> registrada exitosamente
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-['DM_Sans',sans-serif] pt-0.5">
            Tu compra está confirmada. El comercio comenzará la preparación y se asignará un repartidor.
          </p>
        </div>

        {/* PIN de Seguridad */}
        {pin && (
          <div className="w-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center gap-1">
            <div className="text-[11px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 font-['DM_Sans',sans-serif] flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>PIN de Seguridad para Entrega</span>
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-[0.25em] text-amber-600 dark:text-amber-400">
              {pin}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-['DM_Sans',sans-serif]">
              Dicta o muestra este código al repartidor al recibir tu pedido
            </p>
          </div>
        )}

        {/* Detalles de la Orden */}
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 text-left space-y-3 font-['DM_Sans',sans-serif] shadow-sm">
          {/* Tienda */}
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm font-semibold">
            <Store size={16} className="text-[#FF5722] flex-shrink-0" />
            <span className="truncate">{tienda}</span>
          </div>

          {/* Dirección */}
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
            <MapPin size={16} className="text-emerald-500 flex-shrink-0" />
            <span className="truncate">{direccion}</span>
          </div>

          {/* Tiempo y distancia estimados */}
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/80 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              <span>Tiempo estimado</span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {km ? `${km} km • ` : ''}~{tiempoMin} min
            </span>
          </div>

          {/* Productos comprados */}
          {order?.items && order.items.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Productos ({order.items.reduce((acc, it) => acc + (it.cantidad || 1), 0)})
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1 text-xs text-slate-600 dark:text-slate-300">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="truncate max-w-[210px]">
                      {it.cantidad}x {it.nombreProducto || it.nombre || 'Producto'}
                    </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      C$ {((safeNum(it.precioUnitario ?? it.precio)) * safeNum(it.cantidad, 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desglose financiero */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">C$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Costo de Envío Express</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">C$ {envio.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="flex items-center gap-1">
                  <Tag size={12} /> Descuento Cupón
                </span>
                <span className="font-mono">-C$ {descuento.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Total final y Método de pago */}
          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {order?.metodoPago === 'transferencia' ? (
                <CreditCard size={14} className="text-blue-500" />
              ) : (
                <Banknote size={14} className="text-emerald-500" />
              )}
              <span>{order?.metodoPago === 'transferencia' ? 'Transferencia' : 'Efectivo contra entrega'}</span>
            </div>
            <span className="text-lg font-bold font-mono text-[#FF5722]">
              C$ {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="w-full space-y-2 pt-1 font-['DM_Sans',sans-serif]">
          <button
            onClick={handleRastrear}
            className="w-full py-3.5 px-4 bg-[#FF5722] hover:bg-[#F4511E] active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FF5722]/25 transition-all flex items-center justify-center gap-2"
          >
            <Truck size={18} />
            <span>Rastrear pedido en vivo</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              onClick={handleIrAPedidos}
              className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Package size={14} />
              <span>Mis Pedidos</span>
            </button>
            <button
              onClick={handleIrAInicio}
              className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
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
