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
    <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold flex items-center gap-2 text-[var(--text)] m-0">
            <Tag size={17} className="text-primary" /> Cupones de mi tienda
          </h3>
          <Button
            type="button"
            onClick={() => setCreando((v) => !v)}
            variant={creando ? 'outline' : 'default'}
            size="sm"
            className="h-9 text-xs font-semibold gap-1.5"
          >
            <Plus size={15} /> {creando ? 'Cancelar' : 'Nuevo cupón'}
          </Button>
        </div>

        <p className="text-xs text-[var(--text-muted)] m-0">
          Solo aplican a los productos de tu tienda. Los cupones globales de LogiFast siguen vigentes.
        </p>

        {creando && (
          <form onSubmit={crear} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Código</label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                placeholder="EJ. VERANO20"
                className="h-10 text-xs bg-[var(--bg-alt)] border-[var(--border)] font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">Tipo</label>
              <select
                value={tipoDescuento}
                onChange={(e) => setTipoDescuento(e.target.value as 'porcentaje' | 'fijo')}
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primario)]"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo (C$)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                {tipoDescuento === 'porcentaje' ? 'Descuento (%)' : 'Descuento (C$)'}
              </label>
              <Input
                type="number"
                min="1"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="h-10 text-xs bg-[var(--bg-alt)] border-[var(--border)] font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                Compra mínima (C$, 0 = sin mínimo)
              </label>
              <Input
                type="number"
                min="0"
                value={montoMinimo}
                onChange={(e) => setMontoMinimo(e.target.value)}
                className="h-10 text-xs bg-[var(--bg-alt)] border-[var(--border)] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                Tope de descuento (C$, 0 = sin tope)
              </label>
              <Input
                type="number"
                min="0"
                value={descuentoMaximo}
                onChange={(e) => setDescuentoMaximo(e.target.value)}
                className="h-10 text-xs bg-[var(--bg-alt)] border-[var(--border)] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                Vigencia (días)
              </label>
              <Input
                type="number"
                min="1"
                value={vigenciaDias}
                onChange={(e) => setVigenciaDias(e.target.value)}
                className="h-10 text-xs bg-[var(--bg-alt)] border-[var(--border)] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                Usos máximos (0 = ilimitado)
              </label>
              <Input
                type="number"
                min="0"
                value={maxUsos}
                onChange={(e) => setMaxUsos(e.target.value)}
                className="h-10 text-xs bg-[var(--bg-alt)] border-[var(--border)] font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={guardando}
                className="w-full h-10 text-xs font-semibold"
              >
                {guardando ? 'Creando…' : 'Crear cupón'}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2 pt-2">
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
                className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]"
              >
                <span className="font-mono font-bold text-sm text-[var(--text)]">{c.codigo}</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {c.tipoDescuento === 'porcentaje' ? `${c.valor}%` : money(c.valor)}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {c.montoMinimo ? `mínimo ${money(c.montoMinimo)}` : 'sin mínimo'} · usos {c.usosActuales}
                  {c.maxUsos > 0 ? `/${c.maxUsos}` : ''} · vence {new Date(c.vigenciaFin).toLocaleDateString('es-NI')}
                </span>
                <Badge
                  variant={c.estado === 'activo' ? 'secondary' : 'outline'}
                  className={`ml-auto text-[10px] font-bold uppercase ${
                    c.estado === 'activo'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0'
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
