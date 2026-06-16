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

  const { validateCodigoPromo } = useStore();
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
    reproducirSiActivo('orden_aceptada', {
      sonidoActivo: config.sonidoActivo,
      volumenSonido: config.volumenSonido,
      notificacionesSonido: config.notificacionesSonido
    });
    vibrarSiActivo(50, config.vibracionActiva);
    confirmarCompra();
  };

  const handleCloseSuccess = () => {
    useMarketplaceStore.setState({ compraConfirmada: false, compraConfirmadaId: '' });
    onClose();
  };

  if (compraConfirmada) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white dark:bg-black overflow-y-auto">
        <PagoExitoso orderId={compraConfirmadaId} onClose={handleCloseSuccess} />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pantalla cliente-pantalla">
        <div className="pantalla-header">
          <h1 className="pantalla-title">Carrito</h1>
        </div>
        <div className="lf-empty flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
          <div className="lf-empty-icon mb-4 text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <div className="lf-empty-title text-xl font-bold mb-2">Tu carrito está vacío</div>
          <div className="lf-empty-desc text-sm text-gray-500 mb-6">
            Explora tiendas y agrega los productos que te gusten
          </div>
          <button
            className="lf-btn lf-btn-primary"
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
    <div className="pantalla cliente-pantalla fixed inset-0 z-50 flex flex-col bg-white dark:bg-black">
      {/* Header */}
      <div className="pantalla-header">
        <button className="header-back" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="pantalla-title">Carrito</h1>
        <span className="carrito-count">{cartItems.length} items</span>
      </div>

      {/* Contenido scrolleable */}
      <div className="carrito-scroll flex-1 overflow-y-auto">
        {/* Items agrupados por tienda */}
        {grupos.map((grupo) => (
          <div key={grupo.tiendaId} className="carrito-grupo">
            {/* Header de la tienda */}
            <div className="carrito-tienda-header">
              <div
                className="carrito-tienda-logo"
                style={{ background: grupo.tiendaLogoColor }}
              >
                {grupo.tiendaLogoIniciales}
              </div>
              <div className="carrito-tienda-info">
                <div className="carrito-tienda-nombre">{grupo.tiendaNombre}</div>
                <div className="carrito-tienda-tiempo">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  25-35 min
                </div>
              </div>
            </div>

            {/* Items de esta tienda */}
            <div className="carrito-items">
              {grupo.items.map((item) => (
                <div key={item.id} className="carrito-item">
                  {/* Imagen / placeholder del producto */}
                  <div
                    className="carrito-item-img"
                    style={{ background: item.imagenColor || '#F2EDE8' }}
                  >
                    {item.nombreProducto.charAt(0)}
                  </div>

                  <div className="carrito-item-info">
                    <div className="carrito-item-nombre">{item.nombreProducto}</div>
                    {item.notas && (
                      <div className="carrito-item-opciones">
                        {item.notas}
                      </div>
                    )}
                    <div className="carrito-item-precio mono">
                      C$ {item.precioUnitario}
                    </div>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="carrito-item-cantidad">
                    <button
                      className="cantidad-btn"
                      onClick={() => updateCartItemQty(item.id, item.cantidad - 1)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <span className="cantidad-num mono">{item.cantidad}</span>
                    <button
                      className="cantidad-btn"
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
        <div className="carrito-seccion">
          <div className="carrito-seccion-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Instrucciones especiales
          </div>
          <textarea
            className="lf-textarea w-full p-3 border rounded-xl"
            value={cartInstrucciones}
            onChange={e => setCartInstrucciones(e.target.value)}
            placeholder="Ej: No tocar el timbre, dejar en recepción..."
            rows={2}
          />
        </div>

        {/* Código promocional */}
        <div className="carrito-seccion">
          <button
            className="carrito-codigo-btn"
            onClick={() => setMostrarCodigo(!mostrarCodigo)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            {cartCodigoPromo
              ? `Código: ${cartCodigoPromo}`
              : 'Tengo un código promocional'}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="ml-auto"
              style={{ transform: mostrarCodigo ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {mostrarCodigo && (
            <div className="carrito-codigo-input-area">
              <input
                className="lf-input p-2 border rounded-xl flex-1"
                value={codigoPromo}
                onChange={e => setCodigoPromo(e.target.value)}
                placeholder="Ingresa tu código"
                style={{ textTransform: 'uppercase' }}
              />
              <button
                className="lf-btn lf-btn-primary lf-btn-sm"
                onClick={handleAplicarCodigo}
                disabled={!codigoPromo.trim()}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {/* Método de pago */}
        <div className="carrito-seccion">
          <div className="carrito-seccion-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Método de pago
          </div>
          <div className="carrito-pago-opciones">
            <button
              className={`carrito-pago-btn ${cartMetodoPago === 'efectivo' ? 'active' : ''}`}
              onClick={() => setCartMetodoPago('efectivo')}
            >
              <div className="carrito-pago-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="carrito-pago-info">
                <div className="carrito-pago-label">Efectivo</div>
                <div className="carrito-pago-desc">Pagar al recibir</div>
              </div>
              <div className={`carrito-pago-radio ${cartMetodoPago === 'efectivo' ? 'selected' : ''}`} />
            </button>

            <button
              className={`carrito-pago-btn ${cartMetodoPago === 'transferencia' ? 'active' : ''}`}
              onClick={() => setCartMetodoPago('transferencia')}
            >
              <div className="carrito-pago-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <div className="carrito-pago-info">
                <div className="carrito-pago-label">Transferencia</div>
                <div className="carrito-pago-desc">Transferencia bancaria</div>
              </div>
              <div className={`carrito-pago-radio ${cartMetodoPago === 'transferencia' ? 'selected' : ''}`} />
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="carrito-resumen">
          <div className="carrito-resumen-row">
            <span>Subtotal</span>
            <span className="mono">C$ {subtotal.toLocaleString()}</span>
          </div>
          <div className="carrito-resumen-row">
            <span>Delivery</span>
            <span className="mono">C$ {delivery.toLocaleString()}</span>
          </div>
          {descuento > 0 && (
            <div className="carrito-resumen-row descuento">
              <span>Descuento</span>
              <span className="mono">-C$ {descuento.toLocaleString()}</span>
            </div>
          )}
          <div className="carrito-resumen-divider" />
          <div className="carrito-resumen-row total">
            <span>Total</span>
            <span className="mono">C$ {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Espacio para el botón fijo */}
        <div style={{ height: 100 }} />
      </div>

      {/* Botón de pago fijo abajo */}
      <div className="carrito-footer">
        <button
          className="carrito-pagar-btn"
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
