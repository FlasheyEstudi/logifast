'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Plus, Trash2 } from '@/components/icons';
import { notify } from '@/lib/notify';
import { useMarketplaceStore } from '@/lib/marketplace-store';

interface Recurrente {
  id: string;
  tiendaNombre: string;
  diasSemana: string;
  hora: string;
  direccionEntrega: string;
  activo: boolean;
  proximaEjecucion: string;
  ultimaEjecucion: string | null;
  /** El cron ya avisó: esta ejecución espera CONFIRMAR o CANCELAR del cliente. */
  esperandoConfirmacion?: boolean;
  pendientePara?: string | null;
}

const DIAS = [
  { n: 1, l: 'L' },
  { n: 2, l: 'M' },
  { n: 3, l: 'M' },
  { n: 4, l: 'J' },
  { n: 5, l: 'V' },
  { n: 6, l: 'S' },
  { n: 0, l: 'D' },
];

/**
 * #1 — Pedidos recurrentes del cliente.
 *
 * Programa el carrito actual para que se compre solo el día y la hora elegidos
 * (por ejemplo, de lunes a viernes a las 10:00). Se puede pausar y cancelar.
 */
export function ClientRecurrentes() {
  const cartItems = useMarketplaceStore((s) => s.cartItems);
  const [recurrentes, setRecurrentes] = useState<Recurrente[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [hora, setHora] = useState('10:00');
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const [direccion, setDireccion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/cliente/pedidos-recurrentes');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setRecurrentes(data.recurrentes || []);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alternarDia = (n: number) =>
    setDias((prev) => (prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n].sort()));

  const programar = async (e: React.FormEvent) => {
    e.preventDefault();
    const tiendaId = cartItems[0]?.tiendaId;
    if (!tiendaId) {
      notify.warning('Agrega productos al carrito para programar esa compra');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/cliente/pedidos-recurrentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiendaId,
          items: cartItems.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
          direccionEntrega: direccion || 'Retiro en tienda',
          metodoPago: 'efectivo',
          diasSemana: dias,
          hora,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        notify.error(data.error || 'No se pudo programar');
        return;
      }
      notify.success('Compra programada: se repetirá sola según los días elegidos');
      setAbierto(false);
      await cargar();
    } finally {
      setEnviando(false);
    }
  };

  const alternarActivo = async (r: Recurrente) => {
    const res = await fetch('/api/cliente/pedidos-recurrentes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, activo: !r.activo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      notify.error(data.error || 'No se pudo actualizar');
      return;
    }
    notify.success(r.activo ? 'Compra programada en pausa' : 'Compra programada reactivada');
    await cargar();
  };

  const cancelar = async (id: string) => {
    const res = await fetch(`/api/cliente/pedidos-recurrentes?id=${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      notify.error(data.error || 'No se pudo cancelar');
      return;
    }
    notify.success('Compra programada cancelada');
    await cargar();
  };

  /**
   * Responde a un aviso del cron: confirmar crea el pedido YA; cancelar salta esta
   * vez sin desactivar la programación. El pedido nunca se crea sin esta respuesta.
   */
  const responderEjecucion = async (id: string, accion: 'confirmar' | 'cancelar') => {
    setRespondiendo(id);
    try {
      const res = await fetch('/api/cliente/pedidos-recurrentes/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accion }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        notify.error(data.error || 'No se pudo procesar');
        return;
      }
      notify.success(
        accion === 'confirmar'
          ? 'Pedido generado. Ya está en la tienda.'
          : 'Se saltó esta vez. Tu programación sigue activa.'
      );
      await cargar();
    } finally {
      setRespondiendo(null);
    }
  };

  const campo: React.CSSProperties = {
    width: '100%',
    height: 44,
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    padding: '0 12px',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
      <div className="flex flex-wrap items-center gap-3">
        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={17} /> Compras programadas
        </h3>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
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
          <Plus size={15} /> {abierto ? 'Cancelar' : 'Programar compra'}
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
        Programa el carrito actual para que se compre solo el día y la hora que elijas.
      </p>

      {abierto && (
        <form onSubmit={programar} className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Días</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DIAS.map((d) => (
                <button
                  key={d.n}
                  type="button"
                  onClick={() => alternarDia(d.n)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: dias.includes(d.n) ? '#0066FF' : 'var(--bg-alt)',
                    color: dias.includes(d.n) ? '#FFFFFF' : 'var(--text)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Hora</div>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={campo} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              Lugar (vacío = retiro en tienda)
            </div>
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Col. Los Robles, Managua" style={campo} />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={enviando || dias.length === 0}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                border: 'none',
                background: enviando || dias.length === 0 ? 'var(--bg-alt)' : '#22C55E',
                color: enviando || dias.length === 0 ? 'var(--text-muted)' : '#06240F',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {enviando ? 'Programando…' : 'Guardar programación'}
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cargando ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando…</div>
        ) : recurrentes.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No tienes compras programadas.</div>
        ) : (
          recurrentes.map((r) => {
            let lista: number[] = [];
            try {
              const parsed = JSON.parse(r.diasSemana);
              lista = Array.isArray(parsed) ? parsed : [];
            } catch {
              lista = [];
            }
            const etiquetaDias = lista.length === 5 && [1, 2, 3, 4, 5].every((d) => lista.includes(d))
              ? 'lunes a viernes'
              : lista.map((n) => DIAS.find((d) => d.n === n)?.l ?? '').join(' ');
            return (
              <div
                key={r.id}
                style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg-alt)', border: r.esperandoConfirmacion ? '1px solid #F59E0B' : '1px solid var(--border)' }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {r.tiendaNombre} · {etiquetaDias || 'cada semana'} {r.hora}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {r.direccionEntrega} · {r.esperandoConfirmacion ? 'esperando tu confirmación' : 'próxima'}:{' '}
                      {new Date(r.esperandoConfirmacion && r.pendientePara ? r.pendientePara : r.proximaEjecucion).toLocaleString('es-NI')}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: r.esperandoConfirmacion ? '#F59E0B' : r.activo ? '#22C55E' : '#F59E0B' }}>
                    {r.esperandoConfirmacion ? 'POR CONFIRMAR' : r.activo ? 'ACTIVA' : 'EN PAUSA'}
                  </span>
                  <button
                    type="button"
                    onClick={() => alternarActivo(r)}
                    style={{ height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                  >
                    {r.activo ? 'Pausar' : 'Reanudar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelar(r.id)}
                    aria-label="Cancelar compra programada"
                    style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {r.esperandoConfirmacion && (
                  <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: '1 1 160px' }}>
                      Tu pedido programado está listo para generarse.
                    </span>
                    <button
                      type="button"
                      disabled={respondiendo === r.id}
                      onClick={() => responderEjecucion(r.id, 'confirmar')}
                      style={{ height: 44, padding: '0 16px', borderRadius: 10, border: 'none', background: '#22C55E', color: '#06240F', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                    >
                      {respondiendo === r.id ? '…' : 'Confirmar pedido'}
                    </button>
                    <button
                      type="button"
                      disabled={respondiendo === r.id}
                      onClick={() => responderEjecucion(r.id, 'cancelar')}
                      style={{ height: 44, padding: '0 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                    >
                      Saltar esta vez
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ClientRecurrentes;
