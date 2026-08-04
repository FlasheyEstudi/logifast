'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  CreditCard,
  DollarSign,
  Check,
  Store,
  ChevronDown,
} from '@/components/icons';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { useStore } from '@/lib/store';
import { notify } from '@/lib/notify';
import { LogoSpinner } from '@/components/ui/loaders';

interface ClientCarritoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCheckout?: () => void;
}

export default function ClientCarrito({ isOpen = true, onClose, onSuccessCheckout }: ClientCarritoProps) {
  const {
    cartItems,
    cartCodigoPromo,
    cartDescuento,
    cartInstrucciones,
    cartMetodoPago,
    updateCartItemQty,
    clearCart,
    setCartCodigoPromo,
    setCartInstrucciones,
    setCartMetodoPago,
    getCartSubtotal,
    getCartTotal,
  } = useMarketplaceStore();

  const { crearOrden } = useStore();

  const [codigoPromoInput, setCodigoPromoInput] = useState('');
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const subtotal = getCartSubtotal();
  const delivery = cartItems.length > 0 ? 35 : 0;
  const descuento = cartDescuento;
  const total = Math.max(0, subtotal + delivery - descuento);

  // Group items by store
  const grupos = cartItems.reduce((acc, item) => {
    const existing = acc.find((g) => g.tiendaId === item.tiendaId);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({
        tiendaId: item.tiendaId,
        tiendaNombre: item.tiendaNombre,
        tiendaLogoIniciales: item.tiendaNombre.substring(0, 2).toUpperCase(),
        items: [item],
      });
    }
    return acc;
  }, [] as Array<{ tiendaId: string; tiendaNombre: string; tiendaLogoIniciales: string; items: typeof cartItems }>);

  const handleAplicarCodigo = () => {
    if (!codigoPromoInput.trim()) return;
    if (codigoPromoInput.trim().toUpperCase() === 'LOGIFAST20') {
      setCartCodigoPromo('LOGIFAST20', 20);
      notify.success('¡Cupón LOGIFAST20 aplicado (-C$ 20)!');
    } else if (codigoPromoInput.trim().toUpperCase() === 'PROMO50') {
      setCartCodigoPromo('PROMO50', 50);
      notify.success('¡Cupón PROMO50 aplicado (-C$ 50)!');
    } else {
      notify.error('Código promocional no válido');
    }
    setCodigoPromoInput('');
  };

  const handlePagar = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);

    try {
      await new Promise((res) => setTimeout(res, 1200));

      const tiendaPrincipal = grupos[0]?.tiendaNombre || 'Tienda Logifast';
      crearOrden({
        origen: tiendaPrincipal,
        destino: 'Mi Ubicación Actual',
        montoTotal: total,
        metodoPago: cartMetodoPago,
        notas: cartInstrucciones,
      });

      clearCart();
      setIsProcessing(false);
      notify.success('¡Pedido realizado con éxito!');
      if (onSuccessCheckout) onSuccessCheckout();
      onClose();
    } catch {
      setIsProcessing(false);
      notify.error('Ocurrió un error al procesar tu pedido');
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
          }}
        />

        {/* Bottom Sheet Modal Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            maxHeight: '90vh',
            background: 'rgba(19, 24, 34, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 -16px 50px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: '#F8FAFC',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Sheet Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <div
              style={{
                width: 42,
                height: 5,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.25)',
              }}
            />
          </div>

          {/* Header */}
          <header
            style={{
              padding: '12px 20px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#F8FAFC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, margin: 0, color: '#F8FAFC' }}>
                  Tu Carrito de Compras
                </h2>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>
                  {cartItems.length} producto{cartItems.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: '1px solid rgba(255, 59, 48, 0.3)',
                  background: 'rgba(255, 59, 48, 0.12)',
                  color: '#FF3B30',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
                <span>Vaciar</span>
              </button>
            )}
          </header>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cartItems.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 24,
                    background: 'rgba(0, 122, 255, 0.15)',
                    border: '1px solid rgba(0, 122, 255, 0.3)',
                    color: '#007AFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingBag size={36} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#F8FAFC', margin: '0 0 6px' }}>
                    Tu carrito está vacío
                  </h3>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, maxWidth: 260 }}>
                    Explora tus restaurantes y tiendas favoritas para agregar deliciosos productos.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 100,
                    background: '#007AFF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0, 122, 255, 0.35)',
                  }}
                >
                  Explorar Tiendas
                </button>
              </div>
            ) : (
              <>
                {/* Store Groups */}
                {grupos.map((grupo) => (
                  <div
                    key={grupo.tiendaId}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 20,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: '#007AFF',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {grupo.tiendaLogoIniciales}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>{grupo.tiendaNombre}</h4>
                        <span style={{ fontSize: 11, color: '#34C759', fontWeight: 600 }}>Entrega estimada: 25 - 35 min</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
                      {grupo.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 12,
                            borderRadius: 14,
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: 12 }}>
                            <h5 style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>{item.nombreProducto}</h5>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#007AFF', marginTop: 4, display: 'block' }}>
                              C$ {(item.precioUnitario * item.cantidad).toFixed(2)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.08)', padding: 4, borderRadius: 100 }}>
                            <button
                              onClick={() => updateCartItemQty(item.id, item.cantidad - 1)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(255, 255, 255, 0.12)',
                                color: '#F8FAFC',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#F8FAFC', minWidth: 20, textAlign: 'center' }}>
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => updateCartItemQty(item.id, item.cantidad + 1)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#007AFF',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Promo Code Card */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  <button
                    onClick={() => setMostrarCodigo(!mostrarCodigo)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={16} color="#007AFF" />
                      <span>{cartCodigoPromo ? `Cupón aplicado: ${cartCodigoPromo}` : '¿Tienes un código promocional?'}</span>
                    </div>
                    <span style={{ color: '#007AFF', fontSize: 12 }}>{mostrarCodigo ? 'Ocultar' : 'Agregar'}</span>
                  </button>

                  {mostrarCodigo && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <input
                        type="text"
                        value={codigoPromoInput}
                        onChange={(e) => setCodigoPromoInput(e.target.value.toUpperCase())}
                        placeholder="Ej. LOGIFAST20"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#F8FAFC',
                          fontSize: 13,
                          fontWeight: 600,
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={handleAplicarCodigo}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 12,
                          background: '#007AFF',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={16} color="#FF9500" />
                    <span>Método de Pago</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      onClick={() => setCartMetodoPago('efectivo')}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: cartMetodoPago === 'efectivo' ? '2px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: cartMetodoPago === 'efectivo' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        color: '#F8FAFC',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <DollarSign size={20} color={cartMetodoPago === 'efectivo' ? '#007AFF' : '#94A3B8'} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Efectivo</span>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>Contra entrega</span>
                    </button>

                    <button
                      onClick={() => setCartMetodoPago('transferencia')}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: cartMetodoPago === 'transferencia' ? '2px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: cartMetodoPago === 'transferencia' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        color: '#F8FAFC',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CreditCard size={20} color={cartMetodoPago === 'transferencia' ? '#007AFF' : '#94A3B8'} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Transferencia</span>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>Bancaria / Móvil</span>
                    </button>
                  </div>
                </div>

                {/* Summary Totals */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Subtotal</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#F8FAFC' }}>C$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Envío</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#F8FAFC' }}>C$ {delivery.toFixed(2)}</span>
                  </div>
                  {descuento > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34C759', fontWeight: 700 }}>
                      <span>Descuento aplicado</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>- C$ {descuento.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: 15 }}>Total a Pagar</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: '#007AFF' }}>
                      C$ {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Checkout Button */}
          {cartItems.length > 0 && (
            <div style={{ padding: 16, background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                onClick={handlePagar}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 16,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(0, 122, 255, 0.4)',
                }}
              >
                {isProcessing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogoSpinner size={22} />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <>
                    <span>Confirmar y Pagar C$ {total.toFixed(2)}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
