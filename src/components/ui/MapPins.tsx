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
   4. PIN: ENTREGA / DESTINO FINAL (High Clarity & Precision)
   ═══════════════════════════════════════════════ */
export function PinEntrega({ label = 'Punto de entrega' }: { label?: string }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
      }}
    >
      {/* Ground target ripple beacon (landing zone) */}
      <span
        style={{
          position: 'absolute',
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.22)',
          top: -4,
          left: -4,
          animation: 'lf-beacon-pulse 2.2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite',
          pointerEvents: 'none',
        }}
      />
      
      {/* Ground landing crosshair dot */}
      <div
        style={{
          position: 'absolute',
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.4)',
          border: '1.5px dashed rgba(255, 255, 255, 0.8)',
          bottom: 18,
          pointerEvents: 'none',
        }}
      />

      {/* Main destination pinhead */}
      <div
        style={{
          position: 'relative',
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF453A 0%, #D70015 60%, #990000 100%)',
          border: '3.5px solid #FFFFFF',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.55), 0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          zIndex: 2,
        }}
      >
        <MapPin size={22} strokeWidth={2.6} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
      </div>

      {/* Needle point */}
      <div
        style={{
          width: 8,
          height: 8,
          background: '#990000',
          borderRight: '1px solid rgba(255,255,255,0.4)',
          borderBottom: '1px solid rgba(255,255,255,0.4)',
          transform: 'rotate(45deg)',
          marginTop: -4,
          boxShadow: '0 3px 6px rgba(0,0,0,0.35)',
          zIndex: 1,
        }}
      />

      {/* High-contrast destination label badge */}
      {label && (
        <div
          style={{
            marginTop: 5,
            padding: '3px 10px',
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 69, 58, 0.45)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35), 0 0 10px rgba(255, 69, 58, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            zIndex: 3,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#FF453A',
              boxShadow: '0 0 8px #FF453A',
            }}
          />
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.4px',
              fontFamily: "'DM Sans', sans-serif",
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        </div>
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
   6. PIN: REPARTIDOR / MOTO EN VIVO (Bearing Direction & Smooth Motion)
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
  // Normalize bearing to 0-360 range
  const normalizedBearing = Math.round((bearing % 360 + 360) % 360);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      {/* Soft continuous subtle breath aura */}
      <span
        style={{
          position: 'absolute',
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: isMoving ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.16)',
          top: -4,
          left: -4,
          animation: 'lf-beacon-pulse 2.2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Directional Container oriented according to bearing */}
      <div
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${normalizedBearing}deg)`,
          transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
          zIndex: 2,
        }}
      >
        {/* Forward Heading Navigation Chevron / Cone */}
        <div
          style={{
            position: 'absolute',
            top: -10,
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: '12px solid #10B981',
            filter: 'drop-shadow(0 -2px 6px rgba(16, 185, 129, 0.8))',
            opacity: isMoving ? 1 : 0.85,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Main motorcycle badge */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: '3px solid #FFFFFF',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.55), 0 2px 6px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}
        >
          {/* Inner bike icon or arrow aligned with heading */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-45deg)', // aligns standard Lucide navigation icon along 0 deg heading
            }}
          >
            <Navigation size={21} strokeWidth={2.6} fill="#FFFFFF" />
          </div>
        </div>
      </div>

      {/* Floating horizontal label (NEVER rotated so it stays easily readable) */}
      {label && (
        <span
          style={{
            marginTop: 6,
            padding: '2.5px 9px',
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 800,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3), 0 0 8px rgba(16, 185, 129, 0.2)',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: isMoving ? '#10B981' : '#34D399',
              boxShadow: isMoving ? '0 0 6px #10B981' : 'none',
            }}
          />
          {label}
        </span>
      )}
    </div>
  );
}
