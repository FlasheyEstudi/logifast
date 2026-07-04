// components/ingeniero/Flota.tsx
'use client';

import React, { useState } from 'react';
import { useIngenieroStore } from '@/store/ingenieroStore';
import PullToRefresh from '@/components/ui/PullToRefresh';
import EmptyState from '@/components/ui/EmptyState';

export default function Flota() {
  const store = useIngenieroStore();
  const [vista, setVista] = useState<'lista' | 'grid'>('lista');

  const motosFiltradas = store.motos.filter(moto => {
    const matchEstado = !store.filtroEstado || moto.estado === store.filtroEstado;
    const matchBusqueda = !store.busquedaFlota ||
      moto.nombre.toLowerCase().includes(store.busquedaFlota.toLowerCase()) ||
      moto.modelo.toLowerCase().includes(store.busquedaFlota.toLowerCase()) ||
      (moto.placa || '').toLowerCase().includes(store.busquedaFlota.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const estados = [
    { value: null, label: 'Todas', count: store.motos.length },
    { value: 'DISPONIBLE', label: 'Disponibles', count: store.motos.filter(m => m.estado === 'DISPONIBLE').length },
    { value: 'EN_SERVICIO', label: 'En servicio', count: store.motos.filter(m => m.estado === 'EN_SERVICIO').length },
    { value: 'EN_MANTENIMIENTO', label: 'En taller', count: store.motos.filter(m => m.estado === 'EN_MANTENIMIENTO').length },
    { value: 'FUERA_SERVICIO', label: 'Fuera', count: store.motos.filter(m => m.estado === 'FUERA_SERVICIO').length }
  ];

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, { class: string; label: string }> = {
      'DISPONIBLE': { class: 'disponible', label: 'Disponible' },
      'EN_SERVICIO': { class: 'servicio', label: 'En servicio' },
      'EN_MANTENIMIENTO': { class: 'mantenimiento', label: 'En taller' },
      'FUERA_SERVICIO': { class: 'fuera', label: 'Fuera de servicio' }
    };
    return map[estado] || { class: '', label: estado };
  };

  return (
    <PullToRefresh onRefresh={async () => { await store.cargarDatos(); }}>
      <div className="flota-pantalla">
        {/* Header */}
        <div className="flota-header">
          <h1 className="pantalla-title">Flota</h1>
          <div className="flota-header-count mono">{store.motos.length} motos</div>
        </div>

        {/* Buscador */}
        <div className="flota-buscador">
          <div className="buscador-input">
            <svg className="buscador-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="buscador-text-input"
              placeholder="Buscar por nombre, modelo o placa..."
              value={store.busquedaFlota}
              onChange={e => store.setBusquedaFlota(e.target.value)}
            />
            {store.busquedaFlota && (
              <button className="buscador-clear" onClick={() => store.setBusquedaFlota('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filtros de estado */}
        <div className="flota-filtros filtros-scroll">
          {estados.map(e => (
            <button
              key={e.value || 'all'}
              className={`filtro-pill ${store.filtroEstado === e.value ? 'active' : ''}`}
              onClick={() => store.setFiltroEstado(e.value)}
            >
              {e.label}
              <span className="filtro-pill-count">{e.count}</span>
            </button>
          ))}
        </div>

        {/* Lista de motos */}
        {motosFiltradas.length === 0 ? (
          <EmptyState
            icono={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <path d="M15 6H9"/>
                <path d="M12 6V14"/>
              </svg>
            }
            titulo="Sin motos"
            descripcion="No se encontraron motos con esos filtros"
          />
        ) : (
          <div className="flota-lista">
            {motosFiltradas.map((moto, idx) => {
              const badge = getEstadoBadge(moto.estado);
              return (
                <div
                  key={moto.id}
                  className="flota-moto-card stagger-item"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => store.seleccionarMoto(moto)}
                >
                  <div
                    className="flota-moto-color"
                    style={{ background: moto.color || '#8E8EA0' }}
                  />

                  <div className="flota-moto-info">
                    <div className="flota-moto-top">
                      <div className="flota-moto-nombre">{moto.nombre}</div>
                      <span className={`lf-badge lf-badge-${badge.class}`}>{badge.label}</span>
                    </div>
                    <div className="flota-moto-modelo">{moto.modelo}</div>
                    <div className="flota-moto-meta">
                      <span className="mono">{moto.kmAcumulados.toLocaleString()} km</span>
                      {moto.placa && <span>{moto.placa}</span>}
                      {moto.repartidorNombre && (
                        <span className="flota-moto-repartidor">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          {moto.repartidorNombre}
                        </span>
                      )}
                    </div>
                    {moto.alertas > 0 && (
                      <div className="flota-moto-alerta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB300" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span>{moto.alertas} alerta{moto.alertas > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8EA0" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
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
