'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ═══════════════════════════════════════════════
   RepartidorMap — Real Leaflet map (OpenStreetMap)
   Dynamically import with ssr:false on the consumer.
   ═══════════════════════════════════════════════ */

const MANAGUA_CENTER: [number, number] = [12.1149926, -86.2361742];

/* ─── Inline SVG icons (NO emoji, NO external images) ─── */

const MOTO_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5.5" cy="17.5" r="3.5"/>
  <circle cx="18.5" cy="17.5" r="3.5"/>
  <path d="M15 6h2l3 6M5.5 14L10 6h4M9 6L7 14"/>
</svg>`;

const PACKAGE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`;

const MAPPIN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="#DC2626"/></svg>`;

/* ─── Icon creators (exported for reuse in RepartidorMiniMap) ─── */

export function createRepartidorIcon(): L.DivIcon {
  return L.divIcon({
    className: 'lf-leaflet-marker',
    html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <span class="marker-pulse-ring"></span>
      <div style="position:relative;width:40px;height:40px;border-radius:50%;background:#FF5722;border:3px solid #FFFFFF;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:2;">${MOTO_SVG}</div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

export function createOrigenIcon(): L.DivIcon {
  return L.divIcon({
    className: 'lf-leaflet-marker',
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#16A34A;border:3px solid #FFFFFF;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">${PACKAGE_SVG}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export function createDestinoIcon(): L.DivIcon {
  return L.divIcon({
    className: 'lf-leaflet-marker',
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#DC2626;border:3px solid #FFFFFF;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">${MAPPIN_SVG}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

/* ─── Position validation helpers ─── */

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

/* ─── Auto-recenter child (uses useMap hook) ─── */

function RecenterMap({
  pos,
  active,
}: {
  pos: [number, number];
  active: boolean;
}) {
  const map = useMap();
  const lastRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!active) return;
    const last = lastRef.current;
    // Only recenter if moved more than ~5m (~0.00005 deg)
    if (last) {
      const dLat = pos[0] - last[0];
      const dLng = pos[1] - last[1];
      const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distDeg < 0.00005) return;
    }
    lastRef.current = pos;
    map.panTo(pos, { animate: true });
  }, [pos, active, map]);

  return null;
}

/* ─── Fit-bounds child (uses useMap hook) ─── */

function FitBounds({
  origen,
  destino,
}: {
  origen?: [number, number];
  destino?: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (origen && destino) {
      const bounds = L.latLngBounds([origen, destino]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, origen, destino]);

  return null;
}

/* ─── Main component ─── */

export interface RepartidorMapProps {
  /** [lat, lng] of the driver */
  repartidorPos: [number, number];
  /** pickup location */
  origenPos?: [number, number];
  /** delivery location */
  destinoPos?: [number, number];
  /** optional route polyline ([lat, lng] pairs) */
  rutaCoordenadas?: [number, number][];
  /** current repartidor state (DESCONECTADO/EN_LINEA/...) */
  estado: string;
  /** height in px (default 280) */
  altura?: number;
  /** default 14 */
  zoom?: number;
  /** if true, map recenters on driver */
  seguirRepartidor?: boolean;
  /** optional click handler */
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

export default function RepartidorMap({
  repartidorPos,
  origenPos,
  destinoPos,
  rutaCoordenadas,
  estado,
  altura = 280,
  zoom = 14,
  seguirRepartidor = false,
  onMapClick,
  className,
}: RepartidorMapProps) {
  const driverPos = safePos(repartidorPos, MANAGUA_CENTER);
  const origen = isValidPos(origenPos) ? origenPos : undefined;
  const destino = isValidPos(destinoPos) ? destinoPos : undefined;

  const repartidorIcon = useMemo(() => createRepartidorIcon(), []);
  const origenIcon = useMemo(() => createOrigenIcon(), []);
  const destinoIcon = useMemo(() => createDestinoIcon(), []);

  // Dashed route when heading to pickup; solid once package is picked up
  const isDashArray = estado === 'EN_CAMINO_RECOGER';

  const eventHandlers = useMemo(() => {
    if (!onMapClick) return undefined;
    return {
      click: (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      },
    };
  }, [onMapClick]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%' }}>
      <style>{`
        .lf-leaflet-marker { background: transparent !important; border: none !important; }
        .marker-pulse-ring {
          position: absolute;
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(255, 87, 34, 0.4);
          top: 0; left: 0;
          animation: marker-pulse 1.8s ease-out infinite;
        }
        @keyframes marker-pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .leaflet-container {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          height: 100%;
          width: 100%;
          z-index: 0;
        }
        .leaflet-container a { color: var(--primario); }
        .leaflet-pane, .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow,
        .leaflet-tile-container, .leaflet-overlay > svg, .leaflet-map-pane svg {
          z-index: inherit;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: var(--shadow-md);
        }
        .leaflet-popup-content {
          margin: 10px 14px;
          font-size: 13px;
          color: var(--text);
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
        eventHandlers={eventHandlers}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* GPS uncertainty circle around driver */}
        <Circle
          center={driverPos}
          radius={80}
          pathOptions={{
            color: '#FF5722',
            fillColor: '#FF5722',
            fillOpacity: 0.08,
            weight: 1,
          }}
        />

        {/* Route polyline */}
        {rutaCoordenadas && rutaCoordenadas.length > 1 && (
          <Polyline
            positions={rutaCoordenadas}
            pathOptions={{
              color: '#FF5722',
              weight: 5,
              opacity: 0.85,
              dashArray: isDashArray ? '8 6' : undefined,
            }}
          />
        )}

        {/* Pickup marker */}
        {origen && (
          <Marker position={origen} icon={origenIcon}>
            <Popup>
              <strong>Punto de recogida</strong>
              <br />
              <span style={{ color: 'var(--text-secondary)' }}>
                Origen del servicio
              </span>
            </Popup>
          </Marker>
        )}

        {/* Delivery marker */}
        {destino && (
          <Marker position={destino} icon={destinoIcon}>
            <Popup>
              <strong>Punto de entrega</strong>
              <br />
              <span style={{ color: 'var(--text-secondary)' }}>
                Destino del servicio
              </span>
            </Popup>
          </Marker>
        )}

        {/* Driver marker */}
        <Marker position={driverPos} icon={repartidorIcon}>
          <Popup>
            <strong>Repartidor</strong>
            <br />
            <span style={{ color: 'var(--text-secondary)' }}>
              Tu ubicación actual
            </span>
          </Popup>
        </Marker>

        <RecenterMap pos={driverPos} active={seguirRepartidor} />
        <FitBounds origen={origen} destino={destino} />
      </MapContainer>
    </div>
  );
}
