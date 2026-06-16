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
    <div className={`pago-exitoso min-h-screen flex items-center justify-center p-5 bg-[#FAF8F5] dark:bg-[#0A0A0F] transition-opacity duration-500 ease ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="pago-exitoso-content flex flex-col items-center text-center max-w-[360px] w-full">
        {/* Checkmark animado */}
        <div className="pago-exitoso-icon w-[88px] h-[88px] rounded-full bg-[#00C853] flex items-center justify-center mb-6 animate-[scaleIn_0.5s_cubic-bezier(0.16,1,0.3,1)]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" className="check-path" />
          </svg>
        </div>

        <h2 className="pago-exitoso-title text-3xl font-bold text-[#1B1B2F] dark:text-[#F0EDE8] mb-2 font-sans">Pago exitoso</h2>
        <p className="pago-exitoso-desc text-sm text-[#8E8EA0] dark:text-[#A8A8BE] leading-relaxed mb-7">
          Tu pedido está siendo preparado. Te notificaremos cuando esté en camino.
        </p>

        {/* Info del pedido */}
        <div className="pago-exitoso-card w-full bg-[#F5F0EB] dark:bg-[#1A1A24] rounded-2xl p-4 mb-7 flex flex-col gap-2">
          <div className="pago-exitoso-row flex justify-between py-2 text-sm text-[#5A5A72] dark:text-[#A8A8BE] border-b border-[#E8E4DE] dark:border-[#2A2A38] last:border-b-0">
            <span>Número de pedido</span>
            <span className="font-mono font-bold text-[#1B1B2F] dark:text-[#F0EDE8]">#{orderNum}</span>
          </div>
          <div className="pago-exitoso-row flex justify-between py-2 text-sm text-[#5A5A72] dark:text-[#A8A8BE] border-b border-[#E8E4DE] dark:border-[#2A2A38] last:border-b-0">
            <span>Tiempo estimado</span>
            <span className="font-mono text-[#1B1B2F] dark:text-[#F0EDE8]">30-45 min</span>
          </div>
          <div className="pago-exitoso-row flex justify-between py-2 text-sm text-[#5A5A72] dark:text-[#A8A8BE] border-b border-[#E8E4DE] dark:border-[#2A2A38] last:border-b-0">
            <span>Método de pago</span>
            <span className="text-[#1B1B2F] dark:text-[#F0EDE8]">Efectivo</span>
          </div>
        </div>

        <div className="pago-exitoso-acciones w-full flex flex-col gap-2.5">
          <button
            className="w-full min-h-[48px] py-3.5 px-6 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-xl font-semibold text-sm transition-all text-center flex items-center justify-center cursor-pointer active:scale-98"
            onClick={() => {
              setClientActiveModule('pedidos');
              onClose();
            }}
          >
            Ver mis pedidos
          </button>
          <button
            className="w-full min-h-[48px] py-3.5 px-6 border border-[#E8E4DE] dark:border-[#2A2A38] text-[#1B1B2F] dark:text-[#F0EDE8] hover:bg-[#F5F0EB] dark:hover:bg-[#1A1A24] rounded-xl font-semibold text-sm transition-all text-center flex items-center justify-center cursor-pointer active:scale-98"
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
