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

        // Allowlist: solo los eventos que el backend de LogiFast emite de verdad.
        // Los eventos `escaner:*` son de socket directo (POS ↔ celular) y no deben
        // poder difundirse desde HTTP ni desde fuera del emparejamiento.
        if (typeof event !== 'string' || !EVENTOS_HTTP_PERMITIDOS.has(event)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: `Evento no permitido: ${String(event).slice(0, 40)}` }));
          return;
        }

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

// Eventos que una ruta serverless puede difundir vía POST /api/emit (ver src/lib/realtime-emitter.ts).
// Mantener en sincronía al agregar eventos nuevos al backend.
const EVENTOS_HTTP_PERMITIDOS = new Set<string>([
  'admin:flota:snapshot',
  'admin:incidencia:nueva',
  'admin:orden:actualizada',
  'admin:orden:asignada',
  'admin:orden:eliminada',
  'admin:orden:nueva',
  'admin:orden:rechazada',
  'admin:recarga:actualizada',
  'chat:mensaje:nuevo',
  'cliente:notificacion',
  'ingeniero:alerta:nueva',
  'ingeniero:mantenimiento:nuevo',
  'mantenimiento:completado',
  'mantenimiento:iniciado',
  'notificacion:push',
  'orden:cancelada',
  'orden:estado:update',
  'orden:incidencia',
  'repartidor:moto:mantenimiento_completado',
  'repartidor:moto:mantenimiento_iniciado',
  'repartidor:moto:update',
  'repartidor:orden:disponible',
  'repartidor:orden:nueva',
  'repartidor:orden:tomada',
  'repartidor:posicion:update',
  'repartidor:recarga:actualizada',
  'tienda:orden:nueva',
]);

// In-memory state (no DB needed for realtime)
const repartidoresConectados = new Map<string, { lat: number; lng: number; heading: number; estado: string; ultimaActualizacion: number }>();
const salasOrden = new Map<string, Set<string>>(); // ordenId -> set of socket ids

/* ─────────────────────────────────────────────────────────────
   ESCÁNER INALÁMBRICO (POS ↔ CELULAR)
   El POS abre una sala efímera `escaner:{PIN}`; el celular se une tecleando
   ese PIN de 6 dígitos y retransmite los códigos que lee su cámara. El celular
   nunca habla con la base ni con el POS: solo con esta sala en memoria.
   ───────────────────────────────────────────────────────────── */
const PIN_ESCANER_RE = /^\d{6}$/;
const ESCANER_TTL_MS = 30 * 60 * 1000; // la sala muere sola si nadie la usa
const ESCANER_MAX_SALAS = 500;         // cota de memoria del proceso
const ESCANER_MAX_INTENTOS = 8;        // intentos de PIN por socket (anti fuerza bruta)
const ESCANER_MIN_MS_CODIGO = 60;      // anti flood de códigos

type SalaEscaner = {
  pin: string;
  posSocketId: string;
  lectorSocketId: string | null;
  ultimoUso: number;
  ultimoCodigoEn: number;
};

const salasEscaner = new Map<string, SalaEscaner>();
const roomEscaner = (pin: string) => `escaner:${pin}`;

