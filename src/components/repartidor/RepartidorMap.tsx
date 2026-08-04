// components/repartidor/RepartidorMap.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map,
  MapMarker,
  MarkerPopup,
  MapRoute,
  MapRef
} from '@/components/ui/map';

const MANAGUA_CENTER: [number, number] = [12.1149926, -86.2361742];

const MOTO_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5.5" cy="17.5" r="3.5"/>
  <circle cx="18.5" cy="17.5" r="3.5"/>
  <path d="M15 6h2l3 6M5.5 14L10 6h4M9 6L7 14"/>
</svg>`;

const PACKAGE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`;

const MAPPIN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="#DC2626"/></svg>`;

function isValidPos(p: [number, number] | undefined): p is [number, number] {
  if (!p) return false;
  const [lat, lng] = p;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function safePos(p: [number, number] | undefined, fallback: [number, number]): [number, number] {
  return isValidPos(p) ? p : fallback;
}

export interface RepartidorMapProps {
  repartidorPos: [number, number];
  origenPos?: [number, number];
  destinoPos?: [number, number];
  rutaCoordenadas?: [number, number][];
  estado: string;
  tipoServicio?: 'envio' | 'compra';
  altura?: number | string;
  zoom?: number;
  seguirRepartidor?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

export default function RepartidorMap({
  repartidorPos,
  origenPos,
  destinoPos,
  rutaCoordenadas,
  estado,
  tipoServicio = 'envio',
  altura = 280,
  zoom = 14,
  seguirRepartidor = false,
  onMapClick,
  className,
}: RepartidorMapProps) {
  const driverPos = safePos(repartidorPos, MANAGUA_CENTER);
  const origen = isValidPos(origenPos) ? origenPos : undefined;
  const destino = isValidPos(destinoPos) ? destinoPos : undefined;

  const [mapReady, setMapReady] = useState(false);
  const [shouldFollow, setShouldFollow] = useState(seguirRepartidor);
  const [is3DMode, setIs3DMode] = useState(false);
  const [currentBearing, setCurrentBearing] = useState(0);
  const prevDriverPosRef = useRef<[number, number]>(driverPos);
  const mapRef = useRef<MapRef | null>(null);

  const calculateBearing = (start: [number, number], end: [number, number]): number => {
    const lat1 = (start[0] * Math.PI) / 180;
    const lon1 = (start[1] * Math.PI) / 180;
    const lat2 = (end[0] * Math.PI) / 180;
    const lon2 = (end[1] * Math.PI) / 180;
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  useEffect(() => {
    const prev = prevDriverPosRef.current;
    if (prev && (prev[0] !== driverPos[0] || prev[1] !== driverPos[1])) {
      const bearing = calculateBearing(prev, driverPos);
      if (bearing !== 0) {
        setCurrentBearing(bearing);
      }
    }
    prevDriverPosRef.current = driverPos;
  }, [driverPos]);

  useEffect(() => {
    setShouldFollow(seguirRepartidor);
  }, [seguirRepartidor]);

  const isDashArray = estado === 'EN_CAMINO_RECOGER';

  // Centrar en repartidor cuando cambie de posición o cuando se active shouldFollow o cambie el modo 3D
  useEffect(() => {
    if (mapRef.current && shouldFollow) {
      if (is3DMode) {
        mapRef.current.easeTo({
          center: [driverPos[1], driverPos[0]],
          pitch: 65,
          bearing: currentBearing,
          zoom: 17.5,
          duration: 1200
        });
      } else {
        mapRef.current.easeTo({
          center: [driverPos[1], driverPos[0]],
          pitch: 0,
          bearing: 0,
          zoom: zoom,
          duration: 1200
        });
      }
    }
  }, [driverPos, shouldFollow, is3DMode, currentBearing, zoom]);

  // Centrar/encajar ruta y marcadores origen/destino
  useEffect(() => {
    if (mapRef.current && mapReady) {
      if (origen && destino) {
        mapRef.current.fitBounds([
          [origen[1], origen[0]],
          [destino[1], destino[0]]
        ], { padding: 50, duration: 1500 });
      }
    }
  }, [mapReady, origen, destino]);

  // Manejo de clics en el mapa
  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;
    const map = mapRef.current;
    const handleClick = (e: any) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mapReady, onMapClick]);

  // Manejo de interacciones del usuario para detener el auto-seguimiento
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const handleInteract = () => setShouldFollow(false);
    map.on('dragstart', handleInteract);
    map.on('zoomstart', handleInteract);
    return () => {
      map.off('dragstart', handleInteract);
      map.off('zoomstart', handleInteract);
    };
  }, [mapReady]);

  const handleRecenterClick = () => {
    setShouldFollow(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(10); } catch {}
    }
  };

  // Convertir ruta [lat, lng][] a [lng, lat][] para MapLibre
  const mapLibreRoute = useMemo(() => {
    if (!rutaCoordenadas || rutaCoordenadas.length < 2) return [];
    return rutaCoordenadas.map(c => [c[1], c[0]] as [number, number]);
  }, [rutaCoordenadas]);

  const isCompra = tipoServicio === 'compra';
  const pickupColor = isCompra ? '#FF9500' : 'var(--primario)';
  const pickupLabel = isCompra ? 'TIENDA' : 'RECOGER';

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: altura }}>
      <style>{`
        .marker-pulse-ring {
          position: absolute;
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(22, 163, 74, 0.4);
          top: -2px; left: -2px;
          animation: marker-pulse 1.8s ease-out infinite;
        }
        @keyframes marker-pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .marker-pill {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          padding: 2px 7px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.3px;
        }
        .btn-auto-center {
          position: absolute;
          bottom: calc(var(--ios-tabbar-height, 80px) + 24px);
          right: 16px;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(30, 41, 59, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          boxShadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 40;
          color: #F8FAFC;
          transition: all 0.2s;
        }
        .btn-auto-center:active {
          transform: scale(0.92);
        }
        .btn-auto-center.following {
          background: #007AFF;
          color: #FFFFFF;
          border-color: #007AFF;
        }
        .btn-3d-toggle {
          position: absolute;
          bottom: calc(var(--ios-tabbar-height, 80px) + 84px);
          right: 16px;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(30, 41, 59, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          boxShadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 40;
          color: #F8FAFC;
          transition: all 0.2s;
        }
        .btn-3d-toggle:active {
          transform: scale(0.92);
        }
        .btn-3d-toggle.active {
          background: var(--lf-primario);
          color: #FFFFFF;
          border-color: var(--lf-primario);
        }
        .map-legend-box {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(19, 24, 34, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 0.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 40;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .maplibre-popup-content {
          font-family: 'DM Sans', sans-serif;
          padding: 8px 12px;
          color: var(--text);
        }
      `}</style>



      <Map
        ref={mapRef}
        center={[driverPos[1], driverPos[0]]}
        zoom={zoom}
        className="rounded-2xl overflow-hidden"
        onLoad={() => setMapReady(true)}
        dragPan={true}
        touchZoomRotate={true}
      >
        {/* Ruta del servicio */}
        {mapLibreRoute.length > 1 && (
          <MapRoute
            coordinates={mapLibreRoute}
            color={isCompra ? '#FF9500' : 'var(--primario)'}
            width={5}
            opacity={0.85}
            dashArray={isDashArray ? [8, 6] : undefined}
          />
        )}

        {/* Marcador de Origen / Tienda / Recogida */}
        {origen && (
          <MapMarker longitude={origen[1]} latitude={origen[0]}>
            <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="marker-pill" style={{ background: pickupColor }}>{pickupLabel}</span>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: pickupColor, border: '3px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: PACKAGE_SVG }} />
            </div>
            <MarkerPopup>
              <div className="maplibre-popup-content">
                <strong>{pickupLabel}</strong>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{isCompra ? 'Ubicación de la Tienda' : 'Origen del paquete'}</div>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Marcador de Destino / Cliente */}
        {destino && (
          <MapMarker longitude={destino[1]} latitude={destino[0]}>
            <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="marker-pill" style={{ background: '#DC2626' }}>{isCompra ? 'CLIENTE' : 'ENTREGAR'}</span>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DC2626', border: '3px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: MAPPIN_SVG }} />
            </div>
            <MarkerPopup>
              <div className="maplibre-popup-content">
                <strong>{isCompra ? 'Ubicación del Cliente' : 'Punto de entrega'}</strong>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Destino final</div>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Marcador de Repartidor (Yo - Verde) */}
        <MapMarker longitude={driverPos[1]} latitude={driverPos[0]}>
          <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="marker-pill" style={{ background: '#16A34A' }}>TÚ</span>
            <span className="marker-pulse-ring"></span>
            <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: '#16A34A', border: '3px solid #FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }} dangerouslySetInnerHTML={{ __html: MOTO_SVG }} />
          </div>
          <MarkerPopup>
            <div className="maplibre-popup-content">
              <strong>Tú (Repartidor)</strong>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Tu ubicación actual en vivo</div>
            </div>
          </MarkerPopup>
        </MapMarker>
      </Map>

      {mapReady && (
        <>
          <button
            onClick={() => {
              setIs3DMode(prev => !prev);
              setShouldFollow(true);
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate(12); } catch {}
              }
            }}
            className={`btn-3d-toggle ${is3DMode ? 'active' : ''}`}
            title="Vista 3D Navegación"
            aria-label="Alternar vista de navegación 3D"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </button>

          <button
            onClick={handleRecenterClick}
            className={`btn-auto-center ${shouldFollow && !is3DMode ? 'following' : ''}`}
            aria-label="Re-centrar mapa en mi posición"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
