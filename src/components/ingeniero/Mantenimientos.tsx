// components/ingeniero/Mantenimientos.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Camera,
  Layers,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  X,
  Minus,
  Trash2,
  Check,
} from 'lucide-react';
import { useIngenieroStore, type Mantenimiento } from '@/store/ingenieroStore';
import PullToRefresh from '@/components/ui/PullToRefresh';
import EmptyState from '@/components/ui/EmptyState';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { notify } from '@/lib/notify';

interface Foto {
  id: string;
  url: string;
  filename: string;
}

const FOTOS_CACHE_MAX = 50;

export default function Mantenimientos() {
  const store = useIngenieroStore();
  const [selectedFotos, setSelectedFotos] = useState<Record<string, Foto[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const fotosOrderRef = useRef<string[]>([]);

  // Completion modal state
  const [completingMant, setCompletingMant] = useState<Mantenimiento | null>(null);
  const [manoObra, setManoObra] = useState<string>('200');
  const [observacionesFinales, setObservacionesFinales] = useState<string>('');
  const [selectedRepuestos, setSelectedRepuestos] = useState<Array<{ repuestoId: string; cantidad: number }>>([]);
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const writeFotos = useCallback(
    (mantId: string, updater: (prev: Foto[] | undefined) => Foto[]) => {
      setSelectedFotos((prev) => {
        const nextFotos = updater(prev[mantId]);
        const order = fotosOrderRef.current.filter((k) => k !== mantId);
        order.push(mantId);
        fotosOrderRef.current = order;
        const next: Record<string, Foto[]> = { ...prev, [mantId]: nextFotos };
        while (fotosOrderRef.current.length > FOTOS_CACHE_MAX) {
          const oldest = fotosOrderRef.current.shift();
          if (oldest !== undefined) delete next[oldest];
        }
        return next;
      });
    },
    []
  );

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

  const handleOpenCompleteModal = (m: Mantenimiento) => {
    setCompletingMant(m);
    setManoObra(String(m.costoManoObra || 200));
    setObservacionesFinales(m.observaciones || 'Servicio realizado satisfactoriamente');
    setSelectedRepuestos([]);
  };

  const handleAddRepuestoToComplete = (repuestoId: string) => {
    if (!repuestoId) return;
    setSelectedRepuestos((prev) => {
      const exists = prev.find((p) => p.repuestoId === repuestoId);
      if (exists) {
        return prev.map((p) => (p.repuestoId === repuestoId ? { ...p, cantidad: p.cantidad + 1 } : p));
      }
      return [...prev, { repuestoId, cantidad: 1 }];
    });
  };

  const handleRemoveRepuesto = (repuestoId: string) => {
    setSelectedRepuestos((prev) => prev.filter((p) => p.repuestoId !== repuestoId));
  };

  const handleUpdateRepuestoQty = (repuestoId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveRepuesto(repuestoId);
      return;
    }
    setSelectedRepuestos((prev) =>
      prev.map((p) => (p.repuestoId === repuestoId ? { ...p, cantidad: qty } : p))
    );
  };

  const handleConfirmComplete = async () => {
    if (!completingMant) return;
    setSubmittingComplete(true);
    try {
      await store.completarMantenimiento(completingMant.id, {
        costoManoObra: parseFloat(manoObra) || 0,
        observaciones: observacionesFinales.trim() || undefined,
        repuestosUsados: selectedRepuestos,
      });
      notify.success('Mantenimiento completado y motocicleta liberada.');
      setCompletingMant(null);
    } catch (err) {
      console.error(err);
      notify.error('Error al completar el mantenimiento.');
    } finally {
      setSubmittingComplete(false);
    }
  };

  const calculateTotalPreview = () => {
    const mano = parseFloat(manoObra) || 0;
    const partsTotal = selectedRepuestos.reduce((acc, item) => {
      const rep = store.repuestos.find((r) => r.id === item.repuestoId);
      return acc + (rep?.precioUnitario || 0) * item.cantidad;
    }, 0);
    return { mano, partsTotal, total: mano + partsTotal };
  };

  const getPrioridadColor = (p: string) => {
    const map: Record<string, string> = {
      BAJA: '#2979FF',
      NORMAL: '#00C853',
      ALTA: '#FFB300',
      URGENTE: '#FF1744',
    };
    return map[p] || 'var(--text-muted)';
  };

  const getPrioridadGlow = (p: string) => {
    const map: Record<string, string> = {
      BAJA: 'rgba(41,121,255,0.15)',
      NORMAL: 'rgba(0,200,83,0.15)',
      ALTA: 'rgba(255,179,0,0.18)',
      URGENTE: 'rgba(255,23,68,0.22)',
    };
    return map[p] || 'transparent';
  };

  const getEstadoInfo = (e: string) => {
    const map: Record<string, { bg: string; fg: string; label: string }> = {
      PROGRAMADO: { bg: 'rgba(41,121,255,0.12)', fg: '#2979FF', label: 'Programado' },
      EN_PROCESO: { bg: 'rgba(255,179,0,0.15)', fg: '#D97706', label: 'En Taller / Proceso' },
      COMPLETADO: { bg: 'rgba(16,185,129,0.15)', fg: '#10B981', label: 'Completado' },
      CANCELADO: { bg: 'rgba(148,163,184,0.15)', fg: '#64748B', label: 'Cancelado' },
    };
    return map[e] || { bg: 'rgba(148,163,184,0.15)', fg: '#64748B', label: e };
  };

  const handleFotoSubida = (mantId: string, url: string) => {
    writeFotos(mantId, (prev) => [...(prev || []), { id: Date.now().toString(), url, filename: '' }]);
  };

  const totals = calculateTotalPreview();

  return (
    <PullToRefresh onRefresh={async () => { await store.cargarDatos(); }}>
      <div className="mantenimientos-pantalla" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--lf-text-main, #1a1a2e)' }}>
              Mantenimientos de Flota
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lf-text-muted, #6B7280)' }}>
              {mantenimientosFiltrados.length} {mantenimientosFiltrados.length === 1 ? 'registro' : 'registros'} en el taller
            </p>
          </div>

          <button
            onClick={() => store.toggleCrearMantenimiento()}
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
            <Plus size={16} />
            <span>Programar Mantenimiento</span>
          </button>
        </div>

        {/* Filtros Chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { value: 'todos', label: 'Todos', count: store.mantenimientos.length },
            { value: 'programados', label: 'Programados', count: store.mantenimientos.filter((m) => m.estado === 'PROGRAMADO').length },
            { value: 'en_proceso', label: 'En Proceso', count: store.mantenimientos.filter((m) => m.estado === 'EN_PROCESO').length },
            { value: 'completados', label: 'Completados', count: store.mantenimientos.filter((m) => m.estado === 'COMPLETADO').length },
          ].map((f) => {
            const isActive = store.mantenimientosFiltro === f.value;
            return (
              <button
                key={f.value}
                onClick={() => store.setMantenimientosFiltro(f.value)}
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
                <span>{f.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 99,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--lf-bg, #f1f5f9)',
                    color: isActive ? '#ffffff' : 'inherit',
                  }}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timeline vertical */}
        {mantenimientosFiltrados.length === 0 ? (
          <EmptyState
            icono={<Wrench size={36} color="#94A3B8" />}
            titulo="Sin mantenimientos registrados"
            descripcion="Programa un mantenimiento preventivo o correctivo para una motocicleta de la flota."
            accionLabel="+ Programar Mantenimiento"
            onAccion={() => store.toggleCrearMantenimiento()}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mantenimientosFiltrados.map((m) => {
              const info = getEstadoInfo(m.estado);
              const prioridadColor = getPrioridadColor(m.prioridad);
              const isOpen = openId === m.id;
              const fotos = selectedFotos[m.id] || [];

              return (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--lf-surface, #ffffff)',
                    borderRadius: 20,
                    border: '1px solid var(--lf-border, #e5e7eb)',
                    padding: 20,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top: Priority pill + Category + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 800,
                          background: getPrioridadGlow(m.prioridad),
                          color: prioridadColor,
                          textTransform: 'uppercase',
                        }}
                      >
                        Prioridad {m.prioridad}
                      </span>

                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          background: 'var(--lf-bg, #f1f5f9)',
                          color: 'var(--lf-text-muted, #64748B)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {m.tipo} · {m.categoria}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        background: info.bg,
                        color: info.fg,
                      }}
                    >
                      {info.label}
                    </span>
                  </div>

                  {/* Moto Info & Mileage */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--lf-text-main, #1a1a2e)' }}>
                        {m.motoNombre} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--lf-text-muted, #6B7280)' }}>({m.motoModelo})</span>
                      </div>
                      {m.motoPlaca && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted, #94A3B8)', fontFamily: 'monospace', marginTop: 2 }}>
                          PLACA: {m.motoPlaca}
                        </div>
                      )}
                    </div>

                    <div style={{ background: 'var(--lf-bg, #f8fafc)', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e2e8f0)', textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: 'var(--lf-text-main, #1a1a2e)' }}>
                        {(m.kmAlMomento || 0).toLocaleString()} km
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--lf-text-muted, #94A3B8)' }}>Odómetro al servicio</div>
                    </div>
                  </div>

                  {/* Description & Observations */}
                  <div style={{ fontSize: 13, color: 'var(--lf-text-main, #334155)', lineHeight: 1.5, background: 'var(--lf-bg, #f8fafc)', padding: 12, borderRadius: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Descripción del trabajo:</div>
                    <div>{m.descripcion}</div>
                    {m.observaciones && (
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--lf-text-muted, #64748B)', borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                        <strong>Notas del mecánico:</strong> {m.observaciones}
                      </div>
                    )}
                  </div>

                  {/* Spare Parts Breakdown (if any) */}
                  {Array.isArray(m.repuestosUsados) && m.repuestosUsados.length > 0 && (
                    <div style={{ background: 'var(--lf-bg, #f8fafc)', padding: 12, borderRadius: 12, border: '1px solid var(--lf-border, #e2e8f0)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-muted, #64748B)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Layers size={13} color="#64748B" />
                        <span>Repuestos instalados ({m.repuestosUsados.length}):</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {m.repuestosUsados.map((ru, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span>{ru.nombre} × {ru.cantidad}</span>
                            <span style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>C$ {(ru.subtotal || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom: Costs, Scheduled Date & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--lf-border, #e5e7eb)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--lf-text-muted, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>Costo Total</div>
                        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#10B981' }}>
                          C$ {(m.costoTotal || 0).toLocaleString()}
                        </div>
                      </div>

                      {m.programadoPara && (
                        <div style={{ borderLeft: '1px solid var(--lf-border, #e5e7eb)', paddingLeft: 14 }}>
                          <div style={{ fontSize: 10, color: 'var(--lf-text-muted, #94A3B8)', textTransform: 'uppercase', fontWeight: 700 }}>Programado</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #64748B)' }}>
                            {new Date(m.programadoPara).toLocaleDateString('es-NI', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {m.estado === 'PROGRAMADO' && (
                        <>
                          <button
                            onClick={async () => {
                              await store.iniciarMantenimiento(m.id);
                              notify.success('Mantenimiento en proceso. Moto enviada a taller.');
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 10,
                              border: 'none',
                              background: 'var(--lf-accent, #FF5722)',
                              color: '#ffffff',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <Play size={12} fill="#fff" />
                            <span>Iniciar Trabajo</span>
                          </button>

                          <button
                            onClick={() => handleOpenCompleteModal(m)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: '1px solid var(--lf-border, #e5e7eb)',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Completar</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (window.confirm('¿Cancelar este mantenimiento programado?')) {
                                await store.cancelarMantenimiento(m.id);
                                notify.info('Mantenimiento cancelado.');
                              }
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 10,
                              border: '1px solid var(--lf-border, #e5e7eb)',
                              background: 'transparent',
                              color: 'var(--lf-text-muted, #94A3B8)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <XCircle size={13} />
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}

                      {m.estado === 'EN_PROCESO' && (
                        <>
                          <button
                            onClick={() => handleOpenCompleteModal(m)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 10,
                              border: 'none',
                              background: '#10B981',
                              color: '#ffffff',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Finalizar & Completar</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (window.confirm('¿Cancelar mantenimiento en proceso?')) {
                                await store.cancelarMantenimiento(m.id);
                                notify.info('Mantenimiento cancelado y moto liberada.');
                              }
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 10,
                              border: '1px solid var(--lf-border, #e5e7eb)',
                              background: 'transparent',
                              color: 'var(--lf-text-muted, #94A3B8)',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setOpenId(isOpen ? null : m.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: '1px solid var(--lf-border, #e5e7eb)',
                          background: 'transparent',
                          color: 'var(--lf-text-main, #334155)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Camera size={13} />
                        <span>{isOpen ? 'Ocultar' : 'Fotos'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Photo attachment gallery */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--lf-border, #e5e7eb)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)' }}>
                        Fotografías y Evidencia del Trabajo
                      </div>
                      {fotos.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                          {fotos.map((f) => (
                            <img
                              key={f.id}
                              src={f.url}
                              alt="evidencia"
                              style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                            />
                          ))}
                        </div>
                      )}
                      <ImageUploader
                        categoria="mantenimiento"
                        entidadId={m.id}
                        onUploaded={(url) => handleFotoSubida(m.id, url)}
                        label="Subir foto del trabajo"
                        hint="JPG, PNG — máx 5MB"
                        aspectRatio="wide"
                        rounded="md"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── COMPLETAR MANTENIMIENTO MODAL ── */}
        <AnimatePresence>
          {completingMant && (
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
                onClick={() => !submittingComplete && setCompletingMant(null)}
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
                  maxWidth: 540,
                  background: 'var(--lf-surface, #ffffff)',
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  zIndex: 10000,
                  border: '1px solid var(--lf-border, #e5e7eb)',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--lf-text-main, #1a1a2e)' }}>
                      Finalizar y Completar Mantenimiento
                    </h2>
                    <div style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', marginTop: 2 }}>
                      {completingMant.motoNombre} ({completingMant.motoModelo})
                    </div>
                  </div>
                  <button
                    onClick={() => !submittingComplete && setCompletingMant(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Mano de obra */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Costo de Mano de Obra (C$) *
                    </label>
                    <input
                      type="number"
                      value={manoObra}
                      onChange={(e) => setManoObra(e.target.value)}
                      placeholder="200"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--lf-border, #e5e7eb)',
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'DM Mono', monospace",
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Selector de repuestos utilizados */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Agregar Repuestos Usados del Inventario
                    </label>
                    <select
                      onChange={(e) => {
                        handleAddRepuestoToComplete(e.target.value);
                        e.target.value = '';
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--lf-border, #e5e7eb)',
                        fontSize: 13,
                      }}
                    >
                      <option value="">Seleccionar repuesto de almacén...</option>
                      {store.repuestos.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} — C$ {r.precioUnitario} (Stock: {r.stock} {r.unidad})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lista de repuestos seleccionados */}
                  {selectedRepuestos.length > 0 && (
                    <div style={{ background: 'var(--lf-bg, #f8fafc)', padding: 12, borderRadius: 12, border: '1px solid var(--lf-border, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted, #64748B)' }}>
                        Repuestos a descontar del inventario:
                      </div>
                      {selectedRepuestos.map((item) => {
                        const rep = store.repuestos.find((r) => r.id === item.repuestoId);
                        const sub = (rep?.precioUnitario || 0) * item.cantidad;
                        return (
                          <div key={item.repuestoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{rep?.nombre || 'Repuesto'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRepuestoQty(item.repuestoId, item.cantidad - 1)}
                                  style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Minus size={11} />
                                </button>
                                <span style={{ fontSize: 12, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.cantidad}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRepuestoQty(item.repuestoId, item.cantidad + 1)}
                                  style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace", minWidth: 60, textAlign: 'right' }}>
                                C$ {sub.toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRepuesto(item.repuestoId)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Observaciones */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Notas Finales del Mecánico
                    </label>
                    <textarea
                      rows={2}
                      value={observacionesFinales}
                      onChange={(e) => setObservacionesFinales(e.target.value)}
                      placeholder="Detalles sobre el trabajo realizado..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--lf-border, #e5e7eb)',
                        fontSize: 13,
                        outline: 'none',
                        resize: 'none',
                      }}
                    />
                  </div>

                  {/* Resumen Total */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 14, borderRadius: 14, border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#065F46', fontWeight: 600 }}>Costo Total Liquidado</div>
                      <div style={{ fontSize: 11, color: '#047857' }}>Mano de obra (C$ {totals.mano}) + Repuestos (C$ {totals.partsTotal})</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#047857' }}>
                      C$ {totals.total.toLocaleString()}
                    </div>
                  </div>

                  {/* Botones */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setCompletingMant(null)}
                      disabled={submittingComplete}
                      style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmComplete}
                      disabled={submittingComplete}
                      style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#10B981', color: '#ffffff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Check size={15} />
                      <span>{submittingComplete ? 'Procesando...' : 'Finalizar y Liberar Moto'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div style={{ height: 100 }} />
      </div>
    </PullToRefresh>
  );
}
