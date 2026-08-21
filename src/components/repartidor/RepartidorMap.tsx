// components/repartidor/RepartidorMap.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Map,
  MapMarker,
  MarkerPopup,
  MapRoute,
  MapRef,
} from '@/components/ui/map';
import { obtenerRuta, type PasoRuta } from '@/lib/osrm';
import { PinRecogida, PinEntrega, PinTienda, PinRepartidorMoto } from '@/components/ui/MapPins';

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

// Calculate bearing between two GPS coordinates
function calculateBearing(start: [number, number], end: [number, number]): number {
  const lat1 = (start[0] * Math.PI) / 180;
  const lon1 = (start[1] * Math.PI) / 180;
  const lat2 = (end[0] * Math.PI) / 180;
  const lon2 = (end[1] * Math.PI) / 180;
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
  mostrarNavegacionDriver?: boolean;
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
  mostrarNavegacionDriver = false,
  onMapClick,
  className,
}: RepartidorMapProps) {
  const targetDriverPos = safePos(repartidorPos, MANAGUA_CENTER);
  const origen = isValidPos(origenPos) ? origenPos : undefined;
  const destino = isValidPos(destinoPos) ? destinoPos : undefined;

  const [mapReady, setMapReady] = useState(false);
  const [shouldFollow, setShouldFollow] = useState(seguirRepartidor);
  const [is3DMode, setIs3DMode] = useState(false);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [gyroBearing, setGyroBearing] = useState<number | null>(null);

  // Smooth interpolated driver position
  const [animatedPos, setAnimatedPos] = useState<[number, number]>(targetDriverPos);
  const prevDriverPosRef = useRef<[number, number]>(targetDriverPos);
  const animFrameRef = useRef<number | null>(null);

  const mapRef = useRef<MapRef | null>(null);

  // Route metrics from OSRM
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);
  const [routeSteps, setRouteSteps] = useState<PasoRuta[]>([]);
  const [osrmRouteCoords, setOsrmRouteCoords] = useState<[number, number][]>([]);

  // Smooth position interpolation with LERP
  useEffect(() => {
    const startPos = animatedPos;
    const endPos = targetDriverPos;

    if (startPos[0] === endPos[0] && startPos[1] === endPos[1]) return;

    // Calculate motion bearing if driver is moving
    const dist = Math.hypot(endPos[0] - startPos[0], endPos[1] - startPos[1]);
    if (dist > 0.00005) {
      const b = calculateBearing(startPos, endPos);
      setCurrentBearing((prev) => {
        // Smooth bearing angle transition
        const diff = (b - prev + 180) % 360 - 180;
        return prev + diff * 0.4;
      });
    }

    const duration = 650;
    const startTime = performance.now();

    const step = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // Ease-out

      const lat = startPos[0] + (endPos[0] - startPos[0]) * ease;
      const lng = startPos[1] + (endPos[1] - startPos[1]) * ease;

      setAnimatedPos([lat, lng]);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
    prevDriverPosRef.current = endPos;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetDriverPos]);

  useEffect(() => {
    setShouldFollow(seguirRepartidor);
  }, [seguirRepartidor]);

  // Gyroscope / Device orientation handling with exponential low-pass filter
  useEffect(() => {
    if (!is3DMode) return;

    let lastHeading: number | null = null;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const compassHeading = (e as any).webkitCompassHeading;
      let rawHeading: number | null = null;

      if (typeof compassHeading === 'number' && !isNaN(compassHeading)) {
        rawHeading = compassHeading;
      } else if (typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        rawHeading = (360 - e.alpha) % 360;
      }

      if (rawHeading !== null) {
        if (lastHeading === null) {
          lastHeading = rawHeading;
        } else {
          // Circular exponential moving average filter
          let diff = (rawHeading - lastHeading + 180) % 360 - 180;
          lastHeading = (lastHeading + diff * 0.15 + 360) % 360;
        }
        setGyroBearing(lastHeading);
      }
    };

    let isMounted = true;
    if (typeof window !== 'undefined') {
      if (
        typeof (DeviceOrientationEvent as any) !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((res: string) => {
            if (isMounted && res === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, true);
            }
          })
          .catch(() => null);
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, [is3DMode]);

  const activeBearing = gyroBearing !== null ? gyroBearing : currentBearing;

  // Auto-activate 3D navigation when in active ride
  useEffect(() => {
    if (
      estado === 'EN_CAMINO_RECOGER' ||
      estado === 'RECOGIDO' ||
      estado === 'EN_CAMINO_ENTREGAR' ||
      estado === 'encamino'
    ) {
      setIs3DMode(true);
      setShouldFollow(true);
    }
  }, [estado]);

  // Center camera on driver with 3D perspective
  useEffect(() => {
    if (mapRef.current && shouldFollow) {
      if (is3DMode) {
        mapRef.current.easeTo({
          center: [animatedPos[1], animatedPos[0]],
          pitch: 66,
          bearing: activeBearing,
          zoom: 18.2,
          duration: 600,
        });
      } else {
        mapRef.current.easeTo({
          center: [animatedPos[1], animatedPos[0]],
          pitch: 0,
          bearing: 0,
          zoom: zoom,
          duration: 800,
        });
      }
    }
  }, [animatedPos, shouldFollow, is3DMode, activeBearing, zoom]);

  // Fit bounds when in 2D mode with both markers
  useEffect(() => {
    if (mapRef.current && mapReady && !is3DMode && !shouldFollow) {
      if (origen && destino && isValidPos(origen) && isValidPos(destino)) {
        const bounds: [[number, number], [number, number]] = [
          [Math.min(origen[1], destino[1], animatedPos[1]), Math.min(origen[0], destino[0], animatedPos[0])],
          [Math.max(origen[1], destino[1], animatedPos[1]), Math.max(origen[0], destino[0], animatedPos[0])],
        ];
        mapRef.current.fitBounds(bounds, {
          padding: { top: 80, bottom: 180, left: 50, right: 50 },
          duration: 1000,
          maxZoom: 16,
          pitch: 0,
          bearing: 0,
        });
      }
    }
  }, [mapReady, origen, destino, animatedPos, is3DMode, shouldFollow]);

  // Fetch OSRM driving route - Stable, no jitter
  const lastFetchedPosRef = useRef<{ lat: number; lng: number; targetLat: number; targetLng: number; estado?: string } | null>(null);
  const routeRequestIdRef = useRef(0);

  useEffect(() => {
    const targetPos = (estado === 'EN_CAMINO_RECOGER' || estado === 'ORDEN_ASIGNADA') ? origen : (destino || origen);
    if (!targetPos || !isValidPos(targetPos) || !isValidPos(targetDriverPos)) return;

    if (rutaCoordenadas && rutaCoordenadas.length >= 2) {
      const d = Math.max(0.1, Math.round(calcularDistanciaKm(targetDriverPos[0], targetDriverPos[1], targetPos[0], targetPos[1]) * 1.25 * 10) / 10);
      setRouteDistanceKm(d);
      setRouteDurationMin(Math.max(1, Math.round(d * 2.8)));
      return;
    }

    const last = lastFetchedPosRef.current;
    if (last) {
      const distFromLast = calcularDistanciaKm(last.lat, last.lng, targetDriverPos[0], targetDriverPos[1]);
      const sameTarget = Math.abs(last.targetLat - targetPos[0]) < 0.0001 && Math.abs(last.targetLng - targetPos[1]) < 0.0001 && last.estado === estado;
      if (sameTarget && distFromLast < 0.035) {
        // Driver moved less than 35m and target is identical -> do not trigger network fetch or jitter
        const directKm = Math.max(0.1, Math.round(calcularDistanciaKm(targetDriverPos[0], targetDriverPos[1], targetPos[0], targetPos[1]) * 1.25 * 10) / 10);
        setRouteDistanceKm(directKm);
        setRouteDurationMin(Math.max(1, Math.round(directKm * 2.8)));
        return;
      }
    }

    const currentReqId = ++routeRequestIdRef.current;
    lastFetchedPosRef.current = {
      lat: targetDriverPos[0],
      lng: targetDriverPos[1],
      targetLat: targetPos[0],
      targetLng: targetPos[1],
      estado,
    };

    obtenerRuta(
      { lat: targetDriverPos[0], lng: targetDriverPos[1] },
      { lat: targetPos[0], lng: targetPos[1] }
    )
      .then((res) => {
        if (currentReqId !== routeRequestIdRef.current) return;
        if (res && res.exito && res.coordenadas && res.coordenadas.length > 1) {
          setOsrmRouteCoords(res.coordenadas);
          setRouteDistanceKm(res.distanciaKm);
          setRouteDurationMin(res.duracionMin);
          if (res.pasos) setRouteSteps(res.pasos);
        } else {
          const directKm = Math.max(0.1, Math.round(calcularDistanciaKm(targetDriverPos[0], targetDriverPos[1], targetPos[0], targetPos[1]) * 1.25 * 10) / 10);
          setRouteDistanceKm(directKm);
          setRouteDurationMin(Math.max(1, Math.round(directKm * 2.8)));
        }
      })
      .catch(() => {
        if (currentReqId !== routeRequestIdRef.current) return;
        const directKm = Math.max(0.1, Math.round(calcularDistanciaKm(targetDriverPos[0], targetDriverPos[1], targetPos[0], targetPos[1]) * 1.25 * 10) / 10);
        setRouteDistanceKm(directKm);
        setRouteDurationMin(Math.max(1, Math.round(directKm * 2.8)));
      });
  }, [targetDriverPos, origen, destino, estado, rutaCoordenadas]);

  // MapLibre route coordinates [lng, lat][]
  const mapLibreRoute = useMemo(() => {
    const raw = (rutaCoordenadas && rutaCoordenadas.length >= 2) ? rutaCoordenadas : osrmRouteCoords;
    if (!raw || raw.length < 2) return [];
    return raw.map((c) => [c[1], c[0]] as [number, number]);
  }, [rutaCoordenadas, osrmRouteCoords]);

  // Handle map click
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

  // Cancel auto-follow on manual pan/zoom
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
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  const isCompra = tipoServicio === 'compra';
  const isRecolectando = estado === 'EN_CAMINO_RECOGER' || estado === 'ORDEN_ASIGNADA';
  const pickupColor = isCompra ? '#FF9500' : 'var(--primario, #007AFF)';
  const pickupLabel = isCompra ? 'TIENDA' : 'RECOGER';
  const routeColor = isRecolectando ? '#007AFF' : '#10B981';

  const nextStep = routeSteps.length > 0 ? routeSteps[0] : null;

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: altura }}>
      <style>{`
        .marker-pulse-ring {
          position: absolute;
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.35);
          top: -6px; left: -6px;
          animation: marker-pulse 2s ease-out infinite;
        }
        .marker-pulse-ring-2 {
          position: absolute;
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.18);
          top: -6px; left: -6px;
          animation: marker-pulse 2s ease-out infinite 0.7s;
        }
        @keyframes marker-pulse {
          0% { transform: scale(0.7); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .nav-hud-card {
          position: absolute;
          top: 14px;
          left: 14px;
          right: 14px;
          background: color-mix(in srgb, var(--surface) 92%, transparent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 40;
          box-shadow: var(--lf-shadow-card, 0 8px 32px rgba(0, 0, 0, 0.2));
          color: var(--text);
        }
        .btn-auto-center {
          position: absolute;
          bottom: 24px;
          right: 16px;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: color-mix(in srgb, var(--surface) 92%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 40;
          color: var(--text);
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
          bottom: 78px;
          right: 16px;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: color-mix(in srgb, var(--surface) 92%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 40;
          color: var(--text);
          transition: all 0.2s;
        }
        .btn-3d-toggle:active {
          transform: scale(0.92);
        }
        .btn-3d-toggle.active {
          background: #007AFF;
          color: #FFFFFF;
          border-color: #007AFF;
        }
        .maplibre-popup-content {
          font-family: 'DM Sans', sans-serif;
          padding: 8px 12px;
          color: var(--text, #0F172A);
        }
      `}</style>

      {/* Navigation HUD Top Overlay - Only rendered for Driver when an active delivery is in progress */}
      {mostrarNavegacionDriver && !['ENTREGADO', 'ENTREGADA', 'FINALIZADO', 'FINALIZADA', 'COMPLETADO', 'COMPLETADA', 'CANCELADO', 'CANCELADA', 'DISPONIBLE', 'INACTIVO', 'EN_LINEA', 'OFFLINE', 'DESCONECTADO'].includes((estado || '').toUpperCase()) && routeDistanceKm !== null && routeDurationMin !== null && (
        <div className="nav-hud-card">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
              style={{ background: isRecolectando ? '#007AFF' : '#10B981' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold truncate">
                {nextStep?.instruccion || (isRecolectando ? 'Hacia punto de recogida' : 'Hacia destino del cliente')}
              </div>
              <div className="text-[11px] text-gray-300 flex items-center gap-2">
                <span>{isRecolectando ? 'Paso 1: Recoger paquete' : 'Paso 2: Entregar orden'}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <div className="text-[15px] font-extrabold text-emerald-400 font-mono">
              {routeDurationMin} min
            </div>
            <div className="text-[11px] text-gray-300 font-mono">
              {routeDistanceKm} km
            </div>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        center={[animatedPos[1], animatedPos[0]]}
        zoom={is3DMode ? 18.2 : zoom}
        pitch={is3DMode ? 66 : 0}
        bearing={is3DMode ? activeBearing : 0}
        maxPitch={85}
        className="rounded-2xl overflow-hidden"
        onLoad={() => setMapReady(true)}
        dragPan={true}
        touchZoomRotate={true}
      >
        {/* Glow casing layer for OSRM Route */}
        {mapLibreRoute.length > 1 && (
          <MapRoute
            coordinates={mapLibreRoute}
            color="#0F172A"
            width={10}
            opacity={0.85}
          />
        )}

        {/* Dynamic Navigation Polyline */}
        {mapLibreRoute.length > 1 && (
          <MapRoute
            coordinates={mapLibreRoute}
            color={routeColor}
            width={5}
            opacity={0.95}
          />
        )}

        {/* Origin / Store Marker */}
        {origen && (
          <MapMarker longitude={origen[1]} latitude={origen[0]}>
            {isCompra ? (
              <PinTienda nombre={pickupLabel} logoColor={pickupColor} />
            ) : (
              <PinRecogida label="Recogida" />
            )}
            <MarkerPopup>
              <div className="maplibre-popup-content">
                <strong>{pickupLabel}</strong>
                <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', marginTop: 2 }}>
                  {isCompra ? 'Ubicación de la Tienda' : 'Origen del paquete'}
                </div>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Destination Marker */}
        {destino && (
          <MapMarker longitude={destino[1]} latitude={destino[0]}>
            <PinEntrega label={isCompra ? 'Cliente' : 'Entrega'} />
            <MarkerPopup>
              <div className="maplibre-popup-content">
                <strong>{isCompra ? 'Cliente' : 'Punto de entrega'}</strong>
                <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', marginTop: 2 }}>
                  Destino final
                </div>
              </div>
            </MarkerPopup>
          </MapMarker>
        )}

        {/* Driver Marker with Smooth Orientation & Clean Beacon Aura */}
        <MapMarker longitude={animatedPos[1]} latitude={animatedPos[0]}>
          <PinRepartidorMoto
            bearing={activeBearing}
            label="Repartidor en vivo"
          />
          <MarkerPopup>
            <div className="maplibre-popup-content">
              <strong>Repartidor</strong>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', marginTop: 2 }}>
                Ubicación GPS en tiempo real
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>
      </Map>

      {mostrarNavegacionDriver && mapReady && (
        <>
          {/* 3D View Toggle */}
          <button
            onClick={() => {
              setIs3DMode((prev) => !prev);
              setShouldFollow(true);
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try {
                  navigator.vibrate(12);
                } catch {}
              }
            }}
            className={`btn-3d-toggle ${is3DMode ? 'active' : ''}`}
            title="Vista 3D Navegación"
            aria-label="Alternar vista de navegación 3D"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </button>

          {/* Re-center button */}
          <button
            onClick={handleRecenterClick}
            className={`btn-auto-center ${shouldFollow && !is3DMode ? 'following' : ''}`}
            aria-label="Re-centrar mapa en mi posición"
            title="Centrar en mi ubicación"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
