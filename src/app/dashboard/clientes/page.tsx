'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleClientes = dynamic(() => import('@/components/dashboard/ModuleClientes'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando directorio de clientes..." />,
});

export default function ClientesPage() {
  return <ModuleClientes />;
}
