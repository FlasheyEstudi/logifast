// components/ingeniero/PerfilIngeniero.tsx
'use client';

import React from 'react';
import SettingRow from '@/components/ui/SettingRow';
import { SonidoToggle } from '@/components/ui/SonidoToggle';
import VibracionToggle from '@/components/ui/VibracionToggle';
import { TemaToggle } from '@/components/ui/TemaToggle';
import { useIngenieroStore } from '@/store/ingenieroStore';
import { useConfigStore } from '@/store/configStore';
import { realtime } from '@/services/realtime';
import { useRouter } from 'next/navigation';

interface PerfilIngenieroProps {
  onLogout: () => void;
  userName: string;
}

export default function PerfilIngeniero({ onLogout, userName }: PerfilIngenieroProps) {
  const store = useIngenieroStore();
  const config = useConfigStore();
  const router = useRouter();

  const handleCerrarSesion = () => {
    realtime.disconnect();
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    if (typeof onLogout === 'function') {
      onLogout();
    }
    router.push('/login');
  };

  const handleInventario = () => {
    store.toggleInventario();
  };

  return (
    <div className="perfil-ingeniero" style={{ padding: '0 20px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="perfil-cliente-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
        <div
          className="perfil-cliente-avatar"
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #1B1B2F, #3949AB)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            marginBottom: 12,
            boxShadow: 'var(--md-elevation-2)'
          }}
        >
          <span>{(userName || store.perfil?.nombre || 'Ingeniero').split(' ').map(n => n[0] || '').join('')}</span>
        </div>
        <div className="perfil-cliente-nombre font-syne" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
          {userName || store.perfil?.nombre}
        </div>
        <div className="perfil-cliente-email" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {store.perfil?.email}
        </div>
        <div style={{ marginTop: 8 }}>
          <span
            className="perfil-rol-badge"
            style={{
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(41, 121, 255, 0.1)',
              color: '#2979FF',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            {store.perfil?.rol}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div
        className="perfil-cliente-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
          marginBottom: 24
        }}
      >
        <div
          className="perfil-cliente-stat"
          style={{
            padding: 12,
            borderRadius: 16,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline-variant)',
            textAlign: 'center'
          }}
        >
          <div className="perfil-cliente-stat-value mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            {store.stats?.totalMotos || 0}
          </div>
          <div className="perfil-cliente-stat-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Motos
          </div>
        </div>
        <div
          className="perfil-cliente-stat"
          style={{
            padding: 12,
            borderRadius: 16,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline-variant)',
            textAlign: 'center'
          }}
        >
          <div className="perfil-cliente-stat-value mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            {store.stats?.mantenimientosCompletados || 0}
          </div>
          <div className="perfil-cliente-stat-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Mant.
          </div>
        </div>
        <div
          className="perfil-cliente-stat"
          style={{
            padding: 12,
            borderRadius: 16,
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline-variant)',
            textAlign: 'center'
          }}
        >
          <div className="perfil-cliente-stat-value mono" style={{ fontSize: 20, fontWeight: 700, color: '#FFB300' }}>
            {store.stats?.alertasActivas || 0}
          </div>
          <div className="perfil-cliente-stat-label" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Alertas
          </div>
        </div>
      </div>

      {/* Secciones */}
      <div className="perfil-cliente-secciones" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Apariencia */}
        <div className="perfil-seccion">
          <div className="perfil-seccion-title font-syne" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Apariencia
          </div>
          <TemaToggle />
        </div>

        {/* Notificaciones */}
        <div className="perfil-seccion">
          <div className="perfil-seccion-title font-syne" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Configuración de alertas
          </div>
          <SonidoToggle />
          <VibracionToggle />
        </div>

        {/* Herramientas */}
        <div className="perfil-seccion">
          <div className="perfil-seccion-title font-syne" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Herramientas
          </div>

          <SettingRow
            icon = {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            }
            label="Inventario de repuestos"
            desc={`${store.repuestos.length} repuestos, ${store.stats?.repuestosBajoStock || 0} bajo stock`}
            trailing={
              <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            }
            onClick={handleInventario}
          />

          <SettingRow
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                <path d="M22 12A10 10 0 0 0 12 2v10z"/>
              </svg>
            }
            label="Reportes"
            desc="Costos, eficiencia y vida útil de flota"
            trailing={
              <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            }
            onClick={() => {}}
          />
        </div>

        {/* Cuenta */}
        <div className="perfil-seccion" style={{ marginTop: 12 }}>
          <SettingRow
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            }
            label="Cerrar sesión"
            onClick={handleCerrarSesion}
            danger
          />
        </div>
      </div>

      <div style={{ height: 100 }} />
    </div>
  );
}
