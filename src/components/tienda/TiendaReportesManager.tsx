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
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';
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

  // Tinte, borde e icono por formato (siempre tokens del sistema, sin hex)
  const getFormatoBadge = (formato: FormatoReporte) => {
    switch (formato) {
      case 'xlsx':
        return {
          label: 'EXCEL',
          icon: <FileSpreadsheet size={16} className="text-[var(--exito)]" />,
          tinte: 'bg-[var(--exito)]/15 text-[var(--exito)]',
          borde: 'border-[var(--exito)]',
        };
      case 'pdf':
        return {
          label: 'PDF',
          icon: <FileText size={16} className="text-[var(--peligro)]" />,
          tinte: 'bg-[var(--peligro)]/15 text-[var(--peligro)]',
          borde: 'border-[var(--peligro)]',
        };
      case 'csv':
        return {
          label: 'CSV',
          icon: <SlidersHorizontal size={16} className="text-[var(--primario)]" />,
          tinte: 'bg-[var(--primario)]/15 text-[var(--primario)]',
          borde: 'border-[var(--primario)]',
        };
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ─── BARRA DE CONTROL SUPERIOR ─── */}
      <div className="p-4 sm:p-5 rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-[var(--text)]">
                Reportes Descargados & Guardados
              </span>
              <Badge variant="secondary" className="rounded-full font-mono text-[11px] font-bold">
                {reportes.length}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Archivos guardados en el almacenamiento del dispositivo · Ocupando {totalTamanoFormateado}
            </p>
          </div>

          {/* Una sola acción primaria: Generar Reporte */}
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={cargarLista}
              title="Refrescar lista"
              className="size-11 sm:size-10 rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-alt)] hover:text-[var(--text)]"
            >
              <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
            </Button>

            {reportes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmandoBorrarTodo(true)}
                className="h-11 sm:h-10 rounded-full gap-1.5 border-[var(--peligro)] text-[var(--peligro)] hover:bg-[var(--peligro)]/10 text-xs font-bold"
              >
                <Trash2 size={13} />
                <span>Borrar todo</span>
              </Button>
            )}

            {onGenerarNuevo && (
              <Button
                size="sm"
                onClick={onGenerarNuevo}
                className="h-11 sm:h-10 rounded-full gap-1.5 text-xs font-bold shadow-[var(--lf-shadow-card)]"
              >
                <Download size={13} />
                <span>Generar Reporte</span>
              </Button>
            )}
          </div>
        </div>

        {/* Buscador y Filtros por Formato */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-3 border-t border-[var(--border)]">
          <div className="flex-1 relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <Input
              type="text"
              placeholder="Buscar por nombre de archivo o título..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-11 rounded-full border-[var(--border)] bg-[var(--bg-alt)] pl-10 pr-9 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer"
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
              className="h-11 sm:h-10 rounded-full text-xs font-bold px-3.5"
            >
              Todos ({reportes.length})
            </Button>
            <Button
              variant={formatoFiltro === 'xlsx' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFormatoFiltro('xlsx')}
              className="h-11 sm:h-10 rounded-full text-xs font-bold px-3.5 gap-1.5"
            >
              <FileSpreadsheet size={13} />
              <span>Excel ({reportes.filter((r) => r.formato === 'xlsx').length})</span>
            </Button>
            <Button
              variant={formatoFiltro === 'pdf' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFormatoFiltro('pdf')}
              className="h-11 sm:h-10 rounded-full text-xs font-bold px-3.5 gap-1.5"
            >
              <FileText size={13} />
              <span>PDF ({reportes.filter((r) => r.formato === 'pdf').length})</span>
            </Button>
            <Button
              variant={formatoFiltro === 'csv' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFormatoFiltro('csv')}
              className="h-11 sm:h-10 rounded-full text-xs font-bold px-3.5 gap-1.5"
            >
              <SlidersHorizontal size={13} />
              <span>CSV ({reportes.filter((r) => r.formato === 'csv').length})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── LISTA DE REPORTES GUARDADOS ─── */}
      {cargando ? (
        <div className="space-y-3" aria-busy="true">
          <p className="text-xs text-[var(--text-muted)] font-semibold">
            Cargando historial de reportes...
          </p>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] flex items-center gap-3.5"
            >
              <Skeleton className="h-11 w-11 shrink-0 rounded-[var(--lf-card-radius)]" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-48 rounded-full" />
                <Skeleton className="h-3 w-64 max-w-full rounded-full" />
              </div>
              <Skeleton className="hidden h-10 w-28 shrink-0 rounded-full sm:block" />
            </div>
          ))}
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <Card className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)]">
          <CardContent className="p-0">
            <EmptyState
              icono={<Download size={26} />}
              titulo={
                busqueda || formatoFiltro !== 'todos'
                  ? 'No hay reportes que coincidan con la búsqueda'
                  : 'No tienes reportes guardados aún'
              }
              descripcion={
                busqueda || formatoFiltro !== 'todos'
                  ? 'Prueba restableciendo los filtros o buscando por otro término.'
                  : 'Genera un nuevo reporte en Excel, PDF o CSV desde la pestaña "Centro de Generación" y quedará guardado permanentemente aquí para abrirlo o compartirlo cuando lo necesites.'
              }
              accion={onGenerarNuevo ? { label: 'Generar mi primer reporte', onClick: onGenerarNuevo } : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reportesFiltrados.map((rep) => {
            const badge = getFormatoBadge(rep.formato);
            const isAbriendo = abriendoId === rep.id;

            return (
              <Card
                key={rep.id}
                className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)] transition-shadow hover:shadow-[var(--lf-shadow-float)]"
              >
                <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                  {/* Info Principal */}
                  <div className="flex items-start gap-3.5 min-w-0 sm:items-center">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--lf-card-radius)] ${badge.tinte}`}
                    >
                      {badge.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[var(--text)] truncate">
                          {rep.titulo}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-mono font-bold uppercase rounded-full ${badge.tinte} ${badge.borde}`}
                        >
                          {badge.label}
                        </Badge>
                        {isAbriendo ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-bold rounded-full border-[var(--warning)] text-[var(--warning)] gap-1"
                          >
                            <RefreshCw size={11} className="animate-spin" /> Generando
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-bold rounded-full border-[var(--exito)] text-[var(--exito)] gap-1"
                          >
                            <CheckCircle size={11} /> Listo
                          </Badge>
                        )}
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

                  {/* Acciones: una primaria por tarjeta, el resto outline/ghost */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                    {rep.formato === 'pdf' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleCompartir(rep)}
                          disabled={isAbriendo}
                          title="Abrir con lector PDF de la tablet / celular"
                          className="h-11 sm:h-10 rounded-full px-4 text-xs font-bold gap-1.5 shadow-[var(--lf-shadow-card)]"
                        >
                          <FileText size={14} />
                          <span>Abrir PDF</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAbrir(rep)}
                          disabled={isAbriendo}
                          title="Ver en modal de la aplicación"
                          className="h-11 sm:h-10 rounded-full px-3.5 text-xs font-bold gap-1.5 border-[var(--border)] hover:bg-[var(--bg-alt)]"
                        >
                          <Eye size={13} />
                          <span>Ver</span>
                        </Button>
                      </>
                    ) : rep.formato === 'csv' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAbrir(rep)}
                          disabled={isAbriendo}
                          className="h-11 sm:h-10 rounded-full px-4 text-xs font-bold gap-1.5 shadow-[var(--lf-shadow-card)]"
                        >
                          <Eye size={14} />
                          <span>Ver Tabla</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCompartir(rep)}
                          disabled={isAbriendo}
                          title="Abrir con app externa o compartir"
                          className="size-11 sm:size-10 rounded-full border-[var(--border)] hover:bg-[var(--bg-alt)]"
                        >
                          <Share2 size={14} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAbrir(rep)}
                          disabled={isAbriendo}
                          title="Abrir en Microsoft Excel, Google Sheets u Office"
                          className="h-11 sm:h-10 rounded-full px-4 text-xs font-bold gap-1.5 shadow-[var(--lf-shadow-card)]"
                        >
                          <FileSpreadsheet size={14} />
                          <span>Abrir en Excel</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCompartir(rep)}
                          disabled={isAbriendo}
                          title="Compartir reporte"
                          className="size-11 sm:size-10 rounded-full border-[var(--border)] hover:bg-[var(--bg-alt)]"
                        >
                          <Share2 size={14} />
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setReporteParaBorrar(rep)}
                      title="Eliminar del almacenamiento"
                      className="size-11 sm:size-10 rounded-full text-[var(--peligro)] hover:bg-[var(--peligro)]/10 hover:text-[var(--peligro)]"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
              className="w-full max-w-sm rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--lf-shadow-float)] space-y-4"
            >
              <div className="w-12 h-12 rounded-[var(--lf-card-radius)] bg-[var(--peligro)]/15 text-[var(--peligro)] flex items-center justify-center mx-auto">
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
                  className="flex-1 h-11 rounded-full bg-[var(--bg-alt)] text-[var(--text)] text-xs font-bold hover:bg-[var(--surface)] border border-[var(--border)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEliminarUno(reporteParaBorrar)}
                  className="flex-1 h-11 rounded-full bg-[var(--peligro)] text-white text-xs font-bold hover:bg-[var(--peligro)]/90 cursor-pointer shadow-[var(--lf-shadow-card)] shadow-[var(--peligro)]/20 active:scale-95"
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
              className="w-full max-w-sm rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--lf-shadow-float)] space-y-4"
            >
              <div className="w-12 h-12 rounded-[var(--lf-card-radius)] bg-[var(--peligro)]/15 text-[var(--peligro)] flex items-center justify-center mx-auto">
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
                  className="flex-1 h-11 rounded-full bg-[var(--bg-alt)] text-[var(--text)] text-xs font-bold hover:bg-[var(--surface)] border border-[var(--border)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarTodo}
                  className="flex-1 h-11 rounded-full bg-[var(--peligro)] text-white text-xs font-bold hover:bg-[var(--peligro)]/90 cursor-pointer shadow-[var(--lf-shadow-card)] shadow-[var(--peligro)]/20 active:scale-95"
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
              className="flex-1 flex flex-col w-full max-w-5xl mx-auto rounded-[var(--lf-card-radius)] sm:rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-float)] overflow-hidden"
            >
              {/* Header del visor */}
              <div className="p-3 sm:p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--surface)] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--peligro)]/15 text-[var(--peligro)] flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                      {reportePdfPreview.nombre}
                    </h4>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {reportePdfPreview.tamanoFormateado} · {formatearFecha(reportePdfPreview.fecha)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCompartir(reportePdfPreview)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--primario)] text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-[var(--lf-shadow-card)] cursor-pointer active:scale-95"
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
              <div className="flex-1 w-full bg-[var(--bg-alt)] overflow-hidden relative flex flex-col">
                <div className="px-4 py-2 bg-[var(--bg-alt)] border-b border-[var(--border)] flex items-center justify-between gap-3 text-xs">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    ¿No visualizas el documento aquí abajo?
                  </span>
                  <button
                    onClick={() => handleCompartir(reportePdfPreview)}
                    className="px-3 py-1 rounded-lg bg-[var(--primario)] text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 cursor-pointer shadow-[var(--lf-shadow-card)]"
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
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-xs">
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
              className="flex-1 flex flex-col w-full max-w-5xl mx-auto rounded-[var(--lf-card-radius)] sm:rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-float)] overflow-hidden"
            >
              <div className="p-3 sm:p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--surface)] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primario)]/15 text-[var(--primario)] flex items-center justify-center shrink-0">
                    <SlidersHorizontal size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                      {reporteCsvPreview.nombre}
                    </h4>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      Visualizador de datos CSV
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCompartir(reporteCsvPreview)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--primario)] text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-[var(--lf-shadow-card)] cursor-pointer active:scale-95"
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
                      <div className="rounded-[var(--lf-card-radius)] border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[var(--bg-alt)] border-b border-[var(--border)]">
                              {header.map((col, idx) => (
                                <TableHead
                                  key={idx}
                                  className="p-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono whitespace-nowrap"
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
                                className="border-b border-[var(--border)] hover:bg-[var(--bg-alt)] font-mono text-[11px]"
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
