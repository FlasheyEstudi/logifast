// components/ingeniero/Inventario.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useIngenieroStore } from '@/store/ingenieroStore';
import EmptyState from '@/components/ui/EmptyState';
import { notify } from '@/lib/notify';

const CATEGORIA_INFO: Record<string, { label: string; color: string; icon: string }> = {
  ACEITE:    { label: 'Aceite',    color: '#FFB300', icon: 'M12 2L2 7v10a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 22 17V7L12 2z' },
  FRENO:     { label: 'Freno',     color: '#FF1744', icon: 'M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M19.07 19.07l-4.24-4.24M2 12h6M22 12h-6' },
  LLANTA:    { label: 'Llanta',    color: '#1B1B2F', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a6 6 0 0 1 6 6' },
  CADENA:    { label: 'Cadena',    color: '#9C27B0', icon: 'M4 12a4 4 0 1 1 4 4M12 12a4 4 0 1 1 4 4M20 12a4 4 0 1 1-4-4' },
  ELECTRICO: { label: 'Eléctrico', color: '#2196F3', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  MOTOR:     { label: 'Motor',     color: '#FF5722', icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4' },
  GENERAL:   { label: 'General',   color: '#00BCD4', icon: 'M12 2L2 7v10a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 22 17V7L12 2z' },
  OTRO:      { label: 'Otro',      color: '#8E8EA0', icon: 'M12 2v4M12 18v4' },
};

export default function Inventario() {
  const store = useIngenieroStore();
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'nombre' | 'stock' | 'precio'>('nombre');

  const repuestosFiltrados = useMemo(() => {
    let result = store.repuestos.filter((r) => {
      const matchBusqueda =
        !busqueda ||
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.sku || '').toLowerCase().includes(busqueda.toLowerCase());
      const matchCategoria = !filtroCategoria || r.categoria === filtroCategoria;
      return matchBusqueda && matchCategoria;
    });

    if (sortBy === 'nombre') {
      result = [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sortBy === 'stock') {
      result = [...result].sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'precio') {
      result = [...result].sort((a, b) => b.precioUnitario - a.precioUnitario);
    }

    return result;
  }, [store.repuestos, busqueda, filtroCategoria, sortBy]);

  const categorias = ['ACEITE', 'FRENO', 'LLANTA', 'CADENA', 'ELECTRICO', 'MOTOR', 'GENERAL', 'OTRO'];

  // KPIs
  const totalRepuestos = store.repuestos.length;
  const totalValor = store.repuestos.reduce((s, r) => s + r.precioUnitario * r.stock, 0);
  const bajoStock = store.repuestos.filter((r) => r.bajoStock).length;

  if (!store.showInventario) return null;

  return (
    <div className="inventario-pantalla" style={{ position: 'fixed', inset: 0, zIndex: 120, overflowY: 'auto', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="lf-inv-header">
        <button
          className="header-back"
          onClick={() => store.toggleInventario()}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="lf-inv-title">Inventario</h1>
          <p className="lf-inv-subtitle">{totalRepuestos} repuestos · C$ {totalValor.toLocaleString()} en stock</p>
        </div>
        <button
          className="lf-btn lf-btn-primary lf-btn-sm"
          onClick={() => store.toggleAgregarRepuesto()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar
        </button>
      </div>

      {/* KPIs */}
      <div className="lf-inv-kpis">
        <div className="lf-inv-kpi">
          <div className="lf-inv-kpi-icon" style={{ background: 'rgba(0,200,83,0.12)', color: '#00C853' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <div>
            <div className="lf-inv-kpi-value">{totalRepuestos}</div>
            <div className="lf-inv-kpi-label">Repuestos</div>
          </div>
        </div>
        <div className="lf-inv-kpi">
          <div className="lf-inv-kpi-icon" style={{ background: 'rgba(255,179,0,0.12)', color: '#FFB300' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
          </div>
          <div>
            <div className="lf-inv-kpi-value">{bajoStock}</div>
            <div className="lf-inv-kpi-label">Bajo stock</div>
          </div>
        </div>
        <div className="lf-inv-kpi">
          <div className="lf-inv-kpi-icon" style={{ background: 'rgba(255,87,34,0.12)', color: '#FF5722' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
          <div>
            <div className="lf-inv-kpi-value">C$ {Math.round(totalValor / 1000)}k</div>
            <div className="lf-inv-kpi-label">Valor total</div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="lf-inv-search-wrap">
        <div className="lf-inv-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="lf-inv-search-clear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filtros chips */}
      <div className="lf-inv-chips">
        <button
          className={`lf-modern-chip ${!filtroCategoria ? 'active' : ''}`}
          onClick={() => setFiltroCategoria(null)}
        >
          <span>Todos</span>
          <span className="lf-chip-count">{store.repuestos.length}</span>
        </button>
        {categorias.map((cat) => {
          const count = store.repuestos.filter((r) => r.categoria === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              className={`lf-modern-chip ${filtroCategoria === cat ? 'active' : ''}`}
              onClick={() => setFiltroCategoria(cat)}
            >
              <span>{CATEGORIA_INFO[cat]?.label || cat}</span>
              <span className="lf-chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <div className="lf-inv-sort">
        <span>Ordenar por:</span>
        <button className={sortBy === 'nombre' ? 'active' : ''} onClick={() => setSortBy('nombre')}>Nombre</button>
        <button className={sortBy === 'stock' ? 'active' : ''} onClick={() => setSortBy('stock')}>Stock</button>
        <button className={sortBy === 'precio' ? 'active' : ''} onClick={() => setSortBy('precio')}>Precio</button>
      </div>

      {/* Lista */}
      {repuestosFiltrados.length === 0 ? (
        <EmptyState
          icono={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          }
          titulo="Sin repuestos"
          descripcion="No se encontraron repuestos con esos filtros"
        />
      ) : (
        <div className="lf-inv-grid">
          {repuestosFiltrados.map((r, idx) => {
            const info = CATEGORIA_INFO[r.categoria] || CATEGORIA_INFO.OTRO;
            const stockPct = Math.min(100, (r.stock / Math.max(1, r.stockMinimo * 2)) * 100);
            return (
              <div
                key={r.id}
                className={`lf-inv-card ${r.bajoStock ? 'low-stock' : ''} stagger-item`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="lf-inv-card-header">
                  <div className="lf-inv-card-cat" style={{ background: `${info.color}15`, color: info.color }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={info.icon} />
                    </svg>
                  </div>
                  <div className="lf-inv-card-nombre-wrap">
                    <div className="lf-inv-card-nombre">{r.nombre}</div>
                    <div className="lf-inv-card-sku">{r.sku || '—'}</div>
                  </div>
                  {r.bajoStock && (
                    <div className="lf-inv-card-alert" title="Bajo stock">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB300" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="lf-inv-card-stock-section">
                  <div className="lf-inv-card-stock-info">
                    <div className="lf-inv-card-stock-num">
                      {r.stock}
                      <span className="lf-inv-card-stock-unit"> {r.unidad}</span>
                    </div>
                    <div className="lf-inv-card-stock-bar">
                      <div
                        className="lf-inv-card-stock-fill"
                        style={{
                          width: `${stockPct}%`,
                          background: r.bajoStock
                            ? 'linear-gradient(90deg, #FFB300, #FF9800)'
                            : 'linear-gradient(90deg, #00C853, #00E676)',
                        }}
                      />
                    </div>
                    <div className="lf-inv-card-stock-min">Mín: {r.stockMinimo}</div>
                  </div>
                  <div className="lf-inv-card-precio">C$ {r.precioUnitario.toLocaleString()}</div>
                </div>

                {r.ubicacion && (
                  <div className="lf-inv-card-ubic">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {r.ubicacion}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 100 }} />
    </div>
  );
}
