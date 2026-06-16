'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Key, FileText, ToggleLeft, Activity,
  Database, HardDrive, Clock, Wifi, Plus, Edit2,
  Search, Download, AlertTriangle, Power, Check,
  AlertCircle, TrendingUp, Zap,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/lib/store';
import type { AuditLogEntry, FeatureFlag, SystemUser } from '@/lib/store';

/* ─── Sub-tab type ─── */
type SubTab = 'sistema' | 'usuarios' | 'permisos' | 'auditoria' | 'featureflags';

const SUB_TABS: { key: SubTab; label: string; icon: typeof Shield }[] = [
  { key: 'sistema', label: 'Sistema', icon: Activity },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'permisos', label: 'Permisos', icon: Key },
  { key: 'auditoria', label: 'Auditoría', icon: FileText },
  { key: 'featureflags', label: 'Feature Flags', icon: ToggleLeft },
];

/* ─── Permission definitions ─── */
const PERMISSIONS = [
  'Puede crear órdenes',
  'Puede cancelar órdenes',
  'Puede ver reportes',
  'Puede gestionar flota',
  'Puede enviar campañas',
  'Puede gestionar usuarios',
  'Puede editar configuración',
  'Puede acceder al panel super admin',
] as const;

type PermissionKey = (typeof PERMISSIONS)[number];

const ROLES = ['Cliente', 'Repartidor', 'Admin', 'Ingeniero', 'Super Admin'] as const;

/* ─── Default permissions per role ─── */
const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<PermissionKey, boolean>> = {
  Cliente: {
    'Puede crear órdenes': true,
    'Puede cancelar órdenes': false,
    'Puede ver reportes': false,
    'Puede gestionar flota': false,
    'Puede enviar campañas': false,
    'Puede gestionar usuarios': false,
    'Puede editar configuración': false,
    'Puede acceder al panel super admin': false,
  },
  Repartidor: {
    'Puede crear órdenes': true,
    'Puede cancelar órdenes': false,
    'Puede ver reportes': false,
    'Puede gestionar flota': false,
    'Puede enviar campañas': false,
    'Puede gestionar usuarios': false,
    'Puede editar configuración': false,
    'Puede acceder al panel super admin': false,
  },
  Admin: {
    'Puede crear órdenes': true,
    'Puede cancelar órdenes': true,
    'Puede ver reportes': true,
    'Puede gestionar flota': true,
    'Puede enviar campañas': true,
    'Puede gestionar usuarios': false,
    'Puede editar configuración': false,
    'Puede acceder al panel super admin': false,
  },
  Ingeniero: {
    'Puede crear órdenes': true,
    'Puede cancelar órdenes': true,
    'Puede ver reportes': true,
    'Puede gestionar flota': true,
    'Puede enviar campañas': true,
    'Puede gestionar usuarios': true,
    'Puede editar configuración': true,
    'Puede acceder al panel super admin': false,
  },
  'Super Admin': {
    'Puede crear órdenes': true,
    'Puede cancelar órdenes': true,
    'Puede ver reportes': true,
    'Puede gestionar flota': true,
    'Puede enviar campañas': true,
    'Puede gestionar usuarios': true,
    'Puede editar configuración': true,
    'Puede acceder al panel super admin': true,
  },
};

