import ExcelJS from 'exceljs';
import type { MarcaTienda } from './reporte-marca';
import { aclararColor } from './reporte-marca';
import type { ReporteArmado } from './reporte-datos';

/**
 * Reporte XLSX con la identidad de la tienda.
 *
 * Estructura de la hoja:
 *   1-3  banda con el color de la tienda, logo y nombre + RUC
 *   5    título del reporte y período
 *   6    cifras destacadas
 *   7    encabezado de la tabla (se repite al imprimir, con autofiltro)
 *   8+   datos, con totales por suma al final y notas al pie
 */

const FORMATO_MONEDA = '"C$" #,##0.00';
const FORMATO_ENTERO = '#,##0';
const BORDE = { style: 'thin' as const, color: { argb: 'FFD9D9DE' } };

const COLORES = {
  texto: 'FF1C1C1E',
  textoSuave: 'FF6B6B70',
  zebra: 'FFF7F7F9',
  borde: 'FFD9D9DE',
};

function argb(hex: string): string {
  return `FF${hex.replace('#', '').toUpperCase()}`;
}

export async function construirXlsxReporte(reporte: ReporteArmado, marca: MarcaTienda): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'LogiFast';
  wb.lastModifiedBy = 'LogiFast';
  wb.company = 'LogiFast';
  wb.created = new Date();
  // Que Excel recalcule los totales al abrir, sin que el usuario tenga que tocar nada.
  wb.calcProperties.fullCalcOnLoad = true;

  const nCols = reporte.columnas.length;
  const hoja = wb.addWorksheet(reporte.tipo.toUpperCase(), {
    pageSetup: {
      paperSize: 9, // A4
      orientation: nCols > 6 ? 'landscape' : 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    views: [{ state: 'frozen', ySplit: 7 }],
    properties: { defaultRowHeight: 16 },
  });

  reporte.columnas.forEach((col, i) => {
    hoja.getColumn(i + 1).width = Math.max(9, Math.round(col.peso * 11));
  });

  const FILA_BANDA_FIN = 3;
  const FILA_TITULO = 5;
  const FILA_RESUMEN = 6;
  const FILA_ENCABEZADO = 7;
  const FILA_DATOS = FILA_ENCABEZADO + 1;

  // ─── Banda de identidad ───
  const colorBanda = argb(marca.color);
  for (let fila = 1; fila <= FILA_BANDA_FIN; fila++) {
    for (let col = 1; col <= nCols; col++) {
      hoja.getCell(fila, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorBanda } };
    }
  }

  // La primera columna queda libre para el logo (ancho de una columna de datos).
  hoja.mergeCells(1, 2, 1, nCols);
  const celdaNombre = hoja.getCell(1, 2);
  celdaNombre.value = marca.nombre;
  celdaNombre.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  celdaNombre.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  hoja.mergeCells(2, 2, FILA_BANDA_FIN, nCols);
  const celdaDatos = hoja.getCell(2, 2);
  const partes = [`RUC: ${marca.ruc}`];
  if (marca.direccion) partes.push(marca.direccion);
  if (marca.telefono) partes.push(`Tel. ${marca.telefono}`);
  celdaDatos.value = partes.join('   ·   ');
  celdaDatos.font = { name: 'Calibri', size: 9.5, color: { argb: 'E8FFFFFF' } };
  celdaDatos.alignment = { vertical: 'top', horizontal: 'left', indent: 1, wrapText: false };

  for (let fila = 1; fila <= FILA_BANDA_FIN; fila++) hoja.getRow(fila).height = fila === 1 ? 22 : 14;

  // Logo: si la tienda subió uno se usa el suyo; si no, el que genera LogiFast con
  // el color y las iniciales de la tienda.
  const idLogo = wb.addImage({ base64: marca.logoPng.toString('base64'), extension: 'png' });
  hoja.addImage(idLogo, {
    tl: { col: 0.12, row: 0.18 },
    ext: { width: 58, height: 58 },
    editAs: 'oneCell',
  });

  // ─── Título del reporte ───
  const valorTitulo = `${reporte.titulo} — ${marca.nombre}`;
  hoja.getCell(FILA_TITULO, 1).value = valorTitulo;
  hoja.getCell(FILA_TITULO, 1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: COLORES.texto } };
  const colPeriodo = Math.max(2, nCols - 2);
  hoja.mergeCells(FILA_TITULO, colPeriodo, FILA_TITULO, nCols);
  const celdaPeriodo = hoja.getCell(FILA_TITULO, colPeriodo);
  celdaPeriodo.value = `${reporte.periodo}   ·   Generado por LogiFast el ${new Date().toLocaleString('es-NI')}`;
  celdaPeriodo.font = { name: 'Calibri', size: 9, color: { argb: COLORES.textoSuave } };
  celdaPeriodo.alignment = { horizontal: 'right' };

  // ─── Cifras destacadas ───
  hoja.getCell(FILA_RESUMEN, 1).value = reporte.resumen.map((r) => `${r.etiqueta}: ${r.valor}`).join('      ·      ');
  hoja.mergeCells(FILA_RESUMEN, 1, FILA_RESUMEN, nCols);
  hoja.getCell(FILA_RESUMEN, 1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: argb(aclararColorDark(marca.color)) } };
  hoja.getCell(FILA_RESUMEN, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(aclararColor(marca.color, 0.88)) } };
  hoja.getCell(FILA_RESUMEN, 1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  hoja.getRow(FILA_RESUMEN).height = 20;

  // ─── Encabezado de tabla ───
  const filaEnc = hoja.getRow(FILA_ENCABEZADO);
  reporte.columnas.forEach((col, i) => {
    const celda = filaEnc.getCell(i + 1);
    celda.value = col.titulo;
    celda.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorBanda } };
    celda.alignment = { vertical: 'middle', horizontal: col.tipo === 'texto' ? 'left' : 'right', indent: col.tipo === 'texto' ? 1 : 0 };
    celda.border = { top: BORDE, left: BORDE, right: BORDE, bottom: BORDE };
  });
  filaEnc.height = 20;

  // ─── Datos ───
  reporte.filas.forEach((fila, indice) => {
    const filaExcel = hoja.getRow(FILA_DATOS + indice);
    fila.forEach((valor, i) => {
      const columna = reporte.columnas[i];
      const celda = filaExcel.getCell(i + 1);
      celda.value = valor as ExcelJS.CellValue;
      celda.font = { name: 'Calibri', size: 10, color: { argb: COLORES.texto } };
      celda.border = { top: BORDE, left: BORDE, right: BORDE, bottom: BORDE };
      if (columna.tipo === 'moneda') {
        celda.numFmt = FORMATO_MONEDA;
        celda.alignment = { horizontal: 'right' };
      } else if (columna.tipo === 'entero') {
        celda.numFmt = FORMATO_ENTERO;
        celda.alignment = { horizontal: 'right' };
      } else {
        celda.alignment = { horizontal: 'left', indent: 1 };
      }
      if (indice % 2 === 1) {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.zebra } };
      }
    });
  });

  const ultimaFilaDatos = FILA_DATOS + Math.max(0, reporte.filas.length - 1);

  // ─── Totales (suma real, editable en Excel) ───
  const filaTotales = ultimaFilaDatos + 1;
  reporte.totales.forEach((valor, i) => {
    const columna = reporte.columnas[i];
    const celda = hoja.getCell(filaTotales, i + 1);
    if (typeof valor === 'number' && columna.tipo !== 'texto' && reporte.filas.length > 0) {
      const letra = hoja.getColumn(i + 1).letter;
      celda.value = {
        formula: `SUM(${letra}${FILA_DATOS}:${letra}${ultimaFilaDatos})`,
        result: valor,
      } as ExcelJS.CellValue;
      celda.numFmt = columna.tipo === 'moneda' ? FORMATO_MONEDA : FORMATO_ENTERO;
    } else {
      celda.value = valor as ExcelJS.CellValue;
    }
    celda.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORES.texto } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(aclararColor(marca.color, 0.82)) } };
    celda.border = { top: { style: 'medium', color: { argb: colorBanda } }, left: BORDE, right: BORDE, bottom: BORDE };
    if (i > 0 && typeof valor === 'number') celda.alignment = { horizontal: 'right' };
  });
  hoja.getRow(filaTotales).height = 18;

  // ─── Notas al pie ───
  reporte.notas.forEach((nota, i) => {
    const fila = filaTotales + 2 + i;
    hoja.getCell(fila, 1).value = `• ${nota}`;
    hoja.mergeCells(fila, 1, fila, nCols);
    hoja.getCell(fila, 1).font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: COLORES.textoSuave } };
    hoja.getCell(fila, 1).alignment = { horizontal: 'left', indent: 1 };
  });

  hoja.getCell(filaTotales + 2 + reporte.notas.length + 1, 1).value =
    `Documento generado automáticamente por LogiFast para ${marca.nombre}.`;
  hoja.getCell(filaTotales + 2 + reporte.notas.length + 1, 1).font = {
    name: 'Calibri',
    size: 8.5,
    color: { argb: COLORES.textoSuave },
  };

  // ─── Impresión ───
  hoja.autoFilter = { from: { row: FILA_ENCABEZADO, column: 1 }, to: { row: FILA_ENCABEZADO, column: nCols } };
  hoja.pageSetup.printTitlesRow = `${FILA_ENCABEZADO}:${FILA_ENCABEZADO}`;
  hoja.headerFooter = {
    oddFooter: `&L&"Calibri,Italic"&8Generado por LogiFast&R&"Calibri,Regular"&8Página &P de &N`,
    oddHeader: '',
  };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Oscurece un color para texto sobre fondos claros (mantiene contraste). */
function aclararColorDark(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const oscurecer = (c: number) => Math.round(c * 0.55);
  const r = oscurecer((n >> 16) & 255);
  const g = oscurecer((n >> 8) & 255);
  const b = oscurecer(n & 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
