'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleDespacho = dynamic(() => import('@/components/dashboard/ModuleDespacho'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando torre de despacho..." />,
});

export default function DespachoPage() {
  return <ModuleDespacho />;
}
