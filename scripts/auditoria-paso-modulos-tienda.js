/**
 * Paso de auditoría del portal de tienda.
 *
 * El navbar nuevo es vertical y solo muestra la etiqueta del módulo activo, así que
 * se navega por los botones del contenedor de navegación (aside), no por texto.
 */
(async () => {
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

  const medir = () => {
    const ancho = document.documentElement.clientWidth;
    const enScroll = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
      }
      return false;
    };
    let sobresalen = 0;
    let toques = 0;
    const ejemplos = [];
    const toquesEj = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > ancho + 1 && !enScroll(el)) {
        sobresalen++;
        if (ejemplos.length < 3) ejemplos.push(`${el.tagName.toLowerCase()}.${String(el.className || '').trim().split(/\s+/).slice(0, 2).join('.')}@${Math.round(r.right)}`);
      }
    }
    for (const el of document.querySelectorAll('button, a, [role="button"], summary, select')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.height < 44) {
        toques++;
        if (toquesEj.length < 4) toquesEj.push(`${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 16)}[${Math.round(r.width)}x${Math.round(r.height)}]`);
      }
    }
    return { desborde: document.documentElement.scrollWidth - ancho, sobresalen, toques, ejemplos, toquesEj };
  };

  const nav = document.querySelector('aside') || document.querySelector('nav');
  if (!nav) return 'no encontré el navbar del portal';
  // Se excluyen los controles que no son módulos: Salir navega a /api/auth/logout y
  // destruye el contexto de evaluación (el paso se caía con "target navigated").
  const botones = [...nav.querySelectorAll('button')].filter((b) => {
    const etiqueta = (b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent || '').toLowerCase();
    return !/salir|logout|noche|día|dia|tema|cerrar/.test(etiqueta);
  });
  const salida = [`viewport=${document.documentElement.clientWidth}`, `botonesNav=${botones.length}`];

  for (let i = 0; i < botones.length; i++) {
    const etiqueta = (botones[i].getAttribute('aria-label') || botones[i].getAttribute('title') || botones[i].textContent || `mod${i}`).trim().slice(0, 20);
    botones[i].click();
    await dormir(1000);
    const m = medir();
    salida.push(`[${i}] ${etiqueta}: desborde=${m.desborde} sobresalen=${m.sobresalen} toques<44=${m.toques} {${m.toquesEj.join(' ')}}${m.ejemplos.length ? ' [' + m.ejemplos.join(' ') + ']' : ''}`);
  }
  return salida.join(' ;; ');
})();
