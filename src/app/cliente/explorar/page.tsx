'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ClientExplorar = dynamic(() => import('@/components/client/ClientExplorar'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" message="Cargando catálogo de tiendas..." />,
});

export default function ClienteExplorarPage() {
  return (
    <ClientExplorar
      isDark={true}
      userName="Cliente"
      onNavigate={() => {}}
      onOpenTracking={() => {}}
      onOpenChat={() => {}}
    />
  );
}
