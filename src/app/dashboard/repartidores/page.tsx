'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleRepartidores = dynamic(() => import('@/components/dashboard/ModuleRepartidores'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando flota de repartidores..." />,
});

export default function RepartidoresPage() {
  return <ModuleRepartidores />;
}
