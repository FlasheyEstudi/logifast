'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Save, CheckCircle2, Shield, AlertCircle } from '@/components/icons';
import { notify } from '@/lib/notify';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function TiendaFacturacion({ isDark }: { isDark: boolean }) {
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [regimenDgi, setRegimenDgi] = useState('Cuota Fija');
  const [saludoFactura, setSaludoFactura] = useState('');
  const [piePaginaFactura, setPiePaginaFactura] = useState('');
  const [serieFactura, setSerieFactura] = useState('F001');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/perfil');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.tienda) {
        const t = data.tienda;
        setRuc(t.ruc || '');
        setRazonSocial(t.razonSocial || t.nombre || '');
        setRegimenDgi(t.regimenDgi || 'Cuota Fija');
        setSaludoFactura(t.saludoFactura || '¡Gracias por su compra!');
        setPiePaginaFactura(t.piePaginaFactura || 'Conservar este comprobante para cambios o reclamos.');
        setSerieFactura(t.serieFactura || 'F001');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const guardarFacturacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch('/api/tienda/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruc,
          razonSocial,
          regimenDgi,
          saludoFactura,
          piePaginaFactura,
          serieFactura,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        notify.success('Configuración fiscal y de facturación actualizada');
      } else {
        notify.error(data.error || 'Error al guardar configuración');
      }
    } catch (err) {
      notify.error('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-5 items-start">
      {/* ─── Columna Izquierda: Formulario de Configuración Fiscal ─── */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <FileText size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento Tributario</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-syne">
              Configuración de Facturación & DGI
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Ajustes fiscales para la emisión legal de comprobantes y tickets térmicos en Caja POS y ventas
            </p>
          </div>

          <form onSubmit={guardarFacturacion} className="space-y-4">
            {/* RUC & Razón Social */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Número RUC de la Empresa *
                </label>
                <Input
                  type="text"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  placeholder="Ej: J0310000000000"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Razón Social Legal *
                </label>
                <Input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej: Comercial Distribuidora S.A."
                  required
                />
              </div>
            </div>

            {/* Régimen & Serie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Régimen Fiscal DGI
                </label>
                <select
                  value={regimenDgi}
                  onChange={(e) => setRegimenDgi(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer text-[var(--text)] dark:bg-input/30"
                >
                  <option value="Cuota Fija" className="bg-[var(--surface)] text-[var(--text)]">Cuota Fija (Pequeño Contribuyente)</option>
                  <option value="Régimen General" className="bg-[var(--surface)] text-[var(--text)]">Régimen General (IVA 15%)</option>
                  <option value="Exento" className="bg-[var(--surface)] text-[var(--text)]">Exento de Impuestos</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Serie de Comprobante / Serie Factura
                </label>
                <Input
                  type="text"
                  value={serieFactura}
                  onChange={(e) => setSerieFactura(e.target.value)}
                  placeholder="F001"
                />
              </div>
            </div>

            {/* Saludo */}
            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Mensaje de Saludo o Agradecimiento en la Factura
              </label>
              <Input
                type="text"
                value={saludoFactura}
                onChange={(e) => setSaludoFactura(e.target.value)}
                placeholder="Ej: ¡Gracias por preferir nuestros productos!"
              />
            </div>

            {/* Pie de Página */}
            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Políticas de Cambio / Pie de Comprobante
              </label>
              <Textarea
                value={piePaginaFactura}
                onChange={(e) => setPiePaginaFactura(e.target.value)}
                placeholder="Ej: Conservar este comprobante para cualquier garantía dentro de 15 días."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Pie de Marca Institucional LogiFast */}
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
              <Shield size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-primary">
                  Pie de Marca Institucional Permanente
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Todas las facturas y comprobantes térmicos emitidos incluirán la certificación "Generado por LogiFast PWA - Sistema POS & E-Commerce".
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={guardando}
              className="w-full h-11 text-sm font-semibold"
            >
              {guardando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  <span>Guardando Ajustes...</span>
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  <span>Guardar Configuración Fiscal</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ─── Columna Derecha: Vista Previa Interactiva del Ticket ─── */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm lg:sticky lg:top-20">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] font-syne">
              Vista Previa de Comprobante
            </h3>
            <p className="text-xs text-slate-500">
              Así se imprimirá el ticket en la impresora térmica de 58mm / 80mm
            </p>
          </div>

          <div className="bg-white text-black rounded-2xl p-5 shadow-lg border border-slate-200 font-mono text-xs printable-ticket space-y-3">
            <div className="text-center pb-2 border-b border-dashed border-black/40 space-y-0.5">
              <div className="text-sm font-black tracking-tight uppercase">{razonSocial || 'MI TIENDA S.A.'}</div>
              <div className="text-[11px] text-slate-600">RUC: {ruc || 'J0310000000000'}</div>
              <div className="text-[11px] text-slate-600">DGI: {regimenDgi}</div>
              <div className="pt-1.5 text-[11px] font-bold">
                FACTURA POS #{serieFactura}-000104
              </div>
              <div suppressHydrationWarning className="text-[10px] text-slate-500">
                Fecha: {new Date().toLocaleDateString('es-NI')}
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black/40 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>2x Producto Muestra A</span>
                <span className="font-bold">C$ 240.00</span>
              </div>
              <div className="flex justify-between">
                <span>1x Producto Muestra B</span>
                <span className="font-bold">C$ 110.00</span>
              </div>
            </div>

            <div className="py-2 border-b border-dashed border-black/40 flex justify-between font-black text-sm">
              <span>TOTAL:</span>
              <span>C$ 350.00</span>
            </div>

            <div className="text-center pt-2 space-y-1 text-[10px] text-slate-600">
              <div>{saludoFactura || '¡Gracias por su compra!'}</div>
              <div>{piePaginaFactura || 'Conservar este comprobante.'}</div>
              <div className="font-bold text-black pt-1">
                *** Generado por LogiFast PWA ***
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
