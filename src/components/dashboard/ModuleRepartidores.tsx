'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Star, Bike, Phone, Mail, Plus, X, ChevronRight,
} from 'lucide-react';
import { useStore, type Rider, type RiderStatus } from '@/lib/store';

const STATUS_CONFIG: Record<RiderStatus, { label: string; color: string; bg: string }> = {
  available: { label: 'Disponible', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  'in-service': { label: 'En servicio', color: '#FF6600', bg: 'rgba(255,102,0,0.1)' },
  offline: { label: 'Desconectado', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

export default function ModuleRepartidores() {
  const { riders, motos, orders, addRiderOpen, setAddRiderOpen, editRider, setEditRider,
    addRider, updateRider, toggleRiderConnection, riderDetail, setRiderDetail } = useStore();

  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formMotoId, setFormMotoId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([]);
  let toastId = 0;
  const showToast = (msg: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  const resetForm = () => { setFormNombre(''); setFormEmail(''); setFormTelefono(''); setFormMotoId(''); setFormErrors({}); };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!formNombre.trim()) errors.nombre = 'Requerido';
    if (!formEmail.trim()) errors.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = 'Email inválido';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editRider) {
      updateRider({ ...editRider, nombre: formNombre, email: formEmail, telefono: formTelefono, motoId: formMotoId || null, initials: getInitials(formNombre) });
      showToast(`Repartidor ${formNombre} actualizado`);
    } else {
      const colors = ['#002A5C', '#FF6600', '#16A34A', '#DC2626', '#7C3AED'];
      const newRider: Rider = {
        id: `R-${9 + riders.length}`, nombre: formNombre, email: formEmail, telefono: formTelefono,
        initials: getInitials(formNombre), color: colors[riders.length % colors.length],
        status: 'available', motoId: formMotoId || null, entregasHoy: 0, kmHoy: 0,
        entregasTotal: 0, kmTotal: 0, calificacion: 5.0, conectado: true,
      };
      addRider(newRider);
      showToast(`Repartidor ${formNombre} agregado`);
    }
    setAddRiderOpen(false); setEditRider(null); resetForm();
  };

  const openEdit = (rider: Rider) => {
    setFormNombre(rider.nombre); setFormEmail(rider.email); setFormTelefono(rider.telefono);
    setFormMotoId(rider.motoId || '');
    setEditRider(rider); setAddRiderOpen(true);
  };

  const availableMotos = motos.filter((m) => m.status === 'available' && !m.repartidorAsignado);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 20px', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>Gestión de Repartidores</h2>
        <button onClick={() => { resetForm(); setAddRiderOpen(true); }} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--lf-accent)',
          color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}><Plus size={14} /> Agregar</button>
      </div>

      {/* Rider list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12, flex: 1 }}>
        {riders.map((rider) => {
          const cfg = STATUS_CONFIG[rider.status];
          const moto = motos.find((m) => m.id === rider.motoId);
          const riderOrders = orders.filter((o) => o.repartidor === rider.nombre);
          const isDetail = riderDetail?.id === rider.id;

          return (
            <motion.div key={rider.id} layout style={{
              background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14,
              overflow: 'hidden',
            }}>
              {/* Main card */}
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: rider.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0,
                  }}>{rider.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{rider.nombre}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--lf-text-muted)' }}>
                      <Mail size={11} /> {rider.email}
                    </div>
                  </div>
                  {/* Connection toggle */}
                  <button onClick={() => { toggleRiderConnection(rider.id); showToast(rider.conectado ? `${rider.nombre} desconectado` : `${rider.nombre} conectado`); }} style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none',
                    background: rider.conectado ? 'var(--lf-success)' : 'var(--lf-border)',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3, left: rider.conectado ? 23 : 3,
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  {moto && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--lf-text-secondary)' }}>
                      <Bike size={12} /> {moto.nombre}
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Entregas hoy', value: rider.entregasHoy },
                    { label: 'KM hoy', value: rider.kmHoy },
                    { label: 'Total', value: rider.entregasTotal },
                    { label: 'Calificación', value: rider.calificacion },
                  ].map((stat) => (
                    <div key={stat.label} style={{ textAlign: 'center', padding: 6, borderRadius: 8, background: 'var(--lf-bg-base)' }}>
                      <div className="font-mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--lf-text-main)' }}>
                        {stat.label === 'Calificación' ? (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <Star size={11} style={{ color: '#FBBF24' }} />{stat.value}
                          </span>
                        ) : stat.value}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--lf-text-muted)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button onClick={() => openEdit(rider)} style={{
                    flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--lf-border)',
                    background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--lf-text-main)',
                  }}>Editar</button>
                  <button onClick={() => setRiderDetail(isDetail ? null : rider)} style={{
                    flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--lf-accent)',
                    background: 'var(--lf-accent-soft)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    color: 'var(--lf-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>Detalles <ChevronRight size={12} /></button>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {isDetail && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--lf-border)', paddingTop: 12 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Historial de entregas</h4>
                      <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                        {riderOrders.slice(0, 5).map((order) => (
                          <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--lf-border)' }}>
                            <span className="font-mono" style={{ fontSize: 12, fontWeight: 600 }}>{order.id}</span>
                            <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{order.destino}</span>
                            <span className="font-mono" style={{ fontSize: 12 }}>C${order.monto}</span>
                          </div>
                        ))}
                        {riderOrders.length === 0 && <div style={{ fontSize: 12, color: 'var(--lf-text-muted)', padding: '8px 0' }}>Sin entregas</div>}
                      </div>

                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>Contacto</h4>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--lf-text-secondary)' }}>
                          <Phone size={11} /> {rider.telefono}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--lf-text-secondary)' }}>
                          <Mail size={11} /> {rider.email}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ ADD/EDIT RIDER MODAL ═══ */}
      <AnimatePresence>
        {addRiderOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setAddRiderOpen(false); setEditRider(null); resetForm(); }}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--lf-surface)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 440 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editRider ? 'Editar Repartidor' : 'Agregar Repartidor'}</h3>
                <button onClick={() => { setAddRiderOpen(false); setEditRider(null); resetForm(); }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Nombre *</label>
                  <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.nombre ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Email *</label>
                  <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.email ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Teléfono</label>
                  <input value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Moto asignada</label>
                  <select value={formMotoId} onChange={(e) => setFormMotoId(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13 }}>
                    <option value="">Sin asignar</option>
                    {availableMotos.map((m) => <option key={m.id} value={m.id}>{m.nombre} - {m.modelo}</option>)}
                  </select>
                </div>
                <button onClick={handleSave} style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'var(--lf-accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
                  {editRider ? 'Guardar Cambios' : 'Agregar Repartidor'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--lf-success)', color: '#fff', fontSize: 13, fontWeight: 600 }}>{t.msg}</motion.div>
        ))}
      </div>
    </div>
  );
}
