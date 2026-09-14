'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Package,
  Home,
  ShieldCheck,
  MapPin,
  Clock,
  Truck,
  CreditCard,
  Banknote,
  Tag,
  Calendar,
} from '@/components/icons';

export interface OrderConfirmationModalProps {
  tipo: 'envio' | 'pedido';
  orderId: string;
  titulo?: string;
  subtitulo?: string;
  pin?: string;
  origen?: string;
  destino?: string;
  programadoTexto?: string;
  items?: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  subtotal?: number;
  costoEnvio?: number;
  descuento?: number;
  total: number;
  metodoPago?: 'efectivo' | 'transferencia' | string;
  distanciaKm?: number;
  tiempoEstimadoMin?: number;
  onRastrear: (orderId: string) => void;
  onVerLista: () => void;
  onIrAInicio: () => void;
  onClose?: () => void;
}

export default function OrderConfirmationModal({
  tipo,
  orderId,
  titulo,
  subtitulo,
  pin,
  origen,
  destino,
  programadoTexto,
  items,
  subtotal,
  costoEnvio,
  descuento,
  total,
  metodoPago = 'efectivo',
  distanciaKm,
  tiempoEstimadoMin = 15,
  onRastrear,
  onVerLista,
  onIrAInicio,
  onClose,
}: OrderConfirmationModalProps) {
  const shortId = orderId.slice(-8);
  const resolvedTitulo =
    titulo || (tipo === 'envio' ? '¡Envío confirmado!' : '¡Pedido confirmado!');
  const resolvedSubtitulo =
    subtitulo ||
    (tipo === 'envio'
      ? 'Tu solicitud de envío ha sido registrada. Un repartidor aceptará la recolección en breve.'
      : 'Tu compra ha sido confirmada. El comercio preparará tu pedido para el repartidor.');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto antialiased">
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md max-h-[92vh] bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center space-y-4 overflow-y-auto relative font-sans my-auto"
        >
          {/* Acento superior de diseño global */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#007AFF]" />

          {/* Checkmark animado con halo suave */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center mt-1">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-25" />
            <div className="relative w-18 h-18 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-emerald-500">
              <CheckCircle size={40} strokeWidth={2.4} />
            </div>
          </div>

          {/* Encabezado y Badge de Orden */}
          <div className="space-y-1.5 w-full">
            <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
              {resolvedTitulo}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span>Orden #{shortId}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed pt-1">
              {resolvedSubtitulo}
            </p>
          </div>

          {/* Detalle de Recogida Programada (si aplica) */}
          {programadoTexto && (
            <div className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20 text-left">
              <Calendar size={20} className="text-[#007AFF] flex-shrink-0" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#007AFF]">
                  Recogida Programada
                </div>
                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {programadoTexto}
                </div>
              </div>
            </div>
          )}

          {/* PIN de Seguridad para Entrega */}
          {pin && (
            <div className="w-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col items-center gap-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <ShieldCheck size={15} />
                <span>PIN de Seguridad para Entrega</span>
              </div>
              <div className="text-3xl font-black font-mono tracking-[0.25em] text-amber-600 dark:text-amber-400 py-0.5">
                {pin}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dicta o muestra este código al repartidor al recibir tu {tipo === 'envio' ? 'envío' : 'pedido'}
              </p>
            </div>
          )}

          {/* Tarjeta de Resumen Unificada */}
          <div className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-sm text-xs">
            {origen && (
              <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-medium">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 ring-4 ring-emerald-500/15" />
                <span className="truncate">{origen}</span>
              </div>
            )}

            {destino && (
              <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-medium">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5722] flex-shrink-0 ring-4 ring-[#FF5722]/15" />
                <span className="truncate">{destino}</span>
              </div>
            )}

            {/* Tiempo y Distancia Estimados */}
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                <span>Tiempo estimado</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {distanciaKm ? `${distanciaKm.toFixed(1)} km • ` : ''}~{tiempoEstimadoMin} min
              </span>
            </div>

            {/* Lista de Productos si existen */}
            {items && items.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Productos ({items.reduce((acc, it) => acc + (it.cantidad || 1), 0)})
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="truncate max-w-[210px]">{it.cantidad}x {it.nombre}</span>
                      <span className="font-mono">C$ {(it.precio * it.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desglose de Precios */}
            {(subtotal !== undefined || costoEnvio !== undefined || (descuento && descuento > 0)) && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1 text-slate-500 dark:text-slate-400">
                {subtotal !== undefined && (
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">C$ {subtotal.toFixed(2)}</span>
                  </div>
                )}
                {costoEnvio !== undefined && (
                  <div className="flex justify-between">
                    <span>Costo de Envío Express</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">C$ {costoEnvio.toFixed(2)}</span>
                  </div>
                )}
                {descuento && descuento > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag size={12} /> Descuento Cupón
                    </span>
                    <span className="font-mono">-C$ {descuento.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Total y Método de Pago */}
            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                {metodoPago === 'transferencia' ? (
                  <CreditCard size={14} className="text-blue-500" />
                ) : (
                  <Banknote size={14} className="text-emerald-500" />
                )}
                <span>{metodoPago === 'transferencia' ? 'Transferencia' : 'Efectivo contra entrega'}</span>
              </div>
              <span className="text-lg font-black font-mono text-[#FF5722]">
                C$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botones de Acción Globales */}
          <div className="w-full space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onRastrear(orderId)}
              className="w-full py-3.5 px-4 bg-[#FF5722] hover:bg-[#F4511E] active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#FF5722]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck size={18} />
              <span>{tipo === 'envio' ? 'Rastrear envío en vivo' : 'Rastrear pedido en vivo'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={onVerLista}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Package size={15} />
                <span>{tipo === 'envio' ? 'Mis Envíos' : 'Mis Pedidos'}</span>
              </button>
              <button
                type="button"
                onClick={onIrAInicio}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Home size={15} />
                <span>Inicio</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
