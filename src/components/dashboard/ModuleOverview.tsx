'use client';

import { useEffect, useState, useCallback, useMemo, useRef, Fragment } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, DollarSign, Bike, AlertTriangle, UserCheck, X,
  ChevronRight, Plus, BarChart3, Layers, Crosshair,
  Maximize2, Minimize2, Eye, EyeOff, Route, Flame, Satellite, Search,
} from '@/components/icons';
import { Store, Navigation, MapPin, Phone, Check, Star } from 'lucide-react';
import { useStore, type Order, type Moto, type ZonePolygon } from '@/lib/store';

import { Map, MapMarker, MarkerPopup, MapRoute, MapGeoJSON, MapRef } from '@/components/ui/map';
import { PinTienda, PinRepartidorMoto, PinCasa, PinRecogida, PinEntrega } from '@/components/ui/MapPins';
import { useMapaPuntos } from '@/hooks/useMapaPuntos';

const MANAGUA_CENTER: [number, number] = [12.1149926, -86.2361742];

const STATUS_COLORS: Record<string, string> = {
  available: '#16A34A',
  'in-service': '#FF6600',
  maintenance: '#DC2626',
};
const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  'in-service': 'En servicio',
  maintenance: 'Mantenimiento',
};

// Define satellite basemap style specification
const satelliteStyle = {
  version: 8 as const,
  sources: {
    'satellite-tiles': {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256
    }
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster' as const,
      source: 'satellite-tiles',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

/* ─── MapLibre map inner component ─── */
function MapInner({
  isDark,
  motos: storeMotos,
  activeOrders,
  zonePolygons,
  showZones,
  showRoutes,
  showHeatmap,
  showSatellite,
  panelOpen,
  orders,
}: {
  isDark: boolean;
  motos: Moto[];
  activeOrders: Order[];
  zonePolygons: ZonePolygon[];
  showZones: boolean;
  showRoutes: boolean;
  showHeatmap: boolean;
  showSatellite: boolean;
  panelOpen: boolean;
  orders: Order[];
}) {
  const {
    tiendas,
    clientePuntos,
    repartidoresPuntos,
    motos: liveMotos,
    buscarPuntos,
  } = useMapaPuntos();

  const [routes, setRoutes] = useState<Array<{ positions: [number, number][]; order: Order }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Filter toggles
  const [filterTiendas, setFilterTiendas] = useState(true);
  const [filterMotos, setFilterMotos] = useState(true);
  const [filterRepartidores, setFilterRepartidores] = useState(true);
  const [filterClientes, setFilterClientes] = useState(true);

  const updateMotoPositions = useStore((s) => s.updateMotoPositions);
  const mapRef = useRef<MapRef | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Intelligent search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    setIsSearching(true);
    const timeout = setTimeout(() => {
      buscarPuntos(searchQuery).then((res) => {
        setSearchResults(res);
        setShowSearchDropdown(true);
        setIsSearching(false);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery, buscarPuntos]);

  const handleSelectSearchResult = (item: any) => {
    setSelectedEntityId(item.id);
    setShowSearchDropdown(false);
    setSearchQuery(item.titulo);
    if (mapRef.current && item.lat && item.lng) {
      mapRef.current.flyTo({
        center: [item.lng, item.lat],
        zoom: 16.5,
        duration: 1200,
        pitch: 45,
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => updateMotoPositions(), 5000);
    return () => clearInterval(interval);
  }, [updateMotoPositions]);

  const fetchRoutes = useCallback(async () => {
    const results: Array<{ positions: [number, number][]; order: Order }> = [];
    for (const order of activeOrders) {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${order.origenLng},${order.origenLat};${order.destinoLng},${order.destinoLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: number[]) => [c[1], c[0]] as [number, number]
          );
          results.push({ positions: coords, order });
        }
      } catch {
        results.push({
          positions: [[order.origenLat, order.origenLng], [order.destinoLat, order.destinoLng]],
          order,
        });
      }
    }
    setRoutes(results);
  }, [activeOrders]);

  useEffect(() => {
    fetchRoutes();
    const iv = setInterval(fetchRoutes, 20000);
    return () => clearInterval(iv);
  }, [fetchRoutes]);

  // Center map on Managua
  const centerMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [MANAGUA_CENTER[1], MANAGUA_CENTER[0]],
        zoom: 13,
        pitch: 0,
        bearing: 0,
        duration: 1500,
      });
    }
  }, []);

  const showAllMotos = useCallback(() => {
    const map = mapRef.current;
    const allMotos = liveMotos.length > 0 ? liveMotos : storeMotos;
    if (!map || allMotos.length === 0) return;
    const validMotos = allMotos.filter(
      (m) => typeof m.lat === 'number' && typeof m.lng === 'number' && m.lat !== 0 && m.lng !== 0
    );
    if (validMotos.length === 0) return;

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    validMotos.forEach((m) => {
      if (m.lng < minLng) minLng = m.lng;
      if (m.lng > maxLng) maxLng = m.lng;
      if (m.lat < minLat) minLat = m.lat;
      if (m.lat > maxLat) maxLat = m.lat;
    });

    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 1500 });
  }, [liveMotos, storeMotos]);

  const showAllTiendas = useCallback(() => {
    const map = mapRef.current;
    if (!map || tiendas.length === 0) return;
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    tiendas.forEach((t) => {
      if (t.lng < minLng) minLng = t.lng;
      if (t.lng > maxLng) maxLng = t.lng;
      if (t.lat < minLat) minLat = t.lat;
      if (t.lat > maxLat) maxLat = t.lat;
    });
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 1500 });
  }, [tiendas]);

  // Heatmap data
  const heatmapPoints = useMemo(() => {
    if (!showHeatmap) return [];
    const points: Array<{ lat: number; lng: number }> = [];
    orders.forEach((order) => {
      points.push({ lat: order.origenLat, lng: order.origenLng });
      points.push({ lat: order.destinoLat, lng: order.destinoLng });
    });
    return points;
  }, [showHeatmap, orders]);

  // ETA labels
  const etaLabels = useMemo(() => {
    const activeStatuses = ['encamino'];
    return routes
      .filter((r) => activeStatuses.includes(r.order.estado))
      .map((route) => {
        const positions = route.positions;
        const midIndex = Math.floor(positions.length / 2);
        const midPoint = positions[midIndex] || positions[0];
        let totalDist = 0;
        for (let i = 1; i < positions.length; i++) {
          const dLat = positions[i][0] - positions[i - 1][0];
          const dLng = positions[i][1] - positions[i - 1][1];
          totalDist += Math.sqrt(dLat * dLat + dLng * dLng) * 111;
        }
        const etaMin = Math.round(totalDist * 3);
        return {
          id: route.order.id,
          position: midPoint,
          eta: etaMin,
          repartidor: route.order.repartidor,
        };
      });
  }, [routes]);

  // Zone polygons
  const zoneGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: zonePolygons.map((zone) => {
        const coords = zone.coords.map((c) => [c[1], c[0]]);
        if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push(coords[0]);
        }
        return {
          type: 'Feature' as const,
          id: zone.id,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [coords],
          },
          properties: {
            id: zone.id,
            nombre: zone.nombre,
            color: zone.color,
          },
        };
      }),
    };
  }, [zonePolygons]);

  const activeStatuses = ['encamino', 'recogido'];
  const effectiveMotos = liveMotos;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Map
        ref={mapRef}
        center={[MANAGUA_CENTER[1], MANAGUA_CENTER[0]]}
        zoom={13}
        className="h-full w-full"
        theme={isDark ? 'dark' : 'light'}
        styles={showSatellite ? { light: satelliteStyle, dark: satelliteStyle } : undefined}
      >
        {/* Heatmap circles */}
        {showHeatmap &&
          heatmapPoints.map((point, i) => (
            <MapMarker key={`hm-${i}`} longitude={point.lng} latitude={point.lat}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,102,0,0.3) 0%, rgba(255,102,0,0) 70%)',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />
            </MapMarker>
          ))}

        {/* Zone polygons */}
        {showZones && (
          <MapGeoJSON
            data={zoneGeoJSON}
            fillPaint={{
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.1,
            }}
            linePaint={{
              'line-color': ['get', 'color'],
              'line-width': 2,
              'line-dasharray': [3, 3],
            }}
          />
        )}

        {/* Zone labels */}
        {showZones &&
          zonePolygons.map((zone) => {
            const centerLat = zone.coords.reduce((s, c) => s + c[0], 0) / zone.coords.length;
            const centerLng = zone.coords.reduce((s, c) => s + c[1], 0) / zone.coords.length;
            return (
              <MapMarker key={`zl-${zone.id}`} longitude={centerLng} latitude={centerLat}>
                <div
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: zone.color,
                    textShadow: '0 1px 3px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    opacity: 0.9,
                    pointerEvents: 'none',
                  }}
                >
                  {zone.nombre}
                </div>
              </MapMarker>
            );
          })}

        {/* Tiendas registradas en el mapa con geolocalización inteligente */}
        {filterTiendas &&
          tiendas.map((t) => (
            <MapMarker key={`tienda-${t.id}`} longitude={t.lng} latitude={t.lat}>
              <PinTienda nombre={t.nombre} logoColor={t.logoColor} fotoUrl={t.imagenUrl} />
              <MarkerPopup>
                <div style={{ fontFamily: "'DM Sans',sans-serif", minWidth: 180, padding: '6px 10px', color: 'var(--text, #0F172A)' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0066FF', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Store size={14} color="#0066FF" /> {t.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', marginTop: 2 }}>{t.categoria}</div>
                  <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="#64748B" /> {t.direccion}
                  </div>
                  {t.telefono && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <a href={`tel:${t.telefono}`} style={{ color: '#10B981', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} color="#10B981" /> {t.telefono}
                      </a>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={11} fill="#F59E0B" color="#F59E0B" /> {t.calificacion.toFixed(1)}
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}

        {/* Repartidores activos en tiempo real */}
        {filterRepartidores &&
          repartidoresPuntos.map((r) => (
            <MapMarker key={`rep-${r.id}`} longitude={r.lng} latitude={r.lat}>
              <PinRepartidorMoto label={r.nombre || 'Repartidor'} />
              <MarkerPopup>
                <div style={{ fontFamily: "'DM Sans',sans-serif", minWidth: 170, padding: '6px 10px', color: 'var(--text, #0F172A)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Navigation size={14} color="#007AFF" /> {r.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: r.estado === 'in-service' ? '#FF6600' : '#10B981', fontWeight: 700, marginTop: 2 }}>
                    {r.estado === 'in-service' ? 'En viaje / entrega' : 'En línea (Disponible)'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', marginTop: 2 }}>
                    Vehículo: {r.vehiculoTipo} ({r.vehiculoPlaca || 'Sin placa'})
                  </div>
                  {r.telefono && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      <a href={`tel:${r.telefono}`} style={{ color: '#10B981', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} color="#10B981" /> {r.telefono}
                      </a>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', marginTop: 2 }}>
                    Entregas totales: {r.totalEntregas ?? 0}
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}

        {/* Motos de la flota */}
        {filterMotos &&
          effectiveMotos.map((moto) => {
            const statusKey = moto.estado || (moto as any).status || 'available';
            return (
              <MapMarker key={`moto-fleet-${moto.id}`} longitude={moto.lng} latitude={moto.lat}>
                <PinRepartidorMoto label={moto.nombre} />
                <MarkerPopup>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", minWidth: 150, padding: '4px 8px', color: 'var(--text, #0F172A)' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{moto.nombre}</div>
                    <div style={{ fontSize: 12, color: STATUS_COLORS[statusKey] || '#16A34A', fontWeight: 600, marginTop: 4 }}>
                      {STATUS_LABELS[statusKey] || 'Disponible'}
                    </div>
                    {moto.repartidorAsignado && (
                      <div style={{ fontSize: 12, marginTop: 2 }}>Repartidor: {moto.repartidorAsignado}</div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', marginTop: 2 }}>
                      KM: {(moto.km ?? 0).toLocaleString()}
                    </div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            );
          })}

        {/* Direcciones registradas por clientes */}
        {filterClientes &&
          clientePuntos.map((cp) => (
            <MapMarker key={`cliente-punto-${cp.id}`} longitude={cp.lng} latitude={cp.lat}>
              <PinCasa label={cp.etiqueta || cp.nombreCliente || 'Casa'} />
              <MarkerPopup>
                <div style={{ fontFamily: "'DM Sans',sans-serif", minWidth: 160, padding: '4px 8px', color: 'var(--text, #0F172A)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#8B5CF6' }}>
                    {cp.etiqueta} ({cp.nombreCliente})
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>{cp.direccion}</div>
                  {cp.referencia && <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', marginTop: 2 }}>Ref: {cp.referencia}</div>}
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}

        {/* Routes */}
        {showRoutes &&
          routes.map((route) => {
            const isActive = activeStatuses.includes(route.order.estado);
            const coords = route.positions.map((c) => [c[1], c[0]] as [number, number]);
            if (coords.length < 2) return null;
            return (
              <MapRoute
                key={route.order.id}
                coordinates={coords}
                color="#FF6600"
                width={isActive ? 5 : 3}
                opacity={isActive ? 0.9 : 0.5}
                dashArray={isActive ? undefined : [8, 6]}
              />
            );
          })}

        {/* Route ETA labels */}
        {showRoutes &&
          etaLabels.map((eta) => (
            <MapMarker key={`eta-${eta.id}`} longitude={eta.position[1]} latitude={eta.position[0]}>
              <div
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  background: 'rgba(0,42,92,0.88)',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(4px)',
                  lineHeight: 1.4,
                  pointerEvents: 'none',
                }}
              >
                <div>ETA: {eta.eta} min</div>
                {eta.repartidor && <div style={{ fontSize: 9, fontWeight: 500, opacity: 0.85 }}>{eta.repartidor}</div>}
              </div>
            </MapMarker>
          ))}

        {/* Origin and destination markers */}
        {showRoutes &&
          routes.map((route) => (
            <Fragment key={route.order.id}>
              <MapMarker longitude={route.order.origenLng} latitude={route.order.origenLat}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#16A34A', border: '3px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
                <MarkerPopup>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '4px 8px', color: 'var(--text, #0F172A)' }}>
                    Origen del pedido: #{route.order.id}
                  </div>
                </MarkerPopup>
              </MapMarker>
              <MapMarker longitude={route.order.destinoLng} latitude={route.order.destinoLat}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FF6600', border: '3px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
                <MarkerPopup>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '4px 8px', color: 'var(--text, #0F172A)' }}>
                    Destino del pedido: #{route.order.id}
                  </div>
                </MarkerPopup>
              </MapMarker>
            </Fragment>
          ))}
      </Map>

      {/* ── INTELLIGENT SEARCH BAR & FILTERS OVERLAY ── */}
      <div
        ref={searchContainerRef}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 'min(380px, calc(100% - 100px))',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border, rgba(255,255,255,0.15))',
            borderRadius: 14,
            padding: '4px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tienda, moto, repartidor o lugar..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text, #F8FAFC)',
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              padding: '6px 0',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94A3B8)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '2px 4px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {showSearchDropdown && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                background: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border, rgba(255,255,255,0.15))',
                borderRadius: 14,
                boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                maxHeight: 280,
                overflowY: 'auto',
                padding: 6,
              }}
            >
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectSearchResult(item)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-blue-500/10"
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: item.color || '#007AFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.tipo === 'tienda' ? (
                      <Store size={14} color="#FFF" />
                    ) : item.tipo === 'repartidor' ? (
                      <Navigation size={14} color="#FFF" />
                    ) : item.tipo === 'moto' ? (
                      <Bike size={14} color="#FFF" />
                    ) : (
                      <MapPin size={14} color="#FFF" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #F8FAFC)' }}>
                      {item.titulo}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #94A3B8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.subtitulo}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick filter chips */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterTiendas((p) => !p)}
            style={{
              padding: '4px 10px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              border: '1px solid var(--border, rgba(255,255,255,0.15))',
              background: filterTiendas ? '#0066FF' : isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)',
              color: filterTiendas ? '#FFFFFF' : 'var(--text-muted, #94A3B8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Store size={12} />
            <span>Tiendas ({tiendas.length})</span>
          </button>
          <button
            onClick={() => setFilterRepartidores((p) => !p)}
            style={{
              padding: '4px 10px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              border: '1px solid var(--border, rgba(255,255,255,0.15))',
              background: filterRepartidores ? '#10B981' : isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)',
              color: filterRepartidores ? '#FFFFFF' : 'var(--text-muted, #94A3B8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Navigation size={12} />
            <span>Repartidores ({repartidoresPuntos.length})</span>
          </button>
          <button
            onClick={() => setFilterMotos((p) => !p)}
            style={{
              padding: '4px 10px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              border: '1px solid var(--border, rgba(255,255,255,0.15))',
              background: filterMotos ? '#FF5722' : isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)',
              color: filterMotos ? '#FFFFFF' : 'var(--text-muted, #94A3B8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Bike size={12} />
            <span>Motos ({effectiveMotos.length})</span>
          </button>
        </div>
      </div>

      {/* Custom map controls - top right */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: panelOpen ? 404 : 12,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <button
          onClick={centerMap}
          title="Centrar en Managua"
          className="lf-map-ctrl-btn"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid var(--lf-border, rgba(255,255,255,0.15))',
            background: isDark ? 'rgba(22,27,34,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lf-text, #F8FAFC)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Crosshair size={17} />
        </button>
        <button
          onClick={showAllMotos}
          title="Enfocar todas las motos"
          className="lf-map-ctrl-btn"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid var(--lf-border, rgba(255,255,255,0.15))',
            background: isDark ? 'rgba(22,27,34,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lf-text, #F8FAFC)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Bike size={17} />
        </button>
        <button
          onClick={showAllTiendas}
          title="Enfocar todas las tiendas"
          className="lf-map-ctrl-btn"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid var(--lf-border, rgba(255,255,255,0.15))',
            background: isDark ? 'rgba(22,27,34,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lf-text, #F8FAFC)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Store size={17} />
        </button>
      </div>
    </div>
  );
}

/* ─── Wrap MapInner with dynamic ssr:false to avoid SSR issues ─── */
const MapComponent = dynamic(() => Promise.resolve(MapInner), { ssr: false, loading: () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lf-bg-base)' }}>
    <div style={{ textAlign: 'center', color: 'var(--lf-text-muted)' }}>
      <div className="lf-shimmer" style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px' }} />
      <div>Cargando mapa...</div>
    </div>
  </div>
) });

/* ─── Status badge helper ─── */
const statusBadge = (status: string) => {
  const c: Record<string, { bg: string; color: string }> = {
    pendiente: { bg: 'rgba(251,191,36,0.1)', color: '#D97706' },
    encamino: { bg: 'rgba(255,102,0,0.1)', color: '#FF6600' },
    recogido: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
    entregado: { bg: 'rgba(22,163,74,0.1)', color: '#16A34A' },
    incidencia: { bg: 'rgba(220,38,38,0.1)', color: '#DC2626' },
  };
  const l: Record<string, string> = { pendiente: 'Pendiente', encamino: 'En camino', recogido: 'Recogido', entregado: 'Entregado', incidencia: 'Incidencia' };
  const s = c[status] || { bg: 'rgba(107,114,128,0.1)', color: '#6B7280' };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color }}>{l[status] || status}</span>;
};

/* ─── Toggle button style helper ─── */
const toggleBtnStyle = (active: boolean, isDark: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
  borderRadius: 10,
  background: isDark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(16px)',
  border: `1px solid ${active ? 'var(--lf-accent)' : 'var(--lf-border)'}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  cursor: 'pointer', color: active ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
  fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
});

/* ─── Main ModuleOverview ─── */
export default function ModuleOverview({ isDark }: { isDark: boolean }) {
  const { orders, motos, riders, alerts, setActiveModule, zonePolygons } = useStore();
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const activeOrders = orders.filter((o) => o.estado === 'encamino' || o.estado === 'recogido');
  const todayRevenue = orders.filter((o) => o.fecha === todayStr).reduce((s, o) => s + o.monto, 0);
  const availableMotos = motos.filter((m) => m.status === 'available').length;
  const inServiceMotos = motos.filter((m) => m.status === 'in-service').length;
  const maintenanceMotos = motos.filter((m) => m.status === 'maintenance').length;
  const activeRiders = riders.filter((r) => r.conectado).length;

  const kpis = [
    { icon: Package, value: String(activeOrders.length), label: 'Ordenes activas', trend: '+2', color: 'var(--lf-accent)' },
    { icon: DollarSign, value: `C$${todayRevenue.toLocaleString()}`, label: 'Ingresos hoy', trend: '+12%', color: 'var(--lf-success)' },
    { icon: Bike, value: String(availableMotos), label: 'Motos disp.', trend: '', color: 'var(--lf-success)' },
    { icon: Bike, value: String(inServiceMotos), label: 'En servicio', trend: '', color: 'var(--lf-accent)' },
    { icon: AlertTriangle, value: String(alerts.length), label: 'Alertas', trend: '', color: 'var(--lf-danger)' },
    { icon: UserCheck, value: String(activeRiders), label: 'Repartidores', trend: '', color: 'var(--lf-primary)' },
  ];

  const topMotos = motos.filter((m) => m.status === 'in-service').sort((a, b) => b.km - a.km).slice(0, 5);
  const recentAlerts = alerts.slice(0, 3);

  const severityIcon = (sev: string) => {
    if (sev === 'alta') return <AlertTriangle size={14} style={{ color: 'var(--lf-danger)' }} />;
    if (sev === 'media') return <AlertTriangle size={14} style={{ color: 'var(--lf-warning)' }} />;
    return <AlertTriangle size={14} style={{ color: 'var(--lf-info)' }} />;
  };

  // Fullscreen toggle for the map area
  const handleFullscreen = useCallback(() => {
    const el = document.getElementById('lf-overview-container');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div id="lf-overview-container" style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* MAP */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapComponent
          isDark={isDark}
          motos={motos}
          activeOrders={activeOrders}
          zonePolygons={zonePolygons}
          showZones={showZones}
          showRoutes={showRoutes}
          showHeatmap={showHeatmap}
          showSatellite={showSatellite}
          panelOpen={panelOpen}
          orders={orders}
        />

        {/* KPI Strip */}
        <div className="lf-kpi-strip" style={{
          position: 'absolute', top: 12, left: 12, right: panelOpen ? 392 : 12, zIndex: 1000,
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 10,
                background: isDark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--lf-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <Icon size={13} style={{ color: kpi.color }} />
                <span className="font-mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--lf-text-main)' }}>{kpi.value}</span>
                <span style={{ fontSize: 10, color: 'var(--lf-text-muted)' }}>{kpi.label}</span>
                {kpi.trend && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--lf-success)' }}>{kpi.trend}</span>}
              </div>
            );
          })}
        </div>

        {/* Map Controls - Zones, Routes, Heatmap, Satellite toggles */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', gap: 6, marginTop: 50,
        }}>
          <button
            onClick={() => setShowZones(!showZones)}
            title={showZones ? 'Ocultar zonas' : 'Mostrar zonas'}
            style={toggleBtnStyle(showZones, isDark)}
          >
            <Layers size={13} />
            <span>Zonas</span>
          </button>
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            title={showRoutes ? 'Ocultar rutas' : 'Mostrar rutas'}
            style={toggleBtnStyle(showRoutes, isDark)}
          >
            <Route size={13} />
            <span>Rutas</span>
          </button>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            title={showHeatmap ? 'Ocultar mapa de calor' : 'Mostrar mapa de calor'}
            style={toggleBtnStyle(showHeatmap, isDark)}
          >
            <Flame size={13} />
            <span>Calor</span>
          </button>
          <button
            onClick={() => setShowSatellite(!showSatellite)}
            title={showSatellite ? 'Vista mapa' : 'Vista satélite'}
            style={toggleBtnStyle(showSatellite, isDark)}
          >
            <Satellite size={13} />
            <span>Satélite</span>
          </button>
        </div>

        {/* Map Legend */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16, zIndex: 1000, display: 'flex', gap: 12,
          padding: '6px 12px', borderRadius: 8,
          background: isDark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)', border: '1px solid var(--lf-border)',
        }}>
          {[{ color: '#16A34A', label: 'Disponible' }, { color: '#FF6600', label: 'En servicio' }, { color: '#DC2626', label: 'Mantenimiento' }].map((it) => (
            <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: it.color }} />
              <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>{it.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 2, background: '#FF6600' }} />
            <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>Activa</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 2, background: 'repeating-linear-gradient(90deg, #FF6600 0px, #FF6600 4px, transparent 4px, transparent 8px)' }} />
            <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>Planificada</span>
          </div>
          {showHeatmap && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,102,0,0.3)', boxShadow: '0 0 4px rgba(255,102,0,0.4)' }} />
              <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>Calor</span>
            </div>
          )}
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={handleFullscreen}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          style={{
            position: 'absolute', bottom: 16, right: panelOpen ? 396 : 16, zIndex: 1000,
            width: 34, height: 34, borderRadius: 8, border: '1px solid var(--lf-border)',
            background: isDark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(16px)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--lf-text-muted)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* Panel toggle */}
        {!panelOpen && (
          <button onClick={() => setPanelOpen(true)} style={{
            position: 'absolute', top: 12, right: 12, zIndex: 1000, width: 36, height: 36,
            borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-surface)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--lf-text-muted)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}><ChevronRight size={16} /></button>
        )}

        {/* Mobile FAB */}
        <button onClick={() => setMobileSheetOpen(true)} className="lf-mobile-fab-btn" style={{
          display: 'none', position: 'absolute', bottom: 24, right: 16, width: 52, height: 52,
          borderRadius: '50%', background: 'var(--lf-accent)', color: '#fff', border: 'none',
          boxShadow: '0 4px 16px rgba(255,102,0,0.4)', cursor: 'pointer', zIndex: 1000,
          alignItems: 'center', justifyContent: 'center',
        }}><ChevronRight size={24} /></button>
      </div>

      {/* RIGHT PANEL (desktop) */}
      {panelOpen && (
        <div className="lf-overview-panel-desktop" style={{
          width: 380, flexShrink: 0, background: isDark ? 'rgba(22,27,34,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)', borderLeft: '1px solid var(--lf-border)',
          overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Panel de control</span>
            <button onClick={() => setPanelOpen(false)} style={{
              width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)',
              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--lf-text-muted)',
            }}><X size={14} /></button>
          </div>

          {/* Active Orders */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Ordenes activas ({activeOrders.length})
            </h4>
            {activeOrders.slice(0, 5).map((order) => (
              <div key={order.id} onClick={() => setActiveModule('pedidos')} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 8, background: 'var(--lf-accent-soft)',
                cursor: 'pointer', marginBottom: 4, transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: 12 }}>{order.id}</span>
                  <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{order.cliente}</span>
                </div>
                {statusBadge(order.estado)}
              </div>
            ))}
          </div>

          {/* Fleet */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Flota en mapa</h4>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {[{ c: '#16A34A', l: 'Disponible', n: availableMotos }, { c: '#FF6600', l: 'En servicio', n: inServiceMotos }, { c: '#DC2626', l: 'Mantenimiento', n: maintenanceMotos }].map((s) => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />
                  <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>{s.l}: <strong>{s.n}</strong></span>
                </div>
              ))}
            </div>
            {topMotos.map((moto) => (
              <div key={moto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--lf-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[moto.status] }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{moto.nombre}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{(moto.km ?? (moto as any).kmAcumulados ?? 0).toLocaleString()} km</span>
              </div>
            ))}
          </div>

          {/* Zone Summary */}
          {showZones && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Zonas activas</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {zonePolygons.map((zone) => (
                  <div key={zone.id} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                    borderRadius: 6, background: `${zone.color}12`, border: `1px solid ${zone.color}30`,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: zone.color }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: zone.color }}>{zone.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Alertas recientes</h4>
            {recentAlerts.map((alert) => (
              <div key={alert.id} style={{
                padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                background: alert.severidad === 'alta' ? 'rgba(220,38,38,0.06)' : 'rgba(251,191,36,0.06)',
                border: `1px solid ${alert.severidad === 'alta' ? 'rgba(220,38,38,0.15)' : 'rgba(251,191,36,0.15)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {severityIcon(alert.severidad)}
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{alert.titulo}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{alert.msg}</div>
                <div style={{ fontSize: 11, color: 'var(--lf-text-muted)', marginTop: 2 }}>{alert.motoId} · {alert.tiempo}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Accesos rápidos</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: Plus, label: 'Nueva orden', action: () => setActiveModule('pedidos') },
                { icon: Bike, label: 'Ver flota', action: () => setActiveModule('flota') },
                { icon: UserCheck, label: 'Repartidores', action: () => setActiveModule('repartidores') },
                { icon: BarChart3, label: 'Reportes', action: () => setActiveModule('reportes') },
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button key={btn.label} onClick={btn.action} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                    borderRadius: 10, border: '1px solid var(--lf-border)', background: 'var(--lf-surface)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--lf-text-main)', transition: 'all 0.2s',
                  }}>
                    <Icon size={16} style={{ color: 'var(--lf-accent)' }} />{btn.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET */}
      <AnimatePresence>
        {mobileSheetOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setMobileSheetOpen(false)}
          >
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              style={{ background: 'var(--lf-surface)', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '70vh', overflowY: 'auto', padding: '20px 16px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ width: 40, height: 4, background: 'var(--lf-border)', borderRadius: 4, margin: '0 auto 16px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {kpis.map((kpi, i) => { const Icon = kpi.icon; return (
                  <div key={i} style={{ padding: '10px 8px', borderRadius: 10, background: 'var(--lf-accent-soft)', textAlign: 'center' }}>
                    <Icon size={16} style={{ color: kpi.color, margin: '0 auto 4px' }} />
                    <div className="font-mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--lf-text-main)' }}>{kpi.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--lf-text-muted)' }}>{kpi.label}</div>
                  </div>
                ); })}
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--lf-text-muted)', marginBottom: 8 }}>Ordenes activas</h4>
              {activeOrders.slice(0, 3).map((order) => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--lf-accent-soft)', marginBottom: 4 }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: 12 }}>{order.id}</span>
                  {statusBadge(order.estado)}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .lf-kpi-strip { right: 12px !important; flex-wrap: wrap; }
          .lf-overview-panel-desktop { display: none !important; }
          .lf-mobile-fab-btn { display: flex !important; }
        }
      ` }} />
    </div>
  );
}
