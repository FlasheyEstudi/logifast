'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Tag } from '@/components/icons';
import { notify } from '@/lib/notify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  return (
    <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
              <Tag size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold font-syne text-[var(--text)] m-0">
                Cupones de mi tienda
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0 font-medium">
                Solo aplican a los productos de tu tienda. Los cupones globales de LogiFast siguen vigentes.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setCreando((v) => !v)}
            variant={creando ? 'outline' : 'default'}
            size="sm"
            className="h-11 sm:h-10 rounded-full px-4 text-sm font-bold gap-1.5"
          >
            <Plus size={15} /> {creando ? 'Cancelar' : 'Nuevo cupón'}
          </Button>
        </div>

        {creando && (
          <form
            onSubmit={crear}
            className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] p-4 space-y-3.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Código
                </label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  placeholder="EJ. VERANO20"
                  className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Tipo
                </label>
                <select
                  value={tipoDescuento}
                  onChange={(e) => setTipoDescuento(e.target.value as 'porcentaje' | 'fijo')}
                  className="w-full h-11 px-3 rounded-[var(--lf-input-radius)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primario)] font-medium"
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Monto fijo (C$)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  {tipoDescuento === 'porcentaje' ? 'Descuento (%)' : 'Descuento (C$)'}
                </label>
                <Input
                  type="number"
                  min="1"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Compra mínima (C$, 0 = sin mínimo)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={montoMinimo}
                  onChange={(e) => setMontoMinimo(e.target.value)}
                  className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Tope de descuento (C$, 0 = sin tope)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={descuentoMaximo}
                  onChange={(e) => setDescuentoMaximo(e.target.value)}
                  className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Vigencia (días)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={vigenciaDias}
                  onChange={(e) => setVigenciaDias(e.target.value)}
                  className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Usos máximos (0 = ilimitado)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={maxUsos}
                  onChange={(e) => setMaxUsos(e.target.value)}
                  className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-[var(--border)] pt-3.5">
              <Button
                type="submit"
                disabled={guardando}
                className="w-full sm:w-auto h-11 rounded-full px-5 text-sm font-bold"
              >
                {guardando ? 'Creando…' : 'Crear cupón'}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2.5 pt-1">
          {loading ? (
            <div className="text-xs text-[var(--text-muted)] py-6 text-center">Cargando cupones…</div>
          ) : cupones.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60">
              <Tag size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
              <p className="text-xs text-[var(--text-muted)] m-0 font-medium">
                Todavía no tienes cupones propios. Crea uno para atraer clientes con un descuento que solo aplica en tu tienda.
              </p>
            </div>
          ) : (
            cupones.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center gap-3 p-3.5 rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] transition-colors hover:bg-[var(--bg-alt)]"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
                  <span className="font-mono font-bold text-sm text-[var(--text)]">{c.codigo}</span>
                  <span className="font-mono text-lg font-bold text-[var(--text)]">
                    {c.tipoDescuento === 'porcentaje' ? `${c.valor}%` : money(c.valor)}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    {c.montoMinimo ? `mínimo ${money(c.montoMinimo)}` : 'sin mínimo'} · usos {c.usosActuales}
                    {c.maxUsos > 0 ? `/${c.maxUsos}` : ''}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge
                    variant="outline"
                    className="text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]"
                  >
                    vence {new Date(c.vigenciaFin).toLocaleDateString('es-NI')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                      c.estado === 'activo'
                        ? 'bg-[var(--exito)]/10 text-[var(--exito)] border border-[var(--exito)]'
                        : c.estado === 'agotado'
                        ? 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]'
                        : 'bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {c.estado}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TiendaCupones;
