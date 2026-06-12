'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Wrench, DollarSign, MapPin, Building, Users,
  Plus, X, Edit2, Save, Trash2,
  Mail, Smartphone, Clock, Puzzle, Database,
  Send, Eye, Monitor, ChevronRight, AlertTriangle,
  Download, FileText, HardDrive, CheckCircle2, Circle,
  MessageCircle, CreditCard, Map,
} from 'lucide-react';
import { useStore, type MaintenanceRule, type Zone, type CompanyData, type SystemUser, type ConfiguracionHorario, type Feriado, type Integracion } from '@/lib/store';

type ConfigTab = 'mantenimiento' | 'tarifas' | 'zonas' | 'empresa' | 'usuarios' | 'emails' | 'app' | 'horarios' | 'integraciones' | 'backup';

const TABS: { key: ConfigTab; label: string; icon: typeof Settings }[] = [
  { key: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { key: 'tarifas', label: 'Tarifas y Costos', icon: DollarSign },
  { key: 'zonas', label: 'Zonas', icon: MapPin },
  { key: 'empresa', label: 'Datos Empresa', icon: Building },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'emails', label: 'Emails', icon: Mail },
  { key: 'app', label: 'App Cliente', icon: Smartphone },
  { key: 'horarios', label: 'Horarios', icon: Clock },
  { key: 'integraciones', label: 'Integraciones', icon: Puzzle },
  { key: 'backup', label: 'Backup', icon: Database },
];

/* ─── Email Template Data ─── */
interface EmailTemplate {
  id: string;
  nombre: string;
  preview: string;
  variables: string[];
  contenido: string;
}

const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'ET-01', nombre: 'Confirmación de orden', preview: 'Tu orden ha sido confirmada...', variables: ['{{nombre_cliente}}', '{{orden_id}}', '{{origen}}', '{{destino}}'], contenido: '<h1>¡Orden confirmada!</h1><p>Hola {{nombre_cliente}}, tu orden <strong>{{orden_id}}</strong> ha sido confirmada.</p><p>Ruta: {{origen}} → {{destino}}</p>' },
  { id: 'ET-02', nombre: 'Orden entregada', preview: 'Tu entrega fue completada exitosamente...', variables: ['{{nombre_cliente}}', '{{orden_id}}', '{{repartidor}}', '{{hora_entrega}}'], contenido: '<h1>Entrega completada</h1><p>Hola {{nombre_cliente}}, tu orden <strong>{{orden_id}}</strong> fue entregada por {{repartidor}} a las {{hora_entrega}}.</p>' },
  { id: 'ET-03', nombre: 'Bienvenida', preview: 'Bienvenido a LOGIFAST...', variables: ['{{nombre_cliente}}'], contenido: '<h1>¡Bienvenido!</h1><p>Hola {{nombre_cliente}}, gracias por unirte a LOGIFAST.</p>' },
  { id: 'ET-04', nombre: 'Código promocional', preview: 'Tienes un descuento especial...', variables: ['{{nombre_cliente}}', '{{codigo}}', '{{descuento}}'], contenido: '<h1>¡Descuento especial!</h1><p>Hola {{nombre_cliente}}, usa el código <strong>{{codigo}}</strong> para un {{descuento}} de descuento.</p>' },
  { id: 'ET-05', nombre: 'Incidencia', preview: 'Hubo un problema con tu orden...', variables: ['{{nombre_cliente}}', '{{orden_id}}', '{{incidencia}}'], contenido: '<h1>Incidencia reportada</h1><p>Hola {{nombre_cliente}}, tu orden <strong>{{orden_id}}</strong> tiene una incidencia: {{incidencia}}.</p>' },
];

/* ─── Dia labels ─── */
const DIA_LABELS: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo',
};

/* ─── Integration icon map ─── */
const ICON_MAP: Record<string, typeof MessageCircle> = {
  'message-circle': MessageCircle,
  'credit-card': CreditCard,
  'map': Map,
  'smartphone': Smartphone,
  'mail': Mail,
};

/* ─── Preset colors for app ─── */
const PRESET_COLORS = [
  '#E8553A', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#EF4444',
];

