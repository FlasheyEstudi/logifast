// components/repartidor/RepartidorMiniMap.tsx
'use client';

import React, { useMemo } from 'react';
import {
  Map,
  MapMarker,
  MarkerPopup,
  MapRoute,
} from '@/components/ui/map';
import { type RepartidorMapProps } from './RepartidorMap';
import { PinRecogida, PinEntrega, PinRepartidorMoto } from '@/components/ui/MapPins';

const MANAGUA_CENTER: [number, number] = [12.1149926, -86.2361742];

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
    return rutaCoordenadas.map((c) => [c[1], c[0]] as [number, number]);
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
            <PinRecogida label="Recogida" />
            <MarkerPopup>
              <div className="maplibre-popup-content">Punto de recogida</div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Marcador de Destino */}
        {destino && (
          <MapMarker longitude={destino[1]} latitude={destino[0]}>
            <PinEntrega label="Entrega" />
            <MarkerPopup>
              <div className="maplibre-popup-content">Punto de entrega</div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Marcador de Repartidor */}
        <MapMarker longitude={driverPos[1]} latitude={driverPos[0]}>
          <PinRepartidorMoto label="Repartidor" />
          <MarkerPopup>
            <div className="maplibre-popup-content">Repartidor en vivo</div>
          </MarkerPopup>
        </MapMarker>
      </Map>
    </div>
  );
}
