/**
 * Paso de auditoría: cambia al modo oscuro usando el botón real de la app
 * (la app aplica el tema con el atributo `data-theme`, no solo con la clase `.dark`).
 */
(async () => {
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const boton =
    document.querySelector('[aria-label="Modo oscuro"]') ||
    document.querySelector('[title="Modo oscuro"]') ||
    [...document.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || '').includes('oscuro'));
  if (!boton) return 'no encontré el botón de modo oscuro';
  boton.click();
  await dormir(1500);
  return `tema aplicado -> data-theme=${document.documentElement.getAttribute('data-theme')} claseDark=${document.documentElement.classList.contains('dark')}`;
})();
