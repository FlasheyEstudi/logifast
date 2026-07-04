// components/ingeniero/Mantenimientos.tsx
'use client';

import React from 'react';
import { useIngenieroStore } from '@/store/ingenieroStore';
import PullToRefresh from '@/components/ui/PullToRefresh';
import EmptyState from '@/components/ui/EmptyState';

export default function Mantenimientos() {
  const store = useIngenieroStore();

  const mantenimientosFiltrados = store.mantenimientos.filter(m => {
    if (store.mantenimientosFiltro === 'todos') return true;
    if (store.mantenimientosFiltro === 'programados') return m.estado === 'PROGRAMADO';
    if (store.mantenimientosFiltro === 'en_proceso') return m.estado === 'EN_PROCESO';
    if (store.mantenimientosFiltro === 'completados') return m.estado === 'COMPLETADO';
    return true;
  });

  const getPrioridadColor = (p: string) => {
    const map: Record<string, string> = {
      'BAJA': '#2979FF',
      'NORMAL': '#00C853',
      'ALTA': '#FFB300',
      'URGENTE': '#FF1744'
    };
    return map[p] || '#8E8EA0';
  };

  const getEstadoBadge = (e: string) => {
    const map: Record<string, { class: string; label: string }> = {
      'PROGRAMADO': { class: 'programada', label: 'Programado' },
      'EN_PROCESO': { class: 'en-camino', label: 'En proceso' },
      'COMPLETADO': { class: 'entregado', label: 'Completado' },
      'CANCELADO': { class: 'cancelado', label: 'Cancelado' }
    };
    return map[e] || { class: '', label: e };
  };

  return (
    <PullToRefresh onRefresh={async () => { await store.cargarDatos(); }}>
      <div className="mantenimientos-pantalla">
        {/* Header */}
        <div className="mantenimientos-header">
          <h1 className="pantalla-title">Mantenimientos</h1>
          <button
            className="lf-btn lf-btn-primary lf-btn-sm"
            onClick={() => store.toggleCrearMantenimiento()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo
          </button>
        </div>

        {/* Filtros */}
        <div className="mantenimientos-filtros">
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'programados', label: 'Programados' },
            { value: 'en_proceso', label: 'En proceso' },
            { value: 'completados', label: 'Completados' }
          ].map(f => (
            <button
              key={f.value}
              className={`mantenimientos-filtro ${store.mantenimientosFiltro === f.value ? 'active' : ''}`}
              onClick={() => store.setMantenimientosFiltro(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {mantenimientosFiltrados.length === 0 ? (
          <EmptyState
            icono={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            }
            titulo="Sin mantenimientos"
            descripcion="Crea un nuevo mantenimiento para una moto de la flota"
            accion={{ label: 'Crear mantenimiento', onClick: () => store.toggleCrearMantenimiento() }}
          />
        ) : (
          <div className="mantenimientos-lista">
            {mantenimientosFiltrados.map((m, idx) => {
              const badge = getEstadoBadge(m.estado);
              return (
                <div
                  key={m.id}
                  className="mantenimiento-card stagger-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => store.seleccionarMantenimiento(m)}
                >
                  <div className="mantenimiento-card-header">
                    <div className="mantenimiento-card-tipo">
                      <span
                        className="mantenimiento-prioridad-dot"
                        style={{ background: getPrioridadColor(m.prioridad) }}
                      />
                      <span className="mantenimiento-tipo-text">{m.tipo}</span>
                    </div>
                    <span className={`lf-badge lf-badge-${badge.class}`}>{badge.label}</span>
                  </div>

                  <div className="mantenimiento-card-body">
                    <div className="mantenimiento-card-moto">
                      {m.motoNombre} · {m.motoModelo}
                    </div>
                    <div className="mantenimiento-card-desc">{m.descripcion}</div>
                    <div className="mantenimiento-card-meta">
                      <span className="mono">{m.kmAlMomento.toLocaleString()} km</span>
                      <span>·</span>
                      <span className="mono bold">C$ {m.costoTotal.toLocaleString()}</span>
                      {m.programadoPara && (
                        <>
                          <span>·</span>
                          <span>{new Date(m.programadoPara).toLocaleDateString('es-NI', { day: 'numeric', month: 'short' })}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Acciones segun estado */}
                  {m.estado === 'PROGRAMADO' && (
                    <div className="mantenimiento-card-acciones">
                      <button
                        className="lf-btn lf-btn-primary lf-btn-sm lf-btn-block"
                        onClick={(e) => { e.stopPropagation(); store.iniciarMantenimiento(m.id) }}
                      >
                        Iniciar
                      </button>
                      <button
                        className="lf-btn lf-btn-ghost lf-btn-sm"
                        onClick={(e) => { e.stopPropagation(); store.cancelarMantenimiento(m.id) }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {m.estado === 'EN_PROCESO' && (
                    <div className="mantenimiento-card-acciones">
                      <button
                        className="lf-btn lf-btn-primary lf-btn-sm lf-btn-block"
                        style={{ background: '#00C853' }}
                        onClick={(e) => { e.stopPropagation(); store.completarMantenimiento(m.id, m.costoTotal) }}
                      >
                        Completar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>
    </PullToRefresh>
  );
}
