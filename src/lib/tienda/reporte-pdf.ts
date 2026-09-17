import PDFDocument from 'pdfkit';
import type { MarcaTienda } from './reporte-marca';
import { aclararColor } from './reporte-marca';
import type { ReporteArmado } from './reporte-datos';

/**
 * Reporte PDF con la identidad de la tienda.
 *
 * Primera página con banda de marca, logo, nombre y RUC, título del reporte y chips
 * con las cifras destacadas. Las páginas siguientes repiten una cabecera compacta y el
 * encabezado de la tabla. Pie con "Generado por LogiFast" y numeración.
 */

const MARGEN = 36;
const ALTO_PIE = 34;

const dinero = (n: number) =>
  `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatear(valor: string | number, tipo: 'texto' | 'entero' | 'moneda'): string {
  if (typeof valor !== 'string' && tipo === 'moneda') return dinero(valor);
  if (typeof valor !== 'string' && tipo === 'entero') return valor.toLocaleString('es-NI');
  return String(valor);
}

function recortar(doc: PDFKit.PDFDocument, texto: string, ancho: number, fuente: string, tamano: number): string {
  let salida = texto;
  doc.font(fuente).fontSize(tamano);
  if (doc.widthOfString(salida) <= ancho) return salida;
  while (salida.length > 1 && doc.widthOfString(`${salida}…`) > ancho) {
    salida = salida.slice(0, -1);
  }
  return `${salida}…`;
}

export async function construirPdfReporte(reporte: ReporteArmado, marca: MarcaTienda): Promise<Buffer> {
  const apaisado = reporte.columnas.length > 6;

  return new Promise<Buffer>((resolver, rechazar) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: apaisado ? 'landscape' : 'portrait',
        margins: { top: MARGEN, left: MARGEN, right: MARGEN, bottom: MARGEN },
        bufferPages: true,
        info: {
          Title: `${reporte.titulo} — ${marca.nombre}`,
          Author: 'LogiFast',
          Creator: 'LogiFast',
          Subject: reporte.periodo,
        },
      });

      const trozos: Buffer[] = [];
      doc.on('data', (c) => trozos.push(c as Buffer));
      doc.on('end', () => resolver(Buffer.concat(trozos)));
      doc.on('error', rechazar);

      const anchoPagina = doc.page.width;
      const altoPagina = doc.page.height;
      const anchoUtil = anchoPagina - MARGEN * 2;
      const finUtil = altoPagina - MARGEN - ALTO_PIE;

      // ─── Cabecera completa (primera página) ───
      const ALTO_BANDA = 104;
      doc.rect(0, 0, anchoPagina, ALTO_BANDA).fill(marca.color);

      doc.image(marca.logoPng, MARGEN, 26, { width: 52, height: 52 });

      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(marca.nombre, MARGEN + 68, 30, { width: anchoUtil - 200, lineBreak: false });

      const lineaDatos = [`RUC: ${marca.ruc}`];
      if (marca.direccion) lineaDatos.push(marca.direccion);
      if (marca.telefono) lineaDatos.push(`Tel. ${marca.telefono}`);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#FFFFFF')
        .text(lineaDatos.join('   ·   '), MARGEN + 68, 54, { width: anchoUtil - 200, lineBreak: false });

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('Generado por LogiFast', anchoPagina - MARGEN - 200, 32, { width: 200, align: 'right' });
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .text(new Date().toLocaleString('es-NI'), anchoPagina - MARGEN - 200, 46, { width: 200, align: 'right' });

      let y = ALTO_BANDA + 20;

      // ─── Título y período ───
      doc.fillColor('#1C1C1E').font('Helvetica-Bold').fontSize(15).text(reporte.titulo, MARGEN, y);
      y += 20;
      doc.fillColor('#6B6B70').font('Helvetica').fontSize(9.5).text(`${reporte.periodo}   ·   ${reporte.descripcion}`, MARGEN, y);
      y += 22;

      // ─── Chips con las cifras destacadas ───
      const chips = reporte.resumen.slice(0, 4);
      if (chips.length > 0) {
        const separacion = 10;
        const anchoChip = (anchoUtil - separacion * (chips.length - 1)) / chips.length;
        const fondo = aclararColor(marca.color, 0.9);
        chips.forEach((chip, i) => {
          const x = MARGEN + i * (anchoChip + separacion);
          doc.roundedRect(x, y, anchoChip, 42, 8).fill(fondo);
          doc
            .fillColor('#6B6B70')
            .font('Helvetica')
            .fontSize(8)
            .text(chip.etiqueta.toUpperCase(), x + 10, y + 9, { width: anchoChip - 20, lineBreak: false });
          doc
            .fillColor('#1C1C1E')
            .font('Helvetica-Bold')
            .fontSize(12)
            .text(recortar(doc, chip.valor, anchoChip - 20, 'Helvetica-Bold', 12), x + 10, y + 22, {
              width: anchoChip - 20,
              lineBreak: false,
            });
        });
        y += 42 + 22;
      }

      // ─── Tabla ───
      const pesoTotal = reporte.columnas.reduce((s, c) => s + c.peso, 0);
      const anchos = reporte.columnas.map((c) => (c.peso / pesoTotal) * anchoUtil);
      const xColumnas: number[] = [];
      let acumulado = MARGEN;
      for (const ancho of anchos) {
        xColumnas.push(acumulado);
        acumulado += ancho;
      }

      const ALTO_FILA = 17;

      const dibujarEncabezadoTabla = (yEncabezado: number) => {
        doc.rect(MARGEN, yEncabezado, anchoUtil, ALTO_FILA).fill(marca.color);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF');
        reporte.columnas.forEach((col, i) => {
          const esNumero = col.tipo !== 'texto';
          const texto = recortar(doc, col.titulo, anchos[i] - 10, 'Helvetica-Bold', 8.5);
          doc.text(texto, xColumnas[i] + 5, yEncabezado + 5, {
            width: anchos[i] - 10,
            align: esNumero ? 'right' : 'left',
            lineBreak: false,
          });
        });
        return yEncabezado + ALTO_FILA;
      };

      const dibujarCabeceraCompacta = () => {
        doc.rect(0, 0, anchoPagina, 46).fill(marca.color);
        doc.image(marca.logoPng, MARGEN, 8, { width: 30, height: 30 });
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(marca.nombre, MARGEN + 40, 12, { width: anchoUtil - 320, lineBreak: false });
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica')
          .fontSize(8.5)
          .text(`${reporte.titulo}   ·   ${reporte.periodo}`, MARGEN + 40, 27, { width: anchoUtil - 60, lineBreak: false });
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text('Generado por LogiFast', anchoPagina - MARGEN - 200, 18, { width: 200, align: 'right' });
        return 46 + 14;
      };

      y = dibujarEncabezadoTabla(y);

      let filasEnPagina = 0;
      const filasTotales: (string | number | null)[] = [...reporte.totales];

      const dibujarFila = (valores: (string | number | null)[], indice: number, esTotal = false) => {
        if (y + ALTO_FILA > finUtil) {
          doc.addPage();
          y = dibujarCabeceraCompacta();
          y = dibujarEncabezadoTabla(y);
          filasEnPagina = 0;
        }
        if (esTotal) {
          doc.rect(MARGEN, y, anchoUtil, ALTO_FILA).fill(aclararColor(marca.color, 0.82));
        } else if (indice % 2 === 1) {
          doc.rect(MARGEN, y, anchoUtil, ALTO_FILA).fill('#F7F7F9');
        }

        doc.font(esTotal ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor('#1C1C1E');
        valores.forEach((valor, i) => {
          if (valor === null || valor === undefined) return;
          const col = reporte.columnas[i];
          const texto = formatear(valor as string | number, col.tipo);
          const recortado = recortar(doc, texto, anchos[i] - 10, esTotal ? 'Helvetica-Bold' : 'Helvetica', 8.5);
          doc.text(recortado, xColumnas[i] + 5, y + 5, {
            width: anchos[i] - 10,
            align: col.tipo === 'texto' ? 'left' : 'right',
            lineBreak: false,
          });
        });
        // Línea inferior sutil
        doc
          .moveTo(MARGEN, y + ALTO_FILA)
          .lineTo(MARGEN + anchoUtil, y + ALTO_FILA)
          .lineWidth(0.4)
          .strokeColor('#D9D9DE')
          .stroke();
        y += ALTO_FILA;
        filasEnPagina++;
      };

      reporte.filas.forEach((fila, i) => dibujarFila(fila, i));
      if (reporte.filas.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#6B6B70').text('Sin datos en este período.', MARGEN + 5, y + 6);
        y += 24;
      }
      dibujarFila(filasTotales, 0, true);

      // ─── Notas ───
      if (reporte.notas.length > 0) {
        y += 14;
        if (y + 14 * reporte.notas.length > finUtil) {
          doc.addPage();
          y = dibujarCabeceraCompacta();
        }
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#6B6B70').text('Notas', MARGEN, y);
        y += 12;
        reporte.notas.forEach((nota) => {
          doc.font('Helvetica').fontSize(8).fillColor('#6B6B70').text(`• ${nota}`, MARGEN + 4, y, { width: anchoUtil - 8 });
          y += 11;
        });
      }

      // ─── Pie en todas las páginas ───
      const rango = doc.bufferedPageRange();
      for (let i = 0; i < rango.count; i++) {
        doc.switchToPage(rango.start + i);
        const yPie = altoPagina - MARGEN - 12;
        doc
          .moveTo(MARGEN, yPie - 6)
          .lineTo(anchoPagina - MARGEN, yPie - 6)
          .lineWidth(0.5)
          .strokeColor('#D9D9DE')
          .stroke();
        doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#6B6B70');
        doc.text(`Generado por LogiFast para ${marca.nombre}`, MARGEN, yPie, { width: anchoUtil - 120, lineBreak: false });
        doc.font('Helvetica').fontSize(7.5).fillColor('#6B6B70');
        doc.text(`Página ${i + 1} de ${rango.count}`, anchoPagina - MARGEN - 120, yPie, {
          width: 120,
          align: 'right',
          lineBreak: false,
        });
      }

      doc.end();
    } catch (err) {
      rechazar(err as Error);
    }
  });
}
