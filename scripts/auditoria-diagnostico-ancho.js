/**
 * Diagnóstico de ancho: ¿qué tan ancho se está estirando el contenido del cliente
 * en escritorio, y cuál es el contenedor que lo decide?
 */
(() => {
  const ancho = document.documentElement.clientWidth;
  const contenedores = [...document.querySelectorAll('div')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        clase: typeof el.className === 'string' ? el.className.trim().slice(0, 48) : '',
        ancho: Math.round(r.width),
        maxWidth: cs.maxWidth,
        marginAuto: cs.marginLeft === cs.marginRight && cs.marginLeft !== '0px',
        padding: cs.paddingLeft + '/' + cs.paddingRight,
      };
    })
    .filter((c) => c.ancho > 0 && c.clase)
    .sort((a, b) => b.ancho - a.ancho)
    .slice(0, 8);

  const raiz = document.querySelector('.lf-ios-app');
  return JSON.stringify({
    viewport: ancho,
    raizAncho: raiz ? Math.round(raiz.getBoundingClientRect().width) : null,
    contenedores,
  });
})();
