'use client';
import React, { Component } from 'react';
import dynamic from 'next/dynamic';

const DashboardShell = dynamic(() => import('@/components/dashboard/DashboardShell'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--lf-bg-base, #f8f9fa)', color: 'var(--lf-text-muted, #6B7280)',
      fontFamily: "'DM Sans', sans-serif", gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8, background: 'var(--lf-accent, #FF6600)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 14, color: '#fff',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>LF</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>Cargando dashboard...</div>
    </div>
  ),
});

interface DashboardErrorBoundaryProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DashboardErrorBoundary extends Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Dashboard Error Boundary]', error, errorInfo);
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
          height: '100vh', background: 'var(--lf-bg-base, #f8f9fa)',
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
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)', margin: 0 }}>
            Error en el Dashboard
          </h2>
          <p style={{ fontSize: 14, color: 'var(--lf-text-muted, #6B7280)', maxWidth: 420, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            Ocurrió un problema al cargar el dashboard. Esto puede deberse a un módulo que no se pudo inicializar correctamente.
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
                background: 'var(--lf-accent, #FF6600)', color: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 12px rgba(255,102,0,0.3)', transition: 'all 0.2s',
              }}
            >
              Reintentar
            </button>
            <button
              onClick={this.props.onLogout}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)',
                background: 'var(--lf-surface, #fff)', color: 'var(--lf-text-main, #1a1a2e)',
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

export default function Dashboard(props: { isDark: boolean; toggleTheme: () => void; onLogout: () => void }) {
  return (
    <DashboardErrorBoundary isDark={props.isDark} toggleTheme={props.toggleTheme} onLogout={props.onLogout}>
      <DashboardShell {...props} />
    </DashboardErrorBoundary>
  );
}
