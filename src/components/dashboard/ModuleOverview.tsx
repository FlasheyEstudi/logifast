'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, DollarSign, Bike, AlertTriangle, UserCheck, X,
  ChevronRight, Plus, BarChart3, Layers, Crosshair,
  Maximize2, Minimize2, Eye, EyeOff, Route, Flame, Satellite,
} from 'lucide-react';
import { useStore, type Order, type Moto, type ZonePolygon } from '@/lib/store';

/* ─── Dynamic Leaflet — load entire module at once to avoid chunk splitting issues ─── */
type LeafletModule = typeof import('react-leaflet');

let leafletModulePromise: Promise<LeafletModule> | null = null;
function getLeafletModule(): Promise<LeafletModule> {
  if (!leafletModulePromise) {
    leafletModulePromise = import('react-leaflet');
  }
  return leafletModulePromise;
}

const MapContainer = dynamic(() => getLeafletModule().then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => getLeafletModule().then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => getLeafletModule().then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => getLeafletModule().then((m) => m.Popup), { ssr: false });
const Polyline = dynamic(() => getLeafletModule().then((m) => m.Polyline), { ssr: false });
const Polygon = dynamic(() => getLeafletModule().then((m) => m.Polygon), { ssr: false });
const Circle = dynamic(() => getLeafletModule().then((m) => m.Circle), { ssr: false });

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

