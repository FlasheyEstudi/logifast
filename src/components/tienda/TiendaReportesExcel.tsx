'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Package,
  CreditCard,
  SlidersHorizontal,
  Sparkles,
  CheckCircle,
} from '@/components/icons';
import { notify } from '@/lib/notify';
import { descargarReporteTienda } from '@/lib/tienda/descarga-cliente';
import { obtenerReportes } from '@/lib/tienda/reportes-storage';
import { TiendaReportesManager } from './TiendaReportesManager';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TiendaReportesExcel({ isDark }: { isDark: boolean }) {
  const [tabActiva, setTabActiva] = useState<'generar' | 'guardados'>('generar');
  const [descargando, setDescargando] = useState<string | null>(null);
  const [dias, setDias] = useState(30);
  const [reportesGuardadosCount, setReportesGuardadosCount] = useState<number>(0);

  const actualizarConteo = useCallback(async () => {
    try {
      const lista = await obtenerReportes();
      setReportesGuardadosCount(lista.length);
    } catch {
      // Ignorar
    }
  }, []);

  useEffect(() => {
    actualizarConteo();
    const handleUpdate = () => actualizarConteo();
    window.addEventListener('logifast:reporteGuardado', handleUpdate);
    return () => window.removeEventListener('logifast:reporteGuardado', handleUpdate);
  }, [actualizarConteo]);

  const descargarReporte = async (
    tipo: 'inventario' | 'ventas' | 'kardex',
    formato: 'xlsx' | 'pdf' | 'csv' = 'xlsx'
  ) => {
    setDescargando(`${tipo}-${formato}`);
    try {
      const nombre = await descargarReporteTienda(tipo, formato, dias);
      notify.success(`Descargado y guardado: ${nombre}`);
      actualizarConteo();
    } catch (err: any) {
      console.error(err);
      notify.error('Error al generar o guardar el reporte');
    } finally {
      setDescargando(null);
    }
  };

  const opciones = [
    {
      id: 'inventario' as const,
      titulo: 'Reporte Completo de Inventario & Stock',
      descripcion:
        'Exporta el catálogo de productos con costos de adquisición, precios de venta, stock actual, stock mínimo de alerta y código de barras SKU.',
      icon: <Package size={22} />,
      color: 'from-blue-500/15 to-blue-600/10 text-primary border-blue-500/20',
    },
    {
      id: 'ventas' as const,
      titulo: 'Reporte de Ventas en Caja Registradora POS',
      descripcion:
        'Detalle financiero auditado de todas las ventas cobradas en caja, desglose de método de pago (efectivo, tarjeta, transferencia), cliente y monto total.',
      icon: <CreditCard size={22} />,
      color: 'from-emerald-500/15 to-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'kardex' as const,
      titulo: 'Reporte de Movimientos Kardex & Auditoría',
      descripcion:
        'Auditoría física completa de ingresos por compras a proveedores, ventas en mostrador, despachos delivery y mermas con fecha, hora y trazabilidad.',
      icon: <SlidersHorizontal size={22} />,
      color: 'from-amber-500/15 to-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* ─── PESTAÑAS PRINCIPALES: GENERAR VS GUARDADOS ─── */}
      <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
        <button
          type="button"
          onClick={() => setTabActiva('generar')}
          className={`py-2.5 px-5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            tabActiva === 'generar'
              ? 'bg-primary text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
          }`}
        >
          <BarChart3 size={16} />
          <span>Centro de Generación</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('guardados')}
          className={`py-2.5 px-5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            tabActiva === 'guardados'
              ? 'bg-primary text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
          }`}
        >
          <Download size={16} />
          <span>Reportes Guardados</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold ${
              tabActiva === 'guardados'
                ? 'bg-white/20 text-white'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {reportesGuardadosCount}
          </span>
        </button>
      </div>

      {tabActiva === 'guardados' ? (
        <TiendaReportesManager
          isDark={isDark}
          onGenerarNuevo={() => setTabActiva('generar')}
        />
      ) : (
        <>
          {/* ─── Header ─── */}
          <Card className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-[var(--surface)] shadow-xs overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text)]">
                      Reportes Financieros & Operativos
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Exporta tus datos en hojas de cálculo Excel (.xlsx), informes ejecutivos PDF con tu logotipo y membrete oficial, o formato CSV universal.
                    </p>
                  </div>
                </div>

                {reportesGuardadosCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTabActiva('guardados')}
                    className="self-start sm:self-center h-10 rounded-full px-4 text-xs font-bold gap-2 border-slate-200/70 dark:border-slate-800/70"
                  >
                    <Download size={14} className="text-primary" />
                    <span>Ver {reportesGuardadosCount} Guardados</span>
                  </Button>
                )}
              </div>

              {/* Period Selector Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800/70">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    Período:
                  </span>
                  <div className="inline-flex items-center p-1 rounded-full bg-[var(--bg-alt)]/80 border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                    {[
                      { d: 1, l: 'Hoy' },
                      { d: 7, l: '7 días' },
                      { d: 30, l: '30 días' },
                      { d: 0, l: 'Todo' },
                    ].map((p) => {
                      const active = dias === p.d;
                      return (
                        <button
                          key={p.d}
                          type="button"
                          onClick={() => setDias(p.d)}
                          className={`h-8 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-primary text-white shadow-xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
                          }`}
                        >
                          {p.l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Se guardan automáticamente en tu dispositivo para verlos sin conexión</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Grid de Opciones de Descarga ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opciones.map((op) => (
              <Card
                key={op.id}
                className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-[var(--surface)] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${op.color} border flex items-center justify-center shrink-0`}
                      >
                        {op.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-black tracking-tight text-[var(--text)] leading-snug">
                          {op.titulo}
                        </h3>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                          Excel · PDF · CSV
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-2">
                      {op.descripcion}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => descargarReporte(op.id, 'xlsx')}
                        disabled={descargando !== null}
                        className="flex-1 h-11 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
                      >
                        <FileSpreadsheet size={16} />
                        <span>{descargando === `${op.id}-xlsx` ? 'Guardando…' : 'Excel (.xlsx)'}</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => descargarReporte(op.id, 'pdf')}
                        disabled={descargando !== null}
                        className="flex-1 h-11 rounded-full text-xs font-bold gap-1.5 border-slate-200/70 dark:border-slate-800/70"
                      >
                        <Download size={16} />
                        <span>{descargando === `${op.id}-pdf` ? 'Guardando…' : 'PDF'}</span>
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => descargarReporte(op.id, 'csv')}
                      disabled={descargando !== null}
                      className="w-full h-9 rounded-full text-[11px] font-bold border border-dashed border-slate-200/80 dark:border-slate-800/80 text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      {descargando === `${op.id}-csv` ? 'Guardando CSV…' : 'Descargar datos en CSV'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
