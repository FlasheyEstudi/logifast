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

  // Realtime Broadcast Endpoint for Serverless Next.js API routes
  if (req.url === '/api/emit' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { room, event, data } = payload;
        if (room) {
          io.to(room).emit(event, data);
        } else {
          io.emit(event, data);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, broadcasted: true }));
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
  socket.on('repartidor:posicion', (data: { lat: number; lng: number; heading: number; estado: string }) => {
    const repartidorId = socket.data.repartidorId;
    if (!repartidorId) return;
    repartidoresConectados.set(repartidorId, { ...data, ultimaActualizacion: Date.now() });

    io.to('admin').emit('repartidor:posicion:update', { repartidorId, ...data });
    io.to(`repartidor:${repartidorId}`).emit('repartidor:posicion:update', { repartidorId, ...data });

    const ordenId = socket.data.ordenId;
    if (ordenId) {
      io.to(`orden:${ordenId}`).emit('repartidor:posicion:update', { repartidorId, ...data });
    }
  });

  // ─── ADMIN: unirse a sala de admin ───
  socket.on('admin:conectar', () => {
    socket.join('admin');
    socket.emit('admin:flota:snapshot', Array.from(repartidoresConectados.entries()).map(([id, p]) => ({ repartidorId: id, ...p })));
  });

  // ─── ADMIN: asignar orden a repartidor ───
  socket.on('admin:asignar:orden', (data: { repartidorId: string; orden: any }) => {
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

  // ─── REPARTIDOR: unirse a su sala personal ───
  socket.on('repartidor:join:personal', (data: { repartidorId: string }) => {
    socket.join(`repartidor:${data.repartidorId}`);
  });

  // ─── CHAT: enviar mensaje ───
  socket.on('chat:mensaje', (data: { ordenId: string; emisor: 'repartidor' | 'cliente'; contenido: string; enviadoEn: string }) => {
    const mensaje = { id: `msg-${Date.now()}`, ...data };
    io.to(`orden:${data.ordenId}`).emit('chat:mensaje:nuevo', mensaje);
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
