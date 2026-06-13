'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Minus,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  Check,
  ChevronRight,
  Zap,
  Calendar,
  Tag,
} from 'lucide-react';
import { useMarketplaceStore, type CartItem } from '@/lib/marketplace-store';
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
  return `C$${n.toLocaleString('es-NI')}`;
}

/* ═══════════════════════════════════════════════
   ANIMATED CHECKMARK SVG (Spec §10)
   ═══════════════════════════════════════════════ */

function AnimatedCheckmark() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Circle drawn animation */}
      <motion.circle
        cx="48"
        cy="48"
        r="44"
        stroke="var(--exito)"
        strokeWidth="4"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* Fill background after circle drawn */}
      <motion.circle
        cx="48"
        cy="48"
        r="42"
        fill="var(--exito)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />
      {/* Check mark */}
      <motion.path
        d="M30 50 L43 63 L66 36"
        stroke="var(--exito)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   EMPTY STATE SVG (Spec §2)
   ═══════════════════════════════════════════════ */

function EmptyCartSVG() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.g
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Bag body */}
        <rect x="28" y="40" width="64" height="56" rx="10" stroke="var(--text-muted)" strokeWidth="2.5" fill="none" />
        {/* Bag handle */}
        <path d="M42 40 V32 C42 24 78 24 78 32 V40" stroke="var(--text-muted)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Subtle lines inside */}
        <line x1="44" y1="58" x2="76" y2="58" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="44" y1="68" x2="66" y2="68" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="44" y1="78" x2="70" y2="78" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
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
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showScheduleExpand, setShowScheduleExpand] = useState(false);
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
      setPromoError('Codigo no valido');
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
    await new Promise((r) => setTimeout(r, 800));
    confirmarCompra();
    const state = useMarketplaceStore.getState();
    setConfirmedOrderId(state.compraConfirmadaId);
    setIsConfirming(false);
  };

  /* ── Schedule helpers ── */
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  /* ═══════════════════════════════════════════════
     CONFIRMATION SCREEN (Spec §10)
     ═══════════════════════════════════════════════ */
  if (confirmedOrder) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'var(--bg)' }}
      >
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-lg mx-auto px-6 py-12 flex flex-col items-center text-center">
            {/* Animated checkmark SVG */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="mb-6"
            >
              <AnimatedCheckmark />
            </motion.div>

            {/* "Pedido confirmado" — Syne 28px bold verde */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 28, color: 'var(--exito)' }}
            >
              Pedido confirmado
            </motion.h2>

            {/* "Pedido #LF-CXXX" — mono muted */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}
            >
              Pedido #{confirmedOrder.id}
            </motion.p>

            {/* Tienda: logo + nombre */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-3 mt-6 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: confirmedOrder.tiendaColor, fontFamily: "'Syne', sans-serif" }}
              >
                {confirmedOrder.tiendaLogo || confirmedOrder.tiendaNombre.charAt(0)}
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                {confirmedOrder.tiendaNombre}
              </span>
            </motion.div>

            {/* ETA: "~30 minutos" — Syne 20px bold */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-2 mt-5 px-5 py-3 rounded-2xl"
              style={{ background: 'var(--primario-soft)' }}
            >
              <Clock size={20} style={{ color: 'var(--primario)' }} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--primario)' }}>
                ~30 minutos
              </span>
            </motion.div>

            {/* Botones */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="w-full mt-8 space-y-3"
            >
              <button
                onClick={onClose}
                className="w-full py-[18px] rounded-[18px] text-white font-bold text-[17px] transition-transform active:scale-[0.98]"
                style={{ fontFamily: "'Syne', sans-serif", background: 'var(--primario)', boxShadow: 'var(--lf-shadow-fab)' }}
              >
                Rastrear pedido
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 rounded-[18px] font-semibold text-[15px] transition-transform active:scale-[0.98]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
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
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* ── HEADER (56px) — Spec §1 ── */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: 56, borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-[0.95]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
          </button>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>
            Tu carrito
          </h1>
          {/* Badge de cantidad — pill pequena */}
          {!isEmpty && (
            <span
              className="flex items-center justify-center rounded-full min-w-[22px] h-[22px] px-1.5"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 12,
                background: 'var(--primario)',
                color: '#fff',
              }}
            >
              {itemCount}
            </span>
          )}
        </div>

        {!isEmpty && (
          <button
            onClick={clearCart}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', background: 'none' }}
            className="font-medium"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ── EMPTY STATE — Spec §2 ── */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <EmptyCartSVG />
          <p
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)', marginTop: 20 }}
          >
            Tu carrito esta vacio
          </p>
          <p
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}
          >
            Explora tiendas y agrega productos
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-8 py-3.5 rounded-2xl text-white font-semibold text-[15px] transition-transform active:scale-[0.97]"
            style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--primario)' }}
          >
            Explorar tiendas
          </button>
        </div>
      )}

      {/* ── WITH ITEMS ── */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

            {/* ── GRUPOS POR TIENDA — Spec §3 ── */}
            {tiendaIds.map((tid) => {
              const tienda = tiendas.find((t) => t.id === tid);
              const items = getCartItemsByTienda(tid);
              if (!tienda || items.length === 0) return null;

              return (
                <motion.div
                  key={tid}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden"
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--lf-card-radius)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--lf-shadow-card)',
                  }}
                >
                  {/* Tienda header: logo 28x28 + nombre 15px bold + "Ver tienda" link */}
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: tienda.logoColor, fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700 }}
                      >
                        {tienda.logoIniciales}
                      </div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                        {tienda.nombre}
                      </span>
                    </div>
                    <button
                      onClick={onBackToTienda}
                      className="flex items-center gap-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--primario)', fontWeight: 500 }}
                    >
                      Ver tienda <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Items: padding 14px 16px, border-bottom */}
                  <div>
                    <AnimatePresence mode="popLayout">
                      {items.map((item, idx) => (
                        <CartItemRow
                          key={item.id}
                          item={item}
                          isLast={idx === items.length - 1}
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

            {/* ── CODIGO PROMOCIONAL — Spec §4 ── */}
            <div
              className="px-4 py-4"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--lf-card-radius)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
              }}
            >
              {cartCodigoPromo ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--primario-soft)' }}
                    >
                      <Tag size={14} style={{ color: 'var(--primario)' }} />
                    </div>
                    <div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--exito)' }}>
                        Codigo {cartCodigoPromo} aplicado
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--exito)', marginLeft: 6 }}>
                        -{cartDescuento > subtotal * 0.3 ? formatCordobas(cartDescuento) : `${Math.round((cartDescuento / subtotal) * 100)}%`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--peligro)', background: 'none' }}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <>
                  {!showPromoInput ? (
                    <button
                      onClick={() => setShowPromoInput(true)}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)', background: 'none' }}
                      className="flex items-center gap-1.5"
                    >
                      <Tag size={15} />
                      Tienes un codigo?
                    </button>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag size={15} style={{ color: 'var(--primario)' }} />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          Codigo promocional
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); }}
                          placeholder="Ingresa tu codigo"
                          className="flex-1 px-3.5 py-2.5 rounded-2xl text-sm outline-none transition-colors"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            border: `1px solid ${promoError ? 'var(--peligro)' : 'var(--border)'}`,
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPromo(); }}
                          autoFocus
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-transform active:scale-[0.97]"
                          style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--primario)' }}
                        >
                          Aplicar
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-xs mt-2" style={{ color: 'var(--peligro)', fontFamily: "'DM Sans', sans-serif" }}>
                          {promoError}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── DIRECCION DE ENTREGA — Spec §5 ── */}
            <div
              className="px-4 py-4"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--lf-card-radius)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--primario-soft)' }}
                >
                  <MapPin size={18} style={{ color: 'var(--primario)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
                    Direccion de entrega
                  </p>
                  <p
                    className="truncate"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--text)' }}
                  >
                    {cartDireccionEntrega}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--primario)', background: 'none' }}
                >
                  Cambiar
                </button>
              </div>

              <AnimatePresence>
                {showAddressDropdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-3 rounded-2xl"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    {direccionesGuardadas.map((dir) => (
                      <button
                        key={dir.id}
                        onClick={() => {
                          setCartDireccionEntrega(dir.direccion);
                          setShowAddressDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <MapPin size={14} style={{ color: 'var(--primario)', flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                            {dir.etiqueta}
                          </p>
                          <p className="truncate" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>
                            {dir.direccion}
                          </p>
                        </div>
                        {cartDireccionEntrega === dir.direccion && (
                          <Check size={16} style={{ color: 'var(--primario)', flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── HORARIO — Spec §6 ── */}
            <div
              className="px-4 py-4"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--lf-card-radius)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
              }}
            >
              {/* "Lo antes posible" default con ETA */}
              {cartScheduleMode === 'ahora' && !showScheduleExpand && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--primario-soft)' }}
                    >
                      <Zap size={18} style={{ color: 'var(--primario)' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                        Lo antes posible
                      </p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--primario)' }}>
                        ETA: 25-35 min
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setCartScheduleMode('programar'); setShowScheduleExpand(true); }}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--primario)', background: 'none' }}
                  >
                    Programar
                  </button>
                </div>
              )}

              {/* "Programar" expandible */}
              {(cartScheduleMode === 'programar' || showScheduleExpand) && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--primario-soft)' }}
                      >
                        <Calendar size={18} style={{ color: 'var(--primario)' }} />
                      </div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                        Programar entrega
                      </span>
                    </div>
                    <button
                      onClick={() => { setCartScheduleMode('ahora'); setShowScheduleExpand(false); }}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--primario)', background: 'none' }}
                    >
                      Lo antes posible
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={cartScheduleDate ?? today}
                      min={today}
                      max={nextWeek}
                      onChange={(e) => setCartScheduleDate(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-2xl text-sm outline-none"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                      }}
                    />
                    <input
                      type="time"
                      value={cartScheduleTime ?? '12:00'}
                      onChange={(e) => setCartScheduleTime(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-2xl text-sm outline-none"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── RESUMEN DE COSTOS — Spec §7 ── */}
            <div
              className="px-5 py-5"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--lf-card-radius)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
              }}
            >
              {/* Filas: label muted izquierda + valor mono derecha */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>
                    Productos ({itemCount})
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                    {formatCordobas(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)' }}>
                    Envio
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                    {formatCordobas(costoEnvio)}
                  </span>
                </div>
                {cartDescuento > 0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--exito)' }}>
                      Descuento
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: 'var(--exito)' }}>
                      -{formatCordobas(cartDescuento)}
                    </span>
                  </div>
                )}
              </div>

              {/* Separador */}
              <div className="my-4" style={{ borderTop: '1px solid var(--border)' }} />

              {/* TOTAL: Syne 32px bold primario */}
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 32, color: 'var(--text)' }}>
                  TOTAL
                </span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 32, color: 'var(--primario)' }}>
                  {formatCordobas(total)}
                </span>
              </div>
            </div>

            {/* ── METODO DE PAGO — Spec §8 ── */}
            <div
              className="px-4 py-4"
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--lf-card-radius)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--lf-shadow-card)',
              }}
            >
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Metodo de pago
              </p>
              <div className="flex gap-3">
                {/* Efectivo */}
                <button
                  onClick={() => setCartMetodoPago('efectivo')}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: cartMetodoPago === 'efectivo' ? 'var(--primario-soft)' : 'var(--bg)',
                    color: cartMetodoPago === 'efectivo' ? 'var(--primario)' : 'var(--text-muted)',
                    border: cartMetodoPago === 'efectivo' ? '2px solid var(--primario)' : '1px solid var(--border)',
                  }}
                >
                  <Banknote size={20} />
                  <span style={{ fontWeight: 600 }}>Efectivo</span>
                </button>
                {/* Transferencia */}
                <button
                  onClick={() => setCartMetodoPago('transferencia')}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: cartMetodoPago === 'transferencia' ? 'var(--primario-soft)' : 'var(--bg)',
                    color: cartMetodoPago === 'transferencia' ? 'var(--primario)' : 'var(--text-muted)',
                    border: cartMetodoPago === 'transferencia' ? '2px solid var(--primario)' : '1px solid var(--border)',
                  }}
                >
                  <CreditCard size={20} />
                  <span style={{ fontWeight: 600 }}>Transferencia</span>
                </button>
              </div>
            </div>

            {/* Bottom spacer for sticky button + safe area */}
            <div style={{ height: 'calc(90px + var(--lf-safe-bottom))' }} />
          </div>
        </div>
      )}

      {/* ── BOTON "Hacer pedido" — Spec §9 ── */}
      {!isEmpty && (
        <div
          className="shrink-0 px-4 py-3"
          style={{
            background: 'var(--bg)',
            paddingBottom: 'calc(12px + var(--lf-safe-bottom))',
          }}
        >
          <button
            onClick={handleConfirmPurchase}
            disabled={isConfirming}
            className="w-full py-[18px] rounded-[18px] text-white font-bold text-[17px] transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: "'Syne', sans-serif", background: 'var(--primario)', boxShadow: 'var(--lf-shadow-fab)' }}
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
                Hacer pedido &middot; {formatCordobas(total)}
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   CART ITEM ROW SUBCOMPONENT — Spec §3
   ═══════════════════════════════════════════════ */

interface CartItemRowProps {
  item: CartItem;
  isLast: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

function CartItemRow({ item, isLast, onIncrease, onDecrease, onRemove }: CartItemRowProps) {
  const lineTotal = item.precioUnitario * item.cantidad;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3"
      style={{
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* Imagen 52x52 border-radius 12px */}
      <div
        className="w-[52px] h-[52px] rounded-xl flex-shrink-0"
        style={{ background: item.imagenColor }}
      />

      {/* Info: nombre + precio unitario */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text)' }}
        >
          {item.nombreProducto}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {formatCordobas(item.precioUnitario)} c/u
        </p>
      </div>

      {/* Controles cantidad + precio total */}
      <div className="flex flex-col items-end gap-2">
        {/* Precio total */}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {formatCordobas(lineTotal)}
        </span>

        {/* Controles [-] [cantidad] [+] — circulo borders, cantidad JetBrains Mono 15px bold */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDecrease}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-[0.9]"
            style={{ border: '1.5px solid var(--border)', background: 'var(--surface)' }}
          >
            <Minus size={14} style={{ color: 'var(--text)' }} />
          </button>
          <span
            className="w-7 text-center"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 15, color: 'var(--text)' }}
          >
            {item.cantidad}
          </span>
          <button
            onClick={onIncrease}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-[0.9]"
            style={{ border: '1.5px solid var(--primario)', background: 'var(--primario-soft)' }}
          >
            <Plus size={14} style={{ color: 'var(--primario)' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
