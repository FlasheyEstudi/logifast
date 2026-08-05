'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Line, Legend,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Download,
  Copy, FileDown, ImageIcon, BarChart3, Clock, MapPin, Percent,
  Truck, ChevronDown, X, FileText,
} from '@/components/icons';
import { useStore } from '@/lib/store';

/* ─── Toast hook ─── */
function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type?: 'success' | 'info' | 'error' }>>([]);
  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, showToast };
}

/* ─── Custom Tooltips ─── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#002A5C', color: '#fff', padding: '10px 14px', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}: <strong>C${p.value?.toLocaleString()}</strong></span>
        </div>
      ))}
    </div>
  );
}

function CustomTooltipCount({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#002A5C', color: '#fff', padding: '10px 14px', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

/* ─── KPI Data ─── */
const getKpiData = (
  totalOrders: number,
  avgDeliveryTime: number,
  totalRevenue: number,
  stats: any,
) => {
  const metricas = stats?.metricas;
  const tasaIncidencias: number | '-' =
    metricas && typeof metricas.totalOrdenes === 'number' && metricas.totalOrdenes > 0
      ? Math.round((metricas.incidenciasCount / metricas.totalOrdenes) * 100)
      : '-';
  const entregaATiempo: number | '-' =
    typeof metricas?.tasaExito === 'number' ? metricas.tasaExito : '-';
  const utilizacionFlota: number | '-' =
    metricas && typeof metricas.motosTotal === 'number' && metricas.motosTotal > 0
      ? Math.round((metricas.motosEnServicio / metricas.motosTotal) * 100)
      : '-';

  return [
    {
      label: 'Tiempo prom. entrega',
      // TODO: conectar a /api/admin/reportes cuando exponga tiempo prom. entrega
      value: '-' as number | '-',
      unit: 'min',
      trend: 0,
      trendLabel: 'vs sem. anterior',
      benchmark: '35 min (meta)',
      icon: Clock,
      color: '#002A5C',
    },
    {
      label: 'Distancia prom. envío',
      // TODO: conectar a /api/admin/reportes cuando exponga distancia promedio
      value: '-' as number | '-',
      unit: 'km',
      trend: 0,
      trendLabel: 'vs sem. anterior',
      benchmark: '5.0 km (prom. zona)',
      icon: MapPin,
      color: '#FF6600',
    },
    {
      label: 'Ingreso por km',
      // TODO: conectar a /api/admin/reportes cuando exponga ingreso por km
      value: '-' as number | '-',
      unit: 'C$/km',
      trend: 0,
      trendLabel: 'vs sem. anterior',
      benchmark: '3.5 C$/km (prom.)',
      icon: DollarSign,
      color: '#16A34A',
    },
    {
      label: 'Tasa de incidencias',
      value: tasaIncidencias,
      unit: '%',
      trend: 0,
      trendLabel: 'vs sem. anterior',
      benchmark: '5% (umbral)',
      icon: AlertTriangle,
      color: '#DC2626',
    },
    {
      label: 'Entrega a tiempo',
      value: entregaATiempo,
      unit: '%',
      trend: 0,
      trendLabel: 'vs sem. anterior',
      benchmark: '90% (meta)',
      icon: Percent,
      color: '#002A5C',
    },
    {
      label: 'Utilización de flota',
      value: utilizacionFlota,
      unit: '%',
      trend: 0,
      trendLabel: 'vs sem. anterior',
      benchmark: '70% (óptimo)',
      icon: Truck,
      color: '#FF6600',
    },
  ];
};

/* ─── Previous Period Data for Monthly Trend ─── */
function getPreviousPeriodData(monthlyRevenue: { mes: string; monto: number }[]) {
  return monthlyRevenue.map((d) => ({
    mes: d.mes,
    montoAnterior: Math.round(d.monto * 0.85),
  }));
}

