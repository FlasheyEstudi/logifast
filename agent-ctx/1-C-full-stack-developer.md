# Task 1-C — LOGIFAST Realtime WebSocket Service

**Agent:** full-stack-developer (WebSocket realtime service)
**Task:** Create `mini-services/realtime-service/` (socket.io on port 3003) + `src/services/realtime.ts` (client wrapper)

## Files Created (all NEW)

| Path | Purpose |
| --- | --- |
| `mini-services/realtime-service/package.json` | Independent bun project, type: module, dev script = `bun --hot index.ts`, dep: socket.io ^4.8.0 |
| `mini-services/realtime-service/index.ts` | socket.io server on HARDCODED port 3003, `/health` route, in-memory state, 7 client→server events, 7 server→client events |
| `mini-services/realtime-service/README.md` | Full event reference + run instructions + critical rules + note on `path` deviation |
| `mini-services/realtime-service/start.sh` | while-true supervisor (mirrors keep-alive.sh) |
| `src/services/realtime.ts` | `'use client'` singleton wrapper — `getSocket()`, `onRealtimeEvent()`, `realtime.*` emitters |

## Events Implemented

**Client → Server (7):** `repartidor:conectar`, `repartidor:posicion`, `repartidor:estado:cambio`, `admin:conectar`, `admin:asignar:orden`, `cliente:tracking:unirse`, `chat:mensaje`

**Server → Client (7):** `repartidor:orden:nueva`, `repartidor:posicion:update`, `repartidor:estado:update`, `chat:mensaje:nuevo`, `admin:flota:snapshot`, `admin:repartidor:offline`, `admin:asignacion:confirmada`

## Verification Results

- **Lint:** `bun run lint` → 0 errors, 1 pre-existing warning in `src/app/layout.tsx` (unrelated)
- **Install:** `bun install` → 22 packages installed, socket.io@4.8.3
- **Health check:** `curl http://localhost:3003/health` → `{"ok":true,"service":"logifast-realtime","port":3003,"connections":0}` ✓
- **404 route:** `curl http://localhost:3003/` → HTTP 404 ✓
- **engine.io handshake:** `curl http://localhost:3003/socket.io/?EIO=4&transport=polling` → valid sid+upgrades+pingInterval+pingTimeout+maxPayload ✓

## Deviation from Spec (DOCUMENTED)

The spec code sample set `path: '/'` on both Server and io() client. I verified by reading `node_modules/engine.io/build/server.js` (attach() lines 649-674, _computePath line 76) that with `path: '/'`:
- `_computePath()` returns `'/'` (length 1)
- `check(req)` = `path === req.url.slice(0, path.length)` → `'/' === req.url.slice(0,1)` → **always true**
- Result: engine.io hijacks EVERY URL including `/health`, which returned `{"code":0,"message":"Transport unknown"}` instead of the spec JSON.

**Fix:** Omitted `path` on both ends (both fall back to socket.io's default `/socket.io/`). The critical rule "Client MUST connect via `io('/', { query: { XTransformPort: '3003' } })`" is still satisfied — the first arg `'/'` is the namespace, and `query.XTransformPort` is what Caddy uses to route. Caddy routes by query param, NOT by URL path, so this is transparent to the gateway.

Full explanation in code comments (both files) and in the "Nota sobre el path de socket.io" section of `mini-services/realtime-service/README.md`.

## Persistence Note

The sandbox's persistent shell tool kills background processes between Bash tool calls (even with `nohup`+`setsid`+`disown`). The service starts cleanly and verifies correctly every time `bun run dev` is invoked in `mini-services/realtime-service/`, but does not survive across separate Bash tool invocations. Downstream agents should start it themselves with `cd mini-services/realtime-service && bun run dev` (or use `start.sh` for auto-restart).

## Client API for Downstream Agents

```ts
import { getSocket, realtime, onRealtimeEvent, type RealtimeEvent } from '@/services/realtime';

// Repartidor shell on mount:
realtime.repartidorConectar('rep001');

// From useGeolocation loop (replace 5s setInterval polling):
realtime.repartidorPosicion(lat, lng, heading, estado);

// When estado changes (e.g. RECOGIDO → EN_PUNTO_ENTREGA):
realtime.repartidorEstadoCambio(ordenId, 'EN_PUNTO_ENTREGA');

// Client tracking screen on mount:
realtime.clienteTrackingUnirse(ordenId);

// Chat send:
realtime.chatMensaje(ordenId, 'cliente' /* or 'repartidor' */, 'Hola, voy en camino');

// Subscribe with cleanup:
useEffect(() => {
  return onRealtimeEvent('repartidor:orden:nueva', (orden) => {
    // show RepartidorNotificacionOrden overlay
  });
}, []);

useEffect(() => {
  return onRealtimeEvent('repartidor:posicion:update', ({ repartidorId, lat, lng, heading }) => {
    // update map marker
  });
}, []);

useEffect(() => {
  return onRealtimeEvent('chat:mensaje:nuevo', (msg) => {
    // append to chat list
  });
}, []);
```
