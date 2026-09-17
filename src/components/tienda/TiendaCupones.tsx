'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Tag } from '@/components/icons';
import { notify } from '@/lib/notify';

interface Cupon {
  id: string;
  codigo: string;
  tipoDescuento: string;
  valor: number;
  montoMinimo: number | null;
  descuentoMaximo: number | null;
  maxUsos: number;
  usosActuales: number;
  vigenciaFin: string;
  estado: string;
}

const money = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const campo: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  height: 44,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  padding: '0 12px',
  fontSize: 13,
  outline: 'none',
};

const etiqueta: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 4,
  display: 'block',
};

/**
 * #6 — Cupones propios de la tienda.
 *
 * Un cupón creado aquí **solo aplica a los productos de esta tienda**; lo impone el
 * motor único de validación, el mismo que usa el cobro real. Los cupones globales de
 * LogiFast siguen funcionando igual.
 */
export function TiendaCupones() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [creando, setCreando] = useState(false);

  const [codigo, setCodigo] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'fijo'>('porcentaje');
  const [valor, setValor] = useState('10');
  const [montoMinimo, setMontoMinimo] = useState('0');
  const [descuentoMaximo, setDescuentoMaximo] = useState('0');
  const [vigenciaDias, setVigenciaDias] = useState('30');
  const [maxUsos, setMaxUsos] = useState('0');

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/cupones');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setCupones(data.cupones || []);
    } catch {
      /* la lista se queda como estaba */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch('/api/tienda/cupones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          tipoDescuento,
          valor: Number(valor),
          montoMinimo: Number(montoMinimo),
          descuentoMaximo: Number(descuentoMaximo),
          vigenciaDias: Number(vigenciaDias),
          maxUsos: Number(maxUsos),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        notify.error(data.error || 'No se pudo crear el cupón');
        return;
      }
      notify.success(`Cupón ${data.cupon.codigo} creado`);
      setCodigo('');
      setCreando(false);
      await cargar();
    } catch {
      notify.error('Error de red al crear el cupón');
    } finally {
      setGuardando(false);
    }
  };

  const panel: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 20,
  };

  return (
    <div style={panel}>
      <div className="flex flex-wrap items-center gap-3">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={17} /> Cupones de mi tienda
        </h3>
        <button
          type="button"
          onClick={() => setCreando((v) => !v)}
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 44,
            padding: '0 16px',
            borderRadius: 10,
            border: 'none',
            background: '#0066FF',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} /> {creando ? 'Cancelar' : 'Nuevo cupón'}
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
        Solo aplican a los productos de tu tienda. Los cupones globales de LogiFast siguen vigentes.
      </p>

      {creando && (
        <form onSubmit={crear} className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 14 }}>
          <div>
            <label style={etiqueta}>Código</label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
              placeholder="EJ. VERANO20"
              style={campo}
              required
            />
          </div>
          <div>
            <label style={etiqueta}>Tipo</label>
            <select value={tipoDescuento} onChange={(e) => setTipoDescuento(e.target.value as 'porcentaje' | 'fijo')} style={campo}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="fijo">Monto fijo (C$)</option>
            </select>
          </div>
          <div>
            <label style={etiqueta}>{tipoDescuento === 'porcentaje' ? 'Descuento (%)' : 'Descuento (C$)'}</label>
            <input type="number" min="1" value={valor} onChange={(e) => setValor(e.target.value)} style={campo} required />
          </div>
          <div>
            <label style={etiqueta}>Compra mínima (C$, 0 = sin mínimo)</label>
            <input type="number" min="0" value={montoMinimo} onChange={(e) => setMontoMinimo(e.target.value)} style={campo} />
          </div>
          <div>
            <label style={etiqueta}>Tope de descuento (C$, 0 = sin tope)</label>
            <input type="number" min="0" value={descuentoMaximo} onChange={(e) => setDescuentoMaximo(e.target.value)} style={campo} />
          </div>
          <div>
            <label style={etiqueta}>Vigencia (días)</label>
            <input type="number" min="1" value={vigenciaDias} onChange={(e) => setVigenciaDias(e.target.value)} style={campo} />
          </div>
          <div>
            <label style={etiqueta}>Usos máximos (0 = ilimitado)</label>
            <input type="number" min="0" value={maxUsos} onChange={(e) => setMaxUsos(e.target.value)} style={campo} />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={guardando}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                border: 'none',
                background: guardando ? 'var(--bg-alt)' : '#22C55E',
                color: guardando ? 'var(--text-muted)' : '#06240F',
                fontWeight: 800,
                fontSize: 13,
                cursor: guardando ? 'wait' : 'pointer',
              }}
            >
              {guardando ? 'Creando…' : 'Crear cupón'}
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando cupones…</div>
        ) : cupones.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Todavía no tienes cupones propios. Crea uno para atraer clientes con un descuento que solo aplica en tu tienda.
          </div>
        ) : (
          cupones.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-3"
              style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}
            >
              <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: 13.5 }}>{c.codigo}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#22C55E' }}>
                {c.tipoDescuento === 'porcentaje' ? `${c.valor}%` : money(c.valor)}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {c.montoMinimo ? `mínimo ${money(c.montoMinimo)}` : 'sin mínimo'} · usos {c.usosActuales}
                {c.maxUsos > 0 ? `/${c.maxUsos}` : ''} · vence {new Date(c.vigenciaFin).toLocaleDateString('es-NI')}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 700,
                  color: c.estado === 'activo' ? '#22C55E' : 'var(--text-muted)',
                }}
              >
                {c.estado.toUpperCase()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TiendaCupones;
