/**
 * auditoria-responsive.mjs — QA visual real con el Chromium que ya está en la caché
 * de Playwright, manejado por CDP. Sin dependencias: usa WebSocket nativo de Node 22+.
 *
 * Mide lo que pide el criterio de Fase 4:
 *   - desborde horizontal por ancho (390 / 820 / 1440)
 *   - elementos que sobresalen del viewport
 *   - objetivos táctiles por debajo de 44 px
 *   - color computado de las clases del sistema (bg-primary, bg-card, …):
 *     si la capa de tokens está rota, salen transparentes.
 *
 * Uso:
 *   node scripts/auditoria-responsive.mjs --url http://localhost:3010/ \
 *        --out /tmp/auditoria --anchuras 390,820,1440 [--cookie "lf_session=…"] [--eval-file paso.js]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const args = process.argv.slice(2);
const opt = (nombre, porDefecto) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};

const URL_OBJETIVO = opt('url', 'http://localhost:3010/');
const SALIDA = opt('out', '/tmp/auditoria');
const ANCHURAS = opt('anchuras', '390,820,1440').split(',').map(Number);
const COOKIE = opt('cookie', null);
const ARCHIVO_PASO = opt('eval-file', null);
const PUERTO = Number(opt('puerto', '9222'));
const ESPERA_MS = Number(opt('espera', '2500'));

const NAVEGADOR =
  process.env.CHROME_BIN ||
  join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell');

const AUDITORIA = `(function () {
  const vw = document.documentElement.clientWidth;
  const enScroll = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };
  const desc = (el) => {
    const id = el.id ? '#' + el.id : '';
    const c = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.')
      : '';
    const partes = [el.tagName.toLowerCase() + id + c];
    let n = el.parentElement;
    for (let i = 0; i < 3 && n && n !== document.body; i++) {
      const pid = n.id ? '#' + n.id : '';
      const pc = typeof n.className === 'string' && n.className.trim()
        ? '.' + n.className.trim().split(/\\s+/).slice(0, 2).join('.')
        : '';
      partes.unshift(n.tagName.toLowerCase() + pid + pc);
      n = n.parentElement;
    }
    return partes.join(' > ');
  };
  const sobresalen = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right > vw + 1 && !enScroll(el)) sobresalen.push({ sel: desc(el), right: Math.round(r.right), w: Math.round(r.width), txt: (el.textContent || '').trim().slice(0, 28) });
  }
  const toques = [];
  for (const el of document.querySelectorAll('button, a, [role="button"], summary, input[type="submit"]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.height < 44) toques.push({ txt: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 34), h: Math.round(r.height), w: Math.round(r.width) });
  }
  const colores = {};
  for (const cls of ['bg-primary', 'bg-card', 'bg-background', 'text-muted-foreground', 'bg-accent', 'bg-destructive']) {
    const el = document.querySelector('.' + cls);
    if (el) { const cs = getComputedStyle(el); colores[cls] = cs.backgroundColor + ' / ' + cs.color; }
  }
  // Si la pantalla no usa esas clases, se inyecta una sonda: así se comprueba que el
  // CSS compilado genera color válido (antes salía transparente por hsl(#HEX) inválido).
  if (Object.keys(colores).length === 0) {
    for (const cls of ['bg-primary', 'bg-card', 'bg-background', 'text-muted-foreground', 'bg-accent', 'border-border']) {
      const probe = document.createElement('div');
      probe.className = cls;
      probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px';
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      colores['sonda ' + cls] = cls.startsWith('text')
        ? cs.color
        : cls.startsWith('border')
          ? cs.borderTopColor + ' / ' + cs.borderTopWidth
          : cs.backgroundColor;
      probe.remove();
    }
  }
  return JSON.stringify({
    url: location.pathname,
    viewport: vw,
    desbordeHorizontal: document.documentElement.scrollWidth - vw,
    sobresalenTotal: sobresalen.length,
    sobresalen: sobresalen.slice(0, 8),
    toquesBajosTotal: toques.length,
    toquesBajos: toques.slice(0, 8),
    coloresSistema: colores,
  });
})()`;

// ─── Lanzar el navegador ───
const hijo = spawn(
  NAVEGADOR,
  [
    '--headless',
    `--remote-debugging-port=${PUERTO}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-dev-shm-usage',
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function esperarNavegador() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PUERTO}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch { /* todavía no escucha */ }
    await dormir(250);
  }
  throw new Error('El navegador no abrió el puerto de depuración');
}

