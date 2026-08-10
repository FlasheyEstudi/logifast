'use client';

import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Package, CreditCard, SlidersHorizontal } from '@/components/icons';
import { notify } from '@/lib/notify';

export function TiendaReportesExcel({ isDark }: { isDark: boolean }) {
  const [descargando, setDescargando] = useState<string | null>(null);

  const descargarReporte = async (tipo: 'inventario' | 'ventas' | 'kardex') => {
    setDescargando(tipo);
    try {
      const res = await fetch(`/api/tienda/reportes/excel?tipo=${tipo}`);
      if (!res.ok) {
        throw new Error('Error al generar el reporte');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_LogiFast_${tipo}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      notify.success(`Reporte de ${tipo.toUpperCase()} descargado exitosamente`);
    } catch (err) {
      notify.error('Error al descargar el reporte');
    } finally {
      setDescargando(null);
    }
  };

  const opciones = [
    {
      id: 'inventario' as const,
      titulo: 'Reporte Completo de Inventario & Stock',
      descripcion: 'Exporta la lista de productos con costos, precios, stock actual, stock mínimo y código de barras SKU.',
      icon: <Package size={24} style={{ color: '#0066FF' }} />,
    },
    {
      id: 'ventas' as const,
      titulo: 'Reporte de Ventas en Punto de Venta (POS)',
      descripcion: 'Detalle financiero de ventas registradas en caja, método de pago, cliente, subtotal y total cobrado.',
      icon: <CreditCard size={24} style={{ color: '#34C759' }} />,
    },
    {
      id: 'kardex' as const,
      titulo: 'Reporte de Movimientos Kardex de Inventario',
      descripcion: 'Auditoría de compras a proveedores, entradas, salidas y mermas con fecha, hora y responsable.',
      icon: <SlidersHorizontal size={24} style={{ color: '#FF9500' }} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--surface)',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
          Exportación de Reportes Financieros a Microsoft Excel
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Descarga archivos estructurados compatibles con Excel (.csv / .xlsx UTF-8) para contabilidad y control fiscal.
        </p>
      </div>

      {/* Grid de Opciones de Descarga */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {opciones.map((op) => (
          <div
            key={op.id}
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--bg-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {op.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    {op.titulo}
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#34C759' }}>
                    Formato Excel .CSV
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                {op.descripcion}
              </p>
            </div>

            <button
              onClick={() => descargarReporte(op.id)}
              disabled={descargando === op.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 42,
                borderRadius: 10,
                border: 'none',
                background: '#0066FF',
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 20,
                boxShadow: '0 4px 14px rgba(0,102,255,0.3)',
              }}
            >
              <FileSpreadsheet size={16} />
              <span>{descargando === op.id ? 'Generando Excel...' : 'Descargar para Excel'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
