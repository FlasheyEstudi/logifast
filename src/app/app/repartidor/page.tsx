'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { initCapacitorAndroid } from '@/lib/capacitor-android';
import { RoleLoader } from '@/components/ui/loaders';
import AuthRedesign from '@/components/auth/AuthRedesign';

const RepartidorApp = dynamic(() => import('@/components/repartidor/RepartidorApp'), {
  ssr: false,
  loading: () => <RoleLoader role="repartidor" />,
});

export default function RepartidorAppPage() {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // 1. Inicializar plugins nativos de Android para Repartidores (Background GPS, Channels, BackButton)
    initCapacitorAndroid({
      hasOpenModal: () => false,
      closeActiveModal: () => {},
    });

    // 2. Verificar si ya hay una sesión activa de repartidor
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user && (data.user.role === 'repartidor' || data.user.role === 'admin')) {
          setSessionUser(data.user);
        }
      })
      .catch(() => null)
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setSessionUser(null);
  };

  if (checkingSession) {
    return <RoleLoader role="repartidor" />;
  }

  // Si ya está autenticado como repartidor, renderizar la app completa del repartidor
  if (sessionUser) {
    return (
      <RepartidorApp
        isDark={isDark}
        toggleTheme={() => setIsDark((prev) => !prev)}
        onLogout={handleLogout}
      />
    );
  }

  // Si no está autenticado, renderizar el sistema completo de Auth para Repartidores
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <AuthRedesign
        fixedRole="repartidor"
        onLoginSuccess={(role, name) => {
          setSessionUser({ name, role });
        }}
      />
    </div>
  );
}