const wsUrl = await esperarNavegador();
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', rej, { once: true });
});

let siguienteId = 1;
const pendientes = new Map();
const eventos = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pendientes.has(msg.id)) {
    const { resolver, rechazar } = pendientes.get(msg.id);
    pendientes.delete(msg.id);
    msg.error ? rechazar(new Error(JSON.stringify(msg.error))) : resolver(msg.result);
  } else if (msg.method) {
    eventos.push(msg.method);
  }
});

function enviar(method, params = {}, sessionId) {
  const id = siguienteId++;
  const payload = { id, method, params };
  if (sessionId) payload.sessionId = sessionId;
  ws.send(JSON.stringify(payload));
  return new Promise((resolver, rechazar) => pendientes.set(id, { resolver, rechazar }));
}

const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
await enviar('Page.enable', {}, sessionId);
await enviar('Runtime.enable', {}, sessionId);

if (COOKIE) {
  const [nombre, ...resto] = COOKIE.split('=');
  const { hostname } = new URL(URL_OBJETIVO);
  await enviar('Network.enable', {}, sessionId);
  await enviar(
    'Network.setCookie',
    { name: nombre, value: resto.join('='), domain: hostname, path: '/', httpOnly: true, secure: false },
    sessionId
  );
}

mkdirSync(SALIDA, { recursive: true });
const informe = [];

for (const ancho of ANCHURAS) {
  await enviar(
    'Emulation.setDeviceMetricsOverride',
    { width: ancho, height: ancho < 500 ? 844 : ancho < 900 ? 1180 : 900, deviceScaleFactor: 1, mobile: ancho < 900 },
    sessionId
  );
  await enviar('Page.navigate', { url: URL_OBJETIVO }, sessionId);
  await dormir(ESPERA_MS);

  if (ARCHIVO_PASO) {
    const paso = readFileSync(ARCHIVO_PASO, 'utf8');
    const res = await enviar('Runtime.evaluate', { expression: paso, awaitPromise: true, returnByValue: true }, sessionId);
    console.log(`  paso de navegación → ${res.result?.value ?? '(sin valor)'}`);
    await dormir(ESPERA_MS);
  }

  const { result } = await enviar('Runtime.evaluate', { expression: AUDITORIA, returnByValue: true }, sessionId);
  const datos = JSON.parse(result.value);
  const captura = await enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
  const archivo = join(SALIDA, `w${ancho}.png`);
  writeFileSync(archivo, Buffer.from(captura.data, 'base64'));
  informe.push({ ...datos, captura: archivo });
  console.log(`\n── ${ancho}px ──`);
  console.log(`  desborde horizontal: ${datos.desbordeHorizontal}px`);
  console.log(`  elementos que sobresalen: ${datos.sobresalenTotal}`);
  datos.sobresalen.forEach((s) => console.log(`     ${s.sel} → right=${s.right} (ancho ${s.w}) "${s.txt}"`));
  console.log(`  objetivos táctiles < 44px: ${datos.toquesBajosTotal}`);
  datos.toquesBajos.forEach((t) => console.log(`     "${t.txt}" ${t.w}x${t.h}`));
  console.log(`  colores del sistema: ${JSON.stringify(datos.coloresSistema)}`);
  console.log(`  captura: ${archivo}`);
}

writeFileSync(join(SALIDA, 'informe.json'), JSON.stringify(informe, null, 2));
ws.close();
hijo.kill();
process.exit(0);
