// components/ingeniero/Mantenimientos.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIngenieroStore } from '@/store/ingenieroStore';
import PullToRefresh from '@/components/ui/PullToRefresh';
import EmptyState from '@/components/ui/EmptyState';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { notify } from '@/lib/notify';

interface Foto {
  id: string;
  url: string;
  filename: string;
}

/* ═══════════════════════════════════════════════
   FOTOS LRU CACHE
   Limita `selectedFotos` a FOTOS_CACHE_MAX entradas
   con política LRU (Least Recently Used).
   ═══════════════════════════════════════════════ */
const FOTOS_CACHE_MAX = 50;

export default function Mantenimientos() {
  const store = useIngenieroStore();
  const [selectedFotos, setSelectedFotos] = useState<Record<string, Foto[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  // Orden de acceso LRU: el índice 0 es el menos usado, el último es el más reciente.
  const fotosOrderRef = useRef<string[]>([]);

  /**
   * Escribe fotos para `mantId` (acepta un updater) y actualiza el orden LRU.
   * Si el cache excede FOTOS_CACHE_MAX, evicta la entrada menos usada.
   */
  const writeFotos = useCallback(
    (mantId: string, updater: (prev: Foto[] | undefined) => Foto[]) => {
      setSelectedFotos((prev) => {
        const nextFotos = updater(prev[mantId]);
        // Mover mantId al final (más recientemente usado)
        const order = fotosOrderRef.current.filter((k) => k !== mantId);
        order.push(mantId);
        fotosOrderRef.current = order;
        const next: Record<string, Foto[]> = { ...prev, [mantId]: nextFotos };
        // Evictar LRU si excede el cap
        while (fotosOrderRef.current.length > FOTOS_CACHE_MAX) {
          const oldest = fotosOrderRef.current.shift();
          if (oldest !== undefined) delete next[oldest];
        }
        return next;
      });
    },
    []
  );

  /**
   * Marca `mantId` como recientemente usado sin modificar sus fotos.
   * Útil para bump de LRU al abrir una tarjeta (aunque el fetch aún no retorne).
   */
  const touchFotos = useCallback((mantId: string) => {
    const order = fotosOrderRef.current.filter((k) => k !== mantId);
    order.push(mantId);
    fotosOrderRef.current = order;
    setSelectedFotos((prev) => {
      if (fotosOrderRef.current.length <= FOTOS_CACHE_MAX) return prev;
      const next = { ...prev };
      while (fotosOrderRef.current.length > FOTOS_CACHE_MAX) {
        const oldest = fotosOrderRef.current.shift();
        if (oldest !== undefined) delete next[oldest];
      }
      return next;
    });
  }, []);


  const mantenimientosFiltrados = store.mantenimientos.filter((m) => {
    if (store.mantenimientosFiltro === 'todos') return true;
    if (store.mantenimientosFiltro === 'programados') return m.estado === 'PROGRAMADO';
    if (store.mantenimientosFiltro === 'en_proceso') return m.estado === 'EN_PROCESO';
    if (store.mantenimientosFiltro === 'completados') return m.estado === 'COMPLETADO';
    return true;
  });

  // Cargar fotos para el mantenimiento abierto
  useEffect(() => {
    if (!openId) return;
    // Marcar la tarjeta como recientemente usada (bump LRU) aunque el fetch falle.
    touchFotos(openId);
    fetch(`/api/mantenimientos/${openId}/fotos`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.fotos) {
          writeFotos(openId, () => data.fotos);
        }
      })
      .catch(() => null);
  }, [openId, touchFotos, writeFotos]);

  const getPrioridadColor = (p: string) => {
    const map: Record<string, string> = {
      BAJA: '#2979FF',
      NORMAL: '#00C853',
      ALTA: '#FFB300',
      URGENTE: '#FF1744',
    };
    return map[p] || '#8E8EA0';
  };

  const getPrioridadGlow = (p: string) => {
    const map: Record<string, string> = {
      BAJA: 'rgba(41,121,255,0.2)',
      NORMAL: 'rgba(0,200,83,0.2)',
      ALTA: 'rgba(255,179,0,0.25)',
      URGENTE: 'rgba(255,23,68,0.3)',
    };
    return map[p] || 'transparent';
  };

  const getEstadoInfo = (e: string) => {
    const map: Record<string, { bg: string; fg: string; label: string; icon: string }> = {
      PROGRAMADO: { bg: 'rgba(41,121,255,0.12)', fg: '#2979FF', label: 'Programado', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
      EN_PROCESO: { bg: 'rgba(255,179,0,0.12)', fg: '#FFB300', label: 'En proceso', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
      COMPLETADO: { bg: 'rgba(0,200,83,0.12)', fg: '#00C853', label: 'Completado', icon: 'M5 13l4 4L19 7' },
      CANCELADO: { bg: 'rgba(142,142,160,0.12)', fg: '#8E8EA0', label: 'Cancelado', icon: 'M6 18L18 6M6 6l12 12' },
    };
    return map[e] || { bg: 'rgba(142,142,160,0.12)', fg: '#8E8EA0', label: e, icon: 'M12 8v4l3 3' };
  };

  const handleFotoSubida = (mantId: string, url: string) => {
    writeFotos(mantId, (prev) => [...(prev || []), { id: Date.now().toString(), url, filename: '' }]);
  };

  return (
    <PullToRefresh onRefresh={async () => { await store.cargarDatos(); }}>
      <div className="mantenimientos-pantalla">
        {/* Header */}
        <div className="mantenimientos-header">
          <div>
            <h1 className="pantalla-title">Mantenimientos</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {mantenimientosFiltrados.length} {mantenimientosFiltrados.length === 1 ? 'registro' : 'registros'}
            </p>
          </div>
          <button
            className="lf-btn lf-btn-primary lf-btn-sm"
            onClick={() => store.toggleCrearMantenimiento()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo
          </button>
        </div>

        {/* Filtros tipo chips */}
        <div className="mantenimientos-filtros lf-modern-chips">
          {[
            { value: 'todos', label: 'Todos', count: store.mantenimientos.length },
            { value: 'programados', label: 'Programados', count: store.mantenimientos.filter((m) => m.estado === 'PROGRAMADO').length },
            { value: 'en_proceso', label: 'En proceso', count: store.mantenimientos.filter((m) => m.estado === 'EN_PROCESO').length },
            { value: 'completados', label: 'Completados', count: store.mantenimientos.filter((m) => m.estado === 'COMPLETADO').length },
          ].map((f) => (
            <button
              key={f.value}
              className={`lf-modern-chip ${store.mantenimientosFiltro === f.value ? 'active' : ''}`}
              onClick={() => store.setMantenimientosFiltro(f.value)}
            >
              <span>{f.label}</span>
              <span className="lf-chip-count">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Timeline vertical */}
        {mantenimientosFiltrados.length === 0 ? (
          <EmptyState
            icono={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            }
            titulo="Sin mantenimientos"
            descripcion="Crea un nuevo mantenimiento para una moto de la flota"
            accion={{ label: 'Crear mantenimiento', onClick: () => store.toggleCrearMantenimiento() }}
          />
        ) : (
          <div className="lf-timeline">
            {mantenimientosFiltrados.map((m, idx) => {
              const info = getEstadoInfo(m.estado);
              const prioridadColor = getPrioridadColor(m.prioridad);
              const isOpen = openId === m.id;
              const fotos = selectedFotos[m.id] || [];
              return (
                <div
                  key={m.id}
                  className={`lf-mant-card ${isOpen ? 'open' : ''} stagger-item`}
                  style={{
                    animationDelay: `${idx * 0.05}s`,
                    '--prioridad-color': prioridadColor,
                    '--prioridad-glow': getPrioridadGlow(m.prioridad),
                  } as React.CSSProperties}
                >
                  {/* Timeline dot */}
                  <div className="lf-timeline-dot" style={{ background: prioridadColor }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>

                  <div className="lf-mant-card-content">
                    {/* Top: prioridad + estado + fecha */}
                    <div className="lf-mant-card-top">
                      <div className="lf-mant-prioridad">
                        <span className="lf-mant-prioridad-pill" style={{ background: getPrioridadGlow(m.prioridad), color: prioridadColor }}>
                          {m.prioridad}
                        </span>
                        <span className="lf-mant-tipo">{m.tipo}</span>
                      </div>
                      <span className="lf-mant-estado" style={{ background: info.bg, color: info.fg }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d={info.icon} />
                        </svg>
                        {info.label}
                      </span>
                    </div>

                    {/* Moto info destacada */}
                    <div className="lf-mant-moto-info">
                      <div className="lf-mant-moto-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="5.5" cy="17.5" r="3.5" />
                          <circle cx="18.5" cy="17.5" r="3.5" />
                          <path d="M15 6h2l3 3M5.5 14L9 6h4l-2 8M12 14h3" />
                        </svg>
                      </div>
                      <div>
                        <div className="lf-mant-moto-nombre">{m.motoNombre}</div>
                        <div className="lf-mant-moto-modelo">{m.motoModelo}</div>
                      </div>
                      <div className="lf-mant-km">
                        <span className="lf-mant-km-value">{m.kmAlMomento.toLocaleString()}</span>
                        <span className="lf-mant-km-unit">km</span>
                      </div>
                    </div>

                    {/* Descripción */}
                    <p className="lf-mant-desc">{m.descripcion}</p>

                    {/* Metadata compacta */}
                    <div className="lf-mant-meta">
                      <div className="lf-mant-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>C$ {m.costoTotal.toLocaleString()}</span>
                      </div>
                      {m.programadoPara && (
                        <div className="lf-mant-meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{new Date(m.programadoPara).toLocaleDateString('es-NI', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {fotos.length > 0 && (
                        <div className="lf-mant-meta-item fotos">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span>{fotos.length} foto{fotos.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Galería de fotos (si está abierto) */}
                    {isOpen && (
                      <div className="lf-mant-fotos-section">
                        <div className="lf-mant-fotos-header">
                          <h4>Fotos del mantenimiento</h4>
                          <span className="lf-mant-fotos-hint">Antes, durante y después</span>
                        </div>
                        {fotos.length > 0 && (
                          <div className="lf-mant-fotos-grid">
                            {fotos.map((f) => (
                              <div key={f.id} className="lf-mant-foto">
                                <img src={f.url} alt="mantenimiento" />
                              </div>
                            ))}
                          </div>
                        )}
                        <ImageUploader
                          categoria="mantenimiento"
                          entidadId={m.id}
                          onUploaded={(url) => handleFotoSubida(m.id, url)}
                          label="Subir foto"
                          hint="JPG, PNG, WEBP — máx 5MB"
                          aspectRatio="wide"
                          rounded="md"
                        />
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="lf-mant-card-actions">
                      {m.estado === 'PROGRAMADO' && (
                        <>
                          <button
                            className="lf-btn lf-btn-primary lf-btn-sm lf-btn-block"
                            onClick={(e) => { e.stopPropagation(); store.iniciarMantenimiento(m.id); notify.success('Mantenimiento iniciado'); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            Iniciar
                          </button>
                          <button
                            className="lf-btn lf-btn-ghost lf-btn-sm"
                            onClick={(e) => { e.stopPropagation(); store.cancelarMantenimiento(m.id); notify.info('Mantenimiento cancelado'); }}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {m.estado === 'EN_PROCESO' && (
                        <button
                          className="lf-btn lf-btn-success lf-btn-sm lf-btn-block"
                          onClick={(e) => { e.stopPropagation(); store.completarMantenimiento(m.id, m.costoTotal); notify.success('Mantenimiento completado'); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          Completar
                        </button>
                      )}
                      <button
                        className="lf-btn lf-btn-ghost lf-btn-sm"
                        onClick={(e) => { e.stopPropagation(); setOpenId(isOpen ? null : m.id); }}
                      >
                        {isOpen ? 'Cerrar' : 'Ver detalles'}
                      </button>
                    </div>
                  </div>
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
