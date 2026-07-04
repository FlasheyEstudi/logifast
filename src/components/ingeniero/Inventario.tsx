// components/ingeniero/Inventario.tsx
'use client';

import React, { useState } from 'react';
import { useIngenieroStore } from '@/store/ingenieroStore';
import EmptyState from '@/components/ui/EmptyState';

export default function Inventario() {
  const store = useIngenieroStore();
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);

  const repuestosFiltrados = store.repuestos.filter(r => {
    const matchBusqueda = !busqueda ||
      r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.sku || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !filtroCategoria || r.categoria === filtroCategoria;
    return matchBusqueda && matchCategoria;
  });

  const categorias = ['ACEITE', 'FRENO', 'LLANTA', 'CADENA', 'ELECTRICO', 'MOTOR', 'GENERAL', 'OTRO'];

  if (!store.showInventario) return null;

  return (
    <div className="inventario-pantalla" style={{ position: 'fixed', inset: 0, zIndex: 120, overflowY: 'auto' }}>
      {/* Header */}
      <div className="pantalla-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--md-surface)', borderBottom: '1px solid var(--md-outline-variant)' }}>
        <button
          className="header-back"
          onClick={() => store.toggleInventario()}
          style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 4 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="pantalla-title font-syne" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          Inventario
        </h1>
        <button
          className="lf-btn lf-btn-primary lf-btn-sm"
          onClick={() => store.toggleAgregarRepuesto()}
          style={{ padding: '6px 10px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Buscador */}
      <div style={{ padding: '16px 20px 12px', background: 'var(--md-surface)' }}>
        <div className="buscador-input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--md-surface-variant)', borderRadius: 12 }}>
          <svg className="buscador-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="buscador-text-input"
            placeholder="Buscar repuesto o SKU..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 14, color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-scroll" style={{ padding: '8px 20px', background: 'var(--md-surface)', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid var(--md-outline-variant)' }}>
        <button
          className={`filtro-pill ${!filtroCategoria ? 'active' : ''}`}
          onClick={() => setFiltroCategoria(null)}
          style={{ flexShrink: 0 }}
        >
          Todos <span className="filtro-pill-count">{store.repuestos.length}</span>
        </button>
        {categorias.map(cat => {
          const count = store.repuestos.filter(r => r.categoria === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              className={`filtro-pill ${filtroCategoria === cat ? 'active' : ''}`}
              onClick={() => setFiltroCategoria(cat)}
              style={{ flexShrink: 0 }}
            >
              {cat} <span className="filtro-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {repuestosFiltrados.length === 0 ? (
        <EmptyState
          icono={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          }
          titulo="Sin repuestos"
          descripcion="No se encontraron repuestos con esos filtros"
        />
      ) : (
        <div className="inventario-lista" style={{ padding: '16px 20px' }}>
          {repuestosFiltrados.map(r => (
            <div key={r.id} className={`inventario-item ${r.bajoStock ? 'bajo-stock' : ''}`} style={{ marginBottom: 10 }}>
              <div className="inventario-item-info">
                <div className="inventario-item-nombre">{r.nombre}</div>
                <div className="inventario-item-meta">
                  <span className="inventario-item-sku mono">{r.sku || '—'}</span>
                  <span>{r.categoria}</span>
                  {r.ubicacion && <span>{r.ubicacion}</span>}
                </div>
              </div>
              <div className="inventario-item-stock">
                <div className={`inventario-stock-num mono ${r.bajoStock ? 'warning' : ''}`}>
                  {r.stock}
                </div>
                <div className="inventario-stock-label">
                  {r.unidad} · min: {r.stockMinimo}
                </div>
              </div>
              {r.bajoStock && (
                <div className="inventario-stock-alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB300" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 100 }} />
    </div>
  );
}
