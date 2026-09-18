/**
 * reportes-storage.ts
 * Sistema de persistencia e historial de reportes descargados para LogiFast.
 *
 * Utiliza IndexedDB para almacenamiento ilimitado y persistente en el dispositivo
 * (sin el límite de 5MB de localStorage) e integra @capacitor/filesystem y @capacitor/share
 * para guardar y abrir archivos nativos en Android / iOS.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type FormatoReporte = 'xlsx' | 'pdf' | 'csv';
export type TipoReporteDescarga = 'ventas' | 'kardex' | 'inventario';

export interface ReporteGuardado {
  id: string;
  nombre: string;
  titulo: string;
  tipo: TipoReporteDescarga;
  formato: FormatoReporte;
  tamanoBytes: number;
  tamanoFormateado: string;
  fecha: string; // ISO string
  diasPeriodo: number;
  base64: string; // Datos binarios completos en base64
  mimeType: string;
  rutaNativa?: string;
}

const DB_NAME = 'logifast_reportes_db';
const DB_VERSION = 1;
const STORE_NAME = 'reportes';

/* ══════════════════════════════════════════════════════
   INDEXEDDB HELPER (NATIVO, SIN DEPENDENCIAS EXTERNAS)
   ══════════════════════════════════════════════════════ */

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está disponible en este entorno'));
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('fecha', 'fecha', { unique: false });
        store.createIndex('tipo', 'tipo', { unique: false });
        store.createIndex('formato', 'formato', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Guarda o actualiza un reporte en el almacén local persistente.
 */
export async function guardarReporte(reporte: ReporteGuardado): Promise<void> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(reporte);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Obtiene todos los reportes guardados ordenados cronológicamente (más recientes primero).
 */
export async function obtenerReportes(): Promise<ReporteGuardado[]> {
  try {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const lista = (req.result as ReporteGuardado[]) || [];
        // Ordenar por fecha descendente (más reciente primero)
        lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        resolve(lista);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('[ReportesStorage] Error al leer reportes:', err);
    return [];
  }
}

/**
 * Elimina un reporte por su ID.
 */
export async function eliminarReporte(id: string): Promise<void> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Elimina todos los reportes del historial.
 */
export async function eliminarTodosReportes(): Promise<void> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/* ══════════════════════════════════════════════════════
   UTILIDADES DE CONVERSIÓN Y FORMATEO
   ══════════════════════════════════════════════════════ */

export function formatearTamano(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function obtenerMimeType(formato: FormatoReporte): string {
  switch (formato) {
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      // Extraer solo la parte base64 sin el prefijo "data:...;base64,"
      const base64 = res.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/* ══════════════════════════════════════════════════════
   GUARDADO Y APERTURA NATIVA / WEB
   ══════════════════════════════════════════════════════ */

/**
 * Solicita permisos de almacenamiento en Android y guarda el archivo físicamente
 * en el almacenamiento del dispositivo si la app corre en Capacitor.
 */
export async function guardarArchivoEnDispositivo(
  nombre: string,
  base64Data: string,
  _mimeType: string
): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    // 1. Verificar y solicitar permisos de almacenamiento
    try {
      const status = await Filesystem.checkPermissions();
      if (status.publicStorage !== 'granted') {
        await Filesystem.requestPermissions();
      }
    } catch (e) {
      console.warn('[ReportesStorage] Verificación de permisos omitida o no soportada:', e);
    }

    // 2. Guardar en Documentos públicos de la aplicación
    const res = await Filesystem.writeFile({
      path: `Download/${nombre}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });

    return res.uri;
  } catch (err) {
    console.warn('[ReportesStorage] Fallo al escribir en Documents, probando Cache:', err);
    try {
      const resFallback = await Filesystem.writeFile({
        path: nombre,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });
      return resFallback.uri;
    } catch (errFallback) {
      console.error('[ReportesStorage] Error al guardar en almacenamiento nativo:', errFallback);
      return null;
    }
  }
}

/**
 * Abre o comparte el reporte:
 * - En móvil nativo: Utiliza @capacitor/share o visor del sistema operativo.
 * - En web: Descarga el archivo o abre una ventana.
 */
export async function abrirReporte(reporte: ReporteGuardado): Promise<void> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      // Asegurar que el archivo existe en el sistema de archivos
      let fileUri = reporte.rutaNativa;
      if (!fileUri) {
        fileUri = await guardarArchivoEnDispositivo(
          reporte.nombre,
          reporte.base64,
          reporte.mimeType
        ) || undefined;
      }

      if (fileUri) {
        await Share.share({
          title: reporte.nombre,
          url: fileUri,
          files: [fileUri],
          dialogTitle: `Abrir ${reporte.nombre}`,
        });
        return;
      }
    } catch (err) {
      console.warn('[ReportesStorage] Share falló, procediendo a fallback:', err);
    }
  }

  // Fallback web / blob download
  try {
    const blob = base64ToBlob(reporte.base64, reporte.mimeType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reporte.nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {
    console.error('[ReportesStorage] Error al descargar reporte:', e);
  }
}
