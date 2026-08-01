'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleFlota = dynamic(() => import('@/components/dashboard/ModuleFlota'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando estado de la flota vehicular..." />,
});

export default function FlotaPage() {
  return <ModuleFlota isDark={true} />;
}
