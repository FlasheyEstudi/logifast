import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const ANCHO = 226; // 80mm térmico

const dinero = (n: number) =>
  `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function linea(
  doc: PDFKit.PDFDocument,
  texto: string,
  opts: { bold?: boolean; centro?: boolean; tamano?: number; gris?: boolean } = {}
) {
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
 * GET /api/cliente/facturas/compra/[id]/pdf
 * Factura térmica de una COMPRA del marketplace que se cerró antes de que existiera
 * el comprobante `VentaPOS` (histórico). Las compras nuevas ya salen con su
 * `VentaPOS` y usan `/api/tienda/facturas/[id]/pdf`.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });

  const { id } = await params;
  const compra = await db.ordenCompra.findUnique({
    where: { id },
    include: { items: true, tienda: { select: { nombre: true, direccion: true, telefono: true } } },
  });

  if (!compra || compra.clienteId !== user.id) {
    return new NextResponse('Factura no encontrada', { status: 404 });
  }

  const doc = new PDFDocument({ size: [ANCHO, 620], margin: 12 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const fin = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(chunks))));

  linea(doc, (compra.tienda?.nombre ?? 'TIENDA').toUpperCase(), { bold: true, centro: true, tamano: 13 });
  if (compra.tienda?.direccion) linea(doc, compra.tienda.direccion, { centro: true, gris: true });
  separador(doc);
  linea(doc, 'FACTURA DE COMPRA', { bold: true, centro: true, tamano: 12 });
  if (compra.codigoPin) linea(doc, `PIN: ${compra.codigoPin}`, { bold: true, centro: true, tamano: 11 });
  linea(
    doc,
    `Fecha: ${compra.createdAt.toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' })}`,
    { centro: true, gris: true }
  );
  separador(doc);

  for (const it of compra.items) {
    linea(doc, `${it.cantidad}x ${it.nombreProducto}`, { tamano: 9 });
    linea(doc, `    ${dinero(it.cantidad * it.precioUnitario)}`, { gris: true, tamano: 9 });
  }
  separador(doc);

  linea(doc, `Subtotal   ${dinero(compra.subtotal)}`, { gris: true });
  if (compra.descuento > 0) linea(doc, `Descuento  -${dinero(compra.descuento)}`, { gris: true });
  linea(doc, `Envio      ${dinero(compra.costoEnvio)}`, { gris: true });
  linea(doc, `TOTAL   ${dinero(compra.total)}`, { bold: true, tamano: 13 });
  linea(
    doc,
    `Pago: ${compra.metodoPago === 'efectivo' ? 'Efectivo' : compra.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}`,
    { gris: true }
  );
  separador(doc);
  linea(doc, compra.modoEntrega === 'retiro' ? 'Retiro en tienda' : `Entrega: ${compra.direccionEntrega}`, {
    gris: true,
    tamano: 9,
  });
  separador(doc);
  linea(doc, '¡Gracias por tu compra!', { centro: true, bold: true });
  linea(doc, 'Conservar esta factura para reclamos.', { centro: true, gris: true, tamano: 8 });

  doc.end();
  const buf = await fin;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="factura-compra-${compra.id.slice(-8)}.pdf"`,
    },
  });
}
