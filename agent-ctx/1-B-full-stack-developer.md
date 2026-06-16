# Task 1-B — Real Leaflet map for Repartidor (LOGIFAST)

## Agent
full-stack-developer (Real Leaflet map)

## Task
Create `RepartidorMap.tsx` (Leaflet+OSM), `RepartidorMiniMap.tsx`,
`useGeolocation` hook, and `osrm` routing helper. All NEW files — no
existing files modified.

## Work Log
- Read `worklog.md`, `globals.css` (design tokens), `repartidor-store.ts`
  (state machine + `OrdenActiva` shape), `RepartidorServicio.tsx` (the
  current CSS-simulated `StylizedMap` this replaces), and `package.json`
  to confirm `leaflet@1.9.4`, `react-leaflet@5.0.0`,
  `leaflet-routing-machine@3.2.12`, `@types/leaflet@1.9.21` are installed.
- Confirmed Managua center `[12.1149926, -86.2361742]` from prior agents.
- Created `src/hooks/useGeolocation.ts` — SSR-safe browser geolocation
  hook with `start()`/`stop()` + `watchPosition`. Spanish error messages
  for the 3 `GeolocationPositionError` codes; guards all
  `navigator.geolocation` access; cleans up watch on unmount.
- Created `src/lib/osrm.ts` — `obtenerRuta(origen, destino)` calls the
  public OSRM API with a 6s `AbortController` timeout. Correctly uses
  `lng,lat` order in the URL and converts the GeoJSON `[lng,lat]`
  coordinates to `[lat,lng]` for Leaflet. Returns
  `{ coordenadas, distanciaKm, duracionMin, exito, error? }`.
  Also exports `rutaLineaRecta()` straight-line fallback.
- Created `src/components/repartidor/RepartidorMap.tsx` — full Leaflet
  map with OSM tiles, custom `L.divIcon` markers (orange moto w/ pulse
  ring, green package, red map-pin) using inline SVG only (NO emoji,
  NO external images), GPS-uncertainty `Circle` (80m, fillOpacity 0.08),
  `Polyline` route (dashed `8 6` for `EN_CAMINO_RECOGER`, solid
  otherwise), `RecenterMap` child (auto-pans when driver moves >5m,
  gated by `seguirRepartidor`), `FitBounds` child (fits origen+destino
  on mount). `scrollWheelZoom={false}` to avoid mobile scroll hijack.
  Injects scoped `<style>` for `.lf-leaflet-marker`, pulse keyframes,
  popup + attribution styling. Validates `repartidorPos` (falls back to
  Managua center on `[0,0]`/invalid). Exports icon creators + props
  type for reuse.
- Created `src/components/repartidor/RepartidorMiniMap.tsx` — compact
  read-only variant (height 160, zoom 13, `dragging/touchZoom/...=
  false`) reusing the same icon creators + `RepartidorMapProps` type.
  Ignores `seguirRepartidor`/`onMapClick`.

## Stage Summary
- **Files created (4):**
  - `src/hooks/useGeolocation.ts`
  - `src/lib/osrm.ts`
  - `src/components/repartidor/RepartidorMap.tsx`
  - `src/components/repartidor/RepartidorMiniMap.tsx`
- **Key exports:**
  - `useGeolocation(options?) → GeoState & { start, stop }`
  - `obtenerRuta(origen, destino) → Promise<ResultadoRuta>`
  - `rutaLineaRecta(origen, destino) → [number, number][]`
  - `RepartidorMap` (default), `RepartidorMapProps` (type),
    `createRepartidorIcon / createOrigenIcon / createDestinoIcon`
  - `RepartidorMiniMap` (default)
- **Lint:** `bun run lint` → 0 errors, 1 pre-existing warning in
  `src/app/layout.tsx` (custom-font warning, unrelated).
- **Dev server:** HTTP 200 on `http://localhost:3000`, clean Turbopack
  compile, no errors in `dev.log`.
- **Design compliance:** uses existing LOGIFAST tokens
  (`--bg`, `--text`, `--text-secondary`, `--primario`, `--shadow-md`),
  `.lf-*` class naming, `.lf-leaflet-marker` Leaflet marker class.
  No emojis, no blue/indigo, fully responsive (100% width, configurable
  height), mobile-safe (scrollWheelZoom off, read-only MiniMap).
- **No existing files modified.**
- **Integration note for downstream agents:** dynamically import
  `RepartidorMap` / `RepartidorMiniMap` with `ssr: false` in the
  consumer (e.g. `RepartidorServicio.tsx`, `RepartidorDetalleServicio.tsx`)
  to replace the CSS-simulated `StylizedMap`/`MiniMap`. Wire
  `repartidorPos` from `useGeolocation` (or the existing simulation
  store), `origenPos`/`destinoPos` from `OrdenActiva`
  (`origenLat/Lng`, `destinoLat/Lng`), and `rutaCoordenadas` from
  `obtenerRuta()` (with `rutaLineaRecta` fallback on failure).
