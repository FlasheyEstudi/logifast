'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface PerfilSeguridadProps {
  onLogout: () => void;
}

/**
 * Bloque de seguridad compartido por los perfiles de cliente y repartidor:
 * cambio de contraseña (API existente), toggle Huella/Face ID (WebAuthn) y
 * cierre de sesión rápido. Preferencia biométrica en localStorage: biometric_enabled.
 */
export default function PerfilSeguridad({ onLogout }: PerfilSeguridadProps) {
  const [bioDisp, setBioDisp] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const disp = typeof window.PublicKeyCredential !== 'undefined';
    setBioDisp(disp);
    setBioOn(localStorage.getItem('biometric_enabled') === '1');
  }, []);

  const toggleBio = useCallback(
    async (activar: boolean) => {
      setMsg(null);
      if (!activar) {
        localStorage.removeItem('biometric_enabled');
        setBioOn(false);
        return;
      }
      try {
        if (typeof window.PublicKeyCredential === 'undefined') {
          throw new Error('Este dispositivo no soporta huella / Face ID.');
        }
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        localStorage.setItem('biometric_enabled', '1');
        setBioOn(true);
        setMsg({ tipo: 'ok', texto: 'Huella / Face ID activado para este dispositivo.' });
      } catch (e) {
        setMsg({
          tipo: 'error',
          texto: e instanceof Error ? e.message : 'No disponible en este dispositivo.',
        });
      }
    },
    []
  );

  const cambiarPass = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMsg(null);
      if (nueva.length < 6) {
        setMsg({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        return;
      }
      if (nueva !== confirmar) {
        setMsg({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
        return;
      }
      setCargando(true);
      try {
        const r = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: actual, newPassword: nueva }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'No se pudo cambiar la contraseña.');
        setMsg({ tipo: 'ok', texto: 'Contraseña actualizada correctamente.' });
        setActual('');
        setNueva('');
        setConfirmar('');
        setFormOpen(false);
      } catch (err) {
        setMsg({
          tipo: 'error',
          texto: err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.',
        });
      } finally {
        setCargando(false);
      }
    },
    [actual, nueva, confirmar]
  );

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 10,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Seguridad
      </div>

      {/* Huella / Face ID */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 'var(--lf-card-radius, 16px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Huella / Face ID
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 2,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {bioDisp ? 'Desbloquea la app con tu biometría' : 'No disponible en este dispositivo'}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={bioOn}
          aria-label="Activar Huella / Face ID"
          onClick={() => toggleBio(!bioOn)}
          style={{
            width: 48,
            height: 28,
            borderRadius: 99,
            border: 'none',
            cursor: 'pointer',
            background: bioOn ? 'var(--primario)' : 'var(--text-muted)',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: bioOn ? 23 : 3,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>

      {/* Cambiar contraseña */}
      <button
        type="button"
        onClick={() => setFormOpen((p) => !p)}
        style={{
          width: '100%',
          marginTop: 10,
          padding: '12px 16px',
          borderRadius: 'var(--lf-card-radius, 16px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Cambiar contraseña</span>
        <span style={{ color: 'var(--text-muted)' }}>{formOpen ? '−' : '+'}</span>
      </button>

      {formOpen && (
        <form
          onSubmit={cambiarPass}
          style={{
            marginTop: 10,
            padding: '14px 16px',
            borderRadius: 'var(--lf-card-radius, 16px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <input
            type="password"
            className="lf-input"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder="Contraseña actual"
            required
          />
          <input
            type="password"
            className="lf-input"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="Nueva contraseña (mín. 6)"
            required
          />
          <input
            type="password"
            className="lf-input"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Confirmar nueva contraseña"
            required
          />
          <button
            type="submit"
            disabled={cargando}
            style={{
              minHeight: 44,
              borderRadius: 'var(--lf-button-radius, 14px)',
              border: 'none',
              background: 'var(--primario)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: cargando ? 'wait' : 'pointer',
              opacity: cargando ? 0.7 : 1,
            }}
          >
            {cargando ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </form>
      )}

      {msg && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            fontWeight: 600,
            color: msg.tipo === 'ok' ? 'var(--exito)' : 'var(--peligro)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {msg.texto}
        </div>
      )}
    </div>
  );
}
