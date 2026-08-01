'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleIncidencias = dynamic(() => import('@/components/dashboard/ModuleIncidencias'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando incidencias operativas..." />,
});

export default function IncidenciasPage() {
  return <ModuleIncidencias />;
}