function cerrarSalaEscaner(pin: string, motivo: string) {
  const sala = salasEscaner.get(pin);
  if (!sala) return;
  salasEscaner.delete(pin);
  io.to(roomEscaner(pin)).emit('escaner:cerrada', { pin, motivo });
  io.in(roomEscaner(pin)).socketsLeave(roomEscaner(pin));
}

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

  /* ─── ESCÁNER: el POS abre la sala y queda como dueño ─── */
  socket.on('escaner:abrir', (data: { pin?: string }) => {
    const pin = String(data?.pin ?? '').trim();
    if (!PIN_ESCANER_RE.test(pin)) {
      socket.emit('escaner:error', { contexto: 'abrir', mensaje: 'El PIN debe tener 6 dígitos' });
      return;
    }
    if (salasEscaner.size >= ESCANER_MAX_SALAS) {
      socket.emit('escaner:error', { contexto: 'abrir', mensaje: 'Demasiadas sesiones de escaneo activas' });
      return;
    }
    // Reabrir reemplaza cualquier sesión previa de este mismo POS o un PIN ya tomado.
    if (socket.data.escanerPin && socket.data.escanerPin !== pin) cerrarSalaEscaner(socket.data.escanerPin, 'reemplazada');
    if (salasEscaner.has(pin)) cerrarSalaEscaner(pin, 'reemplazada');

    salasEscaner.set(pin, {
      pin,
      posSocketId: socket.id,
      lectorSocketId: null,
      ultimoUso: Date.now(),
      ultimoCodigoEn: 0,
    });
    socket.data.escanerPin = pin;
    socket.data.escanerRol = 'pos';
    socket.join(roomEscaner(pin));
    socket.emit('escaner:abierta', { pin });
    console.log(`[realtime] escáner abierto pin=${pin} por ${socket.id}`);
  });

  /* ─── ESCÁNER: el celular se une con el PIN ─── */
  socket.on('escaner:unir', (data: { pin?: string }) => {
    const pin = String(data?.pin ?? '').trim();
    const sala = salasEscaner.get(pin);
    if (!PIN_ESCANER_RE.test(pin) || !sala) {
      socket.data.escanerIntentos = (socket.data.escanerIntentos ?? 0) + 1;
      socket.emit('escaner:error', { contexto: 'unir', mensaje: 'PIN incorrecto o sesión expirada' });
      if (socket.data.escanerIntentos >= ESCANER_MAX_INTENTOS) socket.disconnect(true);
      return;
    }
    // Solo un lector por sesión. Un id que ya no está conectado se considera libre,
    // lo que permite que el celular se reconecte tras perder la red.
    const lectorVigente = sala.lectorSocketId && io.sockets.sockets.has(sala.lectorSocketId);
    if (lectorVigente && sala.lectorSocketId !== socket.id) {
      socket.emit('escaner:error', { contexto: 'unir', mensaje: 'Ya hay un lector emparejado en esta sesión' });
      return;
    }
    sala.lectorSocketId = socket.id;
    sala.ultimoUso = Date.now();
    socket.data.escanerPin = pin;
    socket.data.escanerRol = 'lector';
    socket.join(roomEscaner(pin));
    socket.emit('escaner:unida', { pin });
    io.to(roomEscaner(pin)).emit('escaner:presencia', { pin, lectorConectado: true });
    console.log(`[realtime] escáner pin=${pin} emparejado con lector ${socket.id}`);
  });

  /* ─── ESCÁNER: el celular transmite un código leído ─── */
  socket.on('escaner:codigo', (data: { pin?: string; codigo?: string }) => {
    const pin = String(data?.pin ?? '').trim();
    const sala = salasEscaner.get(pin);
    if (!sala) {
      socket.emit('escaner:error', { contexto: 'codigo', mensaje: 'La sesión de escaneo ya no está activa' });
      return;
    }
    if (sala.lectorSocketId !== socket.id) {
      socket.emit('escaner:error', { contexto: 'codigo', mensaje: 'Este dispositivo no es el lector emparejado' });
      return;
    }
    const codigo = String(data?.codigo ?? '').trim().slice(0, 64);
    if (codigo.length < 3) return;

    const ahora = Date.now();
    if (ahora - sala.ultimoCodigoEn < ESCANER_MIN_MS_CODIGO) return;
    sala.ultimoCodigoEn = ahora;
    sala.ultimoUso = ahora;

    // Al POS (y a cualquier otro observador de la sala). `to(room)` excluye al emisor.
    socket.to(roomEscaner(pin)).emit('escaner:codigo:recibido', { pin, codigo, recibidoEn: ahora });
    socket.emit('escaner:codigo:ack', { pin, codigo });
  });

  /* ─── ESCÁNER: el POS devuelve si el código resolvió a un producto ─── */
  // Sin esto el celular solo sabría que emitió un código, no si la venta lo aceptó:
  // el operador recibiría el mismo zumbido para "agregado" y para "no existe".
  socket.on('escaner:resultado', (data: { pin?: string; codigo?: string; encontrado?: boolean; nombre?: string }) => {
    const pin = String(data?.pin ?? '').trim();
    const sala = salasEscaner.get(pin);
    if (!sala || sala.posSocketId !== socket.id) return; // solo el POS dueño informa resultados
    socket.to(roomEscaner(pin)).emit('escaner:resultado', {
      pin,
      codigo: String(data?.codigo ?? '').slice(0, 64),
      encontrado: !!data?.encontrado,
      nombre: typeof data?.nombre === 'string' ? data.nombre.slice(0, 80) : null,
    });
  });

  /* ─── ESCÁNER: el celular se desempareja (sin cerrar la sesión del POS) ─── */
  socket.on('escaner:salir', (data: { pin?: string }) => {
    const pin = String(data?.pin ?? '').trim();
    const sala = salasEscaner.get(pin);
    if (!sala) return;
    if (sala.lectorSocketId === socket.id) sala.lectorSocketId = null;
    socket.leave(roomEscaner(pin));
    socket.to(roomEscaner(pin)).emit('escaner:presencia', { pin, lectorConectado: false });
  });

  /* ─── ESCÁNER: solo el POS dueño cierra la sesión ─── */
  socket.on('escaner:cerrar', (data: { pin?: string }) => {
    const pin = String(data?.pin ?? '').trim();
    const sala = salasEscaner.get(pin);
    if (!sala) return;
    if (sala.posSocketId !== socket.id) {
      socket.emit('escaner:error', { contexto: 'cerrar', mensaje: 'Solo el POS que abrió la sesión puede cerrarla' });
      return;
    }
    cerrarSalaEscaner(pin, 'cerrada-por-pos');
  });

  // ─── Disconnect ───
  socket.on('disconnect', () => {
    const repartidorId = socket.data.repartidorId;
    if (repartidorId) {
      repartidoresConectados.delete(repartidorId);
      io.to('admin').emit('admin:repartidor:offline', { repartidorId });
    }

    // Limpieza del escáner: si se cae el POS, la sesión muere; si se cae el celular,
    // la sesión sigue viva y el POS queda esperando otro lector.
    const pinEscaner = socket.data.escanerPin as string | undefined;
    const salaEscaner = pinEscaner ? salasEscaner.get(pinEscaner) : undefined;
    if (salaEscaner && pinEscaner) {
      if (salaEscaner.posSocketId === socket.id) {
        cerrarSalaEscaner(pinEscaner, 'pos-desconectado');
      } else if (salaEscaner.lectorSocketId === socket.id) {
        salaEscaner.lectorSocketId = null;
        io.to(roomEscaner(pinEscaner)).emit('escaner:presencia', { pin: pinEscaner, lectorConectado: false });
      }
    }

    console.log(`[realtime] desconectado ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[realtime] LOGIFAST realtime service escuchando en puerto ${PORT}`);
});

// Barrido de sesiones de escáner inactivas: sin esto, una tablet que se va de la
// red sin cerrar el panel dejaría la sala viva para siempre.
setInterval(() => {
  const ahora = Date.now();
  for (const [pin, sala] of salasEscaner) {
    if (ahora - sala.ultimoUso > ESCANER_TTL_MS) cerrarSalaEscaner(pin, 'expirada');
  }
}, 60 * 1000);

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

/* Pedidos recurrentes (#1): la app decide cuáles vencieron y los crea. */
async function despacharPedidosRecurrentes() {
  try {
    const res = await fetch(`${APP_URL}/api/cron/pedidos-recurrentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_SECRET}` },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.warn(`[cron] pedidos recurrentes respondió ${res.status}`);
      return;
    }
    const data: any = await res.json();
    if (data?.creadas > 0) console.log(`[cron] pedidos recurrentes creados: ${data.creadas}`);
  } catch (err: any) {
    console.warn('[cron] no se pudieron despachar los pedidos recurrentes:', err?.message || err);
  }
}

setInterval(despacharPedidosRecurrentes, CRON_INTERVALO_MS);
setTimeout(despacharPedidosRecurrentes, 45000);
