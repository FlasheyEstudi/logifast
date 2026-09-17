'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Star, Bike, Phone, Mail, Plus, X, ChevronRight,
  Check, Trash2, Wallet, RefreshCw, AlertCircle, Clock
} from '@/components/icons';
import { useStore, type Rider, type RiderStatus } from '@/lib/store';
import { onRealtimeEvent } from '@/services/realtime';

const STATUS_CONFIG: Record<RiderStatus, { label: string; color: string; bg: string }> = {
  available: { label: 'Disponible', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  'in-service': { label: 'En servicio', color: '#FF6600', bg: 'rgba(255,102,0,0.1)' },
  offline: { label: 'Desconectado', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

interface RecargaItem {
  id: string;
  repartidorId: string;
  monto: number;
  metodo: string;
  referencia: string | null;
  estado: string;
  createdAt: string;
  repartidor?: {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    saldo: number;
  };
}

export default function ModuleRepartidores() {
  const { riders: storeRiders, motos, orders, addRiderOpen, setAddRiderOpen, editRider, setEditRider,
    addRider, updateRider, riderDetail, setRiderDetail } = useStore();

  const [activeTab, setActiveTab] = useState<'repartidores' | 'recargas'>('repartidores');
  const [dbRiders, setDbRiders] = useState<Rider[]>([]);
  const [recargas, setRecargas] = useState<RecargaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingRecargaId, setProcessingRecargaId] = useState<string | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formMotoId, setFormMotoId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type?: 'success' | 'danger' }>>([]);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');

  const showToast = (msg: string, type: 'success' | 'danger' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

  const fetchRiders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/repartidores');
      if (!res.ok) return;
      const data = await res.json();
      if (data.profiles && Array.isArray(data.profiles)) {
        const formatted: Rider[] = data.profiles.map((p: any) => ({
          id: p.id,
          nombre: p.user?.name || p.nombre,
          email: p.user?.email || p.email || '',
          telefono: p.user?.telefono || p.telefono || '',
          initials: String(p.user?.name || p.nombre || 'RP').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'RP',
          color: p.user?.color || '#0066FF',
          status: p.enServicio ? 'in-service' : p.conectado ? 'available' : 'offline',
          motoId: p.motoId || null,
          entregasHoy: p.entregasHoy || 0,
          kmHoy: p.kmHoy || 0,
          entregasTotal: p.totalEntregas || 0,
          kmTotal: p.totalKm || 0,
          calificacion: p.calificacion || 5.0,
          conectado: p.conectado,
          saldo: p.saldo || 0,
          lat: p.user?.lat || p.lat,
          lng: p.user?.lng || p.lng,
        }));
        setDbRiders(formatted);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchRecargas = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/recargas?estado=pendiente');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.recargas)) {
        setRecargas(data.recargas);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchRiders();
    fetchRecargas();

    const unsubRecarga = onRealtimeEvent('admin:recarga:actualizada', () => {
      fetchRecargas();
      fetchRiders();
    });

    return () => {
      unsubRecarga();
    };
  }, [fetchRiders, fetchRecargas]);

  const riders = dbRiders.length > 0 ? dbRiders : storeRiders;

  const resetForm = () => {
    setFormNombre('');
    setFormEmail('');
    setFormTelefono('');
    setFormMotoId('');
    setFormPassword('');
    setFormErrors({});
  };

  const getInitials = (name?: string) => String(name || 'RP').split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'RP';

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!formNombre.trim()) errors.nombre = 'Requerido';
    if (!formEmail.trim()) errors.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = 'Email inválido';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      if (editRider) {
        const res = await fetch('/api/admin/repartidores', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editRider.id,
            nombre: formNombre,
            email: formEmail,
            telefono: formTelefono,
            motoId: formMotoId || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al actualizar');
        }

        updateRider({
          ...editRider,
          nombre: formNombre,
          email: formEmail,
          telefono: formTelefono,
          motoId: formMotoId || null,
          initials: getInitials(formNombre),
        });
        showToast(`Repartidor ${formNombre} actualizado`);
      } else {
        const res = await fetch('/api/admin/repartidores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formNombre,
            email: formEmail,
            telefono: formTelefono,
            motoId: formMotoId || null,
            password: formPassword || 'Logifast2026!',
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al crear repartidor');
        }

        const data = await res.json();
        const profile = data.profile;
        const colors = ['#002A5C', '#FF6600', '#16A34A', '#DC2626', '#7C3AED'];
        const newRider: Rider = {
          id: profile?.id || `R-${9 + riders.length}`,
          nombre: formNombre,
          email: formEmail,
          telefono: formTelefono,
          initials: getInitials(formNombre),
          color: colors[riders.length % colors.length],
          status: 'available',
          motoId: formMotoId || null,
          entregasHoy: 0,
          kmHoy: 0,
          entregasTotal: 0,
          kmTotal: 0,
          calificacion: 5.0,
          conectado: true,
          saldo: 0,
        };
        addRider(newRider);
        showToast(`Repartidor ${formNombre} registrado exitosamente`);
      }

      await fetchRiders();
      setAddRiderOpen(false);
      setEditRider(null);
      resetForm();
    } catch (e: any) {
      showToast(e.message || 'Error al procesar la solicitud', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConnection = async (rider: Rider) => {
    const nextConectado = !rider.conectado;
    setDbRiders((prev) =>
      prev.map((r) =>
        r.id === rider.id
          ? { ...r, conectado: nextConectado, status: nextConectado ? 'available' : 'offline' }
          : r
      )
    );

    try {
      const res = await fetch('/api/admin/repartidores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rider.id, conectado: nextConectado }),
      });
      if (!res.ok) throw new Error();
      showToast(nextConectado ? `${rider.nombre} conectado` : `${rider.nombre} desconectado`);
      fetchRiders();
    } catch {
      showToast('Error al actualizar estado', 'danger');
      fetchRiders();
    }
  };

  const handleDeleteRider = async (rider: Rider) => {
    if (!window.confirm(`¿Estás seguro de eliminar al repartidor ${rider.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/repartidores?id=${encodeURIComponent(rider.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      setDbRiders((prev) => prev.filter((r) => r.id !== rider.id));
      showToast(`Repartidor ${rider.nombre} eliminado`);
      fetchRiders();
    } catch (e: any) {
      showToast(e.message || 'Error al eliminar repartidor', 'danger');
    }
  };

  const handleAprobarRecarga = async (recargaId: string) => {
    setProcessingRecargaId(recargaId);
    try {
      const res = await fetch('/api/admin/recargas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recargaId, accion: 'aprobar' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al aprobar');
      }
      showToast('Recarga aprobada y saldo acreditado con éxito');
      await Promise.all([fetchRecargas(), fetchRiders()]);
    } catch (e: any) {
      showToast(e.message || 'Error al aprobar recarga', 'danger');
    } finally {
      setProcessingRecargaId(null);
    }
  };

  const handleRechazarRecarga = async () => {
    if (!rejectModalId) return;
    setProcessingRecargaId(rejectModalId);
    try {
      const res = await fetch('/api/admin/recargas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rejectModalId, accion: 'rechazar', motivo: rejectMotivo || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al rechazar');
      }
      showToast('Recarga rechazada');
      setRejectModalId(null);
      setRejectMotivo('');
      await fetchRecargas();
    } catch (e: any) {
      showToast(e.message || 'Error al rechazar recarga', 'danger');
    } finally {
      setProcessingRecargaId(null);
    }
  };

  const openEdit = (rider: Rider) => {
    setFormNombre(rider.nombre);
    setFormEmail(rider.email);
    setFormTelefono(rider.telefono);
    setFormMotoId(rider.motoId || '');
    setFormPassword('');
    setEditRider(rider);
    setAddRiderOpen(true);
  };

  const availableMotos = motos.filter((m) => m.status === 'available' && !m.repartidorAsignado);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 20px', overflow: 'auto' }}>
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Gestión de Flota Humana</h2>
          <p style={{ fontSize: 12, color: 'var(--lf-text-muted)', margin: '4px 0 0' }}>
            Control de conductores en tiempo real y aprobación de saldo
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Tabs switch */}
          <div style={{ display: 'flex', background: 'var(--lf-surface)', padding: 4, borderRadius: 10, border: '1px solid var(--lf-border)' }}>
            <button
              onClick={() => setActiveTab('repartidores')}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                background: activeTab === 'repartidores' ? 'var(--lf-accent)' : 'transparent',
                color: activeTab === 'repartidores' ? '#fff' : 'var(--lf-text-secondary)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={13} /> Repartidores ({riders.length})
            </button>
            <button
              onClick={() => setActiveTab('recargas')}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                background: activeTab === 'recargas' ? 'var(--lf-accent)' : 'transparent',
                color: activeTab === 'recargas' ? '#fff' : 'var(--lf-text-secondary)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <Wallet size={13} /> Recargas
              {recargas.length > 0 && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: activeTab === 'recargas' ? '#fff' : 'var(--lf-danger)',
                  color: activeTab === 'recargas' ? 'var(--lf-accent)' : '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {recargas.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => { resetForm(); setAddRiderOpen(true); }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--lf-accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      {/* ═══ TAB 1: REPARTIDORES ═══ */}
      {activeTab === 'repartidores' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12, flex: 1 }}>
          {riders.map((rider) => {
            const cfg = STATUS_CONFIG[rider.status];
            const moto = motos.find((m) => m.id === rider.motoId);
            const riderOrders = orders.filter((o) => o.repartidor === rider.nombre);
            const isDetail = riderDetail?.id === rider.id;

            return (
              <motion.div
                key={rider.id}
                layout
                style={{
                  background: 'var(--lf-surface)',
                  border: '1px solid var(--lf-border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Main card */}
                <div style={{ padding: 16, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: rider.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {rider.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rider.nombre}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--lf-text-muted)' }}>
                        <Mail size={11} /> {rider.email}
                      </div>
                      {rider.telefono && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--lf-text-secondary)', marginTop: 2 }}>
                          <Phone size={10} /> {rider.telefono}
                        </div>
                      )}
                    </div>
                    {/* Connection toggle */}
                    <button
                      onClick={() => handleToggleConnection(rider)}
                      title={rider.conectado ? 'Hacer offline' : 'Hacer disponible'}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        border: 'none',
                        background: rider.conectado ? 'var(--lf-success)' : 'var(--lf-border)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: 3,
                        left: rider.conectado ? 23 : 3,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                    {moto && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--lf-text-secondary)' }}>
                        <Bike size={12} /> {moto.nombre}
                      </span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Entregas hoy', value: rider.entregasHoy },
                      { label: 'Saldo', value: `C$${(rider.saldo ?? 0).toFixed(0)}` },
                      { label: 'Total', value: rider.entregasTotal },
                      { label: 'Rating', value: rider.calificacion },
                    ].map((stat) => (
                      <div key={stat.label} style={{ textAlign: 'center', padding: 6, borderRadius: 8, background: 'var(--lf-bg-base)' }}>
                        <div className="font-mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--lf-text-main)' }}>
                          {stat.label === 'Rating' ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                              <Star size={11} style={{ color: '#FBBF24' }} />{stat.value}
                            </span>
                          ) : stat.value}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--lf-text-muted)' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                    <button
                      onClick={() => openEdit(rider)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--lf-border)',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--lf-text-main)',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setRiderDetail(isDetail ? null : rider)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--lf-accent)',
                        background: 'var(--lf-accent-soft)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--lf-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      Detalles <ChevronRight size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteRider(rider)}
                      title="Eliminar Repartidor"
                      style={{
                        width: 32,
                        padding: 0,
                        borderRadius: 8,
                        border: '1px solid var(--lf-border)',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--lf-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isDetail && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--lf-border)', paddingTop: 12 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                          Historial de entregas
                        </h4>
                        <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                          {riderOrders.slice(0, 5).map((order) => (
                            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--lf-border)' }}>
                              <span className="font-mono" style={{ fontSize: 12, fontWeight: 600 }}>{order.id}</span>
                              <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{order.destino}</span>
                              <span className="font-mono" style={{ fontSize: 12 }}>C${order.monto}</span>
                            </div>
                          ))}
                          {riderOrders.length === 0 && <div style={{ fontSize: 12, color: 'var(--lf-text-muted)', padding: '8px 0' }}>Sin entregas registradas en sesión</div>}
                        </div>

                        <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>
                          Información de Billetera
                        </h4>
                        <div style={{ fontSize: 12, color: 'var(--lf-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Saldo actual:</span>
                          <strong className="font-mono">C${(rider.saldo ?? 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ TAB 2: RECARGAS PENDIENTES ═══ */}
      {activeTab === 'recargas' && (
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>
              {recargas.length} solicitud{recargas.length === 1 ? '' : 'es'} pendiente{recargas.length === 1 ? '' : 's'} de saldo
            </span>
            <button
              onClick={() => { fetchRecargas(); fetchRiders(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: '1px solid var(--lf-border)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 12,
                cursor: 'pointer',
                color: 'var(--lf-text-secondary)',
              }}
            >
              <RefreshCw size={12} /> Refrescar
            </button>
          </div>

          {recargas.length === 0 ? (
            <div style={{
              background: 'var(--lf-surface)',
              border: '1px solid var(--lf-border)',
              borderRadius: 14,
              padding: 40,
              textAlign: 'center',
              color: 'var(--lf-text-muted)',
            }}>
              <Check size={32} style={{ color: 'var(--lf-success)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--lf-text-main)' }}>No hay recargas pendientes</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Todas las solicitudes de saldo de los repartidores han sido procesadas.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
              {recargas.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: 'var(--lf-surface)',
                    border: '1px solid var(--lf-border)',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{r.repartidor?.nombre || 'Repartidor'}</div>
                        <div style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{r.repartidor?.email} • {r.repartidor?.telefono || 'Sin tel'}</div>
                      </div>
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(255,102,0,0.1)',
                        color: 'var(--lf-accent)',
                        fontWeight: 700,
                        fontSize: 16,
                        fontFamily: 'monospace',
                      }}>
                        C${r.monto.toFixed(2)}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--lf-text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '10px 0', background: 'var(--lf-bg-base)', padding: 10, borderRadius: 8 }}>
                      <div>
                        <span style={{ color: 'var(--lf-text-muted)', display: 'block', fontSize: 10 }}>MÉTODO</span>
                        <strong style={{ textTransform: 'capitalize' }}>{r.metodo}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--lf-text-muted)', display: 'block', fontSize: 10 }}>SALDO ACTUAL</span>
                        <strong className="font-mono">C${(r.repartidor?.saldo ?? 0).toFixed(2)}</strong>
                      </div>
                      {r.referencia && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ color: 'var(--lf-text-muted)', display: 'block', fontSize: 10 }}>REFERENCIA / NOTA</span>
                          <span style={{ fontFamily: 'monospace' }}>{r.referencia}</span>
                        </div>
                      )}
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--lf-text-muted)', fontSize: 11 }}>
                        <Clock size={11} /> {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      disabled={processingRecargaId === r.id}
                      onClick={() => handleAprobarRecarga(r.id)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'var(--lf-success)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: processingRecargaId === r.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        opacity: processingRecargaId === r.id ? 0.6 : 1,
                      }}
                    >
                      <Check size={14} /> Aprobar
                    </button>
                    <button
                      disabled={processingRecargaId === r.id}
                      onClick={() => { setRejectModalId(r.id); setRejectMotivo(''); }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--lf-danger)',
                        background: 'transparent',
                        color: 'var(--lf-danger)',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: processingRecargaId === r.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        opacity: processingRecargaId === r.id ? 0.6 : 1,
                      }}
                    >
                      <X size={14} /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ REJECT MODAL ═══ */}
      <AnimatePresence>
        {rejectModalId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 250,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setRejectModalId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--lf-surface)',
                borderRadius: 16,
                padding: 24,
                width: '90%',
                maxWidth: 400,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--lf-danger)' }}>
                <AlertCircle size={18} /> Rechazar Recarga
              </h3>
              <p style={{ fontSize: 13, color: 'var(--lf-text-secondary)', marginBottom: 12 }}>
                Indica el motivo del rechazo para notificar al repartidor:
              </p>
              <textarea
                rows={3}
                value={rejectMotivo}
                onChange={(e) => setRejectMotivo(e.target.value)}
                placeholder="Ej. Transferencia no verificada en cuenta bancaria..."
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--lf-border)',
                  background: 'var(--lf-bg-base)',
                  color: 'var(--lf-text-main)',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => setRejectModalId(null)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--lf-border)',
                    background: 'transparent',
                    color: 'var(--lf-text-main)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRechazarRecarga}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--lf-danger)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Confirmar Rechazo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ADD/EDIT RIDER MODAL ═══ */}
      <AnimatePresence>
        {addRiderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => { setAddRiderOpen(false); setEditRider(null); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--lf-surface)',
                borderRadius: 16,
                padding: 24,
                width: '90%',
                maxWidth: 440,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{editRider ? 'Editar Repartidor' : 'Agregar Repartidor'}</h3>
                <button
                  onClick={() => { setAddRiderOpen(false); setEditRider(null); resetForm(); }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid var(--lf-border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--lf-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Nombre Completo *</label>
                  <input
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Roberto Martinez"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${formErrors.nombre ? 'var(--lf-danger)' : 'var(--lf-border)'}`,
                      background: 'var(--lf-bg-base)',
                      color: 'var(--lf-text-main)',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Email de Acceso *</label>
                  <input
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    type="email"
                    placeholder="repartidor@logifast.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${formErrors.email ? 'var(--lf-danger)' : 'var(--lf-border)'}`,
                      background: 'var(--lf-bg-base)',
                      color: 'var(--lf-text-main)',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {!editRider && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Contraseña Inicial</label>
                    <input
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      type="password"
                      placeholder="Por defecto: Logifast2026!"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--lf-border)',
                        background: 'var(--lf-bg-base)',
                        color: 'var(--lf-text-main)',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Teléfono Celular</label>
                  <input
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="+505 8888 8888"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--lf-border)',
                      background: 'var(--lf-bg-base)',
                      color: 'var(--lf-text-main)',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Moto Asignada</label>
                  <select
                    value={formMotoId}
                    onChange={(e) => setFormMotoId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--lf-border)',
                      background: 'var(--lf-bg-base)',
                      color: 'var(--lf-text-main)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Sin asignar (a pie / moto propia)</option>
                    {availableMotos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} - {m.modelo} ({m.placa})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--lf-accent)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: 4,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Guardando...' : editRider ? 'Guardar Cambios' : 'Registrar Repartidor'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: t.type === 'danger' ? 'var(--lf-danger)' : 'var(--lf-success)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {t.msg}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
