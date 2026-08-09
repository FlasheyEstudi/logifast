'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIngenieroStore, type Moto } from '@/store/ingenieroStore';
import { notify } from '@/lib/notify';

export default function DetalleMotoModal() {
  const store = useIngenieroStore();
  const moto = store.motoSeleccionada;

  const [repartidores, setRepartidores] = useState<Array<{ id: string; nombre: string }>>([]);
  const [nuevoEstado, setNuevoEstado] = useState<string>('DISPONIBLE');
  const [asignadoId, setAsignadoId] = useState<string>('');
  const [nuevoKm, setNuevoKm] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (moto) {
      setNuevoEstado(moto.estado || 'DISPONIBLE');
      setAsignadoId(moto.asignadaA || '');
      setNuevoKm(moto.kmAcumulados || 0);

      // Cargar lista de repartidores reales para asignación
      fetch('/api/admin/repartidores')
        .then((r) => r.json())
        .then((d) => {
          const list = Array.isArray(d) ? d : (d?.repartidores ?? []);
          setRepartidores(list.map((rep: any) => ({ id: rep.id || rep.repartidorId, nombre: rep.nombre || 'Repartidor' })));
        })
        .catch(() => {});
    }
  }, [moto]);

  if (!store.showDetalleMoto || !moto) return null;

  const handleGuardarCambios = async () => {
    setIsUpdating(true);
    try {
      await store.actualizarMoto(moto.id, {
        estado: nuevoEstado as any,
        asignadaA: asignadoId || null,
        kmAcumulados: Number(nuevoKm),
      });
      notify.success('Información de la motocicleta actualizada con éxito.');
      store.toggleDetalleMoto();
      setIsUpdating(false);
    } catch (err) {
      console.error(err);
      setIsUpdating(false);
      notify.error('Error al actualizar la motocicleta.');
    }
  };

  return (
    <AnimatePresence>
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
          onClick={() => store.seleccionarMoto(null)}
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
            maxWidth: 520,
            background: 'var(--lf-surface, #ffffff)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            zIndex: 10000,
            border: '1px solid var(--lf-border, #e5e7eb)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-accent, #FF5722)', textTransform: 'uppercase' }}>
                {moto.modelo}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--lf-text-main, #1a1a2e)' }}>
                {moto.nombre}
              </h2>
              {moto.placa && (
                <div style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', marginTop: 2, fontFamily: 'monospace', fontWeight: 700 }}>
                  PLACA: {moto.placa}
                </div>
              )}
            </div>
            <button
              onClick={() => store.seleccionarMoto(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94A3B8' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Estado mecánico */}
            <div style={{ background: 'var(--lf-bg, #f8f9fa)', padding: 14, borderRadius: 14, border: '1px solid var(--lf-border, #e5e7eb)' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)', marginBottom: 6, display: 'block' }}>
                Estado Mecánico Operativo
              </label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--lf-border, #e5e7eb)',
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#fff',
                }}
              >
                <option value="DISPONIBLE">Disponible para Asignación</option>
                <option value="EN_SERVICIO">En Servicio Operativo</option>
                <option value="EN_MANTENIMIENTO">En Taller (Mantenimiento)</option>
                <option value="FUERA_SERVICIO">Fuera de Servicio (Inactiva)</option>
              </select>
            </div>

            {/* Repartidor asignado */}
            <div style={{ background: 'var(--lf-bg, #f8f9fa)', padding: 14, borderRadius: 14, border: '1px solid var(--lf-border, #e5e7eb)' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)', marginBottom: 6, display: 'block' }}>
                Repartidor Asignado
              </label>
              <select
                value={asignadoId}
                onChange={(e) => setAsignadoId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--lf-border, #e5e7eb)',
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#fff',
                }}
              >
                <option value="">Sin Asignación (Mantenimiento / Libre)</option>
                {repartidores.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Kilometraje acumulado */}
            <div style={{ background: 'var(--lf-bg, #f8f9fa)', padding: 14, borderRadius: 14, border: '1px solid var(--lf-border, #e5e7eb)' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)', marginBottom: 6, display: 'block' }}>
                Kilometraje Acumulado (km)
              </label>
              <input
                type="number"
                value={nuevoKm}
                onChange={(e) => setNuevoKm(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--lf-border, #e5e7eb)',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  background: '#fff',
                }}
              />
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  store.seleccionarMoto(null);
                  store.toggleCrearMantenimiento();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: '1px solid var(--lf-accent, #FF5722)',
                  background: 'rgba(255, 87, 34, 0.08)',
                  color: 'var(--lf-accent, #FF5722)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Agendar Mantenimiento
              </button>

              <button
                type="button"
                onClick={handleGuardarCambios}
                disabled={isUpdating}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--lf-accent, #FF5722)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