/* ─── Leaflet map inner component ─── */
function MapInner({ isDark, motos, activeOrders, zonePolygons, showZones, showRoutes, showHeatmap, showSatellite, panelOpen, orders }: {
  isDark: boolean; motos: Moto[]; activeOrders: Order[];
  zonePolygons: ZonePolygon[]; showZones: boolean; showRoutes: boolean;
  showHeatmap: boolean; showSatellite: boolean; panelOpen: boolean; orders: Order[];
}) {
  const [routes, setRoutes] = useState<Array<{ positions: [number, number][]; order: Order }>>([]);
  const [L, setL] = useState<any>(null);
  const updateMotoPositions = useStore((s) => s.updateMotoPositions);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      setL(leaflet);
    });
    // Load leaflet CSS via link tag for reliability in standalone builds
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => updateMotoPositions(), 8000);
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
    const iv = setInterval(fetchRoutes, 30000);
    return () => clearInterval(iv);
  }, [fetchRoutes]);

  // Use a ref to store the map instance from MapContainer's whenReady
  const mapInstanceRef = useRef<any>(null);

  // Center map on Managua
  const centerMap = useCallback(() => {
    if (mapInstanceRef.current) mapInstanceRef.current.setView(MANAGUA_CENTER, 13);
  }, []);

  const showAllMotos = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || motos.length === 0 || !L) return;
    const validMotos = motos.filter(m => typeof m.lat === 'number' && typeof m.lng === 'number' && m.lat !== 0 && m.lng !== 0);
    if (validMotos.length === 0) return;
    const bounds = L.latLngBounds(validMotos.map((m: Moto) => L.latLng(m.lat, m.lng)));
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  }, [motos, L]);

  // Satellite tile URL based on toggle state
  const tileUrl = useMemo(() => {
    if (showSatellite) {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }, [showSatellite]);

  const tileAttribution = useMemo(() => {
    if (showSatellite) {
      return '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }
    return '&copy; OpenStreetMap';
  }, [showSatellite]);

  // ─── Marker Clustering ───
  // Group motos by proximity (grid-based: round lat/lng to 0.005)
  const clusteredMotos = useMemo(() => {
    if (!L) return [];
    const GRID = 0.005;
    const groups: Record<string, Moto[]> = {};
    motos.forEach((moto) => {
      const key = `${Math.round(moto.lat / GRID)},${Math.round(moto.lng / GRID)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(moto);
    });
    const result: Array<{
      type: 'single';
      moto: Moto;
    } | {
      type: 'cluster';
      count: number;
      lat: number;
      lng: number;
      motos: Moto[];
    }> = [];
    Object.values(groups).forEach((group) => {
      if (group.length === 1) {
        result.push({ type: 'single', moto: group[0] });
      } else {
        const avgLat = group.reduce((s, m) => s + m.lat, 0) / group.length;
        const avgLng = group.reduce((s, m) => s + m.lng, 0) / group.length;
        result.push({ type: 'cluster', count: group.length, lat: avgLat, lng: avgLng, motos: group });
      }
    });
    return result;
  }, [motos, L]);

  // ─── Heatmap data: order origin/destination coordinates ───
  const heatmapPoints = useMemo(() => {
    if (!showHeatmap) return [];
    const points: Array<{ lat: number; lng: number }> = [];
    orders.forEach((order) => {
      points.push({ lat: order.origenLat, lng: order.origenLng });
      points.push({ lat: order.destinoLat, lng: order.destinoLng });
    });
    return points;
  }, [showHeatmap, orders]);

  // ─── ETA labels for active routes ───
  const etaLabels = useMemo(() => {
    const activeStatuses = ['encamino'];
    return routes
      .filter((r) => activeStatuses.includes(r.order.estado))
      .map((route) => {
        const positions = route.positions;
        const midIndex = Math.floor(positions.length / 2);
        const midPoint = positions[midIndex] || positions[0];
        // Calculate approximate distance in km using Haversine-like approximation
        let totalDist = 0;
        for (let i = 1; i < positions.length; i++) {
          const dLat = positions[i][0] - positions[i - 1][0];
          const dLng = positions[i][1] - positions[i - 1][1];
          totalDist += Math.sqrt(dLat * dLat + dLng * dLng) * 111; // rough km
        }
        const etaMin = Math.round(totalDist * 3); // ~3 min per km
        return {
          id: route.order.id,
          position: midPoint,
          eta: etaMin,
          repartidor: route.order.repartidor,
        };
      });
  }, [routes]);

  if (!L) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lf-bg-base)' }}>
        <div style={{ textAlign: 'center', color: 'var(--lf-text-muted)' }}>
          <div className="lf-shimmer" style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px' }} />
          <div>Cargando mapa...</div>
        </div>
      </div>
    );
  }

  const createMotoIcon = (status: string) => {
    const color = STATUS_COLORS[status] || '#6B7280';
    const isPulse = status === 'in-service';
    return L.divIcon({
      className: '',
      html: `<div style="position:relative;width:28px;height:28px;">
        <div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/>
            <path d="M5 18h3l3-6h4l2 6h2"/><path d="M11 6l2 6"/>
          </svg>
        </div>
        ${isPulse ? '<div class="lf-marker-pulse" style="position:absolute;inset:-4px;border-radius:50%;"></div>' : ''}
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  const createClusterIcon = (count: number) => {
    return L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;border-radius:50%;background:#FF6600;border:3px solid white;box-shadow:0 2px 10px rgba(255,102,0,0.5);display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-family:'DM Sans',sans-serif;font-weight:800;font-size:13px;line-height:1;">${count}</span>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  const originIcon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#16A34A;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [18, 18], iconAnchor: [9, 9],
  });

  const destIcon = L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#FF6600;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [18, 18], iconAnchor: [9, 9],
  });

  // Determine active vs planned orders for route styling
  const activeStatuses = ['encamino', 'recogido'];

  return (
    <div className={isDark ? 'lf-dark-map' : ''} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={MANAGUA_CENTER}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        ref={mapInstanceRef}
      >
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        {/* Heatmap circles */}
        {showHeatmap && heatmapPoints.map((point, i) => (
          <Circle
            key={`hm-l-${i}`}
            center={[point.lat, point.lng]}
            radius={500}
            pathOptions={{ color: '#FF6600', fillColor: '#FF6600', fillOpacity: 0.04, weight: 0, opacity: 0 }}
          />
        ))}
        {showHeatmap && heatmapPoints.map((point, i) => (
          <Circle
            key={`hm-m-${i}`}
            center={[point.lat, point.lng]}
            radius={300}
            pathOptions={{ color: '#FF6600', fillColor: '#FF6600', fillOpacity: 0.06, weight: 0, opacity: 0 }}
          />
        ))}
        {showHeatmap && heatmapPoints.map((point, i) => (
          <Circle
            key={`hm-s-${i}`}
            center={[point.lat, point.lng]}
            radius={100}
            pathOptions={{ color: '#FF6600', fillColor: '#FF6600', fillOpacity: 0.08, weight: 0, opacity: 0 }}
          />
        ))}

        {/* Zone polygons */}
        {showZones && zonePolygons.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.coords}
            pathOptions={{
              color: zone.color,
              weight: 2,
              opacity: 0.7,
              fillColor: zone.color,
              fillOpacity: 0.1,
              dashArray: '6 3',
            }}
          >
            <Popup>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: zone.color }}>
                {zone.nombre}
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Zone labels (as invisible markers with divIcon) */}
        {showZones && zonePolygons.map((zone) => {
          const centerLat = zone.coords.reduce((s, c) => s + c[0], 0) / zone.coords.length;
          const centerLng = zone.coords.reduce((s, c) => s + c[1], 0) / zone.coords.length;
          const labelIcon = L.divIcon({
            className: '',
            html: `<div style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:11px;color:${zone.color};text-shadow:0 1px 3px rgba(255,255,255,0.8);white-space:nowrap;text-align:center;opacity:0.9;">${zone.nombre}</div>`,
            iconSize: [80, 16],
            iconAnchor: [40, 8],
          });
          return <Marker key={`zl-${zone.id}`} position={[centerLat, centerLng]} icon={labelIcon} interactive={false} />;
        })}

        {/* Moto markers with clustering */}
        {clusteredMotos.map((item, i) => {
          if (item.type === 'single') {
            return (
              <Marker key={item.moto.id} position={[item.moto.lat, item.moto.lng]} icon={createMotoIcon(item.moto.status)}>
                <Popup>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", minWidth: 150 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.moto.nombre}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{item.moto.modelo} ({item.moto.anio})</div>
                    <div style={{ fontSize: 12, color: STATUS_COLORS[item.moto.status], fontWeight: 600, marginTop: 4 }}>{STATUS_LABELS[item.moto.status]}</div>
                    {item.moto.repartidorAsignado && <div style={{ fontSize: 12, marginTop: 2 }}>Repartidor: {item.moto.repartidorAsignado}</div>}
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>KM: {item.moto.km.toLocaleString()}</div>
                  </div>
                </Popup>
              </Marker>
            );
          }
          // Cluster marker
          const clusterPopupContent = item.motos.map((m) =>
            `<div style="padding:3px 0;border-bottom:1px solid #eee;font-size:12px;">
              <strong>${m.nombre}</strong> — <span style="color:${STATUS_COLORS[m.status]}">${STATUS_LABELS[m.status]}</span>
              ${m.repartidorAsignado ? `<br/>Repartidor: ${m.repartidorAsignado}` : ''}
            </div>`
          ).join('');
          const clusterIcon = createClusterIcon(item.count);
          return (
            <Marker key={`cluster-${i}`} position={[item.lat, item.lng]} icon={clusterIcon}>
              <Popup>
                <div style={{ fontFamily: "'DM Sans',sans-serif", minWidth: 160 }} dangerouslySetInnerHTML={{ __html: clusterPopupContent }} />
              </Popup>
            </Marker>
          );
        })}

        {/* Routes - solid orange for active, dashed for planned */}
        {showRoutes && routes.map((route) => {
          const isActive = activeStatuses.includes(route.order.estado);
          return (
            <Polyline
              key={route.order.id}
              positions={route.positions}
              pathOptions={{
                color: '#FF6600',
                weight: isActive ? 4 : 3,
                opacity: isActive ? 0.85 : 0.5,
                dashArray: isActive ? undefined : '8 6',
              }}
            />
          );
        })}

        {/* Route ETA labels (encamino only) */}
        {showRoutes && etaLabels.map((eta) => {
          const etaIcon = L.divIcon({
            className: '',
            html: `<div style="
              font-family:'DM Sans',sans-serif;
              background:rgba(0,42,92,0.85);
              color:white;
              padding:3px 10px;
              border-radius:999px;
              font-size:11px;
              font-weight:700;
              white-space:nowrap;
              text-align:center;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              backdrop-filter:blur(4px);
              line-height:1.4;
            ">
              <div>ETA: ${eta.eta} min</div>
              ${eta.repartidor ? `<div style="font-size:9px;font-weight:500;opacity:0.85;">${eta.repartidor}</div>` : ''}
            </div>`,
            iconSize: [90, 36],
            iconAnchor: [45, 18],
          });
          return (
            <Marker key={`eta-${eta.id}`} position={eta.position} icon={etaIcon} interactive={false} />
          );
        })}

        {/* Origin and destination markers */}
        {showRoutes && routes.map((route) => (
          <Marker key={`o-${route.order.id}`} position={[route.order.origenLat, route.order.origenLng]} icon={originIcon} />
        ))}
        {showRoutes && routes.map((route) => (
          <Marker key={`d-${route.order.id}`} position={[route.order.destinoLat, route.order.destinoLng]} icon={destIcon} />
        ))}
      </MapContainer>

      {/* Custom map controls - top right */}
      <div style={{ position: 'absolute', top: 12, right: panelOpen ? 404 : 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={centerMap} title="Centrar mapa" className="lf-map-ctrl-btn" style={{
          width: 34, height: 34, borderRadius: 8, border: '1px solid var(--lf-border)',
          background: isDark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--lf-text-muted)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}><Crosshair size={15} /></button>
        <button onClick={showAllMotos} title="Ver todas las motos" className="lf-map-ctrl-btn" style={{
          width: 34, height: 34, borderRadius: 8, border: '1px solid var(--lf-border)',
          background: isDark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--lf-text-muted)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}><Bike size={15} /></button>
      </div>
    </div>
  );
}

/* ─── Wrap MapInner with dynamic ssr:false to avoid SSR issues with Leaflet ─── */
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

  const activeOrders = orders.filter((o) => o.estado === 'encamino' || o.estado === 'recogido');
  const todayRevenue = orders.filter((o) => o.fecha === '2026-06-10').reduce((s, o) => s + o.monto, 0);
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
                <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{moto.km.toLocaleString()} km</span>
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

      <style jsx global>{`
        @media (max-width: 768px) {
          .lf-kpi-strip { right: 12px !important; flex-wrap: wrap; }
          .lf-overview-panel-desktop { display: none !important; }
          .lf-mobile-fab-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
