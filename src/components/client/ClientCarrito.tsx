'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Tag,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  Check,
  ChevronRight,
  X,
  ShoppingBag,
  Zap,
  Calendar,
} from 'lucide-react';
import { useMarketplaceStore, type CartItem, type Tienda } from '@/lib/marketplace-store';
import { useStore } from '@/lib/store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientCarritoProps {
  isDark: boolean;
  onClose: () => void;
  onBackToTienda: () => void;
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function formatCordobas(n: number): string {
  return `C$ ${n.toLocaleString('es-NI')}`;
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientCarrito({ isDark, onClose, onBackToTienda }: ClientCarritoProps) {
  /* ── Store ── */
  const {
    cartItems,
    cartCodigoPromo,
    cartDescuento,
    cartDireccionEntrega,
    cartInstrucciones,
    cartMetodoPago,
    cartScheduleMode,
    cartScheduleDate,
    cartScheduleTime,
    tiendas,
    ordenesCompra,
    compraConfirmada,
    compraConfirmadaId,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    setCartCodigoPromo,
    setCartDescuento,
    setCartDireccionEntrega,
    setCartInstrucciones,
    setCartMetodoPago,
    setCartScheduleMode,
    setCartScheduleDate,
    setCartScheduleTime,
    confirmarCompra,
    getCartSubtotal,
    getCartTotal,
    getCartItemCount,
    getCartTiendas,
    getCartItemsByTienda,
  } = useMarketplaceStore();

  const { direccionesGuardadas, validateCodigoPromo } = useStore();

  /* ── Local state ── */
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  /* ── Derived ── */
  const itemCount = getCartItemCount();
  const subtotal = getCartSubtotal();
  const total = getCartTotal();
  const tiendaIds = getCartTiendas();
  const isEmpty = cartItems.length === 0;

  // Calculate shipping: sum of shipping costs from each unique tienda
  const costoEnvio = tiendaIds.reduce((sum, tid) => {
    const t = tiendas.find((ti) => ti.id === tid);
    return sum + (t?.costoEnvio ?? 20);
  }, 0);

  const firstTienda = tiendaIds.length > 0 ? tiendas.find((t) => t.id === tiendaIds[0]) : null;

  // Get confirmed order
  const confirmedOrder = confirmedOrderId
    ? ordenesCompra.find((o) => o.id === confirmedOrderId)
    : null;

  /* ── Promo logic ── */
  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const result = validateCodigoPromo(promoInput.trim());
    if (result.valid) {
      const discountAmount = result.tipo === 'porcentaje'
        ? Math.round(subtotal * (result.descuento / 100))
        : result.descuento;
      setCartCodigoPromo(promoInput.trim().toUpperCase());
      setCartDescuento(discountAmount);
      setPromoError('');
    } else {
      setPromoError('Código no válido');
    }
  };

  const handleRemovePromo = () => {
    setCartCodigoPromo('');
    setCartDescuento(0);
    setPromoInput('');
    setPromoError('');
  };

  /* ── Confirm purchase ── */
  const handleConfirmPurchase = async () => {
    setIsConfirming(true);
    // Brief loading simulation
    await new Promise((r) => setTimeout(r, 800));
    confirmarCompra();
    // Get the latest order ID right after confirming
    const state = useMarketplaceStore.getState();
    setConfirmedOrderId(state.compraConfirmadaId);
    setIsConfirming(false);
  };

  /* ── Schedule helpers ── */
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  /* ═══════════════════════════════════════════════
     CONFIRMATION SCREEN
     ═══════════════════════════════════════════════ */
  if (confirmedOrder) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: isDark ? 'var(--negro)' : 'var(--blanco)' }}
      >
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-lg mx-auto px-6 py-10 flex flex-col items-center text-center">
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'var(--exito)', boxShadow: '0 8px 32px rgba(34,197,94,0.3)' }}
            >
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-[28px] font-bold mb-2"
              style={{ fontFamily: 'Syne, sans-serif', color: 'var(--exito)' }}
            >
              ¡Pedido confirmado!
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2 mb-8"
            >
              <p
                className="text-sm"
                style={{ color: isDark ? 'var(--gris3)' : 'var(--gris2)', fontFamily: 'DM Sans, sans-serif' }}
              >
                Orden <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>{confirmedOrder.id}</span>
              </p>
              <p
                className="text-sm"
                style={{ color: isDark ? 'var(--gris3)' : 'var(--gris2)', fontFamily: 'DM Sans, sans-serif' }}
              >
                {confirmedOrder.tiendaNombre}
              </p>
              <div
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full"
                style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
              >
                <Clock className="w-4 h-4" style={{ color: 'var(--primario)' }} />
                <span className="text-sm font-medium" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                  Llegará en ~30 minutos
                </span>
              </div>
            </motion.div>

            {/* Products mini-list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full rounded-2xl p-4 mb-6"
              style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
            >
              <p className="text-xs font-semibold mb-3" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--gris3)' : 'var(--gris2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Productos
              </p>
              <div className="space-y-2">
                {confirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                      {item.cantidad}× {item.nombreProducto}
                    </span>
                    <span className="text-sm font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}>
                      {formatCordobas(item.cantidad * item.precioUnitario)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}33` }}>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                    Total
                  </span>
                  <span className="text-base font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primario)' }}>
                    {formatCordobas(confirmedOrder.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}>
                    Pago
                  </span>
                  <span className="text-xs font-medium" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}>
                    {confirmedOrder.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full space-y-3"
            >
              <button
                onClick={onClose}
                className="w-full py-4 rounded-[14px] text-white font-bold text-[17px] transition-transform active:scale-[0.97]"
                style={{ fontFamily: 'Syne, sans-serif', background: 'var(--primario)' }}
              >
                Rastrear pedido
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 rounded-[14px] font-semibold text-[15px] transition-transform active:scale-[0.97]"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)',
                  color: isDark ? 'var(--blanco)' : 'var(--negro)',
                }}
              >
                Volver al inicio
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ═══════════════════════════════════════════════
     MAIN CART VIEW
     ═══════════════════════════════════════════════ */
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: isDark ? 'var(--negro)' : 'var(--blanco)' }}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}22` }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: isDark ? 'var(--blanco)' : 'var(--negro)' }} />
          </button>
          <h1 className="text-[28px] font-bold" style={{ fontFamily: 'Syne, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
            Tu carrito
          </h1>
        </div>

        {!isEmpty && (
          <button
            onClick={clearCart}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              color: '#EF4444',
              background: '#EF444415',
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ── EMPTY STATE ── */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <ShoppingBag
              className="w-16 h-16 mb-4"
              style={{ color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}
              strokeWidth={1.5}
            />
          </motion.div>
          <p className="text-lg font-semibold mb-1" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
            Tu carrito está vacío
          </p>
          <p className="text-sm mb-6" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}>
            Explora tiendas y agrega productos
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-[14px] text-white font-semibold text-[15px] transition-transform active:scale-[0.97]"
            style={{ fontFamily: 'DM Sans, sans-serif', background: 'var(--primario)' }}
          >
            Explorar tiendas
          </button>
        </div>
      )}

      {/* ── WITH ITEMS ── */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-lg mx-auto px-5 py-4 space-y-6">

            {/* ── Items grouped by tienda ── */}
            {tiendaIds.map((tid) => {
              const tienda = tiendas.find((t) => t.id === tid);
              const items = getCartItemsByTienda(tid);
              if (!tienda || items.length === 0) return null;

              return (
                <motion.div
                  key={tid}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
                >
                  {/* Tienda header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: tienda.logoColor, fontFamily: 'Syne, sans-serif' }}
                      >
                        {tienda.logoIniciales}
                      </div>
                      <span className="text-sm font-semibold" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                        {tienda.nombre}
                      </span>
                    </div>
                    <button
                      onClick={onBackToTienda}
                      className="text-xs font-medium flex items-center gap-1"
                      style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--primario)' }}
                    >
                      Ver tienda <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Items */}
                  <div className="px-4 pb-3 space-y-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <CartItemRow
                          key={item.id}
                          item={item}
                          isDark={isDark}
                          onIncrease={() => updateCartItemQty(item.id, item.cantidad + 1)}
                          onDecrease={() => updateCartItemQty(item.id, item.cantidad - 1)}
                          onRemove={() => removeFromCart(item.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}

            {/* ── Promo code section ── */}
            <div
              className="rounded-2xl p-4"
              style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4" style={{ color: 'var(--primario)' }} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                  Código promocional
                </span>
              </div>

              {cartCodigoPromo ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: '#22C55E15' }}>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" style={{ color: '#22C55E' }} />
                    <span className="text-sm font-medium" style={{ fontFamily: 'DM Sans, sans-serif', color: '#22C55E' }}>
                      Código {cartCodigoPromo} aplicado: -{cartDescuento > subtotal * 0.3 ? formatCordobas(cartDescuento) : `${Math.round((cartDescuento / subtotal) * 100)}%`}
                    </span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-xs font-medium px-2 py-1 rounded-lg"
                    style={{ color: '#EF4444', background: '#EF444415' }}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); }}
                      placeholder="Ingresa código promocional"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        background: isDark ? 'var(--negro)' : 'var(--blanco)',
                        color: isDark ? 'var(--blanco)' : 'var(--negro)',
                        border: `1px solid ${promoError ? '#EF4444' : isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPromo(); }}
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                      style={{ fontFamily: 'DM Sans, sans-serif', background: 'var(--primario)' }}
                    >
                      Aplicar
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-xs mt-2" style={{ color: '#EF4444', fontFamily: 'DM Sans, sans-serif' }}>
                      {promoError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Delivery address ── */}
            <div
              className="rounded-2xl p-4"
              style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" style={{ color: 'var(--primario)' }} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                  Dirección de entrega
                </span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                  style={{
                    background: isDark ? 'var(--negro)' : 'var(--blanco)',
                    border: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                  }}
                >
                  <span className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                    {cartDireccionEntrega}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--primario)' }}>
                    Cambiar
                  </span>
                </button>

                <AnimatePresence>
                  {showAddressDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-2 rounded-xl"
                      style={{ background: isDark ? 'var(--negro)' : 'var(--blanco)', border: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}33` }}
                    >
                      {direccionesGuardadas.map((dir) => (
                        <button
                          key={dir.id}
                          onClick={() => {
                            setCartDireccionEntrega(dir.direccion);
                            setShowAddressDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors hover:opacity-80"
                          style={{
                            borderBottom: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}22`,
                          }}
                        >
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--primario)' }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                              {dir.etiqueta}
                            </p>
                            <p className="text-xs" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}>
                              {dir.direccion}
                            </p>
                          </div>
                          {cartDireccionEntrega === dir.direccion && (
                            <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'var(--primario)' }} />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Delivery schedule ── */}
            <div
              className="rounded-2xl p-4"
              style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" style={{ color: 'var(--primario)' }} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                  Entregar:
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCartScheduleMode('ahora')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    background: cartScheduleMode === 'ahora' ? 'var(--primario)' : isDark ? 'var(--negro)' : 'var(--blanco)',
                    color: cartScheduleMode === 'ahora' ? '#fff' : isDark ? 'var(--gris3)' : 'var(--gris2)',
                    border: `1px solid ${cartScheduleMode === 'ahora' ? 'var(--primario)' : isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                  }}
                >
                  <Zap className="w-4 h-4" />
                  Lo antes posible
                </button>
                <button
                  onClick={() => setCartScheduleMode('programar')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    background: cartScheduleMode === 'programar' ? 'var(--primario)' : isDark ? 'var(--negro)' : 'var(--blanco)',
                    color: cartScheduleMode === 'programar' ? '#fff' : isDark ? 'var(--gris3)' : 'var(--gris2)',
                    border: `1px solid ${cartScheduleMode === 'programar' ? 'var(--primario)' : isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Programar
                </button>
              </div>

              {cartScheduleMode === 'ahora' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: isDark ? 'var(--negro)' : 'var(--blanco)' }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: 'var(--primario)' }} />
                  <span className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                    ETA: <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--primario)' }}>25-35 min</span>
                  </span>
                </motion.div>
              )}

              {cartScheduleMode === 'programar' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex gap-2"
                >
                  <input
                    type="date"
                    value={cartScheduleDate ?? today}
                    min={today}
                    max={nextWeek}
                    onChange={(e) => setCartScheduleDate(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      background: isDark ? 'var(--negro)' : 'var(--blanco)',
                      color: isDark ? 'var(--blanco)' : 'var(--negro)',
                      border: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                    }}
                  />
                  <input
                    type="time"
                    value={cartScheduleTime ?? '12:00'}
                    onChange={(e) => setCartScheduleTime(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      background: isDark ? 'var(--negro)' : 'var(--blanco)',
                      color: isDark ? 'var(--blanco)' : 'var(--negro)',
                      border: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                    }}
                  />
                </motion.div>
              )}
            </div>

            {/* ── Instructions ── */}
            <div
              className="rounded-2xl p-4"
              style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
            >
              <span className="text-sm font-semibold block mb-3" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                Instrucciones para el repartidor
              </span>
              <textarea
                value={cartInstrucciones}
                onChange={(e) => setCartInstrucciones(e.target.value)}
                placeholder="Instrucciones para el repartidor (opcional)"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  background: isDark ? 'var(--negro)' : 'var(--blanco)',
                  color: isDark ? 'var(--blanco)' : 'var(--negro)',
                  border: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                }}
              />
            </div>

            {/* ── Cost summary ── */}
            <div
              className="rounded-2xl p-4"
              style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}>
                    Productos ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </span>
                  <span className="text-sm font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                    {formatCordobas(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}>
                    Envío
                  </span>
                  <span className="text-sm font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                    {formatCordobas(costoEnvio)}
                  </span>
                </div>
                {cartDescuento > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: '#22C55E' }}>
                      Descuento
                    </span>
                    <span className="text-sm font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#22C55E' }}>
                      -{formatCordobas(cartDescuento)}
                    </span>
                  </div>
                )}
              </div>

              <div className="my-3" style={{ borderTop: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}33` }} />

              <div className="flex items-center justify-between">
                <span className="text-[28px] font-bold" style={{ fontFamily: 'Syne, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                  TOTAL
                </span>
                <span className="text-[28px] font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--primario)' }}>
                  {formatCordobas(total)}
                </span>
              </div>
            </div>

            {/* ── Payment method ── */}
            <div
              className="rounded-2xl p-4"
              style={{ background: isDark ? 'var(--grisOscuro)' : 'var(--grisClaro)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4" style={{ color: 'var(--primario)' }} />
                <span className="text-sm font-semibold" style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}>
                  Método de pago
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCartMetodoPago('efectivo')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    background: cartMetodoPago === 'efectivo' ? 'var(--primario)' : isDark ? 'var(--negro)' : 'var(--blanco)',
                    color: cartMetodoPago === 'efectivo' ? '#fff' : isDark ? 'var(--gris3)' : 'var(--gris2)',
                    border: `1px solid ${cartMetodoPago === 'efectivo' ? 'var(--primario)' : isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                  }}
                >
                  <Banknote className="w-4 h-4" />
                  Efectivo
                </button>
                <button
                  onClick={() => setCartMetodoPago('transferencia')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    background: cartMetodoPago === 'transferencia' ? 'var(--primario)' : isDark ? 'var(--negro)' : 'var(--blanco)',
                    color: cartMetodoPago === 'transferencia' ? '#fff' : isDark ? 'var(--gris3)' : 'var(--gris2)',
                    border: `1px solid ${cartMetodoPago === 'transferencia' ? 'var(--primario)' : isDark ? 'var(--gris3)' : 'var(--gris2)'}44`,
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  Transferencia
                </button>
              </div>
            </div>

            {/* Bottom spacer for button */}
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ── "Hacer pedido" button (fixed bottom) ── */}
      {!isEmpty && (
        <div
          className="px-5 py-4"
          style={{
            borderTop: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}22`,
            background: isDark ? 'var(--negro)' : 'var(--blanco)',
          }}
        >
          <button
            onClick={handleConfirmPurchase}
            disabled={isConfirming}
            className="w-full py-[18px] rounded-[14px] text-white font-bold text-[17px] transition-transform active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: 'Syne, sans-serif', background: 'var(--primario)' }}
          >
            {isConfirming ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Procesando...
              </>
            ) : (
              <>
                Hacer pedido · {formatCordobas(total)}
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   CART ITEM ROW SUBCOMPONENT
   ═══════════════════════════════════════════════ */

interface CartItemRowProps {
  item: CartItem;
  isDark: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

function CartItemRow({ item, isDark, onIncrease, onDecrease, onRemove }: CartItemRowProps) {
  const lineTotal = item.precioUnitario * item.cantidad;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3"
    >
      {/* Image placeholder */}
      <div
        className="w-14 h-14 rounded-[10px] flex-shrink-0"
        style={{ background: item.imagenColor }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}
        >
          {item.nombreProducto}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ fontFamily: 'DM Sans, sans-serif', color: isDark ? 'var(--gris3)' : 'var(--gris2)' }}
        >
          {formatCordobas(item.precioUnitario)} c/u
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={onDecrease}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: isDark ? 'var(--negro)' : 'var(--blanco)', border: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}55` }}
          >
            <Minus className="w-3 h-3" style={{ color: isDark ? 'var(--blanco)' : 'var(--negro)' }} />
          </button>
          <span
            className="text-sm font-semibold w-6 text-center"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}
          >
            {item.cantidad}
          </span>
          <button
            onClick={onIncrease}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: isDark ? 'var(--negro)' : 'var(--blanco)', border: `1px solid ${isDark ? 'var(--gris3)' : 'var(--gris2)'}55` }}
          >
            <Plus className="w-3 h-3" style={{ color: isDark ? 'var(--blanco)' : 'var(--negro)' }} />
          </button>
        </div>
      </div>

      {/* Price & trash */}
      <div className="flex flex-col items-end gap-2">
        <span
          className="text-sm font-bold"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: isDark ? 'var(--blanco)' : 'var(--negro)' }}
        >
          {formatCordobas(lineTotal)}
        </span>
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: '#EF444415' }}
        >
          <Trash2 className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
        </button>
      </div>
    </motion.div>
  );
}
