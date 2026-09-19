'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Save, CheckCircle2, Shield, AlertCircle } from '@/components/icons';
import { notify } from '@/lib/notify';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import HistorialFacturas from './HistorialFacturas';

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
      <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Cumplimiento Tributario</div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-syne mt-0.5">
                Configuración de Facturación & DGI
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">
                Ajustes fiscales para la emisión legal de comprobantes y tickets térmicos en Caja POS y ventas
              </p>
            </div>
          </div>

          <form onSubmit={guardarFacturacion} className="space-y-4">
            {/* RUC & Razón Social */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Número RUC de la Empresa *
                </label>
                <Input
                  type="text"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  placeholder="Ej: J0310000000000"
                  className="h-11 rounded-[var(--lf-input-radius)]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Razón Social Legal *
                </label>
                <Input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej: Comercial Distribuidora S.A."
                  className="h-11 rounded-[var(--lf-input-radius)]"
                  required
                />
              </div>
            </div>

            {/* Régimen & Serie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Régimen Fiscal DGI
                </label>
                <select
                  value={regimenDgi}
                  onChange={(e) => setRegimenDgi(e.target.value)}
                  className="w-full h-11 rounded-[var(--lf-input-radius)] border border-[var(--border)] bg-[var(--bg-alt)] px-3.5 py-1 text-sm transition-colors outline-none focus:ring-2 focus:ring-[var(--primario)]/25 cursor-pointer text-[var(--text)] font-medium"
                >
                  <option value="Cuota Fija" className="bg-[var(--surface)] text-[var(--text)]">Cuota Fija (Pequeño Contribuyente)</option>
                  <option value="Régimen General" className="bg-[var(--surface)] text-[var(--text)]">Régimen General (IVA 15%)</option>
                  <option value="Exento" className="bg-[var(--surface)] text-[var(--text)]">Exento de Impuestos</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Serie de Comprobante / Serie Factura
                </label>
                <Input
                  type="text"
                  value={serieFactura}
                  onChange={(e) => setSerieFactura(e.target.value)}
                  placeholder="F001"
                  className="h-11 rounded-[var(--lf-input-radius)] font-mono"
                />
              </div>
            </div>

            {/* Saludo */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                Mensaje de Saludo o Agradecimiento en la Factura
              </label>
              <Input
                type="text"
                value={saludoFactura}
                onChange={(e) => setSaludoFactura(e.target.value)}
                placeholder="Ej: ¡Gracias por preferir nuestros productos!"
                className="h-11 rounded-[var(--lf-input-radius)]"
              />
            </div>

            {/* Pie de Página */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                Políticas de Cambio / Pie de Comprobante
              </label>
              <Textarea
                value={piePaginaFactura}
                onChange={(e) => setPiePaginaFactura(e.target.value)}
                placeholder="Ej: Conservar este comprobante para cualquier garantía dentro de 15 días."
                rows={3}
                className="resize-none rounded-[var(--lf-input-radius)]"
              />
            </div>

            {/* Pie de Marca Institucional LogiFast */}
            <div className="p-4 rounded-[var(--lf-card-radius)] bg-[var(--info)]/10 border border-[var(--border)] flex items-start gap-3">
              <Shield size={20} className="text-[var(--info)] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[var(--text)]">
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
              className="w-full h-12 rounded-full text-sm font-bold active:scale-[0.99] transition-transform"
            >
              {guardando ? (
                <>
                  <div className="w-5 h-5 border-2 border-[var(--primary-foreground)]/30 border-t-[var(--primary-foreground)] rounded-full animate-spin mr-2" />
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
      <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] lg:sticky lg:top-20">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--text)] font-syne">
              Vista Previa de Comprobante
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Así se imprimirá el ticket en la impresora térmica de 58mm / 80mm
            </p>
          </div>

          <div className="bg-[var(--surface)] text-[var(--text)] rounded-[var(--lf-card-radius)] p-5 border border-[var(--border)] shadow-[var(--lf-shadow-card)] font-mono text-xs printable-ticket space-y-3">
            <div className="text-center pb-3 border-b border-dashed border-[var(--border)] space-y-1">
              <div className="text-sm font-black tracking-tight uppercase">{razonSocial || 'MI TIENDA S.A.'}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{ruc || 'J0310000000000'}</div>
              <Badge
                variant="outline"
                className="rounded-full border-[var(--border)] bg-[var(--bg-alt)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--text-secondary)]"
              >
                {`DGI: ${regimenDgi}`}
              </Badge>
              <div className="pt-1 text-[11px] font-bold">
                FACTURA POS #{serieFactura}-000104
              </div>
              <div suppressHydrationWarning className="text-[11px] text-[var(--text-muted)]">
                Fecha: {new Date().toLocaleDateString('es-NI')}
              </div>
            </div>

            <Table className="text-xs">
              <TableBody>
                <TableRow className="border-b border-dashed border-[var(--border)]">
                  <TableCell className="px-0 py-1.5 text-xs">2x Producto Muestra A</TableCell>
                  <TableCell className="px-0 py-1.5 text-right text-xs font-bold font-mono">C$ 240.00</TableCell>
                </TableRow>
                <TableRow className="border-b border-dashed border-[var(--border)]">
                  <TableCell className="px-0 py-1.5 text-xs">1x Producto Muestra B</TableCell>
                  <TableCell className="px-0 py-1.5 text-right text-xs font-bold font-mono">C$ 110.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="pt-2 pb-3 border-b border-dashed border-[var(--border)] flex items-end justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">TOTAL:</span>
              <span className="text-2xl font-black font-mono tracking-tight text-[var(--text)]">C$ 350.00</span>
            </div>

            <div className="text-center pt-2 space-y-1 text-[11px] text-[var(--text-muted)]">
              <div>{saludoFactura || '¡Gracias por su compra!'}</div>
              <div>{piePaginaFactura || 'Conservar este comprobante.'}</div>
              <div className="font-bold text-[var(--text)] pt-1">
                *** Generado por LogiFast PWA ***
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <HistorialFacturas />
    </div>
  );
}
