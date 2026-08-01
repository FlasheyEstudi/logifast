'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ModuleMarketing = dynamic(() => import('@/components/dashboard/ModuleMarketing'), {
  ssr: false,
  loading: () => <RoleLoader role="admin" message="Cargando marketing y banners..." />,
});

export default function MarketingPage() {
  return <ModuleMarketing />;
}
