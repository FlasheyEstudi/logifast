'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Package,
  CreditCard,
  SlidersHorizontal,
  Calendar,
  Sparkles,
} from '@/components/icons';
import { notify } from '@/lib/notify';
import { descargarReporteTienda } from '@/lib/tienda/descarga-cliente';

export function TiendaReportesExcel({ isDark }: { isDark: boolean }) {
  const [descargando, setDescargando] = useState<string | null>(null);
  const [dias, setDias] = useState(30);

  const descargarReporte = async (
    tipo: 'inventario' | 'ventas' | 'kardex',
    formato: 'xlsx' | 'pdf' | 'csv' = 'xlsx'
  ) => {
    setDescargando(`${tipo}-${formato}`);
    try {
      const nombre = await descargarReporteTienda(tipo, formato, dias);
      notify.success(`Descargado: ${nombre}`);
    } catch {
      notify.error('Error al descargar el reporte');
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
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <BarChart3 size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Centro de Exportación</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-syne">
            Reportes Financieros & Operativos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Exporta tus datos en hojas de cálculo Excel (.xlsx), informes ejecutivos PDF con tu logotipo y membrete oficial, o formato CSV universal.
          </p>
        </div>

        {/* Period Selector Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Período de Análisis:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { d: 1, l: 'Hoy' },
                { d: 7, l: '7 días' },
                { d: 30, l: '30 días' },
                { d: 0, l: 'Todo el Historial' },
              ].map((p) => (
                <button
                  key={p.d}
                  onClick={() => setDias(p.d)}
                  className={`h-9 min-h-[36px] px-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                    dias === p.d
                      ? 'bg-primary text-white shadow-sm shadow-primary/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span>Los reportes incluyen membrete y logo de tu tienda</span>
          </div>
        </div>
      </div>

      {/* ─── Grid de Opciones de Descarga ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {opciones.map((op) => (
          <div
            key={op.id}
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${op.color} border flex items-center justify-center shrink-0`}>
                  {op.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {op.titulo}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                    Excel · PDF · CSV
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                {op.descripcion}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={() => descargarReporte(op.id, 'xlsx')}
                  disabled={descargando !== null}
                  className="flex-1 h-11 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} />
                  <span>{descargando === `${op.id}-xlsx` ? 'Generando…' : 'Excel (.xlsx)'}</span>
                </button>

                <button
                  onClick={() => descargarReporte(op.id, 'pdf')}
                  disabled={descargando !== null}
                  className="flex-1 h-11 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Download size={16} />
                  <span>{descargando === `${op.id}-pdf` ? 'Generando…' : 'PDF'}</span>
                </button>
              </div>

              <button
                onClick={() => descargarReporte(op.id, 'csv')}
                disabled={descargando !== null}
                className="w-full h-9 min-h-[36px] rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-bold active:scale-95 transition-all"
              >
                {descargando === `${op.id}-csv` ? 'Generando CSV…' : 'Descargar datos en CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
