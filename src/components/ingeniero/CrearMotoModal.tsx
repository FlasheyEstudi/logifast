'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIngenieroStore } from '@/store/ingenieroStore';
import { notify } from '@/lib/notify';

export default function CrearMotoModal() {
  const store = useIngenieroStore();
  const [nombre, setNombre] = useState('');
  const [modelo, setModelo] = useState('Honda Wave 110');
  const [placa, setPlaca] = useState('');
  const [anio, setAnio] = useState<number>(2024);
  const [color, setColor] = useState('#FF5722');
  const [estado, setEstado] = useState<'DISPONIBLE' | 'EN_SERVICIO' | 'EN_MANTENIMIENTO' | 'FUERA_SERVICIO'>('DISPONIBLE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!store.showCrearMoto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      notify.error('El nombre de la moto es obligatorio.');
      return;
    }
    setIsSubmitting(true);
    try {
      await store.crearMoto({
        nombre: nombre.trim(),
        modelo: modelo.trim(),
        placa: placa.trim() || undefined,
        anio: Number(anio) || 2024,
        color,
        estado,
      });
      notify.success('Motocicleta registrada exitosamente en la flota.');
      setNombre('');
      setPlaca('');
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      notify.error('Error al registrar la motocicleta.');
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
          onClick={() => store.toggleCrearMoto()}
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
            maxWidth: 480,
            background: 'var(--lf-surface, #ffffff)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            zIndex: 10000,
            border: '1px solid var(--lf-border, #e5e7eb)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--lf-text-main, #1a1a2e)' }}>
              Registrar Nueva Motocicleta
            </h2>
            <button
              onClick={() => store.toggleCrearMoto()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94A3B8' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                Nombre / Alias de la Moto *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Moto-08 (Honda Wave)"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--lf-border, #e5e7eb)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                  Modelo
                </label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ej: Honda Wave 110"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--lf-border, #e5e7eb)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                  Placa (Matrícula)
                </label>
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="Ej: M-94821"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--lf-border, #e5e7eb)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                  Año Fabricación
                </label>
                <input
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--lf-border, #e5e7eb)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                  Estado Inicial
                </label>
                <select
                  value={estado}
                  onChange={(e: any) => setEstado(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--lf-border, #e5e7eb)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="EN_SERVICIO">En servicio</option>
                  <option value="EN_MANTENIMIENTO">En taller</option>
                  <option value="FUERA_SERVICIO">Fuera de servicio</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => store.toggleCrearMoto()}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid var(--lf-border, #e5e7eb)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--lf-accent, #FF5722)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {isSubmitting ? 'Guardando...' : 'Registrar Moto'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
