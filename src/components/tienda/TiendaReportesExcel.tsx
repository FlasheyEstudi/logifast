'use client';

import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Package, CreditCard, SlidersHorizontal } from '@/components/icons';
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
          Reportes con la identidad de tu tienda
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Descarga en Excel (.xlsx) o PDF: los dos salen con tu logo, el nombre y el color de tu tienda, y con la marca de
          LogiFast. El CSV clásico sigue disponible.
        </p>
      </div>

      {/* Período que abarcan los reportes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Período:</span>
        {[
          { d: 1, l: 'Hoy' },
          { d: 7, l: '7 días' },
          { d: 30, l: '30 días' },
          { d: 0, l: 'Todo' },
        ].map((p) => (
          <button
            key={p.d}
            onClick={() => setDias(p.d)}
            style={{
              height: 44,
              padding: '0 16px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: dias === p.d ? '#0066FF' : 'var(--bg-alt)',
              color: dias === p.d ? '#FFFFFF' : 'var(--text)',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {p.l}
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Los archivos salen con tu logo y el nombre de tu tienda.
        </span>
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
                    Excel .XLSX y PDF
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                {op.descripcion}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              <button
                onClick={() => descargarReporte(op.id, 'xlsx')}
                disabled={descargando !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  flex: '1 1 170px',
                  height: 44,
                  borderRadius: 10,
                  border: 'none',
                  background: '#0066FF',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: descargando ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(0,102,255,0.3)',
                }}
              >
                <FileSpreadsheet size={16} />
                <span>{descargando === `${op.id}-xlsx` ? 'Generando…' : 'Excel .xlsx'}</span>
              </button>

              <button
                onClick={() => descargarReporte(op.id, 'pdf')}
                disabled={descargando !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  flex: '1 1 130px',
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-alt)',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: descargando ? 'wait' : 'pointer',
                }}
              >
                <Download size={16} />
                <span>{descargando === `${op.id}-pdf` ? 'Generando…' : 'PDF'}</span>
              </button>

              <button
                onClick={() => descargarReporte(op.id, 'csv')}
                disabled={descargando !== null}
                style={{
                  height: 44,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: descargando ? 'wait' : 'pointer',
                }}
              >
                CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
