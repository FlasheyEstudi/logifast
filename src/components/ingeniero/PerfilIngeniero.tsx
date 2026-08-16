// components/ingeniero/PerfilIngeniero.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SettingRow from '@/components/ui/SettingRow';
import { SonidoToggle } from '@/components/ui/SonidoToggle';
import VibracionToggle from '@/components/ui/VibracionToggle';
import { TemaToggle } from '@/components/ui/TemaToggle';
import { useIngenieroStore } from '@/store/ingenieroStore';
import { useConfigStore } from '@/store/configStore';
import { realtime } from '@/services/realtime';
import { notify } from '@/lib/notify';
import {
  Wrench,
  Bike,
  Package,
  FileText,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  Edit3,
  User,
  Phone,
  Mail,
  Download,
  BookOpen,
  Zap,
} from 'lucide-react';

interface PerfilIngenieroProps {
  onLogout: () => void;
  userName: string;
}

export default function PerfilIngeniero({ onLogout, userName }: PerfilIngenieroProps) {
  const store = useIngenieroStore();
  const config = useConfigStore();

  // Modals state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // Edit profile form state
  const [editNombre, setEditNombre] = useState(store.perfil?.nombre || userName || 'Ing. Carlos Mendoza');
  const [editEmail, setEditEmail] = useState(store.perfil?.email || 'ingeniero@logifast.com');
  const [editTelefono, setEditTelefono] = useState('+505 8888-7777');
  const [editEspecialidad, setEditEspecialidad] = useState('Jefe de Flota & Mantenimiento');
  const [isSaving, setIsSaving] = useState(false);

  const handleCerrarSesion = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    } finally {
      realtime.disconnect();
      try {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        localStorage.removeItem('logifast-repartidor-store');
        localStorage.removeItem('logifast-marketplace-store');
        localStorage.removeItem('logifast-config-store');
        localStorage.removeItem('logifast-ingeniero-store');
      } catch {}
      if (typeof onLogout === 'function') {
        onLogout();
      }
    }
  };

  const handleInventario = () => {
    store.setTabActiva('inventario');
  };

  const handleSaveProfile = () => {
    if (!editNombre.trim()) {
      notify.error('El nombre es obligatorio');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowEditProfileModal(false);
      notify.success('¡Perfil técnico actualizado correctamente!');
    }, 400);
  };

  const handleExportReport = () => {
    const data = {
      fecha: new Date().toISOString(),
      taller: 'Taller Central Logifast',
      totalMotos: store.stats?.totalMotos || 0,
      disponibles: store.stats?.disponibles || 0,
      enServicio: store.stats?.enServicio || 0,
      enMantenimiento: store.stats?.enMantenimiento || 0,
      fueraServicio: store.stats?.fueraServicio || 0,
      mantenimientosCompletadosMes: store.stats?.mantenimientosCompletados || 0,
      costoMesTotalCordobas: store.stats?.costoMantenimientoMes || 0,
      mttrPromedioMinutos: store.stats?.mttrMinutos || 45,
      alertasActivas: store.stats?.alertasActivas || 0,
      repuestosBajoStock: store.stats?.repuestosBajoStock || 0,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-taller-logifast-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success('Reporte técnico descargado correctamente');
  };

  return (
    <div
      className="perfil-ingeniero"
      style={{
        padding: '0 20px',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        className="perfil-cliente-header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        <div
          className="perfil-cliente-avatar"
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #1E293B, #3B82F6)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            marginBottom: 12,
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <span>{(editNombre || userName || store.perfil?.nombre || 'Ingeniero').split(' ').map(n => n[0] || '').join('').slice(0, 2)}</span>
        </div>
        <div className="perfil-cliente-nombre font-syne" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
          {editNombre || userName || store.perfil?.nombre}
        </div>
        <div className="perfil-cliente-email" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {editEmail || store.perfil?.email}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            className="perfil-rol-badge"
            style={{
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {editEspecialidad}
          </span>
          <button
            type="button"
            onClick={() => setShowEditProfileModal(true)}
            style={{
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit3 size={11} /> Editar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        className="perfil-cliente-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <div
          className="perfil-cliente-stat"
          style={{
            padding: 12,
            borderRadius: 16,
            background: 'var(--md-surface, rgba(30, 41, 59, 0.6))',
            border: '1px solid var(--md-outline-variant, rgba(255, 255, 255, 0.1))',
            textAlign: 'center',
          }}
        >
          <div className="perfil-cliente-stat-value mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            {store.stats?.totalMotos || store.motos?.length || 0}
          </div>
          <div className="perfil-cliente-stat-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Flota Motos
          </div>
        </div>

        <div
          className="perfil-cliente-stat"
          style={{
            padding: 12,
            borderRadius: 16,
            background: 'var(--md-surface, rgba(30, 41, 59, 0.6))',
            border: '1px solid var(--md-outline-variant, rgba(255, 255, 255, 0.1))',
            textAlign: 'center',
          }}
        >
          <div className="perfil-cliente-stat-value mono" style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>
            {store.stats?.mantenimientosCompletados || store.mantenimientos?.filter(m => m.estado === 'COMPLETADO').length || 0}
          </div>
          <div className="perfil-cliente-stat-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Mant. Hechos
          </div>
        </div>

        <div
          className="perfil-cliente-stat"
          style={{
            padding: 12,
            borderRadius: 16,
            background: 'var(--md-surface, rgba(30, 41, 59, 0.6))',
            border: '1px solid var(--md-outline-variant, rgba(255, 255, 255, 0.1))',
            textAlign: 'center',
          }}
        >
          <div className="perfil-cliente-stat-value mono" style={{ fontSize: 20, fontWeight: 700, color: '#FFB300' }}>
            {store.stats?.alertasActivas || 0}
          </div>
          <div className="perfil-cliente-stat-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Alertas Activas
          </div>
        </div>
      </div>

      {/* Secciones */}
      <div className="perfil-cliente-secciones" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Gestión Técnica y Herramientas de Taller */}
        <div className="perfil-seccion">
          <div className="perfil-seccion-title font-syne" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Taller & Herramientas
          </div>

          <SettingRow
            icon={<Package size={20} />}
            label="Inventario de Repuestos"
            desc={`${store.repuestos?.length || 0} repuestos en catálogo, ${store.stats?.repuestosBajoStock || 0} bajo stock`}
            trailing={
              <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            }
            onClick={handleInventario}
          />

          <SettingRow
            icon={<TrendingUp size={20} />}
            label="Reportes & Auditoría de Flota"
            desc="Métricas MTTR, costos mensuales y eficiencia preventiva"
            trailing={
              <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            }
            onClick={() => setShowReportesModal(true)}
          />

          <SettingRow
            icon={<Wrench size={20} />}
            label="Programar Mantenimiento Express"
            desc="Crear orden de trabajo o revisión de emergencia"
            trailing={
              <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            }
            onClick={() => store.toggleCrearMantenimiento()}
          />

          <SettingRow
            icon={<BookOpen size={20} />}
            label="Manual de Taller & Procedimientos"
            desc="Especificaciones técnicas, torques e intervalos oficiales"
            trailing={
              <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            }
            onClick={() => setShowManualModal(true)}
          />
        </div>

        {/* Apariencia */}
        <div className="perfil-seccion">
          <div className="perfil-seccion-title font-syne" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Apariencia
          </div>
          <TemaToggle />
        </div>

        {/* Configuración de Alertas */}
        <div className="perfil-seccion">
          <div className="perfil-seccion-title font-syne" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Alertas & Sonido
          </div>
          <SonidoToggle />
          <VibracionToggle />
        </div>

        {/* Cuenta */}
        <div className="perfil-seccion" style={{ marginTop: 12 }}>
          <SettingRow
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            }
            label="Cerrar sesión"
            onClick={handleCerrarSesion}
            danger
          />
        </div>
      </div>

      {/* ─── MODAL EDITAR PERFIL DE INGENIERO ─── */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 440,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 className="font-syne" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
                  Editar Perfil Técnico
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                    Teléfono Móvil
                  </label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                    Especialidad / Cargo en Taller
                  </label>
                  <input
                    type="text"
                    value={editEspecialidad}
                    onChange={(e) => setEditEspecialidad(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'transparent',
                    color: '#F8FAFC',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL REPORTES Y AUDITORÍA DE FLOTA ─── */}
      <AnimatePresence>
        {showReportesModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 520,
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingUp size={22} color="#3B82F6" />
                  <div>
                    <h3 className="font-syne" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#F8FAFC' }}>
                      Reportes de Flota & Rendimiento
                    </h3>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>Indicadores de eficiencia mecánica y costos</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportesModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* KPIs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>MTTR (Tiempo Reparación)</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
                    {store.stats?.mttrMinutos || 45} min
                  </div>
                  <div style={{ fontSize: 10, color: '#10B981', marginTop: 2 }}>Dentro del objetivo estándar</div>
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Costo Mantenimiento Mes</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
                    C$ {(store.stats?.costoMantenimientoMes || 0).toLocaleString('es-NI')}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Repuestos + Mano de obra</div>
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Preventivo vs Correctivo</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#3B82F6', marginTop: 4 }}>
                    {store.stats?.preventivoPct ?? 70}% / {store.stats?.correctivoPct ?? 30}%
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Ratio de salud de flota</div>
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Motos Disponibles / Total</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
                    {store.stats?.disponibles || 0} / {store.stats?.totalMotos || store.motos?.length || 0}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Motos operativas al 100%</div>
                </div>
              </div>

              {/* Categorías más atendidas */}
              <div style={{ padding: 14, borderRadius: 14, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
                  Componentes con Mayor Frecuencia de Servicio
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Cambio de Aceite y Filtros</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>45% de órdenes</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Pastillas y Ajuste de Frenos</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>25% de órdenes</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Kit de Arrastre y Cadena</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>18% de órdenes</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Neumáticos y Llantas</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>12% de órdenes</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleExportReport}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#3B82F6',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={15} /> Exportar JSON
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportesModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'transparent',
                    color: '#F8FAFC',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL MANUAL DE PROCEDIMIENTOS & NORMAS DE TALLER ─── */}
      <AnimatePresence>
        {showManualModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 520,
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BookOpen size={22} color="#3B82F6" />
                  <div>
                    <h3 className="font-syne" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#F8FAFC' }}>
                      Manual Técnico de Mantenimiento
                    </h3>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>Protocolos oficiales Honda Wave 110 & Yamaha YBR 125</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: 4 }}>1. Intervalos de Servicio Preventivo</strong>
                  • <strong>Cada 3,000 km:</strong> Cambio de aceite de motor (10W-40 / 20W-50 1L) y limpieza de filtro.<br />
                  • <strong>Cada 6,000 km:</strong> Reemplazo de bujía (CR7HSA) y calibración de holgura de válvulas.<br />
                  • <strong>Cada 8,000 km:</strong> Inspección y cambio de pastillas/zapatas de frenos.<br />
                  • <strong>Cada 15,000 km:</strong> Reemplazo de kit de arrastre completo (cadena 428H, piñón y corona).
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: 4 }}>2. Presión de Neumáticos</strong>
                  • Delantera: 28 PSI (en frío)<br />
                  • Trasera (con carga de delivery): 33 - 35 PSI
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: 4 }}>3. Protocolo de Inspección de Seguridad</strong>
                  Antes de marcar una moto como <strong>DISPONIBLE</strong> tras mantenimiento, el mecánico debe verificar: frenado en ambas ruedas, holgura de cadena (20-30mm), luces altas/bajas/stop y ausencia de fugas.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                style={{
                  width: '100%',
                  marginTop: 18,
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#3B82F6',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ height: 100 }} />
    </div>
  );
}
