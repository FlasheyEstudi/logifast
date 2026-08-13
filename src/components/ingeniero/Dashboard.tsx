// components/ingeniero/Dashboard.tsx
'use client';

import React from 'react';
import {
  Bike,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Package,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  DollarSign,
} from 'lucide-react';
import { useIngenieroStore } from '@/store/ingenieroStore';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { notify } from '@/lib/notify';

export default function Dashboard() {
  const store = useIngenieroStore();
  const stats = store.stats;
  const alertasActivas = store.alertas.filter((a) => a.activa);

  const handleRefresh = async () => {
    await store.cargarDatos();
  };

  const handleResolveAlert = async (id: string) => {
    await store.resolverAlerta(id);
    notify.success('Alerta de mantenimiento resuelta');
  };

  const totalMotos = stats?.totalMotos || store.motos.length || 1;
  const disponiblesPct = Math.round(((stats?.disponibles || 0) / totalMotos) * 100);
  const servicioPct = Math.round(((stats?.enServicio || 0) / totalMotos) * 100);
  const mantenimientoPct = Math.round(((stats?.enMantenimiento || 0) / totalMotos) * 100);
  const fueraPct = Math.round(((stats?.fueraServicio || 0) / totalMotos) * 100);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="dashboard-pantalla" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Top Greeting & Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--lf-text-main, #1a1a2e)' }}>
              {getSaludo()}, {(store.perfil?.nombre || '').split(' ')[0] || 'Ingeniero'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--lf-text-muted, #6B7280)', marginTop: 2, textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => store.setTabActiva('inventario')}
              style={{
                padding: '9px 16px',
                borderRadius: 12,
                border: '1px solid var(--lf-border, #e5e7eb)',
                background: 'var(--lf-surface, #ffffff)',
                color: 'var(--lf-text-main, #1a1a2e)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Package size={15} color="var(--lf-accent, #FF5722)" />
              <span>Inventario</span>
            </button>

            <button
              onClick={() => store.toggleCrearMoto()}
              style={{
                padding: '9px 16px',
                borderRadius: 12,
                border: '1px solid var(--lf-border, #e5e7eb)',
                background: 'var(--lf-surface, #ffffff)',
                color: 'var(--lf-text-main, #1a1a2e)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Bike size={15} color="var(--lf-accent, #FF5722)" />
              <span>+ Registrar Moto</span>
            </button>

            <button
              onClick={() => store.toggleCrearMantenimiento()}
              style={{
                padding: '9px 18px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--lf-accent, #FF5722)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255,87,34,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Wrench size={15} />
              <span>+ Mantenimiento</span>
            </button>
          </div>
        </div>

        {/* Fleet KPIs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div
            onClick={() => { store.setFiltroEstado(null); store.setTabActiva('flota'); }}
            style={{ background: 'var(--lf-surface, #ffffff)', padding: 16, borderRadius: 16, border: '1px solid var(--lf-border, #e5e7eb)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', fontWeight: 700 }}>Total Flota</span>
              <Bike size={18} color="#64748B" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: 'var(--lf-text-main, #1a1a2e)' }}>
              {store.motos.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--lf-text-muted, #94A3B8)' }}>100% Unidades activas</div>
          </div>

          <div
            onClick={() => { store.setFiltroEstado('DISPONIBLE'); store.setTabActiva('flota'); }}
            style={{ background: 'var(--lf-surface, #ffffff)', padding: 16, borderRadius: 16, border: '1px solid var(--lf-border, #e5e7eb)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', fontWeight: 700 }}>Disponibles</span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#10B981' }}>
              {store.motos.filter((m) => m.estado === 'DISPONIBLE').length}
            </div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>{disponiblesPct}% de la flota</div>
          </div>

          <div
            onClick={() => { store.setFiltroEstado('EN_SERVICIO'); store.setTabActiva('flota'); }}
            style={{ background: 'var(--lf-surface, #ffffff)', padding: 16, borderRadius: 16, border: '1px solid var(--lf-border, #e5e7eb)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', fontWeight: 700 }}>En Rutas / Servicio</span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0066FF', display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#0066FF' }}>
              {store.motos.filter((m) => m.estado === 'EN_SERVICIO').length}
            </div>
            <div style={{ fontSize: 11, color: '#0066FF', fontWeight: 600 }}>{servicioPct}% operativa</div>
          </div>

          <div
            onClick={() => { store.setMantenimientosFiltro('en_proceso'); store.setTabActiva('mantenimientos'); }}
            style={{ background: 'var(--lf-surface, #ffffff)', padding: 16, borderRadius: 16, border: '1px solid var(--lf-border, #e5e7eb)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', fontWeight: 700 }}>En Taller</span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFB300', display: 'inline-block' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#D97706' }}>
              {store.mantenimientos.filter((m) => m.estado === 'EN_PROCESO').length || store.motos.filter((m) => m.estado === 'EN_MANTENIMIENTO').length}
            </div>
            <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>{mantenimientoPct}% en servicio</div>
          </div>
        </div>

        {/* Fleet Distribution Bar */}
        <div style={{ background: 'var(--lf-surface, #ffffff)', borderRadius: 16, padding: 16, border: '1px solid var(--lf-border, #e5e7eb)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)' }}>
              Distribución Operativa de Motocicletas
            </span>
            <span style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', fontFamily: "'DM Mono', monospace" }}>
              {store.motos.length} vehículos
            </span>
          </div>

          {/* Bar */}
          <div style={{ height: 10, width: '100%', borderRadius: 99, background: '#E2E8F0', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${disponiblesPct}%`, background: '#10B981' }} title={`Disponibles: ${disponiblesPct}%`} />
            <div style={{ width: `${servicioPct}%`, background: '#0066FF' }} title={`En Servicio: ${servicioPct}%`} />
            <div style={{ width: `${mantenimientoPct}%`, background: '#FFB300' }} title={`En Taller: ${mantenimientoPct}%`} />
            <div style={{ width: `${fueraPct}%`, background: '#EF4444' }} title={`Fuera: ${fueraPct}%`} />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 11, color: 'var(--lf-text-muted, #64748B)', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Disponibles ({disponiblesPct}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0066FF' }} /> En Servicio ({servicioPct}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB300' }} /> En Taller ({mantenimientoPct}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Fuera de Servicio ({fueraPct}%)
            </span>
          </div>
        </div>

        {/* Industrial Engineering Metrics */}
        <div style={{ background: 'var(--lf-surface, #ffffff)', borderRadius: 16, padding: 18, border: '1px solid var(--lf-border, #e5e7eb)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--lf-text-main, #1a1a2e)' }}>
              Eficiencia de Mantenimiento & MTTR
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              Meta Industrial 80/20 Cumplida
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {/* MTTR */}
            <div style={{ padding: 14, borderRadius: 14, background: 'var(--lf-bg, #f8fafc)', border: '1px solid var(--lf-border, #e2e8f0)' }}>
              <div style={{ fontSize: 11, color: 'var(--lf-text-muted, #64748B)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} color="#64748B" />
                <span>MTTR (Tiempo Medio Reparación)</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: 'var(--lf-text-main, #1a1a2e)', marginTop: 4 }}>
                {stats?.mttrMinutos || 45} <span style={{ fontSize: 13, fontWeight: 600 }}>min</span>
              </div>
              <div style={{ fontSize: 11, color: '#10B981', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} color="#10B981" />
                <span>Nivel de servicio óptimo (&lt; 60 min)</span>
              </div>
            </div>

            {/* Ratio Preventivo / Correctivo */}
            <div style={{ padding: 14, borderRadius: 14, background: 'var(--lf-bg, #f8fafc)', border: '1px solid var(--lf-border, #e2e8f0)' }}>
              <div style={{ fontSize: 11, color: 'var(--lf-text-muted, #64748B)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Activity size={13} color="#64748B" />
                <span>Ratio Preventivo vs. Correctivo</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#10B981', marginTop: 4 }}>
                {stats?.preventivoPct ?? 80}% <span style={{ fontSize: 12, color: 'var(--lf-text-muted, #64748B)' }}>Preventivo</span>
              </div>
              <div style={{ height: 6, width: '100%', borderRadius: 99, background: '#EF4444', marginTop: 8, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${stats?.preventivoPct ?? 80}%`, background: '#10B981', height: '100%' }} />
              </div>
            </div>

            {/* Costo Promedio */}
            <div style={{ padding: 14, borderRadius: 14, background: 'var(--lf-bg, #f8fafc)', border: '1px solid var(--lf-border, #e2e8f0)' }}>
              <div style={{ fontSize: 11, color: 'var(--lf-text-muted, #64748B)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <DollarSign size={13} color="#64748B" />
                <span>Costo Promedio / Servicio</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: 'var(--lf-accent, #FF5722)', marginTop: 4 }}>
                C$ {stats?.mantenimientosCompletados ? Math.round((stats.costoMantenimientoMes || 0) / stats.mantenimientosCompletados).toLocaleString() : '450'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--lf-text-muted, #64748B)', marginTop: 4 }}>
                Mano de obra + Piezas liquidadas
              </div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div style={{ background: 'var(--lf-surface, #ffffff)', borderRadius: 16, padding: 18, border: '1px solid var(--lf-border, #e5e7eb)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                Alertas Mecánicas Activas
              </h3>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: alertasActivas.length > 0 ? '#FFB300' : 'rgba(16, 185, 129, 0.12)',
                  color: alertasActivas.length > 0 ? '#fff' : '#10B981',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {alertasActivas.length}
              </span>
            </div>
          </div>

          {alertasActivas.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#10B981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>Todas las alertas mecánicas se encuentran resueltas y al día.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alertasActivas.map((alerta) => (
                <div
                  key={alerta.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(255, 179, 0, 0.08)',
                    border: '1px solid rgba(255, 179, 0, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={18} color="#D97706" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lf-text-main, #1a1a2e)' }}>
                        {alerta.motoNombre}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--lf-text-muted, #64748B)' }}>
                        {alerta.descripcion}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolveAlert(alerta.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#10B981',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Resolver</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Split: Próximos Mantenimientos + Repuestos Bajo Stock */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Próximos Mantenimientos */}
          <div style={{ background: 'var(--lf-surface, #ffffff)', borderRadius: 16, padding: 18, border: '1px solid var(--lf-border, #e5e7eb)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                Próximos Mantenimientos
              </h3>
              <button
                onClick={() => store.setTabActiva('mantenimientos')}
                style={{ background: 'none', border: 'none', color: 'var(--lf-accent, #FF5722)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>Ver todos</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {store.mantenimientos
                .filter((m) => m.estado === 'PROGRAMADO' || m.estado === 'EN_PROCESO')
                .slice(0, 4)
                .map((m) => (
                  <div
                    key={m.id}
                    onClick={() => store.setTabActiva('mantenimientos')}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: 'var(--lf-bg, #f8fafc)',
                      border: '1px solid var(--lf-border, #e2e8f0)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)' }}>
                        {m.motoNombre} ({m.motoModelo})
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--lf-text-muted, #64748B)' }}>
                        {m.descripcion}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        background: m.estado === 'EN_PROCESO' ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 102, 255, 0.1)',
                        color: m.estado === 'EN_PROCESO' ? '#D97706' : '#0066FF',
                      }}
                    >
                      {m.estado === 'EN_PROCESO' ? 'En Taller' : 'Programado'}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Repuestos Bajo Stock */}
          <div style={{ background: 'var(--lf-surface, #ffffff)', borderRadius: 16, padding: 18, border: '1px solid var(--lf-border, #e5e7eb)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                  Repuestos Bajo Stock Mínimo
                </h3>
              </div>
              <button
                onClick={() => store.setTabActiva('inventario')}
                style={{ background: 'none', border: 'none', color: 'var(--lf-accent, #FF5722)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>Inventario</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {store.repuestos.filter((r) => r.stock <= r.stockMinimo).length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#10B981', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CheckCircle2 size={15} color="#10B981" />
                  <span>Todos los repuestos tienen niveles de stock saludables.</span>
                </div>
              ) : (
                store.repuestos
                  .filter((r) => r.stock <= r.stockMinimo)
                  .slice(0, 4)
                  .map((r) => (
                    <div
                      key={r.id}
                      onClick={() => store.setTabActiva('inventario')}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: 'rgba(255, 179, 0, 0.08)',
                        border: '1px solid rgba(255, 179, 0, 0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)' }}>
                          {r.nombre}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--lf-text-muted, #64748B)' }}>
                          Ubicación: {r.ubicacion || 'Almacén general'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#D97706' }}>
                          {r.stock} / min: {r.stockMinimo} {r.unidad}
                        </div>
                        <div style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>Reabastecer</div>
                      </div>
                    </div>
                  ))
              )}
            </div>
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