export default function ModuleConfig() {
  const {
    maintenanceRules, zones, companyData, users,
    horarios, feriados, integraciones,
    updateHorario, addFeriado, deleteFeriado, addToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<ConfigTab>('mantenimiento');
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([]);
  let toastId = 0;
  const showToast = (msg: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  // Local editable state (existing)
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

  // ─── 9A: Email Editor State ───
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(INITIAL_EMAIL_TEMPLATES);
  const [emailEditOpen, setEmailEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplate | null>(null);

  // ─── 9B: App Client Config State ───
  const [appPrimaryColor, setAppPrimaryColor] = useState('#E8553A');
  const [appWelcomeText, setAppWelcomeText] = useState('Bienvenido a LOGIFAST');
  const [appOffers, setAppOffers] = useState(['Envío gratis en tu primera orden', '20% descuento zonas lejanas', 'Paquete doble sin recargo']);

  // ─── 9C: Horarios State ───
  const [localHorarios, setLocalHorarios] = useState<ConfiguracionHorario[]>(horarios);
  const [feriadoModalOpen, setFeriadoModalOpen] = useState(false);
  const [newFeriadoFecha, setNewFeriadoFecha] = useState('');
  const [newFeriadoNombre, setNewFeriadoNombre] = useState('');
  const [newFeriadoRecargo, setNewFeriadoRecargo] = useState('30');

  // ─── 9D: Integraciones State ───
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integracion | null>(null);
  const [intApiKey, setIntApiKey] = useState('');
  const [intWebhookUrl, setIntWebhookUrl] = useState('');

  // ─── 9E: Backup State ───
  const [confirmCleanOpen, setConfirmCleanOpen] = useState(false);

  // ─── Existing handlers ───
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

  // ─── 9A: Email handlers ───
  const openEmailEditor = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setEmailEditOpen(true);
  };

  const saveEmailTemplate = () => {
    if (!editingTemplate) return;
    setEmailTemplates((p) => p.map((t) => t.id === editingTemplate.id ? editingTemplate : t));
    setEmailEditOpen(false);
    showToast('Plantilla guardada');
  };

  const openEmailPreview = (template: EmailTemplate) => {
    setPreviewingTemplate(template);
    setEmailPreviewOpen(true);
  };

  const sendTestEmail = (template: EmailTemplate) => {
    addToast(`Email de prueba enviado: ${template.nombre}`, 'success');
    showToast(`Email de prueba enviado: ${template.nombre}`);
  };

  // ─── 9C: Horario handlers ───
  const handleHorarioChange = (id: string, updates: Partial<ConfiguracionHorario>) => {
    setLocalHorarios((p) => p.map((h) => h.id === id ? { ...h, ...updates } : h));
    updateHorario(id, updates);
  };

  const handleSaveHorarios = () => {
    showToast('Horarios guardados');
  };

  const openAddFeriado = () => {
    setNewFeriadoFecha('');
    setNewFeriadoNombre('');
    setNewFeriadoRecargo('30');
    setFeriadoModalOpen(true);
  };

  const saveFeriado = () => {
    if (!newFeriadoFecha || !newFeriadoNombre.trim()) return;
    const newFeriado: Feriado = {
      id: `FER-${Date.now()}`,
      fecha: newFeriadoFecha,
      nombre: newFeriadoNombre,
      recargo: Number(newFeriadoRecargo) || 0,
    };
    addFeriado(newFeriado);
    setFeriadoModalOpen(false);
    showToast('Feriado agregado');
  };

  const handleDeleteFeriado = (id: string) => {
    deleteFeriado(id);
    showToast('Feriado eliminado');
  };

  // ─── 9D: Integration handlers ───
  const openIntegrationConfig = (integration: Integracion) => {
    setEditingIntegration(integration);
    setIntApiKey('');
    setIntWebhookUrl('');
    setIntegrationModalOpen(true);
  };

  const saveIntegration = () => {
    setIntegrationModalOpen(false);
    showToast(`Integración ${editingIntegration?.nombre} configurada`);
  };

  // ─── 9E: Backup handlers ───
  const exportAllData = () => {
    addToast('Exportando datos...', 'info');
    showToast('Exportando datos...');
  };

  const exportMonthlyReport = () => {
    addToast('Generando reporte...', 'info');
    showToast('Generando reporte...');
  };

  const cleanTestData = () => {
    setConfirmCleanOpen(false);
    addToast('Datos de prueba eliminados', 'success');
    showToast('Datos de prueba eliminados');
  };

  /* ─── Shared styles ─── */
  const cardStyle: React.CSSProperties = {
    background: 'var(--lf-surface)',
    border: '1px solid var(--lf-border)',
    borderRadius: 12,
    padding: 16,
  };

  const btnAccent: React.CSSProperties = {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: 'var(--lf-accent)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  };

  const btnSmall: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--lf-accent)',
    color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--lf-border)',
    background: 'var(--lf-surface)', color: 'var(--lf-text-main)', fontSize: 14, outline: 'none',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const modalStyle: React.CSSProperties = {
    background: 'var(--lf-surface)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 560,
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
                <button onClick={() => { setEditRules((p) => [...p, { id: `MR-${p.length + 7}`, tipo: 'Nuevo tipo', umbralKm: 5000, descripcion: 'Descripción' }]); showToast('Regla agregada'); }} style={btnSmall}><Plus size={12} /> Agregar</button>
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
              <button onClick={() => showToast('Reglas guardadas')} style={{ marginTop: 12, ...btnAccent }}><Save size={14} /> Guardar cambios</button>
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
                    <label style={labelStyle}>{field.label}</label>
                    <input value={field.value} onChange={(e) => field.setter(e.target.value)} type="number"
                      style={{ ...inputStyle, fontFamily: "'DM Mono', monospace" }} />
                  </div>
                ))}
              </div>
              <button onClick={() => showToast('Tarifas guardadas')} style={{ marginTop: 16, ...btnAccent }}><Save size={14} /> Guardar</button>
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
                    <label style={labelStyle}>{field.label}</label>
                    <input value={field.value} onChange={(e) => field.setter(e.target.value)} style={inputStyle} />
                  </div>
                ))}
              </div>
              <button onClick={() => showToast('Datos guardados')} style={{ marginTop: 16, ...btnAccent }}><Save size={14} /> Guardar</button>
            </div>
          )}

          {/* ═══ USUARIOS ═══ */}
          {activeTab === 'usuarios' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Gestión de Usuarios</h3>
                <button onClick={() => openUserModal()} style={btnSmall}><Plus size={12} /> Agregar</button>
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

          {/* ═══ 9A: EMAILS TRANSACCIONALES ═══ */}
          {activeTab === 'emails' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Editor de Emails Transaccionales</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {emailTemplates.map((template) => (
                  <motion.div key={template.id} whileHover={{ y: -2 }} style={{
                    ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--lf-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={16} style={{ color: 'var(--lf-accent)' }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{template.nombre}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--lf-text-muted)', lineHeight: 1.4, margin: 0 }}>{template.preview}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {template.variables.slice(0, 3).map((v) => (
                        <span key={v} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--lf-primary-soft)', color: 'var(--lf-text-muted)', fontFamily: "'DM Mono', monospace" }}>{v}</span>
                      ))}
                      {template.variables.length > 3 && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--lf-primary-soft)', color: 'var(--lf-text-muted)' }}>+{template.variables.length - 3}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button onClick={() => openEmailEditor(template)} style={{
                        ...btnSmall, flex: 1, justifyContent: 'center',
                      }}><Edit2 size={12} /> Editar</button>
                      <button onClick={() => openEmailPreview(template)} style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid var(--lf-border)',
                        background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                      }}><Eye size={12} /></button>
                      <button onClick={() => sendTestEmail(template)} style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid var(--lf-border)',
                        background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                      }}><Send size={12} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 9B: APP DEL CLIENTE ═══ */}
          {activeTab === 'app' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Configuración de la App del Cliente</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
                {/* Left: Config */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Color theme */}
                  <div style={cardStyle}>
                    <label style={{ ...labelStyle, marginBottom: 8 }}>Color primario</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => setAppPrimaryColor(c)} style={{
                          width: 28, height: 28, borderRadius: '50%', border: appPrimaryColor === c ? '3px solid var(--lf-text-main)' : '2px solid var(--lf-border)',
                          background: c, cursor: 'pointer', transition: 'all 0.2s', transform: appPrimaryColor === c ? 'scale(1.15)' : 'scale(1)',
                        }} />
                      ))}
                      <input type="color" value={appPrimaryColor} onChange={(e) => setAppPrimaryColor(e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
                    </div>
                  </div>

                  {/* Welcome text */}
                  <div style={cardStyle}>
                    <label style={labelStyle}>Texto de bienvenida</label>
                    <input value={appWelcomeText} onChange={(e) => setAppWelcomeText(e.target.value)} style={inputStyle} />
                  </div>

                  {/* Featured offers */}
                  <div style={cardStyle}>
                    <label style={{ ...labelStyle, marginBottom: 8 }}>Ofertas destacadas</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {appOffers.map((offer, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', width: 20 }}>{i + 1}.</span>
                          <input value={offer} onChange={(e) => {
                            const next = [...appOffers];
                            next[i] = e.target.value;
                            setAppOffers(next);
                          }} style={{ ...inputStyle, fontSize: 13, padding: '8px 12px' }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Map zones visibility */}
                  <div style={cardStyle}>
                    <label style={{ ...labelStyle, marginBottom: 8 }}>Visibilidad de zonas en mapa</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {editZones.map((zone) => (
                        <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => {
                            setEditZones((p) => p.map((z) => z.id === zone.id ? { ...z, activa: !z.activa } : z));
                          }} style={{
                            width: 36, height: 20, borderRadius: 10, border: 'none',
                            background: zone.activa ? 'var(--lf-success)' : 'var(--lf-border)',
                            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                          }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: 3, left: zone.activa ? 19 : 3,
                              transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            }} />
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{zone.nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => showToast('Configuración de app guardada')} style={btnAccent}><Save size={14} /> Guardar</button>
                </div>

                {/* Right: Preview */}
                <div style={cardStyle}>
                  <label style={{ ...labelStyle, marginBottom: 12 }}>Vista previa</label>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    {/* Desktop mockup */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lf-text-muted)' }}>Desktop</span>
                      <div style={{
                        width: 200, height: 140, borderRadius: 8, border: '2px solid var(--lf-border)',
                        background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      }}>
                        <div style={{ height: 24, background: appPrimaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>LOGIFAST</span>
                        </div>
                        <div style={{ padding: 8, flex: 1 }}>
                          <p style={{ fontSize: 8, fontWeight: 700, margin: '0 0 4px 0', color: '#1a1a2e' }}>{appWelcomeText}</p>
                          {appOffers.map((o, i) => o ? (
                            <div key={i} style={{ fontSize: 6, padding: '2px 4px', borderRadius: 3, background: `${appPrimaryColor}15`, color: appPrimaryColor, marginBottom: 2, fontWeight: 600 }}>{o.length > 28 ? o.slice(0, 28) + '...' : o}</div>
                          ) : null)}
                        </div>
                      </div>
                    </div>
                    {/* Mobile mockup */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lf-text-muted)' }}>Mobile</span>
                      <div style={{
                        width: 90, height: 160, borderRadius: 12, border: '2px solid var(--lf-border)',
                        background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      }}>
                        <div style={{ height: 20, background: appPrimaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 6, fontWeight: 700, color: '#fff' }}>LOGIFAST</span>
                        </div>
                        <div style={{ padding: 4, flex: 1 }}>
                          <p style={{ fontSize: 5, fontWeight: 700, margin: '0 0 3px 0', color: '#1a1a2e' }}>{appWelcomeText.length > 22 ? appWelcomeText.slice(0, 22) + '...' : appWelcomeText}</p>
                          {appOffers.filter((o) => o).slice(0, 2).map((o, i) => (
                            <div key={i} style={{ fontSize: 4, padding: '1px 2px', borderRadius: 2, background: `${appPrimaryColor}15`, color: appPrimaryColor, marginBottom: 2, fontWeight: 600 }}>{o.length > 16 ? o.slice(0, 16) + '...' : o}</div>
                          ))}
                        </div>
                        <div style={{ height: 12, background: '#f5f5f5', borderTop: '1px solid var(--lf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 20, height: 3, borderRadius: 2, background: 'var(--lf-border)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ 9C: GESTIÓN DE HORARIOS ═══ */}
          {activeTab === 'horarios' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Gestión de Horarios</h3>

              {/* Weekly schedule table */}
              <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--lf-primary-soft)' }}>
                      {['Día', 'Activo', 'Hora Inicio', 'Hora Fin', 'Recargo Nocturno (%)'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {localHorarios.sort((a, b) => (a.dia === 0 ? 7 : a.dia) - (b.dia === 0 ? 7 : b.dia)).map((horario) => (
                      <tr key={horario.id} style={{ borderBottom: '1px solid var(--lf-border)', opacity: horario.activo ? 1 : 0.5 }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{DIA_LABELS[horario.dia] || 'Desconocido'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <button onClick={() => handleHorarioChange(horario.id, { activo: !horario.activo })} style={{
                            width: 44, height: 24, borderRadius: 12, border: 'none',
                            background: horario.activo ? 'var(--lf-success)' : 'var(--lf-border)',
                            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                          }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: 3, left: horario.activo ? 23 : 3,
                              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }} />
                          </button>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input type="time" value={horario.horaInicio} onChange={(e) => handleHorarioChange(horario.id, { horaInicio: e.target.value })}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none', fontFamily: "'DM Mono', monospace" }} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input type="time" value={horario.horaFin} onChange={(e) => handleHorarioChange(horario.id, { horaFin: e.target.value })}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none', fontFamily: "'DM Mono', monospace" }} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input type="number" value={horario.recargoNocturno} onChange={(e) => handleHorarioChange(horario.id, { recargoNocturno: Number(e.target.value) || 0 })}
                            style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none', fontFamily: "'DM Mono', monospace" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleSaveHorarios} style={{ ...btnAccent, marginBottom: 24 }}><Save size={14} /> Guardar horarios</button>

              {/* Feriados section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Feriados</h3>
                <button onClick={openAddFeriado} style={btnSmall}><Plus size={12} /> Agregar Feriado</button>
              </div>
              <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--lf-primary-soft)' }}>
                      {['Fecha', 'Nombre', 'Recargo (%)', 'Acciones'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feriados.map((feriado) => (
                      <tr key={feriado.id} style={{ borderBottom: '1px solid var(--lf-border)' }}>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{feriado.fecha}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{feriado.nombre}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>{feriado.recargo}%</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <button onClick={() => handleDeleteFeriado(feriado.id)} style={{
                            padding: '4px 8px', borderRadius: 6, border: '1px solid var(--lf-danger)',
                            background: 'transparent', cursor: 'pointer', color: 'var(--lf-danger)', fontSize: 12,
                          }}><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ 9D: INTEGRACIONES ═══ */}
          {activeTab === 'integraciones' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Integraciones</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {integraciones.map((integ) => {
                  const IconComp = ICON_MAP[integ.icono] || Puzzle;
                  const isConnected = integ.estado === 'conectado';
                  return (
                    <motion.div key={integ.id} whileHover={{ y: -2 }} style={{
                      ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isConnected ? 'rgba(22,163,74,0.1)' : 'var(--lf-primary-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <IconComp size={18} style={{ color: isConnected ? 'var(--lf-success)' : 'var(--lf-text-muted)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>{integ.nombre}</span>
                          <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>{integ.descripcion}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                          background: isConnected ? 'rgba(22,163,74,0.1)' : 'rgba(107,114,128,0.1)',
                          color: isConnected ? 'var(--lf-success)' : 'var(--lf-text-muted)',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {isConnected ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                          {isConnected ? 'Conectado' : 'No configurado'}
                        </span>
                        <button onClick={() => openIntegrationConfig(integ)} style={{
                          padding: '5px 10px', borderRadius: 6, border: '1px solid var(--lf-border)',
                          background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', fontSize: 12, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}><Settings size={11} /> Configurar</button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ 9E: BACKUP Y DATOS ═══ */}
          {activeTab === 'backup' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Backup y Datos</h3>

              {/* Action buttons */}
              <div style={cardStyle}>
                <label style={{ ...labelStyle, marginBottom: 10 }}>Acciones</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={exportAllData} style={{
                    ...btnAccent, background: 'var(--lf-success)',
                  }}><Download size={14} /> Exportar todos los datos</button>
                  <button onClick={exportMonthlyReport} style={{
                    ...btnAccent, background: '#F59E0B',
                  }}><FileText size={14} /> Exportar reporte mensual</button>
                  <button onClick={() => setConfirmCleanOpen(true)} style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--lf-danger)',
                    background: 'transparent', color: 'var(--lf-danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}><Trash2 size={14} /> Limpiar datos de prueba</button>
                </div>
              </div>

              {/* Backup history */}
              <div style={{ ...cardStyle, marginTop: 16 }}>
                <label style={{ ...labelStyle, marginBottom: 10 }}>Historial de Backups</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { fecha: '2026-06-10 03:00', tipo: 'Automático', tamaño: '24.3 MB' },
                    { fecha: '2026-06-09 15:30', tipo: 'Manual', tamaño: '24.1 MB' },
                    { fecha: '2026-06-08 03:00', tipo: 'Automático', tamaño: '23.8 MB' },
                  ].map((backup, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: 'var(--lf-bg-base)', borderRadius: 8, border: '1px solid var(--lf-border)',
                    }}>
                      <HardDrive size={16} style={{ color: 'var(--lf-text-muted)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace", flex: 1 }}>{backup.fecha}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: backup.tipo === 'Automático' ? 'rgba(22,163,74,0.1)' : 'var(--lf-accent-soft)', color: backup.tipo === 'Automático' ? 'var(--lf-success)' : 'var(--lf-accent)' }}>{backup.tipo}</span>
                      <span style={{ fontSize: 12, color: 'var(--lf-text-muted)', fontFamily: "'DM Mono', monospace" }}>{backup.tamaño}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage usage */}
              <div style={{ ...cardStyle, marginTop: 16 }}>
                <label style={{ ...labelStyle, marginBottom: 8 }}>Uso de Almacenamiento</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--lf-border)', overflow: 'hidden' }}>
                    <div style={{ width: '62%', height: '100%', borderRadius: 5, background: 'var(--lf-accent)', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>62%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>24.3 MB usados</span>
                  <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>de 39.0 MB</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ═══ User Modal ═══ */}
      <AnimatePresence>
        {userModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
            onClick={() => setUserModalOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ ...modalStyle, maxWidth: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editUserId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <button onClick={() => setUserModalOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input value={userName} onChange={(e) => setUserName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} type="email" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Rol</label>
                  <select value={userRol} onChange={(e) => setUserRol(e.target.value)} style={{ ...inputStyle, padding: '8px 12px' }}>
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

      {/* ═══ 9A: Email Edit Modal ═══ */}
      <AnimatePresence>
        {emailEditOpen && editingTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
            onClick={() => setEmailEditOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ ...modalStyle, maxWidth: 600 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>Editar: {editingTemplate.nombre}</h3>
                <button onClick={() => setEmailEditOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>

              {/* Variables as chips */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Variables disponibles (clic para insertar)</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {editingTemplate.variables.map((v) => (
                    <button key={v} onClick={() => {
                      setEditingTemplate((prev) => prev ? { ...prev, contenido: prev.contenido + v } : prev);
                    }} style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
                      background: 'var(--lf-accent-soft)', color: 'var(--lf-accent)', border: 'none',
                      cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                    }}>{v}</button>
                  ))}
                </div>
              </div>

              {/* HTML editor */}
              <div>
                <label style={labelStyle}>Contenido HTML</label>
                <textarea
                  value={editingTemplate.contenido}
                  onChange={(e) => setEditingTemplate((prev) => prev ? { ...prev, contenido: e.target.value } : prev)}
                  rows={10}
                  style={{
                    ...inputStyle, fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.6,
                    resize: 'vertical', minHeight: 180,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={saveEmailTemplate} style={btnAccent}><Save size={14} /> Guardar plantilla</button>
                <button onClick={() => {
                  setEmailPreviewOpen(true);
                }} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--lf-border)',
                  background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', fontWeight: 600, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}><Eye size={14} /> Vista previa</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 9A: Email Preview Modal ═══ */}
      <AnimatePresence>
        {emailPreviewOpen && previewingTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
            onClick={() => setEmailPreviewOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ ...modalStyle, maxWidth: 700 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>Vista previa: {previewingTemplate.nombre}</h3>
                <button onClick={() => setEmailPreviewOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                {/* Desktop preview */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Monitor size={14} style={{ color: 'var(--lf-text-muted)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)' }}>Desktop</span>
                  </div>
                  <div style={{
                    width: 320, minHeight: 200, borderRadius: 8, border: '2px solid var(--lf-border)',
                    background: '#fff', overflow: 'hidden',
                  }}>
                    <div style={{ height: 32, background: 'var(--lf-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>LOGIFAST</span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div dangerouslySetInnerHTML={{ __html: previewingTemplate.contenido.replace(/\{\{[^}]+\}\}/g, (m) => `<span style="color:var(--lf-accent);font-weight:700">${m}</span>`) }} />
                    </div>
                  </div>
                </div>

                {/* Mobile preview */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Smartphone size={14} style={{ color: 'var(--lf-text-muted)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)' }}>Mobile</span>
                  </div>
                  <div style={{
                    width: 180, minHeight: 200, borderRadius: 12, border: '2px solid var(--lf-border)',
                    background: '#fff', overflow: 'hidden',
                  }}>
                    <div style={{ height: 24, background: 'var(--lf-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>LOGIFAST</span>
                    </div>
                    <div style={{ padding: 10, fontSize: 11 }}>
                      <div dangerouslySetInnerHTML={{ __html: previewingTemplate.contenido.replace(/\{\{[^}]+\}\}/g, (m) => `<span style="color:var(--lf-accent);font-weight:700">${m}</span>`) }} />
                    </div>
                    <div style={{ height: 16, background: '#f5f5f5', borderTop: '1px solid var(--lf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 30, height: 4, borderRadius: 2, background: 'var(--lf-border)' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                <button onClick={() => sendTestEmail(previewingTemplate)} style={btnAccent}><Send size={14} /> Enviar email de prueba</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 9C: Feriado Modal ═══ */}
      <AnimatePresence>
        {feriadoModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
            onClick={() => setFeriadoModalOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ ...modalStyle, maxWidth: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>Nuevo Feriado</h3>
                <button onClick={() => setFeriadoModalOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input type="date" value={newFeriadoFecha} onChange={(e) => setNewFeriadoFecha(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input value={newFeriadoNombre} onChange={(e) => setNewFeriadoNombre(e.target.value)} placeholder="Ej: Navidad" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Recargo (%)</label>
                  <input type="number" value={newFeriadoRecargo} onChange={(e) => setNewFeriadoRecargo(e.target.value)} style={{ ...inputStyle, fontFamily: "'DM Mono', monospace" }} />
                </div>
                <button onClick={saveFeriado} style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'var(--lf-accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
                  Agregar Feriado
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 9D: Integration Config Modal ═══ */}
      <AnimatePresence>
        {integrationModalOpen && editingIntegration && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
            onClick={() => setIntegrationModalOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ ...modalStyle, maxWidth: 440 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>Configurar: {editingIntegration.nombre}</h3>
                <button onClick={() => setIntegrationModalOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--lf-text-muted)', marginBottom: 16 }}>{editingIntegration.descripcion}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>API Key</label>
                  <input value={intApiKey} onChange={(e) => setIntApiKey(e.target.value)} placeholder="sk-xxxxxxxxxxxx" type="password" style={{ ...inputStyle, fontFamily: "'DM Mono', monospace", fontSize: 13 }} />
                </div>
                <div>
                  <label style={labelStyle}>Webhook URL</label>
                  <input value={intWebhookUrl} onChange={(e) => setIntWebhookUrl(e.target.value)} placeholder="https://api.example.com/webhook" style={{ ...inputStyle, fontFamily: "'DM Mono', monospace", fontSize: 13 }} />
                </div>
                <button onClick={saveIntegration} style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'var(--lf-accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
                  Guardar Configuración
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 9E: Confirm Clean Dialog ═══ */}
      <AnimatePresence>
        {confirmCleanOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
            onClick={() => setConfirmCleanOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ ...modalStyle, maxWidth: 380, textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={24} style={{ color: 'var(--lf-danger)' }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>¿Limpiar datos de prueba?</h3>
              <p style={{ fontSize: 13, color: 'var(--lf-text-muted)', marginBottom: 20 }}>Esta acción eliminará todos los datos de prueba. Esta operación no se puede deshacer.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setConfirmCleanOpen(false)} style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid var(--lf-border)',
                  background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', fontWeight: 600, fontSize: 13,
                }}>Cancelar</button>
                <button onClick={cleanTestData} style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--lf-danger)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>Eliminar</button>
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
