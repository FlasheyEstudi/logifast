/**
 * Paso de auditoría: recorre todos los módulos del portal de tienda dentro de la
 * misma carga de página (mucho más rápido que recargar por módulo) y devuelve un
 * resumen compacto por módulo: desborde horizontal, elementos que sobresalen,
 * objetivos táctiles < 44 px y estado del nav (¿caben todas las opciones?).
 */
(async () => {
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const vw = () => document.documentElement.clientWidth;

  const medir = () => {
    const ancho = vw();
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
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > ancho + 1 && !enScroll(el)) {
        sobresalen++;
        if (ejemplos.length < 3) {
          ejemplos.push(`${el.tagName.toLowerCase()}.${String(el.className || '').trim().split(/\s+/).slice(0, 2).join('.')}@${Math.round(r.right)}`);
        }
      }
    }
    for (const el of document.querySelectorAll('button, a, [role="button"], summary')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.height < 44) toques++;
    }
    return { desborde: document.documentElement.scrollWidth - ancho, sobresalen, toques, ejemplos };
  };

  const navs = () => {
    const items = [...document.querySelectorAll('div, span, li, button, a')].filter((e) => {
      const t = (e.textContent || '').trim();
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && /^(Monitor KDS|Caja POS|Inventario|Kardex|Facturación|Reportes|Estadísticas|Perfil|KDS|POS|Stock|DGI|Excel|Gráficas)$/.test(t);
    });
    // El nodo hoja más pequeño de cada etiqueta
    const etiquetas = [...new Set(items.map((e) => (e.textContent || '').trim()))];
    const contenedor = items[0]?.parentElement;
    let scrollNav = false;
    for (let p = contenedor; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll') {
        scrollNav = p.scrollWidth > p.clientWidth + 2;
        break;
      }
    }
    return { etiquetas, scrollNav };
  };

  const clic = async (textos) => {
    for (const t of textos) {
      const el = [...document.querySelectorAll('div, span, li, button, a')]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (e.textContent || '').trim() === t;
        })
        .sort((a, b) => a.clientHeight - b.clientHeight)[0];
      if (el) {
        el.click();
        await dormir(900);
        return t;
      }
    }
    return null;
  };

  const nav = navs();
  const salida = [`viewport=${vw()}`, `nav:[${nav.etiquetas.join(', ')}]`, `navScroll=${nav.scrollNav}`];

  const modulos = [
    ['Monitor KDS', 'KDS'],
    ['Caja POS', 'POS'],
    ['Inventario', 'Stock'],
    ['Kardex', 'Kardex'],
    ['Facturación', 'DGI'],
    ['Reportes', 'Excel'],
    ['Estadísticas', 'Gráficas'],
    ['Perfil'],
  ];

  for (const [largo, corto] of modulos) {
    const entro = await clic(corto ? [largo, corto] : [largo]);
    if (!entro) {
      salida.push(`${largo}: NO ENCONTRADO`);
      continue;
    }
    const m = medir();
    salida.push(`${largo}: desborde=${m.desborde} sobresalen=${m.sobresalen} toques<44=${m.toques}${m.ejemplos.length ? ' [' + m.ejemplos.join(' ') + ']' : ''}`);
  }
  return salida.join(' ;; ');
})();
