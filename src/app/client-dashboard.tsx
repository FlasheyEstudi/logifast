'use client';
import React, { Component } from 'react';
import dynamic from 'next/dynamic';

const ClientShell = dynamic(() => import('@/components/client/ClientShell'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg, #FAF8F5)', color: 'var(--text-muted, #8E8EA0)',
      fontFamily: "'DM Sans', sans-serif", gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8, background: 'var(--primario, #FF5722)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: '#fff',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>LF</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>Cargando...</div>
    </div>
  ),
});

interface ClientErrorBoundaryProps {
  onGoHome: () => void;
  children: React.ReactNode;
}

interface ClientErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ClientErrorBoundary extends Component<ClientErrorBoundaryProps, ClientErrorBoundaryState> {
  constructor(props: ClientErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Client Dashboard Error Boundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Error desconocido';
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: 'var(--bg, #FAF8F5)',
          fontFamily: "'DM Sans', sans-serif", padding: 24, gap: 20,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: 'rgba(220,38,38,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text, #1B1B2F)', margin: 0 }}>
            Error al cargar
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 420, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            Ocurrió un problema al cargar la aplicación. Puedes reintentar o volver al inicio.
          </p>
          <div style={{
            padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.12)', maxWidth: 500, width: '100%',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#DC2626',
            wordBreak: 'break-word' as const, overflow: 'auto', maxHeight: 120,
          }}>
            {errorMessage}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#FF5722', color: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 12px rgba(255,87,34,0.3)', transition: 'all 0.2s',
              }}
            >
              Reintentar
            </button>
            <button
              onClick={this.props.onGoHome}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid #e5e7eb',
                background: '#fff', color: '#1B1B2F',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ClientDashboard(props: { isDark: boolean; toggleTheme: () => void; onLogout: () => void; userName: string }) {
  return (
    <ClientErrorBoundary onGoHome={props.onLogout}>
      <ClientShell {...props} />
    </ClientErrorBoundary>
  );
}
