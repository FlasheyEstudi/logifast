'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleOverview = dynamic(() => import('@/components/dashboard/ModuleOverview'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando resumen de control..." />,
});

export default function DashboardOverviewPage() {
  return <ModuleOverview isDark={true} />;
}
