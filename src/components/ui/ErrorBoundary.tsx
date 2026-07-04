'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  nombre: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary: ${this.props.nombre}]`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 20,
          background: 'var(--lf-surface, #fff)',
          border: '1.5px solid var(--lf-danger, #FF1744)',
          borderRadius: 16,
          margin: '20px 0',
          textAlign: 'center',
          fontFamily: "'DM Sans', sans-serif"
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
            Error al cargar {this.props.nombre}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
            {this.state.error?.message || 'Ocurrió un error inesperado.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="lf-btn lf-btn-primary lf-btn-sm"
            style={{ minHeight: 'auto', padding: '8px 16px', borderRadius: 10, fontSize: 13 }}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
