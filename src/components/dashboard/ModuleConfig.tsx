'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Wrench, DollarSign, MapPin, Building, Users,
  Plus, X, Edit2, Save, Trash2,
} from 'lucide-react';
import { useStore, type MaintenanceRule, type Zone, type CompanyData, type SystemUser } from '@/lib/store';

type ConfigTab = 'mantenimiento' | 'tarifas' | 'zonas' | 'empresa' | 'usuarios';

const TABS: { key: ConfigTab; label: string; icon: typeof Settings }[] = [
  { key: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { key: 'tarifas', label: 'Tarifas y Costos', icon: DollarSign },
  { key: 'zonas', label: 'Zonas', icon: MapPin },
  { key: 'empresa', label: 'Datos Empresa', icon: Building },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
];

export default function ModuleConfig() {
  const { maintenanceRules, zones, companyData, users } = useStore();
  const [activeTab, setActiveTab] = useState<ConfigTab>('mantenimiento');
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([]);
  let toastId = 0;
  const showToast = (msg: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  // Local editable state
  const [editRules, setEditRules] = useState<MaintenanceRule[]>(maintenanceRules);
  const [editZones, setEditZones] = useState<Zone[]>(zones);
  const [editCompany, setEditCompany] = useState<CompanyData>(companyData);
  const [editUsers, setEditUsers] = useState<SystemUser[]>(users);

  // Tarifas
  const [tarifaBase, setTarifaBase] = useState('50');
  const [tarifaKm, setTarifaKm] = useState('15');
  const [tarifaMin, setTarifaMin] = useState('30');

  // User modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRol, setUserRol] = useState('Repartidor');

  const openUserModal = (user?: SystemUser) => {
    if (user) {
      setEditUserId(user.id); setUserName(user.nombre); setUserEmail(user.email); setUserRol(user.rol);
    } else {
      setEditUserId(null); setUserName(''); setUserEmail(''); setUserRol('Repartidor');
    }
    setUserModalOpen(true);
  };

  const saveUser = () => {
    if (!userName.trim() || !userEmail.trim()) return;
    if (editUserId) {
      setEditUsers((p) => p.map((u) => u.id === editUserId ? { ...u, nombre: userName, email: userEmail, rol: userRol } : u));
    } else {
      setEditUsers((p) => [...p, { id: `U-${10 + p.length}`, nombre: userName, email: userEmail, rol: userRol, activo: true }]);
    }
    setUserModalOpen(false);
    showToast(editUserId ? 'Usuario actualizado' : 'Usuario creado');
  };

  const toggleUser = (id: string) => {
    setEditUsers((p) => p.map((u) => u.id === id ? { ...u, activo: !u.activo } : u));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 20px', overflow: 'auto' }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Configuración</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
              border: '1px solid var(--lf-border)', background: activeTab === tab.key ? 'var(--lf-accent-soft)' : 'transparent',
              color: activeTab === tab.key ? 'var(--lf-accent)' : 'var(--lf-text-muted)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

          {/* ═══ MANTENIMIENTO ═══ */}
          {activeTab === 'mantenimiento' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Parámetros de Mantenimiento</h3>
                <button onClick={() => { setEditRules((p) => [...p, { id: `MR-${p.length + 7}`, tipo: 'Nuevo tipo', umbralKm: 5000, descripcion: 'Descripción' }]); showToast('Regla agregada'); }} style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--lf-accent)',
                  color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}><Plus size={12} /> Agregar</button>
              </div>
              <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--lf-primary-soft)' }}>
                      {['Tipo', 'Umbral KM', 'Descripción', 'Acciones'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editRules.map((rule) => (
                      <tr key={rule.id} style={{ borderBottom: '1px solid var(--lf-border)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <input value={rule.tipo} onChange={(e) => setEditRules((p) => p.map((r) => r.id === rule.id ? { ...r, tipo: e.target.value } : r))}
                            style={{ border: 'none', background: 'transparent', color: 'var(--lf-text-main)', fontSize: 13, fontWeight: 600, outline: 'none', width: '100%' }} />
                        </td>
                        <td className="font-mono" style={{ padding: '10px 14px' }}>
                          <input value={rule.umbralKm} onChange={(e) => setEditRules((p) => p.map((r) => r.id === rule.id ? { ...r, umbralKm: Number(e.target.value) || 0 } : r))}
                            type="number" style={{ border: 'none', background: 'transparent', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none', width: 80, fontFamily: "'DM Mono', monospace" }} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input value={rule.descripcion} onChange={(e) => setEditRules((p) => p.map((r) => r.id === rule.id ? { ...r, descripcion: e.target.value } : r))}
                            style={{ border: 'none', background: 'transparent', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none', width: '100%' }} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <button onClick={() => { setEditRules((p) => p.filter((r) => r.id !== rule.id)); showToast('Regla eliminada'); }} style={{
                            padding: '4px 8px', borderRadius: 6, border: '1px solid var(--lf-danger)',
                            background: 'transparent', cursor: 'pointer', color: 'var(--lf-danger)', fontSize: 12,
                          }}><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => showToast('Reglas guardadas')} style={{
                marginTop: 12, padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'var(--lf-accent)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}><Save size={14} /> Guardar cambios</button>
            </div>
          )}

          {/* ═══ TARIFAS ═══ */}
          {activeTab === 'tarifas' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Tarifas y Costos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, maxWidth: 600 }}>
                {[
                  { label: 'Tarifa base (C$)', value: tarifaBase, setter: setTarifaBase },
                  { label: 'Costo por KM (C$)', value: tarifaKm, setter: setTarifaKm },
                  { label: 'Tarifa mínima (C$)', value: tarifaMin, setter: setTarifaMin },
                ].map((field) => (
                  <div key={field.label}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>{field.label}</label>
                    <input value={field.value} onChange={(e) => field.setter(e.target.value)} type="number"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-surface)', color: 'var(--lf-text-main)', fontSize: 14, outline: 'none', fontFamily: "'DM Mono', monospace" }} />
                  </div>
                ))}
              </div>
              <button onClick={() => showToast('Tarifas guardadas')} style={{
                marginTop: 16, padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'var(--lf-accent)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}><Save size={14} /> Guardar</button>
            </div>
          )}

          {/* ═══ ZONAS ═══ */}
          {activeTab === 'zonas' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Zonas de Cobertura</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 500 }}>
                {editZones.map((zone) => (
                  <div key={zone.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{zone.nombre}</span>
                      <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)', marginLeft: 8 }}>C${zone.tarifa}</span>
                    </div>
                    <button onClick={() => { setEditZones((p) => p.map((z) => z.id === zone.id ? { ...z, activa: !z.activa } : z)); showToast(`Zona ${zone.nombre} ${zone.activa ? 'desactivada' : 'activada'}`); }} style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none',
                      background: zone.activa ? 'var(--lf-success)' : 'var(--lf-border)',
                      cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3, left: zone.activa ? 23 : 3,
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ EMPRESA ═══ */}
          {activeTab === 'empresa' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Datos de la Empresa</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
                {[
                  { label: 'Nombre', value: editCompany.nombre, setter: (v: string) => setEditCompany((p) => ({ ...p, nombre: v })) },
                  { label: 'Dirección', value: editCompany.direccion, setter: (v: string) => setEditCompany((p) => ({ ...p, direccion: v })) },
                  { label: 'Teléfono', value: editCompany.telefono, setter: (v: string) => setEditCompany((p) => ({ ...p, telefono: v })) },
                  { label: 'Email', value: editCompany.email, setter: (v: string) => setEditCompany((p) => ({ ...p, email: v })) },
                ].map((field) => (
                  <div key={field.label}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>{field.label}</label>
                    <input value={field.value} onChange={(e) => field.setter(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-surface)', color: 'var(--lf-text-main)', fontSize: 14, outline: 'none' }} />
                  </div>
                ))}
              </div>
              <button onClick={() => showToast('Datos guardados')} style={{
                marginTop: 16, padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'var(--lf-accent)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}><Save size={14} /> Guardar</button>
            </div>
          )}

          {/* ═══ USUARIOS ═══ */}
          {activeTab === 'usuarios' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Gestión de Usuarios</h3>
                <button onClick={() => openUserModal()} style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--lf-accent)',
                  color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}><Plus size={12} /> Agregar</button>
              </div>
              <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--lf-primary-soft)' }}>
                      {['Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--lf-border)', opacity: user.activo ? 1 : 0.5 }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{user.nombre}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--lf-text-secondary)' }}>{user.email}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--lf-accent-soft)', color: 'var(--lf-accent)' }}>{user.rol}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: user.activo ? 'rgba(22,163,74,0.1)' : 'rgba(107,114,128,0.1)', color: user.activo ? 'var(--lf-success)' : 'var(--lf-text-muted)' }}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', display: 'flex', gap: 4 }}>
                          <button onClick={() => openUserModal(user)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)' }}><Edit2 size={12} /></button>
                          <button onClick={() => toggleUser(user.id)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${user.activo ? 'var(--lf-danger)' : 'var(--lf-success)'}`, background: 'transparent', cursor: 'pointer', color: user.activo ? 'var(--lf-danger)' : 'var(--lf-success)' }}>
                            {user.activo ? <Trash2 size={12} /> : <Plus size={12} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {userModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setUserModalOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--lf-surface)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editUserId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <button onClick={() => setUserModalOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Nombre</label>
                  <input value={userName} onChange={(e) => setUserName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Email</label>
                  <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} type="email" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Rol</label>
                  <select value={userRol} onChange={(e) => setUserRol(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13 }}>
                    {['Administrador', 'Repartidor', 'Ingeniero', 'Cliente'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button onClick={saveUser} style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'var(--lf-accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
                  {editUserId ? 'Guardar' : 'Crear Usuario'}
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
