'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { initCapacitorAndroid } from '@/lib/capacitor-android';
import { RoleLoader } from '@/components/ui/loaders';
import AuthRedesign from '@/components/auth/AuthRedesign';

const ClientDashboard = dynamic(() => import('@/app/client-dashboard'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" />,
});

export default function ClienteAppPage() {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // 1. Inicializar plugins nativos de Android (StatusBar, SplashScreen, BackButton)
    initCapacitorAndroid({
      hasOpenModal: () => false,
      closeActiveModal: () => {},
    });

    // 2. Verificar si ya hay una sesión activa de cliente
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user && (data.user.role === 'cliente' || data.user.role === 'admin')) {
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
    return <RoleLoader role="cliente" />;
  }

  // Si ya está autenticado, renderizar la app completa del cliente con todos sus módulos
  if (sessionUser) {
    return (
      <ClientDashboard
        isDark={isDark}
        toggleTheme={() => setIsDark((prev) => !prev)}
        onLogout={handleLogout}
        userName={sessionUser.name}
      />
    );
  }

  // Si no está autenticado, renderizar el sistema completo de Auth con todos los campos de BD
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <AuthRedesign
        fixedRole="cliente"
        onLoginSuccess={(role, name) => {
          setSessionUser({ name, role });
        }}
      />
    </div>
  );
}
