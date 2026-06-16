'use client';

import React, { Component } from 'react';
import RepartidorShell from './RepartidorShell';

interface RepartidorErrorBoundaryProps {
  onGoHome: () => void;
  children: React.ReactNode;
}

interface RepartidorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RepartidorErrorBoundary extends Component<RepartidorErrorBoundaryProps, RepartidorErrorBoundaryState> {
  constructor(props: RepartidorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Repartidor App Error Boundary]', error, errorInfo);
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
            Error al cargar repartidor
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 420, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            Ocurrió un problema al inicializar la vista de repartidor. Puedes intentar de nuevo o volver a la pantalla principal.
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

interface RepartidorAppProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
}

/**
 * Thin wrapper around RepartidorShell.
 * Wraps the application with an ErrorBoundary to prevent Leaflet/runtime issues from crashing Next.js.
 */
export default function RepartidorApp({ isDark, toggleTheme, onLogout }: RepartidorAppProps) {
  return (
    <RepartidorErrorBoundary onGoHome={onLogout}>
      <RepartidorShell
        isDark={isDark}
        toggleTheme={toggleTheme}
        onLogout={onLogout}
        userName="Carlos Mendoza"
      />
    </RepartidorErrorBoundary>
  );
}