/* ─── Simulated system health data ─── */
const SYSTEM_HEALTH = {
  dbStatus: 'OK' as const,
  storageUsed: 2.3,
  storageTotal: 10,
  apiResponseMs: 45,
  apiTrend: -12,
  lastBackup: '2026-03-04 02:00 AM',
  version: 'LOGIFAST v2.0.0',
  connectedUsers: 12,
};

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export default function ModuleSuperAdmin() {
  const { auditLog, featureFlags, users, toggleFeatureFlag, addAuditEntry, addToast } = useStore();

  const [activeTab, setActiveTab] = useState<SubTab>('sistema');

  /* ─── Usuarios state ─── */
  const [localUsers, setLocalUsers] = useState<SystemUser[]>(users);
  const [userSearch, setUserSearch] = useState('');
  const [userRolFilter, setUserRolFilter] = useState('all');
  const [userEstadoFilter, setUserEstadoFilter] = useState('all');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [modalNombre, setModalNombre] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalRol, setModalRol] = useState('Repartidor');
  const [modalPerms, setModalPerms] = useState<Record<PermissionKey, boolean>>(
    DEFAULT_ROLE_PERMISSIONS['Repartidor'],
  );

  /* ─── Permisos state ─── */
  const [permRole, setPermRole] = useState<string>('Cliente');
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<PermissionKey, boolean>>>(
    DEFAULT_ROLE_PERMISSIONS,
  );

  /* ─── Auditoría state ─── */
  const [auditUserFilter, setAuditUserFilter] = useState('all');
  const [auditAccionFilter, setAuditAccionFilter] = useState('all');
  const [auditModuloFilter, setAuditModuloFilter] = useState('all');

  /* ─── Feature Flags state ─── */
  const [newFlagModal, setNewFlagModal] = useState(false);
  const [newFlagNombre, setNewFlagNombre] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');

  /* ═══ FILTERED USERS ═══ */
  const filteredUsers = useMemo(() => {
    return localUsers.filter((u) => {
      const matchSearch =
        !userSearch ||
        u.nombre.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRol = userRolFilter === 'all' || u.rol === userRolFilter;
      const matchEstado =
        userEstadoFilter === 'all' ||
        (userEstadoFilter === 'activo' && u.activo) ||
        (userEstadoFilter === 'inactivo' && !u.activo);
      return matchSearch && matchRol && matchEstado;
    });
  }, [localUsers, userSearch, userRolFilter, userEstadoFilter]);

  /* ═══ FILTERED AUDIT LOG ═══ */
  const filteredAudit = useMemo(() => {
    return auditLog.filter((entry) => {
      const matchUser = auditUserFilter === 'all' || entry.usuario === auditUserFilter;
      const matchAccion = auditAccionFilter === 'all' || entry.accion === auditAccionFilter;
      const matchModulo =
        auditModuloFilter === 'all' || entry.recurso === auditModuloFilter;
      return matchUser && matchAccion && matchModulo;
    });
  }, [auditLog, auditUserFilter, auditAccionFilter, auditModuloFilter]);

  /* ─── Check high-activity alert ─── */
  const highActivityUsers = useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const counts: Record<string, number> = {};
    auditLog.forEach((entry) => {
      const entryDate = new Date(entry.createdAt);
      if (entryDate >= oneHourAgo) {
        counts[entry.usuario] = (counts[entry.usuario] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .filter(([, count]) => count > 50)
      .map(([usuario]) => usuario);
  }, [auditLog]);

  /* ─── Unique values for audit filters ─── */
  const auditUsuarios = useMemo(
    () => [...new Set(auditLog.map((e) => e.usuario))],
    [auditLog],
  );
  const auditAcciones = useMemo(
    () => [...new Set(auditLog.map((e) => e.accion))],
    [auditLog],
  );
  const auditModulos = useMemo(
    () => [...new Set(auditLog.map((e) => e.recurso))],
    [auditLog],
  );

  /* ═══ USER MODAL HANDLERS ═══ */
  const openCreateUser = () => {
    setEditUserId(null);
    setModalNombre('');
    setModalEmail('');
    setModalRol('Repartidor');
    setModalPerms(DEFAULT_ROLE_PERMISSIONS['Repartidor']);
    setUserModalOpen(true);
  };

  const openEditUser = (user: SystemUser) => {
    setEditUserId(user.id);
    setModalNombre(user.nombre);
    setModalEmail(user.email);
    setModalRol(user.rol);
    setModalPerms(DEFAULT_ROLE_PERMISSIONS[user.rol] || DEFAULT_ROLE_PERMISSIONS['Cliente']);
    setUserModalOpen(true);
  };

  const saveUser = () => {
    if (!modalNombre.trim() || !modalEmail.trim()) {
      addToast('Nombre y email son requeridos', 'error');
      return;
    }
    if (editUserId) {
      setLocalUsers((prev) =>
        prev.map((u) =>
          u.id === editUserId
            ? { ...u, nombre: modalNombre, email: modalEmail, rol: modalRol }
            : u,
        ),
      );
      addToast('Usuario actualizado exitosamente');
      addAuditEntry({
        userId: 'admin',
        usuario: 'Super Admin',
        accion: 'editar',
        recurso: 'usuario',
        recursoId: editUserId,
        detalles: `Usuario ${modalNombre} editado`,
        ip: '192.168.1.100',
        dispositivo: 'Chrome/Mac',
        createdAt: new Date().toISOString(),
      });
    } else {
      const newUser: SystemUser = {
        id: `U-${Date.now()}`,
        nombre: modalNombre,
        email: modalEmail,
        rol: modalRol,
        activo: true,
      };
      setLocalUsers((prev) => [...prev, newUser]);
      addToast('Usuario creado exitosamente');
      addAuditEntry({
        userId: 'admin',
        usuario: 'Super Admin',
        accion: 'crear',
        recurso: 'usuario',
        recursoId: newUser.id,
        detalles: `Usuario ${modalNombre} creado con rol ${modalRol}`,
        ip: '192.168.1.100',
        dispositivo: 'Chrome/Mac',
        createdAt: new Date().toISOString(),
      });
    }
    setUserModalOpen(false);
  };

  const toggleUserActivo = (id: string) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)),
    );
    const user = localUsers.find((u) => u.id === id);
    addToast(user?.activo ? 'Usuario desactivado' : 'Usuario activado');
  };

  const resetPassword = (user: SystemUser) => {
    addToast(`Contraseña reseteada para ${user.nombre}. Enlace enviado a ${user.email}`);
  };

  const inviteUser = () => {
    const link = `https://logifast.ni/invite/${Math.random().toString(36).slice(2, 10)}`;
    addToast(`Enlace de invitación generado: ${link}`);
  };

  /* ═══ PERMISSION HANDLERS ═══ */
  const togglePermission = (perm: PermissionKey) => {
    setRolePermissions((prev) => ({
      ...prev,
      [permRole]: {
        ...prev[permRole],
        [perm]: !prev[permRole][perm],
      },
    }));
  };

  const savePermissions = () => {
    addToast(`Permisos para ${permRole} guardados exitosamente`);
    addAuditEntry({
      userId: 'admin',
      usuario: 'Super Admin',
      accion: 'editar',
      recurso: 'permisos',
      recursoId: permRole,
      detalles: `Permisos actualizados para rol ${permRole}`,
      ip: '192.168.1.100',
      dispositivo: 'Chrome/Mac',
      createdAt: new Date().toISOString(),
    });
  };

  /* ═══ FEATURE FLAG HANDLERS ═══ */
  const handleToggleFlag = (id: string) => {
    toggleFeatureFlag(id);
    const flag = featureFlags.find((f) => f.id === id);
    addToast(`Feature flag "${flag?.nombre}" ${flag?.habilitado ? 'deshabilitado' : 'habilitado'}`);
    addAuditEntry({
      userId: 'admin',
      usuario: 'Super Admin',
      accion: 'editar',
      recurso: 'feature_flag',
      recursoId: id,
      detalles: `Flag "${flag?.nombre}" ${flag?.habilitado ? 'deshabilitado' : 'habilitado'}`,
      ip: '192.168.1.100',
      dispositivo: 'Chrome/Mac',
      createdAt: new Date().toISOString(),
    });
  };

  const addNewFlag = () => {
    if (!newFlagNombre.trim() || !newFlagDesc.trim()) {
      addToast('Nombre y descripción son requeridos', 'error');
      return;
    }
    addToast(`Feature flag "${newFlagNombre}" creado`);
    addAuditEntry({
      userId: 'admin',
      usuario: 'Super Admin',
      accion: 'crear',
      recurso: 'feature_flag',
      detalles: `Nuevo flag "${newFlagNombre}" creado`,
      ip: '192.168.1.100',
      dispositivo: 'Chrome/Mac',
      createdAt: new Date().toISOString(),
    });
    setNewFlagModal(false);
    setNewFlagNombre('');
    setNewFlagDesc('');
  };

  /* ═══ ROL BADGE COLOR ═══ */
  const rolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'Super Admin':
        return { bg: 'rgba(255,87,34,0.12)', color: 'var(--primario)' };
      case 'Admin':
        return { bg: 'rgba(41,121,255,0.12)', color: 'var(--info)' };
      case 'Ingeniero':
        return { bg: 'rgba(255,179,0,0.12)', color: 'var(--warning)' };
      case 'Repartidor':
        return { bg: 'rgba(0,200,83,0.12)', color: 'var(--exito)' };
      default:
        return { bg: 'rgba(142,142,160,0.12)', color: 'var(--text-muted)' };
    }
  };

  /* ═══ STATUS BADGE ═══ */
  const statusBadge = (status: 'OK' | 'Lenta' | 'Error') => {
    const colors = {
      OK: { bg: 'rgba(0,200,83,0.12)', color: 'var(--exito)' },
      Lenta: { bg: 'rgba(255,179,0,0.12)', color: 'var(--warning)' },
      Error: { bg: 'rgba(255,23,68,0.12)', color: 'var(--peligro)' },
    };
    return colors[status];
  };

  /* ═══ FORMAT TIMESTAMP ═══ */
  const formatTs = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--primario-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Shield size={18} style={{ color: 'var(--primario)' }} />
        </div>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>Super Admin</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Control total del sistema LOGIFAST
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: isActive ? 'var(--primario-soft)' : 'transparent',
                color: isActive ? 'var(--primario)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* ════════════════════════════════════════
              1. SISTEMA — System Health
              ════════════════════════════════════════ */}
          {activeTab === 'sistema' && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
                Estado del Sistema
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                {/* Database */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(0,200,83,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Database size={16} style={{ color: 'var(--exito)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Base de datos
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: statusBadge('OK').bg,
                        color: statusBadge('OK').color,
                      }}
                    >
                      OK
                    </span>
                  </div>
                </div>

                {/* Storage */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(41,121,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HardDrive size={16} style={{ color: 'var(--info)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Almacenamiento
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {SYSTEM_HEALTH.storageUsed} GB / {SYSTEM_HEALTH.storageTotal} GB
                  </div>
                  <Progress
                    value={(SYSTEM_HEALTH.storageUsed / SYSTEM_HEALTH.storageTotal) * 100}
                    style={{ height: 6, borderRadius: 3 }}
                  />
                </div>

                {/* API Response */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(0,200,83,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Zap size={16} style={{ color: 'var(--exito)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Tiempo respuesta API
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>
                      {SYSTEM_HEALTH.apiResponseMs}ms
                    </span>
                    <TrendingUp
                      size={14}
                      style={{ color: 'var(--exito)', transform: 'rotate(-15deg)' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--exito)' }}>
                      {SYSTEM_HEALTH.apiTrend}%
                    </span>
                  </div>
                </div>

                {/* Last Backup */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(255,179,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Clock size={16} style={{ color: 'var(--warning)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Último backup
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {SYSTEM_HEALTH.lastBackup}
                  </span>
                </div>

                {/* Version */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--primario-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Shield size={16} style={{ color: 'var(--primario)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Versión del sistema
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{SYSTEM_HEALTH.version}</span>
                </div>

                {/* Connected Users */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(0,200,83,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Wifi size={16} style={{ color: 'var(--exito)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Usuarios conectados
                    </span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>
                    {SYSTEM_HEALTH.connectedUsers}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              2. USUARIOS — User Management
              ════════════════════════════════════════ */}
          {activeTab === 'usuarios' && (
            <div>
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Gestión de Usuarios</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={inviteUser}
                    style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Power size={13} /> Invitar usuario
                  </Button>
                  <Button
                    size="sm"
                    onClick={openCreateUser}
                    style={{
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--primario)',
                      color: '#fff',
                    }}
                  >
                    <Plus size={13} /> Crear usuario
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ paddingLeft: 30, fontSize: 13, height: 34 }}
                  />
                </div>
                <Select value={userRolFilter} onValueChange={setUserRolFilter}>
                  <SelectTrigger style={{ height: 34, fontSize: 13, minWidth: 130 }}>
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userEstadoFilter} onValueChange={setUserEstadoFilter}>
                  <SelectTrigger style={{ height: 34, fontSize: 13, minWidth: 120 }}>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users table */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ fontSize: 12 }}>Nombre</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Email</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Rol</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Estado</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Último login</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const rc = rolBadgeColor(u.rol);
                      const lastLogin =
                        u.id === 'U-01'
                          ? '2026-03-04 09:15'
                          : u.activo
                            ? '2026-03-03 14:30'
                            : '2026-02-28 11:00';
                      const totalActions = u.rol === 'Super Admin' ? 156 : u.rol === 'Admin' ? 89 : u.rol === 'Repartidor' ? 34 : 12;
                      return (
                        <TableRow key={u.id}>
                          <TableCell style={{ fontSize: 13, fontWeight: 600 }}>
                            {u.nombre}
                          </TableCell>
                          <TableCell style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                background: rc.bg,
                                color: rc.color,
                              }}
                            >
                              {u.rol}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                background: u.activo
                                  ? 'rgba(0,200,83,0.12)'
                                  : 'rgba(255,23,68,0.12)',
                                color: u.activo ? 'var(--exito)' : 'var(--peligro)',
                              }}
                            >
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </TableCell>
                          <TableCell style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {lastLogin}
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => openEditUser(u)}
                                title="Editar"
                                style={{
                                  background: 'rgba(41,121,255,0.1)',
                                  border: 'none',
                                  borderRadius: 6,
                                  width: 28,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: 'var(--info)',
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => toggleUserActivo(u.id)}
                                title={u.activo ? 'Desactivar' : 'Activar'}
                                style={{
                                  background: u.activo
                                    ? 'rgba(255,23,68,0.1)'
                                    : 'rgba(0,200,83,0.1)',
                                  border: 'none',
                                  borderRadius: 6,
                                  width: 28,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: u.activo ? 'var(--peligro)' : 'var(--exito)',
                                }}
                              >
                                <Power size={13} />
                              </button>
                              <button
                                onClick={() => resetPassword(u)}
                                title="Reset contraseña"
                                style={{
                                  background: 'rgba(255,179,0,0.1)',
                                  border: 'none',
                                  borderRadius: 6,
                                  width: 28,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: 'var(--warning)',
                                }}
                              >
                                <Key size={13} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {filteredUsers.length === 0 && (
                  <div
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    No se encontraron usuarios con los filtros aplicados
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              3. PERMISOS — Granular Permissions
              ════════════════════════════════════════ */}
          {activeTab === 'permisos' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Permisos por Rol</h3>
                <Button
                  size="sm"
                  onClick={savePermissions}
                  style={{
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'var(--primario)',
                    color: '#fff',
                  }}
                >
                  <Check size={13} /> Guardar permisos
                </Button>
              </div>

              {/* Role selector tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              >
                {ROLES.map((rol) => {
                  const isActive = permRole === rol;
                  const rc = rolBadgeColor(rol);
                  return (
                    <button
                      key={rol}
                      onClick={() => setPermRole(rol)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: isActive ? rc.bg : 'transparent',
                        color: isActive ? rc.color : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {rol}
                    </button>
                  );
                })}
              </div>

              {/* Permissions grid */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 8,
                  }}
                >
                  {PERMISSIONS.map((perm) => {
                    const checked = rolePermissions[permRole]?.[perm] ?? false;
                    return (
                      <div
                        key={perm}
                        onClick={() => togglePermission(perm)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `1px solid ${checked ? 'var(--primario)' : 'var(--border)'}`,
                          background: checked ? 'var(--primario-soft)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Checkbox checked={checked} />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: checked ? 600 : 400,
                            color: checked ? 'var(--text)' : 'var(--text-secondary)',
                          }}
                        >
                          {perm}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              4. AUDITORÍA — Audit Log
              ════════════════════════════════════════ */}
          {activeTab === 'auditoria' && (
            <div>
              {/* High activity alert */}
              {highActivityUsers.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255,23,68,0.08)',
                    border: '1px solid rgba(255,23,68,0.2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={16} style={{ color: 'var(--peligro)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--peligro)', fontWeight: 600 }}>
                    Alerta: {highActivityUsers.join(', ')} — más de 50 acciones en la última hora
                  </span>
                </div>
              )}

              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Registro de Auditoría</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToast('Exportación de auditoría iniciada (simulado)')}
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Download size={13} /> Exportar
                </Button>
              </div>

              {/* Filters */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <Select value={auditUserFilter} onValueChange={setAuditUserFilter}>
                  <SelectTrigger style={{ height: 34, fontSize: 13, minWidth: 140 }}>
                    <SelectValue placeholder="Usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    {auditUsuarios.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditAccionFilter} onValueChange={setAuditAccionFilter}>
                  <SelectTrigger style={{ height: 34, fontSize: 13, minWidth: 130 }}>
                    <SelectValue placeholder="Acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    {auditAcciones.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditModuloFilter} onValueChange={setAuditModuloFilter}>
                  <SelectTrigger style={{ height: 34, fontSize: 13, minWidth: 130 }}>
                    <SelectValue placeholder="Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los módulos</SelectItem>
                    {auditModulos.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audit table */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ fontSize: 12 }}>Timestamp</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Usuario</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Acción</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Recurso</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Detalles</TableHead>
                      <TableHead style={{ fontSize: 12 }}>IP</TableHead>
                      <TableHead style={{ fontSize: 12 }}>Dispositivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudit.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {formatTs(entry.createdAt)}
                        </TableCell>
                        <TableCell style={{ fontSize: 12, fontWeight: 600 }}>
                          {entry.usuario}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{ fontSize: 10, padding: '1px 6px', fontWeight: 700 }}
                          >
                            {entry.accion}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ fontSize: 12 }}>{entry.recurso}</TableCell>
                        <TableCell
                          style={{
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            maxWidth: 180,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entry.detalles || '—'}
                        </TableCell>
                        <TableCell style={{ fontSize: 11, fontFamily: 'monospace' }}>
                          {entry.ip || '—'}
                        </TableCell>
                        <TableCell style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {entry.dispositivo || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredAudit.length === 0 && (
                  <div
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    No se encontraron registros con los filtros aplicados
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              5. FEATURE FLAGS
              ════════════════════════════════════════ */}
          {activeTab === 'featureflags' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>Feature Flags</h3>
                <Button
                  size="sm"
                  onClick={() => setNewFlagModal(true)}
                  style={{
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'var(--primario)',
                    color: '#fff',
                  }}
                >
                  <Plus size={13} /> Nuevo flag
                </Button>
              </div>

              {/* Maintenance mode warning */}
              {featureFlags.find((f) => f.id === 'FF-06')?.habilitado && (
                <div
                  style={{
                    background: 'rgba(255,23,68,0.08)',
                    border: '1px solid rgba(255,23,68,0.25)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <AlertCircle size={18} style={{ color: 'var(--peligro)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--peligro)' }}>
                      ⚠ Modo mantenimiento activado
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      El sistema está bloqueado para todos los usuarios excepto Super Admin.
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {featureFlags.map((flag) => {
                  const isMaintenance = flag.id === 'FF-06';
                  return (
                    <motion.div
                      key={flag.id}
                      layout
                      style={{
                        background: isMaintenance && flag.habilitado
                          ? 'rgba(255,23,68,0.04)'
                          : 'var(--surface)',
                        border: `1px solid ${
                          isMaintenance && flag.habilitado
                            ? 'rgba(255,23,68,0.2)'
                            : 'var(--border)'
                        }`,
                        borderRadius: 12,
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        {/* Visual indicator */}
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: flag.habilitado
                              ? isMaintenance
                                ? 'var(--peligro)'
                                : 'var(--exito)'
                              : 'var(--text-muted)',
                            flexShrink: 0,
                            boxShadow: flag.habilitado
                              ? `0 0 8px ${isMaintenance ? 'rgba(255,23,68,0.4)' : 'rgba(0,200,83,0.4)'}`
                              : 'none',
                            transition: 'all 0.3s',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: isMaintenance && flag.habilitado
                                ? 'var(--peligro)'
                                : 'var(--text)',
                            }}
                          >
                            {flag.nombre}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              marginTop: 2,
                            }}
                          >
                            {flag.descripcion}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: flag.habilitado
                              ? isMaintenance
                                ? 'var(--peligro)'
                                : 'var(--exito)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {flag.habilitado ? 'ON' : 'OFF'}
                        </span>
                        <Switch
                          checked={flag.habilitado}
                          onCheckedChange={() => handleToggleFlag(flag.id)}
                          className={
                            isMaintenance && flag.habilitado
                              ? 'data-[state=checked]:bg-[var(--peligro)]'
                              : ''
                          }
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ═══ USER MODAL ═══ */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent style={{ maxWidth: 500 }}>
          <DialogHeader>
            <DialogTitle>{editUserId ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
            <DialogDescription>
              {editUserId
                ? 'Modifica los datos del usuario'
                : 'Completa los datos para crear un nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}
              >
                Nombre
              </label>
              <Input
                value={modalNombre}
                onChange={(e) => setModalNombre(e.target.value)}
                placeholder="Nombre completo"
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <label
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}
              >
                Email
              </label>
              <Input
                value={modalEmail}
                onChange={(e) => setModalEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                type="email"
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <label
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}
              >
                Rol
              </label>
              <Select
                value={modalRol}
                onValueChange={(val) => {
                  setModalRol(val);
                  setModalPerms(DEFAULT_ROLE_PERMISSIONS[val] || DEFAULT_ROLE_PERMISSIONS['Cliente']);
                }}
              >
                <SelectTrigger style={{ fontSize: 13, width: '100%' }}>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}
              >
                Permisos
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 4,
                  maxHeight: 180,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {PERMISSIONS.map((perm) => (
                  <div
                    key={perm}
                    onClick={() =>
                      setModalPerms((prev) => ({ ...prev, [perm]: !prev[perm] }))
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 6px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 11,
                      color: modalPerms[perm] ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: modalPerms[perm] ? 600 : 400,
                    }}
                  >
                    <Checkbox checked={modalPerms[perm]} />
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserModalOpen(false)} style={{ fontSize: 13 }}>
              Cancelar
            </Button>
            <Button
              onClick={saveUser}
              style={{
                fontSize: 13,
                background: 'var(--primario)',
                color: '#fff',
              }}
            >
              {editUserId ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ NEW FLAG MODAL ═══ */}
      <Dialog open={newFlagModal} onOpenChange={setNewFlagModal}>
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader>
            <DialogTitle>Nuevo Feature Flag</DialogTitle>
            <DialogDescription>Agrega un nuevo flag al sistema</DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}
              >
                Nombre
              </label>
              <Input
                value={newFlagNombre}
                onChange={(e) => setNewFlagNombre(e.target.value)}
                placeholder="Ej: Habilitar notificaciones push"
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <label
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}
              >
                Descripción
              </label>
              <Input
                value={newFlagDesc}
                onChange={(e) => setNewFlagDesc(e.target.value)}
                placeholder="Describe el propósito de este flag"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFlagModal(false)} style={{ fontSize: 13 }}>
              Cancelar
            </Button>
            <Button
              onClick={addNewFlag}
              style={{
                fontSize: 13,
                background: 'var(--primario)',
                color: '#fff',
              }}
            >
              Crear flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
