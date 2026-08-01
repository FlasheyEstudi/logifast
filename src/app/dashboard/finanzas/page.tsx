'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleFinanzas = dynamic(() => import('@/components/dashboard/ModuleFinanzas'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando finanzas y conciliación..." />,
});

export default function FinanzasPage() {
  return <ModuleFinanzas />;
}
