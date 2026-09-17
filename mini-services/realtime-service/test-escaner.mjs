/**
 * Prueba de protocolo del escáner inalámbrico (POS ↔ celular).
 *
 * Levanta dos clientes socket.io reales contra el microservicio y comprueba el
 * emparejamiento por PIN, el relé de códigos, el rechazo de PIN inválido, el
 * segundo lector, el desemparejamiento y el cierre de sesión — más la allowlist
 * de /api/emit.
 *
 * Uso:  PORT=3999 node mini-services/realtime-service/index.ts &
 *       node mini-services/realtime-service/test-escaner.mjs
 */
import { io } from 'socket.io-client';

const URL = process.env.TEST_URL || 'http://localhost:3999';
const PIN = '123456';

let ok = 0;
let fail = 0;
const check = (nombre, cond, extra = '') => {
  if (cond) { ok++; console.log(`  PASS  ${nombre}`); }
  else { fail++; console.log(`  FAIL  ${nombre} ${extra}`); }
};

function conectar() {
  return new Promise((resolve, reject) => {
    const s = io(URL, { transports: ['websocket'], forceNew: true, reconnection: false });
    const t = setTimeout(() => reject(new Error('timeout conectando al servicio realtime')), 5000);
    s.on('connect', () => { clearTimeout(t); resolve(s); });
    s.on('connect_error', (e) => { clearTimeout(t); reject(e); });
  });
}

const esperar = (s, evento, ms = 2500) =>
  new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    s.once(evento, (d) => { clearTimeout(t); resolve(d ?? {}); });
  });

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const pos = await conectar();
const celular = await conectar();

console.log('\n1) El POS abre la sesión con un PIN de 6 dígitos');
const pAbierta = esperar(pos, 'escaner:abierta');
pos.emit('escaner:abrir', { pin: PIN });
check('POS recibe escaner:abierta con su PIN', (await pAbierta)?.pin === PIN);

console.log('\n2) PIN equivocado no empareja');
const pError = esperar(celular, 'escaner:error');
celular.emit('escaner:unir', { pin: '000000' });
const err = await pError;
check('celular recibe escaner:error', !!err?.mensaje, JSON.stringify(err));

console.log('\n3) El celular se empareja con el PIN correcto');
const pUnida = esperar(celular, 'escaner:unida');
const pPresenciaPos = esperar(pos, 'escaner:presencia');
celular.emit('escaner:unir', { pin: PIN });
check('celular recibe escaner:unida', (await pUnida)?.pin === PIN);
const presencia = await pPresenciaPos;
check('el POS ve "lector conectado"', presencia?.lectorConectado === true, JSON.stringify(presencia));

console.log('\n4) Un segundo celular no puede secuestrar la sesión');
const intruso = await conectar();
const pRechazo = esperar(intruso, 'escaner:error');
intruso.emit('escaner:unir', { pin: PIN });
check('segundo lector rechazado', !!(await pRechazo)?.mensaje);

console.log('\n5) El código leído en el celular llega al POS');
const CODIGO = '7501234567890';
const pCodigoPos = esperar(pos, 'escaner:codigo:recibido');
const pAck = esperar(celular, 'escaner:codigo:ack');
celular.emit('escaner:codigo', { pin: PIN, codigo: CODIGO });
const recibido = await pCodigoPos;
check('el POS recibe el código tal cual', recibido?.codigo === CODIGO, JSON.stringify(recibido));
check('el celular recibe acuse de recibo', (await pAck)?.codigo === CODIGO);

console.log('\n6) El resultado de la búsqueda vuelve al celular');
const pResultado = esperar(celular, 'escaner:resultado');
pos.emit('escaner:resultado', { pin: PIN, codigo: CODIGO, encontrado: true, nombre: 'Coca Cola 600ml' });
const resultado = await pResultado;
check('el celular sabe que el producto existe', resultado?.encontrado === true && resultado?.nombre === 'Coca Cola 600ml', JSON.stringify(resultado));

const pResultadoFalso = esperar(celular, 'escaner:resultado');
intruso.emit('escaner:resultado', { pin: PIN, codigo: 'X', encontrado: true });
check('un tercero no puede falsificar resultados', (await pResultadoFalso) === null);

console.log('\n7) El celular que se cae libera la sesión (sin cerrarla)');
const pDesconexion = esperar(pos, 'escaner:presencia');
celular.disconnect();
check('el POS vuelve a "esperando lector"', (await pDesconexion)?.lectorConectado === false);

console.log('\n8) Reemparejamiento tras reconexión del celular');
const celular2 = await conectar();
const pUnida2 = esperar(celular2, 'escaner:unida');
celular2.emit('escaner:unir', { pin: PIN });
check('el celular reconectado se reempareja', (await pUnida2)?.pin === PIN);

console.log('\n9) El POS cierra la sesión y el celular se entera');
const pCerradaCel = esperar(celular2, 'escaner:cerrada');
pos.emit('escaner:cerrar', { pin: PIN });
check('el celular recibe escaner:cerrada', !!(await pCerradaCel)?.motivo);
await pausa(150);

console.log('\n10) Allowlist de /api/emit');
const intento = await fetch(`${URL}/api/emit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ room: `escaner:${PIN}`, event: 'escaner:codigo:recibido', data: { codigo: '9999999999' } }),
});
check('evento de escáner rechazado por HTTP (403)', intento.status === 403, `status=${intento.status}`);

const legitimo = await fetch(`${URL}/api/emit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ room: 'admin', event: 'admin:orden:nueva', data: { id: 'test' } }),
});
check('evento legítimo del backend sigue permitido', legitimo.status === 200, `status=${legitimo.status}`);

const basura = await fetch(`${URL}/api/emit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ room: 'admin', event: 'socket:raro:inventado', data: {} }),
});
check('evento inventado rechazado (403)', basura.status === 403, `status=${basura.status}`);

intruso.disconnect();
celular2.disconnect();
pos.disconnect();

console.log(`\nRESULTADO: ${ok} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
