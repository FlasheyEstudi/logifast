import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { buscarTiendaCompleta } from '@/lib/auth/tienda-acceso';

export const dynamic = 'force-dynamic';

const ANCHO = 226; // 80mm térmico

const dinero = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function linea(doc: PDFKit.PDFDocument, texto: string, opts: { bold?: boolean; centro?: boolean; tamano?: number; gris?: boolean } = {}) {
  const { bold = false, centro = false, tamano = 10, gris = false } = opts;
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(tamano).fillColor(gris ? '#555555' : '#000000');
  if (centro) doc.text(texto, { align: 'center', width: ANCHO - 24, lineGap: 2 });
  else doc.text(texto, { width: ANCHO - 24, lineGap: 2 });
}

function separador(doc: PDFKit.PDFDocument) {
  doc.moveDown(0.4);
  doc.moveTo(12, doc.y).lineTo(ANCHO - 12, doc.y).dash(2, { space: 2 }).stroke();
  doc.undash();
  doc.moveDown(0.4);
}

/**
 * GET /api/tienda/facturas/[id]/pdf — factura térmica (80mm) de una venta POS de la tienda.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });

  const tienda = await buscarTiendaCompleta(user);
  if (!tienda) return new NextResponse('Tienda no encontrada', { status: 404 });

  const { id } = await params;
  const venta = await db.ventaPOS.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!venta || venta.tiendaId !== tienda.id) {
    return new NextResponse('Factura no encontrada', { status: 404 });
  }

  const doc = new PDFDocument({ size: [ANCHO, 600], margin: 12 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const fin = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(chunks))));

  linea(doc, tienda.nombre.toUpperCase(), { bold: true, centro: true, tamano: 13 });
  linea(doc, `${tienda.direccion}`, { centro: true, gris: true });
  if (tienda.telefono) linea(doc, `Tel: ${tienda.telefono}`, { centro: true, gris: true });
  separador(doc);
  linea(doc, `FACTURA ${venta.numeroComprobante}`, { bold: true, centro: true, tamano: 12 });
  if (venta.codigoPin) linea(doc, `PIN: ${venta.codigoPin}`, { bold: true, centro: true, tamano: 11 });
  linea(doc, `Fecha: ${venta.createdAt.toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' })}`, { centro: true, gris: true });
  linea(doc, `Cliente: ${venta.clienteNombre || 'Cliente General'}`, { centro: true });
  separador(doc);

  for (const it of venta.items) {
    doc.font('Helvetica').fontSize(9.5).fillColor('#000000');
    doc.text(`${it.cantidad}x ${it.nombreProducto}`, { width: ANCHO - 24 });
    doc.font('Helvetica-Bold');
    doc.text(dinero(it.subtotal), { width: ANCHO - 24, align: 'right', lineGap: 0 });
    doc.moveDown(0.2);
  }
  separador(doc);
  linea(doc, `Subtotal   ${dinero(venta.subtotal)}`, { bold: true });
  if (venta.descuento > 0) linea(doc, `Descuento  -${dinero(venta.descuento)}`, { gris: true });
  linea(doc, `TOTAL      ${dinero(venta.total)}`, { bold: true, tamano: 13 });
  linea(doc, `Pago: ${venta.metodoPago === 'efectivo' ? 'Efectivo' : venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}`, { gris: true });
  if (venta.montoRecibido > 0) linea(doc, `Recibido   ${dinero(venta.montoRecibido)}`, { gris: true });
  if (venta.cambioDado > 0) linea(doc, `Cambio     ${dinero(venta.cambioDado)}`, { gris: true });
  separador(doc);
  linea(doc, '¡Gracias por su compra!', { centro: true, bold: true });
  linea(doc, 'Conservar esta factura para reclamos.', { centro: true, gris: true, tamano: 8 });

  doc.end();
  const buf = await fin;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="factura-${venta.numeroComprobante}.pdf"`,
    },
  });
}
