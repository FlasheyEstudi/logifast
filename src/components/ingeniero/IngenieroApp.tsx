// components/ingeniero/IngenieroApp.tsx
'use client';

import React, { lazy, Suspense, useEffect } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useIngenieroStore } from '@/store/ingenieroStore';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { DashboardSkeleton, FlotaSkeleton, MantenimientosSkeleton, PerfilSkeleton } from './Skeletons';
import CrearMantenimiento from './CrearMantenimiento';
import Inventario from './Inventario';

const Dashboard = lazy(() => import('./Dashboard'));
const Flota = lazy(() => import('./Flota'));
const Mantenimientos = lazy(() => import('./Mantenimientos'));
const PerfilIngeniero = lazy(() => import('./PerfilIngeniero'));

type TabId = 'dashboard' | 'flota' | 'mantenimientos' | 'perfil';

const TABS = [
  { id: 'dashboard' as TabId, label: 'Dashboard' },
  { id: 'flota' as TabId, label: 'Flota' },
  { id: 'mantenimientos' as TabId, label: 'Mantenimientos' },
  { id: 'perfil' as TabId, label: 'Perfil' }
];

interface IngenieroAppProps {
  onLogout: () => void;
  userName: string;
}

export default function IngenieroApp({ onLogout, userName }: IngenieroAppProps) {
  const store = useIngenieroStore();
  const device = useDeviceInfo();

  // Cargar datos reales al montar
  useEffect(() => {
    store.cargarDatos();
  }, []);


  const getTabIcon = (id: TabId, active: boolean) => {
    const color = active ? 'var(--lf-primario, #FF5722)' : 'currentColor';
    const sw = active ? 2.5 : 2;

    switch (id) {
      case 'dashboard':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}>
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        );
      case 'flota':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}>
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3.5-3.5 2-2.5L14 12h4l2 3.5"/>
          </svg>
        );
      case 'mantenimientos':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        );
      case 'perfil':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        );
    }
  };

  return (
    <div className="ingeniero-app">
      <div className="ingeniero-content">
        <ErrorBoundary nombre="Dashboard">
          <Suspense fallback={<DashboardSkeleton />}>
            {store.tabActiva === 'dashboard' && <Dashboard />}
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary nombre="Flota">
          <Suspense fallback={<FlotaSkeleton />}>
            {store.tabActiva === 'flota' && <Flota />}
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary nombre="Mantenimientos">
          <Suspense fallback={<MantenimientosSkeleton />}>
            {store.tabActiva === 'mantenimientos' && <Mantenimientos />}
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary nombre="Perfil">
          <Suspense fallback={<PerfilSkeleton />}>
            {store.tabActiva === 'perfil' && <PerfilIngeniero onLogout={onLogout} userName={userName} />}
          </Suspense>
        </ErrorBoundary>
      </div>

      <nav className="ingeniero-nav">
        {TABS.map(tab => {
          const activo = store.tabActiva === tab.id;
          const badge = tab.id === 'flota' && store.stats.alertasActivas > 0
            ? store.stats.alertasActivas
            : tab.id === 'mantenimientos' && store.stats.mantenimientosPendientes > 0
              ? store.stats.mantenimientosPendientes
              : null;

          return (
            <button
              key={tab.id}
              className={`ingeniero-nav-item ${activo ? 'active' : ''}`}
              onClick={() => store.setTabActiva(tab.id)}
            >
              <div className="ingeniero-nav-icon">
                {getTabIcon(tab.id, activo)}
                {badge !== null && badge > 0 && <span className="ingeniero-nav-badge">{badge}</span>}
              </div>
              <span className="ingeniero-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Auxiliar Modals / Screens */}
      <CrearMantenimiento />
      <Inventario />
    </div>
  );
}
