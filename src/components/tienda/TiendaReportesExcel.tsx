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

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM CONSTANTS (LOGIFAST 2.0 UNIFIED)
   ═══════════════════════════════════════════════ */

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 20px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 24,
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 'var(--lf-button-radius, 14px)',
  border: 'none',
  background: 'var(--primario)',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
  transition: 'all 0.2s ease',
};

const btnSecondary: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 'var(--lf-button-radius, 14px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'all 0.2s ease',
};

const filterPill = (active: boolean): React.CSSProperties => ({
  padding: '7px 14px',
  borderRadius: 'var(--lf-pill-radius, 100px)',
  background: active ? 'var(--primario)' : 'var(--bg-alt)',
  color: active ? '#FFFFFF' : 'var(--text-muted)',
  border: `1px solid ${active ? 'var(--primario)' : 'var(--border)'}`,
  fontWeight: 600,
  fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.18s ease',
  boxShadow: active ? '0 2px 8px rgba(0, 122, 255, 0.25)' : 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
});

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
    <div className="w-full space-y-5">
      {/* ─── PESTAÑAS PRINCIPALES: GENERAR VS GUARDADOS ─── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <button
          type="button"
          onClick={() => setTabActiva('generar')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            tabActiva === 'generar'
              ? 'bg-[var(--primario)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
          }`}
        >
          <BarChart3 size={16} />
          <span>Centro de Generación</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('guardados')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            tabActiva === 'guardados'
              ? 'bg-[var(--primario)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
          }`}
        >
          <Download size={16} />
          <span>Reportes Guardados</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold ${
              tabActiva === 'guardados'
                ? 'bg-white/20 text-white'
                : 'bg-[var(--primario)]/10 text-[var(--primario)]'
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
          <div style={sectionCard} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <BarChart3 size={20} />
                  <span className="text-xs font-bold uppercase tracking-wider">Centro de Exportación</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-syne">
                  Reportes Financieros & Operativos
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Exporta tus datos en hojas de cálculo Excel (.xlsx), informes ejecutivos PDF con tu logotipo y membrete oficial, o formato CSV universal.
                </p>
              </div>

              {reportesGuardadosCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTabActiva('guardados')}
                  className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <Download size={14} className="text-[var(--primario)]" />
                  <span>Ver {reportesGuardadosCount} Guardados</span>
                </button>
              )}
            </div>

            {/* Period Selector Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text)]">
                  Período de Análisis:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { d: 1, l: 'Hoy' },
                    { d: 7, l: '7 días' },
                    { d: 30, l: '30 días' },
                    { d: 0, l: 'Todo el Historial' },
                  ].map((p) => {
                    const active = dias === p.d;
                    return (
                      <button
                        key={p.d}
                        onClick={() => setDias(p.d)}
                        style={filterPill(active)}
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
          </div>

          {/* ─── Grid de Opciones de Descarga ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opciones.map((op) => (
              <div
                key={op.id}
                style={sectionCard}
                className="flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${op.color} border flex items-center justify-center shrink-0`}
                    >
                      {op.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text)] leading-snug">
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
                <div className="space-y-2 mt-6 pt-4 border-t border-[var(--border)]">
                  <div className="flex gap-2">
                    <button
                      onClick={() => descargarReporte(op.id, 'xlsx')}
                      disabled={descargando !== null}
                      style={btnPrimary}
                      className="flex-1 h-11 min-h-[44px] active:scale-95 disabled:opacity-50"
                    >
                      <FileSpreadsheet size={16} />
                      <span>{descargando === `${op.id}-xlsx` ? 'Guardando…' : 'Excel (.xlsx)'}</span>
                    </button>

                    <button
                      onClick={() => descargarReporte(op.id, 'pdf')}
                      disabled={descargando !== null}
                      style={btnSecondary}
                      className="flex-1 h-11 min-h-[44px] active:scale-95 disabled:opacity-50"
                    >
                      <Download size={16} />
                      <span>{descargando === `${op.id}-pdf` ? 'Guardando…' : 'PDF'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => descargarReporte(op.id, 'csv')}
                    disabled={descargando !== null}
                    style={{ ...btnSecondary, width: '100%', borderStyle: 'dashed', height: 36, fontSize: 11 }}
                    className="active:scale-95"
                  >
                    {descargando === `${op.id}-csv` ? 'Guardando CSV…' : 'Descargar datos en CSV'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
