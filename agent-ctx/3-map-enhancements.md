# Task 3 - Map Enhancements (Spec G)

## Agent: subagent
## Status: COMPLETED

## Summary
Enhanced ModuleOverview.tsx with all 5 Spec G improvements for the LOGIFAST logistics dashboard map.

## Changes Made

### File: `/home/z/my-project/src/components/dashboard/ModuleOverview.tsx`

1. **Circle dynamic import** - Added `Circle` from react-leaflet with `ssr: false` dynamic import
2. **New lucide-react icons** - Added `Flame` (heatmap) and `Satellite` (satellite toggle)
3. **useMemo import** - Added to React imports for computed values

### Enhancement 1: Heatmap Toggle ("Calor")
- `showHeatmap` state (default false)
- `heatmapPoints` useMemo: origin/destination coords from ALL orders
- 3 concentric Circle layers: 500m/0.04, 300m/0.06, 100m/0.08 opacity, color #FF6600
- "Calor" button with Flame icon
- Legend indicator when active

### Enhancement 2: Marker Clustering
- `clusteredMotos` useMemo with grid-based grouping (0.005 degree)
- Single moto: normal marker with popup
- Cluster (>1): 36px orange circle with count, popup with all motos

### Enhancement 3: Route ETA Labels
- `etaLabels` useMemo for encamino routes only
- Midpoint position from route positions array
- Approximate ETA: distance_km × 3 min
- Pill-shaped divIcon: navy bg, white text, repartidor name as second line

### Enhancement 4: Satellite Toggle
- `showSatellite` state (default false)
- `tileUrl` useMemo: OSM ↔ ArcGIS World Imagery
- `tileAttribution` useMemo: switches attribution
- "Satélite" button with Satellite icon

### Enhancement 5: Map Controls
- `toggleBtnStyle` helper for consistent styling
- All 4 toggles use same style with active/inactive states

### Props Passed to MapInner
- Added: `showHeatmap`, `showSatellite`, `orders`
- Existing: `isDark`, `motos`, `activeOrders`, `zonePolygons`, `showZones`, `showRoutes`, `panelOpen`

## Lint: 0 errors, 1 existing warning
## Dev server: running cleanly
