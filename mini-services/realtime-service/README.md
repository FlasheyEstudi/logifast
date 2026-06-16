# LOGIFAST Realtime Service

Mini-service de WebSocket (socket.io) que maneja la comunicación en tiempo real
entre **Repartidor**, **Cliente** y **Admin** en la app LOGIFAST.

## Detalles técnicos

| Campo | Valor |
| --- | --- |
| Nombre del servicio | `logifast-realtime-service` |
| Puerto | **3003** (HARDCODED — NO usa `process.env.PORT`) |
| Librería | `socket.io` ^4.8.0 |
| Runtime | Bun (`bun --hot index.ts` para auto-restart) |
| Estado | En memoria (no requiere DB) |
| Path del servidor | `/socket.io/` (default de socket.io — ver nota abajo) |

## Propósito

Reemplaza el polling de 5 segundos que usaba el repartidor para simular movimiento
y habilita el push en tiempo real de:

1. **Posición del repartidor** → clientes/admin que están viendo el tracking
2. **Órdenes nuevas asignadas** → repartidores conectados (en línea)
3. **Mensajes de chat** → cliente y repartidor de una orden
4. **Cambios de estado del repartidor** → cliente (e.g. "EN_CAMINO_RECOGER", "RECOGIDO")
5. **Snapshot de flota** → admin (mapa de repartidores conectados)
6. **Notificación de repartidor offline** → admin

## Eventos

### Client → Server (emisores)

| Evento | Payload | Descripción |
| --- | --- | --- |
| `repartidor:conectar` | `{ repartidorId: string }` | Repartidor se une a la sala `repartidores` y se registra en la flota |
| `repartidor:posicion` | `{ lat, lng, heading, estado }` | Repartidor emite su posición actual |
| `repartidor:estado:cambio` | `{ ordenId, estado }` | Repartidor notifica cambio de estado en una orden |
| `admin:conectar` | — | Admin se une a la sala `admin` y recibe snapshot de flota |
| `admin:asignar:orden` | `{ repartidorId, orden }` | Admin asigna una orden a un repartidor |
| `cliente:tracking:unirse` | `{ ordenId }` | Cliente se une a la sala de tracking de una orden |
| `chat:mensaje` | `{ ordenId, emisor, contenido, enviadoEn }` | Cliente o repartidor envía un mensaje de chat |

### Server → Client (suscriptores)

| Evento | Payload | Descripción |
| --- | --- | --- |
| `repartidor:orden:nueva` | `OrdenActiva` | Nueva orden asignada (lo recibe el repartidor) |
| `repartidor:posicion:update` | `{ repartidorId, lat, lng, heading, estado }` | Posición actualizada de un repartidor |
| `repartidor:estado:update` | `{ estado }` | Estado del repartidor cambió (lo recibe el cliente) |
| `chat:mensaje:nuevo` | `{ id, ordenId, emisor, contenido, enviadoEn }` | Nuevo mensaje de chat |
| `admin:flota:snapshot` | `Array<{ repartidorId, lat, lng, heading, estado, ultimaActualizacion }>` | Snapshot inicial de flota |
| `admin:repartidor:offline` | `{ repartidorId }` | Repartidor se desconectó |
| `admin:asignacion:confirmada` | `{ repartidorId, ordenId }` | Confirmación de asignación de orden |

## Cómo ejecutarlo

```bash
cd mini-services/realtime-service
bun install        # solo la primera vez
bun run dev        # arranca con bun --hot index.ts (auto-restart)
```

Health check:

```bash
curl http://localhost:3003/health
# {"ok":true,"service":"logifast-realtime","port":3003,"connections":0}
```

## Cómo se conecta el cliente (frontend)

El frontend Next.js NO se conecta a `http://localhost:3003` directamente. En su lugar,
usa la gateway de Caddy con el query param `XTransformPort=3003`:

```ts
import { getSocket, realtime, onRealtimeEvent } from '@/services/realtime';

// La conexión se crea automáticamente al primer uso:
const socket = getSocket(); // io('/', { query: { XTransformPort: '3003' } })

// Emitir:
realtime.repartidorConectar('rep001');
realtime.chatMensaje('orden-123', 'repartidor', 'Hola, voy en camino');

// Escuchar:
const off = onRealtimeEvent('chat:mensaje:nuevo', (msg) => {
  console.log('Nuevo mensaje:', msg);
});
// cleanup
off();
```

## Reglas CRÍTICAS

- **Puerto 3003 hardcoded** — nunca `process.env.PORT`
- **`bun run dev` usa `bun --hot index.ts`** — auto-restart en cambios
- Cliente SIEMPRE conecta vía `io('/', { query: { XTransformPort: '3003' } })`
  (el primer arg `'/'` es el namespace default; el `query.XTransformPort` lo
  enruta a través de la gateway de Caddy al puerto 3003)
- **NUNCA** usar `io('http://localhost:3003')`
- Todos los eventos usan prefijos en español: `repartidor:`, `cliente:`, `admin:`, `chat:`

## Nota sobre el `path` de socket.io

No se configura `path: '/'` (a pesar de que el código de referencia lo sugería).
engine.io en `attach()` hace `path === req.url.slice(0, path.length)`, así que
un path de 1 carácter `/` coincide con TODA URL — incluyendo `/health` — y lo
hijackea. Por eso se deja el default `/socket.io/` tanto en el server como en el
cliente (`src/services/realtime.ts`), permitiendo que `/health` siga sirviendo
el JSON de monitoreo. Caddy enruta por el query param `XTransformPort`, no por
el path, así que cualquier path funciona a través de la gateway.
