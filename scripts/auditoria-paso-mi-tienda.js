/**
 * Paso de navegación para la auditoría: entra a "Mi Tienda" desde la app del cliente
 * (hoy es la única puerta al portal de tienda, porque el rol de tienda no existe aún).
 *
 * Notas del DOM real: el nav usa <div> con manejadores de React, y el disparador del
 * menú es un <summary> (details/summary), no un <button>. Por eso se busca por texto
 * en cualquier elemento y se hace clic en el nodo más pequeño que lo contenga.
 */
(async () => {
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

  const porTextoExacto = (texto) =>
    [...document.querySelectorAll('div, span, li, button, a, p, summary')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (e.textContent || '').trim() === texto;
      })
      .sort((a, b) => a.clientHeight - b.clientHeight);

  const porTextoParcial = (texto) =>
    [...document.querySelectorAll('div, span, li, button, a, p, summary')].filter((e) => {
      const r = e.getBoundingClientRect();
      return (
        r.width > 0 &&
        r.height > 0 &&
        ((e.textContent || '').trim() === texto || (e.getAttribute('aria-label') || '').includes(texto))
      );
    });

  const pasos = [];

  let objetivos = porTextoExacto('Mi Tienda');
  if (objetivos.length === 0) {
    const menú = porTextoParcial('Abrir Menú')[0];
    if (menú) {
      menú.click();
      pasos.push('abrí el menú (' + menú.tagName.toLowerCase() + ')');
      await dormir(900);
      objetivos = porTextoExacto('Mi Tienda');
    } else {
      pasos.push('no encontré el disparador del menú');
    }
  }

  if (objetivos.length > 0) {
    objetivos[0].click();
    pasos.push(`clic en Mi Tienda (${objetivos.length} coincidencias)`);
    await dormir(1600);
    pasos.push('encabezado: ' + ((document.querySelector('h1, h2, h3')?.textContent || '').trim().slice(0, 44) || '(ninguno)'));
  } else {
    pasos.push(
      'sin "Mi Tienda" visible; textos cortos en pantalla: ' +
        [...document.querySelectorAll('div, span, li, button, a, summary')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (e.textContent || '').trim().length < 14;
          })
          .map((e) => (e.textContent || '').trim())
          .filter(Boolean)
          .slice(0, 32)
          .join(' | ')
    );
  }
  return pasos.join(' ;; ');
})();
