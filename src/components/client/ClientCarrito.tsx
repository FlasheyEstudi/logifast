'use client';

import React, { useState } from 'react';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { useStore } from '@/lib/store';
import { useConfigStore } from '@/store/configStore';
import { reproducirSiActivo, vibrarSiActivo } from '@/services/audio';
import PagoExitoso from './PagoExitoso';

interface ClientCarritoProps {
  isDark: boolean;
  onClose: () => void;
  onBackToTienda: () => void;
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
    confirmarCompra,
    getCartSubtotal,
    getCartTotal,
    getCartItemCount,
    getCartTiendas,
    getCartItemsByTienda,
  } = useMarketplaceStore();

  const { validateCodigoPromo, setClientActiveModule } = useStore();
  const config = useConfigStore();

  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [codigoPromo, setCodigoPromo] = useState('');

  const subtotal = getCartSubtotal();
  const tiendaIds = getCartTiendas();
  const delivery = tiendaIds.reduce((sum, tid) => {
    const t = tiendas.find((ti) => ti.id === tid);
    return sum + (t?.costoEnvio ?? 20);
  }, 0);
  const descuento = cartDescuento || 0;
  const total = subtotal + delivery - descuento;

  const handleAplicarCodigo = () => {
    if (codigoPromo.trim()) {
      const result = validateCodigoPromo(codigoPromo.trim());
      if (result.valid) {
        const discountAmount = result.tipo === 'porcentaje'
          ? Math.round(subtotal * (result.descuento / 100))
          : result.descuento;
        setCartCodigoPromo(codigoPromo.trim().toUpperCase());
        setCartDescuento(discountAmount);
        reproducirSiActivo('exito', {
          sonidoActivo: config.sonidoActivo,
          volumenSonido: config.volumenSonido,
          notificacionesSonido: config.notificacionesSonido
        });
        setMostrarCodigo(false);
      }
    }
  };

  const handlePagar = () => {
    try {
      reproducirSiActivo('orden_aceptada', {
        sonidoActivo: config.sonidoActivo,
        volumenSonido: config.volumenSonido,
        notificacionesSonido: config.notificacionesSonido
      });
      vibrarSiActivo(50, config.vibracionActiva);
      confirmarCompra();
    } catch (err) {
      console.error("Error inside handlePagar:", err);
      alert("Error al procesar el pago: " + (err as Error).message);
    }
  };

  const handleCloseSuccess = () => {
    useMarketplaceStore.setState({ compraConfirmada: false, compraConfirmadaId: '' });
    onClose();
  };

  if (compraConfirmada) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white dark:bg-black overflow-y-auto">
        <PagoExitoso orderId={compraConfirmadaId} onClose={handleCloseSuccess} setClientActiveModule={setClientActiveModule} />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pantalla cliente-pantalla fixed inset-0 z-50 flex flex-col bg-[#FAF8F5] dark:bg-[#0A0A0F] text-[#1B1B2F] dark:text-[#F0EDE8] font-sans">
        <div className="pantalla-header flex items-center gap-3 px-5 py-4 border-b border-[#E8E4DE] dark:border-[#2A2A38] bg-[#FAF8F5] dark:bg-[#0A0A0F] z-20">
          <button className="header-back w-9 h-9 rounded-xl border-none bg-transparent hover:bg-[#F5F0EB] dark:hover:bg-[#1A1A24] text-[#1B1B2F] dark:text-[#F0EDE8] flex items-center justify-center cursor-pointer shrink-0 transition-colors" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="pantalla-title font-bold text-xl text-[#1B1B2F] dark:text-[#F0EDE8] flex-1">Carrito</h1>
        </div>
        <div className="lf-empty flex flex-col items-center justify-center p-8 text-center min-h-[60vh] gap-4">
          <div className="lf-empty-icon mb-4 text-[#8E8EA0] dark:text-[#6B6B80] w-16 h-16 flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <div className="lf-empty-title text-xl font-bold text-[#1B1B2F] dark:text-[#F0EDE8]">Tu carrito está vacío</div>
          <div className="lf-empty-desc text-sm text-[#8E8EA0] dark:text-[#6B6B80] max-w-[280px]">
            Explora tiendas y agrega los productos que te gusten
          </div>
          <button
            className="w-full max-w-[240px] min-h-[48px] mt-4 py-3 px-6 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-2xl font-bold text-sm transition-all text-center flex items-center justify-center cursor-pointer active:scale-95"
            onClick={onClose}
          >
            Explorar tiendas
          </button>
        </div>
      </div>
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
    <div className="pantalla cliente-pantalla fixed inset-0 z-50 flex flex-col bg-[#FAF8F5] dark:bg-[#0A0A0F] text-[#1B1B2F] dark:text-[#F0EDE8] font-sans">
      {/* Header */}
      <div className="pantalla-header flex items-center gap-3 px-5 py-4 border-b border-[#E8E4DE] dark:border-[#2A2A38] bg-[#FAF8F5] dark:bg-[#0A0A0F] z-20">
        <button className="header-back w-9 h-9 rounded-xl border-none bg-transparent hover:bg-[#F5F0EB] dark:hover:bg-[#1A1A24] text-[#1B1B2F] dark:text-[#F0EDE8] flex items-center justify-center cursor-pointer shrink-0 transition-colors" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="pantalla-title font-bold text-xl text-[#1B1B2F] dark:text-[#F0EDE8] flex-1">Carrito</h1>
        <span className="carrito-count text-xs font-semibold px-3 py-1 bg-[#F5F0EB] dark:bg-[#1A1A24] text-[#8E8EA0] dark:text-[#A8A8BE] rounded-full">{cartItems.length} items</span>
      </div>

      {/* Contenido scrolleable */}
      <div className="carrito-scroll flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
        {/* Items agrupados por tienda */}
        {grupos.map((grupo) => (
          <div key={grupo.tiendaId} className="carrito-grupo flex flex-col gap-4 border-b border-[#E8E4DE] dark:border-[#2A2A38] pb-6 last:border-b-0">
            {/* Header de la tienda */}
            <div className="carrito-tienda-header flex items-center gap-3">
              <div
                className="carrito-tienda-logo w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                style={{ background: grupo.tiendaLogoColor }}
              >
                {grupo.tiendaLogoIniciales}
              </div>
              <div className="carrito-tienda-info flex flex-col">
                <div className="carrito-tienda-nombre font-bold text-sm text-[#1B1B2F] dark:text-[#F0EDE8]">{grupo.tiendaNombre}</div>
                <div className="carrito-tienda-tiempo flex items-center gap-1 text-xs text-[#8E8EA0] dark:text-[#A8A8BE] mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  25-35 min
                </div>
              </div>
            </div>

            {/* Items de esta tienda */}
            <div className="carrito-items flex flex-col gap-3">
              {grupo.items.map((item) => (
                <div key={item.id} className="carrito-item flex items-center gap-3 p-3 bg-[#F5F0EB] dark:bg-[#1A1A24] rounded-2xl">
                  {/* Imagen / placeholder del producto */}
                  <div
                    className="carrito-item-img w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-black/20 dark:text-white/20 shrink-0"
                    style={{ background: item.imagenColor || '#F2EDE8' }}
                  >
                    {item.nombreProducto.charAt(0)}
                  </div>

                  <div className="carrito-item-info flex-1 min-w-0">
                    <div className="carrito-item-nombre text-sm font-semibold text-[#1B1B2F] dark:text-[#F0EDE8] truncate">{item.nombreProducto}</div>
                    {item.notas && (
                      <div className="carrito-item-opciones text-xs text-[#8E8EA0] dark:text-[#A8A8BE] truncate mt-0.5">
                        {item.notas}
                      </div>
                    )}
                    <div className="carrito-item-precio text-sm font-bold text-[#1B1B2F] dark:text-[#F0EDE8] mt-1 font-mono">
                      C$ {item.precioUnitario}
                    </div>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="carrito-item-cantidad flex items-center gap-2 shrink-0">
                    <button
                      className="cantidad-btn w-8 h-8 rounded-lg border border-[#E8E4DE] dark:border-[#2A2A38] bg-white dark:bg-[#1A1A24] text-[#1B1B2F] dark:text-[#F0EDE8] flex items-center justify-center cursor-pointer transition-all hover:border-[#FF5722] hover:text-[#FF5722] active:scale-95"
                      onClick={() => updateCartItemQty(item.id, item.cantidad - 1)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <span className="cantidad-num text-sm font-semibold min-w-5 text-center text-[#1B1B2F] dark:text-[#F0EDE8] font-mono">{item.cantidad}</span>
                    <button
                      className="cantidad-btn w-8 h-8 rounded-lg border border-[#E8E4DE] dark:border-[#2A2A38] bg-white dark:bg-[#1A1A24] text-[#1B1B2F] dark:text-[#F0EDE8] flex items-center justify-center cursor-pointer transition-all hover:border-[#FF5722] hover:text-[#FF5722] active:scale-95"
                      onClick={() => updateCartItemQty(item.id, item.cantidad + 1)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Instrucciones especiales */}
        <div className="carrito-seccion flex flex-col gap-3 border-b border-[#E8E4DE] dark:border-[#2A2A38] pb-6 last:border-b-0">
          <div className="carrito-seccion-title flex items-center gap-2.5 text-sm font-bold text-[#1B1B2F] dark:text-[#F0EDE8]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Instrucciones especiales
          </div>
          <textarea
            className="lf-textarea w-full p-3 border border-[#E8E4DE] dark:border-[#2A2A38] bg-white dark:bg-[#1A1A24] text-[#1B1B2F] dark:text-[#F0EDE8] rounded-xl outline-none focus:border-[#FF5722] transition-colors resize-none"
            value={cartInstrucciones}
            onChange={e => setCartInstrucciones(e.target.value)}
            placeholder="Ej: No tocar el timbre, dejar en recepción..."
            rows={2}
          />
        </div>

        {/* Código promocional */}
        <div className="carrito-seccion flex flex-col gap-3 border-b border-[#E8E4DE] dark:border-[#2A2A38] pb-6 last:border-b-0">
          <button
            className="carrito-codigo-btn flex items-center gap-2.5 w-full p-3.5 bg-[#F5F0EB] dark:bg-[#1A1A24] border border-transparent hover:border-[#E8E4DE] dark:hover:border-[#2A2A38] rounded-xl text-sm font-medium text-[#1B1B2F] dark:text-[#F0EDE8] cursor-pointer transition-all"
            onClick={() => setMostrarCodigo(!mostrarCodigo)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            <span>
              {cartCodigoPromo
                ? `Código: ${cartCodigoPromo}`
                : 'Tengo un código promocional'}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="ml-auto transition-transform duration-200"
              style={{ transform: mostrarCodigo ? 'rotate(180deg)' : 'none' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {mostrarCodigo && (
            <div className="carrito-codigo-input-area flex gap-2.5 mt-2 animate-[slideDown_0.2s_ease]">
              <input
                className="lf-input flex-1 p-3 border border-[#E8E4DE] dark:border-[#2A2A38] bg-white dark:bg-[#1A1A24] text-[#1B1B2F] dark:text-[#F0EDE8] rounded-xl outline-none"
                value={codigoPromo}
                onChange={e => setCodigoPromo(e.target.value)}
                placeholder="Ingresa tu código"
                style={{ textTransform: 'uppercase' }}
              />
              <button
                className="px-5 py-3 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer"
                onClick={handleAplicarCodigo}
                disabled={!codigoPromo.trim()}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {/* Método de pago */}
        <div className="carrito-seccion flex flex-col gap-3 border-b border-[#E8E4DE] dark:border-[#2A2A38] pb-6 last:border-b-0">
          <div className="carrito-seccion-title flex items-center gap-2.5 text-sm font-bold text-[#1B1B2F] dark:text-[#F0EDE8]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Método de pago
          </div>
          <div className="carrito-pago-opciones flex flex-col gap-2.5">
            <button
              className={`carrito-pago-btn flex items-center gap-3.5 p-4 bg-white dark:bg-[#1A1A24] border border-[#E8E4DE] dark:border-[#2A2A38] hover:border-[#FF5722] rounded-2xl cursor-pointer transition-all w-full text-left ${cartMetodoPago === 'efectivo' ? 'border-[#FF5722] bg-[#FF5722]/5 dark:bg-[#FF6E40]/10' : ''}`}
              onClick={() => setCartMetodoPago('efectivo')}
            >
              <div className={`carrito-pago-icon w-11 h-11 rounded-xl bg-[#F5F0EB] dark:bg-[#22222E] flex items-center justify-center text-[#5A5A72] dark:text-[#A8A8BE] shrink-0 ${cartMetodoPago === 'efectivo' ? 'bg-[#FF5722]/10 dark:bg-[#FF6E40]/20 text-[#FF5722] dark:text-[#FF6E40]' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="carrito-pago-info flex-1">
                <div className="carrito-pago-label font-semibold text-sm text-[#1B1B2F] dark:text-[#F0EDE8]">Efectivo</div>
                <div className="carrito-pago-desc text-xs text-[#8E8EA0] dark:text-[#A8A8BE] mt-0.5">Pagar al recibir</div>
              </div>
              <div className={`carrito-pago-radio w-[22px] h-[22px] rounded-full border-2 border-[#E8E4DE] dark:border-[#2A2A38] shrink-0 flex items-center justify-center transition-colors ${cartMetodoPago === 'efectivo' ? 'border-[#FF5722] after:content-[\'\'] after:w-2.5 after:h-2.5 after:rounded-full after:bg-[#FF5722]' : ''}`} />
            </button>

            <button
              className={`carrito-pago-btn flex items-center gap-3.5 p-4 bg-white dark:bg-[#1A1A24] border border-[#E8E4DE] dark:border-[#2A2A38] hover:border-[#FF5722] rounded-2xl cursor-pointer transition-all w-full text-left ${cartMetodoPago === 'transferencia' ? 'border-[#FF5722] bg-[#FF5722]/5 dark:bg-[#FF6E40]/10' : ''}`}
              onClick={() => setCartMetodoPago('transferencia')}
            >
              <div className={`carrito-pago-icon w-11 h-11 rounded-xl bg-[#F5F0EB] dark:bg-[#22222E] flex items-center justify-center text-[#5A5A72] dark:text-[#A8A8BE] shrink-0 ${cartMetodoPago === 'transferencia' ? 'bg-[#FF5722]/10 dark:bg-[#FF6E40]/20 text-[#FF5722] dark:text-[#FF6E40]' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <div className="carrito-pago-info flex-1">
                <div className="carrito-pago-label font-semibold text-sm text-[#1B1B2F] dark:text-[#F0EDE8]">Transferencia</div>
                <div className="carrito-pago-desc text-xs text-[#8E8EA0] dark:text-[#A8A8BE] mt-0.5">Transferencia bancaria</div>
              </div>
              <div className={`carrito-pago-radio w-[22px] h-[22px] rounded-full border-2 border-[#E8E4DE] dark:border-[#2A2A38] shrink-0 flex items-center justify-center transition-colors ${cartMetodoPago === 'transferencia' ? 'border-[#FF5722] after:content-[\'\'] after:w-2.5 after:h-2.5 after:rounded-full after:bg-[#FF5722]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="carrito-resumen flex flex-col gap-2 py-4">
          <div className="carrito-resumen-row flex justify-between items-center text-sm text-[#5A5A72] dark:text-[#A8A8BE]">
            <span>Subtotal</span>
            <span className="mono font-semibold">C$ {subtotal.toLocaleString()}</span>
          </div>
          <div className="carrito-resumen-row flex justify-between items-center text-sm text-[#5A5A72] dark:text-[#A8A8BE]">
            <span>Delivery</span>
            <span className="mono font-semibold">C$ {delivery.toLocaleString()}</span>
          </div>
          {descuento > 0 && (
            <div className="carrito-resumen-row flex justify-between items-center text-sm text-[#00C853] dark:text-[#00C853] font-medium">
              <span>Descuento</span>
              <span className="mono">-C$ {descuento.toLocaleString()}</span>
            </div>
          )}
          <div className="carrito-resumen-row flex justify-between items-center text-lg font-bold text-[#1B1B2F] dark:text-[#F0EDE8] pt-3 border-t border-[#E8E4DE] dark:border-[#2A2A38] mt-2">
            <span>Total</span>
            <span className="mono text-xl text-[#FF5722]">C$ {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Espacio para el botón fijo */}
        <div style={{ height: 100 }} />
      </div>

      {/* Botón de pago fijo abajo */}
      <div className="carrito-footer p-4 pb-[80px] bg-gradient-to-t from-[#FAF8F5] dark:from-[#0A0A0F] to-transparent sticky bottom-0 z-10 mt-auto">
        <button
          className="carrito-pagar-btn w-full min-h-[56px] py-4 px-6 bg-[#FF5722] hover:bg-[#E64A19] text-white border-none rounded-2xl font-bold text-base cursor-pointer flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          onClick={handlePagar}
        >
          <span>Pagar C$ {total.toLocaleString()}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
