'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  Download,
  Share2,
  Trash2,
  Eye,
  X,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
} from '@/components/icons';
import {
  type ReporteGuardado,
  type FormatoReporte,
  obtenerReportes,
  eliminarReporte,
  eliminarTodosReportes,
  abrirReporte,
  base64ToBlob,
} from '@/lib/tienda/reportes-storage';
import { notify } from '@/lib/notify';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TiendaReportesManagerProps {
  isDark: boolean;
  onGenerarNuevo?: () => void;
}

export function TiendaReportesManager({ isDark, onGenerarNuevo }: TiendaReportesManagerProps) {
  const [reportes, setReportes] = useState<ReporteGuardado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [formatoFiltro, setFormatoFiltro] = useState<'todos' | FormatoReporte>('todos');
  const [reporteParaBorrar, setReporteParaBorrar] = useState<ReporteGuardado | null>(null);
  const [confirmandoBorrarTodo, setConfirmandoBorrarTodo] = useState(false);
  const [reportePdfPreview, setReportePdfPreview] = useState<ReporteGuardado | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [reporteCsvPreview, setReporteCsvPreview] = useState<ReporteGuardado | null>(null);
  const [abriendoId, setAbriendoId] = useState<string | null>(null);

  const cargarLista = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await obtenerReportes();
      setReportes(lista);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarLista();

    const handleReporteGuardado = () => {
      cargarLista();
    };

    window.addEventListener('logifast:reporteGuardado', handleReporteGuardado);
    return () => {
      window.removeEventListener('logifast:reporteGuardado', handleReporteGuardado);
    };
  }, [cargarLista]);

  // Manejar creación y revocación de Blob URL para el visor PDF
  useEffect(() => {
    if (reportePdfPreview) {
      try {
        const blob = base64ToBlob(reportePdfPreview.base64, 'application/pdf');
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        return () => {
          URL.revokeObjectURL(url);
          setPdfBlobUrl(null);
        };
      } catch (e) {
        console.error('Error al preparar preview PDF:', e);
      }
    } else {
      setPdfBlobUrl(null);
    }
  }, [reportePdfPreview]);

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((r) => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda =
        !q ||
        r.nombre.toLowerCase().includes(q) ||
        r.titulo.toLowerCase().includes(q) ||
        r.tipo.toLowerCase().includes(q);

      const matchFormato = formatoFiltro === 'todos' || r.formato === formatoFiltro;
      return matchBusqueda && matchFormato;
    });
  }, [reportes, busqueda, formatoFiltro]);

  const totalBytes = useMemo(() => {
    return reportes.reduce((acc, r) => acc + (r.tamanoBytes || 0), 0);
  }, [reportes]);

  const totalTamanoFormateado = useMemo(() => {
    if (totalBytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(totalBytes) / Math.log(k));
    return `${parseFloat((totalBytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, [totalBytes]);

  const handleAbrir = async (reporte: ReporteGuardado) => {
    if (reporte.formato === 'pdf') {
      setReportePdfPreview(reporte);
      return;
    }

    if (reporte.formato === 'csv') {
      setReporteCsvPreview(reporte);
      return;
    }

    // Para Excel (.xlsx)
    setAbriendoId(reporte.id);
    try {
      await abrirReporte(reporte);
      notify.success(`Abriendo ${reporte.nombre}`);
    } catch {
      notify.error('No se pudo abrir el archivo');
    } finally {
      setAbriendoId(null);
    }
  };

  const handleCompartir = async (reporte: ReporteGuardado) => {
    setAbriendoId(reporte.id);
    try {
      await abrirReporte(reporte);
    } catch {
      notify.error('Error al compartir reporte');
    } finally {
      setAbriendoId(null);
    }
  };

  const handleEliminarUno = async (reporte: ReporteGuardado) => {
    try {
      await eliminarReporte(reporte.id);
      setReportes((prev) => prev.filter((r) => r.id !== reporte.id));
      notify.success('Reporte eliminado del almacenamiento');
    } catch {
      notify.error('No se pudo eliminar el reporte');
    } finally {
      setReporteParaBorrar(null);
    }
  };

  const handleEliminarTodo = async () => {
    try {
      await eliminarTodosReportes();
      setReportes([]);
      notify.success('Historial de reportes limpiado');
    } catch {
      notify.error('No se pudo limpiar el historial');
    } finally {
      setConfirmandoBorrarTodo(false);
    }
  };

  // Formatear fecha amigable
  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-NI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Icono y color por formato
  const getFormatoBadge = (formato: FormatoReporte) => {
    switch (formato) {
      case 'xlsx':
        return {
          label: 'EXCEL',
          ext: '.xlsx',
          icon: <FileSpreadsheet size={16} className="text-emerald-500" />,
          bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          accentColor: '#10B981',
        };
      case 'pdf':
        return {
          label: 'PDF',
          ext: '.pdf',
          icon: <FileText size={16} className="text-rose-500" />,
          bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
          accentColor: '#EF4444',
        };
      case 'csv':
        return {
          label: 'CSV',
          ext: '.csv',
          icon: <SlidersHorizontal size={16} className="text-blue-500" />,
          bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
          accentColor: '#3B82F6',
        };
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ─── BARRA DE CONTROL SUPERIOR ─── */}
      <div className="p-5 rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-[var(--text)]">
                Reportes Descargados & Guardados
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                {reportes.length}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Archivos guardados en el almacenamiento del dispositivo · Ocupando {totalTamanoFormateado}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cargarLista}
              className="w-9 h-9 rounded-full bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer flex items-center justify-center border border-slate-200/60 dark:border-slate-800/60"
              title="Refrescar lista"
            >
              <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
            </button>

            {reportes.length > 0 && (
              <button
                onClick={() => setConfirmandoBorrarTodo(true)}
                className="px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <Trash2 size={13} />
                <span>Borrar todo</span>
              </button>
            )}

            {onGenerarNuevo && (
              <button
                onClick={onGenerarNuevo}
                className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                <Download size={13} />
                <span>Generar Reporte</span>
              </button>
            )}
          </div>
        </div>

        {/* Buscador y Filtros por Formato */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
          <div className="flex-1 relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Buscar por nombre de archivo o título..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-9 h-11 rounded-full bg-[var(--bg-alt)] border border-slate-200/70 dark:border-slate-800/70 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-primary/20 shadow-xs transition-colors"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={formatoFiltro === 'todos' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFormatoFiltro('todos')}
              className="h-8 rounded-full text-xs font-bold px-3.5"
            >
              Todos ({reportes.length})
            </Button>
            <Button
              variant={formatoFiltro === 'xlsx' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFormatoFiltro('xlsx')}
              className="h-8 rounded-full text-xs font-bold px-3.5 gap-1.5"
            >
              <FileSpreadsheet size={13} />
              <span>Excel ({reportes.filter((r) => r.formato === 'xlsx').length})</span>
            </Button>
            <Button
              variant={formatoFiltro === 'pdf' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFormatoFiltro('pdf')}
              className="h-8 rounded-full text-xs font-bold px-3.5 gap-1.5"
            >
              <FileText size={13} />
              <span>PDF ({reportes.filter((r) => r.formato === 'pdf').length})</span>
            </Button>
            <Button
              variant={formatoFiltro === 'csv' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFormatoFiltro('csv')}
              className="h-8 rounded-full text-xs font-bold px-3.5 gap-1.5"
            >
              <SlidersHorizontal size={13} />
              <span>CSV ({reportes.filter((r) => r.formato === 'csv').length})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── LISTA DE REPORTES GUARDADOS ─── */}
      {cargando ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-muted)] font-semibold">
            Cargando historial de reportes...
          </span>
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Download size={26} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)]">
              {busqueda || formatoFiltro !== 'todos'
                ? 'No hay reportes que coincidan con la búsqueda'
                : 'No tienes reportes guardados aún'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1 mx-auto leading-relaxed">
              {busqueda || formatoFiltro !== 'todos'
                ? 'Prueba restableciendo los filtros o buscando por otro término.'
                : 'Genera un nuevo reporte en Excel, PDF o CSV desde la pestaña "Centro de Generación" y quedará guardado permanentemente aquí para abrirlo o compartirlo cuando lo necesites.'}
            </p>
          </div>
          {onGenerarNuevo && (
            <button
              onClick={onGenerarNuevo}
              className="mt-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Generar mi primer reporte</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reportesFiltrados.map((rep) => {
            const badge = getFormatoBadge(rep.formato);
            const isAbriendo = abriendoId === rep.id;

            return (
              <div
                key={rep.id}
                className="p-4 sm:p-5 rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 hover:border-primary/40 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Info Principal */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${badge.bg}`}
                  >
                    {badge.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                        {rep.titulo}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-1 flex-wrap font-mono">
                      <span className="truncate max-w-[200px] sm:max-w-[280px]" title={rep.nombre}>
                        {rep.nombre}
                      </span>
                      <span>•</span>
                      <span>{rep.tamanoFormateado}</span>
                      <span>•</span>
                      <span>{formatearFecha(rep.fecha)}</span>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                  {rep.formato === 'pdf' ? (
                    <>
                      <button
                        onClick={() => handleCompartir(rep)}
                        disabled={isAbriendo}
                        className="px-4 py-2 rounded-full bg-primary hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        title="Abrir con lector PDF de la tablet / celular"
                      >
                        <FileText size={14} />
                        <span>Abrir PDF</span>
                      </button>

                      <button
                        onClick={() => handleAbrir(rep)}
                        disabled={isAbriendo}
                        className="px-3.5 py-2 rounded-full bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text)] border border-slate-200/70 dark:border-slate-800/70 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        title="Ver en modal de la aplicación"
                      >
                        <Eye size={13} />
                        <span>Ver</span>
                      </button>
                    </>
                  ) : rep.formato === 'csv' ? (
                    <>
                      <button
                        onClick={() => handleAbrir(rep)}
                        disabled={isAbriendo}
                        className="px-4 py-2 rounded-full bg-primary hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Eye size={14} />
                        <span>Ver Tabla</span>
                      </button>

                      <button
                        onClick={() => handleCompartir(rep)}
                        disabled={isAbriendo}
                        className="w-9 h-9 rounded-full bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text)] border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                        title="Abrir con app externa o compartir"
                      >
                        <Share2 size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAbrir(rep)}
                        disabled={isAbriendo}
                        className="px-4 py-2 rounded-full bg-primary hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        title="Abrir en Microsoft Excel, Google Sheets u Office"
                      >
                        <FileSpreadsheet size={14} />
                        <span>Abrir en Excel</span>
                      </button>

                      <button
                        onClick={() => handleCompartir(rep)}
                        disabled={isAbriendo}
                        className="w-9 h-9 rounded-full bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text)] border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                        title="Compartir reporte"
                      >
                        <Share2 size={14} />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setReporteParaBorrar(rep)}
                    className="w-9 h-9 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    title="Eliminar del almacenamiento"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL DE CONFIRMACIÓN PARA BORRAR UN REPORTE ─── */}
      <AnimatePresence>
        {reporteParaBorrar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-black tracking-tight text-[var(--text)]">
                  ¿Eliminar este reporte?
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 break-words">
                  Se eliminará <strong>{reporteParaBorrar.nombre}</strong> del almacenamiento local de la app.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setReporteParaBorrar(null)}
                  className="flex-1 h-11 rounded-full bg-[var(--bg-alt)] text-[var(--text)] text-xs font-bold hover:bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEliminarUno(reporteParaBorrar)}
                  className="flex-1 h-11 rounded-full bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 cursor-pointer shadow-md shadow-rose-500/20 active:scale-95"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DE CONFIRMACIÓN PARA BORRAR TODO ─── */}
      <AnimatePresence>
        {confirmandoBorrarTodo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-black tracking-tight text-[var(--text)]">
                  ¿Borrar todo el historial?
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Se eliminarán los {reportes.length} reportes guardados ({totalTamanoFormateado}). Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmandoBorrarTodo(false)}
                  className="flex-1 h-11 rounded-full bg-[var(--bg-alt)] text-[var(--text)] text-xs font-bold hover:bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarTodo}
                  className="flex-1 h-11 rounded-full bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 cursor-pointer shadow-md shadow-rose-500/20 active:scale-95"
                >
                  Eliminar todo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL VISOR INTEGRADO DE PDF ─── */}
      <AnimatePresence>
        {reportePdfPreview && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex-1 flex flex-col w-full max-w-5xl mx-auto rounded-2xl sm:rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden"
            >
              {/* Header del visor */}
              <div className="p-3 sm:p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--surface)] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                      {reportePdfPreview.nombre}
                    </h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {reportePdfPreview.tamanoFormateado} · {formatearFecha(reportePdfPreview.fecha)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCompartir(reportePdfPreview)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--primario)] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Share2 size={13} />
                    <span className="hidden sm:inline">Abrir en App Externa / Compartir</span>
                  </button>

                  <button
                    onClick={() => setReportePdfPreview(null)}
                    className="p-1.5 rounded-xl bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text)] transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Contenedor del PDF con barra de compatibilidad móvil */}
              <div className="flex-1 w-full bg-slate-900 overflow-hidden relative flex flex-col">
                <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between gap-3 text-white text-xs">
                  <span className="text-[11px] text-slate-300">
                    ¿No visualizas el documento aquí abajo?
                  </span>
                  <button
                    onClick={() => handleCompartir(reportePdfPreview)}
                    className="px-3 py-1 rounded-lg bg-[var(--primario)] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 cursor-pointer shadow-xs"
                  >
                    <ArrowUpRight size={14} />
                    <span>Abrir con Visor del Dispositivo</span>
                  </button>
                </div>
                <div className="flex-1 w-full relative">
                  {pdfBlobUrl ? (
                    <iframe
                      src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                      className="w-full h-full border-none"
                      title={reportePdfPreview.nombre}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white text-xs">
                      Cargando visor PDF...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL VISOR DE CSV EN TABLA ─── */}
      <AnimatePresence>
        {reporteCsvPreview && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex-1 flex flex-col w-full max-w-5xl mx-auto rounded-2xl sm:rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden"
            >
              <div className="p-3 sm:p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--surface)] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                    <SlidersHorizontal size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                      {reporteCsvPreview.nombre}
                    </h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      Visualizador de datos CSV
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCompartir(reporteCsvPreview)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--primario)] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Share2 size={13} />
                    <span>Compartir</span>
                  </button>

                  <button
                    onClick={() => setReporteCsvPreview(null)}
                    className="p-1.5 rounded-xl bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text)] transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Tabla de datos CSV */}
              <div className="flex-1 p-4 overflow-auto bg-[var(--bg)]">
                {(() => {
                  try {
                    const text = atob(reporteCsvPreview.base64);
                    const lines = text.split('\n').filter((l) => l.trim().length > 0);
                    const header = lines[0]?.split(',').map((h) => h.replace(/^"|"$/g, '')) || [];
                    const rows = lines.slice(1).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '')));

                    return (
                      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[var(--bg-alt)] border-b border-[var(--border)]">
                              {header.map((col, idx) => (
                                <TableHead
                                  key={idx}
                                  className="p-2.5 font-bold text-[var(--text)] uppercase text-[10px] font-mono whitespace-nowrap"
                                >
                                  {col}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((row, rIdx) => (
                              <TableRow
                                key={rIdx}
                                className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-alt)]/50 font-mono text-[11px]"
                              >
                                {row.map((cell, cIdx) => (
                                  <TableCell key={cIdx} className="p-2.5 whitespace-nowrap text-[var(--text)]">
                                    {cell}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  } catch {
                    return (
                      <div className="text-center p-8 text-xs text-[var(--text-muted)]">
                        No se pudo procesar el contenido de este archivo CSV.
                      </div>
                    );
                  }
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
