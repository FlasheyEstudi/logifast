'use client';

import React from 'react';
import { ChevronLeft } from '@/components/icons';
import MisFacturas from './MisFacturas';

interface FacturaViewProps {
  onClose: () => void;
}

/** Vista de factura dentro del shell del cliente (sin recargar la página). */
export default function FacturaView({ onClose }: FacturaViewProps) {
  return (
    <div className="w-full min-h-full flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <button onClick={onClose} aria-label="Volver" className="w-11 h-11 rounded-full bg-[var(--bg-alt)] text-[var(--text)] flex items-center justify-center cursor-pointer shrink-0">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-syne text-base font-bold m-0">Mi Factura</h1>
      </div>
      <div className="w-full px-4 py-4" style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 40 }}>
        <MisFacturas />
      </div>
    </div>
  );
}
