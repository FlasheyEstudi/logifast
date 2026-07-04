// components/repartidor/RepartidorMiniMap.tsx
'use client';

import React, { useMemo } from 'react';
import {
  Map,
  MapMarker,
  MarkerPopup,
  MapRoute
} from '@/components/ui/map';
import { type RepartidorMapProps } from './RepartidorMap';

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

export default function RepartidorMiniMap({
  repartidorPos,
  origenPos,
  destinoPos,
  rutaCoordenadas,
  estado,
  altura = 160,
  zoom = 13,
  className,
}: RepartidorMapProps) {
  const driverPos = safePos(repartidorPos, MANAGUA_CENTER);
  const origen = isValidPos(origenPos) ? origenPos : undefined;
  const destino = isValidPos(destinoPos) ? destinoPos : undefined;

  // Dashed route when heading to pickup; solid otherwise
  const isDashArray = estado === 'EN_CAMINO_RECOGER';

  const mapLibreRoute = useMemo(() => {
    if (!rutaCoordenadas || rutaCoordenadas.length < 2) return [];
    return rutaCoordenadas.map(c => [c[1], c[0]] as [number, number]);
  }, [rutaCoordenadas]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: altura }}>
      <style>{`
        .maplibre-popup-content {
          font-family: 'DM Sans', sans-serif;
          padding: 6px 10px;
          color: var(--text);
        }
      `}</style>
      <Map
        center={[driverPos[1], driverPos[0]]}
        zoom={zoom}
        className="rounded-2xl overflow-hidden"
        dragPan={false}
        scrollZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        dragRotate={false}
        keyboard={false}
        touchZoomRotate={false}
      >
        {/* Ruta del servicio */}
        {mapLibreRoute.length > 1 && (
          <MapRoute
            coordinates={mapLibreRoute}
            color="#FF5722"
            width={4}
            opacity={0.85}
            dashArray={isDashArray ? [8, 6] : undefined}
          />
        )}

        {/* Marcador de Origen */}
        {origen && (
          <MapMarker longitude={origen[1]} latitude={origen[0]}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#16A34A', border: '2.5px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: PACKAGE_SVG }} />
            <MarkerPopup>
              <div className="maplibre-popup-content">Punto de recogida</div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Marcador de Destino */}
        {destino && (
          <MapMarker longitude={destino[1]} latitude={destino[0]}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#DC2626', border: '2.5px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: MAPPIN_SVG }} />
            <MarkerPopup>
              <div className="maplibre-popup-content">Punto de entrega</div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Marcador de Repartidor */}
        <MapMarker longitude={driverPos[1]} latitude={driverPos[0]}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--lf-primario)', border: '2.5px solid #FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: MOTO_SVG }} />
          <MarkerPopup>
            <div className="maplibre-popup-content">Repartidor</div>
          </MarkerPopup>
        </MapMarker>
      </Map>
    </div>
  );
}
