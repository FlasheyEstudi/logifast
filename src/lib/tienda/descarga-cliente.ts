/**
 * Descarga y almacenamiento persistente de reportes de tienda.
 *
 * Compartido por el Panel (dashboard) y el módulo de Reportes.
 * Guarda en IndexedDB para el gestor de reportes interno y en el sistema de
 * archivos nativo (Capacitor) con permisos en Android / iOS.
 */

import {
  type FormatoReporte,
  type TipoReporteDescarga,
  type ReporteGuardado,
  guardarReporte,
  blobToBase64,
  formatearTamano,
  obtenerMimeType,
  guardarArchivoEnDispositivo,
  abrirReporte,
} from './reportes-storage';
import { Capacitor } from '@capacitor/core';

export { type FormatoReporte, type TipoReporteDescarga };

const TITULOS_REPORTES: Record<TipoReporteDescarga, string> = {
  ventas: 'Reporte de Ventas en Caja POS',
  inventario: 'Reporte Completo de Inventario & Stock',
  kardex: 'Reporte de Movimientos Kardex & Auditoría',
};

export async function descargarReporteTienda(
  tipo: TipoReporteDescarga,
  formato: FormatoReporte = 'xlsx',
  dias = 30
): Promise<string> {
  const ruta = formato === 'csv' ? '/api/tienda/reportes/excel' : `/api/tienda/reportes/${formato}`;
  const res = await fetch(`${ruta}?tipo=${tipo}&dias=${dias}`);
  if (!res.ok) throw new Error('No se pudo generar el reporte desde el servidor');

  const disposicion = res.headers.get('Content-Disposition') || '';
  const coincidencia = disposicion.match(/filename="([^"]+)"/);
  const nombre = coincidencia?.[1] || `Reporte-${tipo}-${new Date().toISOString().slice(0, 10)}.${formato}`;

  const blob = await res.blob();
  const mimeType = obtenerMimeType(formato);
  const base64 = await blobToBase64(blob);
  const tamanoBytes = blob.size;
  const tamanoFormateado = formatearTamano(tamanoBytes);

  const periodoTexto = dias === 0 ? 'Histórico Completo' : dias === 1 ? 'Hoy' : `${dias} días`;
  const titulo = `${TITULOS_REPORTES[tipo]} (${periodoTexto})`;

  // Guardar físicamente en Android/iOS si corre nativamente
  let rutaNativa: string | undefined;
  if (Capacitor.isNativePlatform()) {
    try {
      rutaNativa = (await guardarArchivoEnDispositivo(nombre, base64, mimeType)) || undefined;
    } catch (e) {
      console.warn('[DescargaCliente] Error al guardar físicamente en dispositivo:', e);
    }
  }

  // Objeto de reporte estructurado para la base de datos local
  const reporteGuardado: ReporteGuardado = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    nombre,
    titulo,
    tipo,
    formato,
    tamanoBytes,
    tamanoFormateado,
    fecha: new Date().toISOString(),
    diasPeriodo: dias,
    base64,
    mimeType,
    rutaNativa,
  };

  // Guardar en IndexedDB para disponibilidad offline y en la app
  try {
    await guardarReporte(reporteGuardado);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('logifast:reporteGuardado', { detail: reporteGuardado })
      );
    }
  } catch (errDb) {
    console.error('[DescargaCliente] Error al indexar reporte en IndexedDB:', errDb);
  }

  // En móvil nativo, abrir menú de compartir / selector de app
  if (Capacitor.isNativePlatform() && rutaNativa) {
    try {
      await abrirReporte(reporteGuardado);
    } catch (errOpen) {
      console.warn('[DescargaCliente] Error al disparar Share nativo:', errOpen);
    }
  } else if (typeof window !== 'undefined') {
    // Fallback web tradicional de descarga automática
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (errWeb) {
      console.error('[DescargaCliente] Error en descarga web:', errWeb);
    }
  }

  return nombre;
}
