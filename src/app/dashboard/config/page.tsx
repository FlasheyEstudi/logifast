'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleConfig = dynamic(() => import('@/components/dashboard/ModuleConfig'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando configuración del sistema..." />,
});

export default function ConfigPage() {
  return <ModuleConfig />;
}
