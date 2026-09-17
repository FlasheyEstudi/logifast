/**
 * Diagnóstico: ¿por qué la regla de 44 px no alcanza a todos los controles?
 * Devuelve el tipo real de los elementos pequeños y si el CSS les está llegando.
 */
(async () => {
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  // Ir a Explorar (es la pantalla con más controles chicos: los chips de categoría)
  const contenedor = document.querySelector('[aria-label="Navegación principal de cliente"]');
  const botones = contenedor ? [...contenedor.querySelectorAll('button')] : [];
  if (botones[1]) {
    botones[1].click();
    await dormir(1200);
  }

  const chicos = [...document.querySelectorAll('button, a, [role="button"], summary, select')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { el, r };
    })
    .filter((x) => x.r.width > 0 && x.r.height > 0 && x.r.height < 44)
    .slice(0, 4);

  const info = chicos.map(({ el, r }) => {
    const cs = getComputedStyle(el);
    const ancestro = (() => {
      let p = el.parentElement;
      for (let i = 0; i < 6 && p; i++, p = p.parentElement) {
        if (typeof p.className === 'string' && p.className.trim()) return p.tagName.toLowerCase() + '.' + p.className.trim().split(/\s+/).slice(0, 3).join('.');
      }
      return '(sin clase)';
    })();
    return {
      tag: el.tagName.toLowerCase(),
      clase: typeof el.className === 'string' ? el.className.trim().slice(0, 40) : '',
      alto: Math.round(r.height),
      minHeightCSS: cs.minHeight,
      heightCSS: cs.height,
      ancestro,
    };
  });

  const contenido = document.querySelector('.lf-ios-content');
  const primerBoton = contenido ? contenido.querySelector('button') : null;

  return JSON.stringify({
    hayLfIosContent: !!contenido,
    minHeightPrimerBoton: primerBoton ? getComputedStyle(primerBoton).minHeight : null,
    chicos: info,
  });
})();
