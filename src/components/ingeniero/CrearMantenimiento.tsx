// components/ingeniero/CrearMantenimiento.tsx
'use client';

import React, { useState } from 'react';
import { useIngenieroStore } from '@/store/ingenieroStore';

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

/** Fecha de hoy en formato ISO (YYYY-MM-DD) para validación de inputs `date`. */
function getTodayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const TODAY_ISO = getTodayISO();

interface FormErrors {
  motoId?: string;
  descripcion?: string;
  programadoPara?: string;
  costoManoObra?: string;
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

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
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const motoSeleccionada = store.motos.find(m => m.id === motoId);

  /** Limpia todos los campos del formulario (tras un submit exitoso o al cerrar). */
  const resetForm = () => {
    setMotoId('');
    setTipo('PREVENTIVO');
    setCategoria('GENERAL');
    setDescripcion('');
    setObservaciones('');
    setPrioridad('NORMAL');
    setCostoManoObra('');
    setProgramadoPara('');
    setErrors({});
  };

  /** Valida los campos del formulario y retorna un mapa de errores. */
  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!motoId) errs.motoId = 'Selecciona una moto';
    if (!descripcion.trim()) errs.descripcion = 'La descripción es obligatoria';
    // No permitir fechas anteriores a hoy para mantenimientos programados
    if (programadoPara && programadoPara < TODAY_ISO) {
      errs.programadoPara = 'La fecha no puede ser anterior a hoy';
    }
    // Validar costo no negativo
    if (costoManoObra !== '') {
      const costo = parseFloat(costoManoObra);
      if (isNaN(costo) || costo < 0) {
        errs.costoManoObra = 'El costo no puede ser negativo';
      }
    }
    return errs;
  };

  const handleCrear = async () => {
    // Si ya está enviando, no hacer nada (doble click protection)
    if (submitting) return;

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await store.crearMantenimiento({
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
      // Submit exitoso: resetear todos los campos del formulario
      resetForm();
    } catch (err) {
      console.error('[CrearMantenimiento.handleCrear]', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!store.showCrearMantenimiento) return null;

  const isSubmitDisabled = submitting || !motoId || !descripcion.trim();

  return (
    <div className="crear-mant-modal">
      <div className="modal-overlay visible" onClick={() => !submitting && store.toggleCrearMantenimiento()} />

      <div className="lf-modal open">
        {/* Header */}
        <div className="lf-modal-header">
          <h2 className="lf-modal-title">Nuevo mantenimiento</h2>
          <button className="lf-modal-close" onClick={() => !submitting && store.toggleCrearMantenimiento()} disabled={submitting}>
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
              <select
                className="lf-select"
                value={motoId}
                disabled={submitting}
                onChange={e => { setMotoId(e.target.value); if (errors.motoId) setErrors(p => ({ ...p, motoId: undefined })); }}
              >
                <option value="">Seleccionar moto...</option>
                {store.motos.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} — {m.modelo} ({m.kmAcumulados.toLocaleString()} km)
                  </option>
                ))}
              </select>
              {errors.motoId && <span className="lf-form-error">{errors.motoId}</span>}
            </div>

            {/* Tipo y Categoria */}
            <div className="lf-form-row">
              <div className="lf-form-group">
                <label className="lf-label">Tipo *</label>
                <select className="lf-select" value={tipo} disabled={submitting} onChange={e => setTipo(e.target.value as any)}>
                  <option value="PREVENTIVO">Preventivo</option>
                  <option value="CORRECTIVO">Correctivo</option>
                  <option value="EMERGENCIA">Emergencia</option>
                </select>
              </div>
              <div className="lf-form-group">
                <label className="lf-label">Categoria *</label>
                <select className="lf-select" value={categoria} disabled={submitting} onChange={e => setCategoria(e.target.value)}>
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
                disabled={submitting}
                onChange={e => { setDescripcion(e.target.value); if (errors.descripcion) setErrors(p => ({ ...p, descripcion: undefined })); }}
                placeholder="Describe el mantenimiento a realizar..."
                rows={3}
              />
              {errors.descripcion && <span className="lf-form-error">{errors.descripcion}</span>}
            </div>

            {/* Observaciones */}
            <div className="lf-form-group">
              <label className="lf-label">Observaciones</label>
              <textarea
                className="lf-textarea"
                value={observaciones}
                disabled={submitting}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Notas adicionales, diagnostico, etc."
                rows={2}
              />
            </div>

            {/* Prioridad y Fecha */}
            <div className="lf-form-row">
              <div className="lf-form-group">
                <label className="lf-label">Prioridad</label>
                <select className="lf-select" value={prioridad} disabled={submitting} onChange={e => setPrioridad(e.target.value as any)}>
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
                  min={TODAY_ISO}
                  disabled={submitting}
                  onChange={e => { setProgramadoPara(e.target.value); if (errors.programadoPara) setErrors(p => ({ ...p, programadoPara: undefined })); }}
                />
                {errors.programadoPara && <span className="lf-form-error">{errors.programadoPara}</span>}
              </div>
            </div>

            {/* Costo mano de obra */}
            <div className="lf-form-group">
              <label className="lf-label">Costo mano de obra (C$)</label>
              <input
                type="number"
                className="lf-input"
                value={costoManoObra}
                min="0"
                step="0.01"
                disabled={submitting}
                onChange={e => { setCostoManoObra(e.target.value); if (errors.costoManoObra) setErrors(p => ({ ...p, costoManoObra: undefined })); }}
                placeholder="0"
              />
              {errors.costoManoObra && <span className="lf-form-error">{errors.costoManoObra}</span>}
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
          <button
            className="lf-btn lf-btn-secondary"
            onClick={() => store.toggleCrearMantenimiento()}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            className="lf-btn lf-btn-primary"
            onClick={handleCrear}
            disabled={isSubmitDisabled}
          >
            {submitting ? 'Creando...' : 'Crear mantenimiento'}
          </button>
        </div>
      </div>
    </div>
  );
}
