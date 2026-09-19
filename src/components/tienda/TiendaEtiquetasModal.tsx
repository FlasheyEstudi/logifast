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
  Barcode,
  QrCode,
} from '@/components/icons';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { notify } from '@/lib/notify';
import type { Producto } from './TiendaInventario';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TiendaEtiquetasModalProps {
  abierto?: boolean;
  onCerrar?: () => void;
  onClose?: () => void;
  producto: Producto | null;
  nombreTienda?: string;
  isDark?: boolean;
}

export function TiendaEtiquetasModal({
  abierto = true,
  onCerrar,
  onClose,
  producto,
  nombreTienda = 'LogiFast Tienda',
  isDark,
}: TiendaEtiquetasModalProps) {
  const handleCerrar = onCerrar || onClose || (() => {});
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
        onClick={handleCerrar}
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 no-print"
      >
        <Card
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[var(--surface)] rounded-[var(--lf-sheet-radius)] border border-[var(--border)] shadow-[var(--lf-shadow-sheet)] max-h-[92vh] overflow-y-auto"
        >
          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border)]">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-[var(--lf-input-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
                  <Tag size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold tracking-tight text-[var(--text)] font-syne m-0">
                    Generador de Etiquetas & Códigos
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-md m-0">
                    Producto: <b className="text-[var(--text)] font-semibold">{producto.nombre}</b> · Precio: <b className="text-[var(--primario)] font-mono">C$ {producto.precio.toFixed(2)}</b>
                  </p>
                </div>
              </div>

              <button
                onClick={handleCerrar}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-full hover:bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors shrink-0"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selector de Tipo de Código & Formato de Impresión */}
            <div className="rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)]/50 border border-[var(--border)] p-4 space-y-4">
              {/* Tipo de código: Barras o QR */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  1. Tipo de Código
                </span>
                <Tabs
                  value={tipoCodigo}
                  onValueChange={(v) => setTipoCodigo(v as 'barras' | 'qr')}
                  className="gap-0"
                >
                  <TabsList className="w-full h-auto gap-1 rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] p-1">
                    <TabsTrigger
                      value="barras"
                      className="h-11 gap-1.5 rounded-[var(--lf-input-radius)] text-xs font-bold text-[var(--text-muted)] data-[state=active]:bg-[var(--primario)]/10 data-[state=active]:text-[var(--primario)] data-[state=active]:shadow-none"
                    >
                      <Barcode size={17} />
                      <span>Código Barras</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="qr"
                      className="h-11 gap-1.5 rounded-[var(--lf-input-radius)] text-xs font-bold text-[var(--text-muted)] data-[state=active]:bg-[var(--primario)]/10 data-[state=active]:text-[var(--primario)] data-[state=active]:shadow-none"
                    >
                      <QrCode size={16} />
                      <span>Código QR 2D</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Formato: Hoja para recortar vs Rollo Adhesivo */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  2. Destino de Impresión
                </span>
                <Tabs
                  value={modoImpresion}
                  onValueChange={(v) => {
                    const modo = v as 'cuadricula' | 'adhesivo';
                    setModoImpresion(modo);
                    if (modo === 'cuadricula' && cantidadCopias < 12) setCantidadCopias(24);
                    if (modo === 'adhesivo' && cantidadCopias > 12) setCantidadCopias(1);
                  }}
                  className="gap-0"
                >
                  <TabsList className="w-full h-auto gap-1 rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] p-1">
                    <TabsTrigger
                      value="cuadricula"
                      className="h-auto min-h-11 flex-col items-start gap-0.5 rounded-[var(--lf-input-radius)] px-3 py-2 text-left text-[var(--text-muted)] data-[state=active]:bg-[var(--primario)]/10 data-[state=active]:text-[var(--primario)] data-[state=active]:shadow-none"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <FileText size={13} />
                        <span>Hoja Carta / A4</span>
                      </span>
                      <span className="text-[11px] font-normal text-[var(--text-muted)]">Múltiples para recortar</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="adhesivo"
                      className="h-auto min-h-11 flex-col items-start gap-0.5 rounded-[var(--lf-input-radius)] px-3 py-2 text-left text-[var(--text-muted)] data-[state=active]:bg-[var(--primario)]/10 data-[state=active]:text-[var(--primario)] data-[state=active]:shadow-none"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <Tag size={13} />
                        <span>Rollo Adhesivo</span>
                      </span>
                      <span className="text-[11px] font-normal text-[var(--text-muted)]">Impresora Térmica</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

            {/* Edición de Valor del Código & Copias */}
            <div className="border-t border-[var(--border)] pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">
                  Contenido / SKU del Código
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={codigoValor}
                    onChange={(e) => setCodigoValor(e.target.value)}
                    placeholder="Ej: 7501055301072"
                    className="h-11 rounded-[var(--lf-input-radius)] text-xs bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generarNuevoCodigo}
                    title="Generar SKU numérico aleatorio"
                    className="h-11 rounded-full px-4 text-xs font-bold gap-1.5 shrink-0 border-[var(--border)]"
                  >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Generar</span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">
                  Cantidad de Etiquetas
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={Number.isFinite(cantidadCopias) ? cantidadCopias : ''}
                    onChange={(e) => setCantidadCopias(e.target.value === '' ? NaN : Math.max(1, Number(e.target.value) || 1))}
                    onBlur={() => { if (!Number.isFinite(cantidadCopias)) setCantidadCopias(1); }}
                    className="h-11 rounded-[var(--lf-input-radius)] text-xs bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] font-mono text-center"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[6, 24, 48].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setCantidadCopias(num)}
                        className="px-2.5 h-11 rounded-full text-xs font-bold font-mono"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Opciones de la Etiqueta (Checkboxes) */}
            <div className="border-t border-[var(--border)] pt-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Elementos Visibles en Cada Etiqueta
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text)] p-2 rounded-[var(--lf-input-radius)] hover:bg-[var(--surface)] transition-colors">
                  <input
                    type="checkbox"
                    checked={mostrarNombre}
                    onChange={(e) => setMostrarNombre(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primario)] shrink-0 focus:ring-2 focus:ring-[var(--primario)]"
                  />
                  <span>Nombre</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text)] p-2 rounded-[var(--lf-input-radius)] hover:bg-[var(--surface)] transition-colors">
                  <input
                    type="checkbox"
                    checked={mostrarPrecio}
                    onChange={(e) => setMostrarPrecio(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primario)] shrink-0 focus:ring-2 focus:ring-[var(--primario)]"
                  />
                  <span>Precio (C$)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text)] p-2 rounded-[var(--lf-input-radius)] hover:bg-[var(--surface)] transition-colors">
                  <input
                    type="checkbox"
                    checked={mostrarTienda}
                    onChange={(e) => setMostrarTienda(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primario)] shrink-0 focus:ring-2 focus:ring-[var(--primario)]"
                  />
                  <span>Comercio</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text)] p-2 rounded-[var(--lf-input-radius)] hover:bg-[var(--surface)] transition-colors">
                  <input
                    type="checkbox"
                    checked={mostrarTextoCodigo}
                    onChange={(e) => setMostrarTextoCodigo(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primario)] shrink-0 focus:ring-2 focus:ring-[var(--primario)]"
                  />
                  <span>SKU Numérico</span>
                </label>
              </div>
            </div>
            </div>

            {/* ─── VISTA PREVIA INDIVIDUAL DE ETIQUETA ─── */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Vista Previa de Etiqueta (Tamaño Real de Muestra)
              </span>
              <div className="flex justify-center p-5 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)] border border-[var(--border)]">
                <div className="w-56 p-3 bg-[var(--surface)] text-[var(--text)] rounded-[var(--lf-input-radius)] border-2 border-dashed border-[var(--border)] shadow-[var(--lf-shadow-card)] flex flex-col items-center text-center font-sans">
                  {mostrarTienda && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate max-w-full">
                      {nombreTienda}
                    </span>
                  )}
                  {mostrarNombre && (
                    <h4 className="text-xs font-bold line-clamp-1 leading-tight mt-0.5 text-[var(--text)]">
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
                    <span className="text-[11px] font-mono tracking-widest font-bold text-[var(--text)]">
                      {codigoValor}
                    </span>
                  )}

                  {mostrarPrecio && (
                    <Badge className="mt-1 rounded-full px-2 py-0.5 text-xs font-bold font-mono tracking-tight">
                      C$ {producto.precio.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="outline"
                onClick={descargarImagen}
                className="w-full sm:w-auto h-11 rounded-full px-5 text-xs font-bold gap-2 border-[var(--border)]"
              >
                <Download size={15} />
                <span>Descargar Imagen {tipoCodigo === 'qr' ? '(PNG)' : '(SVG)'}</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCerrar}
                  className="flex-1 sm:flex-initial h-11 rounded-full px-5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cerrar
                </Button>

                <Button
                  type="button"
                  onClick={ejecutarImpresion}
                  className="flex-[2] sm:flex-initial h-11 rounded-full px-6 text-xs font-bold gap-2"
                >
                  <Printer size={16} />
                  <span>Imprimir {cantidadCopias} Etiquetas</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── CONTENEDOR EXCLUSIVO PARA IMPRESIÓN DIRECTA O DESCARGA A PDF ─── */}
      {/* Solo es visible cuando se llama a window.print() gracias a @media print */}
      <div id="printable-labels-root" className="hidden print:block text-black bg-[var(--surface)]">
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
