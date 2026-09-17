'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Star } from '@/components/icons';
import { notify } from '@/lib/notify';

interface Beneficio {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  valor: string | null;
  condiciones: string | null;
  vigenciaFin: string | null;
  tienda: { nombre: string; logoIniciales: string; logoColor: string; direccion: string };
  canjeado: boolean;
  canjeadoEn: string | null;
}

/**
 * #9 — Beneficios de los comercios aliados para el repartidor.
 * Se canjean desde aquí y el canje queda registrado para el comercio.
 */
export function RepartidorBeneficios() {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [canjeando, setCanjeando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/repartidor/beneficios');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setBeneficios(data.beneficios || []);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const canjear = async (b: Beneficio) => {
    setCanjeando(b.id);
    try {
      const res = await fetch('/api/repartidor/beneficios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficioId: b.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        notify.error(data.error || 'No se pudo canjear');
        return;
      }
      notify.success(`Canje registrado: ${b.titulo}`);
      await cargar();
    } finally {
      setCanjeando(null);
    }
  };

  if (!cargando && beneficios.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--ios-surface, var(--surface))',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Star size={17} /> Beneficios de comercios aliados
      </h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
        Beneficios que las tiendas aliadas dan a los repartidores. Al canjearlos queda el registro para la tienda.
      </p>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cargando ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando beneficios…</div>
        ) : (
          beneficios.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-3"
              style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: b.tienda.logoColor || '#FF5722',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 12.5,
                  flex: '0 0 auto',
                }}
              >
                {b.tienda.logoIniciales || '??'}
              </span>
              <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{b.titulo}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {b.tienda.nombre}
                  {b.valor ? ` · ${b.valor}` : ''}
                  {b.descripcion ? ` · ${b.descripcion}` : ''}
                </div>
              </div>
              {b.canjeado ? (
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#22C55E' }}>
                  CANJEADO {b.canjeadoEn ? new Date(b.canjeadoEn).toLocaleDateString('es-NI') : ''}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => canjear(b)}
                  disabled={canjeando === b.id}
                  style={{
                    height: 44,
                    padding: '0 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: canjeando === b.id ? 'var(--bg-alt)' : '#22C55E',
                    color: canjeando === b.id ? 'var(--text-muted)' : '#06240F',
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  {canjeando === b.id ? 'Canjeando…' : 'Canjear'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RepartidorBeneficios;
