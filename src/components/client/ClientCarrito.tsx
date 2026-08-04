'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sileo } from 'sileo';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { useStore } from '@/lib/store';
import { useConfigStore } from '@/store/configStore';
import { reproducirSiActivo, vibrarSiActivo } from '@/services/audio';
import PagoExitoso from './PagoExitoso';
import { LogoSpinner } from '@/components/ui/loaders';
import { X, Trash2, Plus, Minus, Tag, CreditCard, DollarSign, ArrowRight, ShoppingBag } from '@/components/icons';

interface ClientCarritoProps {
  isDark: boolean;
  onClose: () => void;
  onBackToTienda?: () => void;
}

export default function ClientCarrito({ isDark, onClose, onBackToTienda }: ClientCarritoProps) {
  const {
    cartItems,
    cartCodigoPromo,
    cartDescuento,
    cartInstrucciones,
    cartMetodoPago,
    tiendas,
    compraConfirmada,
    compraConfirmadaId,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    setCartCodigoPromo,
    setCartDescuento,
    setCartInstrucciones,
    setCartMetodoPago,
    confirmarCompraAsync,
    getCartSubtotal,
    getCartTiendas,
    getCartItemsByTienda,
  } = useMarketplaceStore();

  const { validateCodigoPromo, setClientActiveModule } = useStore();
  const config = useConfigStore();

  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [codigoPromo, setCodigoPromo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getCartSubtotal();
  const tiendaIds = getCartTiendas();
  const delivery = tiendaIds.reduce((sum, tid) => {
    const t = tiendas.find((ti) => ti.id === tid);
    return sum + (t?.costoEnvio ?? 20);
  }, 0);
  const descuento = cartDescuento || 0;
  const total = Math.max(0, subtotal + delivery - descuento);

  const handleAplicarCodigo = async () => {
    if (!codigoPromo.trim()) return;
    try {
      const res = await fetch('/api/codigos/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: codigoPromo.trim(),
          montoSubtotal: subtotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCartCodigoPromo(data.codigo);
        setCartDescuento(data.descuentoCalculado);
        reproducirSiActivo('exito', {
          sonidoActivo: config.sonidoActivo,
          volumenSonido: config.volumenSonido,
          notificacionesSonido: config.notificacionesSonido,
        });
        sileo.success({ title: '¡Código Aplicado!', description: data.mensaje });
        setMostrarCodigo(false);
      } else {
        sileo.error({ title: 'Código Inválido', description: data.error || 'No se pudo aplicar el código' });
      }
    } catch {
      const result = validateCodigoPromo(codigoPromo.trim());
      if (result.valid) {
        const discountAmount = result.tipo === 'porcentaje'
          ? Math.round(subtotal * (result.descuento / 100))
          : result.descuento;
        setCartCodigoPromo(codigoPromo.trim().toUpperCase());
        setCartDescuento(discountAmount);
        setMostrarCodigo(false);
        sileo.success({ title: '¡Código Aplicado!', description: `Descuento de C$ ${discountAmount}` });
      } else {
        sileo.error({ title: 'Código Inválido', description: 'El código promocional no es válido' });
      }
    }
  };

  const handlePagar = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      reproducirSiActivo('orden_aceptada', {
        sonidoActivo: config.sonidoActivo,
        volumenSonido: config.volumenSonido,
        notificacionesSonido: config.notificacionesSonido
      });
      vibrarSiActivo(50, config.vibracionActiva);

      const result = await confirmarCompraAsync();
      if (!result.ok) {
        sileo.error({ title: "Error en el pago", description: result.error || 'No se pudo procesar la compra' });
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Error al procesar el pago:", err);
      sileo.error({ title: "Error en el pago", description: (err as Error).message });
      setIsProcessing(false);
    }
  };

  const handleCloseSuccess = () => {
    useMarketplaceStore.setState({ compraConfirmada: false, compraConfirmadaId: '' });
    setIsProcessing(false);
    onClose();
  };

  if (compraConfirmada) {
    return (
      <PagoExitoso orderId={compraConfirmadaId} onClose={handleCloseSuccess} setClientActiveModule={setClientActiveModule} />
    );
  }

  // Grupos por tienda
  const grupos = tiendaIds.map((tid) => {
    const tienda = tiendas.find((t) => t.id === tid);
    const items = getCartItemsByTienda(tid);
    return {
      tiendaId: tid,
      tiendaNombre: tienda?.nombre ?? 'Tienda',
      tiendaLogoColor: tienda?.logoColor ?? '#FF5722',
      tiendaLogoIniciales: tienda?.logoIniciales ?? 'T',
      items,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-[1000] bg-[#0B0E14] text-white flex justify-center overflow-hidden antialiased select-none font-sans"
    >
      <div className="w-full max-w-md bg-[#131822] flex flex-col h-full relative border-x border-slate-800 shadow-2xl">
        
        {/* MODAL HEADER */}
        <header className="px-4 py-3.5 flex items-center justify-between border-b border-slate-800 bg-[#131822]/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
            <div>
              <h2 className="font-extrabold text-base text-white tracking-tight">Tu Carrito de Compras</h2>
              <p className="text-[10px] text-slate-400 font-medium">{cartItems.length} producto{cartItems.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center space-x-1"
            >
              <Trash2 size={14} />
              <span>Vaciar</span>
            </button>
          )}
        </header>

        {/* CART CONTENT SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 shadow-inner">
                <ShoppingBag size={40} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Tu carrito está vacío</h3>
                <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mx-auto">
                  Agrega productos deliciosos o artículos de tus tiendas favoritas para comenzar.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-3 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-2xl font-bold text-xs shadow-lg shadow-[#FF5722]/30 active:scale-95 transition-all"
              >
                Explorar Tiendas
              </button>
            </div>
          ) : (
            <>
              {/* STORE GROUPS */}
              {grupos.map((grupo) => (
                <div key={grupo.tiendaId} className="bg-[#1A202C] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg">
                  {/* Store Header */}
                  <div className="flex items-center space-x-3 pb-2 border-b border-slate-800/80">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md"
                      style={{ backgroundColor: grupo.tiendaLogoColor }}
                    >
                      {grupo.tiendaLogoIniciales}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{grupo.tiendaNombre}</h4>
                      <span className="text-[10px] text-emerald-400 font-medium">Entrega estimada: 25 - 35 min</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3 pt-1">
                    {grupo.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-[#131822] p-3 rounded-2xl border border-slate-800">
                        <div className="flex-1 pr-3">
                          <h5 className="font-bold text-xs text-white line-clamp-1">{item.nombreProducto}</h5>
                          {item.notas && <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.notas}</p>}
                          <span className="text-xs font-mono font-extrabold text-[#FF5722] mt-1 block">
                            C$ {item.precioUnitario * item.cantidad}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl">
                          <button
                            onClick={() => updateCartItemQty(item.id, item.cantidad - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white active:scale-90 transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-mono font-bold text-white min-w-5 text-center">{item.cantidad}</span>
                          <button
                            onClick={() => updateCartItemQty(item.id, item.cantidad + 1)}
                            className="w-7 h-7 rounded-lg bg-slate-600 hover:bg-slate-600 flex items-center justify-center text-white active:scale-90 transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* SPECIAL INSTRUCTIONS */}
              <div className="bg-[#1A202C] border border-slate-800 rounded-3xl p-4 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Instrucciones para el repartidor</label>
                <textarea
                  value={cartInstrucciones}
                  onChange={(e) => setCartInstrucciones(e.target.value)}
                  placeholder="Ej: Tocar el timbre azul, dejar en garita..."
                  className="w-full bg-[#131822] border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-[#FF5722] transition-colors resize-none"
                  rows={2}
                />
              </div>

              {/* PROMO CODE SECTION */}
              <div className="bg-[#1A202C] border border-slate-800 rounded-3xl p-4 space-y-3">
                <button
                  onClick={() => setMostrarCodigo(!mostrarCodigo)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
                >
                  <div className="flex items-center space-x-2">
                    <Tag size={16} className="text-[#FF5722]" />
                    <span>{cartCodigoPromo ? `Cupón: ${cartCodigoPromo}` : '¿Tienes un código promocional?'}</span>
                  </div>
                  <span className="text-xs text-[#FF5722]">{mostrarCodigo ? 'Ocultar' : 'Agregar'}</span>
                </button>

                {mostrarCodigo && (
                  <div className="flex space-x-2 pt-1">
                    <input
                      type="text"
                      value={codigoPromo}
                      onChange={(e) => setCodigoPromo(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO"
                      className="flex-1 bg-[#131822] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white uppercase outline-none focus:border-[#FF5722]"
                    />
                    <button
                      onClick={handleAplicarCodigo}
                      disabled={!codigoPromo.trim()}
                      className="px-4 py-2.5 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              {/* PAYMENT METHOD SELECTION */}
              <div className="bg-[#1A202C] border border-slate-800 rounded-3xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                  <CreditCard size={16} className="text-amber-400" />
                  <span>Método de Pago</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setCartMetodoPago('efectivo')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                      cartMetodoPago === 'efectivo'
                        ? 'border-[#FF5722] bg-[#FF5722]/15 text-white ring-2 ring-[#FF5722]/30'
                        : 'border-slate-800 bg-[#131822] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <DollarSign size={20} className={cartMetodoPago === 'efectivo' ? 'text-[#FF5722]' : 'text-slate-400'} />
                    <span className="text-xs font-bold">Efectivo</span>
                    <span className="text-[9px] opacity-70">Contra entrega</span>
                  </button>

                  <button
                    onClick={() => setCartMetodoPago('transferencia')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                      cartMetodoPago === 'transferencia'
                        ? 'border-[#FF5722] bg-[#FF5722]/15 text-white ring-2 ring-[#FF5722]/30'
                        : 'border-slate-800 bg-[#131822] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CreditCard size={20} className={cartMetodoPago === 'transferencia' ? 'text-[#FF5722]' : 'text-slate-400'} />
                    <span className="text-xs font-bold">Transferencia</span>
                    <span className="text-[9px] opacity-70">Bancaria / Móvil</span>
                  </button>
                </div>
              </div>

              {/* ORDER SUMMARY TOTALS */}
              <div className="bg-[#1A202C] border border-slate-800 rounded-3xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-white">C$ {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Costo de envío</span>
                  <span className="font-mono font-semibold text-white">C$ {delivery.toLocaleString()}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Descuento aplicado</span>
                    <span className="font-mono">- C$ {descuento.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-extrabold">
                  <span className="text-white">Total a pagar</span>
                  <span className="font-mono text-[#FF5722] text-base">C$ {total.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* BOTTOM FIXED PAY BUTTON */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-[#131822]/95 backdrop-blur-md border-t border-slate-800 sticky bottom-0 z-30">
            <button
              onClick={handlePagar}
              disabled={isProcessing}
              className="w-full h-14 bg-gradient-to-r from-[#007AFF] to-[#0056B3] hover:from-[#0066CC] hover:to-[#004499] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-[#007AFF]/30 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <LogoSpinner size={24} />
                  <span>Procesando tu pedido...</span>
                </div>
              ) : (
                <>
                  <span>Pagar C$ {total.toLocaleString()}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
