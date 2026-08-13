// components/ui/MapPins.tsx
'use client';

import React from 'react';
import { Home, Package, MapPin, Store, Bike, Navigation } from 'lucide-react';

/* ═══════════════════════════════════════════════
   1. PIN: MI UBICACIÓN ACTUAL (Apple-style Pulse Beacon)
   ═══════════════════════════════════════════════ */
export function PinMiUbicacion({ label = 'Mi ubicación' }: { label?: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      {/* Soft halo pulse */}
      <span
        style={{
          position: 'absolute',
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(0, 122, 255, 0.25)',
          top: -3,
          left: -3,
          animation: 'lf-beacon-pulse 2.2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite',
          pointerEvents: 'none',
        }}
      />
      {/* Outer beacon ring */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
          border: '3px solid #FFFFFF',
          boxShadow: '0 4px 14px rgba(0, 122, 255, 0.45), 0 1px 3px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
      {label && (
        <span
          style={{
            marginTop: 4,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 3,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   2. PIN: CASA / HOGAR
   ═══════════════════════════════════════════════ */
export function PinCasa({ label = 'Casa' }: { label?: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
          border: '3px solid #FFFFFF',
          boxShadow: '0 6px 18px rgba(139, 92, 246, 0.45), 0 2px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          zIndex: 2,
        }}
      >
        <Home size={18} strokeWidth={2.4} />
      </div>
      {/* Pin needle shadow tip */}
      <div
        style={{
          width: 6,
          height: 6,
          background: '#6D28D9',
          transform: 'rotate(45deg)',
          marginTop: -3,
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          zIndex: 1,
        }}
      />
      {label && (
        <span
          style={{
            marginTop: 3,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   3. PIN: RETIRO / RECOGIDA / ORIGEN
   ═══════════════════════════════════════════════ */
export function PinRecogida({ label = 'Punto de recogida' }: { label?: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          border: '3px solid #FFFFFF',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45), 0 2px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          zIndex: 2,
        }}
      >
        <Package size={20} strokeWidth={2.4} />
      </div>
      <div
        style={{
          width: 7,
          height: 7,
          background: '#059669',
          transform: 'rotate(45deg)',
          marginTop: -3.5,
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          zIndex: 1,
        }}
      />
      {label && (
        <span
          style={{
            marginTop: 3,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   4. PIN: ENTREGA / DESTINO FINAL
   ═══════════════════════════════════════════════ */
export function PinEntrega({ label = 'Punto de entrega' }: { label?: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
          border: '3px solid #FFFFFF',
          boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45), 0 2px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          zIndex: 2,
        }}
      >
        <MapPin size={21} strokeWidth={2.4} />
      </div>
      <div
        style={{
          width: 7,
          height: 7,
          background: '#B91C1C',
          transform: 'rotate(45deg)',
          marginTop: -3.5,
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          zIndex: 1,
        }}
      />
      {label && (
        <span
          style={{
            marginTop: 3,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   5. PIN: TIENDA / COMERCIO
   ═══════════════════════════════════════════════ */
export function PinTienda({
  nombre,
  logoColor = '#007AFF',
  fotoUrl,
}: {
  nombre: string;
  logoColor?: string;
  fotoUrl?: string | null;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: logoColor || '#007AFF',
          border: '3px solid #FFFFFF',
          boxShadow: '0 6px 18px rgba(0, 122, 255, 0.4), 0 2px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        {fotoUrl ? (
          <img src={fotoUrl} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Store size={18} strokeWidth={2.4} />
        )}
      </div>
      <div
        style={{
          width: 6,
          height: 6,
          background: logoColor || '#007AFF',
          transform: 'rotate(45deg)',
          marginTop: -3,
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          zIndex: 1,
        }}
      />
      {nombre && (
        <span
          style={{
            marginTop: 3,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {nombre}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   6. PIN: REPARTIDOR / MOTO EN VIVO
   ═══════════════════════════════════════════════ */
export function PinRepartidorMoto({
  bearing = 0,
  isMoving = false,
  label,
}: {
  bearing?: number;
  isMoving?: boolean;
  label?: string;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      {/* Soft continuous subtle breath aura (no giant scan rings) */}
      <span
        style={{
          position: 'absolute',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.22)',
          top: -2,
          left: -2,
          animation: 'lf-beacon-pulse 2.4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Main motorcycle badge */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          border: '3px solid #FFFFFF',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5), 0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          zIndex: 2,
          transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <Bike size={20} strokeWidth={2.4} />
      </div>

      {label && (
        <span
          style={{
            marginTop: 4,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 3,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