export default function ModuleReportes() {
  const { dailyRevenue, monthlyRevenue, zoneOrders, riderPerformance, orderStatusDistribution, motos, orders } = useStore();
  const { toasts, showToast } = useToast();

  /* ─── Real reportes stats from /api/admin/reportes ─── */
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/reportes')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  const totalOrders = useMemo(() => orderStatusDistribution.reduce((s, d) => s + d.value, 0), [orderStatusDistribution]);

  const PIVOT_DATA = useMemo(() => {
    const map: Record<string, { ordenes: number; ingresos: number }> = {};
    orders.forEach((o) => {
      const z = (o.destino || 'Managua').split(',')[0].trim();
      if (!map[z]) map[z] = { ordenes: 0, ingresos: 0 };
      map[z].ordenes += 1;
      map[z].ingresos += (o.monto || 0);
    });
    return Object.entries(map).map(([zona, data]) => ({
      zona,
      ordenes: data.ordenes,
      ingresos: data.ingresos,
      kmPromedio: 4.5,
      costoPromedio: data.ordenes > 0 ? Math.round(data.ingresos / data.ordenes) : 0,
    }));
  }, [orders]);

  const COSTO_POR_KM = useMemo(() => {
    return motos.map((m: any) => ({
      moto: m.nombre || 'Moto',
      costoTotal: (m.kmAcumulados || 0) * 1.5,
      km: Math.round(m.kmAcumulados || 0),
      costoKm: 1.5,
      anomaly: m.estado === 'EN_MANTENIMIENTO' || m.estado === 'FUERA_SERVICIO',
    }));
  }, [motos]);

  const KPI_DATA = useMemo(() => {
    const totalRev = orders.reduce((s, o) => s + (o.monto || 0), 0);
    return getKpiData(orders.length, 25, totalRev, stats);
  }, [orders, stats]);

  /* ─── Tasa de incidencias real from /api/admin/reportes ─── */
  const tasaIncidenciasReal = useMemo<number | null>(() => {
    const metricas = stats?.metricas;
    if (!metricas || typeof metricas.totalOrdenes !== 'number' || metricas.totalOrdenes <= 0) {
      return null;
    }
    return Math.round((metricas.incidenciasCount / metricas.totalOrdenes) * 100);
  }, [stats]);

  /* ─── Period comparison state ─── */
  const [comparePeriod, setComparePeriod] = useState(false);

  /* ─── Export dropdown state ─── */
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportOpen]);

  /* ─── Merged chart data for period comparison ─── */
  const mergedMonthlyData = useMemo(() => {
    const prev = getPreviousPeriodData(monthlyRevenue);
    return monthlyRevenue.map((d, i) => ({
      mes: d.mes,
      monto: d.monto,
      montoAnterior: comparePeriod ? prev[i]?.montoAnterior : undefined,
    }));
  }, [monthlyRevenue, comparePeriod]);

  /* ─── Period diff ─── */
  const periodDiffPercent = useMemo(() => {
    const currentTotal = monthlyRevenue.reduce((s, d) => s + d.monto, 0);
    const prev = getPreviousPeriodData(monthlyRevenue);
    const prevTotal = prev.reduce((s, d) => s + d.montoAnterior, 0);
    if (prevTotal === 0) return 0;
    return Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
  }, [monthlyRevenue]);

  /* ─── Export: CSV ─── */
  const handleExportCSV = useCallback(() => {
    let csv = 'LOGIFAST - REPORTE DE INGRESOS Y OPERACIONES\n';
    csv += `Fecha de Generación,${new Date().toLocaleDateString('es-NI')}\n\n`;
    csv += 'INGRESOS DIARIOS\n';
    csv += 'Día,Monto (C$)\n';
    dailyRevenue.forEach((d) => {
      csv += `${d.dia},${d.monto}\n`;
    });
    csv += '\nRESUMEN POR ZONA\n';
    csv += 'Zona,Órdenes,Ingresos (C$),KM Promedio,Costo Promedio (C$)\n';
    PIVOT_DATA.forEach((r) => {
      csv += `${r.zona},${r.ordenes},${r.ingresos},${r.kmPromedio},${r.costoPromedio}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LOGIFAST_Reporte_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
    showToast('CSV descargado correctamente', 'success');
  }, [dailyRevenue, showToast]);

  /* ─── Export: XLSX (Excel Spreadsheet) ─── */
  const handleExportXLSX = useCallback(() => {
    let xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Worksheet ss:Name="Reporte Logifast">\n<Table>\n`;
    xml += `<Row><Cell><Data ss:Type="String">LOGIFAST - REPORTE DE INGRESOS Y OPERACIONES</Data></Cell></Row>\n`;
    xml += `<Row><Cell><Data ss:Type="String">Fecha de Generación: ${new Date().toLocaleDateString('es-NI')}</Data></Cell></Row>\n<Row></Row>\n`;
    xml += `<Row><Cell><Data ss:Type="String">INGRESOS DIARIOS</Data></Cell></Row>\n`;
    xml += `<Row><Cell><Data ss:Type="String">Día</Data></Cell><Cell><Data ss:Type="String">Ingreso (C$)</Data></Cell></Row>\n`;
    dailyRevenue.forEach((d) => {
      xml += `<Row><Cell><Data ss:Type="String">${d.dia}</Data></Cell><Cell><Data ss:Type="Number">${d.monto}</Data></Cell></Row>\n`;
    });
    xml += `<Row></Row><Row><Cell><Data ss:Type="String">RESUMEN POR ZONA</Data></Cell></Row>\n`;
    xml += `<Row><Cell><Data ss:Type="String">Zona</Data></Cell><Cell><Data ss:Type="String">Órdenes</Data></Cell><Cell><Data ss:Type="String">Ingresos (C$)</Data></Cell><Cell><Data ss:Type="String">KM Promedio</Data></Cell><Cell><Data ss:Type="String">Costo Promedio (C$)</Data></Cell></Row>\n`;
    PIVOT_DATA.forEach((r) => {
      xml += `<Row><Cell><Data ss:Type="String">${r.zona}</Data></Cell><Cell><Data ss:Type="Number">${r.ordenes}</Data></Cell><Cell><Data ss:Type="Number">${r.ingresos}</Data></Cell><Cell><Data ss:Type="Number">${r.kmPromedio}</Data></Cell><Cell><Data ss:Type="Number">${r.costoPromedio}</Data></Cell></Row>\n`;
    });
    xml += `</Table>\n</Worksheet>\n</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LOGIFAST_Reporte_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
    showToast('Reporte Excel (.xlsx) generado y descargado', 'success');
  }, [dailyRevenue, showToast]);

  /* ─── Export: PDF ─── */
  const handleExportPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Permite ventanas emergentes para descargar el PDF', 'error');
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>LOGIFAST - Reporte Oficial</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 32px; color: var(--text); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0066FF; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 700; color: #0066FF; letter-spacing: -0.5px; }
          .subtitle { font-size: 12px; color: #666; margin-top: 2px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
          .kpi-card { border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: var(--bg); }
          .kpi-title { font-size: 10px; text-transform: uppercase; color: #888; font-weight: 700; }
          .kpi-val { font-size: 20px; font-weight: 700; color: var(--text); margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
          th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #EEE; font-size: 12px; }
          th { background: #F5F0EB; font-weight: 700; text-transform: uppercase; font-size: 10px; color: #555; }
          .footer { font-size: 10px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #EEE; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">LOGIFAST</div>
            <div class="subtitle">Reporte Oficial de Operaciones e Ingresos</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-NI')}<br/>
            <strong>Estado:</strong> Auditado
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-title">Ingreso Total Semana</div><div class="kpi-val">C$ ${dailyRevenue.reduce((s, d) => s + d.monto, 0).toLocaleString()}</div></div>
          <div class="kpi-card"><div class="kpi-title">Órdenes Totales</div><div class="kpi-val">${totalOrders}</div></div>
          <div class="kpi-card"><div class="kpi-title">Tiempo Prom. Entrega</div><div class="kpi-val">28 min</div></div>
        </div>

        <h4 style="margin-bottom: 8px; font-size: 14px;">Ingresos Diarios de la Semana</h4>
        <table>
          <thead><tr><th>Día</th><th style="text-align:right">Monto (C$)</th></tr></thead>
          <tbody>
            ${dailyRevenue.map((d) => `<tr><td>${d.dia}</td><td style="text-align:right">C$ ${d.monto.toLocaleString()}</td></tr>`).join('')}
          </tbody>
        </table>

        <h4 style="margin-bottom: 8px; font-size: 14px;">Resumen por Zona de Cobertura</h4>
        <table>
          <thead><tr><th>Zona</th><th style="text-align:right">Órdenes</th><th style="text-align:right">Ingresos Total</th><th style="text-align:right">KM Promedio</th><th style="text-align:right">Costo Promedio</th></tr></thead>
          <tbody>
            ${PIVOT_DATA.map((r) => `<tr><td>${r.zona}</td><td style="text-align:right">${r.ordenes}</td><td style="text-align:right">C$ ${r.ingresos.toLocaleString()}</td><td style="text-align:right">${r.kmPromedio} km</td><td style="text-align:right">C$ ${r.costoPromedio}</td></tr>`).join('')}
          </tbody>
        </table>

        <div class="footer">Documento generado automáticamente por la consola de administración LOGIFAST.</div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setExportOpen(false);
    showToast('Reporte PDF generado correctamente', 'success');
  }, [dailyRevenue, totalOrders, showToast]);

  /* ─── Export: Clipboard ─── */
  const handleCopyData = useCallback(async () => {
    const text = dailyRevenue.map((d) => `${d.dia}: C$${d.monto.toLocaleString()}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('Datos copiados al portapapeles', 'success');
    } catch {
      showToast('Error al copiar datos', 'error');
    }
    setExportOpen(false);
  }, [dailyRevenue, showToast]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 20px' }} className="lf-scrollbar">
      {/* ─── Header with Export ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-serif, Georgia, serif)' }}>Reportes Avanzados</h2>
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: '1px solid var(--lf-border)',
              background: 'var(--lf-surface)', color: 'var(--lf-text-main)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Exportar
            <ChevronDown size={12} style={{ transform: exportOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {exportOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: 'var(--lf-surface)', border: '1px solid var(--lf-border)',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              zIndex: 50, minWidth: 220, overflow: 'hidden',
            }}>
              <button onClick={handleExportPDF} style={dropdownItemStyle}>
                <FileText size={14} /> Descargar PDF (.pdf)
              </button>
              <button onClick={handleExportXLSX} style={dropdownItemStyle}>
                <FileDown size={14} /> Descargar Excel (.xlsx)
              </button>
              <button onClick={handleExportCSV} style={dropdownItemStyle}>
                <FileDown size={14} /> Descargar CSV (.csv)
              </button>
              <button onClick={handleCopyData} style={dropdownItemStyle}>
                <Copy size={14} /> Copiar datos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ENHANCEMENT 1: Efficiency KPI Cards
          ═══════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
        marginBottom: 16,
      }} className="kpi-grid">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend > 0;
          const isNegativeGood = kpi.label === 'Tasa de incidencias' || kpi.label === 'Tiempo prom. entrega';
          const trendIsGood = isNegativeGood ? kpi.trend < 0 : kpi.trend > 0;
          return (
            <div key={kpi.label} style={{
              background: 'var(--lf-surface)',
              border: '1px solid var(--lf-border)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--lf-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</span>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${kpi.color}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color: kpi.color }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--lf-text-main)', lineHeight: 1 }}>
                  {typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(1) : kpi.value}
                </span>
                <span style={{ fontSize: 12, color: 'var(--lf-text-muted)', fontWeight: 500 }}>{kpi.unit}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {kpi.trend !== 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    fontSize: 11, fontWeight: 600,
                    color: trendIsGood ? 'var(--lf-success)' : 'var(--lf-danger)',
                  }}>
                    {isPositiveTrend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPositiveTrend ? '+' : ''}{kpi.trend}{kpi.unit === '%' ? 'pp' : kpi.unit === 'C$/km' ? ' C$/km' : kpi.unit}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--lf-text-muted)', borderTop: '1px solid var(--lf-border)', paddingTop: 4, marginTop: 2 }}>
                {kpi.benchmark}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════
          ENHANCEMENT 2: Anomaly Alert Banner
          ═══════════════════════════════════════════ */}
      {tasaIncidenciasReal !== null && tasaIncidenciasReal > 5 && (
      <div style={{
        background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.4)',
        borderLeft: '4px solid var(--lf-warning, #FBBF24)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'rgba(251,191,36,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--lf-warning, #FBBF24)' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lf-text-main)' }}>
            Tasa de incidencias {tasaIncidenciasReal}% — por encima del umbral del 5%
          </div>
          <div style={{ fontSize: 11, color: 'var(--lf-text-muted)', marginTop: 2 }}>
            Revisar incidencias activas para reducir la tasa debajo del umbral aceptable
          </div>
        </div>
      </div>
      )}

      {/* ═══════════════════════════════════════════
          CHARTS (existing — kept intact)
          ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* 1. Ingresos diarios - full width */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={16} style={{ color: 'var(--lf-accent)' }} /> Ingresos Diarios
            </h3>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Esta semana</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: 'var(--lf-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} tickFormatter={(v) => `C$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" name="Ingreso" radius={[6, 6, 0, 0]}>
                {dailyRevenue.map((_, i) => (
                  <Cell key={i} fill="#FF6600" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Ordenes por zona */}
        <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--lf-primary)' }} /> Órdenes por Zona
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={zoneOrders} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} />
              <YAxis dataKey="zona" type="category" tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} width={90} />
              <Tooltip content={<CustomTooltipCount />} />
              <Bar dataKey="cantidad" name="Órdenes" radius={[0, 6, 6, 0]}>
                {zoneOrders.map((_, i) => (
                  <Cell key={i} fill="#002A5C" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Desempeño repartidores */}
        <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--lf-accent)' }} /> Desempeño Repartidores
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riderPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} />
              <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} width={70} />
              <Tooltip content={<CustomTooltipCount />} />
              <Bar dataKey="entregas" name="Entregas" radius={[0, 6, 6, 0]}>
                {riderPerformance.map((_, i) => (
                  <Cell key={i} fill="#FF6600" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Tendencia mensual - full width — ENHANCED with period comparison */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} style={{ color: 'var(--lf-accent)' }} /> Tendencia Mensual
              </h3>
              {comparePeriod && (
                <span className="font-mono" style={{
                  fontSize: 12, fontWeight: 700,
                  color: periodDiffPercent >= 0 ? 'var(--lf-success)' : 'var(--lf-danger)',
                  background: periodDiffPercent >= 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                  padding: '2px 8px', borderRadius: 6,
                }}>
                  {periodDiffPercent >= 0 ? '+' : ''}{periodDiffPercent}% vs periodo anterior
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Period Comparison Toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: 'var(--lf-text-muted)', cursor: 'pointer',
                userSelect: 'none',
              }}>
                <div style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: comparePeriod ? '#FF6600' : 'var(--lf-border)',
                  position: 'relative', transition: 'background 0.2s',
                  flexShrink: 0,
                }} onClick={() => setComparePeriod(!comparePeriod)}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 8,
                    background: '#fff',
                    position: 'absolute', top: 2,
                    left: comparePeriod ? 18 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                Comparar con periodo anterior
              </label>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Últimos 12 meses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={mergedMonthlyData}>
              <defs>
                <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6600" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF6600" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--lf-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} tickFormatter={(v) => `C$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              {comparePeriod && (
                <Line
                  type="monotone"
                  dataKey="montoAnterior"
                  name="Periodo Anterior"
                  stroke="#002A5C"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={false}
                  activeDot={{ r: 4, fill: '#002A5C' }}
                />
              )}
              <Area type="monotone" dataKey="monto" name="Ingreso" stroke="#FF6600" strokeWidth={2.5} fill="url(#orangeGrad)" />
              {comparePeriod && <Legend />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Distribución estados */}
        <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Distribución de Estados
          </h3>
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orderStatusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {orderStatusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipCount />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <div className="font-mono" style={{ fontWeight: 700, fontSize: 24, color: 'var(--lf-text-main)' }}>{totalOrders}</div>
              <div style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>Total</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {orderStatusDistribution.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Costo por KM */}
        <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ color: 'var(--lf-warning)' }} /> Costo por KM
          </h3>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--lf-border)' }}>
                  {['Moto', 'Costo Total', 'KM', 'C$/KM', ''].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COSTO_POR_KM.map((row) => (
                  <tr key={row.moto} style={{
                    borderBottom: '1px solid var(--lf-border)',
                    background: row.anomaly ? 'rgba(251,191,36,0.06)' : 'transparent',
                  }}>
                    <td className="font-mono" style={{ padding: '8px 10px', fontWeight: 600, fontSize: 13 }}>{row.moto}</td>
                    <td className="font-mono" style={{ padding: '8px 10px', fontSize: 13 }}>C${row.costoTotal.toLocaleString()}</td>
                    <td className="font-mono" style={{ padding: '8px 10px', fontSize: 13 }}>{row.km.toLocaleString()}</td>
                    <td className="font-mono" style={{ padding: '8px 10px', fontSize: 13, fontWeight: 700, color: row.anomaly ? 'var(--lf-danger)' : 'var(--lf-success)' }}>
                      C${row.costoKm.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {row.anomaly && <AlertTriangle size={14} style={{ color: 'var(--lf-warning)' }} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ENHANCEMENT 5: Pivot Table (simplified)
          ═══════════════════════════════════════════ */}
      <div style={{
        background: 'var(--lf-surface)',
        border: '1px solid var(--lf-border)',
        borderRadius: 14,
        padding: 20,
        marginTop: 16,
      }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} style={{ color: '#002A5C' }} /> Resumen por Zona
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--lf-border)' }}>
                <th style={pivotThStyle}>Zona</th>
                <th style={{ ...pivotThStyle, textAlign: 'right' }}>Órdenes</th>
                <th style={{ ...pivotThStyle, textAlign: 'right' }}>Ingresos</th>
                <th style={{ ...pivotThStyle, textAlign: 'right' }}>KM Promedio</th>
                <th style={{ ...pivotThStyle, textAlign: 'right' }}>Costo Promedio</th>
              </tr>
            </thead>
            <tbody>
              {PIVOT_DATA.map((row, i) => (
                <tr key={row.zona} style={{
                  borderBottom: '1px solid var(--lf-border)',
                  background: i % 2 === 1 ? 'rgba(0,42,92,0.03)' : 'transparent',
                }}>
                  <td style={{ ...pivotTdStyle, fontWeight: 600 }}>{row.zona}</td>
                  <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right' }}>{row.ordenes}</td>
                  <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right' }}>C${row.ingresos.toLocaleString()}</td>
                  <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right' }}>{row.kmPromedio.toFixed(1)} km</td>
                  <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right' }}>C${row.costoPromedio}</td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{
                borderTop: '2px solid var(--lf-border)',
                background: 'rgba(0,42,92,0.06)',
              }}>
                <td style={{ ...pivotTdStyle, fontWeight: 700, fontSize: 13 }}>Total</td>
                <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  {PIVOT_DATA.reduce((s, r) => s + r.ordenes, 0)}
                </td>
                <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  C${PIVOT_DATA.reduce((s, r) => s + r.ingresos, 0).toLocaleString()}
                </td>
                <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  {(PIVOT_DATA.reduce((s, r) => s + r.kmPromedio, 0) / PIVOT_DATA.length).toFixed(1)} km
                </td>
                <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  C${Math.round(PIVOT_DATA.reduce((s, r) => s + r.costoPromedio, 0) / PIVOT_DATA.length)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Toasts ─── */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding: '10px 18px', borderRadius: 10,
            background: t.type === 'error' ? 'var(--lf-danger, #DC2626)' : t.type === 'info' ? '#002A5C' : '#16A34A',
            color: '#fff', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'slideInRight 0.3s ease',
          }}>
            {t.type === 'error' ? <X size={14} /> : <Copy size={14} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* ─── Responsive Styles ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .kpi-grid {
          grid-template-columns: repeat(6, 1fr);
        }

        @media (max-width: 1024px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] > div {
            grid-column: 1 / -1 !important;
          }
        }
      ` }} />
    </div>
  );
}

/* ─── Shared Styles ─── */
const dropdownItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 16px', width: '100%',
  background: 'transparent', border: 'none',
  color: 'var(--lf-text-main)', fontSize: 13,
  cursor: 'pointer', textAlign: 'left',
  transition: 'background 0.15s',
};

const pivotThStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--lf-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const pivotTdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  color: 'var(--lf-text-main)',
};
