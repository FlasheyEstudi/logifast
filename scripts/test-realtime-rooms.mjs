/**
 * Smoke test de SALAS del microservicio realtime.
 *
 * Verifica el bug que impedía que las notificaciones masivas del admin llegaran:
 *  - `usuario:{userId}` debe ser una sala REAL a la que el dispositivo se une.
 *  - `POST /api/emit` debe aceptar varias salas en un solo request (lotes de 500).
 *  - La respuesta debe informar `entregados` (sockets realmente conectados).
 *
 * Uso:
 *   1) node mini-services/realtime-service/index.ts        (en otra terminal)
 *   2) node scripts/test-realtime-rooms.mjs
 */
import { io } from 'socket.io-client';

const BASE = process.env.REALTIME_URL || 'http://localhost:3003';
const USER_A = `test-user-${Date.now()}`;
const USER_B = `fantasma-${Date.now()}`;

const resultados = [];
function check(nombre, ok, detalle) {
  resultados.push({ nombre, ok, detalle });
  console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

function emitir(payload) {
  return fetch(`${BASE}/api/emit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer logifast-dev-secret' },
    body: JSON.stringify(payload),
  }).then((r) => r.json());
}

const socket = io(BASE, { transports: ['websocket'] });
let recibidos = [];

socket.on('notificacion:push', (data) => recibidos.push(data));

await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('timeout conectando al servicio realtime')), 5000);
  socket.on('connect', () => {
    clearTimeout(t);
    resolve();
  });
  socket.on('connect_error', (e) => {
    clearTimeout(t);
    reject(e);
  });
});

// 1) El dispositivo reclama su sala personal (lo que hacen ahora las apps)
socket.emit('usuario:conectar', { userId: USER_A, rol: 'cliente' });
await new Promise((r) => setTimeout(r, 300));

// 2) Envío masivo por lotes: una sala real + una que nadie ocupa
const res1 = await emitir({
  rooms: [`usuario:${USER_A}`, `usuario:${USER_B}`],
  event: 'notificacion:push',
  data: { titulo: 'Prueba', contenido: 'Envío masivo' },
});
await new Promise((r) => setTimeout(r, 300));

check('El dispositivo recibe el evento en su sala personal', recibidos.length === 1, `recibidos=${recibidos.length}`);
check('La respuesta reporta entregados=1', res1?.entregados === 1, `entregados=${res1?.entregados}`);
check('La respuesta reporta salasActivas=1', res1?.salasActivas === 1, `salasActivas=${res1?.salasActivas}`);
check('Confirma el total de salas del lote', res1?.salas === 2, `salas=${res1?.salas}`);

// 3) La sala fantasma del código anterior (`cliente:{id}`) NO entrega nada
recibidos = [];
const res2 = await emitir({
  room: `cliente:${USER_A}`,
  event: 'notificacion:push',
  data: { titulo: 'Prueba', contenido: 'Sala fantasma' },
});
await new Promise((r) => setTimeout(r, 300));

check('La sala antigua `cliente:{id}` no entrega a nadie (bug reproducido)', res2?.entregados === 0, `entregados=${res2?.entregados}`);

socket.disconnect();

const fallidos = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallidos.length}/${resultados.length} comprobaciones OK`);
process.exit(fallidos.length === 0 ? 0 : 1);
