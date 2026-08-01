'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ClientInicio = dynamic(() => import('@/components/client/ClientInicio'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" message="Cargando inicio de cliente..." />,
});

export default function ClienteInicioPage() {
  return (
    <ClientInicio
      isDark={true}
      userName="Cliente"
      onNavigate={() => {}}
      onOpenTracking={() => {}}
      onOpenChat={() => {}}
    />
  );
}
