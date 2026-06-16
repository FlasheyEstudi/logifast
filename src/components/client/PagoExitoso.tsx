'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useMarketplaceStore } from '@/lib/marketplace-store';

interface PagoExitosoProps {
  orderId: string;
  onClose: () => void;
}

export default function PagoExitoso({ orderId, onClose }: PagoExitosoProps) {
  const [visible, setVisible] = useState(false);
  const { setClientActiveModule } = useStore();

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const orderNum = orderId || `LF-${Math.floor(Math.random() * 9000) + 1000}`;

  return (
    <div className={`pago-exitoso ${visible ? 'visible' : ''}`}>
      <div className="pago-exitoso-content">
        {/* Checkmark animado */}
        <div className="pago-exitoso-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="check-path" />
          </svg>
        </div>

        <h2 className="pago-exitoso-title">Pago exitoso</h2>
        <p className="pago-exitoso-desc">
          Tu pedido está siendo preparado. Te notificaremos cuando esté en camino.
        </p>

        {/* Info del pedido */}
        <div className="pago-exitoso-card">
          <div className="pago-exitoso-row">
            <span>Número de pedido</span>
            <span className="mono bold">#{orderNum}</span>
          </div>
          <div className="pago-exitoso-row">
            <span>Tiempo estimado</span>
            <span className="mono">30-45 min</span>
          </div>
          <div className="pago-exitoso-row">
            <span>Método de pago</span>
            <span>Efectivo</span>
          </div>
        </div>

        <div className="pago-exitoso-acciones">
          <button
            className="lf-btn lf-btn-primary lf-btn-block"
            onClick={() => {
              setClientActiveModule('pedidos');
              onClose();
            }}
          >
            Ver mis pedidos
          </button>
          <button
            className="lf-btn lf-btn-ghost lf-btn-block"
            onClick={() => {
              setClientActiveModule('inicio');
              onClose();
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
