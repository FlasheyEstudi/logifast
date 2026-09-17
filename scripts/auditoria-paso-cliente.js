/**
 * Paso de auditoría: recorre las pantallas de la app del cliente en una sola carga.
 * El nav inferior (SlidingPillTabBar) solo muestra la etiqueta de la pestaña activa,
 * así que se navega por los botones del contenedor de navegación, no por texto.
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
        if (toquesEj.length < 3) {
          const t = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18);
          toquesEj.push(`${t}[${Math.round(r.width)}x${Math.round(r.height)}]`);
        }
      }
    }
    return { desborde: document.documentElement.scrollWidth - ancho, sobresalen, toques, ejemplos, toquesEj };
  };

  const contenedor = document.querySelector('[aria-label="Navegación principal de cliente"]');
  if (!contenedor) return 'no encontré la barra de navegación';
  const botones = [...contenedor.querySelectorAll('button')];
  const salida = [`viewport=${document.documentElement.clientWidth}`, `pestañas=${botones.length}`];

  for (let i = 0; i < botones.length; i++) {
    const etiqueta = (botones[i].getAttribute('aria-label') || botones[i].textContent || `tab${i}`).trim().slice(0, 18);
    botones[i].click();
    await dormir(1100);
    const m = medir();
    salida.push(`[${i}] ${etiqueta}: desborde=${m.desborde} sobresalen=${m.sobresalen} toques<44=${m.toques} {${m.toquesEj.join(' ')}}${m.ejemplos.length ? ' [' + m.ejemplos.join(' ') + ']' : ''}`);
  }
  return salida.join(' ;; ');
})();
