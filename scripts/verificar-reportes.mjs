/**
 * verificar-reportes.mjs — valida los archivos generados por los reportes de tienda.
 *
 * Lee el XLSX de vuelta con ExcelJS (hoja, dimensiones, celdas, imágenes incrustadas)
 * e imprime el resultado. Los PDF se validan aparte con `pdftotext` (poppler), que es
 * un lector independiente: si extrae el texto, el archivo es un PDF real.
 *
 * Uso: node scripts/verificar-reportes.mjs /tmp/rep-ventas.xlsx /tmp/rep-inventario.xlsx
 */
import ExcelJS from 'exceljs';
import { statSync } from 'node:fs';

const archivos = process.argv.slice(2);
if (archivos.length === 0) {
  console.error('Pasa al menos un archivo .xlsx');
  process.exit(1);
}

let fallos = 0;

for (const ruta of archivos) {
  const kb = (statSync(ruta).size / 1024).toFixed(1);
  console.log(`\n── ${ruta} (${kb} KB)`);
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(ruta);

    console.log(`  creador: ${wb.creator} | empresa: ${wb.company}`);
    console.log(`  hojas: ${wb.worksheets.map((h) => h.name).join(', ')}`);

    for (const hoja of wb.worksheets) {
      console.log(`  · ${hoja.name}: filas=${hoja.rowCount} columnas=${hoja.columnCount}`);

      const nombre = hoja.getCell('B1').value;
      console.log(`    B1 (nombre tienda): ${JSON.stringify(nombre)}`);
      const periodo = hoja.getCell(3, 1).value;
      console.log(`    fila resumen: ${JSON.stringify(periodo)}`);

      // Encabezado de tabla: primera celda con relleno del color de marca
      const filaEnc = hoja.getRow(7);
      const titulos = [];
      filaEnc.eachCell((c) => titulos.push(c.value));
      console.log(`    encabezados: ${titulos.slice(0, 5).join(' | ')}`);

      const primeraDato = hoja.getRow(8).values;
      console.log(`    primera fila de datos: ${JSON.stringify((primeraDato || []).slice(1, 5))}`);

      // Total: debe ser un número (fórmula SUM con resultado cacheado)
      const filaTotales = hoja.rowCount;
      const celdaTotal = hoja.getRow(filaTotales).values;
      console.log(`    última fila (notas/totales): ${JSON.stringify((celdaTotal || []).slice(1, 4))}`);

      const imagenes = hoja.getImages();
      console.log(`    imágenes incrustadas: ${imagenes.length}${imagenes.length ? ` (ext=${imagenes[0].extension})` : ''}`);
      if (imagenes.length === 0) {
        console.log('    ⚠️  sin logo incrustado');
        fallos++;
      }
    }
  } catch (err) {
    console.log(`  ❌ no se pudo leer: ${err.message}`);
    fallos++;
  }
}

console.log(`\n${fallos === 0 ? '✅ XLSX válidos' : `❌ ${fallos} problema(s)`}`);
process.exit(fallos === 0 ? 0 : 1);
