/**
 * Descarga de reportes de tienda desde el navegador.
 *
 * Compartido por el Panel (dashboard) y el módulo de Reportes: una sola
 * implementación del "pedir, nombrar y guardar el archivo" para que no se
 * desincronicen. El nombre del archivo lo decide el servidor.
 */

export type FormatoReporte = 'xlsx' | 'pdf' | 'csv';
export type TipoReporteDescarga = 'ventas' | 'kardex' | 'inventario';

export async function descargarReporteTienda(
  tipo: TipoReporteDescarga,
  formato: FormatoReporte = 'xlsx',
  dias = 30
): Promise<string> {
  const ruta = formato === 'csv' ? '/api/tienda/reportes/excel' : `/api/tienda/reportes/${formato}`;
  const res = await fetch(`${ruta}?tipo=${tipo}&dias=${dias}`);
  if (!res.ok) throw new Error('No se pudo generar el reporte');

  const disposicion = res.headers.get('Content-Disposition') || '';
  const coincidencia = disposicion.match(/filename="([^"]+)"/);
  const nombre = coincidencia?.[1] || `Reporte-${tipo}.${formato}`;

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);

  return nombre;
}
