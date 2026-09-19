'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Eye, X } from 'lucide-react';

interface ItemFactura {
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Factura {
  id: string;
  numeroComprobante: string;
  codigoPin: string | null;
  createdAt: string;
  total: number;
  subtotal: number;
  descuento: number;
  metodoPago: string;
  clienteNombre: string | null;
  tiendaZona: string | null;
  tiendaCategoria: string | null;
  facturaUrlPdf: string | null;
  items: ItemFactura[];
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const dinero = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function mesEtiqueta(fecha: string): string {
  const d = new Date(fecha);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Historial potenciado de facturas POS con arqueo (mes / zona / tipo) y descarga de PDF. */
export default function HistorialFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroMes, setFiltroMes] = useState<string | null>(null);
  const [filtroZona, setFiltroZona] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [preview, setPreview] = useState<Factura | null>(null);

  useEffect(() => {
    fetch('/api/tienda/facturas')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.facturas)) setFacturas(d.facturas);
      })
      .catch(() => null)
      .finally(() => setCargando(false));
  }, []);

  const meses = useMemo(() => [...new Set(facturas.map((f) => mesEtiqueta(f.createdAt)))].sort().reverse(), [facturas]);
  const zonas = useMemo(() => [...new Set(facturas.map((f) => f.tiendaZona).filter(Boolean))] as string[], [facturas]);
  const tipos = useMemo(() => [...new Set(facturas.map((f) => f.tiendaCategoria).filter(Boolean))] as string[], [facturas]);

  const filtradas = useMemo(
    () =>
      facturas.filter(
        (f) =>
          (!filtroMes || mesEtiqueta(f.createdAt) === filtroMes) &&
          (!filtroZona || f.tiendaZona === filtroZona) &&
          (!filtroTipo || f.tiendaCategoria === filtroTipo)
      ),
    [facturas, filtroMes, filtroZona, filtroTipo]
  );

  const totalMes = filtradas.reduce((s, f) => s + f.total, 0);
  const totalZona = filtradas.filter((f) => f.tiendaZona === filtroZona || !filtroZona).reduce((s, f) => s + f.total, 0);

  const Chip = ({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`min-h-10 px-3.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
        activo
          ? 'bg-[var(--primario)] text-white border-transparent'
          : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  );

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider font-syne">Historial de Facturas</h3>
        <span className="text-xs text-[var(--text-muted)]">{filtradas.length} facturas</span>
      </div>

      {/* Resumen de arqueo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Total del mes</div>
          <div className="text-xl font-extrabold text-[var(--text)] font-mono mt-1">{dinero(totalMes)}</div>
        </div>
        <div className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Total por zona</div>
          <div className="text-xl font-extrabold text-[var(--text)] font-mono mt-1">{dinero(totalZona)}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{filtroZona || 'Todas las zonas'}</div>
        </div>
        <div className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Facturas</div>
          <div className="text-xl font-extrabold text-[var(--text)] font-mono mt-1">{filtradas.length}</div>
        </div>
      </div>

      {/* Filtros chips */}
      <div className="flex flex-wrap gap-2">
        {meses.map((m) => (
          <Chip key={m} activo={filtroMes === m} onClick={() => setFiltroMes(filtroMes === m ? null : m)}>
            {m}
          </Chip>
        ))}
        {zonas.map((z) => (
          <Chip key={z} activo={filtroZona === z} onClick={() => setFiltroZona(filtroZona === z ? null : z)}>
            {z}
          </Chip>
        ))}
        {tipos.map((t) => (
          <Chip key={t} activo={filtroTipo === t} onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}>
            {t}
          </Chip>
        ))}
      </div>

      {cargando ? (
        <p className="text-sm text-[var(--text-muted)] italic py-4">Cargando facturas…</p>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] italic py-4">No hay facturas con estos filtros.</p>
      ) : (
        <div className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Comprobante</TableHead>
                <TableHead className="font-bold">Fecha</TableHead>
                <TableHead className="font-bold">Zona</TableHead>
                <TableHead className="font-bold">Tipo</TableHead>
                <TableHead className="font-bold">Pago</TableHead>
                <TableHead className="font-bold text-right">Total</TableHead>
                <TableHead className="font-bold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((f) => (
                <TableRow key={f.id} className="border-b border-[var(--border)]">
                  <TableCell className="font-mono font-bold">{f.numeroComprobante}</TableCell>
                  <TableCell>{new Date(f.createdAt).toLocaleDateString('es-NI', { day: '2-digit', month: 'short' })}</TableCell>
                  <TableCell>{f.tiendaZona || '—'}</TableCell>
                  <TableCell>{f.tiendaCategoria || '—'}</TableCell>
                  <TableCell>{f.metodoPago === 'efectivo' ? 'Efectivo' : f.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{dinero(f.total)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreview(f)}
                        aria-label="Ver factura"
                        className="w-9 h-9 rounded-full bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--primario)] flex items-center justify-center cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>
                      {f.facturaUrlPdf && (
                        <a
                          href={f.facturaUrlPdf}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Descargar PDF"
                          className="w-9 h-9 rounded-full bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--primario)] flex items-center justify-center cursor-pointer"
                        >
                          <FileDown size={14} />
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preview térmico */}
      {preview && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-xs bg-white text-slate-900 rounded-lg p-4 font-mono text-[11px] flex flex-col gap-1 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">PREVIEW FACTURA</span>
              <button onClick={() => setPreview(null)} aria-label="Cerrar" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <div className="border-t border-dashed border-slate-300 my-1" />
            <div className="text-center font-bold">{preview.numeroComprobante}</div>
            {preview.codigoPin && (
              <div className="text-center font-bold">PIN: {preview.codigoPin}</div>
            )}
            <div className="text-center">{new Date(preview.createdAt).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <div className="text-center">Cliente: {preview.clienteNombre || 'Cliente General'}</div>
            <div className="border-t border-dashed border-slate-300 my-1" />
            {preview.items.map((it, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span>{it.cantidad}x {it.nombreProducto}</span>
                <span className="font-bold">{dinero(it.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-slate-300 my-1" />
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{dinero(preview.total)}</span>
            </div>
            <div className="text-center text-slate-500">Pago: {preview.metodoPago}</div>
            <div className="border-t border-dashed border-slate-300 my-1" />
            {preview.facturaUrlPdf && (
              <a
                href={preview.facturaUrlPdf}
                target="_blank"
                rel="noreferrer"
                className="text-center font-bold underline mt-1"
              >
                Descargar PDF
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
