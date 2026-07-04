// components/ingeniero/CrearMantenimiento.tsx
'use client';

import React, { useState } from 'react';
import { useIngenieroStore } from '@/store/ingenieroStore';

export default function CrearMantenimiento() {
  const store = useIngenieroStore();
  const [motoId, setMotoId] = useState('');
  const [tipo, setTipo] = useState<'PREVENTIVO' | 'CORRECTIVO' | 'EMERGENCIA'>('PREVENTIVO');
  const [categoria, setCategoria] = useState('GENERAL');
  const [descripcion, setDescripcion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [prioridad, setPrioridad] = useState<'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [costoManoObra, setCostoManoObra] = useState('');
  const [programadoPara, setProgramadoPara] = useState('');

  const motoSeleccionada = store.motos.find(m => m.id === motoId);

  const handleCrear = () => {
    if (!motoId || !descripcion.trim()) return;

    store.crearMantenimiento({
      motoId,
      motoNombre: motoSeleccionada?.nombre,
      motoModelo: motoSeleccionada?.modelo,
      tipo,
      categoria,
      descripcion: descripcion.trim(),
      observaciones: observaciones.trim() || null,
      kmAlMomento: motoSeleccionada?.kmAcumulados || 0,
      costoManoObra: parseFloat(costoManoObra) || 0,
      prioridad,
      programadoPara: programadoPara || null,
      repuestosUsados: []
    });
  };

  if (!store.showCrearMantenimiento) return null;

  return (
    <div className="crear-mant-modal">
      <div className="modal-overlay visible" onClick={() => store.toggleCrearMantenimiento()} />

      <div className="lf-modal open">
        {/* Header */}
        <div className="lf-modal-header">
          <h2 className="lf-modal-title">Nuevo mantenimiento</h2>
          <button className="lf-modal-close" onClick={() => store.toggleCrearMantenimiento()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="lf-modal-body">
          <div className="lf-form">
            {/* Moto */}
            <div className="lf-form-group">
              <label className="lf-label">Moto *</label>
              <select className="lf-select" value={motoId} onChange={e => setMotoId(e.target.value)}>
                <option value="">Seleccionar moto...</option>
                {store.motos.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} — {m.modelo} ({m.kmAcumulados.toLocaleString()} km)
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo y Categoria */}
            <div className="lf-form-row">
              <div className="lf-form-group">
                <label className="lf-label">Tipo *</label>
                <select className="lf-select" value={tipo} onChange={e => setTipo(e.target.value as any)}>
                  <option value="PREVENTIVO">Preventivo</option>
                  <option value="CORRECTIVO">Correctivo</option>
                  <option value="EMERGENCIA">Emergencia</option>
                </select>
              </div>
              <div className="lf-form-group">
                <label className="lf-label">Categoria *</label>
                <select className="lf-select" value={categoria} onChange={e => setCategoria(e.target.value)}>
                  <option value="GENERAL">General</option>
                  <option value="CAMBIO_ACEITE">Cambio de aceite</option>
                  <option value="FRENO">Frenos</option>
                  <option value="LLANTA">Llantas</option>
                  <option value="CADENA">Cadena</option>
                  <option value="ELECTRICO">Electrico</option>
                  <option value="MOTOR">Motor</option>
                  <option value="SUSPENSION">Suspension</option>
                </select>
              </div>
            </div>

            {/* Descripcion */}
            <div className="lf-form-group">
              <label className="lf-label">Descripción *</label>
              <textarea
                className="lf-textarea"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Describe el mantenimiento a realizar..."
                rows={3}
              />
            </div>

            {/* Observaciones */}
            <div className="lf-form-group">
              <label className="lf-label">Observaciones</label>
              <textarea
                className="lf-textarea"
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Notas adicionales, diagnostico, etc."
                rows={2}
              />
            </div>

            {/* Prioridad y Fecha */}
            <div className="lf-form-row">
              <div className="lf-form-group">
                <label className="lf-label">Prioridad</label>
                <select className="lf-select" value={prioridad} onChange={e => setPrioridad(e.target.value as any)}>
                  <option value="BAJA">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
              <div className="lf-form-group">
                <label className="lf-label">Programado para</label>
                <input
                  type="date"
                  className="lf-input"
                  value={programadoPara}
                  onChange={e => setProgramadoPara(e.target.value)}
                />
              </div>
            </div>

            {/* Costo mano de obra */}
            <div className="lf-form-group">
              <label className="lf-label">Costo mano de obra (C$)</label>
              <input
                type="number"
                className="lf-input"
                value={costoManoObra}
                onChange={e => setCostoManoObra(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Info de la moto seleccionada */}
            {motoSeleccionada && (
              <div className="crear-mant-moto-info">
                <div className="crear-mant-moto-row">
                  <span>Km actuales</span>
                  <span className="mono bold">{motoSeleccionada.kmAcumulados.toLocaleString()} km</span>
                </div>
                <div className="crear-mant-moto-row">
                  <span>Estado</span>
                  <span>{motoSeleccionada.estado}</span>
                </div>
                {motoSeleccionada.ultimoMantenimiento && (
                  <div className="crear-mant-moto-row">
                    <span>Ultimo mantenimiento</span>
                    <span>{motoSeleccionada.ultimoMantenimiento.descripcion}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="lf-modal-footer">
          <button className="lf-btn lf-btn-secondary" onClick={() => store.toggleCrearMantenimiento()}>
            Cancelar
          </button>
          <button
            className="lf-btn lf-btn-primary"
            onClick={handleCrear}
            disabled={!motoId || !descripcion.trim()}
          >
            Crear mantenimiento
          </button>
        </div>
      </div>
    </div>
  );
}
