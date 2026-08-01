'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleReportes = dynamic(() => import('@/components/dashboard/ModuleReportes'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando reportes y analítica..." />,
});

export default function ReportesPage() {
  return <ModuleReportes />;
}
