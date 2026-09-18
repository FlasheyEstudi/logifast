'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Copy,
  Tag,
  FileText,
} from '@/components/icons';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { notify } from '@/lib/notify';
import type { Producto } from './TiendaInventario';

interface TiendaEtiquetasModalProps {
  abierto: boolean;
  onCerrar: () => void;
  producto: Producto | null;
  nombreTienda?: string;
}

export function TiendaEtiquetasModal({
  abierto,
  onCerrar,
  producto,
  nombreTienda = 'LogiFast Tienda',
}: TiendaEtiquetasModalProps) {
  const [tipoCodigo, setTipoCodigo] = useState<'barras' | 'qr'>('barras');
  const [modoImpresion, setModoImpresion] = useState<'cuadricula' | 'adhesivo'>('cuadricula');
  const [codigoValor, setCodigoValor] = useState('');
  const [cantidadCopias, setCantidadCopias] = useState(24);

  // Toggles de contenido en la etiqueta
  const [mostrarNombre, setMostrarNombre] = useState(true);
  const [mostrarPrecio, setMostrarPrecio] = useState(true);
  const [mostrarTienda, setMostrarTienda] = useState(true);
  const [mostrarTextoCodigo, setMostrarTextoCodigo] = useState(true);

  // QR Data URL cache
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);
  const printBarcodeSvgRefs = useRef<(SVGSVGElement | null)[]>([]);

  // Inicializar valor de código cuando cambia el producto
  useEffect(() => {
    if (!producto) return;
    const valorInicial = producto.codigoBarras?.trim() || `SKU${Date.now().toString().slice(-8)}`;
    setCodigoValor(valorInicial);
  }, [producto]);

  // Generar Código QR cuando cambie el valor o tipo
  useEffect(() => {
    if (!codigoValor) return;
    if (tipoCodigo === 'qr') {
      QRCode.toDataURL(codigoValor, {
        width: 180,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generando QR:', err));
    }
  }, [codigoValor, tipoCodigo]);

  // Renderizar Barcode en vista previa y en copias de impresión
  useEffect(() => {
    if (tipoCodigo !== 'barras' || !codigoValor) return;

    try {
      if (barcodeSvgRef.current) {
        JsBarcode(barcodeSvgRef.current, codigoValor, {
          format: 'CODE128',
          width: 1.8,
          height: 42,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        });
      }

      printBarcodeSvgRefs.current.forEach((svgEl) => {
        if (svgEl) {
          JsBarcode(svgEl, codigoValor, {
            format: 'CODE128',
            width: modoImpresion === 'adhesivo' ? 1.6 : 1.5,
            height: modoImpresion === 'adhesivo' ? 36 : 32,
            displayValue: false,
            margin: 0,
            background: 'transparent',
            lineColor: '#000000',
          });
        }
      });
    } catch (e) {
      console.warn('Error renderizando código de barras:', e);
    }
  }, [codigoValor, tipoCodigo, abierto, cantidadCopias, modoImpresion]);

  const generarNuevoCodigo = () => {
    // Generar código numérico estándar de 12 dígitos
    const randomCode = `744${Math.floor(100000000 + Math.random() * 900000000)}`;
    setCodigoValor(randomCode);
    notify.info(`Nuevo código generado: ${randomCode}`);
  };

  const ejecutarImpresion = () => {
    window.print();
  };

  const descargarImagen = () => {
    if (tipoCodigo === 'qr' && qrDataUrl) {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `QR_${producto?.nombre || 'producto'}_${codigoValor}.png`;
      a.click();
      notify.success('Código QR descargado');
    } else if (barcodeSvgRef.current) {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(barcodeSvgRef.current);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Barcode_${producto?.nombre || 'producto'}_${codigoValor}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      notify.success('Código de barras SVG descargado');
    }
  };

  if (!abierto || !producto) return null;

  return (
    <>
      {/* ─── MODAL DE INTERFAZ DE USUARIO (Pantalla normal) ─── */}
      <div
        onClick={onCerrar}
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-scale-up space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-primary" />
                <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-syne">
                  Generador de Etiquetas & Códigos
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                Producto: <b>{producto.nombre}</b> · Precio: <b>C$ {producto.precio.toFixed(2)}</b>
              </p>
            </div>

            <button
              onClick={onCerrar}
              className="w-10 h-10 rounded-xl hover:bg-[var(--bg-alt)] text-slate-500 flex items-center justify-center active:scale-95 transition-all"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Selector de Tipo de Código & Formato de Impresión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tipo de código: Barras o QR */}
            <div className="p-3 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                1. Tipo de Código
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoCodigo('barras')}
                  className={`h-11 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                    tipoCodigo === 'barras'
                      ? 'bg-primary text-white shadow-sm shadow-primary/25'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
                  }`}
                >
                  <span>||| Código Barras</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoCodigo('qr')}
                  className={`h-11 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                    tipoCodigo === 'qr'
                      ? 'bg-primary text-white shadow-sm shadow-primary/25'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
                  }`}
                >
                  <span>▦ Código QR 2D</span>
                </button>
              </div>
            </div>

            {/* Formato: Hoja para recortar vs Rollo Adhesivo */}
            <div className="p-3 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                2. Destino de Impresión
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModoImpresion('cuadricula');
                    if (cantidadCopias < 12) setCantidadCopias(24);
                  }}
                  className={`h-11 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center text-center leading-tight cursor-pointer ${
                    modoImpresion === 'cuadricula'
                      ? 'bg-[var(--primario)] text-white shadow-sm shadow-[var(--primario)]/25'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} />
                    <span>Hoja Carta / A4</span>
                  </span>
                  <span className="text-[9px] opacity-80 mt-0.5">Múltiples para recortar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoImpresion('adhesivo');
                    if (cantidadCopias > 12) setCantidadCopias(1);
                  }}
                  className={`h-11 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center text-center leading-tight cursor-pointer ${
                    modoImpresion === 'adhesivo'
                      ? 'bg-[var(--primario)] text-white shadow-sm shadow-[var(--primario)]/25'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} />
                    <span>Rollo Adhesivo</span>
                  </span>
                  <span className="text-[9px] opacity-80 mt-0.5">Impresora Térmica</span>
                </button>
              </div>
            </div>
          </div>

          {/* Edición de Valor del Código & Copias */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Contenido / SKU del Código
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codigoValor}
                  onChange={(e) => setCodigoValor(e.target.value)}
                  placeholder="Ej: 7501055301072"
                  className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)]"
                />
                <button
                  type="button"
                  onClick={generarNuevoCodigo}
                  title="Generar SKU numérico aleatorio"
                  className="h-11 min-h-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-[var(--border)] text-xs font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Generar</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Cantidad de Etiquetas
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={Number.isFinite(cantidadCopias) ? cantidadCopias : ''}
                  onChange={(e) => setCantidadCopias(e.target.value === '' ? NaN : Math.max(1, Number(e.target.value) || 1))}
                  onBlur={() => { if (!Number.isFinite(cantidadCopias)) setCantidadCopias(1); }}
                  className="w-full h-11 min-h-[44px] px-3 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] font-mono text-center focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)]"
                />
                <div className="flex gap-1">
                  {[6, 24, 48].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCantidadCopias(num)}
                      className="px-2 py-1 h-9 rounded-lg bg-[var(--bg-alt)] text-[10px] font-bold hover:bg-slate-200 active:scale-95"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Opciones de la Etiqueta (Checkboxes) */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-alt)]/40 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Elementos Visibles en Cada Etiqueta
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={mostrarNombre}
                  onChange={(e) => setMostrarNombre(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span>Nombre</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={mostrarPrecio}
                  onChange={(e) => setMostrarPrecio(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span>Precio (C$)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={mostrarTienda}
                  onChange={(e) => setMostrarTienda(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span>Comercio</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={mostrarTextoCodigo}
                  onChange={(e) => setMostrarTextoCodigo(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span>SKU Numérico</span>
              </label>
            </div>
          </div>

          {/* ─── VISTA PREVIA INDIVIDUAL DE ETIQUETA ─── */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Vista Previa de Etiqueta (Tamaño Real de Muestra)
            </span>
            <div className="flex justify-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-[var(--border)]">
              <div className="w-56 p-3 bg-white text-black rounded-xl border-2 border-dashed border-slate-400 shadow-sm flex flex-col items-center text-center font-sans">
                {mostrarTienda && (
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 truncate max-w-full">
                    {nombreTienda}
                  </span>
                )}
                {mostrarNombre && (
                  <h4 className="text-xs font-extrabold line-clamp-1 leading-tight mt-0.5 text-black">
                    {producto.nombre}
                  </h4>
                )}

                {/* Código visual preview */}
                <div className="my-1.5 flex items-center justify-center min-h-[50px]">
                  {tipoCodigo === 'barras' ? (
                    <svg ref={barcodeSvgRef} className="max-w-full h-12" />
                  ) : qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-20 h-20 object-contain" />
                  ) : null}
                </div>

                {mostrarTextoCodigo && (
                  <span className="text-[10px] font-mono tracking-widest font-bold text-black">
                    {codigoValor}
                  </span>
                )}

                {mostrarPrecio && (
                  <span className="text-xs font-black text-black mt-1 font-mono">
                    C$ {producto.precio.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={descargarImagen}
              className="w-full sm:w-auto h-11 min-h-[44px] px-4 rounded-xl border border-[var(--border)] text-[var(--text)] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bg-alt)] active:scale-95 transition-all"
            >
              <Download size={15} />
              <span>Descargar Imagen {tipoCodigo === 'qr' ? '(PNG)' : '(SVG)'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onCerrar}
                className="flex-1 sm:flex-initial h-11 min-h-[44px] px-4 rounded-xl border border-[var(--border)] text-[var(--text)] font-bold text-xs hover:bg-[var(--bg-alt)] active:scale-95 transition-all"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={ejecutarImpresion}
                className="flex-[2] sm:flex-initial h-11 min-h-[44px] px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                <span>Imprimir {cantidadCopias} Etiquetas (o PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONTENEDOR EXCLUSIVO PARA IMPRESIÓN DIRECTA O DESCARGA A PDF ─── */}
      {/* Solo es visible cuando se llama a window.print() gracias a @media print */}
      <div id="printable-labels-root" className="hidden print:block text-black bg-white">
        <style dangerouslySetInnerHTML={{ __html: `
          @media screen {
            #printable-labels-root { display: none !important; }
          }
          @media print {
            body * { visibility: hidden !important; }
            #printable-labels-root, #printable-labels-root * { visibility: visible !important; }
            #printable-labels-root {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              display: block !important;
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* Configuración para rollo adhesivo térmico (50x30mm o 58mm) */
            ${modoImpresion === 'adhesivo' ? `
              @page {
                size: 50mm 30mm;
                margin: 0mm;
              }
              .etiqueta-adhesiva-item {
                page-break-after: always;
                width: 48mm;
                height: 28mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                margin: 0 auto;
                padding: 1mm;
                box-sizing: border-box;
              }
            ` : `
              /* Configuración para hoja estándar carta/A4 en cuadrícula */
              @page {
                size: letter portrait;
                margin: 6mm;
              }
              .cuadricula-impresion {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 4mm !important;
                width: 100% !important;
              }
              .etiqueta-cuadricula-item {
                border: 1px dashed #94a3b8 !important;
                border-radius: 4px !important;
                padding: 3mm 2mm !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                text-align: center !important;
                page-break-inside: avoid !important;
                box-sizing: border-box !important;
              }
            `}
          }
        ` }} />

        {modoImpresion === 'adhesivo' ? (
          /* Rollo de Etiquetas Térmicas Adhesivas (Una por página/corte) */
          <div>
            {Array.from({ length: cantidadCopias }).map((_, idx) => (
              <div key={idx} className="etiqueta-adhesiva-item">
                {mostrarTienda && (
                  <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1 }}>
                    {nombreTienda}
                  </div>
                )}
                {mostrarNombre && (
                  <div style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: 1.1, marginTop: '2px', maxWidth: '44mm', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {producto.nombre}
                  </div>
                )}

                <div style={{ margin: '2px 0' }}>
                  {tipoCodigo === 'barras' ? (
                    <svg
                      ref={(el) => {
                        printBarcodeSvgRefs.current[idx] = el;
                      }}
                      style={{ maxHeight: '12mm', maxWidth: '44mm' }}
                    />
                  ) : qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR" style={{ height: '14mm', width: '14mm' }} />
                  ) : null}
                </div>

                {mostrarTextoCodigo && (
                  <div style={{ fontSize: '8px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {codigoValor}
                  </div>
                )}

                {mostrarPrecio && (
                  <div style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'monospace', marginTop: '1px' }}>
                    C$ {producto.precio.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Hoja de Papel con Cuadrícula para recortar */
          <div className="cuadricula-impresion">
            {Array.from({ length: cantidadCopias }).map((_, idx) => (
              <div key={idx} className="etiqueta-cuadricula-item">
                {mostrarTienda && (
                  <div style={{ fontSize: '8.5px', fontWeight: 'bold', textTransform: 'uppercase', color: '#333' }}>
                    {nombreTienda}
                  </div>
                )}
                {mostrarNombre && (
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '1px', lineHeight: 1.2, maxWidth: '58mm', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {producto.nombre}
                  </div>
                )}

                <div style={{ margin: '3px 0' }}>
                  {tipoCodigo === 'barras' ? (
                    <svg
                      ref={(el) => {
                        printBarcodeSvgRefs.current[idx] = el;
                      }}
                      style={{ maxHeight: '11mm', maxWidth: '54mm' }}
                    />
                  ) : qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR" style={{ height: '16mm', width: '16mm' }} />
                  ) : null}
                </div>

                {mostrarTextoCodigo && (
                  <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {codigoValor}
                  </div>
                )}

                {mostrarPrecio && (
                  <div style={{ fontSize: '12px', fontWeight: '900', fontFamily: 'monospace', marginTop: '2px' }}>
                    C$ {producto.precio.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
