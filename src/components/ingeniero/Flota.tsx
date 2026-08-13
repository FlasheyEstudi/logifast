// components/ingeniero/Flota.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIngenieroStore, type Moto } from '@/store/ingenieroStore';
import PullToRefresh from '@/components/ui/PullToRefresh';
import EmptyState from '@/components/ui/EmptyState';
import { notify } from '@/lib/notify';

export default function Flota() {
  const store = useIngenieroStore();
  const [vista, setVista] = useState<'grid' | 'lista'>('grid');
  const [qrModalMoto, setQrModalMoto] = useState<Moto | null>(null);

  const motosFiltradas = store.motos.filter((moto) => {
    const matchEstado = !store.filtroEstado || moto.estado === store.filtroEstado;
    const matchBusqueda =
      !store.busquedaFlota ||
      moto.nombre.toLowerCase().includes(store.busquedaFlota.toLowerCase()) ||
      moto.modelo.toLowerCase().includes(store.busquedaFlota.toLowerCase()) ||
      (moto.placa || '').toLowerCase().includes(store.busquedaFlota.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const estados = [
    { value: null, label: 'Todas', count: store.motos.length },
    { value: 'DISPONIBLE', label: 'Disponibles', count: store.motos.filter((m) => m.estado === 'DISPONIBLE').length },
    { value: 'EN_SERVICIO', label: 'En Servicio', count: store.motos.filter((m) => m.estado === 'EN_SERVICIO').length },
    { value: 'EN_MANTENIMIENTO', label: 'En Taller', count: store.mantenimientos.filter((m) => m.estado === 'EN_PROCESO').length || store.motos.filter((m) => m.estado === 'EN_MANTENIMIENTO').length },
    { value: 'FUERA_SERVICIO', label: 'Fuera de Servicio', count: store.motos.filter((m) => m.estado === 'FUERA_SERVICIO').length },
  ];

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, { bg: string; fg: string; label: string }> = {
      DISPONIBLE: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#10B981', label: 'Disponible' },
      EN_SERVICIO: { bg: 'rgba(0, 102, 255, 0.12)', fg: '#0066FF', label: 'En Servicio' },
      EN_MANTENIMIENTO: { bg: 'rgba(255, 179, 0, 0.15)', fg: '#D97706', label: 'En Taller' },
      FUERA_SERVICIO: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#EF4444', label: 'Inactiva' },
    };
    return map[estado] || { bg: 'rgba(148, 163, 184, 0.12)', fg: '#64748B', label: estado };
  };

  const handleDeleteMoto = async (moto: Moto) => {
    if (window.confirm(`¿Estás seguro de eliminar la motocicleta ${moto.nombre} de la flota?`)) {
      await store.eliminarMoto(moto.id);
      notify.success('Motocicleta eliminada de la flota.');
    }
  };

  return (
    <PullToRefresh onRefresh={async () => { await store.cargarDatos(); }}>
      <div className="flota-pantalla" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--lf-text-main, #1a1a2e)' }}>
              Control de Flota y Motocicletas
            </h1>
            <div style={{ fontSize: 13, color: 'var(--lf-text-muted, #6B7280)', marginTop: 4 }}>
              {store.motos.length} motocicletas registradas en el sistema
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* View Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--lf-surface, #ffffff)', padding: 3, borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)' }}>
              <button
                onClick={() => setVista('grid')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: vista === 'grid' ? 'var(--lf-accent-soft, rgba(255, 87, 34, 0.1))' : 'transparent',
                  color: vista === 'grid' ? 'var(--lf-accent, #FF5722)' : 'var(--lf-text-muted, #6B7280)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ⊞ Tarjetas
              </button>
              <button
                onClick={() => setVista('lista')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: vista === 'lista' ? 'var(--lf-accent-soft, rgba(255, 87, 34, 0.1))' : 'transparent',
                  color: vista === 'lista' ? 'var(--lf-accent, #FF5722)' : 'var(--lf-text-muted, #6B7280)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ☰ Lista
              </button>
            </div>

            <button
              onClick={() => store.toggleCrearMoto()}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--lf-accent, #FF5722)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255,87,34,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>+</span> Registrar Moto
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--lf-surface, #ffffff)',
            borderRadius: 14,
            padding: '10px 16px',
            border: '1px solid var(--lf-border, #e5e7eb)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: 16, marginRight: 10, color: '#94A3B8' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar moto por alias, modelo o número de placa..."
            value={store.busquedaFlota}
            onChange={(e) => store.setBusquedaFlota(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              background: 'transparent',
              color: 'var(--lf-text-main, #1a1a2e)',
            }}
          />
          {store.busquedaFlota && (
            <button
              onClick={() => store.setBusquedaFlota('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros de estado */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {estados.map((e) => {
            const isActive = store.filtroEstado === e.value;
            return (
              <button
                key={e.label}
                onClick={() => store.setFiltroEstado(e.value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 12,
                  border: `1px solid ${isActive ? 'var(--lf-accent, #FF5722)' : 'var(--lf-border, #e5e7eb)'}`,
                  background: isActive ? 'var(--lf-accent, #FF5722)' : 'var(--lf-surface, #ffffff)',
                  color: isActive ? '#ffffff' : 'var(--lf-text-muted, #6B7280)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{e.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 99,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--lf-bg, #f1f5f9)',
                    color: isActive ? '#ffffff' : 'inherit',
                  }}
                >
                  {e.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista / Grid de motos */}
        {motosFiltradas.length === 0 ? (
          <EmptyState
            icono={<span style={{ fontSize: 32 }}>🏍️</span>}
            titulo="Sin motocicletas encontradas"
            descripcion="No hay motocicletas que coincidan con los criterios de búsqueda o filtros seleccionados."
            accionLabel="+ Registrar Moto"
            onAccion={() => store.toggleCrearMoto()}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: vista === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
              gap: 16,
            }}
          >
            {motosFiltradas.map((moto) => {
              const badge = getEstadoBadge(moto.estado);
              const motoAlerts = store.alertas.filter((a) => a.motoId === moto.id && a.activa);

              return (
                <div
                  key={moto.id}
                  style={{
                    background: 'var(--lf-surface, #ffffff)',
                    borderRadius: 20,
                    border: '1px solid var(--lf-border, #e5e7eb)',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Left accent strip */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: 4,
                      background: moto.color && moto.color.startsWith('#') ? moto.color : 'var(--lf-accent, #FF5722)',
                    }}
                  />

                  {/* Top Bar: Name + Model + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 6 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-accent, #FF5722)', textTransform: 'uppercase' }}>
                        {moto.modelo} · {moto.anio || 2024}
                      </div>
                      <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--lf-text-main, #1a1a2e)' }}>
                        {moto.nombre}
                      </h3>
                      {moto.placa && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted, #94A3B8)', fontFamily: 'monospace', marginTop: 2 }}>
                          PLACA: {moto.placa}
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.fg,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Metrics: Odómetro & Repartidor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingLeft: 6 }}>
                    <div style={{ background: 'var(--lf-bg, #f8fafc)', padding: 10, borderRadius: 12, border: '1px solid var(--lf-border, #e2e8f0)' }}>
                      <div style={{ fontSize: 10, color: 'var(--lf-text-muted, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>Kilometraje</div>
                      <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: 'var(--lf-text-main, #1a1a2e)' }}>
                        {(moto.kmAcumulados || 0).toLocaleString()} km
                      </div>
                    </div>

                    <div style={{ background: 'var(--lf-bg, #f8fafc)', padding: 10, borderRadius: 12, border: '1px solid var(--lf-border, #e2e8f0)' }}>
                      <div style={{ fontSize: 10, color: 'var(--lf-text-muted, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>Asignada a</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: moto.repartidorNombre || moto.asignadaA ? '#0066FF' : 'var(--lf-text-muted, #94A3B8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {moto.repartidorNombre || (moto.asignadaA ? 'Repartidor' : 'Sin asignar')}
                      </div>
                    </div>
                  </div>

                  {/* Active Alerts (if any) */}
                  {motoAlerts.length > 0 && (
                    <div style={{ background: 'rgba(255, 179, 0, 0.12)', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255, 179, 0, 0.3)', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10 }}>
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>
                        {motoAlerts[0]?.descripcion || 'Alerta de mantenimiento activa'}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--lf-border, #e5e7eb)', paddingTop: 12, paddingLeft: 6 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => store.seleccionarMoto(moto)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--lf-border, #e2e8f0)',
                          background: '#ffffff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: 'var(--lf-text-main, #1a1a2e)',
                        }}
                      >
                        ⚙️ Administrar
                      </button>

                      <button
                        onClick={() => setQrModalMoto(moto)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--lf-border, #e2e8f0)',
                          background: '#ffffff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: 'var(--lf-text-muted, #64748B)',
                        }}
                        title="Ver Código QR"
                      >
                        📱 QR
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          store.seleccionarMoto(moto);
                          store.toggleCrearMantenimiento();
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'var(--lf-accent-soft, rgba(255, 87, 34, 0.1))',
                          color: 'var(--lf-accent, #FF5722)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        + Taller
                      </button>

                      <button
                        onClick={() => handleDeleteMoto(moto)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                        title="Eliminar de la flota"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MODAL CÓDIGO QR ── */}
        <AnimatePresence>
          {qrModalMoto && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 16,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setQrModalMoto(null)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                }}
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 380,
                  background: 'var(--lf-surface, #ffffff)',
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  zIndex: 10000,
                  border: '1px solid var(--lf-border, #e5e7eb)',
                  textAlign: 'center',
                }}
              >
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--lf-text-main, #1a1a2e)' }}>
                  {qrModalMoto.nombre}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 16 }}>
                  {qrModalMoto.modelo} · Placa: {qrModalMoto.placa || 'N/A'}
                </div>

                {/* QR Code graphic representation */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: 18,
                    borderRadius: 16,
                    border: '2px solid #000',
                    display: 'inline-block',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
                    <rect x="2" y="2" width="8" height="8" rx="1" fill="#000" />
                    <rect x="4" y="4" width="4" height="4" fill="#fff" />
                    <rect x="14" y="2" width="8" height="8" rx="1" fill="#000" />
                    <rect x="16" y="4" width="4" height="4" fill="#fff" />
                    <rect x="2" y="14" width="8" height="8" rx="1" fill="#000" />
                    <rect x="4" y="16" width="4" height="4" fill="#fff" />
                    <rect x="13" y="13" width="3" height="3" fill="#000" />
                    <rect x="18" y="13" width="4" height="2" fill="#000" />
                    <rect x="13" y="18" width="4" height="4" fill="#000" />
                    <rect x="19" y="18" width="3" height="3" fill="#000" />
                  </svg>
                </div>

                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--lf-text-muted, #6B7280)', marginBottom: 20 }}>
                  ID: {qrModalMoto.id}
                </div>

                <button
                  onClick={() => setQrModalMoto(null)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--lf-accent, #FF5722)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div style={{ height: 100 }} />
      </div>
    </PullToRefresh>
  );
}
