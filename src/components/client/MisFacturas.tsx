'use client';

import React, { useEffect, useState } from 'react';
import { FileDown, FileText, X } from 'lucide-react';

interface FacturaCliente {
  id: string;
  createdAt: string;
  origen: string;
  destino: string;
  monto: number;
  metodoPago: string;
  estado: string;
  facturaUrlPdf: string;
}

const dinero = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Sección "Mis Facturas" del perfil del cliente: compras con preview térmico y descarga PDF. */
export default function MisFacturas() {
  const [abierto, setAbierto] = useState(false);
  const [facturas, setFacturas] = useState<FacturaCliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [preview, setPreview] = useState<FacturaCliente | null>(null);

  const abrir = () => {
    setAbierto(true);
    setCargando(true);
    fetch('/api/cliente/facturas')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.facturas)) setFacturas(d.facturas);
      })
      .catch(() => null)
      .finally(() => setCargando(false));
  };

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
        Mis Facturas
      </div>
      <button
        type="button"
        onClick={abrir}
        style={{
          width: '100%',
          minHeight: 44,
          borderRadius: 'var(--lf-button-radius, 14px)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <FileText size={15} style={{ color: 'var(--primario)' }} />
        Ver mis facturas
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setAbierto(false); setPreview(null); }}
        >
          <div
            className="w-full max-w-md bg-[var(--surface)] rounded-[var(--lf-card-radius,22px)] border border-[var(--border)] p-5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-syne text-base font-bold text-[var(--text)] m-0">Mis Facturas</h3>
              <button
                onClick={() => { setAbierto(false); setPreview(null); }}
                aria-label="Cerrar"
                className="w-10 h-10 rounded-full bg-[var(--bg-alt)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {cargando ? (
              <p className="text-sm text-[var(--text-muted)] italic py-4">Cargando facturas…</p>
            ) : facturas.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic py-4">Todavía no tienes compras registradas.</p>
            ) : (
              facturas.map((f) => (
                <div
                  key={f.id}
                  className="rounded-[var(--lf-card-radius,16px)] bg-[var(--bg-alt)] border border-[var(--border)] p-3.5 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0" onClick={() => setPreview(f)} style={{ cursor: 'pointer' }}>
                    <div className="text-xs font-bold text-[var(--text)] truncate">
                      {f.origen} → {f.destino}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {new Date(f.createdAt).toLocaleDateString('es-NI', { dateStyle: 'medium' })} · {f.metodoPago}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--text)]">{dinero(f.monto)}</span>
                  <a
                    href={f.facturaUrlPdf}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Descargar PDF"
                    className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--primario)] flex items-center justify-center shrink-0"
                  >
                    <FileDown size={14} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Preview térmico */}
      {preview && (
        <div
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-xs bg-white text-slate-900 rounded-lg p-4 font-mono text-[11px] flex flex-col gap-1 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center font-bold text-xs">LOGIFAST</div>
            <div className="border-t border-dashed border-slate-300 my-1" />
            <div className="text-center font-bold">FACTURA DE SERVICIO</div>
            <div className="text-center">{new Date(preview.createdAt).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <div className="border-t border-dashed border-slate-300 my-1" />
            <div className="font-bold">Recogida:</div>
            <div>{preview.origen}</div>
            <div className="font-bold">Entrega:</div>
            <div>{preview.destino}</div>
            <div className="border-t border-dashed border-slate-300 my-1" />
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{dinero(preview.monto)}</span>
            </div>
            <div className="text-center text-slate-500">Pago: {preview.metodoPago}</div>
            <div className="border-t border-dashed border-slate-300 my-1" />
            <a href={preview.facturaUrlPdf} target="_blank" rel="noreferrer" className="text-center font-bold underline mt-1">
              Descargar PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
