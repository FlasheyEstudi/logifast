'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ClientSolicitar = dynamic(() => import('@/components/client/ClientSolicitar'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" message="Cargando envío express..." />,
});

export default function ClienteSolicitarPage() {
  return (
    <ClientSolicitar
      isDark={true}
      userName="Cliente"
      onNavigate={() => {}}
    />
  );
}
