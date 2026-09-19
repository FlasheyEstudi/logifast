'use client';

import React, { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, LogOut, FileText, Camera } from '@/components/icons';
import { TemaToggle } from '@/components/ui/TemaToggle';
import { SonidoToggle } from '@/components/ui/SonidoToggle';
import PerfilSeguridad from '@/components/seguridad/PerfilSeguridad';

interface ConfiguracionViewProps {
  onClose: () => void;
  onLogout: () => void;
  onVerFactura: () => void;
}

/** Vista de Configuración dentro del shell del cliente (sin recargar la página). */
export default function ConfiguracionView({ onClose, onLogout, onVerFactura }: ConfiguracionViewProps) {
  const [borrando, setBorrando] = useState(false);
  const [passEliminar, setPassEliminar] = useState('');
  const [eliminarAbierto, setEliminarAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminarCuenta = useCallback(async () => {
    setBorrando(true);
    setError(null);
    try {
      const r = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passEliminar }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.error) throw new Error(d.error || 'No se pudo eliminar la cuenta');
      localStorage.clear();
      window.location.href = '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta');
    } finally {
      setBorrando(false);
    }
  }, [passEliminar]);

  const fila = (label: string, onClick: () => void, icon?: React.ReactNode, peligro = false) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 44,
        padding: '12px 16px',
        borderRadius: 'var(--lf-card-radius, 16px)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: peligro ? 'var(--peligro)' : 'var(--text)',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{icon}{label}</span>
      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
    </button>
  );

  return (
    <div className="w-full min-h-full flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <button onClick={onClose} aria-label="Volver" className="w-11 h-11 rounded-full bg-[var(--bg-alt)] text-[var(--text)] flex items-center justify-center cursor-pointer shrink-0">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-syne text-base font-bold m-0">Configuración</h1>
      </div>

      <div className="w-full px-4 py-4 flex flex-col gap-3" style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 40 }}>
        <div className="rounded-[var(--lf-card-radius,16px)] bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-sm font-bold text-[var(--text)] mb-2">Tema</div>
          <TemaToggle />
        </div>

        <div className="rounded-[var(--lf-card-radius,16px)] bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-sm font-bold text-[var(--text)] mb-2">Sonido</div>
          <SonidoToggle />
        </div>

        <PerfilSeguridad onLogout={onLogout} />

        {fila('Ver mi factura', onVerFactura, <FileText size={15} style={{ color: 'var(--primario)' }} />)}
        {fila('Lector de barras (POS)', () => {
          const esApp = !!(window as any).Capacitor?.isNativePlatform?.();
          window.location.href = esApp ? '/escaner.html' : '/escaner';
        }, <Camera size={15} style={{ color: 'var(--primario)' }} />)}
        {fila('Eliminar cuenta', () => { setEliminarAbierto(true); setError(null); }, <Trash2 size={15} style={{ color: 'var(--peligro)' }} />, true)}
        {fila('Cerrar sesión', onLogout, <LogOut size={15} style={{ color: 'var(--peligro)' }} />, true)}
      </div>

      {eliminarAbierto && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEliminarAbierto(false)}>
          <div className="w-full max-w-sm bg-[var(--surface)] rounded-[var(--lf-card-radius,22px)] border border-[var(--border)] p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-syne text-base font-bold text-[var(--text)] m-0">Eliminar cuenta</h3>
            <p className="text-sm text-[var(--text-muted)] m-0">Esta acción es irreversible. Se eliminarán todos tus datos.</p>
            <input type="password" className="lf-input" value={passEliminar} onChange={(e) => setPassEliminar(e.target.value)} placeholder="Tu contraseña para confirmar" />
            {error && <span className="text-xs text-[var(--peligro)]">{error}</span>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEliminarAbierto(false)} className="h-11 px-4 rounded-full border border-[var(--border)] bg-transparent text-[var(--text-muted)] text-sm font-bold cursor-pointer">Cancelar</button>
              <button onClick={eliminarCuenta} disabled={!passEliminar || borrando} className="h-11 px-4 rounded-full bg-[var(--peligro)] text-white text-sm font-bold cursor-pointer disabled:opacity-50">
                {borrando ? 'Eliminando…' : 'Eliminar permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
