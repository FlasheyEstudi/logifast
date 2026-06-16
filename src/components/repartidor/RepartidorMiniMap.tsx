'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  createRepartidorIcon,
  createOrigenIcon,
  createDestinoIcon,
  type RepartidorMapProps,
} from './RepartidorMap';

/* ═══════════════════════════════════════════════
   RepartidorMiniMap — Read-only compact Leaflet map
   for the service detail screen. Same props as
   RepartidorMap but ignores seguirRepartidor/onMapClick.
   Default height 160, zoom 13, no interactivity.
   ═══════════════════════════════════════════════ */

const MANAGUA_CENTER: [number, number] = [12.1149926, -86.2361742];

function isValidPos(
  p: [number, number] | undefined
): p is [number, number] {
  if (!p) return false;
  const [lat, lng] = p;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function safePos(
  p: [number, number] | undefined,
  fallback: [number, number]
): [number, number] {
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

  const repartidorIcon = useMemo(() => createRepartidorIcon(), []);
  const origenIcon = useMemo(() => createOrigenIcon(), []);
  const destinoIcon = useMemo(() => createDestinoIcon(), []);

  // Dashed route when heading to pickup; solid otherwise
  const isDashArray = estado === 'EN_CAMINO_RECOGER';

  return (
    <div className={className} style={{ position: 'relative', width: '100%' }}>
      <style>{`
        .lf-leaflet-marker { background: transparent !important; border: none !important; }
        .leaflet-container {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          height: 100%;
          width: 100%;
          z-index: 0;
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.7) !important;
        }
        .leaflet-control-attribution a { color: var(--text-secondary) !important; }
      `}</style>
      <MapContainer
        center={driverPos}
        zoom={zoom}
        style={{ height: altura, width: '100%', borderRadius: 16, zIndex: 0 }}
        zoomControl={false}
        attributionControl={true}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {rutaCoordenadas && rutaCoordenadas.length > 1 && (
          <Polyline
            positions={rutaCoordenadas}
            pathOptions={{
              color: '#FF5722',
              weight: 4,
              opacity: 0.85,
              dashArray: isDashArray ? '8 6' : undefined,
            }}
          />
        )}

        {origen && (
          <Marker position={origen} icon={origenIcon}>
            <Popup>Punto de recogida</Popup>
          </Marker>
        )}

        {destino && (
          <Marker position={destino} icon={destinoIcon}>
            <Popup>Punto de entrega</Popup>
          </Marker>
        )}

        <Marker position={driverPos} icon={repartidorIcon}>
          <Popup>Repartidor</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
