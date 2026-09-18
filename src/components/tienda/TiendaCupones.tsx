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
    <Card className="rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold font-syne text-[var(--text)] m-0">
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
            className="h-10 rounded-full px-4 text-xs font-bold gap-1.5 shadow-xs"
          >
            <Plus size={15} /> {creando ? 'Cancelar' : 'Nuevo cupón'}
          </Button>
        </div>

        {creando && (
          <form onSubmit={crear} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Código</label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                placeholder="EJ. VERANO20"
                className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Tipo</label>
              <select
                value={tipoDescuento}
                onChange={(e) => setTipoDescuento(e.target.value as 'porcentaje' | 'fijo')}
                className="w-full h-11 px-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-[var(--bg-alt)] text-[var(--text)] text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo (C$)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                {tipoDescuento === 'porcentaje' ? 'Descuento (%)' : 'Descuento (C$)'}
              </label>
              <Input
                type="number"
                min="1"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                Compra mínima (C$, 0 = sin mínimo)
              </label>
              <Input
                type="number"
                min="0"
                value={montoMinimo}
                onChange={(e) => setMontoMinimo(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                Tope de descuento (C$, 0 = sin tope)
              </label>
              <Input
                type="number"
                min="0"
                value={descuentoMaximo}
                onChange={(e) => setDescuentoMaximo(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                Vigencia (días)
              </label>
              <Input
                type="number"
                min="1"
                value={vigenciaDias}
                onChange={(e) => setVigenciaDias(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                Usos máximos (0 = ilimitado)
              </label>
              <Input
                type="number"
                min="0"
                value={maxUsos}
                onChange={(e) => setMaxUsos(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={guardando}
                className="w-full h-11 rounded-full text-xs font-bold shadow-md shadow-primary/20"
              >
                {guardando ? 'Creando…' : 'Crear cupón'}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2.5 pt-2">
          {loading ? (
            <div className="text-xs text-[var(--text-muted)] py-4 text-center">Cargando cupones…</div>
          ) : cupones.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)] py-4 text-center">
              Todavía no tienes cupones propios. Crea uno para atraer clientes con un descuento que solo aplica en tu tienda.
            </div>
          ) : (
            cupones.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-alt)]/60 border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
              >
                <span className="font-mono font-bold text-sm text-[var(--text)]">{c.codigo}</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {c.tipoDescuento === 'porcentaje' ? `${c.valor}%` : money(c.valor)}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {c.montoMinimo ? `mínimo ${money(c.montoMinimo)}` : 'sin mínimo'} · usos {c.usosActuales}
                  {c.maxUsos > 0 ? `/${c.maxUsos}` : ''} · vence {new Date(c.vigenciaFin).toLocaleDateString('es-NI')}
                </span>
                <Badge
                  variant={c.estado === 'activo' ? 'secondary' : 'outline'}
                  className={`ml-auto text-[10px] font-bold uppercase rounded-full px-3 py-0.5 ${
                    c.estado === 'activo'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {c.estado}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TiendaCupones;
