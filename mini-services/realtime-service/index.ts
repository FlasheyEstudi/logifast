import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3003;

const httpServer = createServer((req, res) => {
  // CORS Headers for API calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check & Root landing
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'logifast-realtime', port: PORT, connections: io ? io.engine.clientsCount : 0 }));
    return;
  }

  // Realtime Broadcast Endpoint for Serverless Next.js API routes (VULN-03)
  if (req.url === '/api/emit' && req.method === 'POST') {
    const authHeader = req.headers['authorization'] || req.headers['x-service-key'];
    const serviceKey = process.env.REALTIME_SERVICE_SECRET || process.env.JWT_SECRET || 'logifast-dev-secret';

    if (process.env.NODE_ENV === 'production' && authHeader !== serviceKey && authHeader !== `Bearer ${serviceKey}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'No autorizado para emitir eventos' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { room, rooms, event, data } = payload;
        const targets: string[] | null =
          Array.isArray(rooms) && rooms.length > 0 ? rooms : room ? [room] : null;

        if (targets) {
          io.to(targets).emit(event, data);
        } else {
          io.emit(event, data);
        }

        // Métrica honesta de entrega: cuántos sockets realmente conectados escuchaban esas salas.
        let entregados = 0;
        if (targets) {
          const socketsUnicos = new Set<string>();
          for (const sala of targets) {
            const miembros = io.sockets.adapter.rooms.get(sala);
            if (miembros) for (const sid of miembros) socketsUnicos.add(sid);
          }
          entregados = socketsUnicos.size;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            broadcasted: true,
            salas: targets ? targets.length : 'todas',
            salasActivas: targets ? targets.filter((r) => io.sockets.adapter.rooms.has(r)).length : null,
            entregados,
          })
        );
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// In-memory state (no DB needed for realtime)
const repartidoresConectados = new Map<string, { lat: number; lng: number; heading: number; estado: string; ultimaActualizacion: number }>();
const salasOrden = new Map<string, Set<string>>(); // ordenId -> set of socket ids

io.on('connection', (socket) => {
  console.log(`[realtime] conectado ${socket.id}`);

  // ─── REPARTIDOR: unirse a sala de repartidores ───
  socket.on('repartidor:conectar', (data: { repartidorId: string }) => {
    socket.data.repartidorId = data.repartidorId;
    socket.join('repartidores');
    socket.join(`repartidor:${data.repartidorId}`);
    repartidoresConectados.set(data.repartidorId, {
      lat: 12.1364, lng: -86.2581, heading: 0, estado: 'DESCONECTADO', ultimaActualizacion: Date.now()
    });
    console.log(`[realtime] repartidor ${data.repartidorId} conectado`);
  });

  // ─── REPARTIDOR: emitir posición ───
  socket.on('repartidor:posicion', (data: { lat: number; lng: number; heading: number; estado: string; ordenId?: string }) => {
    const repartidorId = socket.data.repartidorId;
    if (!repartidorId) return;
    repartidoresConectados.set(repartidorId, { ...data, ultimaActualizacion: Date.now() });

    io.to('admin').emit('repartidor:posicion:update', { repartidorId, ...data });
    io.to(`repartidor:${repartidorId}`).emit('repartidor:posicion:update', { repartidorId, ...data });

    const ordenId = data.ordenId || socket.data.ordenId;
    if (ordenId) {
      socket.join(`orden:${ordenId}`);
      io.to(`orden:${ordenId}`).emit('repartidor:posicion:update', { repartidorId, ...data });
    }
  });

  // ─── ADMIN: unirse a sala de admin ───
  socket.on('admin:conectar', (_data?: { token?: string }) => {
    socket.join('admin');
    console.log(`[realtime] admin conectado en socket ${socket.id}`);
    socket.emit('admin:flota:snapshot', Array.from(repartidoresConectados.entries()).map(([id, p]) => ({ repartidorId: id, ...p })));
  });

  // ─── ADMIN: asignar orden a repartidor ───
  socket.on('admin:asignar:orden', (data: { repartidorId: string; orden: any; token?: string }) => {
    io.to(`repartidor:${data.repartidorId}`).emit('repartidor:orden:nueva', data.orden);
    io.to('admin').emit('admin:asignacion:confirmada', { repartidorId: data.repartidorId, ordenId: data.orden?.id });
  });

  // ─── CLIENTE: unirse a sala de tracking de una orden ───
  socket.on('cliente:tracking:unirse', (data: { ordenId: string }) => {
    socket.data.ordenId = data.ordenId;
    if (!salasOrden.has(data.ordenId)) salasOrden.set(data.ordenId, new Set());
    salasOrden.get(data.ordenId)!.add(socket.id);
    socket.join(`orden:${data.ordenId}`);
  });

  // ─── INGENIERO: unirse a sala de taller y mantenimiento ───
  socket.on('ingeniero:conectar', () => {
    socket.join('ingeniero');
    console.log(`[realtime] ingeniero conectado en socket ${socket.id}`);
  });

  // ─── REPARTIDOR: unirse a su sala personal ───
  socket.on('repartidor:join:personal', (data: { repartidorId: string }) => {
    socket.join(`repartidor:${data.repartidorId}`);
  });

  // ─── USUARIO (cliente / repartidor / comercio / admin): sala personal por User.id ───
  // Nota: el panel admin emite avisos masivos a `usuario:{userId}`. Antes esa sala
  // no existía para nadie y los avisos se emitían al vacío.
  socket.on('usuario:conectar', (data: { userId: string; rol?: string }) => {
    if (!data?.userId) return;
    socket.data.userId = data.userId;
    socket.data.rol = data.rol;
    socket.join(`usuario:${data.userId}`);
    console.log(`[realtime] usuario ${data.userId} (${data.rol || 'n/a'}) unido a su sala personal`);
  });

  // ─── CHAT: enviar mensaje ───
  socket.on('chat:mensaje', (data: { ordenId: string; emisor: 'repartidor' | 'cliente'; contenido: string; enviadoEn: string }) => {
    const mensaje = { id: `msg-${Date.now()}`, ...data };
    io.to(`orden:${data.ordenId}`).emit('chat:mensaje:nuevo', mensaje);
    io.to('repartidores').emit('chat:mensaje:nuevo', mensaje);
    io.to('admin').emit('chat:mensaje:nuevo', mensaje);
  });

  // ─── ESTADO DEL REPARTIDOR cambió ───
  socket.on('repartidor:estado:cambio', (data: { ordenId: string; estado: string }) => {
    io.to(`orden:${data.ordenId}`).emit('repartidor:estado:update', { estado: data.estado });
  });

  // ─── Disconnect ───
  socket.on('disconnect', () => {
    const repartidorId = socket.data.repartidorId;
    if (repartidorId) {
      repartidoresConectados.delete(repartidorId);
      io.to('admin').emit('admin:repartidor:offline', { repartidorId });
    }
    console.log(`[realtime] desconectado ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[realtime] LOGIFAST realtime service escuchando en puerto ${PORT}`);
});

/* ─────────────────────────────────────────────────────────────
   DESPACHO DE CAMPAÑAS PROGRAMADAS
   Antes no existía planificador: una campaña "Programada" nunca se
   enviaba. Este proceso vive 24/7 en Railway, así que cada 5 minutos
   pide a la app que despache las campañas cuya hora ya venció.
   Variables: LOGIFAST_APP_URL y REALTIME_SERVICE_SECRET.
   ───────────────────────────────────────────────────────────── */
const APP_URL = (process.env.LOGIFAST_APP_URL || 'https://logifast.netlify.app').replace(/\/$/, '');
const SERVICE_SECRET = process.env.REALTIME_SERVICE_SECRET || process.env.JWT_SECRET || 'logifast-dev-secret';
const CRON_INTERVALO_MS = 5 * 60 * 1000;

async function despacharCampanasProgramadas() {
  try {
    const res = await fetch(`${APP_URL}/api/cron/campanas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_SECRET}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.warn(`[cron] despacho de campañas respondió ${res.status}`);
      return;
    }
    const data: any = await res.json();
    if (data?.procesadas > 0) {
      const ok = (data.resultados || []).filter((r: any) => r?.ok).length;
      console.log(`[cron] campañas despachadas: ${ok}/${data.procesadas}`);
    }
  } catch (err: any) {
    // Nunca debe tumbar el servicio realtime por un fallo de red
    console.warn('[cron] no se pudo despachar campañas:', err?.message || err);
  }
}

setInterval(despacharCampanasProgramadas, CRON_INTERVALO_MS);
// Primera pasada 30s después de arrancar, para no competir con el arranque
setTimeout(despacharCampanasProgramadas, 30000);
console.log(`[cron] despacho de campañas programadas activo cada ${CRON_INTERVALO_MS / 60000} min → ${APP_URL}`);
