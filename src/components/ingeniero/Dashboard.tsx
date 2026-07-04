// components/ingeniero/Dashboard.tsx
'use client';

import React from 'react';
import { useIngenieroStore } from '@/store/ingenieroStore';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function Dashboard() {
  const store = useIngenieroStore();
  const stats = store.stats;
  const alertasActivas = store.alertas.filter(a => a.activa);

  const handleRefresh = async () => {
    await store.cargarDatos();
  };


  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="dashboard-pantalla">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-saludo">
              {getSaludo()}, {store.perfil.nombre.split(' ')[0]}
            </div>
            <div className="dashboard-fecha">
              {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="dashboard-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
        </div>

        {/* KPIs de la flota */}
        <div className="dashboard-kpis">
          <div className="dashboard-kpi dashboard-kpi-total">
            <div className="dashboard-kpi-valor">{stats.totalMotos}</div>
            <div className="dashboard-kpi-label">Total motos</div>
          </div>
          <div className="dashboard-kpi dashboard-kpi-disponible">
            <div className="dashboard-kpi-valor">{stats.disponibles}</div>
            <div className="dashboard-kpi-label">Disponibles</div>
          </div>
          <div className="dashboard-kpi dashboard-kpi-servicio">
            <div className="dashboard-kpi-valor">{stats.enServicio}</div>
            <div className="dashboard-kpi-label">En servicio</div>
          </div>
          <div className="dashboard-kpi dashboard-kpi-mantenimiento">
            <div className="dashboard-kpi-valor">{stats.enMantenimiento}</div>
            <div className="dashboard-kpi-label">En taller</div>
          </div>
        </div>

        {/* Barra de estado de la flota */}
        <div className="dashboard-flota-bar">
          <div className="flota-bar-label">Estado de la flota</div>
          <div className="flota-bar">
            <div
              className="flota-bar-segment disponible"
              style={{ width: `${(stats.disponibles / (stats.totalMotos || 1)) * 100}%` }}
            />
            <div
              className="flota-bar-segment servicio"
              style={{ width: `${(stats.enServicio / (stats.totalMotos || 1)) * 100}%` }}
            />
            <div
              className="flota-bar-segment mantenimiento"
              style={{ width: `${(stats.enMantenimiento / (stats.totalMotos || 1)) * 100}%` }}
            />
            <div
              className="flota-bar-segment fuera"
              style={{ width: `${(stats.fueraServicio / (stats.totalMotos || 1)) * 100}%` }}
            />
          </div>
          <div className="flota-bar-leyenda">
            <span><i className="dot disponible" /> Disponibles</span>
            <span><i className="dot servicio" /> En servicio</span>
            <span><i className="dot mantenimiento" /> En taller</span>
            <span><i className="dot fuera" /> Fuera</span>
          </div>
        </div>

        {/* Mantenimientos del mes */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Resumen del mes</h3>
          </div>
          <div className="dashboard-mes-stats">
            <div className="dashboard-mes-stat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <div className="dashboard-mes-valor mono">{stats.mantenimientosCompletados}</div>
                <div className="dashboard-mes-label">Completados</div>
              </div>
            </div>
            <div className="dashboard-mes-stat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB300" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <div>
                <div className="dashboard-mes-valor mono">{stats.mantenimientosPendientes}</div>
                <div className="dashboard-mes-label">Pendientes</div>
              </div>
            </div>
            <div className="dashboard-mes-stat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <div>
                <div className="dashboard-mes-valor mono">C$ {stats.costoMantenimientoMes.toLocaleString()}</div>
                <div className="dashboard-mes-label">Costo total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas activas */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Alertas activas</h3>
            <span className="dashboard-section-badge">{alertasActivas.length}</span>
          </div>

          {alertasActivas.length === 0 ? (
            <div className="dashboard-alertas-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Sin alertas pendientes</span>
            </div>
          ) : (
            <div className="dashboard-alertas">
              {alertasActivas.map(alerta => (
                <div
                  key={alerta.id}
                  className={`dashboard-alerta ${alerta.urgente ? 'urgente' : ''}`}
                >
                  <div className="dashboard-alerta-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="dashboard-alerta-info">
                    <div className="dashboard-alerta-moto mono">{alerta.motoNombre}</div>
                    <div className="dashboard-alerta-desc">{alerta.descripcion}</div>
                  </div>
                  <button
                    className="dashboard-alerta-action"
                    onClick={() => store.resolverAlerta(alerta.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proximos mantenimientos */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Proximos mantenimientos</h3>
          </div>
          <div className="dashboard-proximos">
            {store.mantenimientos
              .filter(m => m.estado === 'PROGRAMADO')
              .sort((a, b) => (a.programadoPara || '').localeCompare(b.programadoPara || ''))
              .slice(0, 3)
              .map(m => (
                <div
                  key={m.id}
                  className="dashboard-proximo"
                  onClick={() => store.seleccionarMantenimiento(m)}
                >
                  <div className={`dashboard-proximo-prioridad ${m.prioridad.toLowerCase()}`} />
                  <div className="dashboard-proximo-info">
                    <div className="dashboard-proximo-moto">{m.motoNombre} · {m.motoModelo}</div>
                    <div className="dashboard-proximo-desc">{m.descripcion}</div>
                  </div>
                  <div className="dashboard-proximo-fecha">
                    {m.programadoPara
                      ? new Date(m.programadoPara).toLocaleDateString('es-NI', { day: 'numeric', month: 'short' })
                      : 'Sin fecha'}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Repuestos bajo stock */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">Repuestos bajo stock</h3>
            <span className="dashboard-section-badge warning">{stats.repuestosBajoStock}</span>
          </div>
          <div className="dashboard-repuestos-bajo">
            {store.repuestos.filter(r => r.bajoStock).map(r => (
              <div key={r.id} className="dashboard-repuesto-bajo">
                <div className="dashboard-repuesto-info">
                  <div className="dashboard-repuesto-nombre">{r.nombre}</div>
                  <div className="dashboard-repuesto-stock">
                    Stock: <span className="mono bold">{r.stock}</span> / min: {r.stockMinimo}
                  </div>
                </div>
                <div className="dashboard-repuesto-categoria">
                  {r.categoria}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 100 }} />
      </div>
    </PullToRefresh>
  );
}

function getSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 18) return 'Buenas tardes';
  return 'Buenas noches';
}
